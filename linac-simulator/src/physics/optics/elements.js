export function driftM(L){
  return [
    [1,L,0,0],
    [0,1,0,0],
    [0,0,1,L],
    [0,0,0,1]
  ];
}

export function rotatedLensM(fR,fT,phi){
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

export function kickState(state,radialKick,transverseKick){
  return [
    state[0],
    state[1]+radialKick,
    state[2],
    state[3]+transverseKick
  ];
}


export function envelopeScaleM(scaleR,scaleT){
  return [
    [scaleR,0,0,0],
    [0,scaleR,0,0],
    [0,0,scaleT,0],
    [0,0,0,scaleT]
  ];
}
