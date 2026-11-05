import test from 'node:test';
import assert from 'node:assert/strict';
import {buildMechanicalGeometry,headTranslationX} from '../src/ui/machine/geometry.js';
import {slalomTopologyVisualState,inputModeTransformerSpec} from '../src/ui/machine/hardware.js';
import {rfWaveguideVisualState} from '../src/ui/machine/rf-waveguide-topology.js';
import {initSvgVisibility} from '../src/ui/svg-visibility.js';

test('head target axis follows the actual bend exit without rounded layout offsets',()=>{
  const geometry=buildMechanicalGeometry();
  assert.equal(1450+headTranslationX(),geometry.points.at(-1).x);
  assert.match(geometry.pathD,/^M /);
  assert.doesNotMatch(geometry.pathD,/undefined|NaN/);
});
test('sector pole shoes span every bend and leave clearance for the vacuum tube',()=>{
  for(const station of slalomTopologyVisualState()){
    assert.ok(station.sector.start<station.pathIndex&&station.pathIndex<station.sector.end);
    assert.ok(station.halfGap>46/2);
    assert.equal(station.polePaths.length,2);
    for(const path of station.polePaths){assert.match(path,/ Z$/);assert.doesNotMatch(path,/undefined|NaN/);}
  }
});
test('RF annotations refer to the physical gun-side coupler',()=>{
  const input=inputModeTransformerSpec(),annotation=rfWaveguideVisualState().coupler;
  assert.equal(annotation.x,input.localX+input.localWidth/2);
  assert.equal(annotation.width,input.localWidth);
});
test('SVG hidden assignments reflect attributes in both directions',()=>{
  const original=globalThis.SVGElement;
  class SvgStub{
    attrs=new Set();
    hasAttribute(name){return this.attrs.has(name);}
    toggleAttribute(name,on){if(on)this.attrs.add(name);else this.attrs.delete(name);}
  }
  try{
    globalThis.SVGElement=SvgStub;
    initSvgVisibility();initSvgVisibility();
    const group=new SvgStub();
    group.hidden=true;assert.ok(group.hasAttribute('hidden'));assert.equal(group.hidden,true);
    group.hidden=false;assert.equal(group.hasAttribute('hidden'),false);
  }finally{globalThis.SVGElement=original;}
});
