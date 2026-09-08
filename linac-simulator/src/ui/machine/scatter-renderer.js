import {MODEL} from '../../machine/model.js';
import {
  NS,
  WAVE_ANCHORS,
  buildMechanicalGeometry,
  tangentNormal
} from './geometry.js';

function stageMap(sim){
  return new Map((sim.stages||[]).map(stage=>[stage.name,stage]));
}

function wavePosition(name,sim){
  const index=WAVE_ANCHORS.findIndex(anchor=>anchor.stage===name);
  if(index<0)return null;

  const point=WAVE_ANCHORS[index];
  const prev=WAVE_ANCHORS[Math.max(0,index-1)];
  const next=WAVE_ANCHORS[Math.min(WAVE_ANCHORS.length-1,index+1)];
  let dx=next.x-prev.x,dy=next.y-prev.y;
  const magnitude=Math.hypot(dx,dy)||1;
  dx/=magnitude;dy/=magnitude;

  const stage=stageMap(sim).get(name);
  const offset=(stage?.r||0)*(MODEL.visual?.beamOffsetPx||560);
  return {
    x:point.x-dy*offset,
    y:point.y+dx*offset
  };
}

function bendPosition(name,sim){
  const geometry=buildMechanicalGeometry();
  if(name==='target'){
    const index=geometry.marks.target;
    const point=geometry.points[index];
    const normal=tangentNormal(geometry.points,index);
    const stage=stageMap(sim).get('target');
    const offset=(stage?.r||0)*(MODEL.visual?.beamOffsetPx||560);
    return {
      x:point.x+normal.nx*offset,
      y:760
    };
  }

  const index=geometry.marks[name];
  if(index===undefined)return null;

  const point=geometry.points[index];
  const normal=tangentNormal(geometry.points,index);
  const stage=stageMap(sim).get(name);
  const offset=(stage?.r||0)*(MODEL.visual?.beamOffsetPx||560);

  return {
    x:point.x+normal.nx*offset,
    y:point.y+normal.ny*offset
  };
}

function stagePosition(name,sim){
  if(['m1','m2','m3','target'].includes(name)){
    return bendPosition(name,sim);
  }
  return wavePosition(name,sim);
}

function makeLine(group,x1,y1,x2,y2,opacity,width){
  const line=document.createElementNS(NS,'line');
  line.setAttribute('x1',x1);
  line.setAttribute('y1',y1);
  line.setAttribute('x2',x2);
  line.setAttribute('y2',y2);
  line.setAttribute('class','scatterRay');
  line.style.opacity=String(opacity);
  line.style.strokeWidth=String(width);
  group.appendChild(line);
}

function makeCircle(group,x,y,r,opacity,cls){
  const circle=document.createElementNS(NS,'circle');
  circle.setAttribute('cx',x);
  circle.setAttribute('cy',y);
  circle.setAttribute('r',r);
  circle.setAttribute('class',cls);
  circle.style.opacity=String(opacity);
  group.appendChild(circle);
}

export function renderScatter(sim,radiation,{visible=true}={}){
  const group=document.querySelector('#scatterLayer');
  if(!group)return;

  group.innerHTML='';
  group.hidden=!visible;

  document.querySelectorAll('.beamLossSurface').forEach(element=>element.classList.remove('beamLossSurface'));

  const strike=radiation.hardStrike||radiation.firstStrike;
  if(visible&&strike){
    const stage=strike.stage;
    if(['bendEntry','m1','m2','m3'].includes(stage)){
      document.querySelector('#flightOuter')?.classList.add('beamLossSurface');
    }else if(stage==='target'){
      document.querySelector('#photonTarget')?.classList.add('beamLossSurface');
      document.querySelector('#electronWindow')?.classList.add('beamLossSurface');
    }else{
      document.querySelector('[data-part="waveguide"]')?.classList.add('beamLossSurface');
    }
  }

  if(!visible)return;

  const events=radiation.events.filter(event=>event.strength>.01);

  events.forEach((event,eventIndex)=>{
    const point=stagePosition(event.stage,sim);
    if(!point)return;

    const strength=Math.max(.04,event.strength);
    const scale=MODEL.visual?.scatterVisualScale||1;
    const radius=(18+58*strength)*scale;

    makeCircle(
      group,
      point.x,
      point.y,
      5+8*strength,
      .35+.5*strength,
      (event.type==='wall'||event.type==='rf-loss')?'scatterCore wallScatterCore':'scatterCore targetScatterCore'
    );

    makeCircle(
      group,
      point.x,
      point.y,
      radius*.55,
      .10+.16*strength,
      'scatterHalo'
    );

    const rayCount=10+Math.round(strength*10);
    for(let i=0;i<rayCount;i++){
      const angle=2*Math.PI*(i/rayCount)+(eventIndex*.31);
      const jitter=1+((i*37+eventIndex*11)%7)/18;
      const length=radius*jitter;
      const x2=point.x+Math.cos(angle)*length;
      const y2=point.y+Math.sin(angle)*length;
      makeLine(
        group,
        point.x,
        point.y,
        x2,
        y2,
        .10+.48*strength,
        .8+1.6*strength
      );
    }
  });

  // Normal head scatter remains intentionally faint compared with wall interception.
  if(radiation.primaryTransmission>.02){
    const target=stagePosition('target',sim);
    if(target){
      const normalStrength=Math.min(.18,radiation.primaryTransmission*.10);
      makeCircle(
        group,
        target.x,
        target.y,
        24+normalStrength*90,
        .05+normalStrength*.22,
        'scatterHalo normalHeadScatter'
      );
    }
  }
}
