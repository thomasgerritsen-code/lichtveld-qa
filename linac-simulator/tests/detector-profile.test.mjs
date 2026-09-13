import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';
import {photonProfiles} from '../src/physics/detector.js';
import {photonOutputFactorProxy} from '../src/physics/delivery-state.js';

function nominalProfileSet(filter){
  const params=decodeControls({...UI_DEFAULTS,fx:10,fy:10});
  const sim=simulate(params,{},{});
  return photonProfiles(sim,params,filter);
}

function nominalProfiles(filter){
  return nominalProfileSet(filter).radial;
}

function nearest(profile,x){
  return profile.reduce((best,p)=>Math.abs(p.x-x)<Math.abs(best.x-x)?p:best);
}

test('FFF keeps a more centrally peaked normalized profile than FF away from the field edge',()=>{
  const ff=nominalProfiles('ff');
  const fff=nominalProfiles('fff');
  const ffShoulder=nearest(ff,.10).y;
  const fffShoulder=nearest(fff,.10).y;
  assert.ok(fffShoulder<ffShoulder);
});

test('FFF normalized penumbra falls faster outside the same nominal field edge',()=>{
  const ff=nominalProfiles('ff');
  const fff=nominalProfiles('fff');
  const ffOutside=nearest(ff,.30).y;
  const fffOutside=nearest(fff,.30).y;
  assert.ok(fffOutside<ffOutside);
  assert.ok(fffOutside<ffOutside*.8);
});

test('Agility MLC-defined axis has a broader normalized edge than the orthogonal diaphragm axis',()=>{
  for(const filter of ['ff','fff']){
    const profiles=nominalProfileSet(filter);
    const diaphragmOutside=nearest(profiles.radial,.30).y;
    const mlcOutside=nearest(profiles.transverse,.30).y;
    assert.ok(mlcOutside>diaphragmOutside,`${filter}: expected MLC edge to be broader`);
  }
});

test('directional edge model preserves the same central normalization on both axes',()=>{
  for(const filter of ['ff','fff']){
    const profiles=nominalProfileSet(filter);
    assert.ok(Math.abs(nearest(profiles.radial,0).y-1)<1e-12);
    assert.ok(Math.abs(nearest(profiles.transverse,0).y-1)<1e-12);
  }
});

test('FFF field-output proxy has less field-size dependence around the 10x10 reference',()=>{
  assert.equal(photonOutputFactorProxy(10,10,'ff'),1);
  assert.equal(photonOutputFactorProxy(10,10,'fff'),1);
  assert.ok(photonOutputFactorProxy(5,5,'fff')>photonOutputFactorProxy(5,5,'ff'));
  assert.ok(photonOutputFactorProxy(20,20,'fff')<photonOutputFactorProxy(20,20,'ff'));
});
