import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {focusSteeringTopologySpec,steeringCausalitySpec,steeringCoilSpec} from '../src/ui/machine/focus-steering-graphics.js';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');

test('focus and steering topology follows the public Elekta stage order',()=>{
  const specs=focusSteeringTopologySpec();
  assert.deepEqual(specs.map(spec=>spec.stage),['focus1','steer1','focus2','steer2']);
  assert.deepEqual(specs.map(spec=>spec.kind),['focus','steering','focus','steering']);
  for(let index=1;index<specs.length;index++) assert.ok(specs[index].x>specs[index-1].x);
});

test('primary and secondary steering are given distinct educational roles and effects',()=>{
  const byStage=Object.fromEntries(focusSteeringTopologySpec().map(spec=>[spec.stage,spec]));
  assert.equal(byStage.steer1.role,'primary-injection-centering');
  assert.equal(byStage.steer1.effect,'trajectory-centering-and-wall-clearance');
  assert.equal(byStage.steer2.role,'secondary-target-angle-alignment');
  assert.equal(byStage.steer2.effect,'downstream-axis-and-target-alignment');
  assert.deepEqual(byStage.steer1.channels,['R','T']);
  assert.deepEqual(byStage.steer2.channels,['R','T']);
});

test('educational causality path connects focus, steering, wall clearance and downstream alignment',()=>{
  assert.deepEqual(steeringCausalitySpec().map(link=>[link.from,link.to]),[
    ['focus1','steer1'],['steer1','focus2'],['focus2','steer2'],['steer2','bendEntry']
  ]);
  const labels=steeringCausalitySpec().map(link=>link.label).join(' ');
  assert.match(labels,/envelope/);assert.match(labels,/wall clearance/);assert.match(labels,/target alignment/);
});

test('focus graphics read as solenoid windings while steering keeps R and T visually distinct',()=>{
  const source=read('src/ui/machine/focus-steering-graphics.js');
  const css=read('focus-steering.css');
  assert.match(read('src/ui/machine/focus-coil-fidelity.js'),/longitudinal-cutaway/);assert.match(source,/steeringRadialCoil/);assert.match(source,/steeringTransverseCoil/);
  assert.match(source,/steeringCrossSection/);assert.match(source,/part.replaceChildren/);assert.match(source,/data-geometry':'normalized-educational'/);
  assert.match(css,/\.focusSolenoidTurn/);assert.match(css,/\.steeringChannelLabel/);assert.match(css,/\.steeringCausalityLink/);
});

test('bootstrap preserves mobile UX ordering and then initializes the source-backed overlay',()=>{
  const bootstrap=read('src/app/bootstrap.js');
  assert.match(bootstrap,/controller\.start\(\);\s*initMobileUx\(\);/);
  assert.match(bootstrap,/initFocusSteeringGraphics/);
  assert.ok(bootstrap.indexOf('initMobileUx()')<bootstrap.indexOf('initFocusSteeringGraphics()'));
});


test('steering coils surround the guide and remain two orthogonal circuits',()=>{
  const spec=steeringCoilSpec();
  assert.ok(spec.coilInner>spec.guideHalfHeight);
  assert.ok(spec.coilOuter>spec.coilInner);
  assert.equal(spec.radialDirection,'in-bending-plane');
  assert.equal(spec.transverseDirection,'out-of-bending-plane');
});
test('both steering stations use the accelerator axis and secondary steering is near its midpoint',()=>{
  const specs=focusSteeringTopologySpec();
  for(const s of specs)assert.ok(Math.abs(s.y-(765+(s.x-165)*Math.tan(-Math.PI/8)))<1e-8);
  const secondary=specs.find(s=>s.stage==='steer2');
  assert.ok(Math.abs((secondary.x-165)/(784-165)-.5)<.05);
  for(let i=1;i<specs.length;i++){
    const distance=Math.hypot(specs[i].x-specs[i-1].x,specs[i].y-specs[i-1].y);
    assert.ok(distance>(specs[i].length+specs[i-1].length)/2);
  }
});
