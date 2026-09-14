import test from 'node:test';
import assert from 'node:assert/strict';

import {primaryCollimatorVisualState} from '../src/ui/machine/head-graphics.js';

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
