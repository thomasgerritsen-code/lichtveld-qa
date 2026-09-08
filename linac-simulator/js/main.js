import {UI_DEFAULTS,PART_INFO} from './config.js';
import {decodeControls,simulate} from './beam-model.js';
import {initHardware,render} from './render.js';
import {initTraining} from './training.js';
import {initMetrics} from './metrics.js';
import {gantryEnvironment,buildControlContext,chamberSignals} from './feedback.js';
import {initDiagnostics} from './diagnostics.js';

const $=s=>document.querySelector(s);
const ids=['f1','r1','t1','f2','r2','t2','energy','spread','coarse','fine','fx','fy','gantry'];
const controls=Object.fromEntries(ids.map(id=>[id,$('#'+id)]));
const outputs=Object.fromEntries(ids.map(id=>[id,$('#'+id+'v')]));

let mode='photon',filter='ff',paused=false,direction='cw',controlMode='manual';
const overlays={disp:true,envelope:true,labels:true,bad:false,vectors:false};
let lastPath=[],t0=performance.now(),trainer=null,metrics=null,diagnostics=null;

function rawValues(){return Object.fromEntries(ids.map(id=>[id,+controls[id].value]));}

function mergeDisturbance(training,environment){
  return {
    radial:{
      x:(training.radial?.x||0)+(environment.radial?.x||0),
      xp:(training.radial?.xp||0)+(environment.radial?.xp||0)
    },
    transverse:{
      x:(training.transverse?.x||0)+(environment.transverse?.x||0),
      xp:(training.transverse?.xp||0)+(environment.transverse?.xp||0)
    },
    coarseBias:training.coarseBias||0,
    fineBias:training.fineBias||0,
    energyOffset:training.energyOffset||0
  };
}

function syncOutputs(raw,p){
  for(const id of ['r1','t1','r2','t2','coarse','fine'])outputs[id].textContent=(raw[id]/100).toFixed(2);
  outputs.f1.textContent=p.f1.toFixed(2);
  outputs.f2.textContent=p.f2.toFixed(2);
  outputs.energy.textContent=p.energy.toFixed(2);
  outputs.spread.textContent=p.spread.toFixed(2);
  outputs.fx.textContent=raw.fx+'%';
  outputs.fy.textContent=raw.fy+'%';
  outputs.gantry.textContent=Math.round(raw.gantry)+'°';
}

function setModeUI(){
  $('#photonBtn').classList.toggle('selected',mode==='photon');
  $('#electronBtn').classList.toggle('selected',mode==='electron');
  $('#ffBtn').classList.toggle('selected',filter==='ff');
  $('#fffBtn').classList.toggle('selected',filter==='fff');
  $('#ffWrap').style.opacity=mode==='photon'?'1':'.4';
  $('#ffWrap').style.pointerEvents=mode==='photon'?'auto':'none';
  $('#photonTarget').hidden=mode!=='photon';
  $('#electronWindow').hidden=mode!=='electron';
  $('#photonHead').hidden=mode!=='photon';
  $('#electronHead').hidden=mode!=='electron';
  $('#mlcGroup').hidden=mode!=='photon';
  $('#jawsGroup').hidden=mode!=='photon';
  $('#electronApplicator').hidden=mode!=='electron';
  $('#flatteningFilter').hidden=mode!=='photon'||filter!=='ff';
  $('#treatmentCone').setAttribute('fill',mode==='photon'?'url(#photonCone)':'url(#electronCone)');
  $('#centralRay').style.stroke=mode==='photon'?'#ffd66b':'#63ddff';
  $('#modeOut').textContent=mode==='photon'?'Photon '+filter.toUpperCase():'Electron';

  $('#dirCw').classList.toggle('selected',direction==='cw');
  $('#dirCcw').classList.toggle('selected',direction==='ccw');
  $('#controlManual').classList.toggle('selected',controlMode==='manual');
  $('#controlLut').classList.toggle('selected',controlMode==='lut');
  $('#controlServo').classList.toggle('selected',controlMode==='servo');
}

function update(){
  const raw=rawValues();
  const params=decodeControls(raw);
  const training=trainer?.getDisturbance()||{};
  const environment=gantryEnvironment(raw.gantry,direction);
  const disturbance=mergeDisturbance(training,environment);

  // Pass 1: Set + optional LUT. This produces the chamber signal seen by the virtual servo.
  const preContext=buildControlContext({mode:controlMode==='manual'?'manual':'lut',angleDeg:raw.gantry,direction});
  const preAssist={r2:preContext.lut.r2,t2:preContext.lut.t2};
  const preSim=simulate(params,disturbance,preAssist);

  // Pass 2: for Servo mode, derive a secondary correction from the integrated chamber tilt.
  const control=buildControlContext({mode:controlMode,angleDeg:raw.gantry,direction,preSim});
  const assist={r2:control.lut.r2+control.servo.r2,t2:control.lut.t2+control.servo.t2};
  const sim=simulate(params,disturbance,assist);
  const chamber=chamberSignals(sim);
  control.chamber=chamber;

  syncOutputs(raw,params);
  setModeUI();
  lastPath=render(params,sim,overlays,{mode,filter,gantry:raw.gantry,direction,controlMode});

  $('#achOut').textContent=Math.round(sim.achromacy*100)+'%';
  $('#spotOut').textContent=sim.spot.toFixed(3);
  $('#radOut').textContent=(sim.radialOffset/24).toFixed(3);
  $('#traOut').textContent=(sim.transverseOffset/24).toFixed(3);
  $('#impactOut').textContent=sim.error<.035?'Nominaal':sim.error<.10?'Kleine offset':'Target mismatch';
  $('#gantryOut').textContent=Math.round(raw.gantry)+'° '+direction.toUpperCase();
  $('#controlModeOut').textContent=controlMode==='manual'?'Set only':controlMode==='lut'?'Set + LUT':'Set + LUT + Servo';
  $('#dispOut').textContent=sim.target.disp.toFixed(3)+' / '+sim.target.dispPrime.toFixed(3);

  trainer?.update(sim);
  metrics?.update(sim.stages);
  diagnostics?.update({sim,params,mode,filter,chamber,control});

  window.linacSimulator={params,sim,disturbance,control,chamber,mode,filter};
}

function reset(){
  for(const [id,v] of Object.entries(UI_DEFAULTS)){
    if(controls[id])controls[id].value=v;
  }
  mode='photon';filter='ff';direction='cw';controlMode='manual';
  Object.assign(overlays,{disp:true,envelope:true,labels:true,bad:false,vectors:false});
  $('#dispToggle').checked=true;
  $('#envelopeToggle').checked=true;
  $('#labelsToggle').checked=true;
  $('#badToggle').checked=false;
  $('#vectorsToggle').checked=false;
  trainer?.reset();
  update();
}

function exampleFault(){
  const vals={f1:43,r1:18,t1:-12,f2:50,r2:28,t2:16,energy:42,spread:70,coarse:36,fine:-22,fx:72,fy:44,gantry:238};
  for(const [id,v] of Object.entries(vals))controls[id].value=v;
  direction='ccw';controlMode='manual';
  overlays.bad=true;$('#badToggle').checked=true;
  update();
}

ids.forEach(id=>controls[id].addEventListener('input',update));
$('#photonBtn').onclick=()=>{mode='photon';update()};
$('#electronBtn').onclick=()=>{mode='electron';update()};
$('#ffBtn').onclick=()=>{filter='ff';update()};
$('#fffBtn').onclick=()=>{filter='fff';update()};
$('#dirCw').onclick=()=>{direction='cw';update()};
$('#dirCcw').onclick=()=>{direction='ccw';update()};
$('#controlManual').onclick=()=>{controlMode='manual';update()};
$('#controlLut').onclick=()=>{controlMode='lut';update()};
$('#controlServo').onclick=()=>{controlMode='servo';update()};

$('#dispToggle').onchange=e=>{overlays.disp=e.target.checked;update()};
$('#envelopeToggle').onchange=e=>{overlays.envelope=e.target.checked;update()};
$('#labelsToggle').onchange=e=>{overlays.labels=e.target.checked;update()};
$('#badToggle').onchange=e=>{overlays.bad=e.target.checked;update()};
$('#vectorsToggle').onchange=e=>{overlays.vectors=e.target.checked;update()};

$('#resetBtn').onclick=reset;
$('#faultBtn').onclick=exampleFault;
$('#pauseBtn').onclick=e=>{paused=!paused;e.target.textContent=paused?'Hervat':'Pauzeer'};
$('#fitBtn').onclick=()=>{$('#machineViewport').scrollTo({left:0,top:0,behavior:'smooth'})};

document.querySelectorAll('.component').forEach(el=>el.addEventListener('click',()=>{
  const d=PART_INFO[el.dataset.part];
  if(!d)return;
  $('#partTitle').textContent=d[0];
  $('#partText').textContent=d[1];
  $('#partPill').textContent=el.dataset.part;
}));

const particles=[];
for(let i=0;i<110;i++){
  const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
  c.setAttribute('r',1.5+(i%3)*.4);c.setAttribute('fill','#dffaff');
  $('#particles').appendChild(c);
  particles.push({el:c,seed:(i*.6180339887)%1,speed:.10+(i%11)*.007});
}

function animate(now){
  if(!paused&&lastPath.length>1){
    for(let i=0;i<particles.length;i++){
      const q=particles[i],f=(q.seed+(now-t0)/1000*q.speed)%1,index=f*(lastPath.length-1),lo=Math.floor(index),hi=Math.min(lastPath.length-1,lo+1),t=index-lo;
      const a=lastPath[lo],b=lastPath[hi],x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
      q.el.setAttribute('cx',x.toFixed(1));q.el.setAttribute('cy',y.toFixed(1));
    }
  }
  requestAnimationFrame(animate);
}

initHardware();
metrics=initMetrics();
diagnostics=initDiagnostics();
trainer=initTraining({controls,onChange:update});
reset();
requestAnimationFrame(animate);
