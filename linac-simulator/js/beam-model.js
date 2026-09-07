import {MODEL} from './config.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

function drift(state,L){ return {...state,x:state.x+L*state.xp}; }
function kick(state,k){ return {...state,xp:state.xp+k}; }
function lens(state,f){ return {...state,xp:state.xp-state.x/f}; }

function sector(state,theta,rho=1){
  const c=Math.cos(theta),s=Math.sin(theta),d=state.d||0;
  return {
    x:c*state.x+rho*s*state.xp+rho*(1-c)*d,
    xp:-(s/rho)*state.x+c*state.xp+s*d,
    d
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
    coarse:raw.coarse/100,fine:raw.fine/100,
    fx:raw.fx/100,fy:raw.fy/100
  };
}

export function transferPlane(k1,k2,f1,f2,initial={x:0,xp:0}){
  const o=MODEL.optics;
  let s={x:initial.x||0,xp:initial.xp||0};
  const samples=[{name:'gun',...s}];
  s=drift(s,o.sourceToF1);s=lens(s,2.5/f1);samples.push({name:'focus1',...s});
  s=drift(s,o.f1ToSteer1);s=kick(s,k1);samples.push({name:'steer1',...s});
  s=drift(s,o.steer1ToF2);s=lens(s,2.4/f2);samples.push({name:'focus2',...s});
  s=drift(s,o.f2ToSteer2);s=kick(s,k2);samples.push({name:'steer2',...s});
  s=drift(s,o.steer2ToBend);samples.push({name:'bendEntry',...s});
  return {state:s,samples};
}

function bendRadial(entry,params,disturbance){
  const DEG=Math.PI/180;
  const coarse=params.coarse+(disturbance.coarseBias||0);
  const fine=params.fine+(disturbance.fineBias||0);
  const energyOffset=disturbance.energyOffset||0;
  const theta1=MODEL.bend.m1Deg*DEG;
  const theta2=MODEL.bend.m2Deg*DEG;
  const theta3=MODEL.bend.m3Deg*DEG;
  let s={x:entry.x,xp:entry.xp,d:energyOffset};
  const samples=[];

  s=sector(s,theta1,1.0);s=kick(s,coarse*.030);samples.push({name:'m1',...s});
  s=drift(s,.85);
  s=sector(s,theta2,.95);s=kick(s,-coarse*.022);samples.push({name:'m2',...s});
  s=drift(s,.90);
  s=sector(s,theta3,1.18);s=kick(s,coarse*.035+fine*.040);samples.push({name:'m3',...s});
  s=drift(s,.55);samples.push({name:'target',...s});

  // Propagate a unit energy-offset ray to estimate normalized dispersion D = dx/dδ.
  let d={x:0,xp:0,d:1};
  const dispersion=[];
  d=sector(d,theta1,1.0);dispersion.push({name:'m1',D:d.x});
  d=drift(d,.85);d=sector(d,theta2,.95);dispersion.push({name:'m2',D:d.x});
  d=drift(d,.90);d=sector(d,theta3,1.18);dispersion.push({name:'m3',D:d.x});
  d=drift(d,.55);dispersion.push({name:'target',D:d.x});
  return {state:s,samples,dispersion,effective:{coarse,fine,energyOffset}};
}

function bendTransverse(entry){
  // Exact Elekta transverse field maps are not public. Keep this plane as paraxial drift transport.
  let s={x:entry.x,xp:entry.xp};
  const samples=[];
  s=drift(s,.65);samples.push({name:'m1',...s});
  s=drift(s,.85);samples.push({name:'m2',...s});
  s=drift(s,1.05);samples.push({name:'m3',...s});
  s=drift(s,.55);samples.push({name:'target',...s});
  return {state:s,samples};
}

function combineStages(radial,transverse,bendR,bendT,params){
  const tMap=new Map(transverse.samples.map(s=>[s.name,s]));
  const stages=radial.samples.map((r,i)=>{
    const t=tMap.get(r.name)||{x:0,xp:0};
    const sigmaBase=i<2?1.0:(i<4?.9:.82);
    return {name:r.name,r:r.x,rp:r.xp,t:t.x,tp:t.xp,disp:0,sigma:sigmaBase/((params.f1+params.f2)/2)};
  });
  const bt=new Map(bendT.samples.map(s=>[s.name,s]));
  const bd=new Map(bendR.dispersion.map(s=>[s.name,s.D]));
  bendR.samples.forEach((r,i)=>{
    const t=bt.get(r.name)||{x:0,xp:0};
    const sigma=[.82,.70,.62,.58][i]/((params.f1+params.f2)/2);
    stages.push({name:r.name,r:r.x,rp:r.xp,t:t.x,tp:t.xp,disp:bd.get(r.name)||0,sigma});
  });
  return stages;
}

export function simulate(params,disturbance={}){
  const rigidity=1/params.energy;
  const radial=transferPlane(
    params.r1*.020*rigidity,params.r2*.026*rigidity,params.f1,params.f2,
    disturbance.radial||{x:0,xp:0}
  );
  const transverse=transferPlane(
    params.t1*.020*rigidity,params.t2*.026*rigidity,params.f1,params.f2,
    disturbance.transverse||{x:0,xp:0}
  );
  const bendR=bendRadial(radial.state,params,disturbance);
  const bendT=bendTransverse(transverse.state);
  const stages=combineStages(radial,transverse,bendR,bendT,params);
  const target=stages[stages.length-1];
  const mismatch=Math.abs(params.coarse+(disturbance.coarseBias||0))*.68+Math.abs(params.fine+(disturbance.fineBias||0))*.36+Math.abs(disturbance.energyOffset||0)*.55;
  const achromacy=clamp(1-mismatch,0,1);
  const spot=clamp(1/((params.f1+params.f2)/2),.45,1.8);
  const error=Math.hypot(target.r*2.0,target.rp*1.2,target.t*2.0,target.tp*1.2,(target.disp*params.spread)*.12);
  return {
    radial,transverse,bendR,bendT,stages,target,
    radialOffset:radial.state.x*24,
    transverseOffset:transverse.state.x*24,
    radialAngle:radial.state.xp,
    transverseAngle:transverse.state.xp,
    mismatch,achromacy,spot,error,effectiveBend:bendR.effective
  };
}
