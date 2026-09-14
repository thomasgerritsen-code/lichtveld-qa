import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';
import {evaluateRadiationTransport} from '../src/physics/radiation-transport.js';
import {evaluateDelivery} from '../src/physics/delivery-state.js';
import {patientPlaneVisualState,headToIsocentreProjectionState} from '../src/ui/patient-plane.js';

function projection({mode='photon',filter='ff',controls={}}={}){
  const raw={...UI_DEFAULTS,...controls};
  const params=decodeControls(raw);
  const sim=simulate(params,{},{});
  const radiation=evaluateRadiationTransport(sim,{mode,filter,fieldXcm:params.fieldXcm,fieldYcm:params.fieldYcm});
  const delivery=evaluateDelivery({radiation,machine:{powerOn:true,beamOn:true},params,sim,mode,filter});
  const state=patientPlaneVisualState({sim,params,view:{mode,filter},radiation,delivery});
  return {state,projection:headToIsocentreProjectionState(state)};
}

test('head-to-isocentre projection keeps the golden-path order explicit',()=>{
  const {projection:p}=projection();
  assert.ok(p.headY<p.apertureY,'head source proxy must precede the collimation aperture');
  assert.ok(p.apertureY<p.isocentreY,'collimation aperture must precede the isocentre plane');
  assert.match(p.projectionLabel,/not to scale/i);
});

test('larger field opens the normalized head aperture and projected isocentre field together',()=>{
  const small=projection({controls:{fx:5,fy:5}}).projection;
  const large=projection({controls:{fx:30,fy:20}}).projection;
  assert.ok(large.apertureHalfWidth>small.apertureHalfWidth);
  assert.ok(large.isoHalfWidth>small.isoHalfWidth);
});

test('projection consumes existing transverse steering state instead of a second steering model',()=>{
  const nominal=projection().projection;
  const steered=projection({controls:{t1:60,t2:40}}).projection;
  assert.notEqual(steered.isoCenterX,nominal.isoCenterX);
});

test('mode changes only the educational topology labels, not proprietary dimensions',()=>{
  const photon=projection({mode:'photon'}).projection;
  const electron=projection({mode:'electron'}).projection;
  assert.match(photon.sourceLabel,/photon/i);
  assert.match(electron.sourceLabel,/electron/i);
  assert.match(photon.apertureLabel,/Agility/i);
  assert.match(electron.apertureLabel,/electron field/i);
  assert.equal(photon.isocentreY,electron.isocentreY);
});
