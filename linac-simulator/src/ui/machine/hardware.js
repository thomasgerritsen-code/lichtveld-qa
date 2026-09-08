import {MODEL} from '../../machine/model.js';
import {DEG,NS} from './geometry.js';
import {initMlcLeaves} from './treatment-head.js';
import {applySelectorMotion,enableSelectorTransitions} from './target-selector.js';

function initWaveguideCells(){
  const rf=document.querySelector('#rfCells');
  if(!rf||rf.childNodes.length)return;

  for(let i=0;i<24;i++){
    const line=document.createElementNS(NS,'line');
    const x=20+i*25;
    line.setAttribute('x1',x);
    line.setAttribute('x2',x);
    line.setAttribute('y1',-30);
    line.setAttribute('y2',30);
    line.setAttribute('stroke','#2e4963');
    rf.appendChild(line);
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
