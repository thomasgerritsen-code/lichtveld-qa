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
 momentum:'Momentum: verandert de magnetische rigiditeit. Afwijkingen ontstaan geleidelijk binnen de buigmagneten; ook de focuswerking hangt van momentum af.',
 emission:'Bronsterkte: verandert alleen de intensiteit en relatieve uitvoer, niet de baan of de bundelbreedte. Bij nul is de bron uit.',
 fieldX:'Veld X: verandert uitsluitend de X-veldbreedte. Bij fotonen bewegen de MLC-bladeren; bij elektronen de schematische applicatoropening.',
 fieldY:'Veld Y: verandert uitsluitend de Y-veldhoogte in het bundelaanzicht. Bij fotonen bewegen de diafragma’s; bij elektronen de applicatoropening.'
};
