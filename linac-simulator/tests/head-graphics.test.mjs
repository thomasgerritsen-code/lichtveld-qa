import test from 'node:test';
import assert from 'node:assert/strict';

import {electronScatteringFoilVisualState,electronWindowVisualState,opticalFieldVisualState,primaryCollimatorVisualState,targetAssemblyVisualState} from '../src/ui/machine/head-graphics.js';

test('primary collimator is represented as a fixed downstream-diverging conical aperture',()=>{
  const visual=primaryCollimatorVisualState();

  assert.equal(visual.role,'fixed-primary-collimator');
  assert.equal(visual.apertureTopology,'downstream-diverging-conical');
  assert.ok(visual.apertureBottomHalf>visual.apertureTopHalf);
  assert.match(visual.leftPath,/L/);
  assert.match(visual.rightPath,/L/);
});

test('primary collimator paths remain symmetric around the treatment-head axis',()=>{
  const visual=primaryCollimatorVisualState();
  const topLeft=visual.center-visual.apertureTopHalf;
  const topRight=visual.center+visual.apertureTopHalf;
  const bottomLeft=visual.center-visual.apertureBottomHalf;
  const bottomRight=visual.center+visual.apertureBottomHalf;

  assert.equal(visual.center-topLeft,topRight-visual.center);
  assert.equal(visual.center-bottomLeft,bottomRight-visual.center);
  assert.ok(bottomLeft<topLeft);
  assert.ok(bottomRight>topRight);
});

test('photon target is a compact backed assembly upstream of the primary collimator',()=>{
  const target=targetAssemblyVisualState();
  const primary=primaryCollimatorVisualState();

  assert.equal(target.role,'photon-target-assembly');
  assert.equal(target.topology,'thin-target-with-backing-upstream-of-primary-collimator');
  assert.equal(target.center,primary.center);
  assert.ok(target.faceWidth<target.backingWidth);
  assert.ok(target.faceHeight<target.backingHeight);
  assert.ok(target.backingY+target.backingHeight<primary.top);
  assert.ok(target.downstreamClearance>0);
});

test('target face and backing remain symmetric around the treatment-head axis',()=>{
  const target=targetAssemblyVisualState();

  assert.equal(target.center-target.faceX,target.faceWidth/2);
  assert.equal(target.center-target.backingX,target.backingWidth/2);
  assert.equal(target.faceX+target.faceWidth/2,target.center);
  assert.equal(target.backingX+target.backingWidth/2,target.center);
});

test('electron window is depicted as a thin membrane in a wider support frame',()=>{
  const window=electronWindowVisualState();

  assert.equal(window.role,'electron-vacuum-exit-window');
  assert.equal(window.topology,'thin-membrane-in-support-frame-upstream-of-scattering-foils');
  assert.equal(window.membraneRole,'electron-window-membrane');
  assert.equal(window.frameRole,'electron-window-support');
  assert.ok(window.membraneWidth<window.frameWidth);
  assert.ok(window.membraneHeight<window.frameHeight);
  assert.equal(window.membraneX+window.membraneWidth/2,window.center);
  assert.equal(window.frameX+window.frameWidth/2,window.center);
});

test('electron window remains upstream and visually separate from electron scattering foils',()=>{
  const window=electronWindowVisualState();

  assert.ok(window.downstreamSeparation>0);
  assert.ok(window.membraneY<window.scatteringFoilY);
});

test('electron mode depicts a dual scattering system in the public beamline order',()=>{
  const window=electronWindowVisualState();
  const foils=electronScatteringFoilVisualState();

  assert.equal(foils.role,'electron-dual-scattering-foil-system');
  assert.equal(foils.topology,'thin-primary-foil-followed-by-shaped-secondary-foil');
  assert.deepEqual(foils.ordering,['electron-window','primary-scattering-foil','secondary-scattering-foil','monitor-chamber']);
  assert.ok(window.membraneY<foils.primary.y);
  assert.ok(foils.primary.y<foils.secondary.y);
  assert.ok(foils.secondary.y<902);
});

test('dual scattering foil drawing stays centered and distinguishes thin primary from shaped secondary',()=>{
  const foils=electronScatteringFoilVisualState();

  assert.equal((foils.primary.x1+foils.primary.x2)/2,foils.center);
  assert.match(foils.secondary.path,/Q/);
  assert.equal(foils.primary.role,'primary-electron-scattering-foil');
  assert.equal(foils.secondary.role,'secondary-electron-scattering-foil');
});

test('optical field system depicts a tilted mirror crossing the treatment axis and a separate lamp',()=>{
  const optical=opticalFieldVisualState();

  assert.equal(optical.role,'optical-field-system');
  assert.equal(optical.topology,'tilted-field-mirror-with-off-axis-lamp');
  assert.equal(optical.mirrorRole,'field-light-mirror');
  assert.equal(optical.lampRole,'field-light-lamp');
  assert.equal(optical.mirrorCrossesBeamAxis,true);
  assert.notEqual(optical.mirrorLeft.y,optical.mirrorRight.y);
  assert.ok(Math.abs(optical.lampOffsetFromAxis)>optical.lamp.r);
});

test('optical field mirror remains downstream of the monitor stack and upstream of the collimator exit',()=>{
  const optical=opticalFieldVisualState();

  assert.ok(optical.mirrorLeft.y>934);
  assert.ok(optical.mirrorRight.y<971);
});
