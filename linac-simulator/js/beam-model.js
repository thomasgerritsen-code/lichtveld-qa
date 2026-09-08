import {MODEL} from './config.js?v=8';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const DEG=Math.PI/180;

const I4=()=>[[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
const zeros4=()=>[0,0,0,0];

function mv(M,v){return M.map(row=>row.reduce((s,a,i)=>s+a*v[i],0));}
function mm(A,B){return A.map(row=>B[0].map((_,j)=>row.reduce((s,a,k)=>s+a*B[k][j],0)));}
function mt(A){return A[0].map((_,j)=>A.map(row=>row[j]));}
function addv(a,b){return a.map((v,i)=>v+b[i]);}
function scalev(a,k){return a.map(v=>v*k);}
function covProp(S,M){return mm(mm(M,S),mt(M));}

function driftM(L){return [[1,L,0,0],[0,1,0,0],[0,0,1,L],[0,0,0,1]];}

function rotatedLensM(fR,fT,phi){
  const c=Math.cos(phi),s=Math.sin(phi);
  const kR=1/fR,kT=1/fT;
  const k11=kR*c*c+kT*s*s;
  const k22=kR*s*s+kT*c*c;
  const k12=(kR-kT)*c*s;
  return [
    [1,0,0,0],
    [-k11,1,-k12,0],
    [0,0,1,0],
    [-k12,0,-k22,1]
  ];
}

function kickState(x,kr,kt){return [x[0],x[1]+kr,x[2],x[3]+kt];}

function sectorM(theta,rho){
  const c=Math.cos(theta),s=Math.sin(theta);
  const L=Math.abs(theta*rho)*.55;
  return [
    [c,rho*s,0,0],
    [-s/rho,c,0,0],
    [0,0,1,L],
    [0,0,0,1]
  ];
}

function sectorDispersion(theta,rho,scale=1){
  const c=Math.cos(theta),s=Math.sin(theta);
  return [rho*(1-c)*scale,s*scale,0,0];
}

function sigmaFromCov(S,D,spread){
  const eSigma=.012*spread;
  const r=Math.sqrt(Math.max(0,S[0][0]+(D[0]*eSigma)**2));
  const t=Math.sqrt(Math.max(0,S[2][2]+(D[2]*eSigma)**2));
  return {r,t,mean:(r+t)/2};
}

function makeStage(name,x,S,D,spread){
  const sig=sigmaFromCov(S,D,spread);
  return {
    name,
    r:x[0],rp:x[1],t:x[2],tp:x[3],
    disp:D[0],dispPrime:D[1],
    sigmaR:sig.r,sigmaT:sig.t,sigma:sig.mean,
    corrRT:(S[0][2]||0)/Math.max(1e-8,Math.sqrt(Math.abs(S[0][0]*S[2][2])))
  };
}

export function decodeControls(raw){
  return {
    f1:.55+(raw.f1/100)*1.35,
    r1:raw.r1/100,t1:raw.t1/100,
    f2:.55+(raw.f2/100)*1.35,
    r2:raw.r2/100,t2:raw.t2/100,
    energy:.72+(raw.energy/100)*1.28,
    spread:raw.spread/100,
    mainBend:raw.coarse/100,
    m3Topup:raw.fine/100,
    coarse:raw.coarse/100,
    fine:raw.fine/100,
    fx:raw.fx/100,fy:raw.fy/100
  };
}

function initialCovariance(){
  const [sr,srp,st,stp]=MODEL.optics.sourceSigma;
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

function optics4D(params,disturbance={},assist={}){
  const o=MODEL.optics;
  const rigidity=1/params.energy;
  let x=mergeInitial(disturbance);
  let S=initialCovariance();
  let D=zeros4();
  const stages=[makeStage('gun',x,S,D,params.spread)];

  const apply=M=>{x=mv(M,x);S=covProp(S,M);D=mv(M,D);};

  apply(driftM(o.sourceToF1));
  apply(rotatedLensM(2.45/params.f1,2.75/params.f1,o.focus1RotationDeg*DEG*params.f1));
  stages.push(makeStage('focus1',x,S,D,params.spread));

  apply(driftM(o.f1ToSteer1));
  x=kickState(x,params.r1*.020*rigidity,params.t1*.020*rigidity);
  stages.push(makeStage('steer1',x,S,D,params.spread));

  apply(driftM(o.steer1ToF2));
  apply(rotatedLensM(2.35/params.f2,2.62/params.f2,o.focus2RotationDeg*DEG*params.f2));
  stages.push(makeStage('focus2',x,S,D,params.spread));

  apply(driftM(o.f2ToSteer2));
  const r2Kick=params.r2*.026*rigidity+(assist.r2||0);
  const t2Kick=params.t2*.026*rigidity+(assist.t2||0);
  x=kickState(x,r2Kick,t2Kick);
  stages.push(makeStage('steer2',x,S,D,params.spread));

  apply(driftM(o.steer2ToBend));
  stages.push(makeStage('bendEntry',x,S,D,params.spread));

  return {x,S,D,stages,r2Kick,t2Kick};
}

function bending4D(optics,params,disturbance={}){
  const b=MODEL.bend;
  const main=params.mainBend+(disturbance.coarseBias||0);
  const topup=params.m3Topup+(disturbance.fineBias||0);
  const delta=disturbance.energyOffset||0;

  let x=[...optics.x];
  let S=optics.S.map(r=>[...r]);
  let D=[...optics.D];
  const stages=[];
  const maxDisp=[];

  function magnet(index,name,mainKick,topupKick=0){
    const theta=b[['m1Deg','m2Deg','m3Deg'][index]]*DEG;
    const rho=b.rho[index];
    const M=sectorM(theta,rho);
    const response=[.10,-.07,.06][index];
    const topupResponse=index===2?.18:0;
    const dispersionScale=b.dispersionScale[index]*(1+main*response+topup*topupResponse);
    const g=sectorDispersion(theta,rho,dispersionScale);

    x=addv(mv(M,x),scalev(g,delta));
    S=covProp(S,M);
    D=addv(mv(M,D),g);
    x=kickState(x,main*mainKick+topup*topupKick,0);
    stages.push(makeStage(name,x,S,D,params.spread));
    maxDisp.push(Math.abs(D[0]));

    const drift=driftM(b.drift[index]);
    x=mv(drift,x);S=covProp(S,drift);D=mv(drift,D);
  }

  magnet(0,'m1',.030,0);
  magnet(1,'m2',-.022,0);
  magnet(2,'m3',.035,.040);

  const target=makeStage('target',x,S,D,params.spread);
  stages.push(target);

  const maxD=Math.max(...maxDisp,1e-6);
  const residualD=Math.hypot(D[0],D[1]*.6);
  const intrinsicAchromacy=clamp(1-residualD/(maxD*1.5),0,1);
  const supplyPenalty=clamp(Math.abs(main)*.45+Math.abs(topup)*.28,0,.8);
  const achromacy=clamp(intrinsicAchromacy-supplyPenalty,0,1);

  return {x,S,D,stages,target,achromacy,effective:{mainBend:main,m3Topup:topup,energyOffset:delta}};
}

export function simulate(params,disturbance={},assist={}){
  const optics=optics4D(params,disturbance,assist);
  const bend=bending4D(optics,params,disturbance);
  const stages=[...optics.stages,...bend.stages];
  const target=bend.target;

  const spot=Math.max(.2,target.sigma);
  const mismatch=clamp(1-bend.achromacy,0,1);
  const error=Math.hypot(
    target.r*2.0,target.rp*1.2,target.t*2.0,target.tp*1.2,
    target.disp*params.spread*.08
  );

  return {
    stages,target,
    radialOffset:optics.x[0]*24,
    transverseOffset:optics.x[2]*24,
    radialAngle:optics.x[1],
    transverseAngle:optics.x[3],
    mismatch,
    achromacy:bend.achromacy,
    spot,
    error,
    effectiveBend:bend.effective,
    effectiveSteering:{r2Kick:optics.r2Kick,t2Kick:optics.t2Kick},
    covariance:bend.S,
    dispersionVector:bend.D
  };
}
