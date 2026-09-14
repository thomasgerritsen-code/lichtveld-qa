import {MODEL} from '../../machine/model.js';
import {DEG,NS} from './geometry.js';
import {initElectronWindowGraphics,initOpticalFieldGraphics,initPrimaryCollimatorGraphics,initTargetAssemblyGraphics} from './head-graphics.js';
import {initMlcLeaves,initMonitorChambers} from './treatment-head.js';
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

export function inputModeTransformerSpec(){
  return {
    // Normalized educational geometry. Public Elekta/SL descriptions place the
    // input mode transformer at the gun-side entrance of the travelling-wave structure.
    localX:20,
    localWidth:42,
    localHeight:54,
    rfFeedPath:'M356 865 C335 824 290 786 245 765 C224 755 208 751 194 752'
  };
}

export function electronGunTopologySpec(){
  return {
    // Educational topology only: cathode -> control/focusing electrode -> anode aperture.
    // Relative positions are normalized illustration coordinates, not OEM dimensions.
    cathodeX:7,
    controlX:39,
    anodeX:79,
    apertureHalfHeight:9,
    beamExitX:96
  };
}

function initElectronGunGraphics(){
  const gun=document.querySelector('[data-part="gun"] > g');
  if(!gun||gun.querySelector('#electronGunElectrodes'))return;
  const spec=electronGunTopologySpec();

  const group=document.createElementNS(NS,'g');
  group.setAttribute('id','electronGunElectrodes');
  group.setAttribute('data-geometry','normalized-educational');
  group.setAttribute('data-topology','cathode-control-anode');

  const control=document.createElementNS(NS,'path');
  control.setAttribute('d',`M${spec.controlX-9} -25 Q${spec.controlX+7} -16 ${spec.controlX+8} -${spec.apertureHalfHeight} M${spec.controlX-9} 25 Q${spec.controlX+7} 16 ${spec.controlX+8} ${spec.apertureHalfHeight}`);
  control.setAttribute('fill','none');
  control.setAttribute('stroke','#91d8ff');
  control.setAttribute('stroke-width','2.4');
  control.setAttribute('stroke-linecap','round');
  group.appendChild(control);

  const anode=document.createElementNS(NS,'path');
  anode.setAttribute('d',`M${spec.anodeX} -28 V-${spec.apertureHalfHeight} M${spec.anodeX} ${spec.apertureHalfHeight} V28`);
  anode.setAttribute('fill','none');
  anode.setAttribute('stroke','#d9e7f4');
  anode.setAttribute('stroke-width','4');
  anode.setAttribute('stroke-linecap','round');
  group.appendChild(anode);

  const injection=document.createElementNS(NS,'path');
  injection.setAttribute('d',`M${spec.cathodeX+5} 0 C${spec.controlX-2} 0 ${spec.anodeX-14} 0 ${spec.beamExitX} 0`);
  injection.setAttribute('fill','none');
  injection.setAttribute('stroke','#77dcff');
  injection.setAttribute('stroke-width','1.5');
  injection.setAttribute('stroke-dasharray','4 4');
  injection.setAttribute('opacity','.75');
  group.appendChild(injection);

  gun.appendChild(group);
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

function initInputModeTransformer(){
  const waveguide=document.querySelector('[data-part="waveguide"] > g');
  const feed=document.querySelector('#rfFeedPath');
  if(!waveguide||!feed)return;

  const spec=inputModeTransformerSpec();
  feed.setAttribute('d',spec.rfFeedPath);
  feed.setAttribute('data-rf-entry','gun-side');

  if(waveguide.querySelector('#inputModeTransformer'))return;
  const group=document.createElementNS(NS,'g');
  group.setAttribute('id','inputModeTransformer');
  group.setAttribute('data-geometry','normalized-educational');

  const coupler=document.createElementNS(NS,'path');
  const x=spec.localX,w=spec.localWidth,h=spec.localHeight;
  coupler.setAttribute('d',`M${x} ${h/2} V${h*.72} H${x+w} V${h/2}`);
  coupler.setAttribute('fill','none');
  coupler.setAttribute('stroke','#7fc9ff');
  coupler.setAttribute('stroke-width','5');
  coupler.setAttribute('stroke-linejoin','round');
  group.appendChild(coupler);

  const marker=document.createElementNS(NS,'rect');
  marker.setAttribute('x',x);
  marker.setAttribute('y',-18);
  marker.setAttribute('width',w);
  marker.setAttribute('height','36');
  marker.setAttribute('rx','8');
  marker.setAttribute('fill','none');
  marker.setAttribute('stroke','#7fc9ff');
  marker.setAttribute('stroke-width','2');
  marker.setAttribute('stroke-dasharray','5 4');
  group.appendChild(marker);

  waveguide.appendChild(group);
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
  initElectronGunGraphics();
  initWaveguideCells();
  initInputModeTransformer();
  initBellows();
  initTargetAssemblyGraphics();
  initElectronWindowGraphics();
  initPrimaryCollimatorGraphics();
  initMonitorChambers();
  initOpticalFieldGraphics();
  initMlcLeaves();
  shiftTreatmentHead();
  enableSelectorTransitions();
  applySelectorMotion('photon');
}
