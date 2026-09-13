import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';
import {photonProfiles} from '../src/physics/detector.js';
import {photonOutputFactorProxy} from '../src/physics/delivery-state.js';

function nominalProfiles(filter){
  const params=decodeControls({...UI_DEFAULTS,fx:10,fy:10});
  const sim=simulate(params,{},{});
  return photonProfiles(sim,params,filter).radial;
}

function nearest(profile,x){
  return profile.reduce((best,p)=>Math.abs(p.x-x)<Math.abs(best.x-x)?p:best);
}

test('FFF keeps the expected peaked central profile while FF remains comparatively flat',()=>{
  const ff=nominalProfiles('ff');
  const fff=nominalProfiles('fff');
  assert.ok(nearest(ff,.15).y>nearest(fff,.15).y);
});

test('FFF normalized penumbra falls faster outside the same nominal field edge',()=>{
  const ff=nominalProfiles('ff');
  const fff=nominalProfiles('fff');
  const ffOutside=nearest(ff,.30).y;
  const fffOutside=nearest(fff,.30).y;
  assert.ok(fffOutside<ffOutside);
  assert.ok(fffOutside<ffOutside*.8);
});

test('FFF field-output proxy has less field-size dependence around the 10x10 reference',()=>{
  assert.equal(photonOutputFactorProxy(10,10,'ff'),1);
  assert.equal(photonOutputFactorProxy(10,10,'fff'),1);
  assert.ok(photonOutputFactorProxy(5,5,'fff')>photonOutputFactorProxy(5,5,'ff'));
  assert.ok(photonOutputFactorProxy(20,20,'fff')<photonOutputFactorProxy(20,20,'ff'));
});
