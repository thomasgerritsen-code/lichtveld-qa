import {MODEL} from '../../machine/model.js';
import {DEG,NS,buildMechanicalGeometry,tangentNormal,pathD,headTranslationX} from './geometry.js';
import {initElectronWindowGraphics,initOpticalFieldGraphics,initPrimaryCollimatorGraphics,initTargetAssemblyGraphics,initTreatmentHeadHousingGraphics} from './head-graphics.js';
import {initMlcLeaves,initMonitorChambers} from './treatment-head.js';
import {applySelectorMotion,enableSelectorTransitions} from './target-selector.js';

export function buildWaveguideCellSpecs(count=18){const first=20,last=646,pitch=(last-first)/count;return Array.from({length:count},(_,index)=>({index,left:first+pitch*index,right:first+pitch*(index+1),x:first+pitch*(index+.5),apertureRy:index<4?12:index<11?10:8}));}
export function inputModeTransformerSpec(){return {localX:20,localWidth:42,localHeight:54,rfFeedPath:'M356 865 C335 824 290 786 245 765 C224 755 208 751 194 752'};}
export function electronGunTopologySpec(){return {cathodeX:7,controlX:39,anodeX:79,apertureHalfHeight:9,beamExitX:96};}
export function slalomTopologyVisualState(){
  const geometry=buildMechanicalGeometry();
  return [
    {id:'m1',role:'first-dispersive-bend',halfLength:35,halfGap:26,poleDepth:12},
    {id:'m2',role:'counter-bend',halfLength:35,halfGap:26,poleDepth:12},
    {id:'m3',role:'final-achromatic-bend',halfLength:50,halfGap:26,poleDepth:15}
  ].map(definition=>{
    const sector=geometry.sectors[definition.id];
    const index=Math.round((sector.start+sector.end)/2);
    const point=geometry.points[index],tangent=tangentNormal(geometry.points,index);
    const arc=geometry.points.slice(sector.start,sector.end+1);
    const offset=distance=>arc.map((p,i)=>{
      const n=tangentNormal(arc,i);
      return {x:p.x+n.nx*distance,y:p.y+n.ny*distance};
    });
    const polePaths=[-1,1].map(sign=>pathD([
      ...offset(sign*definition.halfGap),
      ...offset(sign*(definition.halfGap+definition.poleDepth)).reverse()
    ])+' Z');
    return {...definition,...point,angleDeg:Math.atan2(tangent.ty,tangent.tx)/DEG,
      pathIndex:index,sector,polePaths};
  });
}

function initGunWaveguideVacuumAssembly(){const gun=document.querySelector('[data-part="gun"] > g'),waveguide=document.querySelector('[data-part="waveguide"] > g');if(!gun||!waveguide)return;gun.setAttribute('data-vacuum-assembly','gun-neck-anode-flange');waveguide.setAttribute('data-vacuum-assembly','input-coupler-accelerating-guide');if(!gun.querySelector('#gunVacuumHousing')){const g=document.createElementNS(NS,'g');g.id='gunVacuumHousing';g.setAttribute('data-geometry','normalized-educational');g.setAttribute('pointer-events','none');const shell=document.createElementNS(NS,'path');shell.setAttribute('d','M-18 -38 H54 Q70 -38 82 -27 L101 -14 V14 L82 27 Q70 38 54 38 H-18');shell.setAttribute('fill','none');shell.setAttribute('stroke','#7890a4');shell.setAttribute('stroke-width','3');shell.setAttribute('opacity','.8');g.appendChild(shell);for(const x of [82,96]){const flange=document.createElementNS(NS,'line');flange.setAttribute('x1',x);flange.setAttribute('x2',x);flange.setAttribute('y1','-27');flange.setAttribute('y2','27');flange.setAttribute('stroke','#aebdca');flange.setAttribute('stroke-width',x===96?'5':'3');g.appendChild(flange);}gun.insertBefore(g,gun.firstChild);}if(!waveguide.querySelector('#acceleratorVacuumEnvelope')){const g=document.createElementNS(NS,'g');g.id='acceleratorVacuumEnvelope';g.setAttribute('data-geometry','normalized-educational');g.setAttribute('data-role','continuous-vacuum-housing');g.setAttribute('pointer-events','none');const shell=document.createElementNS(NS,'path');shell.setAttribute('d','M0 -47 H660 M0 47 H660');shell.setAttribute('fill','none');shell.setAttribute('stroke','#6f8799');shell.setAttribute('stroke-width','3');shell.setAttribute('opacity','.72');g.appendChild(shell);for(const x of [0,12,660]){const f=document.createElementNS(NS,'line');f.setAttribute('x1',x);f.setAttribute('x2',x);f.setAttribute('y1','-47');f.setAttribute('y2','47');f.setAttribute('stroke','#9fb0bd');f.setAttribute('stroke-width',x===12?'2':'4');g.appendChild(f);}waveguide.insertBefore(g,waveguide.firstChild);}}
function initElectronGunGraphics(){const gun=document.querySelector('[data-part="gun"] > g');if(!gun||gun.querySelector('#electronGunElectrodes'))return;const spec=electronGunTopologySpec(),group=document.createElementNS(NS,'g');group.id='electronGunElectrodes';group.setAttribute('data-geometry','normalized-educational');group.setAttribute('data-topology','cathode-control-anode');const control=document.createElementNS(NS,'path');control.setAttribute('d',`M${spec.controlX-9} -25 Q${spec.controlX+7} -16 ${spec.controlX+8} -${spec.apertureHalfHeight} M${spec.controlX-9} 25 Q${spec.controlX+7} 16 ${spec.controlX+8} ${spec.apertureHalfHeight}`);control.setAttribute('fill','none');control.setAttribute('stroke','#91d8ff');control.setAttribute('stroke-width','2.4');group.appendChild(control);const anode=document.createElementNS(NS,'path');anode.setAttribute('d',`M${spec.anodeX} -28 V-${spec.apertureHalfHeight} M${spec.anodeX} ${spec.apertureHalfHeight} V28`);anode.setAttribute('fill','none');anode.setAttribute('stroke','#d9e7f4');anode.setAttribute('stroke-width','4');group.appendChild(anode);const injection=document.createElementNS(NS,'path');injection.setAttribute('d',`M${spec.cathodeX+5} 0 C${spec.controlX-2} 0 ${spec.anodeX-14} 0 ${spec.beamExitX} 0`);injection.setAttribute('fill','none');injection.setAttribute('stroke','#77dcff');injection.setAttribute('stroke-width','1.5');injection.setAttribute('stroke-dasharray','4 4');injection.setAttribute('opacity','.75');group.appendChild(injection);gun.appendChild(group);}
function initWaveguideCells(){const rf=document.querySelector('#rfCells');if(!rf||rf.childNodes.length)return;for(const cell of buildWaveguideCellSpecs()){const group=document.createElementNS(NS,'g');group.setAttribute('class','waveguideCell');group.style.setProperty('--cell-delay',`${(-cell.index*.07).toFixed(3)}s`);const chamber=document.createElementNS(NS,'path');chamber.setAttribute('d',[`M ${cell.left} ${-cell.apertureRy}`,`L ${cell.left} -35`,`Q ${cell.x} -43 ${cell.right} -35`,`L ${cell.right} ${-cell.apertureRy}`,`M ${cell.left} ${cell.apertureRy}`,`L ${cell.left} 35`,`Q ${cell.x} 43 ${cell.right} 35`,`L ${cell.right} ${cell.apertureRy}`].join(' '));chamber.setAttribute('class','waveguideChamberWall');group.appendChild(chamber);for(const [y1,y2] of [[-35,-cell.apertureRy],[cell.apertureRy,35]]){const iris=document.createElementNS(NS,'line');iris.setAttribute('x1',cell.left);iris.setAttribute('x2',cell.left);iris.setAttribute('y1',y1);iris.setAttribute('y2',y2);iris.setAttribute('class','waveguideIris');group.appendChild(iris);}rf.appendChild(group);}}
function initInputModeTransformer(){const waveguide=document.querySelector('[data-part="waveguide"] > g'),feed=document.querySelector('#rfFeedPath');if(!waveguide||!feed)return;const spec=inputModeTransformerSpec();feed.setAttribute('d',spec.rfFeedPath);feed.setAttribute('data-rf-entry','gun-side');if(!document.querySelector('#rfFeedHousing')){const housing=document.createElementNS(NS,'path');housing.id='rfFeedHousing';housing.setAttribute('d',spec.rfFeedPath);housing.setAttribute('fill','none');housing.setAttribute('stroke','#607d98');housing.setAttribute('stroke-width','9');feed.parentNode.insertBefore(housing,feed);}if(waveguide.querySelector('#inputModeTransformer'))return;const group=document.createElementNS(NS,'g');group.id='inputModeTransformer';group.setAttribute('data-geometry','normalized-educational');const coupler=document.createElementNS(NS,'path'),x=spec.localX,w=spec.localWidth,h=spec.localHeight;coupler.setAttribute('d',`M${x} ${h/2} V${h*.72} H${x+w} V${h/2}`);coupler.setAttribute('fill','none');coupler.setAttribute('stroke','#7fc9ff');coupler.setAttribute('stroke-width','5');group.appendChild(coupler);waveguide.appendChild(group);}
function initBellows(){const bellows=document.querySelector('#bellowsLines');if(!bellows||bellows.childNodes.length)return;const angle=-22.5*DEG;for(let i=0;i<7;i++){const fraction=(i+1)/8,x=774+Math.cos(angle)*48*fraction,y=514+Math.sin(angle)*48*fraction,nx=-Math.sin(angle),ny=Math.cos(angle),line=document.createElementNS(NS,'line');line.setAttribute('x1',x-nx*20);line.setAttribute('y1',y-ny*20);line.setAttribute('x2',x+nx*20);line.setAttribute('y2',y+ny*20);line.setAttribute('stroke','#a9b9c8');line.setAttribute('stroke-width','2');bellows.appendChild(line);}}
function initSlalomTopologyGraphics(){
  const slalom=document.querySelector('#slalomHardware');
  if(!slalom||slalom.querySelector('#slalomTopologyOverlay'))return;
  // All dynamic hardware is already in world coordinates. Retire the old
  // independently scaled housing and poles instead of stacking both drawings.
  slalom.removeAttribute('transform');
  for(const legacy of slalom.querySelectorAll('.magnetPole,.bendHousing'))legacy.remove();
  const geometry=buildMechanicalGeometry(),overlay=document.createElementNS(NS,'g');
  overlay.id='slalomTopologyOverlay';
  overlay.setAttribute('data-geometry','normalized-educational');
  for(const station of slalomTopologyVisualState()){
    const group=document.createElementNS(NS,'g');
    group.setAttribute('class','slalomMagnetStation');
    group.setAttribute('data-stage',station.id);
    group.setAttribute('data-role',station.role);
    for(const d of station.polePaths){
      const pole=document.createElementNS(NS,'path');
      pole.setAttribute('class','magnetPole slalomPoleShoe');
      pole.setAttribute('d',d);
      group.appendChild(pole);
    }
    overlay.appendChild(group);
  }
  slalom.appendChild(overlay);
  // One moving vacuum tube through the fixed sector magnets, continuing all
  // the way to the target/window instead of ending in an unrelated capsule.
  const end=geometry.points.at(-1);
  const tubePoints=[...geometry.points,{x:end.x,y:760}];
  for(const id of ['flightOuter','flightInner'])
    document.querySelector('#'+id)?.setAttribute('d',pathD(tubePoints));
}
function shiftTreatmentHead(){const shiftX=headTranslationX(),transform=`translate(${shiftX} 0)`;for(const selector of ['[data-part="head"]','#photonHead','#electronHead','[data-part="monitor"]','[data-part="mirror"]','#mlcGroup','#jawsGroup','#electronApplicator','[data-part="patient"]','#treatmentCone','#centralRay']){const element=document.querySelector(selector);if(!element||element.hasAttribute('data-shifted'))continue;element.setAttribute('transform',transform);element.setAttribute('data-shifted','1');}document.querySelector('#selectorBase')?.setAttribute('transform',transform);}
export function initHardware(){initSlalomTopologyGraphics();initGunWaveguideVacuumAssembly();initElectronGunGraphics();initWaveguideCells();initInputModeTransformer();initBellows();initTreatmentHeadHousingGraphics();initTargetAssemblyGraphics();initElectronWindowGraphics();initPrimaryCollimatorGraphics();initMonitorChambers();initOpticalFieldGraphics();initMlcLeaves();shiftTreatmentHead();enableSelectorTransitions();applySelectorMotion('photon');}
