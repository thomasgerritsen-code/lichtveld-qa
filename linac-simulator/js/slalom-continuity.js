import {buildMechanicalGeometry} from './render.js?v=9';

const NS='http://www.w3.org/2000/svg';

// Public literature supports a three-magnet achromatic/slalom transport before
// the treatment head. Positions below are inherited from the renderer's
// normalized educational geometry; they are not OEM dimensions.
export const SLALOM_SEQUENCE=['bendEntry','m1','m2','m3','target'];
export const SLALOM_ROLES={
  bendEntry:'2R/2T → bend entry',
  m1:'M1 · dispersive bend',
  m2:'M2 · counter-bend',
  m3:'M3 · final redirection',
  target:'flight tube → head entrance'
};

export function slalomStations(geometry=buildMechanicalGeometry()){
  return SLALOM_SEQUENCE.map(stage=>{
    const index=geometry.marks[stage];
    const point=geometry.points[index];
    return {stage,index,x:point.x,y:point.y,label:SLALOM_ROLES[stage]};
  });
}

export function initSlalomContinuity(){
  const host=document.querySelector('#machineHardware');
  if(!host || document.querySelector('#slalomContinuity')) return;

  const geometry=buildMechanicalGeometry();
  const stations=slalomStations(geometry);
  const group=document.createElementNS(NS,'g');
  group.id='slalomContinuity';
  group.dataset.geometry='normalized-educational';
  group.dataset.topology='2r2t-bend-entry-m1-m2-m3-flight-tube-head-entrance';
  group.setAttribute('pointer-events','none');

  const path=document.createElementNS(NS,'path');
  path.setAttribute('d',geometry.points.map((p,i)=>`${i?'L':'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' '));
  path.setAttribute('fill','none');
  path.setAttribute('stroke','#78b8d8');
  path.setAttribute('stroke-width','2');
  path.setAttribute('stroke-dasharray','5 7');
  path.setAttribute('opacity','.58');
  path.dataset.role='shared-mechanical-transport-path';
  group.appendChild(path);

  stations.forEach((s,i)=>{
    const marker=document.createElementNS(NS,'circle');
    marker.setAttribute('cx',s.x.toFixed(1));
    marker.setAttribute('cy',s.y.toFixed(1));
    marker.setAttribute('r',i===0||i===stations.length-1?'5':'6');
    marker.setAttribute('fill','#071522');
    marker.setAttribute('stroke','#9bdcff');
    marker.setAttribute('stroke-width','2');
    marker.dataset.stage=s.stage;
    marker.dataset.role=s.label;
    group.appendChild(marker);
  });

  host.appendChild(group);
}
