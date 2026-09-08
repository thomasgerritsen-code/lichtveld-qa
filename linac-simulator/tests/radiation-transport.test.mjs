import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';
import {evaluateRadiationTransport} from '../src/physics/radiation-transport.js';

function run(overrides={},mode='photon'){
  const params=decodeControls({...UI_DEFAULTS,...overrides});
  const sim=simulate(params,{},{});
  return evaluateRadiationTransport(sim,{mode});
}

test('nominal beam keeps full relative dose rate with only faint normal head scatter',()=>{
  const radiation=run();
  assert.equal(radiation.doseRatePercent,100);
  assert.equal(radiation.transportTransmission,1);
  assert.equal(radiation.firstStrike,null);
  assert.ok(radiation.scatterIndex>0);
  assert.ok(radiation.scatterIndex<5);
});

test('large steering error can intercept a transport wall and reduce primary dose rate to zero',()=>{
  const radiation=run({r1:100,r2:100,t1:100,t2:100});
  assert.equal(radiation.doseRatePercent,0);
  assert.ok(radiation.firstStrike);
  assert.equal(radiation.firstStrike.hard,true);
  assert.notEqual(radiation.firstStrike.stage,'target');
  assert.ok(radiation.scatterIndex>50);
});

test('large bending mismatch can miss the target even when upstream transport remains open',()=>{
  const radiation=run({coarse:100,fine:100});
  assert.equal(radiation.transportTransmission,1);
  assert.equal(radiation.doseRatePercent,0);
  assert.equal(radiation.firstStrike?.stage,'target');
  assert.ok(radiation.scatterIndex>20);
});

test('moderate misalignment lowers useful output continuously before a hard strike',()=>{
  const radiation=run({energy:0});
  assert.ok(radiation.doseRatePercent>0);
  assert.ok(radiation.doseRatePercent<100);
  assert.equal(radiation.firstStrike,null);
});
