import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMechanicalGeometry} from '../src/ui/machine/geometry.js';
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
  assert.equal(cells.length,32);
  assert.equal(cells[0].x,18);
  assert.equal(cells.at(-1).x,622);
  assert.ok(cells.every((cell,index)=>index===0||cell.x>cells[index-1].x));
  assert.ok(cells[0].apertureRy>cells.at(-1).apertureRy);
});
