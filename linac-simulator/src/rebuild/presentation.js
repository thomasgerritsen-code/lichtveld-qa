import {HEAD} from './model.js';
export const DISPLAY_SCALE=300;
export const FIELD_PIXELS_PER_CM=4;
export function transportProjection(sim,plane='r'){
 const samples=sim.strike?sim.rows.slice(0,sim.strike.index+1):sim.rows;
 const sigma=plane==='r'?'sigmaR':'sigmaT';
 return samples.map((p,i)=>{
  const a=sim.rows[Math.max(0,i-1)],b=sim.rows[Math.min(sim.rows.length-1,i+1)];
  const L=Math.hypot(b.x-a.x,b.y-a.y)||1,nx=-(b.y-a.y)/L,ny=(b.x-a.x)/L;
  const offset=p[plane]*DISPLAY_SCALE,width=2*p[sigma]*DISPLAY_SCALE;
  return {s:p.s,center:{x:p.x+nx*offset,y:p.y+ny*offset},upper:{x:p.x+nx*(offset+width),y:p.y+ny*(offset+width)},lower:{x:p.x+nx*(offset-width),y:p.y+ny*(offset-width)},width};
 });
}
export function fieldProjection(state){
 const sourceY=state.mode==='electron'?HEAD.window:HEAD.target;
 const halfX=state.fieldX*FIELD_PIXELS_PER_CM/2,halfY=state.fieldY*FIELD_PIXELS_PER_CM/2;
 const at=(half,y)=>half*(y-sourceY)/(HEAD.patient-sourceY);
 return {sourceY,halfX,halfY,mlcHalfX:state.mode==='electron'?100:at(halfX,HEAD.mlc+35),jawHalfY:state.mode==='electron'?100:at(halfY,HEAD.jaws+17),applicatorTopX:at(halfX,828),applicatorBottomX:at(halfX,907)};
}
export function beamEyeProjection(state){
 const scale=3.5,halfX=state.fieldX*scale/2,halfY=state.fieldY*scale/2;
 return {scale,halfX,halfY,mlcHalfX:state.mode==='electron'?130:halfX,jawHalfY:state.mode==='electron'?70:halfY,rows:Array.from({length:80},(_,index)=>({index,y:55+index*140/80,height:1.5}))};
}
export function spotProjection(sim){
 // R and T are the local transverse transport coordinates, not IEC patient axes.
 return {r:sim.target.r*DISPLAY_SCALE*4,t:sim.target.t*DISPLAY_SCALE*4,rx:sim.target.sigmaT*DISPLAY_SCALE*8,ry:sim.target.sigmaR*DISPLAY_SCALE*8,intercepted:Boolean(sim.strike)};
}
export function intensity(sim,state){return sim.sourceActive?state.emission:0;}

export const CONTROL_EFFECTS={
 f1:'Focus 1: de ±2σ-band verandert vanaf de eerste spoel. Meer sterkte kan ook overfocus geven; de bundel wordt niet altijd smaller.',
 f2:'Focus 2: focusering en R/T-rotatie vanaf de tweede spoel. Bij een gestuurde bundel kunnen ook positie en hoek veranderen.',
 r1:'1R: radiale sturing vanaf de primaire stuurset. De volgende focusspoel koppelt dit ook naar T.',
 t1:'1T: transverse sturing vanaf de primaire stuurset. Volg T in de targetdoorsnede en de bundeloptiek; de machinezijaanblik blijft R.',
 r2:'2R: radiale sturing vanaf de secundaire stuurset. Alles vóór die spoel blijft gelijk.',
 t2:'2T: transverse sturing vanaf de secundaire stuurset. Volg dit effect in de R/T-targetdoorsnede en in Bundeloptiek.',
 bendStrength:'Buigveld: verandert de gemeenschappelijke veldsterkte van M1–M3. De referentiebaan wordt hersteld wanneer de relatieve verhouding B/p weer één is.',
 momentumSpread:'Momentumspeiding: de centrale baan blijft gelijk, maar de energiecomponenten lopen uiteen in de buigmagneten. De ±2σ-band bevat die extra spreiding.',
 momentum:'Momentum: verandert de magnetische rigiditeit. Afwijkingen ontstaan geleidelijk binnen de buigmagneten; ook de focuswerking hangt van momentum af.',
 emission:'Bronsterkte bij vast momentum: verandert intensiteit en relatieve uitvoer. Echte RF-beam-loading is hier niet mee gesimuleerd. Bij nul is de bron uit.',
 fieldX:'Veld X: verandert uitsluitend de X-veldbreedte. Bij fotonen bewegen de MLC-bladeren; bij elektronen de schematische applicatoropening.',
 fieldY:'Veld Y: verandert uitsluitend de Y-veldhoogte in het bundelaanzicht. Bij fotonen bewegen de diafragma’s; bij elektronen de applicatoropening.'
};

export function dispersionProjections(sim){
 const visible=sim.strike?sim.rows.slice(0,sim.strike.index+1):sim.rows;
 const first=visible.findIndex(p=>Math.abs(p.dispersion?.[0]??0)>1e-10);
 if(first<0||!visible[0]?.sigmaDelta)return [];
 return [-1,1].map(sign=>transportProjection({...sim,strike:null,rows:visible.map(p=>({...p,r:p.r+sign*p.dispersion[0]*p.sigmaDelta}))}).slice(Math.max(0,first-1)).map(p=>p.center));
}
export function headOutline(state,sim){
 const field=fieldProjection(state),x=sim.geometry.headX,apex=x-sim.target.r*DISPLAY_SCALE;
 if(state.mode==='photon')return [{x:apex,y:HEAD.target+7},{x:x-field.halfX,y:HEAD.patient},{x:x+field.halfX,y:HEAD.patient}];
 const pencil=Math.max(1,sim.target.sigmaR*DISPLAY_SCALE*2);
 // Qualitative widening after the first foil, shaped at the second foil.
 // Width here is an illustration linked to the field, not a scattering fit.
 const broad=Math.max(pencil,field.halfX*.4);
 const side=sign=>[{x:apex+sign*pencil,y:HEAD.window},{x:apex+sign*pencil,y:HEAD.primaryFoil},{x:x+sign*broad,y:HEAD.secondaryFoil},{x:x+sign*field.applicatorTopX,y:828},{x:x+sign*field.applicatorBottomX,y:907},{x:x+sign*field.halfX,y:HEAD.patient}];
 return [...side(-1),...side(1).reverse()];
}

export function profileIllustration(state){
 // Canonical explanatory shapes, not fitted transport or dose calculations.
 return Array.from({length:121},(_,i)=>{
  const u=-1.25+i*2.5/120,edge=Math.abs(u)<=1?1:0;
  const shape=state.mode==='photon'&&state.filter==='fff'?Math.exp(-u*u):1;
  return {u,y:edge*shape};
 });
}
