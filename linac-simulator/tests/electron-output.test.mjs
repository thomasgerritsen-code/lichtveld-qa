import test from 'node:test';
import assert from 'node:assert/strict';
import {electronConeOutputProxy,evaluateDelivery} from '../src/physics/delivery-state.js';

const nominalRadiation={primaryTransmission:1};
const nominalMachine={powerOn:true,beamOn:true};
const nominalSim={rf:{sourceFactor:1,emissionFactor:1}};

function electronDelivery(fieldXcm,fieldYcm){
  return evaluateDelivery({
    radiation:nominalRadiation,
    machine:nominalMachine,
    params:{doseRateSet:600,fieldXcm,fieldYcm},
    sim:nominalSim,
    mode:'electron',
    filter:'ff'
  });
}

test('electron cone output proxy is normalized at the 10x10 educational reference',()=>{
  assert.equal(electronConeOutputProxy(10,10),1);
  assert.equal(electronDelivery(10,10).fieldFactor,1);
});

test('electron cone output proxy responds to applicator/cutout field size',()=>{
  const small=electronConeOutputProxy(4,4);
  const reference=electronConeOutputProxy(10,10);
  const large=electronConeOutputProxy(20,20);
  assert.ok(small<reference);
  assert.ok(large>reference);
  assert.ok(small>.9);
  assert.ok(large<1.05);
});

test('rectangular electron fields use equivalent-square geometry instead of ignoring field size',()=>{
  const a=electronConeOutputProxy(5,20);
  const b=electronConeOutputProxy(20,5);
  assert.ok(Math.abs(a-b)<1e-12);
  assert.notEqual(a,1);
});

test('electron field factor changes patient-output proxy but never the useful dose-rate setpoint path',()=>{
  const small=electronDelivery(4,4);
  const large=electronDelivery(20,20);
  assert.equal(small.usefulDoseRate,600);
  assert.equal(large.usefulDoseRate,600);
  assert.ok(small.patientOutputProxy<small.usefulDoseRate);
  assert.ok(large.patientOutputProxy>large.usefulDoseRate);
});
