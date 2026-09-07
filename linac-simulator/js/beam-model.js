import {MODEL} from './config.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

function drift(state,L){ return {x:state.x + L*state.xp, xp:state.xp}; }
function kick(state,k){ return {x:state.x, xp:state.xp + k}; }
function lens(state,f){ return {x:state.x, xp:state.xp - state.x/f}; }

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

export function transferPlane(k1,k2,f1,f2){
  const o=MODEL.optics;
  let s={x:0,xp:0};
  const samples=[{name:'gun',...s}];
  s=drift(s,o.sourceToF1); s=lens(s,2.5/f1); samples.push({name:'focus1',...s});
  s=drift(s,o.f1ToSteer1); s=kick(s,k1); samples.push({name:'steer1',...s});
  s=drift(s,o.steer1ToF2); s=lens(s,2.4/f2); samples.push({name:'focus2',...s});
  s=drift(s,o.f2ToSteer2); s=kick(s,k2); samples.push({name:'steer2',...s});
  s=drift(s,o.steer2ToBend); samples.push({name:'bendEntry',...s});
  return {state:s,samples};
}

export function simulate(params){
  const rigidity=1/params.energy;
  const radial=transferPlane(params.r1*.020*rigidity, params.r2*.026*rigidity, params.f1,params.f2);
  const transverse=transferPlane(params.t1*.020*rigidity, params.t2*.026*rigidity, params.f1,params.f2);
  const mismatch=Math.abs(params.coarse)*.68+Math.abs(params.fine)*.36;
  const achromacy=clamp(1-mismatch,0,1);
  const spot=clamp(1/((params.f1+params.f2)/2),.45,1.8);
  return {
    radial,transverse,
    radialOffset:radial.state.x*24,
    transverseOffset:transverse.state.x*24,
    radialAngle:radial.state.xp,
    transverseAngle:transverse.state.xp,
    mismatch,achromacy,spot
  };
}
