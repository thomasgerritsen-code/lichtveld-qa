import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

import {UI_DEFAULTS} from '../src/machine/model.js';
import {decodeControls,simulate} from '../src/physics/beam-model.js';
import {evaluateRadiationTransport} from '../src/physics/radiation-transport.js';
import {evaluateDelivery} from '../src/physics/delivery-state.js';
import {gantryEnvironment,buildControlContext} from '../src/physics/feedback.js';
import {photonProfiles,electronProfile,virtualEpid} from '../src/physics/detector.js';

const EPS=1e-9;
const HERE=path.dirname(fileURLToPath(import.meta.url));
const ROOT=path.resolve(HERE,'..');

function assertFiniteNumber(value,label){
  assert.equal(typeof value,'number',label+' is not a number');
  assert.ok(Number.isFinite(value),label+' is not finite');
}

function assertStage(stage){
  for(const key of ['r','rp','t','tp','disp','dispPrime','sigmaR','sigmaT','sigma','corrRT']){
    assertFiniteNumber(stage[key],stage.name+'.'+key);
  }
  assert.ok(stage.sigmaR>=0,stage.name+' sigmaR < 0');
  assert.ok(stage.sigmaT>=0,stage.name+' sigmaT < 0');
  assert.ok(stage.sigma>=0,stage.name+' sigma < 0');
}

function run(overrides={},{
  mode='photon',
  filter='ff',
  powerOn=true,
  beamOn=true,
  direction='cw',
  controlMode='manual',
  disturbance=null
}={}){
  const raw={...UI_DEFAULTS,...overrides};
  const params=decodeControls(raw);
  const angle=raw.gantry??0;
  const env=disturbance??gantryEnvironment(angle,direction);

  const preMode=controlMode==='manual'?'manual':'lut';
  const preControl=buildControlContext({
    mode:preMode,
    angleDeg:angle,
    direction
  });
  const preSim=simulate(params,env,{
    r2:preControl.lut.r2,
    t2:preControl.lut.t2
  });

  const control=buildControlContext({
    mode:controlMode,
    angleDeg:angle,
    direction,
    preSim
  });
  const sim=simulate(params,env,{
    r2:control.lut.r2+control.servo.r2,
    t2:control.lut.t2+control.servo.t2
  });

  const radiation=evaluateRadiationTransport(sim,{
    mode,
    filter,
    fieldXcm:params.fieldXcm,
    fieldYcm:params.fieldYcm
  });

  const delivery=evaluateDelivery({
    radiation,
    machine:{powerOn,beamOn},
    params,
    sim,
    mode,
    filter
  });

  return {raw,params,sim,radiation,delivery,control};
}

function assertHealthy(result,label='case'){
  const {params,sim,radiation,delivery}=result;

  for(const stage of sim.stages)assertStage(stage);
  for(const key of ['radialOffset','transverseOffset','radialAngle','transverseAngle','mismatch','achromacy','spot','error','effectiveEnergy','effectiveSpread']){
    assertFiniteNumber(sim[key],label+'.sim.'+key);
  }
  assert.ok(sim.achromacy>=-EPS&&sim.achromacy<=1+EPS,label+' achromacy range');
  assert.ok(sim.mismatch>=-EPS&&sim.mismatch<=1+EPS,label+' mismatch range');
  assert.ok(sim.spot>=0,label+' negative spot');

  for(const key of ['rfEfficiency','captureFactor','sourceFactor','effectiveEnergy','effectiveSpread','sourceSigmaScale']){
    assertFiniteNumber(sim.rf[key],label+'.rf.'+key);
  }
  assert.ok(sim.rf.rfEfficiency>=-EPS&&sim.rf.rfEfficiency<=1+EPS,label+' rfEfficiency range');
  assert.ok(sim.rf.captureFactor>=-EPS&&sim.rf.captureFactor<=1+EPS,label+' capture range');
  assert.ok(sim.rf.sourceFactor>=-EPS&&sim.rf.sourceFactor<=1.1+EPS,label+' source factor range');

  for(const key of ['primaryTransmission','alignmentFactor','transportTransmission','targetCoupling','scatterFraction','scatterIndex','wallScatterFraction','normalHeadScatterFraction','missScatterFraction']){
    assertFiniteNumber(radiation[key],label+'.radiation.'+key);
  }
  assert.ok(radiation.primaryTransmission>=-EPS&&radiation.primaryTransmission<=1+EPS,label+' primary transmission range');
  assert.ok(radiation.transportTransmission>=-EPS&&radiation.transportTransmission<=1+EPS,label+' transport range');
  assert.ok(radiation.targetCoupling>=-EPS&&radiation.targetCoupling<=1+EPS,label+' target coupling range');
  assert.ok(radiation.scatterFraction>=-EPS&&radiation.scatterFraction<=1+EPS,label+' scatter range');
  assert.ok(radiation.scatterIndex>=-EPS&&radiation.scatterIndex<=100+EPS,label+' scatter index range');

  for(const key of ['setpoint','beamQuality','sourceFactor','outputFraction','fieldFactor','usefulDoseRate','patientOutputProxy','relativePatientOutput']){
    assertFiniteNumber(delivery[key],label+'.delivery.'+key);
  }
  assert.ok(delivery.outputFraction>=-EPS&&delivery.outputFraction<=1+EPS,label+' output fraction range');
  assert.ok(delivery.usefulDoseRate>=-EPS,label+' useful dose negative');
  assert.ok(delivery.usefulDoseRate<=delivery.setpoint+EPS,label+' useful dose exceeds setpoint');
  if(!delivery.radiationActive)assert.equal(delivery.usefulDoseRate,0,label+' inactive source delivered dose');

  assert.ok(params.fieldXcm>=1&&params.fieldXcm<=40,label+' field X range');
  assert.ok(params.fieldYcm>=1&&params.fieldYcm<=40,label+' field Y range');
}

test('all controls survive min nominal max sweeps in photon and electron modes',()=>{
  const values={
    gunEmission:[0,100,120],
    gunTiming:[-100,0,100],
    magPower:[0,100,120],
    magTune:[-100,0,100],
    rfPhase:[-100,0,100],
    f1:[0,60,100],
    r1:[-100,0,100],
    t1:[-100,0,100],
    f2:[0,62,100],
    r2:[-100,0,100],
    t2:[-100,0,100],
    energy:[0,50,100],
    spread:[0,25,100],
    coarse:[-100,0,100],
    fine:[-100,0,100],
    fx:[1,10,40],
    fy:[1,10,40],
    doseRateSet:[37,300,600],
    gantry:[0,180,360]
  };

  let count=0;
  for(const [id,samples] of Object.entries(values)){
    for(const value of samples){
      for(const mode of ['photon','electron']){
        const filter=mode==='photon'&&count%2?'fff':'ff';
        assertHealthy(run({[id]:value},{mode,filter}),id+'='+value+' '+mode);
        count++;
      }
    }
  }
  assert.ok(count>=100);
});

test('pairwise extreme physics-control sweep stays finite and bounded',()=>{
  const controls={
    gunEmission:[0,120],
    gunTiming:[-100,100],
    magPower:[0,120],
    magTune:[-100,100],
    rfPhase:[-100,100],
    f1:[0,100],
    r1:[-100,100],
    t1:[-100,100],
    f2:[0,100],
    r2:[-100,100],
    t2:[-100,100],
    energy:[0,100],
    spread:[0,100],
    coarse:[-100,100],
    fine:[-100,100]
  };
  const ids=Object.keys(controls);
  let count=0;

  for(let i=0;i<ids.length;i++){
    for(let j=i+1;j<ids.length;j++){
      const a=ids[i],b=ids[j];
      for(const av of controls[a]){
        for(const bv of controls[b]){
          assertHealthy(run({[a]:av,[b]:bv}),a+'='+av+' '+b+'='+bv);
          count++;
        }
      }
    }
  }
  assert.equal(count,(ids.length*(ids.length-1)/2)*4);
});

test('gantry direction and manual LUT servo combinations stay valid around 360 degrees',()=>{
  let count=0;
  for(const gantry of [0,30,60,90,120,150,180,210,240,270,300,330,360]){
    for(const direction of ['cw','ccw']){
      for(const controlMode of ['manual','lut','servo']){
        assertHealthy(run({gantry},{direction,controlMode}),gantry+' '+direction+' '+controlMode);
        count++;
      }
    }
  }
  assert.equal(count,78);
});

test('field sizes filters modes and dose-rate limits remain well behaved',()=>{
  for(const fx of [1,5,10,20,40]){
    for(const fy of [1,5,10,20,40]){
      for(const doseRateSet of [37,100,300,600]){
        for(const filter of ['ff','fff']){
          assertHealthy(run({fx,fy,doseRateSet},{mode:'photon',filter}),`${fx}x${fy} ${filter}`);
        }
        assertHealthy(run({fx,fy,doseRateSet},{mode:'electron',filter:'ff'}),`${fx}x${fy} electron`);
      }
    }
  }
});

test('focus controls never move centroid and focus 2 can continue focus 1 compression',()=>{
  const base=run({f1:0,f2:0}).sim;
  const stageNames=base.stages.map(s=>s.name);
  const centroidKeys=['r','rp','t','tp'];

  for(const f1 of [0,25,50,75,100]){
    let previousSigma=Infinity;
    for(const f2 of [0,25,50,75,100]){
      const sim=run({f1,f2}).sim;
      for(const name of stageNames){
        const a=base.stages.find(s=>s.name===name);
        const b=sim.stages.find(s=>s.name===name);
        for(const key of centroidKeys){
          assert.ok(Math.abs(a[key]-b[key])<1e-10,`${name}.${key} moved by focus`);
        }
      }
      const s2=sim.stages.find(s=>s.name==='focus2').sigmaR;
      assert.ok(s2<=previousSigma+1e-12,'Focus 2 compression is not monotonic');
      previousSigma=s2;
    }
  }

  const strong=run({f1:100,f2:100}).sim;
  assert.ok(
    strong.stages.find(s=>s.name==='focus2').sigmaR <
    strong.stages.find(s=>s.name==='focus1').sigmaR
  );
});

test('spot readout follows the transported envelope instead of a fixed floor',()=>{
  const loose=run({f1:0,f2:0});
  const focused=run({f1:100,f2:100});
  assert.ok(focused.sim.spot<loose.sim.spot,'focused target spot did not get smaller');
  assert.ok(focused.sim.spot<.2,'old fixed 0.200 spot floor is still present');
});

test('each steering axis can create a hard waveguide interception with zero useful rate',()=>{
  for(const id of ['r1','t1','r2','t2']){
    for(const value of [-100,100]){
      const x=run({[id]:value});
      assert.ok(x.radiation.hardStrike,`${id}=${value} did not produce a hard strike`);
      assert.ok(['wgAfter1','wgAfter2','wgExit','bendEntry'].includes(x.radiation.hardStrike.stage));
      assert.equal(x.delivery.usefulDoseRate,0);
    }
  }
});

test('dose rate never exceeds its command even with gun emission above nominal',()=>{
  for(const gunEmission of [100,105,110,115,120]){
    for(const doseRateSet of [37,100,300,600]){
      const x=run({gunEmission,doseRateSet});
      assert.ok(x.delivery.usefulDoseRate<=doseRateSet+EPS);
    }
  }
});

test('zero gun emission produces no delivered dose and no scatter intensity',()=>{
  for(const steering of [{},{r1:100},{t2:-100},{coarse:100,fine:-100}]){
    const x=run({gunEmission:0,...steering});
    assert.equal(x.delivery.radiationActive,false);
    assert.equal(x.delivery.usefulDoseRate,0);
    assert.equal(x.radiation.scatterIndex,0);
  }
});

test('RF settings propagate into electron profile diagnostics',()=>{
  const nominal=run();
  const detuned=run({magTune:80});
  const phase=run({rfPhase:80});
  const p0=electronProfile(nominal.sim,nominal.params);
  const p1=electronProfile(detuned.sim,detuned.params);
  const p2=electronProfile(phase.sim,phase.params);

  assert.notEqual(p1.scatterWidth,p0.scatterWidth);
  assert.notEqual(p2.scatterWidth,p0.scatterWidth);
});

test('photon electron profile and EPID outputs remain finite at extreme fields',()=>{
  for(const fx of [1,10,40]){
    for(const fy of [1,10,40]){
      const x=run({fx,fy,r1:65,t2:-55,spread:100});
      for(const filter of ['ff','fff']){
        const p=photonProfiles(x.sim,x.params,filter);
        for(const point of [...p.radial,...p.transverse]){
          assertFiniteNumber(point.x,'photon x');
          assertFiniteNumber(point.y,'photon y');
          assert.ok(point.y>=0&&point.y<=1+EPS);
        }
      }

      const e=electronProfile(x.sim,x.params);
      for(const point of e.profile){
        assertFiniteNumber(point.x,'electron x');
        assertFiniteNumber(point.y,'electron y');
        assert.ok(point.y>=0&&point.y<=1+EPS);
      }

      const q=virtualEpid(x.sim,x.params);
      for(const value of [
        q.focal.x,q.focal.y,q.mlcCenter.x,q.mlcCenter.y,
        q.diaphragmCenter.x,q.diaphragmCenter.y,q.separation,q.field.x,q.field.y
      ])assertFiniteNumber(value,'EPID value');
    }
  }
});

test('UI wiring has unique IDs and every controller selector/control exists',()=>{
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const controller=fs.readFileSync(path.join(ROOT,'src/app/controller.js'),'utf8');

  const htmlIds=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  const duplicates=htmlIds.filter((id,index)=>htmlIds.indexOf(id)!==index);
  assert.deepEqual([...new Set(duplicates)],[],'duplicate HTML ids');

  const selectorIds=[...controller.matchAll(/\$\('#([^']+)'\)/g)].map(m=>m[1]);
  for(const id of new Set(selectorIds)){
    if(id==='particles')continue;
    assert.ok(htmlIds.includes(id),'controller references missing #'+id);
  }

  const controlsMatch=controller.match(/const CONTROL_IDS=\[([^\]]+)\]/);
  assert.ok(controlsMatch,'CONTROL_IDS missing');
  const controlIds=[...controlsMatch[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
  for(const id of controlIds){
    assert.ok(html.includes(`id="${id}"`),'missing input '+id);
    assert.ok(html.includes(`id="${id}v"`),'missing output '+id+'v');

    const tagMatch=html.match(new RegExp('<input[^>]*id="'+id+'"[^>]*>'));
    assert.ok(tagMatch,'missing input tag '+id);
    const tag=tagMatch[0];
    const value=Number((tag.match(/value="([^"]+)"/)||[])[1]);
    const min=Number((tag.match(/min="([^"]+)"/)||[])[1]);
    const max=Number((tag.match(/max="([^"]+)"/)||[])[1]);
    assert.equal(value,UI_DEFAULTS[id],'HTML default differs from model default for '+id);
    if(Number.isFinite(min))assert.ok(value>=min,id+' default below min');
    if(Number.isFinite(max))assert.ok(value<=max,id+' default above max');
  }
});

test('all source modules except bootstrap import successfully and no hand-versioned imports remain',async()=>{
  const srcRoot=path.join(ROOT,'src');
  const files=[];

  function walk(dir){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory())walk(full);
      else if(entry.isFile()&&entry.name.endsWith('.js'))files.push(full);
    }
  }
  walk(srcRoot);

  for(const file of files){
    const source=fs.readFileSync(file,'utf8');
    assert.ok(!/from\s+['"][^'"]+\?v=/.test(source),'hand-versioned import in '+file);
    if(file.endsWith(path.join('app','bootstrap.js')))continue;
    await import(pathToFileURL(file).href+'?qa=1');
  }
  assert.ok(files.length>=20);
});
