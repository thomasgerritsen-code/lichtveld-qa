import {MODEL} from '../../machine/model.js';
import {
  NS,
  clamp,
  WAVE_ANCHORS,
  buildMechanicalGeometry,
  tangentNormal,
  blendStage,
  pathD
} from './geometry.js';

function stageMap(sim){
  return new Map((sim.stages||[]).map(stage=>[stage.name,stage]));
}

function lineSegmentPoints(a,b,stageA,stageB,count=8,includeFirst=false){
  const points=[];
  for(let i=includeFirst?0:1;i<=count;i++){
    const t=i/count;
    points.push({
      x:a.x+(b.x-a.x)*t,
      y:a.y+(b.y-a.y)*t,
      state:blendStage(stageA,stageB,t),
      stageStart:a.stage,
      stageEnd:b.stage
    });
  }
  return points;
}

function buildIncoming(sim){
  const map=stageMap(sim);
  const points=[];

  for(let i=0;i<WAVE_ANCHORS.length-1;i++){
    const a=WAVE_ANCHORS[i];
    const b=WAVE_ANCHORS[i+1];
    points.push(...lineSegmentPoints(
      a,
      b,
      map.get(a.stage),
      map.get(b.stage),
      7,
      i===0
    ));
  }
  return points;
}

function applyRadialOffset(basePoints){
  const scale=MODEL.visual?.beamOffsetPx||560;
  return basePoints.map((point,index)=>{
    const normal=tangentNormal(basePoints,index);
    const offset=(point.state?.r||0)*scale;
    return {
      ...point,
      x:point.x+normal.nx*offset,
      y:point.y+normal.ny*offset
    };
  });
}

function bendStateForIndex(index,marks,map){
  const anchors=[
    ['bendEntry',marks.bendEntry],
    ['m1',marks.m1],
    ['m2',marks.m2],
    ['m3',marks.m3],
    ['target',marks.target]
  ];

  for(let i=0;i<anchors.length-1;i++){
    const [startName,startIndex]=anchors[i];
    const [endName,endIndex]=anchors[i+1];

    if(index>=startIndex&&index<=endIndex){
      const t=(index-startIndex)/Math.max(1,endIndex-startIndex);
      return blendStage(map.get(startName),map.get(endName),t);
    }
  }

  return map.get('target')||{};
}

function buildBendVariants(geometry,sim,params){
  const map=stageMap(sim);
  const base=geometry.points.map((point,index)=>({
    ...point,
    state:bendStateForIndex(index,geometry.marks,map)
  }));

  const beamScale=MODEL.visual?.beamOffsetPx||560;
  const dispersionScale=MODEL.visual?.dispersionVisualScale||28;

  function variant(sign=0,mismatch=false){
    return base.map((point,index)=>{
      const normal=tangentNormal(base,index);
      let offset=(point.state?.r||0)*beamScale;

      if(sign){
        offset+=sign*(point.state?.disp||0)*params.spread*dispersionScale;
      }

      if(mismatch&&index>=geometry.marks.m1){
        const fraction=(index-geometry.marks.m1)/
          Math.max(1,geometry.marks.target-geometry.marks.m1);
        offset+=sim.mismatch*18*fraction*fraction;
      }

      return {
        ...point,
        x:point.x+normal.nx*offset,
        y:point.y+normal.ny*offset
      };
    });
  }

  return {
    base,
    nominal:variant(0,false),
    low:variant(1,false),
    high:variant(-1,false),
    bad:variant(0,true)
  };
}

function envelopePolygon(points,multiplier=1){
  const upper=[];
  const lower=[];

  points.forEach((point,index)=>{
    const normal=tangentNormal(points,index);
    const sigma=point.state?.sigmaR??point.state?.sigma??.01;
    const width=clamp(sigma*760*multiplier,2,31*multiplier);

    upper.push({
      x:point.x+normal.nx*width,
      y:point.y+normal.ny*width
    });
    lower.push({
      x:point.x-normal.nx*width,
      y:point.y-normal.ny*width
    });
  });

  return [...upper,...lower.reverse()]
    .map(point=>point.x.toFixed(1)+','+point.y.toFixed(1))
    .join(' ');
}

function renderVectors({sim,geometry,incomingBase,bend,fullNominal,targetState,last}){
  const vectorLayer=document.querySelector('#vectorLayer');
  if(!vectorLayer)return;
  vectorLayer.innerHTML='';

  const map=stageMap(sim);
  const stageNames=['focus1','steer1','focus2','steer2','m1','m2','m3','target'];
  const allBase=[
    ...incomingBase,
    ...bend.base.slice(1),
    {x:last.x,y:760,state:targetState}
  ];

  const incomingEndIndex=name=>{
    const found=allBase.findIndex(point=>point.stageEnd===name);
    return found>=0
      ?found
      :allBase.findIndex(point=>point.stageStart===name);
  };

  const bendBaseOffset=incomingBase.length-1;
  const bendIndex=name=>name==='target'
    ?allBase.length-1
    :bendBaseOffset+(geometry.marks[name]||0);

  for(const name of stageNames){
    if(!map.get(name))continue;

    const index=['m1','m2','m3','target'].includes(name)
      ?bendIndex(name)
      :incomingEndIndex(name);

    if(index<0||index>=fullNominal.length-1)continue;

    const p=fullNominal[Math.min(fullNominal.length-2,index)];
    const q=fullNominal[Math.min(fullNominal.length-1,index+1)];
    const dx=q.x-p.x;
    const dy=q.y-p.y;
    const magnitude=Math.hypot(dx,dy)||1;

    const line=document.createElementNS(NS,'line');
    line.setAttribute('x1',p.x);
    line.setAttribute('y1',p.y);
    line.setAttribute('x2',p.x+dx/magnitude*28);
    line.setAttribute('y2',p.y+dy/magnitude*28);
    line.setAttribute('class','vectorLine');
    vectorLayer.appendChild(line);
  }
}

export function renderBeam(params,sim,overlays,radiation=null,delivery=null){
  const geometry=buildMechanicalGeometry();
  const map=stageMap(sim);

  const incomingBase=buildIncoming(sim);
  const incoming=applyRadialOffset(incomingBase);
  const bend=buildBendVariants(geometry,sim,params);

  const last=bend.nominal[bend.nominal.length-1];
  const targetState=map.get('target')||{};
  const targetPoint={x:last.x,y:760,state:targetState};

  const fullNominal=[
    ...incoming,
    ...bend.nominal.slice(1),
    targetPoint
  ];

  const lowLast=bend.low[bend.low.length-1];
  const highLast=bend.high[bend.high.length-1];
  const badLast=bend.bad[bend.bad.length-1];

  const low=[
    ...incoming,
    ...bend.low.slice(1),
    {x:lowLast.x,y:760,state:targetState}
  ];
  const high=[
    ...incoming,
    ...bend.high.slice(1),
    {x:highLast.x,y:760,state:targetState}
  ];
  const bad=[
    ...incoming,
    ...bend.bad.slice(1),
    {x:badLast.x,y:760,state:targetState}
  ];

  const incomingStageIndex=name=>{
    const endIndex=incomingBase.findIndex(point=>point.stageEnd===name);
    return endIndex>=0
      ?endIndex
      :incomingBase.findIndex(point=>point.stageStart===name);
  };
  const bendBaseOffset=incoming.length-1;
  const fullStageIndex=name=>{
    if(name==='target')return fullNominal.length-1;
    if(['m1','m2','m3'].includes(name)){
      return bendBaseOffset+(geometry.marks[name]||0);
    }
    return incomingStageIndex(name);
  };

  const hardStrikeStage=radiation?.hardStrike?.stage||null;
  const hardStrikeIndex=hardStrikeStage
    ?fullStageIndex(hardStrikeStage)
    :-1;

  const clip=points=>hardStrikeIndex>=0
    ?points.slice(0,Math.min(points.length,hardStrikeIndex+1))
    :points;

  const visibleNominal=clip(fullNominal);
  const visibleLow=clip(low);
  const visibleHigh=clip(high);
  const visibleBad=clip(bad);

  document.querySelector('#flightOuter')?.setAttribute('d',pathD(geometry.points));
  document.querySelector('#flightInner')?.setAttribute('d',pathD(geometry.points));

  const beamActive=Boolean(delivery?.beamActive&&delivery?.sourceActive);
  const particles=document.querySelector('#particles');
  if(particles){
    particles.hidden=!beamActive;
    particles.style.opacity=String(Math.max(.08,Math.min(1,delivery?.sourceFactor??1)));
  }

  if(!beamActive){
    document.querySelector('#beamPath')?.setAttribute('d','');
    document.querySelector('#beamCore')?.setAttribute('d','');
    document.querySelector('#dispLow')?.setAttribute('d','');
    document.querySelector('#dispHigh')?.setAttribute('d','');
    document.querySelector('#mismatchPath')?.setAttribute('d','');
    const env1=document.querySelector('#envelope1');
    const env2=document.querySelector('#envelope2');
    if(env1){env1.setAttribute('points','');env1.hidden=true;}
    if(env2){env2.setAttribute('points','');env2.hidden=true;}
    const vectorLayer=document.querySelector('#vectorLayer');
    if(vectorLayer)vectorLayer.innerHTML='';
    const labels=document.querySelector('#labels');
    if(labels)labels.style.display=overlays.labels?'block':'none';
    return [];
  }

  document.querySelector('#beamPath')?.setAttribute('d',pathD(visibleNominal));
  document.querySelector('#beamCore')?.setAttribute('d',pathD(visibleNominal));
  document.querySelector('#dispLow')?.setAttribute('d',pathD(visibleLow));
  document.querySelector('#dispHigh')?.setAttribute('d',pathD(visibleHigh));
  document.querySelector('#mismatchPath')?.setAttribute('d',pathD(visibleBad));

  const dispLow=document.querySelector('#dispLow');
  const dispHigh=document.querySelector('#dispHigh');
  const mismatchPath=document.querySelector('#mismatchPath');
  const labels=document.querySelector('#labels');

  if(dispLow)dispLow.hidden=!overlays.disp;
  if(dispHigh)dispHigh.hidden=!overlays.disp;
  if(mismatchPath)mismatchPath.hidden=!overlays.bad;
  if(labels)labels.style.display=overlays.labels?'block':'none';

  const env1=document.querySelector('#envelope1');
  const env2=document.querySelector('#envelope2');
  if(env1&&env2){
    env1.setAttribute('points',envelopePolygon(visibleNominal,1));
    env2.setAttribute('points',envelopePolygon(visibleNominal,2));
    env1.hidden=!overlays.envelope;
    env2.hidden=!overlays.envelope;
  }

  if(overlays.vectors){
    renderVectors({
      sim,
      geometry,
      incomingBase,
      bend,
      fullNominal:visibleNominal,
      targetState,
      last
    });
  }else{
    const vectorLayer=document.querySelector('#vectorLayer');
    if(vectorLayer)vectorLayer.innerHTML='';
  }

  return visibleNominal;
}
