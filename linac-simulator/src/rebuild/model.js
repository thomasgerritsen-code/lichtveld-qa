// Rebuilt educational model. All lengths/strengths below are normalized,
// not OEM dimensions, service settings, calibrated apertures or dose values.
export const SOLENOID_LENGTH=.42;
export const UNIT_PX=150;
export const APERTURES=Object.freeze({tube:.065,target:.04});
export const DEFAULTS=Object.freeze({power:true,beam:false,mode:'photon',filter:'ff',f1:.6,f2:.62,r1:0,t1:0,r2:0,t2:0,momentum:1,fieldX:10,fieldY:10,emission:1});
export const COMPONENTS=Object.freeze([
 {id:'gun',label:'Elektronenbron',kind:'source',x:95,y:535,description:'De verhitte kathode levert elektronen; het rooster regelt de injectie. De bron ligt op de as van de vacuümbuis.'},
 {id:'focus1',label:'Focus 1',kind:'solenoid',x:245,description:'Een solenoïde focust de bundel en koppelt de twee dwarse richtingen door Larmorrotatie.'},
 {id:'steer1',label:'1R / 1T',kind:'steering',x:325,description:'De primaire, loodrechte stuurspoelparen centreren de geïnjecteerde elektronenbundel.'},
 {id:'focus2',label:'Focus 2',kind:'solenoid',x:410,description:'Tweede solenoïde vóór de secundaire stuurset. Ook hier veranderen positie, hoek en bundelcovariantie samen.'},
 {id:'steer2',label:'2R / 2T',kind:'steering',x:495,description:'Secundaire stuurspoelen ongeveer halverwege de versnellingsbuis richten de bundel uit naar buigsectie en target.'},
 {id:'bendEntry',label:'Bellows / vacuüm',kind:'junction',x:805,y:240,description:'De vacuümovergang verbindt de versnellingsbuis met de flight tube. Echte modusselectie verplaatst de flight tube; deze referentiedoorsnede reconstrueert die mechanica niet.'},
 {id:'m1',label:'M1 · 45°',kind:'bend',angle:45,description:'Eerste sector van het Elekta-slalomtransport.'},
 {id:'m2',label:'M2 · −45°',kind:'bend',angle:-45,description:'Tegengesteld buigende tweede sector. Geometrie en eerste-orde sectortransport gebruiken dezelfde hoek.'},
 {id:'m3',label:'M3 · 112,5°',kind:'bend',angle:112.5,description:'Laatste sector brengt de elektronen naar de behandelkop. De complete achromatische machine-optiek vereist ook OEM-randvelden en afstemming; dit model claimt die niet.'},
 {id:'target',label:'Target / venster',kind:'head',description:'Fotonen: elektronen raken de target en produceren remstraling. Elektronen: een dun uittredevenster staat in de route.'},
 {id:'primary',label:'Primaire collimator',kind:'head',description:'Het absorberlichaam begrenst de bundel. Het blijft aanwezig bij beide stralingsmodi; de poortselectie is schematisch.'},
 {id:'filter',label:'Filter / folies',kind:'head',description:'FF: conische flattening filter. FFF: een dunne plaat als Elekta-referentie. Elektronen: een primaire folie vóór de primaire collimator en een secundaire folie erna.'},
 {id:'monitor',label:'Monitorkamers',kind:'head',description:'Twee onafhankelijke dosismonitors en een derde kwaliteitskamer. De zeven elektrode-indicatoren liggen in één kwaliteitslaag.'},
 {id:'mlc',label:'Agility MLC',kind:'head',description:'Twee banken met elk 80 bladeren. Het bundelaanzicht toont alle 160 bladeren; de zijdoorsnede toont twee representatieve bladprofielen.'},
 {id:'jaws',label:'Y-diafragma’s',kind:'head',description:'De diafragma’s bewegen loodrecht op de MLC-bladbeweging. Bij elektronen blijven de collimatoren aanwezig; de MLC staat geparkeerd.'},
 {id:'patient',label:'Patiëntvlak',kind:'patient',description:'Schematisch projectievlak. Er wordt geen patiëntdosis of behandelplan berekend.'}
]);
export const HEAD=Object.freeze({target:480,window:485,primaryFoil:503,primaryTop:516,primaryBottom:560,filter:583,secondaryFoil:615,monitor:[647,661,675],backscatter:687,mirror:711,mlc:752,jaws:802,applicator:845,patient:940});
export const SOURCES=[
 ['IAEA · basisarchitectuur','https://www-pub.iaea.org/MTCD/Publications/PDF/Pub1196_web.pdf'],
 ['AAPM · SL25-buigsectie en modusselectie','https://www.aapm.org/meetings/02Am/pdf/8280-44071.pdf'],
 ['Van Appeldoorn · focus en steering','https://aapm.onlinelibrary.wiley.com/doi/full/10.1002/acm2.13047'],
 ['Ohira · Agility-kop en 160 bladeren','https://pmc.ncbi.nlm.nih.gov/articles/PMC7652464/'],
 ['Cashmore · Elekta FFF-plaat','https://pmc.ncbi.nlm.nih.gov/articles/PMC5874110/'],
 ['Elekta · monitorkamers','https://www.elekta.com/company/newsroom/videos/how-the-linear-accelerator-works-ff4ecjuoqeat1mh6ievmrg/']
];
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const mul=(a,b)=>a.map(row=>b[0].map((_,j)=>row.reduce((v,x,k)=>v+x*b[k][j],0)));
export const transpose=a=>a[0].map((_,j)=>a.map(row=>row[j]));
export const vector=(a,v)=>a.map(row=>row.reduce((s,x,i)=>s+x*v[i],0));
export const drift=L=>[[1,L,0,0],[0,1,0,0],[0,0,1,L],[0,0,0,1]];
export function solenoid(k,L){
 if(Math.abs(k)<1e-9)return drift(L);
 const c=Math.cos(k*L),s=Math.sin(k*L);
 return [[c*c,s*c/k,s*c,s*s/k],[-k*s*c,c*c,-k*s*s,s*c],[-s*c,-s*s/k,c*c,s*c/k],[k*s*s,-s*c,-k*s*c,c*c]];
}
export function sector(theta,rho){
 if(Math.abs(theta)<1e-12)return drift(0);
 const c=Math.cos(theta),s=Math.sin(theta),L=Math.abs(theta)*rho;
 // Signed curvature, positive physical path length.
 const h=Math.sign(theta)/rho;
 return [[c,s/h,0,0],[-h*s,c,0,0],[0,0,1,L],[0,0,0,1]];
}
const radians=d=>d*Math.PI/180;
const guideY=x=>535+(x-95)*Math.tan(radians(-22.5));
export function machineGeometry(){
 const stations=COMPONENTS.filter(c=>['source','solenoid','steering','junction'].includes(c.kind)).map(c=>({...c,y:c.y??guideY(c.x)}));
 // Join the waveguide exactly to its mechanical entry, using the same line.
 const entry=stations.at(-1);entry.y=guideY(entry.x);
 let p={x:entry.x,y:entry.y,a:radians(-22.5)},s=0;
 const source=stations[0];
 const guideLength=Math.hypot(entry.x-source.x,entry.y-source.y)/150;
 for(const c of stations)c.s=Math.hypot(c.x-source.x,c.y-source.y)/150;
 const samplePositions=[0,guideLength,...stations.map(c=>c.s),...stations.filter(c=>c.kind==='solenoid').map(c=>c.s-SOLENOID_LENGTH)];
 for(let q=.035;q<guideLength;q+=.035)samplePositions.push(q);
 const points=[...new Set(samplePositions.map(q=>q.toFixed(10)))].map(Number).sort((a,b)=>a-b).map(q=>{
  const station=stations.find(c=>Math.abs(c.s-q)<1e-8);
  return {...(station??{}),x:source.x+(entry.x-source.x)*q/guideLength,y:source.y+(entry.y-source.y)*q/guideLength,s:q};
 });
 s=guideLength;const guideEndIndex=points.length-1;
 const bends=[];
 const push=(x,y)=>{const last=points.at(-1);s+=Math.hypot(x-last.x,y-last.y)/150;points.push({x,y,s});};
 const straight=L=>{const {x,y,a}=p;for(let i=1;i<=8;i++)push(x+Math.cos(a)*L*i/8,y+Math.sin(a)*L*i/8);p={x:x+Math.cos(a)*L,y:y+Math.sin(a)*L,a};};
 straight(28);
 for(const [i,c] of COMPONENTS.filter(c=>c.kind==='bend').entries()){
  const R=[60,56,73][i],theta=radians(c.angle),sign=Math.sign(theta),{x,y,a}=p;
  const cx=x-sign*R*Math.sin(a),cy=y+sign*R*Math.cos(a),vx=x-cx,vy=y-cy,start=points.length-1;
  const startS=s;
  for(let j=1;j<=32;j++){const q=theta*j/32;push(cx+vx*Math.cos(q)-vy*Math.sin(q),cy+vx*Math.sin(q)+vy*Math.cos(q));s=startS+Math.abs(theta)*R/150*j/32;points.at(-1).s=s;}
  const end=points.length-1,mid=points[Math.round((start+end)/2)];
  bends.push({...c,start,end,x:mid.x,y:mid.y,radius:R/150});
  points[end].id=c.id;points[end].kind='bend';
  p={...points[end],a:a+theta};straight([68,67,38][i]);
 }
 push(p.x,HEAD.target);points.at(-1).id='target';
 return {points,stations,bends,guideEndIndex,headX:p.x,totalLength:s};
}
export function headRoute(mode,filter){
 return mode==='electron'?['electron-window','primary-foil','primary-collimator','secondary-foil','monitor','backscatter','mirror','parked-mlc','diaphragms','applicator','patient']:
 ['target','primary-collimator',filter==='fff'?'thin-plate':'flattening-filter','monitor','backscatter','mirror','mlc','diaphragms','patient'];
}
export function setMachine(state,key,value){
 const next={...state,[key]:value};
 if(['mode','filter','power'].includes(key))next.beam=false;
 if(key==='beam')next.beam=Boolean(value&&state.power);
 return next;
}
export function simulate(state){
 const g=machineGeometry();let mean=[0,0,0,0];let covariance=[[.000016,0,0,0],[0,.000001,0,0],[0,0,.000016,0],[0,0,0,.000001]];
 const rows=[];let strike=null;
 const apply=M=>{mean=vector(M,mean);covariance=mul(mul(M,covariance),transpose(M));};
 for(let i=0;i<g.points.length;i++){
  const point=g.points[i],last=g.points[i-1];
  if(i){
   const bend=g.bends.find(b=>i>b.start&&i<=b.end);
   if(bend){
    const theta=radians(bend.angle)/(bend.end-bend.start),h=Math.sign(theta)/bend.radius,delta=1/state.momentum-1;
    apply(sector(theta,bend.radius));
    mean[0]+=(1-Math.cos(theta))/h*delta;
    mean[1]+=Math.sin(theta)*delta;
   }else{
    const mid=(last.s+point.s)/2,coil=g.stations.find(c=>c.kind==='solenoid'&&mid>c.s-SOLENOID_LENGTH&&mid<c.s);
    const L=point.s-last.s;
    apply(coil?solenoid(state[coil.id==='focus1'?'f1':'f2']*1.6/state.momentum,L):drift(L));
   }
  }
  if(point.kind==='steering'){
   const n=point.id==='steer1'?'1':'2';mean[1]+=state['r'+n]*.018/state.momentum;mean[3]+=state['t'+n]*.018/state.momentum;
  }
  const sigmaR=Math.sqrt(Math.max(0,covariance[0][0])),sigmaT=Math.sqrt(Math.max(0,covariance[2][2]));
  const aperture=point.id==='target'?APERTURES.target:APERTURES.tube;
  const hitR=Math.abs(mean[0])+2*sigmaR>aperture,hitT=Math.abs(mean[2])+2*sigmaT>aperture;
  const hit=hitR||hitT;
  if(hit&&!strike)strike={index:i,id:point.id??'flight-tube',x:point.x,y:point.y,plane:hitR?'r':'t'};
  rows.push({...point,r:mean[0],rp:mean[1],t:mean[2],tp:mean[3],sigmaR,sigmaT,covariance:covariance.map(r=>[...r])});
 }
 const active=Boolean(state.power&&state.beam&&state.emission>0),target=rows.at(-1);
 return {geometry:g,rows,target,strike,sourceActive:active,radiationActive:active&&!strike,relativeOutput:active&&!strike?state.emission:0,route:headRoute(state.mode,state.filter)};
}
