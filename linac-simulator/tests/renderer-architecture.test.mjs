import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMechanicalGeometry,WAVE_ANCHORS} from '../src/ui/machine/geometry.js';
import {buildPatientTransportPath} from '../src/ui/machine/beam-renderer.js';
import {buildWaveguideCellSpecs,electronGunTopologySpec,inputModeTransformerSpec,slalomTopologyVisualState} from '../src/ui/machine/hardware.js';
import {electronApplicatorScatterVisual} from '../src/ui/machine/scatter-renderer.js';
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

test('slalom visual exposes three ordered normalized magnet stations around the beam path',()=>{
  const geometry=buildMechanicalGeometry();
  const stations=slalomTopologyVisualState();

  assert.deepEqual(stations.map(station=>station.id),['m1','m2','m3']);
  assert.deepEqual(stations.map(station=>station.role),[
    'first-dispersive-bend','counter-bend','final-achromatic-bend'
  ]);
  assert.ok(stations[0].pathIndex<stations[1].pathIndex);
  assert.ok(stations[1].pathIndex<stations[2].pathIndex);
  assert.equal(stations[0].pathIndex,geometry.marks.m1);
  assert.equal(stations[1].pathIndex,geometry.marks.m2);
  assert.equal(stations[2].pathIndex,geometry.marks.m3);
  assert.ok(stations.every(station=>Number.isFinite(station.x)&&Number.isFinite(station.y)));
  assert.ok(stations.every(station=>station.halfGap>0&&station.poleDepth>0));
  assert.ok(stations[2].halfLength>stations[0].halfLength);
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

test('RF input mode transformer remains at the gun-side entrance of the travelling-wave structure',()=>{
  const cells=buildWaveguideCellSpecs();
  const input=inputModeTransformerSpec();
  assert.equal(input.localX,cells[0].left);
  assert.ok(input.localWidth>0&&input.localWidth<(cells.at(-1).right-cells[0].left)/4);
  assert.ok(input.localHeight>cells[0].apertureRy*2);
  assert.match(input.rfFeedPath,/^M356 865/);
  assert.match(input.rfFeedPath,/194 752$/);
});

test('electron gun keeps cathode, control electrode and anode in injection order',()=>{
  const gun=electronGunTopologySpec();
  assert.ok(gun.cathodeX<gun.controlX);
  assert.ok(gun.controlX<gun.anodeX);
  assert.ok(gun.anodeX<gun.beamExitX);
  assert.ok(gun.apertureHalfHeight>0);
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

test('electron applicator scatter visual is electron-mode only and preserves component shares',()=>{
  const radiation={
    electronScatterFraction:.0255,
    electronPhotonContaminationFraction:.0045
  };
  const visual=electronApplicatorScatterVisual(radiation,'electron');

  assert.ok(visual);
  assert.equal(electronApplicatorScatterVisual(radiation,'photon'),null);
  assert.ok(Math.abs(visual.electronShare+.0+visual.photonShare-1)<1e-12);
  assert.ok(visual.electronShare>visual.photonShare);
  assert.ok(visual.photonRadius>visual.electronRadius);
  assert.ok(visual.electronOpacity>visual.photonOpacity);
});

test('electron applicator scatter visual disappears when no modeled scatter is present',()=>{
  assert.equal(electronApplicatorScatterVisual({
    electronScatterFraction:0,
    electronPhotonContaminationFraction:0
  },'electron'),null);
});
