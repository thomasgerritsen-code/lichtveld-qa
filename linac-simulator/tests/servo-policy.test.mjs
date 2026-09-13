import test from 'node:test';
import assert from 'node:assert/strict';

import {servoAssist,servoChannelPolicy,buildControlContext} from '../src/physics/feedback.js';

test('generic Elekta servo policy keeps universally published 2R servo and disables energy-dependent 2T servo',()=>{
  const policy=servoChannelPolicy();
  assert.equal(policy.r2,true);
  assert.equal(policy.t2,false);
});

test('servo correction responds radially but does not invent a universal transverse servo',()=>{
  const correction=servoAssist({radialTilt:.08,transverseTilt:.08});
  assert.ok(correction.r2>0);
  assert.equal(correction.t2,0);
});

test('manual and LUT modes remain servo-free while servo mode applies the conservative policy',()=>{
  const preSim={
    target:{r:.03,rp:.02,t:.03,tp:.02}
  };

  const manual=buildControlContext({mode:'manual',angleDeg:90,direction:'cw',preSim});
  const lut=buildControlContext({mode:'lut',angleDeg:90,direction:'cw',preSim});
  const servo=buildControlContext({mode:'servo',angleDeg:90,direction:'cw',preSim});

  assert.deepEqual(manual.servo,{r2:0,t2:0});
  assert.deepEqual(lut.servo,{r2:0,t2:0});
  assert.ok(Math.abs(servo.servo.r2)>0);
  assert.equal(servo.servo.t2,0);
  assert.equal(servo.servoPolicy.r2,true);
  assert.equal(servo.servoPolicy.t2,false);
});
