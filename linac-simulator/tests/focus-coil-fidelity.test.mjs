import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../src/ui/machine/focus-coil-fidelity.js',import.meta.url),'utf8');
const bootstrap=fs.readFileSync(new URL('../src/app/bootstrap.js',import.meta.url),'utf8');

test('focus artwork is explicitly normalized and models a coil pack around the waveguide',()=>{
  assert.match(source,/normalized-educational/);
  assert.match(source,/solenoidal-coil-pack-around-accelerating-waveguide/);
  assert.match(source,/innerHalfHeight/);
  assert.match(source,/outerHalfHeight/);
});

test('both Focus 1 and Focus 2 receive the same coherent sleeve construction',()=>{
  assert.match(source,/\['focus1','focus2'\]/);
  assert.match(source,/focusCoilFidelity/);
  assert.match(source,/turnCount/);
});

test('legacy diamond windings are retired without removing interaction hooks',()=>{
  assert.match(source,/querySelectorAll\('\.focusWinding'\)/);
  assert.match(source,/data-legacy-visual/);
  assert.doesNotMatch(source,/remove\(\)/);
});

test('bootstrap initializes fidelity artwork after existing focus steering graphics',()=>{
  const steering=bootstrap.indexOf('initFocusSteeringGraphics();');
  const fidelity=bootstrap.indexOf('initFocusCoilFidelity();');
  assert.ok(steering>=0 && fidelity>steering);
});

test('visual module contains no service or clinical calibration parameters',()=>{
  assert.doesNotMatch(source,/coilCurrent|ampere|tesla|serviceThreshold|calibrationValue|clinicalDose/i);
});
