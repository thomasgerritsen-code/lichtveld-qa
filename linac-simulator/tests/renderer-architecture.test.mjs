import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMechanicalGeometry} from '../src/ui/machine/geometry.js';
import * as renderer from '../src/ui/machine-renderer.js';

test('split machine renderer import graph loads without executing DOM work',()=>{
  assert.equal(typeof renderer.initHardware,'function');
  assert.equal(typeof renderer.render,'function');
  assert.equal(typeof renderer.setActiveControlEffect,'function');
});

test('mechanical geometry remains available through the split renderer layer',()=>{
  const geometry=buildMechanicalGeometry();
  assert.ok(Array.isArray(geometry.points));
  assert.ok(geometry.points.length>20);
  assert.ok(geometry.marks.m1<geometry.marks.m2);
  assert.ok(geometry.marks.m2<geometry.marks.m3);
  assert.ok(geometry.marks.m3<geometry.marks.target);
});
