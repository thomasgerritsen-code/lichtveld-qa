import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';

test('nominal model remains centered and nearly achromatic after refactor',()=>{
  const params=decodeControls({...UI_DEFAULTS});
  const sim=simulate(params,{},{});

  assert.ok(Math.abs(sim.target.r)<1e-6);
  assert.ok(Math.abs(sim.target.rp)<1e-6);
  assert.ok(Math.abs(sim.target.t)<1e-6);
  assert.ok(Math.abs(sim.target.tp)<1e-6);
  assert.ok(Math.abs(sim.target.disp)<1e-5);
  assert.ok(Math.abs(sim.target.dispPrime)<1e-5);
  assert.ok(sim.achromacy>.99);
  assert.ok(Number.isFinite(sim.error));
});

test('decoded default electron momentum is exactly 1.00',()=>{
  const params=decodeControls({...UI_DEFAULTS});
  assert.equal(params.energy,1);
});
