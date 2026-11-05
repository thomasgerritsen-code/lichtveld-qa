import test from 'node:test';
import assert from 'node:assert/strict';
import {mlcBeamEyeState,ANATOMY_VIEWS,ANATOMY_SOURCES} from '../src/ui/machine/anatomy-view.js';
import {electronScatteringFoilVisualState,primaryCollimatorVisualState,electronWindowVisualState} from '../src/ui/machine/head-graphics.js';
import {monitorChamberVisualState} from '../src/ui/machine/treatment-head.js';
import {backscatterPlateVisualState} from '../src/ui/machine/backscatter-plate.js';

test('beam-eye anatomy contains 80 rows in one plane for two 80-leaf banks',()=>{
  const v=mlcBeamEyeState();
  assert.equal(v.rows.length,80);assert.equal(v.rows.length*2,160);
  assert.equal(new Set(v.rows.map(r=>r.index)).size,80);
  assert.ok(v.rows.every((r,i)=>r.height>0&&(i===0||r.y>v.rows[i-1].y)));
});
test('orthogonal aperture axes respond independently to X and Y field settings',()=>{
  const base=mlcBeamEyeState(10,10),x=mlcBeamEyeState(20,10),y=mlcBeamEyeState(10,20);
  assert.ok(x.halfX>base.halfX);assert.equal(x.halfY,base.halfY);
  assert.equal(y.halfX,base.halfX);assert.ok(y.halfY>base.halfY);
});
test('electron-mode MLC is parked rather than removed',()=>{
  const p=mlcBeamEyeState(10,10),e=mlcBeamEyeState(10,10,'electron');
  assert.ok(e.parked);assert.ok(e.halfX>p.halfX);assert.equal(e.rows.length,80);
});
test('primary scattering foil is between the window and primary collimator; secondary foil is downstream',()=>{
  const f=electronScatteringFoilVisualState(),c=primaryCollimatorVisualState(),w=electronWindowVisualState();
  assert.ok(w.membraneY<f.primary.y);assert.ok(f.primary.y<c.top);
  assert.ok(c.bottom<f.secondary.y);
});
test('backscatter plate clears the complete monitor housing',()=>{
  const m=monitorChamberVisualState(),p=backscatterPlateVisualState();
  assert.ok(m.housing.y+m.housing.height<p.y);
  assert.equal(m.qualityPlane.seventhElectrode.y,m.qualityPlane.y);
});
test('anatomy offers four finite reference views and six attributed sources',()=>{
  assert.equal(Object.keys(ANATOMY_VIEWS).length,4);
  for(const v of Object.values(ANATOMY_VIEWS))assert.equal(v.box.split(' ').map(Number).filter(Number.isFinite).length,4);
  assert.equal(ANATOMY_SOURCES.length,6);
  assert.ok(ANATOMY_SOURCES.every(s=>s.url.startsWith('https://')));
});
