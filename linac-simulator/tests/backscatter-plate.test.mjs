import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {backscatterPlateVisualState} from '../src/ui/machine/backscatter-plate.js';

test('backscatter plate follows the public Elekta treatment-head order',()=>{
  const plate=backscatterPlateVisualState();

  assert.equal(plate.role,'monitor-backscatter-plate');
  assert.equal(plate.topology,'monitor-chamber-backscatter-plate-before-mirror');
  assert.equal(plate.function,'reduce-downstream-collimator-backscatter-into-monitor');
  assert.deepEqual(plate.ordering,[
    'monitor-chamber',
    'backscatter-plate',
    'field-light-mirror',
    'agility-mlc-diaphragms'
  ]);
});

test('backscatter plate graphic remains centered and between monitor and mirror',()=>{
  const plate=backscatterPlateVisualState();

  assert.equal(plate.x+plate.width/2,plate.center);
  assert.ok(plate.y>928,'plate should be downstream of the current monitor stack');
  assert.ok(plate.y+plate.height<944,'plate should remain upstream of the optical mirror');
});

test('bootstrap initializes the plate after hardware exists and before education overlays',()=>{
  const bootstrap=fs.readFileSync(new URL('../src/app/bootstrap.js',import.meta.url),'utf8');
  const start=bootstrap.indexOf('controller.start()');
  const plate=bootstrap.indexOf('initBackscatterPlateGraphics()');
  const goldenPath=bootstrap.indexOf('initGoldenPath(controller)');

  assert.ok(start>=0&&plate>start);
  assert.ok(goldenPath>plate);
});
