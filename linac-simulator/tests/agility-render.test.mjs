import test from 'node:test';
import assert from 'node:assert/strict';

import {agilityLeafRows,photonFilterVisualState,treatmentHeadApertureState} from '../src/ui/machine/treatment-head.js';

test('Agility schematic exposes 80 leaves per bank for 160 total leaves',()=>{
  const rows=agilityLeafRows();
  assert.equal(rows.length,80);
  assert.deepEqual(rows.map(row=>row.index),Array.from({length:80},(_,index)=>index));
  assert.equal(rows.length*2,160);
});

test('Agility leaf rows preserve the existing normalized treatment-head envelope',()=>{
  const rows=agilityLeafRows();
  assert.ok(rows.every(row=>row.height>0));
  assert.ok(rows.every((row,index)=>index===0||row.y>rows[index-1].y));
  const first=rows[0];
  const last=rows.at(-1);
  assert.equal(first.y,971);
  assert.ok(last.y+last.height<1017.2);
  assert.ok(last.y+last.height>1016.5);
});

test('photon mode keeps Agility leaves coupled to the X field control',()=>{
  const small=treatmentHeadApertureState({fx:.10,fy:.25},{mode:'photon'});
  const large=treatmentHeadApertureState({fx:.90,fy:.25},{mode:'photon'});

  assert.equal(small.mlcRole,'field-shaping');
  assert.equal(large.mlcRole,'field-shaping');
  assert.ok(large.mlcDelta>small.mlcDelta);
});

test('electron mode parks Agility leaves while applicator/diaphragm field control remains independent',()=>{
  const narrow=treatmentHeadApertureState({fx:.10,fy:.20},{mode:'electron'});
  const wideX=treatmentHeadApertureState({fx:.90,fy:.20},{mode:'electron'});
  const wideY=treatmentHeadApertureState({fx:.10,fy:.80},{mode:'electron'});

  assert.equal(narrow.mlcRole,'parked');
  assert.equal(wideX.mlcRole,'parked');
  assert.equal(narrow.mlcDelta,wideX.mlcDelta);
  assert.equal(narrow.jawGap,wideX.jawGap);
  assert.ok(wideY.jawGap>narrow.jawGap);
});

test('photon filter visual distinguishes conventional FF from the FFF filter plate',()=>{
  const ff=photonFilterVisualState({mode:'photon',filter:'ff'});
  const fff=photonFilterVisualState({mode:'photon',filter:'fff'});

  assert.equal(ff.visible,true);
  assert.equal(fff.visible,true);
  assert.equal(ff.role,'flattening-filter');
  assert.equal(fff.role,'fff-filter-plate');
  assert.notEqual(ff.path,fff.path);
  assert.match(ff.path,/L1485 852/);
  assert.match(fff.path,/V876/);
});

test('photon filtering element is hidden only in electron mode',()=>{
  const photonFf=photonFilterVisualState({mode:'photon',filter:'ff'});
  const photonFff=photonFilterVisualState({mode:'photon',filter:'fff'});
  const electron=photonFilterVisualState({mode:'electron',filter:'fff'});

  assert.equal(photonFf.visible,true);
  assert.equal(photonFff.visible,true);
  assert.equal(electron.visible,false);
});

test('photon filter visual defaults safely to the conventional FF representation',()=>{
  assert.equal(photonFilterVisualState({mode:'photon'}).role,'flattening-filter');
  assert.equal(photonFilterVisualState({mode:'electron',filter:'unknown'}).role,'flattening-filter');
});
