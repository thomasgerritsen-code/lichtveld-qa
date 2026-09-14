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
  const jawGap=18+82*params.fy;

  return {
    desiredHalfGap,
    mlcDelta,
    jawGap,
    mlcRole:view.mode==='electron'?'parked':'field-shaping'
  };
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

  const jawL=document.querySelector('#jawL');
  const jawR=document.querySelector('#jawR');
  if(jawL)jawL.setAttribute('x',center-aperture.jawGap-78);
  if(jawR)jawR.setAttribute('x',center+aperture.jawGap);

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
