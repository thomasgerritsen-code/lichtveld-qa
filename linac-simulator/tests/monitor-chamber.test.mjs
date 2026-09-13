import test from 'node:test';
import assert from 'node:assert/strict';

import {chamberSignals,buildControlContext} from '../src/physics/feedback.js';

function simTarget(target={}){
  return {
    target:{r:0,rp:0,t:0,tp:0,...target}
  };
}

test('nominal beam gives two matching redundant monitor channels and zero steering tilt',()=>{
  const chamber=chamberSignals(simTarget());
  assert.equal(chamber.primaryMonitor,1);
  assert.equal(chamber.secondaryMonitor,1);
  assert.equal(chamber.monitorMean,1);
  assert.equal(chamber.monitorDifference,0);
  assert.equal(chamber.radialTilt,0);
  assert.equal(chamber.transverseTilt,0);
  assert.equal(chamber.doseA,chamber.primaryMonitor);
  assert.equal(chamber.doseB,chamber.secondaryMonitor);
});

test('beam offset changes steering feedback while redundant output channels still track the same common loss',()=>{
  const chamber=chamberSignals(simTarget({r:.04,rp:.02,t:-.03,tp:.015}));
  assert.notEqual(chamber.radialTilt,0);
  assert.notEqual(chamber.transverseTilt,0);
  assert.ok(chamber.monitorMean<1);
  assert.ok(Math.abs(chamber.monitorDifference)<=.0080000001);
  assert.ok(Math.abs(chamber.primaryMonitor-chamber.monitorMean)<=.0040000001);
  assert.ok(Math.abs(chamber.secondaryMonitor-chamber.monitorMean)<=.0040000001);
});

test('larger target mismatch lowers monitor mean without introducing an interlock threshold',()=>{
  const mild=chamberSignals(simTarget({r:.01,rp:.005}));
  const larger=chamberSignals(simTarget({r:.08,rp:.06,t:.05,tp:.04}));
  assert.ok(larger.monitorMean<mild.monitorMean);
  assert.ok(larger.monitorMean>0);
  assert.ok(Number.isFinite(larger.primaryMonitor));
  assert.ok(Number.isFinite(larger.secondaryMonitor));
});

test('control context exposes redundant monitor channels without changing the conservative servo policy',()=>{
  const context=buildControlContext({mode:'servo',angleDeg:120,direction:'cw',preSim:simTarget({r:.02,rp:.01})});
  assert.ok(Number.isFinite(context.chamber.primaryMonitor));
  assert.ok(Number.isFinite(context.chamber.secondaryMonitor));
  assert.equal(context.servoPolicy.r2,true);
  assert.equal(context.servoPolicy.t2,false);
  assert.ok(Math.abs(context.servo.r2)>0);
  assert.equal(context.servo.t2,0);
});
