import {NS} from './geometry.js';

export function initMlcLeaves(){
  const left=document.querySelector('#mlcLeft');
  const right=document.querySelector('#mlcRight');
  if(!left||!right||left.childNodes.length)return;

  for(let i=0;i<14;i++){
    const y=971+i*3.3,h=2.7;

    const leafLeft=document.createElementNS(NS,'path');
    leafLeft.setAttribute('d',`M1327 ${y} H1410 Q1426 ${y+h/2} 1410 ${y+h} H1327 Z`);
    leafLeft.setAttribute('class','mlcLeaf');
    left.appendChild(leafLeft);

    const leafRight=document.createElementNS(NS,'path');
    leafRight.setAttribute('d',`M1573 ${y} H1490 Q1474 ${y+h/2} 1490 ${y+h} H1573 Z`);
    leafRight.setAttribute('class','mlcLeaf');
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

  const baseHalfGap=40;
  const desiredHalfGap=18+92*params.fx;
  const mlcDelta=desiredHalfGap-baseHalfGap;

  const left=document.querySelector('#mlcLeft');
  const right=document.querySelector('#mlcRight');
  if(left)left.style.transform=`translateX(${-mlcDelta}px)`;
  if(right)right.style.transform=`translateX(${mlcDelta}px)`;

  const jawGap=18+82*params.fy;
  const jawL=document.querySelector('#jawL');
  const jawR=document.querySelector('#jawR');
  if(jawL)jawL.setAttribute('x',center-jawGap-78);
  if(jawR)jawR.setAttribute('x',center+jawGap);

  const electronBroad=.92+.08*(1-params.energy);
  const half=view.mode==='electron'
    ?105+150*Math.min(params.fx,params.fy)*electronBroad
    :70+125*params.fx;

  const cone=document.querySelector('#treatmentCone');
  cone?.setAttribute(
    'd',
    `M ${center-4} 774 L ${center+4} 774 L ${center+half} ${patientY} L ${center-half} ${patientY} Z`
  );

  const useful=delivery?.beamActive?Math.max(0,Math.min(1,delivery.outputFraction??delivery.beamQuality)):0;
  if(cone) cone.style.opacity=String(Math.max(0,Math.min(1,useful)));
  const central=document.querySelector('#centralRay');
  if(central) central.style.opacity=String(Math.max(0,Math.min(1,useful)));
}
