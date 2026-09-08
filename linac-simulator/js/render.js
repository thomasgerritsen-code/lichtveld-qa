import {MODEL} from './config.js?v=9';
const DEG=Math.PI/180;
const NS='http://www.w3.org/2000/svg';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,t)=>a+(b-a)*t;
const pathD=pts=>pts.map((p,i)=>(i?'L ':'M ')+p.x.toFixed(1)+' '+p.y.toFixed(1)).join(' ');

const WAVE_ANCHORS=[
  {stage:'gun',x:135,y:778},
  {stage:'focus1',x:363,y:683},
  {stage:'steer1',x:470,y:639},
  {stage:'focus2',x:575,y:595},
  {stage:'steer2',x:682,y:551},
  {stage:'bendEntry',x:805,y:499}
];

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

  const window=document.querySelector('#electronWindow');
  if(window) window.setAttribute('transform',`translate(${-v.x.toFixed(2)} ${-v.y.toFixed(2)})`);

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

export function buildMechanicalGeometry(){
  const scale=MODEL.visual?.bendAssemblyScale||1;
  const [x0,y0]=MODEL.visual?.bendPivot||[805,499];
  let x=x0,y=y0,a=-22.5*DEG;
  const pts=[{x,y}];
  const marks={bendEntry:0};

  let s=straight(pts,x,y,a,48*scale,7);x=s.x;y=s.y;a=s.a;
  s=arc(pts,x,y,a,102*scale,45*DEG,20);x=s.x;y=s.y;a=s.a;marks.m1=pts.length-1;
  s=straight(pts,x,y,a,118*scale,9);x=s.x;y=s.y;a=s.a;
  s=arc(pts,x,y,a,97*scale,-45*DEG,20);x=s.x;y=s.y;a=s.a;marks.m2=pts.length-1;
  s=straight(pts,x,y,a,115*scale,9);x=s.x;y=s.y;a=s.a;
  s=arc(pts,x,y,a,126*scale,112.5*DEG,34);x=s.x;y=s.y;a=s.a;marks.m3=pts.length-1;
  s=straight(pts,x,y,a,62*scale,7);marks.target=pts.length-1;

  return {points:pts,marks};
}
export function buildMechanicalPath(){return buildMechanicalGeometry().points;}

function stageMap(sim){return new Map((sim.stages||[]).map(s=>[s.name,s]));}

function blendStage(a,b,t){
  const keys=['r','rp','t','tp','disp','dispPrime','sigmaR','sigmaT','sigma','corrRT'];
  const out={};
  for(const k of keys) out[k]=lerp(a?.[k]||0,b?.[k]||0,t);
  return out;
}

function lineSegmentPoints(a,b,sa,sb,count=8,includeFirst=false){
  const pts=[];
  for(let i=includeFirst?0:1;i<=count;i++){
    const t=i/count;
    pts.push({
      x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t),
      state:blendStage(sa,sb,t),
      stageStart:a.stage,stageEnd:b.stage
    });
  }
  return pts;
}

function buildIncoming(sim){
  const map=stageMap(sim);
  const pts=[];
  for(let i=0;i<WAVE_ANCHORS.length-1;i++){
    const a=WAVE_ANCHORS[i],b=WAVE_ANCHORS[i+1];
    pts.push(...lineSegmentPoints(a,b,map.get(a.stage),map.get(b.stage),7,i===0));
  }
  return pts;
}

function tangentNormal(points,i){
  const prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
  let dx=next.x-prev.x,dy=next.y-prev.y,m=Math.hypot(dx,dy)||1;
  dx/=m;dy/=m;
  return {tx:dx,ty:dy,nx:-dy,ny:dx};
}

function applyRadialOffset(basePoints){
  const scale=MODEL.visual?.beamOffsetPx||560;
  return basePoints.map((p,i)=>{
    const n=tangentNormal(basePoints,i);
    const off=(p.state?.r||0)*scale;
    return {...p,x:p.x+n.nx*off,y:p.y+n.ny*off};
  });
}

function bendStateForIndex(i,marks,map){
  const anchors=[
    ['bendEntry',marks.bendEntry],
    ['m1',marks.m1],
    ['m2',marks.m2],
    ['m3',marks.m3],
    ['target',marks.target]
  ];
  for(let k=0;k<anchors.length-1;k++){
    const [aName,aI]=anchors[k],[bName,bI]=anchors[k+1];
    if(i>=aI&&i<=bI){
      const t=(i-aI)/Math.max(1,bI-aI);
      return blendStage(map.get(aName),map.get(bName),t);
    }
  }
  return map.get('target')||{};
}

function buildBendVariants(geometry,sim,params){
  const map=stageMap(sim);
  const base=geometry.points.map((p,i)=>({...p,state:bendStateForIndex(i,geometry.marks,map)}));
  const beamScale=MODEL.visual?.beamOffsetPx||560;
  const dispScale=MODEL.visual?.dispersionVisualScale||28;

  function variant(sign=0,bad=false){
    return base.map((p,i)=>{
      const n=tangentNormal(base,i);
      let off=(p.state?.r||0)*beamScale;
      if(sign){
        // Spread is causal from M1 onward because D=0 upstream.
        off+=sign*(p.state?.disp||0)*params.spread*dispScale;
      }
      if(bad && i>=geometry.marks.m1){
        const f=(i-geometry.marks.m1)/Math.max(1,geometry.marks.target-geometry.marks.m1);
        off+=sim.mismatch*18*f*f;
      }
      return {...p,x:p.x+n.nx*off,y:p.y+n.ny*off};
    });
  }
  return {base,nominal:variant(0,false),low:variant(1,false),high:variant(-1,false),bad:variant(0,true)};
}

function envelopePolygon(points,mult=1){
  const upper=[],lower=[];
  points.forEach((p,i)=>{
    const n=tangentNormal(points,i);
    const sig=p.state?.sigmaR??p.state?.sigma??.01;
    const w=clamp(sig*760*mult,2,31*mult);
    upper.push({x:p.x+n.nx*w,y:p.y+n.ny*w});
    lower.push({x:p.x-n.nx*w,y:p.y-n.ny*w});
  });
  return [...upper,...lower.reverse()].map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
}

function updateMlcAndJaws(params){
  const center=1450;
  const baseHalfGap=40;
  const desiredHalfGap=18+92*params.fx;
  const dx=desiredHalfGap-baseHalfGap;
  const left=document.querySelector('#mlcLeft'),right=document.querySelector('#mlcRight');
  if(left) left.style.transform=`translateX(${-dx}px)`;
  if(right) right.style.transform=`translateX(${dx}px)`;

  const jawGap=18+82*params.fy;
  const jawL=document.querySelector('#jawL'),jawR=document.querySelector('#jawR');
  if(jawL) jawL.setAttribute('x',center-jawGap-78);
  if(jawR) jawR.setAttribute('x',center+jawGap);
}

export function setActiveControlEffect(effect){
  document.querySelectorAll('.controlActiveHardware').forEach(el=>el.classList.remove('controlActiveHardware'));
  document.querySelectorAll('.planeAttention').forEach(el=>el.classList.remove('planeAttention'));
  if(!effect)return;

  const parts=Array.isArray(effect.part)?effect.part:[effect.part];
  parts.forEach(part=>document.querySelectorAll(`[data-part="${part}"]`).forEach(el=>el.classList.add('controlActiveHardware')));

  if(effect.plane==='radial') document.querySelector('#radialPlane')?.closest('div')?.classList.add('planeAttention');
  if(effect.plane==='transverse') document.querySelector('#transversePlane')?.closest('div')?.classList.add('planeAttention');
  if(effect.plane==='both'){
    document.querySelector('#radialPlane')?.closest('div')?.classList.add('planeAttention');
    document.querySelector('#transversePlane')?.closest('div')?.classList.add('planeAttention');
  }
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
    for(let i=0;i<24;i++){
      const l=document.createElementNS(NS,'line'),x=20+i*25;
      l.setAttribute('x1',x);l.setAttribute('x2',x);l.setAttribute('y1',-30);l.setAttribute('y2',30);
      l.setAttribute('stroke','#2e4963');rf.appendChild(l);
    }
  }

  const bellows=document.querySelector('#bellowsLines');
  if(bellows && !bellows.childNodes.length){
    const a=-22.5*DEG;
    for(let i=0;i<7;i++){
      const t=(i+1)/8,x=774+Math.cos(a)*48*t,y=514+Math.sin(a)*48*t,nx=-Math.sin(a),ny=Math.cos(a);
      const l=document.createElementNS(NS,'line');
      l.setAttribute('x1',x-nx*20);l.setAttribute('y1',y-ny*20);l.setAttribute('x2',x+nx*20);l.setAttribute('y2',y+ny*20);
      l.setAttribute('stroke','#a9b9c8');l.setAttribute('stroke-width','2');bellows.appendChild(l);
    }
  }

  const left=document.querySelector('#mlcLeft'),right=document.querySelector('#mlcRight');
  if(left&&right&&!left.childNodes.length){
    for(let i=0;i<14;i++){
      const y=971+i*3.3,h=2.7;
      const L=document.createElementNS(NS,'path');
      L.setAttribute('d',`M1327 ${y} H1410 Q1426 ${y+h/2} 1410 ${y+h} H1327 Z`);
      L.setAttribute('class','mlcLeaf');left.appendChild(L);
      const R=document.createElementNS(NS,'path');
      R.setAttribute('d',`M1573 ${y} H1490 Q1474 ${y+h/2} 1490 ${y+h} H1573 Z`);
      R.setAttribute('class','mlcLeaf');right.appendChild(R);
    }
    for(const g of [left,right]){
      g.style.transition='transform .18s ease';
      g.style.transformBox='fill-box';
    }
  }

  const shiftX=MODEL.visual?.headShiftX??-59;
  const shift=`translate(${shiftX} 0)`;
  for(const sel of ['[data-part="head"]','#photonHead','#electronHead','[data-part="monitor"]','[data-part="mirror"]','#mlcGroup','#jawsGroup','#electronApplicator','[data-part="patient"]','#treatmentCone','#centralRay']){
    const el=document.querySelector(sel);
    if(el&&!el.hasAttribute('data-shifted')){el.setAttribute('transform',shift);el.setAttribute('data-shifted','1');}
  }
  const selectorBase=document.querySelector('#selectorBase');
  if(selectorBase) selectorBase.setAttribute('transform',shift);

  for(const el of [document.querySelector('#flightTubeCarriage'),document.querySelector('#selectorCarriage')]){
    if(el){
      el.style.transition='transform .55s cubic-bezier(.2,.8,.2,1)';
      el.style.transformBox='fill-box';el.style.transformOrigin='center';
    }
  }
  [...document.querySelectorAll('#bellowsLines line')].forEach(line=>{
    line.style.transition='transform .55s cubic-bezier(.2,.8,.2,1)';
    line.style.transformBox='fill-box';line.style.transformOrigin='center';
  });

  applySelectorMotion('photon');
}

export function render(params,sim,overlays,view={mode:'photon',filter:'ff'}){
  const geometry=buildMechanicalGeometry();
  const map=stageMap(sim);

  const incomingBase=buildIncoming(sim);
  const incoming=applyRadialOffset(incomingBase);
  const bend=buildBendVariants(geometry,sim,params);

  const last=bend.nominal[bend.nominal.length-1];
  const targetState=map.get('target')||{};
  const exitTarget={x:last.x,y:760,state:targetState};
  const fullNominal=[...incoming,...bend.nominal.slice(1),exitTarget];

  // Preserve residual chromatic separation all the way to the target plane.
  const lowLast=bend.low[bend.low.length-1],highLast=bend.high[bend.high.length-1],badLast=bend.bad[bend.bad.length-1];
  const low=[...incoming,...bend.low.slice(1),{x:lowLast.x,y:760,state:targetState}];
  const high=[...incoming,...bend.high.slice(1),{x:highLast.x,y:760,state:targetState}];
  const bad=[...incoming,...bend.bad.slice(1),{x:badLast.x,y:760,state:targetState}];

  document.querySelector('#flightOuter').setAttribute('d',pathD(geometry.points));
  document.querySelector('#flightInner').setAttribute('d',pathD(geometry.points));
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
    env1.setAttribute('points',envelopePolygon(fullNominal,1));
    env2.setAttribute('points',envelopePolygon(fullNominal,2));
    env1.hidden=env2.hidden=!overlays.envelope;
  }

  const vectorLayer=document.querySelector('#vectorLayer');
  vectorLayer.innerHTML='';
  if(overlays.vectors){
    const stageNames=['focus1','steer1','focus2','steer2','m1','m2','m3','target'];
    const allBase=[...incomingBase,...bend.base.slice(1),{x:last.x,y:760,state:targetState}];
    const incomingEndIndex=name=>{
      const i=allBase.findIndex(p=>p.stageEnd===name);
      return i>=0?i:allBase.findIndex(p=>p.stageStart===name);
    };
    const bendBaseOffset=incomingBase.length-1;
    const bendIndex=name=>name==='target'?allBase.length-1:bendBaseOffset+(geometry.marks[name]||0);
    for(const name of stageNames){
      const state=map.get(name);if(!state)continue;
      const index=name==='m1'||name==='m2'||name==='m3'||name==='target'?bendIndex(name):incomingEndIndex(name);
      if(index<0)continue;
      const p=fullNominal[Math.min(fullNominal.length-2,index)],q=fullNominal[Math.min(fullNominal.length-1,index+1)];
      const dx=q.x-p.x,dy=q.y-p.y,m=Math.hypot(dx,dy)||1;
      const l=document.createElementNS(NS,'line');
      l.setAttribute('x1',p.x);l.setAttribute('y1',p.y);
      l.setAttribute('x2',p.x+dx/m*28);l.setAttribute('y2',p.y+dy/m*28);
      l.setAttribute('class','vectorLine');vectorLayer.appendChild(l);
    }
  }

  applySelectorMotion(view.mode);
  updateMlcAndJaws(params);

  const center=1450,patientY=1080;
  const electronBroad=.92+(.08*(1-params.energy));
  const half=view.mode==='electron'
    ?105+150*Math.min(params.fx,params.fy)*electronBroad
    :70+125*params.fx;
  document.querySelector('#treatmentCone').setAttribute('d',`M ${center-4} 774 L ${center+4} 774 L ${center+half} ${patientY} L ${center-half} ${patientY} Z`);

  return fullNominal;
}
