import test from 'node:test';
import assert from 'node:assert/strict';
import {createStore} from '../src/app/store.js';

test('store keeps machine, controls and display state separated',()=>{
  const store=createStore();
  const before=store.getState();

  store.dispatch({type:'control/set',id:'r1',value:25});
  const afterControl=store.getState();
  assert.equal(afterControl.controls.r1,25);
  assert.equal(afterControl.machine.mode,before.machine.mode);

  store.dispatch({type:'machine/set',key:'mode',value:'electron'});
  const afterMode=store.getState();
  assert.equal(afterMode.machine.mode,'electron');
  assert.equal(afterMode.controls.r1,25);

  store.dispatch({type:'display/set',key:'dispersion',value:false});
  assert.equal(store.getState().display.dispersion,false);
});

test('reset creates a clean independent state',()=>{
  const store=createStore();
  store.dispatch({type:'control/set',id:'r2',value:80});
  store.dispatch({type:'machine/set',key:'direction',value:'ccw'});
  store.dispatch({type:'app/reset'});

  const state=store.getState();
  assert.equal(state.controls.r2,0);
  assert.equal(state.machine.direction,'cw');
  assert.equal(state.machine.mode,'photon');
  assert.equal(state.display.dispersion,true);
});
