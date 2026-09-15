import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMechanicalGeometry} from '../js/render.js';
import {SLALOM_SEQUENCE,SLALOM_ROLES,slalomStations} from '../js/slalom-continuity.js';

test('slalom continuity follows 2R/2T entry through three bend stations to head entrance',()=>{
  assert.deepEqual(SLALOM_SEQUENCE,['bendEntry','m1','m2','m3','target']);
  const stations=slalomStations();
  assert.deepEqual(stations.map(s=>s.stage),SLALOM_SEQUENCE);
  for(let i=1;i<stations.length;i++) assert.ok(stations[i].index>stations[i-1].index);
});

test('continuity overlay reuses renderer mechanical geometry rather than duplicating coordinates',()=>{
  const geometry=buildMechanicalGeometry();
  const stations=slalomStations(geometry);
  stations.forEach(s=>{
    assert.equal(s.x,geometry.points[s.index].x);
    assert.equal(s.y,geometry.points[s.index].y);
  });
});

test('station roles distinguish dispersion, counter-bend, final redirection and flight tube',()=>{
  assert.match(SLALOM_ROLES.bendEntry,/2R\/2T/);
  assert.match(SLALOM_ROLES.m1,/dispersive/i);
  assert.match(SLALOM_ROLES.m2,/counter-bend/i);
  assert.match(SLALOM_ROLES.m3,/final redirection/i);
  assert.match(SLALOM_ROLES.target,/flight tube.*head entrance/i);
});

test('slalom module declares normalized educational geometry and no service parameters',async()=>{
  const fs=await import('node:fs/promises');
  const source=await fs.readFile(new URL('../js/slalom-continuity.js',import.meta.url),'utf8');
  assert.match(source,/normalized-educational/);
  assert.doesNotMatch(source,/\b(?:ampere|tesla|gauss|interlock threshold|calibration current)\b/i);
});
