import {MODEL} from './config.js?v=8';
const DEG=Math.PI/180;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pathD=pts=>pts.map((p,i)=>(i?'L ':'M ')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');

function selectorVector(){
  const travel=MODEL.visual?.selectorTravelPx||0;
  const a=(MODEL.visual?.selectorAxisDeg??0)*DEG;
  return {x:Math.cos(a)*travel,y:Math.sin(a)*travel};
}

function applySelectorMotion(mode){
  const v=selectorVector();
  const electron=mode==='electron';
  const dx=electron?v.x:0,dy=electron?v.y:0;

  const tube=document.querySelector('#flightTubeCarriage');
  const carriage=document.querySelector('#selectorCarriage');
  if(tube) tube.style.transform=`translate(${dx}px,${dy}px)`;
  if(carriage) carriage.style.transform=`translate(${dx}px,${dy}px)`;

  // Electron window is the second port on the moving carriage. Its static offset
  // is cancelled when the carriage moves to the electron position.
  const window=document.querySelector('#electronWindow');
  if(window) window.setAttribute('transform',`translate(${-v.x.toFixed(2)} ${-v.y.toFixed(2)})`);

  // Progressively move the bellows corrugations: upstream end almost fixed,
  // downstream end follows the flight tube. This creates a visible accordion motion.
  const lines=[...document.querySelectorAll('#bellowsLines line')];
  lines.forEach((line,i)=>{
    const f=(i+1)/(lines.length+1);
    line.style.transform=`translate(${(dx*f).toFixed(2)}px,${(dy*f).toFixed(2)}px)`;
  });

  const guide=document.querySelector('#selectorGuide');
  if(guide) guide.classList.toggle('electronSelected',electron);
}

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
  const scale=MODEL.visual?.bendAssemblyScale||1;
  const [x0,y0]=MODEL.visual?.bendPivot||[805,499];
  let x=x0,y=y0,a=-22.5*DEG;
  const pts=[{x,y}];
  let s=straight(pts,x,y,a,48*scale,7);x=s.x;y=s.y;a=s.a;
  s=arc(pts,x,y,a,102*scale,45*DEG,20);x=s.x;y=s.y;a=s.a;
  s=straight(pts,x,y,a,118*scale,9);x=s.x;y=s.y;a=s.a;
  s=arc(pts,x,y,a,97*scale,-45*DEG,20);x=s.x;y=s.y;a=s.a;
  s=straight(pts,x,y,a,115*scale,9);x=s.x;y=s.y;a=s.a;
  s=arc(pts,x,y,a,126*scale,112.5*DEG,34);x=s.x;y=s.y;a=s.a;
  s=straight(pts,x,y,a,62*scale,7);
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
    const residual=sign*dispersionAmp*(1-sim.achromacy)*f*f*.48;
    const bendBias=((sim.effectiveBend?.mainBend??params.mainBend)*.70+(sim.effectiveBend?.m3Topup??params.m3Topup)*.30)*28*f*f;
    const mismatchKick=bad?(12+18*Math.sin(f*5))*sim.mismatch*(.25+.75*f):0;
    const off=steer+sign*dispersionAmp*ds+residual+bendBias+mismatchKick;
    return {x:p.x+nx*off,y:p.y+ny*off};
  });
}

function stageSigmaAt(sim,f){
  const stages=sim.stages||[];
  if(!stages.length)return .01;
  const q=f*(stages.length-1),i=Math.floor(q),j=Math.min(stages.length-1,i+1),u=q-i;
  const a=stages[i].sigmaR||stages[i].sigma||.01,b=stages[j].sigmaR||stages[j].sigma||.01;
  return a+(b-a)*u;
}

function envelopePolygon(path,sim,mult=1){
  const upper=[],lower=[];
  path.forEach((p,i)=>{
    const f=i/(path.length-1);
    const prev=path[Math.max(0,i-1)],next=path[Math.min(path.length-1,i+1)];
    let dx=next.x-prev.x,dy=next.y-prev.y,m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;
    const nx=-dy,ny=dx;
    const w=clamp(stageSigmaAt(sim,f)*850*mult,2,34*mult);
    upper.push({x:p.x+nx*w,y:p.y+ny*w});
    lower.push({x:p.x-nx*w,y:p.y-ny*w});
  });
  const all=[...upper,...lower.reverse()];
  return all.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
}

export function initHardware(){
  const scale=MODEL.visual?.bendAssemblyScale||1;
  const [px,py]=MODEL.visual?.bendPivot||[805,499];
  const slalom=document.querySelector('#slalomHardware');
  if(slalom){
    const tx=px*(1-scale),ty=py*(1-scale);
    slalom.setAttribute('transform',`translate(${tx} ${ty}) scale(${scale})`);
  }

  const rf=document.querySelector('#rfCells');
  if(rf && !rf.childNodes.length){
    for(let i=0;i<24;i++){const l=document.createElementNS('http://www.w3.org/2000/svg','line');const x=20+i*25;l.setAttribute('x1',x);l.setAttribute('x2',x);l.setAttribute('y1',-30);l.setAttribute('y2',30);l.setAttribute('stroke','#2e4963');rf.appendChild(l);}
  }

  const bellows=document.querySelector('#bellowsLines');
  if(bellows && !bellows.childNodes.length){
    const a=-22.5*DEG;
    for(let i=0;i<7;i++){const t=(i+1)/8,x=774+Math.cos(a)*48*t,y=514+Math.sin(a)*48*t,nx=-Math.sin(a),ny=Math.cos(a),l=document.createElementNS('http://www.w3.org/2000/svg','line');l.setAttribute('x1',x-nx*20);l.setAttribute('y1',y-ny*20);l.setAttribute('x2',x+nx*20);l.setAttribute('y2',y+ny*20);l.setAttribute('stroke','#a9b9c8');l.setAttribute('stroke-width','2');bellows.appendChild(l);}
  }

  const left=document.querySelector('#mlcLeft'),right=document.querySelector('#mlcRight');
  if(left && right && !left.childNodes.length){
    for(let i=0;i<14;i++){
      const y=971+i*3.3,h=2.7;
      const L=document.createElementNS('http://www.w3.org/2000/svg','path');
      L.setAttribute('d',`M1327 ${y} H1410 Q1426 ${y+h/2} 1410 ${y+h} H1327 Z`);
      L.setAttribute('class','mlcLeaf');
      left.appendChild(L);
      const R=document.createElementNS('http://www.w3.org/2000/svg','path');
      R.setAttribute('d',`M1573 ${y} H1490 Q1474 ${y+h/2} 1490 ${y+h} H1573 Z`);
      R.setAttribute('class','mlcLeaf');
      right.appendChild(R);
    }
  }

  const shiftX=MODEL.visual?.headShiftX??-59;
  const shift=`translate(${shiftX} 0)`;
  for(const sel of ['[data-part="head"]','#photonHead','#electronHead','[data-part="monitor"]','[data-part="mirror"]','#mlcGroup','#jawsGroup','#electronApplicator','[data-part="patient"]','#treatmentCone','#centralRay']){
    const el=document.querySelector(sel);if(el&&!el.hasAttribute('data-shifted')){el.setAttribute('transform',shift);el.setAttribute('data-shifted','1');}
  }

  const selectorBase=document.querySelector('#selectorBase');
  if(selectorBase) selectorBase.setAttribute('transform',shift);

  const tubeCarriage=document.querySelector('#flightTubeCarriage');
  const selectorCarriage=document.querySelector('#selectorCarriage');
  for(const el of [tubeCarriage,selectorCarriage]){
    if(el){
      el.style.transition='transform .55s cubic-bezier(.2,.8,.2,1)';
      el.style.transformBox='fill-box';
      el.style.transformOrigin='center';
    }
  }
  [...document.querySelectorAll('#bellowsLines line')].forEach(line=>{
    line.style.transition='transform .55s cubic-bezier(.2,.8,.2,1)';
    line.style.transformBox='fill-box';
    line.style.transformOrigin='center';
  });

  applySelectorMotion('photon');
}

export function render(params,sim,overlays,view={mode:'photon',filter:'ff'}){
  const mech=buildMechanicalPath();
  const nominal=offsetPath(mech,params,sim,0,false),low=offsetPath(mech,params,sim,1,false),high=offsetPath(mech,params,sim,-1,false),bad=offsetPath(mech,params,sim,0,true);

  const incoming=[];
  const x0=135,y0=778,x1=mech[0].x,y1=mech[0].y,dx=x1-x0,dy=y1-y0,m=Math.hypot(dx,dy)||1,nx=-dy/m,ny=dx/m;
  for(let i=0;i<=28;i++){
    const t=i/28;
    const stageF=t*.55;
    const stageIndex=Math.min(5,Math.round(stageF*5));
    const s=sim.stages?.[stageIndex];
    const off=(s?.r||0)*780;
    incoming.push({x:x0+dx*t+nx*off,y:y0+dy*t+ny*off});
  }

  const last=nominal[nominal.length-1];
  const fullNominal=[...incoming,...nominal.slice(1),{x:last.x,y:760}];

  document.querySelector('#flightOuter').setAttribute('d',pathD(mech));
  document.querySelector('#flightInner').setAttribute('d',pathD(mech));
  document.querySelector('#beamPath').setAttribute('d',pathD(fullNominal));
  document.querySelector('#beamCore').setAttribute('d',pathD(fullNominal));
  document.querySelector('#dispLow').setAttribute('d',pathD(low));
  document.querySelector('#dispHigh').setAttribute('d',pathD(high));
  document.querySelector('#mismatchPath').setAttribute('d',pathD(bad));
  document.querySelector('#dispLow').hidden=!overlays.disp;
  document.querySelector('#dispHigh').hidden=!overlays.disp;
  document.querySelector('#mismatchPath').hidden=!overlays.bad;
  document.querySelector('#labels').style.display=overlays.labels?'block':'none';

  const env1=document.querySelector('#envelope1'),env2=document.querySelector('#envelope2');
  if(env1&&env2){
    env1.setAttribute('points',envelopePolygon(fullNominal,sim,1));
    env2.setAttribute('points',envelopePolygon(fullNominal,sim,2));
    env1.hidden=env2.hidden=!overlays.envelope;
  }

  const vectorLayer=document.querySelector('#vectorLayer');vectorLayer.innerHTML='';
  if(overlays.vectors){
    const anchors=[.10,.31,.52,.74,.95];
    for(const f of anchors){
      const i=Math.min(nominal.length-2,Math.max(1,Math.round(f*(nominal.length-1))));
      const p=nominal[i],q=nominal[i+1],vx=q.x-p.x,vy=q.y-p.y,vm=Math.hypot(vx,vy)||1;
      const l=document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',p.x);l.setAttribute('y1',p.y);l.setAttribute('x2',p.x+vx/vm*30);l.setAttribute('y2',p.y+vy/vm*30);l.setAttribute('class','vectorLine');vectorLayer.appendChild(l);
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');c.setAttribute('cx',p.x);c.setAttribute('cy',p.y);c.setAttribute('r',4);c.setAttribute('class','vectorDot');vectorLayer.appendChild(c);
    }
  }

  applySelectorMotion(view.mode);

  const center=1450,patientY=1080;
  const electronBroad=.82+(.18*(1-params.energy/2));
  const half=view.mode==='electron'
    ?105+150*Math.min(params.fx,params.fy)*electronBroad
    :70+125*params.fx;
  document.querySelector('#treatmentCone').setAttribute('d',`M ${center-4} 774 L ${center+4} 774 L ${center+half} ${patientY} L ${center-half} ${patientY} Z`);

  const gap=22+76*params.fy;
  document.querySelector('#jawL').setAttribute('x',center-gap-78);
  document.querySelector('#jawR').setAttribute('x',center+gap);
  return fullNominal;
}
