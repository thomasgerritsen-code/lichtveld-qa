const DEG=Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pathD=pts=>pts.map((p,i)=>(i?'L ':'M ')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');

function straight(pts,x,y,a,L,n=10){
  for(let i=1;i<=n;i++){const t=i/n;pts.push({x:x+Math.cos(a)*L*t,y:y+Math.sin(a)*L*t});}
  return {x:x+Math.cos(a)*L,y:y+Math.sin(a)*L,a};
}
function arc(pts,x,y,a,R,delta,n=22){
  const s=Math.sign(delta)||1,cx=x+s*R*(-Math.sin(a)),cy=y+s*R*Math.cos(a),vx=x-cx,vy=y-cy;
  for(let i=1;i<=n;i++){const q=delta*i/n,c=Math.cos(q),sn=Math.sin(q);pts.push({x:cx+vx*c-vy*sn,y:cy+vx*sn+vy*c});}
  const c=Math.cos(delta),sn=Math.sin(delta);
  return {x:cx+vx*c-vy*sn,y:cy+vx*sn+vy*c,a:a+delta};
}

export function buildMechanicalPath(){
  let x=805,y=499,a=-22.5*DEG;
  const pts=[{x,y}];
  let s=straight(pts,x,y,a,48,7);x=s.x;y=s.y;a=s.a;
  s=arc(pts,x,y,a,102,45*DEG,20);x=s.x;y=s.y;a=s.a;
  s=straight(pts,x,y,a,118,9);x=s.x;y=s.y;a=s.a;
  s=arc(pts,x,y,a,97,-45*DEG,20);x=s.x;y=s.y;a=s.a;
  s=straight(pts,x,y,a,115,9);x=s.x;y=s.y;a=s.a;
  s=arc(pts,x,y,a,126,112.5*DEG,34);x=s.x;y=s.y;a=s.a;
  s=straight(pts,x,y,a,62,7);
  return pts;
}

function offsetPath(mech,params,sim,sign=0,bad=false){
  const dispersionAmp=10+38*params.spread;
  return mech.map((p,i)=>{
    const f=i/(mech.length-1),prev=mech[Math.max(0,i-1)],next=mech[Math.min(mech.length-1,i+1)];
    let dx=next.x-prev.x,dy=next.y-prev.y,m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;
    const nx=-dy,ny=dx;
    let ds=0;
    if(f>.18&&f<.38)ds=(f-.18)/.20*.65;
    else if(f>=.38&&f<.60)ds=.65+(f-.38)/.22*.35;
    else if(f>=.60&&f<.84)ds=1-(f-.60)/.24*.72;
    else if(f>=.84)ds=.28*(1-(f-.84)/.16);
    ds=Math.max(0,ds);
    const steer=sim.radialOffset*(.12+.88*f);
    const residual=sign*dispersionAmp*sim.mismatch*f*f*.48;
    const mismatchKick=bad?(12+18*Math.sin(f*5))*sim.mismatch*(.25+.75*f):0;
    const off=steer+sign*dispersionAmp*ds+residual+mismatchKick;
    return {x:p.x+nx*off,y:p.y+ny*off};
  });
}

export function initHardware(){
  const rf=document.querySelector('#rfCells');
  for(let i=0;i<24;i++){const l=document.createElementNS('http://www.w3.org/2000/svg','line');const x=20+i*25;l.setAttribute('x1',x);l.setAttribute('x2',x);l.setAttribute('y1',-30);l.setAttribute('y2',30);l.setAttribute('stroke','#2e4963');rf.appendChild(l);}
  const bellows=document.querySelector('#bellowsLines');
  const a=-22.5*DEG;
  for(let i=0;i<7;i++){const t=(i+1)/8,x=774+Math.cos(a)*48*t,y=514+Math.sin(a)*48*t,nx=-Math.sin(a),ny=Math.cos(a),l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',x-nx*20);l.setAttribute('y1',y-ny*20);l.setAttribute('x2',x+nx*20);l.setAttribute('y2',y+ny*20);l.setAttribute('stroke','#a9b9c8');l.setAttribute('stroke-width','2');bellows.appendChild(l);}
  const left=document.querySelector('#mlcLeft'),right=document.querySelector('#mlcRight');
  for(let i=0;i<14;i++){for(const [g,x] of [[left,1327],[right,1475]]){const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',x);r.setAttribute('y',971+i*3.3);r.setAttribute('width',98);r.setAttribute('height',2.7);r.setAttribute('rx',1);r.setAttribute('fill','#586674');g.appendChild(r);}}
}

export function render(params,sim,overlays){
  const mech=buildMechanicalPath();
  const nominal=offsetPath(mech,params,sim,0,false),low=offsetPath(mech,params,sim,1,false),high=offsetPath(mech,params,sim,-1,false),bad=offsetPath(mech,params,sim,0,true);
  document.querySelector('#flightOuter').setAttribute('d',pathD(mech));
  document.querySelector('#flightInner').setAttribute('d',pathD(mech));
  document.querySelector('#beamPath').setAttribute('d',pathD(nominal));
  document.querySelector('#beamCore').setAttribute('d',pathD(nominal));
  document.querySelector('#dispLow').setAttribute('d',pathD(low));
  document.querySelector('#dispHigh').setAttribute('d',pathD(high));
  document.querySelector('#mismatchPath').setAttribute('d',pathD(bad));
  document.querySelector('#dispLow').hidden=!overlays.disp;
  document.querySelector('#dispHigh').hidden=!overlays.disp;
  document.querySelector('#mismatchPath').hidden=!overlays.bad;
  document.querySelector('#labels').style.display=overlays.labels?'block':'none';

  const vectorLayer=document.querySelector('#vectorLayer');vectorLayer.innerHTML='';
  if(overlays.vectors){
    const anchors=[.10,.31,.52,.74,.95];
    for(const f of anchors){
      const i=Math.min(nominal.length-2,Math.max(1,Math.round(f*(nominal.length-1))));
      const p=nominal[i],q=nominal[i+1],dx=q.x-p.x,dy=q.y-p.y,m=Math.hypot(dx,dy)||1;
      const l=document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',p.x);l.setAttribute('y1',p.y);l.setAttribute('x2',p.x+dx/m*30);l.setAttribute('y2',p.y+dy/m*30);l.setAttribute('class','vectorLine');vectorLayer.appendChild(l);
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r',4);c.setAttribute('class','vectorDot');vectorLayer.appendChild(c);
    }
  }

  const center=1450,patientY=1080,half=70+125*params.fx;
  document.querySelector('#treatmentCone').setAttribute('d',`M ${center-4} 774 L ${center+4} 774 L ${center+half} ${patientY} L ${center-half} ${patientY} Z`);
  const gap=22+76*params.fy;
  document.querySelector('#jawL').setAttribute('x',center-gap-78);
  document.querySelector('#jawR').setAttribute('x',center+gap);
  return nominal;
}
