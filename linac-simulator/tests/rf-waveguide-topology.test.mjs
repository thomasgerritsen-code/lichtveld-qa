import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {rfWaveguideVisualState} from '../src/ui/machine/rf-waveguide-topology.js';

test('RF topology follows source-supported magnetron to travelling-wave sequence',()=>{
  const visual=rfWaveguideVisualState();
  assert.deepEqual(visual.topology,[
    'magnetron',
    'rf-feed-waveguide',
    'rf-coupler',
    'capture-bunching-cells',
    'main-accelerating-cells'
  ]);
  assert.equal(visual.geometry,'normalized-educational');
});

test('capture region precedes the main acceleration region',()=>{
  const visual=rfWaveguideVisualState();
  assert.ok(visual.buncher.x1<visual.buncher.x2);
  assert.ok(visual.buncher.x2<visual.accelerator.x1);
  assert.ok(visual.accelerator.x1<visual.accelerator.x2);
});

test('RF coupler is a distinct topology element without service values',()=>{
  const visual=rfWaveguideVisualState();
  assert.ok(visual.coupler.width>0&&visual.coupler.height>0);
  assert.equal('frequency' in visual.coupler,false);
  assert.equal('power' in visual.coupler,false);
  assert.equal('phase' in visual.coupler,false);
});

test('bootstrap initializes RF topology after base hardware exists',()=>{
  const bootstrap=fs.readFileSync(new URL('../src/app/bootstrap.js',import.meta.url),'utf8');
  const start=bootstrap.indexOf('controller.start()');
  const rf=bootstrap.indexOf('initRfWaveguideTopologyGraphics()');
  const golden=bootstrap.indexOf('initGoldenPath(controller)');
  assert.ok(start>=0&&rf>start);
  assert.ok(golden>rf);
});
