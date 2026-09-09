import {MODEL} from '../../machine/model.js';
import {DEG,NS} from './geometry.js';
import {initMlcLeaves} from './treatment-head.js';
import {applySelectorMotion,enableSelectorTransitions} from './target-selector.js';

export function buildWaveguideCellSpecs(count=32){
  const first=18;
  const last=622;
  return Array.from({length:count},(_,index)=>({
    index,
    x:first+(last-first)*index/(count-1),
    apertureRy:index<5?10:index<18?8.5:7.5
  }));
}

function initWaveguideCells(){
  const rf=document.querySelector('#rfCells');
  if(!rf||rf.childNodes.length)return;

  for(const cell of buildWaveguideCellSpecs()){
    const group=document.createElementNS(NS,'g');
    group.setAttribute('class','waveguideCell');
    group.style.setProperty('--cell-delay',`${(-cell.index*.045).toFixed(3)}s`);

    for(const [y1,y2] of [[-34,-cell.apertureRy],[cell.apertureRy,34]]){
      const iris=document.createElementNS(NS,'line');
      iris.setAttribute('x1',cell.x);
      iris.setAttribute('x2',cell.x);
      iris.setAttribute('y1',y1);
      iris.setAttribute('y2',y2);
      iris.setAttribute('class','waveguideIris');
      group.appendChild(iris);
    }

    const aperture=document.createElementNS(NS,'ellipse');
    aperture.setAttribute('cx',cell.x);
    aperture.setAttribute('cy','0');
    aperture.setAttribute('rx','3.2');
    aperture.setAttribute('ry',cell.apertureRy);
    aperture.setAttribute('class','waveguideAperture');
    group.appendChild(aperture);

    if(cell.index<31){
      const nextX=18+(622-18)*(cell.index+1)/31;
      const chamber=document.createElementNS(NS,'path');
      chamber.setAttribute('d',`M ${cell.x} -34 Q ${(cell.x+nextX)/2} -27 ${nextX} -34 M ${cell.x} 34 Q ${(cell.x+nextX)/2} 27 ${nextX} 34`);
      chamber.setAttribute('class','waveguideChamberWall');
      group.appendChild(chamber);
    }

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
