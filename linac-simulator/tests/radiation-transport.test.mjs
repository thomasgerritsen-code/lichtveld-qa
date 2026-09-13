import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';
import {evaluateRadiationTransport} from '../src/physics/radiation-transport.js';

function run(overrides={},mode='photon',delivery={}){
  const params=decodeControls({...UI_DEFAULTS,...overrides});
  const sim=simulate(params,{},{});
  return evaluateRadiationTransport(sim,{mode,...delivery});
}

test('nominal beam keeps full relative dose rate with only faint normal head scatter',()=>{
  const radiation=run();
  assert.equal(radiation.doseRatePercent,100);
  assert.equal(radiation.transportTransmission,1);
  assert.equal(radiation.firstStrike,null);
  assert.ok(radiation.scatterIndex>0);
  assert.ok(radiation.scatterIndex<5);
});

test('nominal electron beam includes a low non-zero normalized applicator-scatter component',()=>{
  const radiation=run({},'electron',{fieldXcm:10,fieldYcm:10});
  assert.equal(radiation.doseRatePercent,100);
  assert.equal(radiation.normalHeadScatterFraction,0);
  assert.ok(radiation.electronApplicatorScatterFraction>0);
  assert.ok(radiation.electronApplicatorScatterFraction<.1);
});

test('electron applicator scatter separates electron and photon-contamination teaching components without changing the total',()=>{
  const radiation=run({},'electron',{fieldXcm:10,fieldYcm:10});

  assert.ok(radiation.electronScatterFraction>0);
  assert.ok(radiation.electronPhotonContaminationFraction>0);
  assert.ok(radiation.electronScatterFraction>radiation.electronPhotonContaminationFraction);
  assert.ok(Math.abs(
    radiation.electronScatterFraction+
    radiation.electronPhotonContaminationFraction-
    radiation.electronApplicatorScatterFraction
  )<1e-12);
});

test('educational electron applicator-scatter proxy decreases gently for a larger equivalent field',()=>{
  const small=run({},'electron',{fieldXcm:6,fieldYcm:6});
  const reference=run({},'electron',{fieldXcm:10,fieldYcm:10});
  const large=run({},'electron',{fieldXcm:20,fieldYcm:20});

  assert.ok(small.electronApplicatorScatterFraction>reference.electronApplicatorScatterFraction);
  assert.ok(reference.electronApplicatorScatterFraction>large.electronApplicatorScatterFraction);
  assert.equal(small.doseRatePercent,100);
  assert.equal(large.doseRatePercent,100);
});

test('photon mode does not acquire electron-scatter or electron photon-contamination components',()=>{
  const radiation=run({},'photon',{fieldXcm:10,fieldYcm:10});
  assert.equal(radiation.electronApplicatorScatterFraction,0);
  assert.equal(radiation.electronScatterFraction,0);
  assert.equal(radiation.electronPhotonContaminationFraction,0);
  assert.ok(radiation.normalHeadScatterFraction>0);
});

test('large steering error can intercept a transport wall and reduce primary dose rate to zero',()=>{
  const radiation=run({r1:100,r2:100,t1:100,t2:100});
  assert.equal(radiation.doseRatePercent,0);
  assert.ok(radiation.firstStrike);
  assert.ok(radiation.hardStrike);
  assert.equal(radiation.hardStrike.hard,true);
  assert.notEqual(radiation.hardStrike.stage,'target');
  assert.ok(radiation.scatterIndex>50);
});

test('large bending mismatch can miss the target even when upstream transport remains open',()=>{
  const radiation=run({coarse:100,fine:100});
  assert.equal(radiation.transportTransmission,1);
  assert.equal(radiation.doseRatePercent,0);
  assert.equal(radiation.hardStrike?.stage,'target');
  assert.ok(radiation.scatterIndex>20);
});

test('moderate misalignment lowers useful output continuously before a hard strike',()=>{
  const radiation=run({energy:0});
  assert.ok(radiation.doseRatePercent>0);
  assert.ok(radiation.doseRatePercent<100);
  assert.equal(radiation.firstStrike,null);
});
