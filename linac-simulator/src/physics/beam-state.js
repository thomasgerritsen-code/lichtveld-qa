export function sigmaFromCov(S,D,spread){
  const energySigma=.012*spread;
  const radial=Math.sqrt(Math.max(0,S[0][0]+(D[0]*energySigma)**2));
  const transverse=Math.sqrt(Math.max(0,S[2][2]+(D[2]*energySigma)**2));
  return {radial,transverse,mean:(radial+transverse)/2};
}

export function makeStage(name,state,covariance,dispersion,spread){
  const sigma=sigmaFromCov(covariance,dispersion,spread);
  return {
    name,
    r:state[0],
    rp:state[1],
    t:state[2],
    tp:state[3],
    disp:dispersion[0],
    dispPrime:dispersion[1],
    sigmaR:sigma.radial,
    sigmaT:sigma.transverse,
    sigma:sigma.mean,
    corrRT:(covariance[0][2]||0)/Math.max(
      1e-8,
      Math.sqrt(Math.abs(covariance[0][0]*covariance[2][2]))
    )
  };
}
