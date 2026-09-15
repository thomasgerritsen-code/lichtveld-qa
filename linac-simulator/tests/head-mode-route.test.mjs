import test from 'node:test';
import assert from 'node:assert/strict';
import {headModeRouteState} from '../src/ui/machine/head-mode-route.js';

test('photon FF route exposes target then flattening filter then shared monitor',()=>{
  const route=headModeRouteState({mode:'photon',filter:'ff'});
  assert.deepEqual(route.stages.map(stage=>stage.id),['head-entrance','photon-target','photon-filter','monitor']);
  assert.match(route.stages[2].label,/filter in/i);
  assert.deepEqual(route.inactive,['electron-window','electron-scatter']);
});

test('photon FFF route keeps photon target but makes filter-out state explicit',()=>{
  const route=headModeRouteState({mode:'photon',filter:'fff'});
  assert.deepEqual(route.stages.map(stage=>stage.id),['head-entrance','photon-target','photon-filter','monitor']);
  assert.match(route.stages[2].label,/FFF.*filter out/i);
  assert.match(route.topology,/fff-open-filter-position/);
});

test('electron route bypasses photon target and filter and uses dual scattering topology',()=>{
  const route=headModeRouteState({mode:'electron',filter:'ff'});
  assert.deepEqual(route.stages.map(stage=>stage.id),['head-entrance','electron-window','electron-scatter','monitor']);
  assert.match(route.stages[2].label,/primary.*shaped secondary foils/i);
  assert.deepEqual(route.inactive,['photon-target','photon-filter']);
});

test('route model contains no OEM service values or calibration thresholds',()=>{
  const text=JSON.stringify([
    headModeRouteState({mode:'photon',filter:'ff'}),
    headModeRouteState({mode:'photon',filter:'fff'}),
    headModeRouteState({mode:'electron'})
  ]);
  assert.doesNotMatch(text,/current|ampere|tesla|thickness|threshold|calibration|service/i);
});
