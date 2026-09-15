import {NS} from './geometry.js';

export function agilityLeafGuideVisualState(bank='A'){
  // Public Agility descriptions identify an integrated dynamic leaf guide for each
  // leaf bank. Coordinates below only frame the existing normalized SVG leaf-bank
  // envelope; they are not OEM dimensions, travel limits or service geometry.
  const left=bank==='A';
  const outer=left?1319:1581;
  const inner=left?1414:1486;
  const top=966;
  const bottom=1021;
  const lip=left?inner+7:inner-7;
  return {
    role:'dynamic-leaf-guide',
    bank,
    geometry:'normalized-educational',
    path:left
      ?`M${outer} ${top} H${inner} L${lip} ${top+6} V${bottom-6} L${inner} ${bottom} H${outer}`
      :`M${outer} ${top} H${inner} L${lip} ${top+6} V${bottom-6} L${inner} ${bottom} H${outer}`
  };
}

function addGuide(group,bank){
  if(!group||group.querySelector('[data-role="dynamic-leaf-guide"]'))return;
  const visual=agilityLeafGuideVisualState(bank);
  const guide=document.createElementNS(NS,'path');
  guide.setAttribute('d',visual.path);
  guide.setAttribute('data-role',visual.role);
  guide.setAttribute('data-bank',visual.bank);
  guide.setAttribute('data-geometry',visual.geometry);
  guide.setAttribute('fill','none');
  guide.setAttribute('stroke','#7894aa');
  guide.setAttribute('stroke-width','2.2');
  guide.setAttribute('stroke-linejoin','round');
  guide.setAttribute('opacity','.72');
  group.prepend(guide);
}

export function initAgilityLeafGuides(){
  addGuide(document.querySelector('#mlcLeft'),'A');
  addGuide(document.querySelector('#mlcRight'),'B');
  const mlc=document.querySelector('#mlcGroup');
  if(mlc){
    mlc.setAttribute('data-topology','160-leaf-interdigitating-mlc-with-dynamic-leaf-guides');
    mlc.setAttribute('data-guide-geometry','normalized-educational');
  }
  const diaphragms=document.querySelector('#jawsGroup');
  if(diaphragms){
    diaphragms.setAttribute('data-role','orthogonal-sculpted-diaphragm-pair');
    diaphragms.setAttribute('data-backup-jaws','none');
  }
}
