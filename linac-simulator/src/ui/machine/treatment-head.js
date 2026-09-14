import {NS} from './geometry.js';

export function agilityLeafRows(){
  // Public Agility descriptions specify 160 interdigitating leaves: 80 per bank.
  // The SVG pitch below is deliberately normalized to the existing drawing envelope;
  // it is not an OEM leaf dimension, mechanical clearance or calibration parameter.
  const leavesPerBank=80;
  const startY=971;
  const envelope=46.2;
  const pitch=envelope/leavesPerBank;
  const height=pitch*.82;
  return Array.from({length:leavesPerBank},(_,index)=>({index,y:startY+index*pitch,height}));
}

export function agilityLeafVisualState(row,bank='A'){
  // Peer-reviewed Agility geometry describes rounded leaf tips with an eccentric
  // curvature rather than a symmetric circular end. The offset below only makes
  // that topology visible at this schematic scale. It is deliberately normalized
  // and is not an OEM curvature radius, leaf thickness or manufacturing dimension.
  const tipControlFraction=.36;
  const bodyInner=bank==='A'?1410:1490;
  const tipInner=bank==='A'?1426:1474;
  const outer=bank==='A'?1327:1573;
  const controlY=row.y+row.height*tipControlFraction;
  const endY=row.y+row.height;
  const path=bank==='A'
    ?`M${outer} ${row.y} H${bodyInner} Q${tipInner} ${controlY} ${bodyInner} ${endY} H${outer} Z`
    :`M${outer} ${row.y} H${bodyInner} Q${tipInner} ${controlY} ${bodyInner} ${endY} H${outer} Z`;
  return {role:'agility-mlc-leaf',tipTopology:'eccentric-rounded-tip',tipControlFraction,path};
}

export function photonFilterVisualState(view={mode:'photon',filter:'ff'}){
  const filter=view.filter==='fff'?'fff':'ff';
  const visible=view.mode==='photon';
  if(filter==='fff')return {visible,role:'fff-filter-plate',path:'M1417 869 H1483 V876 H1417 Z'};
  return {visible,role:'flattening-filter',path:'M1415 852 L1485 852 L1469 893 L1431 893 Z'};
}

export function treatmentHeadApertureState(params,view={mode:'photon'}){
  const baseHalfGap=40;
  const photonHalfGap=18+92*params.fx;
  const desiredHalfGap=view.mode==='electron'?110:photonHalfGap;
  const mlcDelta=desiredHalfGap-baseHalfGap;
  const diaphragmGap=18+82*params.fy;
  return {desiredHalfGap,mlcDelta,diaphragmGap,jawGap:diaphragmGap,mlcRole:view.mode==='electron'?'parked':'field-shaping',orthogonalCollimatorRole:'sculpted-diaphragm-pair'};
}

export function agilityDiaphragmVisualState(params){
  const {diaphragmGap}=treatmentHeadApertureState(params,{mode:'photon'});
  const center=1450,outerHalfWidth=168,midY=1023,rearThickness=18,frontThickness=30,curve=13;
  const leftInner=center-diaphragmGap,rightInner=center+diaphragmGap,leftOuter=center-outerHalfWidth,rightOuter=center+outerHalfWidth;
  const rearTop=midY-rearThickness/2,rearBottom=midY+rearThickness/2,frontTop=midY-frontThickness/2,frontBottom=midY+frontThickness/2;
  return {
    role:'sculpted-diaphragm',topology:'thicker-curved-front-edge-with-thinner-rear-region',rearThickness,frontThickness,
    leftPath:`M${leftOuter} ${rearTop} H${leftInner-curve} L${leftInner-curve} ${frontTop} Q${leftInner} ${midY} ${leftInner-curve} ${frontBottom} L${leftInner-curve} ${rearBottom} H${leftOuter} Z`,
    rightPath:`M${rightOuter} ${rearTop} H${rightInner+curve} L${rightInner+curve} ${frontTop} Q${rightInner} ${midY} ${rightInner+curve} ${frontBottom} L${rightInner+curve} ${rearBottom} H${rightOuter} Z`
  };
}

export function monitorChamberVisualState(){
  return {
    role:'monitor-chamber-stack',housing:{x:1366,y:902,width:168,height:36,rx:9},
    dosePlanes:[{role:'primary-dose-monitor',y:909},{role:'backup-dose-monitor',y:918}],
    qualityPlane:{role:'beam-quality-monitor',y:927,collectionPlateCount:6,electrodeCount:7,seventhElectrode:{role:'beam-quality-seventh-electrode-indicator',y:934}}
  };
}

function ensureDiaphragmPath(id){
  const current=document.querySelector(`#${id}`);
  if(!current||current.tagName?.toLowerCase()==='path')return current;
  const path=document.createElementNS(NS,'path');
  for(const {name,value} of current.attributes)path.setAttribute(name,value);
  for(const name of ['x','y','width','height','rx'])path.removeAttribute(name);
  current.replaceWith(path);return path;
}

export function initMonitorChambers(){
  const group=document.querySelector('[data-part="monitor"]');if(!group||group.querySelector('[data-role="monitor-chamber-stack"]'))return;
  const visual=monitorChamberVisualState();group.setAttribute('data-role',visual.role);
  const housing=group.querySelector('.monitor');if(housing){for(const [name,value] of Object.entries(visual.housing))housing.setAttribute(name,String(value));housing.setAttribute('data-role','monitor-housing');housing.setAttribute('fill','#102c36');housing.setAttribute('stroke','#67d8cb')}
  for(const plane of visual.dosePlanes){const line=document.createElementNS(NS,'line');line.setAttribute('x1','1381');line.setAttribute('x2','1519');line.setAttribute('y1',String(plane.y));line.setAttribute('y2',String(plane.y));line.setAttribute('data-role',plane.role);line.setAttribute('stroke','#8ce8df');line.setAttribute('stroke-width','2.2');line.setAttribute('stroke-linecap','round');line.setAttribute('opacity','.86');group.appendChild(line)}
  const quality=document.createElementNS(NS,'g');quality.setAttribute('data-role',visual.qualityPlane.role);quality.setAttribute('data-collection-plate-count',String(visual.qualityPlane.collectionPlateCount));quality.setAttribute('data-electrode-count',String(visual.qualityPlane.electrodeCount));
  const plateWidth=18,gap=4,total=visual.qualityPlane.collectionPlateCount*plateWidth+(visual.qualityPlane.collectionPlateCount-1)*gap,startX=1450-total/2;
  for(let index=0;index<visual.qualityPlane.collectionPlateCount;index++){const plate=document.createElementNS(NS,'rect');plate.setAttribute('x',String(startX+index*(plateWidth+gap)));plate.setAttribute('y',String(visual.qualityPlane.y-2.2));plate.setAttribute('width',String(plateWidth));plate.setAttribute('height','4.4');plate.setAttribute('rx','1.5');plate.setAttribute('data-collection-plate-index',String(index));plate.setAttribute('fill','#67d8cb');plate.setAttribute('opacity','.62');quality.appendChild(plate)}
  const seventh=document.createElementNS(NS,'line');seventh.setAttribute('x1','1392');seventh.setAttribute('x2','1508');seventh.setAttribute('y1',String(visual.qualityPlane.seventhElectrode.y));seventh.setAttribute('y2',String(visual.qualityPlane.seventhElectrode.y));seventh.setAttribute('data-role',visual.qualityPlane.seventhElectrode.role);seventh.setAttribute('stroke','#c0fff8');seventh.setAttribute('stroke-width','1.4');seventh.setAttribute('stroke-dasharray','4 3');seventh.setAttribute('opacity','.66');quality.appendChild(seventh);group.appendChild(quality);
  const marker=document.createElementNS(NS,'g');marker.setAttribute('data-role','monitor-chamber-stack');marker.setAttribute('aria-hidden','true');group.appendChild(marker);
}

export function initMlcLeaves(){
  const left=document.querySelector('#mlcLeft'),right=document.querySelector('#mlcRight');if(!left||!right||left.childNodes.length)return;
  for(const row of agilityLeafRows()){
    for(const [group,bank] of [[left,'A'],[right,'B']]){
      const visual=agilityLeafVisualState(row,bank);const leaf=document.createElementNS(NS,'path');leaf.setAttribute('d',visual.path);leaf.setAttribute('class','mlcLeaf');leaf.setAttribute('data-bank',bank);leaf.setAttribute('data-leaf-index',String(row.index));leaf.setAttribute('data-role',visual.role);leaf.setAttribute('data-tip-topology',visual.tipTopology);leaf.setAttribute('stroke-width','.16');group.appendChild(leaf);
    }
  }
  for(const group of [left,right]){group.style.transition='transform .18s ease';group.style.transformBox='fill-box'}
}

export function updateTreatmentHead(params,view,delivery=null){
  const center=1450,patientY=1080,aperture=treatmentHeadApertureState(params,view);
  const left=document.querySelector('#mlcLeft'),right=document.querySelector('#mlcRight');if(left){left.style.transform=`translateX(${-aperture.mlcDelta}px)`;left.setAttribute('data-role',aperture.mlcRole)}if(right){right.style.transform=`translateX(${aperture.mlcDelta}px)`;right.setAttribute('data-role',aperture.mlcRole)}
  const diaphragmVisual=agilityDiaphragmVisualState(params),jawL=ensureDiaphragmPath('jawL'),jawR=ensureDiaphragmPath('jawR');if(jawL){jawL.setAttribute('d',diaphragmVisual.leftPath);jawL.setAttribute('data-role',diaphragmVisual.role);jawL.setAttribute('data-topology',diaphragmVisual.topology)}if(jawR){jawR.setAttribute('d',diaphragmVisual.rightPath);jawR.setAttribute('data-role',diaphragmVisual.role);jawR.setAttribute('data-topology',diaphragmVisual.topology)}
  const filterVisual=photonFilterVisualState(view),filterGroup=document.querySelector('#flatteningFilter'),filterShape=filterGroup?.querySelector('.filterShape');if(filterShape){filterShape.setAttribute('d',filterVisual.path);filterShape.setAttribute('data-role',filterVisual.role)}if(filterGroup){filterGroup.hidden=!filterVisual.visible;filterGroup.setAttribute('data-filter',view.filter==='fff'?'fff':'ff')}
  const electronBroad=.92+.08*(1-params.energy);const half=view.mode==='electron'?105+150*Math.min(params.fx,params.fy)*electronBroad:70+125*params.fx;
  const cone=document.querySelector('#treatmentCone');cone?.setAttribute('d',`M ${center-4} 774 L ${center+4} 774 L ${center+half} ${patientY} L ${center-half} ${patientY} Z`);cone?.setAttribute('fill',view.mode==='electron'?'url(#electronCone)':'url(#photonCone)');
  const useful=delivery?.beamActive?Math.max(0,Math.min(1,delivery.outputFraction??delivery.beamQuality)):0;if(cone)cone.style.opacity=String(Math.max(0,Math.min(1,useful)));const central=document.querySelector('#centralRay');if(central){central.style.opacity=String(Math.max(0,Math.min(1,useful)));central.classList.toggle('electronMode',view.mode==='electron')}
}
