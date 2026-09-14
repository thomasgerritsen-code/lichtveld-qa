import test from 'node:test';
import assert from 'node:assert/strict';

import {chamberSignals,buildControlContext} from '../src/physics/feedback.js';
import {monitorChamberVisualState} from '../src/ui/machine/treatment-head.js';

function simTarget(target={}){
  return {
    target:{r:0,rp:0,t:0,tp:0,...target}
  };
}

test('nominal beam gives two matching redundant monitor channels and six equal uniformity sectors',()=>{
  const chamber=chamberSignals(simTarget());
  assert.equal(chamber.primaryMonitor,1);
  assert.equal(chamber.secondaryMonitor,1);
  assert.equal(chamber.monitorMean,1);
  assert.equal(chamber.monitorDifference,0);
  assert.equal(chamber.radialTilt,0);
  assert.equal(chamber.transverseTilt,0);
  assert.deepEqual(chamber.uniformitySectors,[1,1,1,1,1,1]);
  assert.equal(chamber.uniformityMean,1);
  assert.equal(chamber.uniformitySpan,0);
  assert.equal(chamber.doseA,chamber.primaryMonitor);
  assert.equal(chamber.doseB,chamber.secondaryMonitor);
});

test('monitor graphics expose two dose layers plus six collection plates and a distinct seventh electrode indicator',()=>{
  const visual=monitorChamberVisualState();
  assert.equal(visual.role,'monitor-chamber-stack');
  assert.equal(visual.dosePlanes.length,2);
  assert.deepEqual(
    visual.dosePlanes.map(plane=>plane.role),
    ['primary-dose-monitor','backup-dose-monitor']
  );
  assert.equal(visual.qualityPlane.role,'beam-quality-monitor');
  assert.equal(visual.qualityPlane.collectionPlateCount,6);
  assert.equal(visual.qualityPlane.electrodeCount,7);
  assert.equal(visual.qualityPlane.seventhElectrode.role,'beam-quality-seventh-electrode-indicator');
  assert.equal(visual.qualityPlane.electrodeCount,visual.qualityPlane.collectionPlateCount+1);
  assert.ok(visual.dosePlanes[0].y<visual.dosePlanes[1].y);
  assert.ok(visual.dosePlanes[1].y<visual.qualityPlane.y);
  assert.ok(visual.qualityPlane.y<visual.qualityPlane.seventhElectrode.y);
  assert.ok(visual.qualityPlane.seventhElectrode.y<visual.housing.y+visual.housing.height);
});

test('beam offset changes steering feedback and produces an opposing six-sector pattern',()=>{
  const chamber=chamberSignals(simTarget({r:.04,rp:.02,t:-.03,tp:.015}));
  assert.notEqual(chamber.radialTilt,0);
  assert.notEqual(chamber.transverseTilt,0);
  assert.ok(chamber.monitorMean<1);
  assert.equal(chamber.uniformitySectors.length,6);
  assert.ok(chamber.uniformitySpan>0);
  for(let i=0;i<3;i++){
    const pairMean=(chamber.uniformitySectors[i]+chamber.uniformitySectors[i+3])/2;
    assert.ok(Math.abs(pairMean-chamber.uniformityMean)<1e-12);
  }
  assert.ok(Math.abs(chamber.monitorDifference)<=.0080000001);
  assert.ok(Math.abs(chamber.primaryMonitor-chamber.monitorMean)<=.0040000001);
  assert.ok(Math.abs(chamber.secondaryMonitor-chamber.monitorMean)<=.0040000001);
});

test('radial and transverse offsets rotate the six-sector response rather than changing its topology',()=>{
  const radial=chamberSignals(simTarget({r:.04}));
  const transverse=chamberSignals(simTarget({t:.04}));
  assert.equal(radial.uniformitySectors.length,6);
  assert.equal(transverse.uniformitySectors.length,6);
  assert.ok(radial.uniformitySpan>0);
  assert.ok(transverse.uniformitySpan>0);
  assert.notDeepEqual(radial.uniformitySectors,transverse.uniformitySectors);
  assert.ok(Math.abs(radial.uniformityMean-radial.monitorMean)<1e-12);
  assert.ok(Math.abs(transverse.uniformityMean-transverse.monitorMean)<1e-12);
});

test('larger target mismatch lowers monitor mean without introducing an interlock threshold',()=>{
  const mild=chamberSignals(simTarget({r:.01,rp:.005}));
  const larger=chamberSignals(simTarget({r:.08,rp:.06,t:.05,tp:.04}));
  assert.ok(larger.monitorMean<mild.monitorMean);
  assert.ok(larger.monitorMean>0);
  assert.ok(Number.isFinite(larger.primaryMonitor));
  assert.ok(Number.isFinite(larger.secondaryMonitor));
  assert.ok(larger.uniformitySectors.every(Number.isFinite));
});

test('control context exposes redundant and six-sector monitor signals without changing conservative servo policy',()=>{
  const context=buildControlContext({mode:'servo',angleDeg:120,direction:'cw',preSim:simTarget({r:.02,rp:.01})});
  assert.ok(Number.isFinite(context.chamber.primaryMonitor));
  assert.ok(Number.isFinite(context.chamber.secondaryMonitor));
  assert.equal(context.chamber.uniformitySectors.length,6);
  assert.equal(context.servoPolicy.r2,true);
  assert.equal(context.servoPolicy.t2,false);
  assert.ok(Math.abs(context.servo.r2)>0);
  assert.equal(context.servo.t2,0);
});
