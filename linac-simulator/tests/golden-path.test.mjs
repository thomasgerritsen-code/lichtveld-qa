import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveGoldenPath} from '../src/app/golden-path.js';
import {PART_INFO} from '../src/machine/model.js';

const root=new URL('../',import.meta.url);

function ids(stages){return stages.map(stage=>stage.id);}

test('golden path preserves the educational machine order',()=>{
  const stages=resolveGoldenPath('photon','ff');
  assert.deepEqual(ids(stages),[
    'gun','rf','focus1','steer1','focus2','steer2','bend','formation','monitor','shaping','patient'
  ]);
});

test('photon route exposes target/filter and Agility shaping',()=>{
  const stages=resolveGoldenPath('photon','fff');
  const formation=stages.find(stage=>stage.id==='formation');
  const shaping=stages.find(stage=>stage.id==='shaping');
  assert.match(formation.label,/Target \+ FFF/);
  assert.deepEqual(formation.parts,['target','filter','head']);
  assert.deepEqual(shaping.parts,['mlc','jaws']);
});

test('electron route exposes window/foils and applicator rather than photon shaping',()=>{
  const stages=resolveGoldenPath('electron','ff');
  const formation=stages.find(stage=>stage.id==='formation');
  const shaping=stages.find(stage=>stage.id==='shaping');
  assert.match(formation.label,/Electron window/);
  assert.deepEqual(formation.parts,['window','head']);
  assert.deepEqual(shaping.parts,['applicator']);
  assert.ok(!formation.parts.includes('target'));
  assert.ok(!shaping.parts.includes('mlc'));
});

test('all golden-path machine parts resolve to documented component metadata',()=>{
  const parts=new Set([
    ...resolveGoldenPath('photon','ff').flatMap(stage=>stage.parts),
    ...resolveGoldenPath('electron','ff').flatMap(stage=>stage.parts)
  ]);
  for(const part of parts)assert.ok(PART_INFO[part],`missing PART_INFO for ${part}`);
});

test('navigator stays in the UI layer and mobile styling keeps touch-sized navigation',async()=>{
  const source=await readFile(new URL('src/app/golden-path.js',root),'utf8');
  const css=await readFile(new URL('golden-path.css',root),'utf8');
  assert.doesNotMatch(source,/physics\//);
  assert.match(source,/controller\.store/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/scroll-snap-type:x mandatory/);
});
