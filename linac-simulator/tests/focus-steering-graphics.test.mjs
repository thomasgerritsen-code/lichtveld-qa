import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {focusSteeringTopologySpec,steeringCausalitySpec} from '../src/ui/machine/focus-steering-graphics.js';

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
  assert.match(source,/focusSolenoidTurn/);assert.match(source,/steeringRadialCoil/);assert.match(source,/steeringTransverseCoil/);
  assert.match(source,/steeringCausalityPath/);assert.match(source,/data-geometry':'normalized-educational'/);
  assert.match(css,/\.focusSolenoidTurn/);assert.match(css,/\.steeringChannelLabel/);assert.match(css,/\.steeringCausalityLink/);
});

test('bootstrap preserves mobile UX ordering and then initializes the source-backed overlay',()=>{
  const bootstrap=read('src/app/bootstrap.js');
  assert.match(bootstrap,/controller\.start\(\);\s*initMobileUx\(\);/);
  assert.match(bootstrap,/initFocusSteeringGraphics/);
  assert.ok(bootstrap.indexOf('initMobileUx()')<bootstrap.indexOf('initFocusSteeringGraphics()'));
});
