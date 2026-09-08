import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';
import {evaluateRadiationTransport} from '../src/physics/radiation-transport.js';
import {evaluateDelivery,photonOutputFactorProxy,equivalentSquare} from '../src/physics/delivery-state.js';

function nominal({fx=10,fy=10,doseRateSet=600,filter='ff',powerOn=true,beamOn=false}={}){
  const params=decodeControls({...UI_DEFAULTS,fx,fy,doseRateSet});
  const sim=simulate(params,{},{});
  const radiation=evaluateRadiationTransport(sim,{mode:'photon',filter,fieldXcm:fx,fieldYcm:fy});
  return evaluateDelivery({
    radiation,
    machine:{powerOn,beamOn},
    params,
    sim,
    mode:'photon',
    filter
  });
}

test('beam off and machine off both produce zero delivered dose rate',()=>{
  assert.equal(nominal({powerOn:true,beamOn:false}).usefulDoseRate,0);
  assert.equal(nominal({powerOn:false,beamOn:true}).usefulDoseRate,0);
});

test('nominal beam on reproduces the selected dose-rate setpoint at 10x10',()=>{
  const d=nominal({beamOn:true,doseRateSet:600,fx:10,fy:10});
  assert.equal(d.beamActive,true);
  assert.ok(Math.abs(d.fieldFactor-1)<1e-12);
  assert.ok(Math.abs(d.usefulDoseRate-600)<1e-9);
});

test('field output proxy is normalized at 10x10 and follows published broad trend',()=>{
  assert.ok(Math.abs(photonOutputFactorProxy(10,10,'ff')-1)<1e-12);
  assert.ok(photonOutputFactorProxy(1,1,'ff')<1);
  assert.ok(photonOutputFactorProxy(40,40,'ff')>1);
  assert.ok(photonOutputFactorProxy(40,40,'fff')<photonOutputFactorProxy(40,40,'ff'));
});

test('equivalent square treats rectangular field dimensions symmetrically',()=>{
  assert.equal(equivalentSquare(20,10),equivalentSquare(10,20));
  assert.ok(equivalentSquare(20,10)>10);
  assert.ok(equivalentSquare(20,10)<20);
});
