import {MODEL} from '../../machine/model.js';

export const DEG=Math.PI/180;
export const NS='http://www.w3.org/2000/svg';
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const lerp=(a,b,t)=>a+(b-a)*t;
export const pathD=pts=>pts.map((p,i)=>(i?'L ':'M ')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');

export const WAVE_ANCHORS=[
  {stage:'gun',x:135,y:778},
  {stage:'focus1',x:270,y:722},
  {stage:'steer1',x:390,y:673},
  {stage:'wgAfter1',x:430,y:656},
  {stage:'focus2',x:500,y:627},
  {stage:'wgAfter2',x:555,y:604},
  {stage:'steer2',x:610,y:581},
  {stage:'wgExit',x:745,y:524},
  {stage:'bendEntry',x:805,y:499}
];

function straight(pts,x,y,a,L,n=10){
  for(let i=1;i<=n;i++){
    const t=i/n;
    pts.push({x:x+Math.cos(a)*L*t,y:y+Math.sin(a)*L*t});
  }
  return {x:x+Math.cos(a)*L,y:y+Math.sin(a)*L,a};
}

function arc(pts,x,y,a,R,delta,n=22){
  const s=Math.sign(delta)||1;
  const cx=x+s*R*(-Math.sin(a));
  const cy=y+s*R*Math.cos(a);
  const vx=x-cx,vy=y-cy;

  for(let i=1;i<=n;i++){
    const q=delta*i/n,c=Math.cos(q),sn=Math.sin(q);
    pts.push({x:cx+vx*c-vy*sn,y:cy+vx*sn+vy*c});
  }

  const c=Math.cos(delta),sn=Math.sin(delta);
  return {x:cx+vx*c-vy*sn,y:cy+vx*sn+vy*c,a:a+delta};
}

export function buildMechanicalGeometry(){
  const scale=MODEL.visual?.bendAssemblyScale||1;
  const [x0,y0]=MODEL.visual?.bendPivot||[805,499];
  let x=x0,y=y0,a=-22.5*DEG;
  const points=[{x,y}];
  const marks={bendEntry:0};

  let s=straight(points,x,y,a,48*scale,7);x=s.x;y=s.y;a=s.a;
  s=arc(points,x,y,a,102*scale,45*DEG,20);x=s.x;y=s.y;a=s.a;marks.m1=points.length-1;
  s=straight(points,x,y,a,118*scale,9);x=s.x;y=s.y;a=s.a;
  s=arc(points,x,y,a,97*scale,-45*DEG,20);x=s.x;y=s.y;a=s.a;marks.m2=points.length-1;
  s=straight(points,x,y,a,115*scale,9);x=s.x;y=s.y;a=s.a;
  s=arc(points,x,y,a,126*scale,112.5*DEG,34);x=s.x;y=s.y;a=s.a;marks.m3=points.length-1;
  s=straight(points,x,y,a,62*scale,7);marks.target=points.length-1;

  return {points,marks};
}

export function buildMechanicalPath(){
  return buildMechanicalGeometry().points;
}

export function tangentNormal(points,index){
  const prev=points[Math.max(0,index-1)];
  const next=points[Math.min(points.length-1,index+1)];
  let dx=next.x-prev.x,dy=next.y-prev.y;
  const magnitude=Math.hypot(dx,dy)||1;
  dx/=magnitude;dy/=magnitude;
  return {tx:dx,ty:dy,nx:-dy,ny:dx};
}

export function blendStage(a,b,t){
  const keys=['r','rp','t','tp','disp','dispPrime','sigmaR','sigmaT','sigma','corrRT'];
  const out={};
  for(const key of keys)out[key]=lerp(a?.[key]||0,b?.[key]||0,t);
  return out;
}
