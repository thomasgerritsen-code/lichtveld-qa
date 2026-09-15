import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../src/ui/machine/hardware.js',import.meta.url),'utf8');
test('gun and accelerating guide expose one vacuum assembly concept',()=>{assert.match(source,/gunVacuumHousing/);assert.match(source,/acceleratorVacuumEnvelope/);assert.match(source,/continuous-vacuum-housing/);});
test('visual assembly remains explicitly normalized educational geometry',()=>{assert.match(source,/data-geometry','normalized-educational/);assert.doesNotMatch(source,/magnet current|service dimension|interlock threshold/i);});
test('existing gun electrodes and RF input topology remain present',()=>{assert.match(source,/electronGunElectrodes/);assert.match(source,/inputModeTransformer/);assert.match(source,/rf-entry','gun-side/);});
test('hardware startup initializes continuity before existing beamline detail',()=>{const init=source.match(/export function initHardware\(\)\{([^}]*)\}/)?.[1]||'';assert.ok(init.indexOf('initGunWaveguideVacuumAssembly()')<init.indexOf('initElectronGunGraphics()'));assert.ok(init.indexOf('initGunWaveguideVacuumAssembly()')<init.indexOf('initWaveguideCells()'));});
