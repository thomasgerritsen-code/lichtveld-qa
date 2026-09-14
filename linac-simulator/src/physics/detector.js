const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

function edge(x,half,w=.035){
  return 1/(1+Math.exp((Math.abs(x)-half)/w));
}
function norm(arr){
  const m=Math.max(...arr.map(p=>p.y),1e-9);
  return arr.map(p=>({...p,y:p.y/m}));
}

export function agilityMlcLeakageFloor(filter='ff'){
  // Public Agility measurements show low but non-zero MLC transmission/leakage,
  // with lower measured transmission for matched FFF beams than FF beams.
  // These are deliberately normalized teaching floors only; they do not reproduce
  // measured transmission percentages, TPS parameters or OEM acceptance limits.
  return filter==='fff'?.0012:.0024;
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

  // Versa HD commissioning studies report qualitatively sharper penumbrae and
  // lower out-of-field dose for matched FFF beams than for their FF counterparts.
  // These widths are normalized drawing parameters only; they are not clinical
  // penumbra dimensions, commissioning measurements or OEM calibration values.
  const basePenumbraWidth=filter==='fff'?.029:.035;

  // Agility uses the MLC to define one field axis and a separate pair of sculpted
  // diaphragms on the orthogonal axis. Public Versa HD/Agility literature reports
  // direction-dependent penumbra and specifically notes that MLC-defined
  // collimation can produce the broader edge. The multipliers below encode only
  // that qualitative ordering; they are normalized educational parameters.
  const diaphragmPenumbraWidth=basePenumbraWidth*.94;
  const mlcPenumbraWidth=basePenumbraWidth*1.08;
  const mlcLeakage=agilityMlcLeakageFloor(filter);

  const make=(half,shift,skew,penumbraWidth,leakageFloor=0)=>{
    const pts=[];
    for(let i=0;i<samples;i++){
      const x=-1+2*i/(samples-1);
      const u=x-shift;
      let base;
      if(filter==='fff') base=Math.exp(-.5*(u/.58)**2);
      else base=.93+.07*Math.exp(-.5*(u/.48)**2);
      const aperture=edge(u,half,penumbraWidth);
      const transmission=leakageFloor+(1-leakageFloor)*aperture;
      const shaped=base*transmission*(1+skew*u);
      pts.push({x,y:Math.max(0,shaped)});
    }
    return norm(pts);
  };

  // R follows Y diaphragms; T follows X/MLC in the simulator controls. Only the
  // MLC-defined axis receives the Agility leakage floor; the diaphragm profile
  // keeps the existing edge model rather than inventing a second leakage value.
  const radial=make(fieldHalfR,shiftR,skewR,diaphragmPenumbraWidth,0);
  const transverse=make(fieldHalfT,shiftT,skewT,mlcPenumbraWidth,mlcLeakage);
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
  const effectiveEnergy=sim.effectiveEnergy??params.energy;

  // Versa HD measurements report increasing electron penumbra/peripheral spread
  // with increasing beam energy. Preserve only that qualitative ordering here.
  // The energy axis is the simulator's normalized RF/beam-energy coordinate and
  // the widths below are dimensionless teaching parameters, not MeV-specific
  // commissioning data, applicator factors or clinical penumbra dimensions.
  const normalizedEnergy=clamp((effectiveEnergy-.96)/.08,0,1);
  const scatter=.155+.010*normalizedEnergy;
  const centerR=clamp(t.r*4.5,-.18,.18);
  const centerT=clamp(t.t*4.5,-.18,.18);
  const halfR=clamp(.08+.84*params.fy,.08,.92);
  const halfT=clamp(.08+.84*params.fx,.08,.92);

  // Electron commissioning is performed with separate in-plane and cross-plane
  // profiles. Keep those axes independent in this normalized teaching model so
  // R/T steering and rectangular applicator/cutout proxies remain distinguishable.
  // No measured clinical profile widths or cone dimensions are reproduced here.
  const make=(half,center)=>{
    const pts=[];
    for(let i=0;i<81;i++){
      const x=-1+2*i/80,u=x-center;
      const broad=edge(u,half,.055+scatter*.08);
      const shoulder=.85+.15*Math.exp(-.5*(u/(half*.72+scatter))**2);
      pts.push({x,y:broad*shoulder});
    }
    return norm(pts);
  };

  const radial=make(halfR,centerR);
  const transverse=make(halfT,centerT);
  return {
    radial,
    transverse,
    // Compatibility alias for older callers: transverse was the only profile
    // represented before the axis-specific model was introduced.
    profile:transverse,
    centerR,
    centerT,
    center:centerT,
    scatterWidth:scatter
  };
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
