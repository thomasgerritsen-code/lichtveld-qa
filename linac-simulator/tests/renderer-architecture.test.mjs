import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMechanicalGeometry,WAVE_ANCHORS} from '../src/ui/machine/geometry.js';
import {buildPatientTransportPath} from '../src/ui/machine/beam-renderer.js';
import {buildWaveguideCellSpecs} from '../src/ui/machine/hardware.js';
import * as renderer from '../src/ui/machine-renderer.js';

test('split machine renderer import graph loads without executing DOM work',()=>{
  assert.equal(typeof renderer.initHardware,'function');
  assert.equal(typeof renderer.render,'function');
  assert.equal(typeof renderer.setActiveControlEffect,'function');
});

test('mechanical geometry remains available through the split renderer layer',()=>{
  const geometry=buildMechanicalGeometry();
  assert.ok(Array.isArray(geometry.points));
  assert.ok(geometry.points.length>20);
  assert.ok(geometry.marks.m1<geometry.marks.m2);
  assert.ok(geometry.marks.m2<geometry.marks.m3);
  assert.ok(geometry.marks.m3<geometry.marks.target);
});

test('active useful beam continues from target to patient plane',()=>{
  const target={x:1145,y:760,state:{}};
  const photon=buildPatientTransportPath(target,{
    mode:'photon',radiationActive:true,outputFraction:1
  });
  const electron=buildPatientTransportPath(target,{
    mode:'electron',radiationActive:true,outputFraction:1
  });

  assert.equal(photon.at(-1).y,1080);
  assert.equal(photon.at(-1).kind,'photon');
  assert.equal(electron.at(-1).kind,'treatment-electron');
  assert.deepEqual(buildPatientTransportPath(target,{
    radiationActive:false,outputFraction:1
  }),[]);
});

test('travelling waveguide exposes a detailed sequence of RF chambers',()=>{
  const cells=buildWaveguideCellSpecs();
  assert.equal(cells.length,18);
  assert.equal(cells[0].left,20);
  assert.equal(cells.at(-1).right,646);
  assert.ok(cells.every((cell,index)=>index===0||cell.x>cells[index-1].x));
  assert.ok(cells[0].apertureRy>cells.at(-1).apertureRy);
});

test('SL25 source order keeps focus and steering packages in their published sequence',()=>{
  assert.deepEqual(
    WAVE_ANCHORS.map(anchor=>anchor.stage),
    ['gun','focus1','steer1','wgAfter1','focus2','wgAfter2','steer2','wgExit','bendEntry']
  );

  const x=Object.fromEntries(WAVE_ANCHORS.map(anchor=>[anchor.stage,anchor.x]));
  assert.ok(x.focus1<x.steer1);
  assert.ok(x.steer1<x.focus2&&x.focus2<x.steer2);
  assert.ok((x.steer2-x.gun)/(x.bendEntry-x.gun)<.75);
});
