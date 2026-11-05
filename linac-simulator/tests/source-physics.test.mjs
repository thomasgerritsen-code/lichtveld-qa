import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULTS,simulate,COMPONENTS,HEAD} from '../src/rebuild/model.js';
import {dispersionProjections,headOutline,profileIllustration} from '../src/rebuild/presentation.js';
const near=(a,b,e=1e-8)=>assert.ok(Math.abs(a-b)<e,`${a} != ${b}`);
test('matching B/p restores the central bend orbit without equating magnetic field and momentum',()=>{
 for(const momentum of [.8,.95,1.05,1.2]){
  const s=simulate({...DEFAULTS,momentum,bendStrength:momentum});near(s.target.r,0);near(s.target.rp,0);
  const mismatch=simulate({...DEFAULTS,momentum,bendStrength:1});if(momentum!==1)assert.ok(Math.abs(mismatch.target.r)>0);
 }
});
test('symmetric momentum spread broadens the envelope without shifting the centroid',()=>{
 const a=simulate(DEFAULTS),b=simulate({...DEFAULTS,momentumSpread:.5});
 for(let i=0;i<a.rows.length;i++){near(a.rows[i].r,b.rows[i].r);near(a.rows[i].t,b.rows[i].t);}
 const start=a.geometry.bends[0].start;
 for(let i=0;i<=start;i++)near(a.rows[i].sigmaR,b.rows[i].sigmaR);
 assert.ok(b.target.sigmaR>a.target.sigmaR);near(b.target.sigmaT,a.target.sigmaT);
 assert.equal(dispersionProjections(b).length,2);
});
test('dispersion agrees with a finite-difference momentum perturbation for a centred unsteered beam',()=>{
 const base=simulate(DEFAULTS),eps=1e-5;
 const a=simulate({...DEFAULTS,momentum:1-eps}),b=simulate({...DEFAULTS,momentum:1+eps});
 near(base.target.dispersion[0],(b.target.r-a.target.r)/(2*eps),1e-5);
});
test('a steered beam includes chromatic centroid sensitivity before the bending section',()=>{
 const state={...DEFAULTS,r1:.03,t1:.02},base=simulate(state),eps=1e-5;
 const a=simulate({...state,momentum:1-eps}),b=simulate({...state,momentum:1+eps});
 near(base.target.dispersion[0],(b.target.r-a.target.r)/(2*eps),1e-5);
 near(base.target.dispersion[2],(b.target.t-a.target.t)/(2*eps),1e-5);
});
test('increasing momentum spread adds a positive semidefinite rank-one covariance term',()=>{
 const a=simulate(DEFAULTS),b=simulate({...DEFAULTS,momentumSpread:.3});const d=b.target.dispersion;
 for(let i=0;i<4;i++)for(let j=0;j<4;j++)near(b.target.covariance[i][j]-a.target.covariance[i][j],d[i]*d[j]*.003**2);
});
test('electron pencil stays narrow until the first scattering foil',()=>{
 const state={...DEFAULTS,mode:'electron'},s=simulate(state),p=headOutline(state,s);
 near(p[0].x,p[1].x);assert.equal(p[0].y,HEAD.window);assert.equal(p[1].y,HEAD.primaryFoil);
 assert.equal(p[2].y,HEAD.secondaryFoil);assert.ok(p.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)));
});
test('FF/FFF shape illustration changes downstream only',()=>{
 const a=simulate({...DEFAULTS,filter:'ff'}),b=simulate({...DEFAULTS,filter:'fff'});
 assert.deepEqual(a.rows,b.rows);
 const ff=profileIllustration(DEFAULTS),fff=profileIllustration({...DEFAULTS,filter:'fff'});
 near(ff[60].y,fff[60].y);assert.ok(ff[90].y>fff[90].y);
});
test('SL25 source description specifies the documented diode injector',()=>{
 const source=COMPONENTS.find(c=>c.id==='gun');assert.match(source.description,/diode-injector zonder rooster/);
});
