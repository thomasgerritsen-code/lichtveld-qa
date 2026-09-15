import {NS} from './geometry.js';

export function agilityFieldCausalityState(state){
  const mode=state?.machine?.mode||'photon';
  const activeControl=state?.runtime?.activeControlId||null;
  return {
    visible:mode==='photon',
    x:{control:'fx',hardware:'Agility MLC banks',role:'leaf-travel axis',active:mode==='photon'&&activeControl==='fx'},
    y:{control:'fy',hardware:'sculpted diaphragms',role:'orthogonal field axis',active:mode==='photon'&&activeControl==='fy'},
    topology:'mlc-x-orthogonal-diaphragm-y',
    geometry:'normalized-educational'
  };
}

function makeLabel(parent,{id,x,y,text,axis}){
  const group=document.createElementNS(NS,'g');
  group.setAttribute('id',id);
  group.setAttribute('data-axis',axis);
  group.setAttribute('data-role','agility-field-causality');
  group.setAttribute('pointer-events','none');

  const line=document.createElementNS(NS,'path');
  line.setAttribute('d',axis==='x'?`M${x-58} ${y} H${x+58}`:`M${x} ${y-26} V${y+26}`);
  line.setAttribute('fill','none');
  line.setAttribute('stroke','#8fdcff');
  line.setAttribute('stroke-width','2');
  line.setAttribute('stroke-dasharray','6 4');
  line.setAttribute('opacity','.58');
  group.appendChild(line);

  const label=document.createElementNS(NS,'text');
  label.setAttribute('x',String(x));
  label.setAttribute('y',String(y-10));
  label.setAttribute('text-anchor','middle');
  label.setAttribute('font-size','12');
  label.setAttribute('font-weight','700');
  label.setAttribute('fill','#d9f5ff');
  label.textContent=text;
  group.appendChild(label);

  parent.appendChild(group);
  return group;
}

export function initAgilityCausality(controller){
  const mlc=document.querySelector('#mlcGroup');
  const diaphragms=document.querySelector('#jawsGroup');
  const host=mlc?.parentNode;
  if(!mlc||!diaphragms||!host||document.querySelector('#agilityFieldCausality'))return;

  const overlay=document.createElementNS(NS,'g');
  overlay.setAttribute('id','agilityFieldCausality');
  overlay.setAttribute('data-topology','mlc-x-orthogonal-diaphragm-y');
  overlay.setAttribute('data-geometry','normalized-educational');
  const xLabel=makeLabel(overlay,{id:'agilityXAxis',x:1450,y:955,text:'Field X → MLC banks',axis:'x'});
  const yLabel=makeLabel(overlay,{id:'agilityYAxis',x:1615,y:1023,text:'Field Y → sculpted diaphragms',axis:'y'});
  host.appendChild(overlay);

  function update(){
    const visual=agilityFieldCausalityState(controller.store.getState());
    overlay.hidden=!visual.visible;
    xLabel.setAttribute('data-active',visual.x.active?'true':'false');
    yLabel.setAttribute('data-active',visual.y.active?'true':'false');
    xLabel.style.opacity=visual.x.active?'1':'.62';
    yLabel.style.opacity=visual.y.active?'1':'.62';
    mlc.setAttribute('data-field-control','fx');
    diaphragms.setAttribute('data-field-control','fy');
    mlc.setAttribute('data-field-axis','x');
    diaphragms.setAttribute('data-field-axis','y');
  }

  controller.store.subscribe(update);
  update();
}
