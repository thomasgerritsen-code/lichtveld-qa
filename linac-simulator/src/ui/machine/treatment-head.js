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
  return Array.from({length:leavesPerBank},(_,index)=>({
    index,
    y:startY+index*pitch,
    height
  }));
}

export function photonFilterVisualState(view={mode:'photon',filter:'ff'}){
  const filter=view.filter==='fff'?'fff':'ff';
  const visible=view.mode==='photon';

  // AAPM's public FFF report describes Elekta FFF beams as using a thin filtering
  // disc/plate in place of the conventional flattening filter. Represent only that
  // topology here: the SVG paths are normalized illustration geometry, not physical
  // dimensions, material thicknesses, OEM carousel positions or service settings.
  // Both FF and FFF therefore keep a photon filtering element visible; electron mode
  // uses its separate scattering-foil head and does not display this photon element.
  if(filter==='fff'){
    return {
      visible,
      role:'fff-filter-plate',
      path:'M1417 869 H1483 V876 H1417 Z'
    };
  }
  return {
    visible,
    role:'flattening-filter',
    path:'M1415 852 L1485 852 L1469 893 L1431 893 Z'
  };
}

export function treatmentHeadApertureState(params,view={mode:'photon'}){
  const baseHalfGap=40;
  const photonHalfGap=18+92*params.fx;

  // Integrity's public DICOM conformance statement lists MLCX for photon beams,
  // but not for electron beams; electron field definition is represented through
  // applicator/diaphragm information instead. In electron mode, park the Agility
  // leaves outside the illustrated treatment aperture rather than implying that
  // leaf motion shapes the electron field. The 110 value is only the normalized
  // SVG drawing envelope already used by the photon control at full opening; it is
  // not an OEM leaf position, travel limit, clearance or clinical setting.
  const desiredHalfGap=view.mode==='electron'?110:photonHalfGap;
  const mlcDelta=desiredHalfGap-baseHalfGap;

  // Public Versa HD/Agility beam-model descriptions identify the axis orthogonal
  // to the MLC as a pair of sculpted diaphragms. Keep the existing normalized Y
  // aperture response, but name its role explicitly instead of implying a second
  // conventional jaw pair. This is topology/semantics only: no OEM positions,
  // dimensions, transmission values or mechanical limits are represented here.
  const diaphragmGap=18+82*params.fy;

  return {
    desiredHalfGap,
    mlcDelta,
    diaphragmGap,
    // Compatibility alias for older callers/tests while the UI terminology moves
    // from generic 'jaw' wording to the Agility-specific diaphragm role.
    jawGap:diaphragmGap,
    mlcRole:view.mode==='electron'?'parked':'field-shaping',
    orthogonalCollimatorRole:'sculpted-diaphragm-pair'
  };
}

export function agilityDiaphragmVisualState(params){
  const {diaphragmGap}=treatmentHeadApertureState(params,{mode:'photon'});
  const center=1450;
  const outerHalfWidth=168;
  const midY=1023;
  const rearThickness=18;
  const frontThickness=30;
  const curve=13;
  const leftInner=center-diaphragmGap;
  const rightInner=center+diaphragmGap;
  const leftOuter=center-outerHalfWidth;
  const rightOuter=center+outerHalfWidth;
  const rearTop=midY-rearThickness/2;
  const rearBottom=midY+rearThickness/2;
  const frontTop=midY-frontThickness/2;
  const frontBottom=midY+frontThickness/2;

  // Elekta's public sculpted-diaphragm patent describes a thicker front edge with
  // relatively thinner regions behind it, and explicitly allows a curved front face
  // to control penumbra as the diaphragm moves. The drawing exaggerates only that
  // topology: all coordinates and thickness ratios are normalized illustration values,
  // not OEM dimensions, attenuation data, clearances, travel limits or service settings.
  return {
    role:'sculpted-diaphragm',
    topology:'thicker-curved-front-edge-with-thinner-rear-region',
    rearThickness,
    frontThickness,
    leftPath:`M${leftOuter} ${rearTop} H${leftInner-curve} L${leftInner-curve} ${frontTop} Q${leftInner} ${midY} ${leftInner-curve} ${frontBottom} L${leftInner-curve} ${rearBottom} H${leftOuter} Z`,
    rightPath:`M${rightOuter} ${rearTop} H${rightInner+curve} L${rightInner+curve} ${frontTop} Q${rightInner} ${midY} ${rightInner+curve} ${frontBottom} L${rightInner+curve} ${rearBottom} H${rightOuter} Z`
  };
}

export function monitorChamberVisualState(){
  // Public Elekta information describes two independent ionization chambers for
  // dose monitoring and a third beam-quality chamber using seven electrodes.
  // AAPM resolves that third chamber further as six collection plates arranged to
  // provide uniformity signals. The drawing therefore shows those six collection
  // regions plus a visibly separate seventh-electrode indicator. Its exact electrical
  // role is deliberately not asserted because the public sources used here do not
  // define it. Geometry is normalized SVG illustration only, not chamber thickness,
  // spacing, calibration, internal construction or service data.
  return {
    role:'monitor-chamber-stack',
    housing:{x:1366,y:902,width:168,height:36,rx:9},
    dosePlanes:[
      {role:'primary-dose-monitor',y:909},
      {role:'backup-dose-monitor',y:918}
    ],
    qualityPlane:{
      role:'beam-quality-monitor',
      y:927,
      collectionPlateCount:6,
      electrodeCount:7,
      seventhElectrode:{
        role:'beam-quality-seventh-electrode-indicator',
        y:934
      }
    }
  };
}

function ensureDiaphragmPath(id){
  const current=document.querySelector(`#${id}`);
  if(!current||current.tagName?.toLowerCase()==='path')return current;
  const path=document.createElementNS(NS,'path');
  for(const {name,value} of current.attributes)path.setAttribute(name,value);
  path.removeAttribute('x');
  path.removeAttribute('y');
  path.removeAttribute('width');
  path.removeAttribute('height');
  path.removeAttribute('rx');
  current.replaceWith(path);
  return path;
}

export function initMonitorChambers(){
  const group=document.querySelector('[data-part="monitor"]');
  if(!group||group.querySelector('[data-role="monitor-chamber-stack"]'))return;

  const visual=monitorChamberVisualState();
  group.setAttribute('data-role',visual.role);

  const housing=group.querySelector('.monitor');
  if(housing){
    for(const [name,value] of Object.entries(visual.housing))housing.setAttribute(name,String(value));
    housing.setAttribute('data-role','monitor-housing');
    housing.setAttribute('fill','#102c36');
    housing.setAttribute('stroke','#67d8cb');
  }

  for(const plane of visual.dosePlanes){
    const line=document.createElementNS(NS,'line');
    line.setAttribute('x1','1381');
    line.setAttribute('x2','1519');
    line.setAttribute('y1',String(plane.y));
    line.setAttribute('y2',String(plane.y));
    line.setAttribute('data-role',plane.role);
    line.setAttribute('stroke','#8ce8df');
    line.setAttribute('stroke-width','2.2');
    line.setAttribute('stroke-linecap','round');
    line.setAttribute('opacity','.86');
    group.appendChild(line);
  }

  const quality=document.createElementNS(NS,'g');
  quality.setAttribute('data-role',visual.qualityPlane.role);
  quality.setAttribute('data-collection-plate-count',String(visual.qualityPlane.collectionPlateCount));
  quality.setAttribute('data-electrode-count',String(visual.qualityPlane.electrodeCount));
  const plateWidth=18;
  const gap=4;
  const total=visual.qualityPlane.collectionPlateCount*plateWidth+(visual.qualityPlane.collectionPlateCount-1)*gap;
  const startX=1450-total/2;
  for(let index=0;index<visual.qualityPlane.collectionPlateCount;index++){
    const plate=document.createElementNS(NS,'rect');
    plate.setAttribute('x',String(startX+index*(plateWidth+gap)));
    plate.setAttribute('y',String(visual.qualityPlane.y-2.2));
    plate.setAttribute('width',String(plateWidth));
    plate.setAttribute('height','4.4');
    plate.setAttribute('rx','1.5');
    plate.setAttribute('data-collection-plate-index',String(index));
    plate.setAttribute('fill','#67d8cb');
    plate.setAttribute('opacity','.62');
    quality.appendChild(plate);
  }

  const seventh=document.createElementNS(NS,'line');
  seventh.setAttribute('x1','1392');
  seventh.setAttribute('x2','1508');
  seventh.setAttribute('y1',String(visual.qualityPlane.seventhElectrode.y));
  seventh.setAttribute('y2',String(visual.qualityPlane.seventhElectrode.y));
  seventh.setAttribute('data-role',visual.qualityPlane.seventhElectrode.role);
  seventh.setAttribute('stroke','#c0fff8');
  seventh.setAttribute('stroke-width','1.4');
  seventh.setAttribute('stroke-dasharray','4 3');
  seventh.setAttribute('opacity','.66');
  quality.appendChild(seventh);
  group.appendChild(quality);

  const marker=document.createElementNS(NS,'g');
  marker.setAttribute('data-role','monitor-chamber-stack');
  marker.setAttribute('aria-hidden','true');
  group.appendChild(marker);
}

export function initMlcLeaves(){
  const left=document.querySelector('#mlcLeft');
  const right=document.querySelector('#mlcRight');
  if(!left||!right||left.childNodes.length)return;

  for(const row of agilityLeafRows()){
    const {index,y,height:h}=row;
    const leafLeft=document.createElementNS(NS,'path');
    leafLeft.setAttribute('d',`M1327 ${y} H1410 Q1426 ${y+h/2} 1410 ${y+h} H1327 Z`);
    leafLeft.setAttribute('class','mlcLeaf');
    leafLeft.setAttribute('data-bank','A');
    leafLeft.setAttribute('data-leaf-index',String(index));
    leafLeft.setAttribute('stroke-width','.16');
    left.appendChild(leafLeft);

    const leafRight=document.createElementNS(NS,'path');
    leafRight.setAttribute('d',`M1573 ${y} H1490 Q1474 ${y+h/2} 1490 ${y+h} H1573 Z`);
    leafRight.setAttribute('class','mlcLeaf');
    leafRight.setAttribute('data-bank','B');
    leafRight.setAttribute('data-leaf-index',String(index));
    leafRight.setAttribute('stroke-width','.16');
    right.appendChild(leafRight);
  }

  for(const group of [left,right]){
    group.style.transition='transform .18s ease';
    group.style.transformBox='fill-box';
  }
}

export function updateTreatmentHead(params,view,delivery=null){
  const center=1450;
  const patientY=1080;
  const aperture=treatmentHeadApertureState(params,view);

  const left=document.querySelector('#mlcLeft');
  const right=document.querySelector('#mlcRight');
  if(left){
    left.style.transform=`translateX(${-aperture.mlcDelta}px)`;
    left.setAttribute('data-role',aperture.mlcRole);
  }
  if(right){
    right.style.transform=`translateX(${aperture.mlcDelta}px)`;
    right.setAttribute('data-role',aperture.mlcRole);
  }

  const diaphragmVisual=agilityDiaphragmVisualState(params);
  const jawL=ensureDiaphragmPath('jawL');
  const jawR=ensureDiaphragmPath('jawR');
  if(jawL){
    jawL.setAttribute('d',diaphragmVisual.leftPath);
    jawL.setAttribute('data-role',diaphragmVisual.role);
    jawL.setAttribute('data-topology',diaphragmVisual.topology);
  }
  if(jawR){
    jawR.setAttribute('d',diaphragmVisual.rightPath);
    jawR.setAttribute('data-role',diaphragmVisual.role);
    jawR.setAttribute('data-topology',diaphragmVisual.topology);
  }

  const filterVisual=photonFilterVisualState(view);
  const filterGroup=document.querySelector('#flatteningFilter');
  const filterShape=filterGroup?.querySelector('.filterShape');
  if(filterShape){
    filterShape.setAttribute('d',filterVisual.path);
    filterShape.setAttribute('data-role',filterVisual.role);
  }
  if(filterGroup){
    filterGroup.hidden=!filterVisual.visible;
    filterGroup.setAttribute('data-filter',view.filter==='fff'?'fff':'ff');
  }

  const electronBroad=.92+.08*(1-params.energy);
  const half=view.mode==='electron'
    ?105+150*Math.min(params.fx,params.fy)*electronBroad
    :70+125*params.fx;

  const cone=document.querySelector('#treatmentCone');
  cone?.setAttribute(
    'd',
    `M ${center-4} 774 L ${center+4} 774 L ${center+half} ${patientY} L ${center-half} ${patientY} Z`
  );
  cone?.setAttribute('fill',view.mode==='electron'?'url(#electronCone)':'url(#photonCone)');

  const useful=delivery?.beamActive?Math.max(0,Math.min(1,delivery.outputFraction??delivery.beamQuality)):0;
  if(cone) cone.style.opacity=String(Math.max(0,Math.min(1,useful)));
  const central=document.querySelector('#centralRay');
  if(central){
    central.style.opacity=String(Math.max(0,Math.min(1,useful)));
    central.classList.toggle('electronMode',view.mode==='electron');
  }
}
