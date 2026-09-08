import {PART_INFO} from '../machine/model.js';
import {CONTROL_EFFECTS} from '../machine/control-effects.js';
import {decodeControls,simulate} from '../physics/beam-model.js';
import {gantryEnvironment,buildControlContext,chamberSignals} from '../physics/feedback.js';
import {evaluateRadiationTransport} from '../physics/radiation-transport.js';
import {evaluateDelivery} from '../physics/delivery-state.js';
import {initHardware,render,setActiveControlEffect} from '../ui/machine-renderer.js';
import {initTraining} from '../ui/training.js';
import {initMetrics} from '../ui/metrics.js';
import {initDiagnostics} from '../ui/diagnostics.js';
import {createStore} from './store.js';
import {selectRawControls,selectViewState,selectOverlayState} from './selectors.js';

const $=s=>document.querySelector(s);
const CONTROL_IDS=['gunEmission','gunTiming','magPower','magTune','rfPhase','f1','r1','t1','f2','r2','t2','energy','spread','coarse','fine','fx','fy','doseRateSet','gantry'];

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

export function createController(){
  const store=createStore();
  const controls=Object.fromEntries(CONTROL_IDS.map(id=>[id,$('#'+id)]));
  const outputs=Object.fromEntries(CONTROL_IDS.map(id=>[id,$('#'+id+'v')]));

  let trainer=null;
  let metrics=null;
  let diagnostics=null;
  let lastPath=[];
  const t0=performance.now();

  function syncControlInputs(state){
    for(const id of CONTROL_IDS){
      if(controls[id] && String(controls[id].value)!==String(state.controls[id])){
        controls[id].value=state.controls[id];
      }
    }
  }

  function syncOutputs(raw,params){
    for(const id of ['r1','t1','r2','t2','coarse','fine']){
      outputs[id].textContent=(raw[id]/100).toFixed(2);
    }
    outputs.gunEmission.textContent=Math.round(params.gunEmission*100)+'%';
    outputs.gunTiming.textContent=params.gunTiming.toFixed(2);
    outputs.magPower.textContent=Math.round(params.magPower*100)+'%';
    outputs.magTune.textContent=params.magTune.toFixed(2);
    outputs.rfPhase.textContent=params.rfPhase.toFixed(2);
    outputs.f1.textContent=Math.round(params.f1*100)+'%';
    outputs.f2.textContent=Math.round(params.f2*100)+'%';
    outputs.energy.textContent=params.energy.toFixed(3);
    outputs.spread.textContent=params.spread.toFixed(2);
    outputs.fx.textContent=Number(raw.fx).toFixed(1)+' cm';
    outputs.fy.textContent=Number(raw.fy).toFixed(1)+' cm';
    outputs.doseRateSet.textContent=Math.round(params.doseRateSet)+' MU/min';
    outputs.gantry.textContent=Math.round(raw.gantry)+'°';
  }

  function syncDisplayUI(state){
    $('#dispToggle').checked=state.display.dispersion;
    $('#envelopeToggle').checked=state.display.envelope;
    $('#labelsToggle').checked=state.display.labels;
    $('#badToggle').checked=state.display.mismatch;
    $('#vectorsToggle').checked=state.display.vectors;
    $('#scatterToggle').checked=state.display.scatter;
    $('#pauseBtn').textContent=state.runtime.paused?'Hervat':'Pauzeer';
  }

  function syncConsoleUI(state){
    const {powerOn,beamOn,mode,filter}=state.machine;
    const raw=selectRawControls(state);

    $('#machineStateText').textContent=!powerOn?'OFF':(beamOn?'BEAM ON':'READY');
    $('#machineLamp').classList.toggle('ready',powerOn);
    $('#machineLamp').classList.toggle('off',!powerOn);

    $('#beamStateText').textContent=beamOn&&powerOn?'ON':'OFF';
    $('#beamLamp').classList.toggle('beamActive',beamOn&&powerOn);

    $('#machinePowerBtn').classList.toggle('on',powerOn);
    $('#machinePowerBtn').classList.toggle('off',!powerOn);
    $('#machinePowerBtn').querySelector('b').textContent=powerOn?'ON':'OFF';

    $('#beamOnBtn').disabled=!powerOn;
    $('#beamOffBtn').disabled=!powerOn;
    $('#beamOnBtn').classList.toggle('active',beamOn&&powerOn);

    $('#consoleModeOut').textContent=mode==='photon'
      ?'Photon '+filter.toUpperCase()
      :'Electron';

    const fx=Number(raw.fx),fy=Number(raw.fy);
    const fieldText=fx.toFixed(1)+' × '+fy.toFixed(1)+' cm';
    $('#fieldConsoleOut').textContent=fieldText;
    $('#fieldPresetOut').textContent=fieldText;
    $('#fieldXConsole').textContent=fx.toFixed(1)+' cm';
    $('#fieldYConsole').textContent=fy.toFixed(1)+' cm';

    document.querySelectorAll('[data-field]').forEach(button=>{
      const field=Number(button.dataset.field);
      button.classList.toggle('active',Math.abs(fx-field)<.001&&Math.abs(fy-field)<.001);
    });
  }

  function syncModeUI(state){
    const {mode,filter,direction}=state.machine;
    const controlMode=state.beamControl.mode;

    $('#photonBtn').classList.toggle('selected',mode==='photon');
    $('#electronBtn').classList.toggle('selected',mode==='electron');
    $('#ffBtn').classList.toggle('selected',filter==='ff');
    $('#fffBtn').classList.toggle('selected',filter==='fff');
    $('#ffWrap').style.opacity=mode==='photon'?'1':'.4';
    $('#ffWrap').style.pointerEvents=mode==='photon'?'auto':'none';

    $('#photonTarget').hidden=false;
    $('#electronWindow').hidden=false;
    $('#photonTarget').classList.toggle('modePortActive',mode==='photon');
    $('#photonTarget').classList.toggle('modePortInactive',mode!=='photon');
    $('#electronWindow').classList.toggle('modePortActive',mode==='electron');
    $('#electronWindow').classList.toggle('modePortInactive',mode!=='electron');

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

  function syncControlEffect(state){
    const id=state.runtime.activeControlId;
    const effect=id?CONTROL_EFFECTS[id]:null;

    document.querySelectorAll('.controlActiveLabel').forEach(el=>el.classList.remove('controlActiveLabel'));
    if(id&&controls[id]) controls[id].closest('label')?.classList.add('controlActiveLabel');
    setActiveControlEffect(effect);

    const banner=$('#effectBanner');
    if(!banner)return;

    if(!effect){
      banner.innerHTML='<strong>Slider-effect</strong><span>Beweeg een schuifje; het gekoppelde onderdeel en het downstream effect worden gemarkeerd.</span>';
      return;
    }

    const plane=effect.plane==='transverse'
      ?' · transverse view'
      :effect.plane==='radial'
        ?' · radial side-view'
        :effect.plane==='both'
          ?' · R + T'
          :'';

    banner.innerHTML=`<strong>${effect.label}${plane}</strong><span>${effect.text}</span>`;
  }

  function calculate(state){
    const raw=selectRawControls(state);
    const params=decodeControls(raw);
    const view=selectViewState(state);
    const training=trainer?.getDisturbance()||{};
    const environment=gantryEnvironment(raw.gantry,view.direction);
    const disturbance=mergeDisturbance(training,environment);

    const preMode=view.controlMode==='manual'?'manual':'lut';
    const preContext=buildControlContext({
      mode:preMode,
      angleDeg:raw.gantry,
      direction:view.direction
    });
    const preAssist={r2:preContext.lut.r2,t2:preContext.lut.t2};
    const preSim=simulate(params,disturbance,preAssist);

    const control=buildControlContext({
      mode:view.controlMode,
      angleDeg:raw.gantry,
      direction:view.direction,
      preSim
    });
    const assist={
      r2:control.lut.r2+control.servo.r2,
      t2:control.lut.t2+control.servo.t2
    };
    const sim=simulate(params,disturbance,assist);
    const radiation=evaluateRadiationTransport(sim,{
      mode:view.mode,
      filter:view.filter,
      fieldXcm:params.fieldXcm,
      fieldYcm:params.fieldYcm
    });
    const delivery=evaluateDelivery({
      radiation,
      machine:state.machine,
      params,
      sim,
      mode:view.mode,
      filter:view.filter
    });

    const chamberRaw=chamberSignals(sim);
    const transmission=delivery.beamActive?delivery.outputFraction:0;
    const tiltScale=Math.sqrt(transmission);
    const chamber={
      ...chamberRaw,
      doseA:chamberRaw.doseA*transmission,
      doseB:chamberRaw.doseB*transmission,
      radialTilt:chamberRaw.radialTilt*tiltScale,
      transverseTilt:chamberRaw.transverseTilt*tiltScale
    };
    control.chamber=chamber;

    return {raw,params,view,disturbance,control,sim,chamber,radiation,delivery};
  }

  function renderState(state){
    syncControlInputs(state);
    syncDisplayUI(state);
    syncConsoleUI(state);
    syncModeUI(state);
    syncControlEffect(state);

    const result=calculate(state);
    syncOutputs(result.raw,result.params);

    lastPath=render(
      result.params,
      result.sim,
      selectOverlayState(state),
      result.view,
      result.radiation,
      result.delivery
    );

    $('#achOut').textContent=Math.round(result.sim.achromacy*100)+'%';
    $('#spotOut').textContent=result.sim.spot.toFixed(3);
    $('#radOut').textContent=(result.sim.radialOffset/24).toFixed(3);
    $('#traOut').textContent=(result.sim.transverseOffset/24).toFixed(3);
    $('#impactOut').textContent=result.sim.error<.035?'Nominaal':result.sim.error<.10?'Kleine offset':'Target mismatch';
    $('#gantryOut').textContent=Math.round(result.raw.gantry)+'° '+result.view.direction.toUpperCase();
    $('#controlModeOut').textContent=result.view.controlMode==='manual'
      ?'Set only'
      :result.view.controlMode==='lut'
        ?'Set + LUT'
        :'Set + LUT + Servo';
    $('#dispOut').textContent=result.sim.target.disp.toFixed(3)+' / '+result.sim.target.dispPrime.toFixed(3);
    $('#doseRateOut').textContent=Math.round(result.delivery.usefulDoseRate)+' MU/min';
    $('#transmissionOut').textContent=(result.radiation.primaryTransmission*100).toFixed(1)+'%';
    $('#scatterOut').textContent=(result.delivery.beamActive?result.radiation.scatterIndex:0).toFixed(1)+'%';
    $('#wallHitOut').textContent=!result.delivery.beamActive
      ?'—'
      :result.radiation.firstStrike
        ?(result.radiation.firstStrike.stage+' · '+(result.radiation.firstStrike.hard?'volledig':'gedeeltelijk'))
        :'geen';
    const qualityPercent=result.delivery.beamActive
      ?Math.min(100,result.delivery.beamQuality*100)
      :0;
    $('#doseRateFill').style.width=qualityPercent+'%';
    $('#doseRateFill').classList.toggle('zero',qualityPercent===0);
    $('#radiationStatus').textContent=result.delivery.status;

    $('#fieldOut').textContent=result.params.fieldXcm.toFixed(1)+' × '+result.params.fieldYcm.toFixed(1)+' cm';
    $('#fieldFactorOut').textContent=result.delivery.fieldFactor.toFixed(3);
    $('#doseCommandConsole').textContent=Math.round(result.delivery.setpoint)+' MU/min';
    $('#doseActualConsole').textContent=Math.round(result.delivery.usefulDoseRate)+' MU/min';
    $('#patientOutputConsole').textContent=Math.round(result.delivery.patientOutputProxy)+' rel./min';
    $('#outputFactorConsole').textContent=result.delivery.fieldFactor.toFixed(3);

    $('#rfEfficiencyOut').textContent=(result.sim.rf.rfEfficiency*100).toFixed(1)+'%';
    $('#rfCaptureOut').textContent=(result.sim.rf.captureFactor*100).toFixed(1)+'%';
    $('#rfEnergyOut').textContent=result.sim.rf.effectiveEnergy.toFixed(3)+' rel.';
    $('#rfSpreadOut').textContent=result.sim.rf.effectiveSpread.toFixed(3);
    $('#sourceFactorOut').textContent=(result.sim.rf.sourceFactor*100).toFixed(1)+'%';

    trainer?.update(result.sim);
    metrics?.update(result.sim.stages);
    diagnostics?.update({
      sim:result.sim,
      params:result.params,
      mode:result.view.mode,
      filter:result.view.filter,
      chamber:result.chamber,
      control:result.control
    });

    window.linacSimulator={...result,state};
  }

  function syncDomControlsToStore(){
    const values=Object.fromEntries(CONTROL_IDS.map(id=>[id,+controls[id].value]));
    store.dispatch({type:'controls/setMany',values});
  }

  function reset(){
    trainer?.reset();
    store.dispatch({type:'app/reset'});
  }

  function exampleFault(){
    store.dispatch({
      type:'controls/setMany',
      values:{gunEmission:82,gunTiming:24,magPower:88,magTune:32,rfPhase:-18,f1:35,r1:55,t1:-48,f2:38,r2:-62,t2:58,energy:42,spread:70,coarse:36,fine:-22,fx:30,fy:18,doseRateSet:450,gantry:238}
    });
    store.dispatch({type:'machine/set',key:'direction',value:'ccw'});
    store.dispatch({type:'display/set',key:'mismatch',value:true});
  }

  function bindEvents(){
    CONTROL_IDS.forEach(id=>{
      controls[id].addEventListener('input',event=>{
        const value=Number(event.currentTarget.value);
        store.dispatch({type:'control/input',id,value});
      });
    });

    $('#machinePowerBtn').onclick=()=>{
      const next=!store.getState().machine.powerOn;
      store.dispatch({type:'machine/setPower',value:next});
    };
    $('#beamOnBtn').onclick=()=>store.dispatch({type:'machine/setBeam',value:true});
    $('#beamOffBtn').onclick=()=>store.dispatch({type:'machine/setBeam',value:false});

    document.querySelectorAll('[data-field]').forEach(button=>{
      button.addEventListener('click',()=>{
        const field=Number(button.dataset.field);
        store.dispatch({type:'controls/setMany',values:{fx:field,fy:field}});
      });
    });

    $('#photonBtn').onclick=()=>store.dispatch({type:'machine/setMode',mode:'photon'});
    $('#electronBtn').onclick=()=>store.dispatch({type:'machine/setMode',mode:'electron'});
    $('#ffBtn').onclick=()=>store.dispatch({type:'machine/setFilter',filter:'ff'});
    $('#fffBtn').onclick=()=>store.dispatch({type:'machine/setFilter',filter:'fff'});
    $('#dirCw').onclick=()=>store.dispatch({type:'machine/set',key:'direction',value:'cw'});
    $('#dirCcw').onclick=()=>store.dispatch({type:'machine/set',key:'direction',value:'ccw'});

    $('#controlManual').onclick=()=>store.dispatch({type:'beamControl/setMode',mode:'manual'});
    $('#controlLut').onclick=()=>store.dispatch({type:'beamControl/setMode',mode:'lut'});
    $('#controlServo').onclick=()=>store.dispatch({type:'beamControl/setMode',mode:'servo'});

    $('#dispToggle').onchange=e=>store.dispatch({type:'display/set',key:'dispersion',value:e.target.checked});
    $('#envelopeToggle').onchange=e=>store.dispatch({type:'display/set',key:'envelope',value:e.target.checked});
    $('#labelsToggle').onchange=e=>store.dispatch({type:'display/set',key:'labels',value:e.target.checked});
    $('#badToggle').onchange=e=>store.dispatch({type:'display/set',key:'mismatch',value:e.target.checked});
    $('#vectorsToggle').onchange=e=>store.dispatch({type:'display/set',key:'vectors',value:e.target.checked});
    $('#scatterToggle').onchange=e=>store.dispatch({type:'display/set',key:'scatter',value:e.target.checked});

    $('#resetBtn').onclick=reset;
    $('#faultBtn').onclick=exampleFault;
    $('#pauseBtn').onclick=()=>{
      const paused=!store.getState().runtime.paused;
      store.dispatch({type:'runtime/set',key:'paused',value:paused});
    };
    $('#fitBtn').onclick=()=>$('#machineViewport').scrollTo({left:0,top:0,behavior:'smooth'});

    document.querySelectorAll('.component').forEach(el=>el.addEventListener('click',()=>{
      const d=PART_INFO[el.dataset.part];
      if(!d)return;
      $('#partTitle').textContent=d[0];
      $('#partText').textContent=d[1];
      $('#partPill').textContent=el.dataset.part;
    }));
  }

  const particles=[];
  function initParticles(){
    for(let i=0;i<110;i++){
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('r',1.5+(i%3)*.4);
      c.setAttribute('fill','#dffaff');
      $('#particles').appendChild(c);
      particles.push({el:c,seed:(i*.6180339887)%1,speed:.10+(i%11)*.007});
    }
  }

  function animate(now){
    const state=store.getState();
    if(!state.runtime.paused&&lastPath.length>1){
      for(const q of particles){
        const f=(q.seed+(now-t0)/1000*q.speed)%1;
        const index=f*(lastPath.length-1);
        const lo=Math.floor(index);
        const hi=Math.min(lastPath.length-1,lo+1);
        const t=index-lo;
        const a=lastPath[lo],b=lastPath[hi];
        const x=a.x+(b.x-a.x)*t;
        const y=a.y+(b.y-a.y)*t;
        q.el.setAttribute('cx',x.toFixed(1));
        q.el.setAttribute('cy',y.toFixed(1));
      }
    }
    requestAnimationFrame(animate);
  }

  function start(){
    initHardware();
    metrics=initMetrics();
    diagnostics=initDiagnostics();
    trainer=initTraining({controls,onChange:syncDomControlsToStore});
    bindEvents();
    initParticles();
    store.subscribe(renderState);
    renderState(store.getState());
    requestAnimationFrame(animate);
  }

  return {store,start,render:()=>renderState(store.getState())};
}
