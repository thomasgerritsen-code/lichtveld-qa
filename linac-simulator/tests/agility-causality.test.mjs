import test from 'node:test';
import assert from 'node:assert/strict';
import {agilityFieldCausalityState} from '../src/ui/machine/agility-causality.js';

test('photon field X maps to Agility MLC leaf-travel axis',()=>{
  const visual=agilityFieldCausalityState({machine:{mode:'photon'},runtime:{activeControlId:'fx'}});
  assert.equal(visual.visible,true);
  assert.equal(visual.x.hardware,'Agility MLC banks');
  assert.equal(visual.x.role,'leaf-travel axis');
  assert.equal(visual.x.active,true);
  assert.equal(visual.y.active,false);
});

test('photon field Y maps to orthogonal sculpted diaphragms',()=>{
  const visual=agilityFieldCausalityState({machine:{mode:'photon'},runtime:{activeControlId:'fy'}});
  assert.equal(visual.y.hardware,'sculpted diaphragms');
  assert.equal(visual.y.role,'orthogonal field axis');
  assert.equal(visual.y.active,true);
  assert.equal(visual.x.active,false);
  assert.equal(visual.topology,'mlc-x-orthogonal-diaphragm-y');
});

test('Agility photon collimation overlay is inactive in electron mode',()=>{
  const visual=agilityFieldCausalityState({machine:{mode:'electron'},runtime:{activeControlId:'fx'}});
  assert.equal(visual.visible,false);
  assert.equal(visual.x.active,false);
  assert.equal(visual.y.active,false);
});

test('overlay geometry remains explicitly normalized educational',()=>{
  const visual=agilityFieldCausalityState({machine:{mode:'photon'},runtime:{activeControlId:null}});
  assert.equal(visual.geometry,'normalized-educational');
});
