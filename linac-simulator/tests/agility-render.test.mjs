import test from 'node:test';
import assert from 'node:assert/strict';

import {agilityDiaphragmVisualState,agilityLeafRows,photonFilterVisualState,treatmentHeadApertureState} from '../src/ui/machine/treatment-head.js';

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

test('orthogonal photon field control is explicitly represented as the Agility sculpted diaphragm pair',()=>{
  const narrow=treatmentHeadApertureState({fx:.40,fy:.15},{mode:'photon'});
  const wide=treatmentHeadApertureState({fx:.40,fy:.85},{mode:'photon'});

  assert.equal(narrow.orthogonalCollimatorRole,'sculpted-diaphragm-pair');
  assert.equal(wide.orthogonalCollimatorRole,'sculpted-diaphragm-pair');
  assert.ok(wide.diaphragmGap>narrow.diaphragmGap);
  assert.equal(narrow.jawGap,narrow.diaphragmGap);
  assert.equal(wide.jawGap,wide.diaphragmGap);
});

test('Agility diaphragm visual uses a thicker curved front edge and follows Y field opening',()=>{
  const narrow=agilityDiaphragmVisualState({fx:.40,fy:.15});
  const wide=agilityDiaphragmVisualState({fx:.40,fy:.85});

  assert.equal(narrow.role,'sculpted-diaphragm');
  assert.equal(narrow.topology,'thicker-curved-front-edge-with-thinner-rear-region');
  assert.ok(narrow.frontThickness>narrow.rearThickness);
  assert.match(narrow.leftPath,/Q/);
  assert.match(narrow.rightPath,/Q/);
  assert.notEqual(narrow.leftPath,wide.leftPath);
  assert.notEqual(narrow.rightPath,wide.rightPath);
});

test('Agility diaphragm visual is independent of the orthogonal X/MLC field control',()=>{
  const left=agilityDiaphragmVisualState({fx:.10,fy:.45});
  const right=agilityDiaphragmVisualState({fx:.90,fy:.45});

  assert.equal(left.leftPath,right.leftPath);
  assert.equal(left.rightPath,right.rightPath);
});

test('electron mode parks Agility leaves while applicator/diaphragm field control remains independent',()=>{
  const narrow=treatmentHeadApertureState({fx:.10,fy:.20},{mode:'electron'});
  const wideX=treatmentHeadApertureState({fx:.90,fy:.20},{mode:'electron'});
  const wideY=treatmentHeadApertureState({fx:.10,fy:.80},{mode:'electron'});

  assert.equal(narrow.mlcRole,'parked');
  assert.equal(wideX.mlcRole,'parked');
  assert.equal(narrow.orthogonalCollimatorRole,'sculpted-diaphragm-pair');
  assert.equal(narrow.mlcDelta,wideX.mlcDelta);
  assert.equal(narrow.diaphragmGap,wideX.diaphragmGap);
  assert.ok(wideY.diaphragmGap>narrow.diaphragmGap);
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
