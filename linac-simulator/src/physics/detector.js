const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

function edge(x,half,w=.035){
  return 1/(1+Math.exp((Math.abs(x)-half)/w));
}
function norm(arr){
  const m=Math.max(...arr.map(p=>p.y),1e-9);
  return arr.map(p=>({...p,y:p.y/m}));
}

export function photonProfiles(sim,params,filter='ff'){
  const t=sim.target;
  const samples=81;
  const fieldHalfR=clamp(.92*params.fy,.025,.92);
  const fieldHalfT=clamp(.92*params.fx,.025,.92);
  const shiftR=clamp(t.r*5.5,-.22,.22);
  const shiftT=clamp(t.t*5.5,-.22,.22);
  const skewR=clamp(t.rp*4.0,-.18,.18);
  const skewT=clamp(t.tp*4.0,-.18,.18);

  const make=(half,shift,skew)=>{
    const pts=[];
    for(let i=0;i<samples;i++){
      const x=-1+2*i/(samples-1);
      const u=x-shift;
      let base;
      if(filter==='fff') base=Math.exp(-.5*(u/.58)**2);
      else base=.93+.07*Math.exp(-.5*(u/.48)**2);
      const shaped=base*edge(u,half,.035)*(1+skew*u);
      pts.push({x,y:Math.max(0,shaped)});
    }
    return norm(pts);
  };

  const radial=make(fieldHalfR,shiftR,skewR);
  const transverse=make(fieldHalfT,shiftT,skewT);
  const symmetryR=clamp(skewR*100,-20,20);
  const symmetryT=clamp(skewT*100,-20,20);
  return {
    radial,transverse,
    centerR:shiftR,centerT:shiftT,
    symmetryR,symmetryT,
    focalSpotOffset:Math.hypot(t.r,t.t),
    focalSpotAngle:Math.hypot(t.rp,t.tp)
  };
}

export function electronProfile(sim,params){
  const t=sim.target;
  const pts=[];
  const half=clamp(.08+.84*Math.min(params.fx,params.fy),.08,.92);
  const center=clamp(t.t*4.5,-.18,.18);
  const scatter=.08+.16*(1-params.energy/2);
  for(let i=0;i<81;i++){
    const x=-1+2*i/80,u=x-center;
    const broad=edge(u,half,.055+scatter*.08);
    const shoulder=.85+.15*Math.exp(-.5*(u/(half*.72+scatter))**2);
    pts.push({x,y:broad*shoulder});
  }
  return {profile:norm(pts),center,scatterWidth:scatter};
}

export function virtualEpid(sim,params){
  const t=sim.target;
  const focalR=clamp(t.r*5.2,-.25,.25);
  const focalT=clamp(t.t*5.2,-.25,.25);
  const mlcCenter={x:focalT*.72,y:focalR*.72};
  const diaphragmCenter={x:focalT*1.10,y:focalR*1.10};
  return {
    focal:{x:focalT,y:focalR},
    mlcCenter,diaphragmCenter,
    separation:Math.hypot(mlcCenter.x-diaphragmCenter.x,mlcCenter.y-diaphragmCenter.y),
    field:{x:clamp(.92*params.fx,.025,.92),y:clamp(.92*params.fy,.025,.92)}
  };
}
