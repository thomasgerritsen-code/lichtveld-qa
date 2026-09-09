import {MODEL} from '../../machine/model.js';
import {DEG,NS} from './geometry.js';
import {initMlcLeaves} from './treatment-head.js';
import {applySelectorMotion,enableSelectorTransitions} from './target-selector.js';

export function buildWaveguideCellSpecs(count=18){
  const first=20;
  const last=646;
  const pitch=(last-first)/count;
  return Array.from({length:count},(_,index)=>({
    index,
    left:first+pitch*index,
    right:first+pitch*(index+1),
    x:first+pitch*(index+.5),
    apertureRy:index<4?12:index<11?10:8
  }));
}

function initWaveguideCells(){
  const rf=document.querySelector('#rfCells');
  if(!rf||rf.childNodes.length)return;

  for(const cell of buildWaveguideCellSpecs()){
    const group=document.createElementNS(NS,'g');
    group.setAttribute('class','waveguideCell');
    group.style.setProperty('--cell-delay',`${(-cell.index*.07).toFixed(3)}s`);

    const chamber=document.createElementNS(NS,'path');
    chamber.setAttribute('d',[
      `M ${cell.left} ${-cell.apertureRy}`,
      `L ${cell.left} -35`,
      `Q ${cell.x} -43 ${cell.right} -35`,
      `L ${cell.right} ${-cell.apertureRy}`,
      `M ${cell.left} ${cell.apertureRy}`,
      `L ${cell.left} 35`,
      `Q ${cell.x} 43 ${cell.right} 35`,
      `L ${cell.right} ${cell.apertureRy}`
    ].join(' '));
    chamber.setAttribute('class','waveguideChamberWall');
    group.appendChild(chamber);

    for(const [y1,y2] of [[-35,-cell.apertureRy],[cell.apertureRy,35]]){
      const iris=document.createElementNS(NS,'line');
      iris.setAttribute('x1',cell.left);
      iris.setAttribute('x2',cell.left);
      iris.setAttribute('y1',y1);
      iris.setAttribute('y2',y2);
      iris.setAttribute('class','waveguideIris');
      group.appendChild(iris);
    }

    const centerMark=document.createElementNS(NS,'line');
    centerMark.setAttribute('x1',cell.x);
    centerMark.setAttribute('x2',cell.x);
    centerMark.setAttribute('y1',-cell.apertureRy+2);
    centerMark.setAttribute('y2',cell.apertureRy-2);
    centerMark.setAttribute('class','waveguideCellCenter');
    group.appendChild(centerMark);

    rf.appendChild(group);
  }
}

function initBellows(){
  const bellows=document.querySelector('#bellowsLines');
  if(!bellows||bellows.childNodes.length)return;

  const angle=-22.5*DEG;
  for(let i=0;i<7;i++){
    const fraction=(i+1)/8;
    const x=774+Math.cos(angle)*48*fraction;
    const y=514+Math.sin(angle)*48*fraction;
    const nx=-Math.sin(angle);
    const ny=Math.cos(angle);

    const line=document.createElementNS(NS,'line');
    line.setAttribute('x1',x-nx*20);
    line.setAttribute('y1',y-ny*20);
    line.setAttribute('x2',x+nx*20);
    line.setAttribute('y2',y+ny*20);
    line.setAttribute('stroke','#a9b9c8');
    line.setAttribute('stroke-width','2');
    bellows.appendChild(line);
  }
}

function scaleSlalomHardware(){
  const scale=MODEL.visual?.bendAssemblyScale||1;
  const [px,py]=MODEL.visual?.bendPivot||[805,499];
  const slalom=document.querySelector('#slalomHardware');
  if(!slalom)return;

  const tx=px*(1-scale);
  const ty=py*(1-scale);
  slalom.setAttribute('transform',`translate(${tx} ${ty}) scale(${scale})`);
}

function shiftTreatmentHead(){
  const shiftX=MODEL.visual?.headShiftX??-59;
  const transform=`translate(${shiftX} 0)`;

  for(const selector of [
    '[data-part="head"]',
    '#photonHead',
    '#electronHead',
    '[data-part="monitor"]',
    '[data-part="mirror"]',
    '#mlcGroup',
    '#jawsGroup',
    '#electronApplicator',
    '[data-part="patient"]',
    '#treatmentCone',
    '#centralRay'
  ]){
    const element=document.querySelector(selector);
    if(!element||element.hasAttribute('data-shifted'))continue;
    element.setAttribute('transform',transform);
    element.setAttribute('data-shifted','1');
  }

  document.querySelector('#selectorBase')?.setAttribute('transform',transform);
}

export function initHardware(){
  scaleSlalomHardware();
  initWaveguideCells();
  initBellows();
  initMlcLeaves();
  shiftTreatmentHead();
  enableSelectorTransitions();
  applySelectorMotion('photon');
}
