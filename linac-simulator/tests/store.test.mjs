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


test('slider input updates value and active highlight in one renderable state',()=>{
  const store=createStore();
  let notifications=0;
  store.subscribe(()=>{notifications+=1;});

  store.dispatch({type:'control/input',id:'r1',value:37});

  const state=store.getState();
  assert.equal(state.controls.r1,37);
  assert.equal(state.runtime.activeControlId,'r1');
  assert.equal(notifications,1);
});


test('machine power off always drops beam on state',()=>{
  const store=createStore();
  store.dispatch({type:'machine/setBeam',value:true});
  assert.equal(store.getState().machine.beamOn,true);

  store.dispatch({type:'machine/setPower',value:false});
  assert.equal(store.getState().machine.powerOn,false);
  assert.equal(store.getState().machine.beamOn,false);

  store.dispatch({type:'machine/setBeam',value:true});
  assert.equal(store.getState().machine.beamOn,false);
});

test('changing photon electron mode forces beam off',()=>{
  const store=createStore();
  store.dispatch({type:'machine/setBeam',value:true});
  store.dispatch({type:'machine/setMode',mode:'electron'});

  assert.equal(store.getState().machine.mode,'electron');
  assert.equal(store.getState().machine.beamOn,false);
});
