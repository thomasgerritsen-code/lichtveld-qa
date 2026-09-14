import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';
import {evaluateRadiationTransport} from '../src/physics/radiation-transport.js';
import {evaluateDelivery} from '../src/physics/delivery-state.js';
import {patientPlaneVisualState,relativeEdgeWidth} from '../src/ui/patient-plane.js';
import {photonProfiles} from '../src/physics/detector.js';

function scenario({mode='photon',filter='ff',controls={},machine={powerOn:true,beamOn:true}}={}){
  const raw={...UI_DEFAULTS,...controls};
  const params=decodeControls(raw);
  const sim=simulate(params,{},{});
  const radiation=evaluateRadiationTransport(sim,{
    mode,
    filter,
    fieldXcm:params.fieldXcm,
    fieldYcm:params.fieldYcm
  });
  const delivery=evaluateDelivery({radiation,machine,params,sim,mode,filter});
  return patientPlaneVisualState({sim,params,view:{mode,filter},radiation,delivery});
}

test('patient-plane view distinguishes flattened and central-peaked FFF photon profiles',()=>{
  const ff=scenario({filter:'ff'});
  const fff=scenario({filter:'fff'});
  assert.match(ff.profileLabel,/flattened/i);
  assert.match(fff.profileLabel,/central-peaked/i);
  assert.ok(fff.scatter<ff.scatter,'FFF should retain the lower normalized head-scatter ordering');
});

test('field controls visibly change patient-plane field dimensions',()=>{
  const small=scenario({controls:{fx:5,fy:5}});
  const large=scenario({controls:{fx:30,fy:20}});
  assert.ok(large.fieldWidth>small.fieldWidth);
  assert.ok(large.fieldHeight>small.fieldHeight);
  assert.equal(large.fieldXcm,30);
  assert.equal(large.fieldYcm,20);
});

test('machine off collapses useful primary and patient-output feedback to zero',()=>{
  const off=scenario({machine:{powerOn:false,beamOn:true}});
  assert.equal(off.active,false);
  assert.equal(off.primary,0);
  assert.equal(off.patientOutput,0);
  assert.equal(off.scatter,0);
});

test('electron mode exposes separate scatter and photon-contamination teaching components',()=>{
  const electron=scenario({mode:'electron'});
  assert.match(electron.profileLabel,/electron/i);
  assert.ok(electron.electronScatter>0);
  assert.ok(electron.photonContamination>0);
  assert.ok(electron.electronScatter>electron.photonContamination);
});

test('strong normalized steering deviation reduces visible useful primary output',()=>{
  const nominal=scenario();
  const steered=scenario({controls:{r1:100,t1:100,r2:100,t2:100}});
  assert.ok(steered.primary<nominal.primary);
  assert.ok(steered.patientOutput<nominal.patientOutput);
});

test('reported relative edge width follows the existing detector profile rather than a second penumbra model',()=>{
  const params=decodeControls({...UI_DEFAULTS,fx:10,fy:10});
  const sim=simulate(params,{},{});
  const profiles=photonProfiles(sim,params,'ff');
  const view=scenario({filter:'ff'});
  assert.ok(relativeEdgeWidth(profiles.radial)>0);
  assert.ok(Math.abs(view.radialEdgeWidth-relativeEdgeWidth(profiles.radial))<1e-12);
  assert.ok(Math.abs(view.transverseEdgeWidth-relativeEdgeWidth(profiles.transverse))<1e-12);
});
