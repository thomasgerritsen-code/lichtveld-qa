import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';

function run(overrides={},disturbance={}){
  const raw={...UI_DEFAULTS,...overrides};
  const params=decodeControls(raw);
  return simulate(params,disturbance,{});
}
function stage(sim,name){return sim.stages.find(s=>s.name===name);}
const almostEqual=(a,b,eps=1e-10)=>Math.abs(a-b)<=eps;

test('1R leaves upstream stages unchanged and changes downstream R/R-prime',()=>{
  const nominal=run();
  const changed=run({r1:50});

  for(const name of ['gun','focus1']){
    assert.ok(almostEqual(stage(changed,name).r,stage(nominal,name).r));
    assert.ok(almostEqual(stage(changed,name).rp,stage(nominal,name).rp));
  }

  assert.ok(almostEqual(stage(changed,'steer1').r,stage(nominal,'steer1').r));
  assert.notEqual(stage(changed,'steer1').rp,stage(nominal,'steer1').rp);
  assert.notEqual(stage(changed,'focus2').r,stage(nominal,'focus2').r);
});

test('2R has no effect before secondary steering',()=>{
  const nominal=run();
  const changed=run({r2:50});

  for(const name of ['gun','focus1','steer1','focus2']){
    assert.ok(almostEqual(stage(changed,name).r,stage(nominal,name).r));
    assert.ok(almostEqual(stage(changed,name).rp,stage(nominal,name).rp));
  }

  assert.ok(almostEqual(stage(changed,'steer2').r,stage(nominal,'steer2').r));
  assert.notEqual(stage(changed,'steer2').rp,stage(nominal,'steer2').rp);
  assert.notEqual(stage(changed,'m1').r,stage(nominal,'m1').r);
});

test('M3 top-up cannot change M1 or M2',()=>{
  const nominal=run();
  const changed=run({fine:50});

  for(const name of ['m1','m2']){
    assert.ok(almostEqual(stage(changed,name).r,stage(nominal,name).r));
    assert.ok(almostEqual(stage(changed,name).rp,stage(nominal,name).rp));
  }

  assert.notEqual(stage(changed,'m3').rp,stage(nominal,'m3').rp);
  assert.notEqual(changed.target.r,nominal.target.r);
});

test('main bending supply begins at M1',()=>{
  const nominal=run();
  const changed=run({coarse:50});

  const before=['gun','focus1','steer1','focus2','steer2','bendEntry'];
  for(const name of before){
    assert.ok(almostEqual(stage(changed,name).r,stage(nominal,name).r));
    assert.ok(almostEqual(stage(changed,name).rp,stage(nominal,name).rp));
  }

  assert.notEqual(stage(changed,'m1').rp,stage(nominal,'m1').rp);
});

test('energy spread changes envelope/dispersion rays without moving central centroid',()=>{
  const low=run({spread:0});
  const high=run({spread:100});

  for(const name of ['gun','focus1','steer1','focus2','steer2','bendEntry','m1','m2','m3','target']){
    assert.ok(almostEqual(stage(high,name).r,stage(low,name).r));
    assert.ok(almostEqual(stage(high,name).rp,stage(low,name).rp));
  }

  assert.notEqual(stage(high,'m1').sigmaR,stage(low,'m1').sigmaR);
});

test('transverse steering predominantly changes transverse target state',()=>{
  const nominal=run();
  const changed=run({t1:50});

  assert.notEqual(changed.target.t,nominal.target.t);
  assert.notEqual(changed.target.tp,nominal.target.tp);
});
