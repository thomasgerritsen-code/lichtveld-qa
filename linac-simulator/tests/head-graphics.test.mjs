import test from 'node:test';
import assert from 'node:assert/strict';

import {opticalFieldVisualState,primaryCollimatorVisualState,targetAssemblyVisualState} from '../src/ui/machine/head-graphics.js';

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
