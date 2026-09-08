import test from 'node:test';
import assert from 'node:assert/strict';
import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';
import {evaluateRadiationTransport} from '../src/physics/radiation-transport.js';
import {evaluateDelivery} from '../src/physics/delivery-state.js';

function run(overrides={}){
  const params=decodeControls({...UI_DEFAULTS,...overrides});
  const sim=simulate(params,{},{});
  const radiation=evaluateRadiationTransport(sim,{
    mode:'photon',
    filter:'ff',
    fieldXcm:params.fieldXcm,
    fieldYcm:params.fieldYcm
  });
  const delivery=evaluateDelivery({
    radiation,
    machine:{powerOn:true,beamOn:true},
    params,
    sim,
    mode:'photon',
    filter:'ff'
  });
  return {params,sim,radiation,delivery};
}
const stage=(sim,name)=>sim.stages.find(s=>s.name===name);
const close=(a,b,eps=1e-11)=>Math.abs(a-b)<=eps;

test('Focus 1 changes only envelope and not centroid or angle',()=>{
  const low=run({f1:0});
  const high=run({f1:100});

  for(const name of ['gun','focus1','steer1','wgAfter1','focus2','wgAfter2','steer2','wgExit','bendEntry','m1','m2','m3','target']){
    const a=stage(low.sim,name),b=stage(high.sim,name);
    assert.ok(close(a.r,b.r));
    assert.ok(close(a.rp,b.rp));
    assert.ok(close(a.t,b.t));
    assert.ok(close(a.tp,b.tp));
  }
  assert.ok(stage(high.sim,'focus1').sigmaR<stage(low.sim,'focus1').sigmaR);
  assert.ok(stage(high.sim,'focus1').sigmaT<stage(low.sim,'focus1').sigmaT);
});

test('Focus 2 is a second envelope compression after Focus 1',()=>{
  const noF2=run({f1:100,f2:0});
  const withF2=run({f1:100,f2:100});

  assert.ok(stage(withF2.sim,'focus2').sigmaR<stage(noF2.sim,'focus2').sigmaR);
  assert.ok(stage(withF2.sim,'focus2').sigmaT<stage(noF2.sim,'focus2').sigmaT);
  assert.ok(stage(withF2.sim,'focus2').sigmaR<stage(withF2.sim,'focus1').sigmaR);
});

for(const id of ['r1','t1','r2','t2']){
  test(`${id.toUpperCase()} can steer the beam into the waveguide wall`,()=>{
    const x=run({[id]:100});
    assert.ok(x.radiation.hardStrike);
    assert.ok(['wgAfter1','wgAfter2','wgExit','bendEntry'].includes(x.radiation.hardStrike.stage));
    assert.equal(x.delivery.usefulDoseRate,0);
  });
}

test('magnetron power, tune and RF phase alter capture and effective beam energy',()=>{
  const nominal=run();
  const lowPower=run({magPower:25});
  const detuned=run({magTune:80});
  const phase=run({rfPhase:80});

  assert.equal(nominal.sim.rf.rfEfficiency,1);
  assert.ok(lowPower.sim.rf.rfEfficiency<nominal.sim.rf.rfEfficiency);
  assert.ok(detuned.sim.rf.rfEfficiency<nominal.sim.rf.rfEfficiency);
  assert.ok(phase.sim.rf.rfEfficiency<nominal.sim.rf.rfEfficiency);
  assert.notEqual(lowPower.sim.rf.effectiveEnergy,nominal.sim.rf.effectiveEnergy);
  assert.notEqual(detuned.sim.rf.effectiveSpread,nominal.sim.rf.effectiveSpread);
});

test('gun emission and timing change useful dose rate through source capture',()=>{
  const nominal=run();
  const halfEmission=run({gunEmission:50});
  const badTiming=run({gunTiming:80});
  const noEmission=run({gunEmission:0});

  assert.ok(halfEmission.delivery.usefulDoseRate<nominal.delivery.usefulDoseRate);
  assert.ok(badTiming.delivery.usefulDoseRate<nominal.delivery.usefulDoseRate);
  assert.equal(noEmission.delivery.usefulDoseRate,0);
  assert.equal(noEmission.delivery.sourceActive,false);
});
