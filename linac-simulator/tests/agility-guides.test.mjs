import test from 'node:test';
import assert from 'node:assert/strict';

import {agilityLeafGuideVisualState} from '../src/ui/machine/agility-guides.js';

test('Agility exposes one normalized dynamic leaf guide per 80-leaf bank',()=>{
  const a=agilityLeafGuideVisualState('A');
  const b=agilityLeafGuideVisualState('B');
  assert.equal(a.role,'dynamic-leaf-guide');
  assert.equal(b.role,'dynamic-leaf-guide');
  assert.equal(a.bank,'A');
  assert.equal(b.bank,'B');
  assert.equal(a.geometry,'normalized-educational');
  assert.equal(b.geometry,'normalized-educational');
  assert.notEqual(a.path,b.path);
});

test('dynamic leaf guides frame the existing normalized Agility leaf envelope',()=>{
  const a=agilityLeafGuideVisualState('A');
  const b=agilityLeafGuideVisualState('B');
  assert.match(a.path,/M1319 966/);
  assert.match(a.path,/1414/);
  assert.match(b.path,/M1581 966/);
  assert.match(b.path,/1486/);
});

test('guide module declares integrated Agility topology without OEM service values',async()=>{
  const source=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../src/ui/machine/agility-guides.js',import.meta.url),'utf8'));
  assert.match(source,/160-leaf-interdigitating-mlc-with-dynamic-leaf-guides/);
  assert.match(source,/orthogonal-sculpted-diaphragm-pair/);
  assert.match(source,/data-backup-jaws','none/);
  assert.doesNotMatch(source,/calibration|interlock threshold|service current/i);
});
