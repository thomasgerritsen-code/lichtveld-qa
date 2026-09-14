import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync(new URL('../mobile.css',import.meta.url),'utf8');
const mobileUx=fs.readFileSync(new URL('../src/app/mobile-ux.js',import.meta.url),'utf8');
const bootstrap=fs.readFileSync(new URL('../src/app/bootstrap.js',import.meta.url),'utf8');

test('mobile stylesheet exposes touch-sized controls and a readable detail viewer',()=>{
  assert.match(css,/max-width:700px/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/\.machineViewport svg\{width:900px/);
  assert.match(css,/\.machineViewport\.mobileFit svg\{width:100%/);
  assert.match(css,/overflow-x:auto/);
});

test('mobile UX provides quick navigation and overview/detail switching',()=>{
  assert.match(mobileUx,/Mobiele simulatornavigatie/);
  assert.match(mobileUx,/Console<\/button>/);
  assert.match(mobileUx,/Instellingen<\/button>/);
  assert.match(mobileUx,/Machine<\/button>/);
  assert.match(mobileUx,/mobileFit/);
  assert.match(mobileUx,/fitBtn\.textContent=fit\?'Detail':'Overzicht'/);
});

test('bootstrap loads mobile styles and initializes the mobile UX after controller start',()=>{
  assert.match(bootstrap,/mobile\.css\?v=1/);
  assert.match(bootstrap,/controller\.start\(\);\s*initMobileUx\(\);/);
});
