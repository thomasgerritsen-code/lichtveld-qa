import {MODEL} from '../machine/model.js';
import {DEG,clamp,zeros4,mv,addv,scalev,covProp} from './math/matrix.js';
import {driftM,kickState,envelopeScaleM} from './optics/elements.js';
import {sectorM,sectorDispersion} from './bending/elements.js';
import {makeStage} from './beam-state.js';
import {evaluateRfSource} from './rf-source.js';

export function decodeControls(raw){
  return {
    gunEmission:clamp((raw.gunEmission??100)/100,0,1.2),
    gunTiming:clamp((raw.gunTiming??0)/100,-1,1),
    magPower:clamp((raw.magPower??100)/100,0,1.2),
    magTune:clamp((raw.magTune??0)/100,-1,1),
    rfPhase:clamp((raw.rfPhase??0)/100,-1,1),
    f1:clamp(raw.f1/100,0,1),
    r1:raw.r1/100,
    t1:raw.t1/100,
    f2:clamp(raw.f2/100,0,1),
    r2:raw.r2/100,
    t2:raw.t2/100,
    energy:.96+(raw.energy/100)*.08,
    spread:raw.spread/100,
    mainBend:raw.coarse/100,
    m3Topup:raw.fine/100,
    coarse:raw.coarse/100,
    fine:raw.fine/100,
    fieldXcm:clamp(raw.fx,1,40),
    fieldYcm:clamp(raw.fy,1,40),
    fx:clamp(raw.fx/40,.025,1),
    fy:clamp(raw.fy/40,.025,1),
    doseRateSet:clamp(raw.doseRateSet??600,37,600)
  };
}

function initialCovariance(sourceSigmaScale=1){
  const [sr0,srp0,st0,stp0]=MODEL.optics.sourceSigma;
  const sr=sr0*sourceSigmaScale;
  const srp=srp0*sourceSigmaScale;
  const st=st0*sourceSigmaScale;
  const stp=stp0*sourceSigmaScale;
  return [
    [sr*sr,0,0,0],
    [0,srp*srp,0,0],
    [0,0,st*st,0],
    [0,0,0,stp*stp]
  ];
}

function mergeInitial(disturbance={}){
  return [
    disturbance.radial?.x||0,
    disturbance.radial?.xp||0,
    disturbance.transverse?.x||0,
    disturbance.transverse?.xp||0
  ];
}

function optics4D(params,rf,disturbance={},assist={}){
  const o=MODEL.optics;
  const rigidity=1/rf.effectiveEnergy;

  let state=mergeInitial(disturbance);
  let covariance=initialCovariance(rf.sourceSigmaScale);
  let dispersion=zeros4();
  const stages=[makeStage('gun',state,covariance,dispersion,rf.effectiveSpread)];

  const apply=matrix=>{
    state=mv(matrix,state);
    covariance=covProp(covariance,matrix);
    dispersion=mv(matrix,dispersion);
  };

  apply(driftM(o.sourceToF1));

  // Deliberate v14 teaching simplification requested for the UI:
  // focus controls compress only the beam envelope, never the centroid or angle.
  const f1Scale=1-params.f1*(1-(o.focus1MinScale??.58));
  covariance=covProp(covariance,envelopeScaleM(f1Scale,f1Scale));
  stages.push(makeStage('focus1',state,covariance,dispersion,rf.effectiveSpread));

  apply(driftM(o.f1ToSteer1));
  state=kickState(
    state,
    params.r1*.020*rigidity,
    params.t1*.020*rigidity
  );
  stages.push(makeStage('steer1',state,covariance,dispersion,rf.effectiveSpread));

  const d1=o.steer1ToF2*.52;
  apply(driftM(d1));
  stages.push(makeStage('wgAfter1',state,covariance,dispersion,rf.effectiveSpread));
  apply(driftM(o.steer1ToF2-d1));

  const f2Scale=1-params.f2*(1-(o.focus2MinScale??.62));
  covariance=covProp(covariance,envelopeScaleM(f2Scale,f2Scale));
  stages.push(makeStage('focus2',state,covariance,dispersion,rf.effectiveSpread));

  const d2=o.f2ToSteer2*.50;
  apply(driftM(d2));
  stages.push(makeStage('wgAfter2',state,covariance,dispersion,rf.effectiveSpread));
  apply(driftM(o.f2ToSteer2-d2));
  const r2Kick=params.r2*.026*rigidity+(assist.r2||0);
  const t2Kick=params.t2*.026*rigidity+(assist.t2||0);
  state=kickState(state,r2Kick,t2Kick);
  stages.push(makeStage('steer2',state,covariance,dispersion,rf.effectiveSpread));

  const d3=o.steer2ToBend*.58;
  apply(driftM(d3));
  stages.push(makeStage('wgExit',state,covariance,dispersion,rf.effectiveSpread));
  apply(driftM(o.steer2ToBend-d3));
  stages.push(makeStage('bendEntry',state,covariance,dispersion,rf.effectiveSpread));

  return {
    state,
    covariance,
    dispersion,
    stages,
    r2Kick,
    t2Kick
  };
}

function bending4D(optics,params,rf,disturbance={}){
  const bendModel=MODEL.bend;
  const main=params.mainBend+(disturbance.coarseBias||0);
  const topup=params.m3Topup+(disturbance.fineBias||0);
  const energyOffset=disturbance.energyOffset||0;

  let state=[...optics.state];
  let covariance=optics.covariance.map(row=>[...row]);
  let dispersion=[...optics.dispersion];
  const stages=[];
  const maxDispersion=[];

  function transportMagnet(index,name){
    const angleKey=['m1Deg','m2Deg','m3Deg'][index];
    const nominalTheta=bendModel[angleKey]*DEG;
    const rho=bendModel.rho[index];

    const mainResponse=1+main*.04;
    const topupResponse=index===2?(1+topup*.06):1;
    const actualTheta=nominalTheta*mainResponse*topupResponse/rf.effectiveEnergy;
    const bendError=actualTheta-nominalTheta;

    const matrix=sectorM(nominalTheta,rho);
    const dispersionGain=actualTheta/nominalTheta;
    const dispersionKick=sectorDispersion(
      nominalTheta,
      rho,
      bendModel.dispersionScale[index]*dispersionGain
    );

    state=addv(mv(matrix,state),scalev(dispersionKick,energyOffset));
    covariance=covProp(covariance,matrix);
    dispersion=addv(mv(matrix,dispersion),dispersionKick);
    state=kickState(state,bendError,0);

    stages.push(makeStage(
      name,
      state,
      covariance,
      dispersion,
      rf.effectiveSpread
    ));
    maxDispersion.push(Math.abs(dispersion[0]));

    const drift=driftM(bendModel.drift[index]);
    state=mv(drift,state);
    covariance=covProp(covariance,drift);
    dispersion=mv(drift,dispersion);
  }

  transportMagnet(0,'m1');
  transportMagnet(1,'m2');
  transportMagnet(2,'m3');

  const target=makeStage('target',state,covariance,dispersion,params.spread);
  stages.push(target);

  const maxD=Math.max(...maxDispersion,1e-6);
  const residualD=Math.hypot(dispersion[0],dispersion[1]*.6);
  const intrinsicAchromacy=clamp(1-residualD/(maxD*1.5),0,1);
  const supplyPenalty=clamp(Math.abs(main)*.45+Math.abs(topup)*.28,0,.8);
  const achromacy=clamp(intrinsicAchromacy-supplyPenalty,0,1);

  return {
    state,
    covariance,
    dispersion,
    stages,
    target,
    achromacy,
    effective:{
      mainBend:main,
      m3Topup:topup,
      energyOffset
    }
  };
}

export function simulate(params,disturbance={},assist={}){
  const rf=evaluateRfSource(params);
  const optics=optics4D(params,rf,disturbance,assist);
  const bend=bending4D(optics,params,rf,disturbance);
  const stages=[...optics.stages,...bend.stages];
  const target=bend.target;

  const spot=Math.max(.2,target.sigma);
  const mismatch=clamp(1-bend.achromacy,0,1);
  const error=Math.hypot(
    target.r*2.0,
    target.rp*1.2,
    target.t*2.0,
    target.tp*1.2,
    target.disp*rf.effectiveSpread*.08
  );

  return {
    stages,
    target,
    radialOffset:optics.state[0]*24,
    transverseOffset:optics.state[2]*24,
    radialAngle:optics.state[1],
    transverseAngle:optics.state[3],
    mismatch,
    achromacy:bend.achromacy,
    spot,
    error,
    rf,
    effectiveEnergy:rf.effectiveEnergy,
    effectiveSpread:rf.effectiveSpread,
    effectiveBend:bend.effective,
    effectiveSteering:{
      r2Kick:optics.r2Kick,
      t2Kick:optics.t2Kick
    },
    covariance:bend.covariance,
    dispersionVector:bend.dispersion
  };
}
