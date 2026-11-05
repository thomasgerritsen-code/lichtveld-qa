import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULTS,HEAD,APERTURES,SOLENOID_LENGTH,simulate} from '../src/rebuild/model.js';
import {transportProjection,fieldProjection,beamEyeProjection,spotProjection,intensity,DISPLAY_SCALE,CONTROL_EFFECTS} from '../src/rebuild/presentation.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const rows=s=>s.rows.map(p=>[p.r,p.rp,p.t,p.tp,p.sigmaR,p.sigmaT]);
for(const [control,stage] of [['f1','focus1'],['f2','focus2']])test(`${control}: envelope begins inside the actual coil and upstream stays unchanged`,()=>{
 const a=simulate({...DEFAULTS,[control]:0}),b=simulate({...DEFAULTS,[control]:.8});
 const entry=a.geometry.stations.find(c=>c.id===stage).s-SOLENOID_LENGTH;
 for(let i=0;i<a.rows.length;i++)if(a.rows[i].s<=entry+1e-8){close(a.rows[i].sigmaR,b.rows[i].sigmaR);close(a.rows[i].sigmaT,b.rows[i].sigmaT);}
 assert.ok(a.rows.some((p,i)=>p.s>entry&&Math.abs(p.sigmaR-b.rows[i].sigmaR)>1e-6));
 assert.notDeepEqual(transportProjection(a).map(p=>p.width),transportProjection(b).map(p=>p.width));
 close(a.target.r,0);close(b.target.r,0); // Width can change on a centred beam without a fictitious centroid kick.
});
for(const [control,stage,plane] of [['r1','steer1','r'],['t1','steer1','t'],['r2','steer2','r'],['t2','steer2','t']])test(`${control}: signed steering is local, causal and visible in its own plane`,()=>{
 const base=simulate(DEFAULTS),plus=simulate({...DEFAULTS,[control]:.05}),minus=simulate({...DEFAULTS,[control]:-.05});
 const entry=base.rows.findIndex(p=>p.id===stage);
 for(let i=0;i<entry;i++)assert.deepEqual(rows(base)[i],rows(plus)[i]);
 assert.notEqual(plus.target[plane],0);close(plus.target[plane],-minus.target[plane]);
 assert.notDeepEqual(spotProjection(base),spotProjection(plus));
 if(control==='t2'){
  assert.deepEqual(transportProjection(base,'r'),transportProjection(plus,'r'));
  assert.notDeepEqual(transportProjection(base,'t'),transportProjection(plus,'t'));
 }
});
test('momentum: centroid deflection begins smoothly inside M1, never as an exit-only kick',()=>{
 const a=simulate(DEFAULTS),b=simulate({...DEFAULTS,momentum:1.01});const m=a.geometry.bends[0];
 for(let i=0;i<=m.start;i++){close(a.rows[i].r,b.rows[i].r);close(a.rows[i].t,b.rows[i].t);}
 assert.notEqual(b.rows[m.start+1].r,0);assert.ok(Math.abs(b.rows[m.start+1].r)<Math.abs(b.rows[m.end].r));
});
test('emission changes opacity/output only; trajectory and covariance are invariant',()=>{
 const full={...DEFAULTS,beam:true},weak={...full,emission:.25},zero={...full,emission:0};
 const a=simulate(full),b=simulate(weak),c=simulate(zero);
 assert.deepEqual(rows(a),rows(b));assert.deepEqual(rows(a),rows(c));
 close(intensity(a,full),1);close(intensity(b,weak),.25);close(intensity(c,zero),0);
 close(b.relativeOutput,.25);assert.equal(c.sourceActive,false);assert.equal(c.radiationActive,false);
});
for(const mode of ['photon','electron'])for(const key of ['fieldX','fieldY'])test(`${mode} ${key}: independent field axis, fixed upstream optics, equal-scale beam eye`,()=>{
 const a={...DEFAULTS,mode,[key]:5},b={...a,[key]:30};
 assert.deepEqual(rows(simulate(a)),rows(simulate(b)));
 const f=fieldProjection(a),g=fieldProjection(b),v=beamEyeProjection(a),w=beamEyeProjection(b);
 const horizontal=key==='fieldX';
 assert.ok(g[horizontal?'halfX':'halfY']>f[horizontal?'halfX':'halfY']);
 close(g[horizontal?'halfY':'halfX'],f[horizontal?'halfY':'halfX']);
 close(w[horizontal?'halfY':'halfX'],v[horizontal?'halfY':'halfX']);
 if(mode==='electron'){close(v.mlcHalfX,w.mlcHalfX);close(v.jawHalfY,w.jawHalfY);}
});
test('square configured field is square in the beam-eye view and a 10x field gives 10x width',()=>{
 const a=beamEyeProjection({...DEFAULTS,fieldX:4,fieldY:4}),b=beamEyeProjection({...DEFAULTS,fieldX:40,fieldY:40});
 close(a.halfX,a.halfY);close(b.halfX,b.halfY);close(b.halfX,10*a.halfX);
});
test('field edge at the downstream MLC face projects exactly to the patient field',()=>{
 const p=fieldProjection(DEFAULTS);close(p.mlcHalfX*(HEAD.patient-p.sourceY)/(HEAD.mlc+35-p.sourceY),p.halfX);
});
test('sampling resolves coil and drift interiors and projected bore/envelope share one scale',()=>{
 const s=simulate(DEFAULTS);assert.ok(s.geometry.guideEndIndex>100);
 for(const c of s.geometry.stations.filter(c=>c.kind==='solenoid'))assert.ok(s.rows.filter(p=>p.s>c.s-SOLENOID_LENGTH&&p.s<c.s).length>8);
 for(const p of transportProjection(s))assert.ok(p.width<=APERTURES.tube*DISPLAY_SCALE);
});
test('every exposed slider has explanatory feedback and finite min/mid/max projections',()=>{
 const bounds={f1:[0,.5,1],f2:[0,.5,1],r1:[-1,0,1],t1:[-1,0,1],r2:[-1,0,1],t2:[-1,0,1],momentum:[.8,1,1.2],emission:[0,.5,1],fieldX:[1,20,40],fieldY:[1,20,40]};
 assert.deepEqual(Object.keys(CONTROL_EFFECTS).sort(),Object.keys(bounds).sort());
 for(const mode of ['photon','electron'])for(const[key,values]of Object.entries(bounds))for(const value of values){
  const state={...DEFAULTS,mode,beam:true,[key]:value},sim=simulate(state);
  for(const p of transportProjection(sim))for(const point of [p.center,p.upper,p.lower])assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
  if(sim.strike)assert.equal(sim.radiationActive,false);
 }
});
