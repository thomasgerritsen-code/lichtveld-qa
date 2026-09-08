const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function gaussianEfficiency(offset,width){
  const x=offset/width;
  return Math.exp(-x*x);
}

function powerCapture(power){
  // Normalized threshold/capture curve, intentionally not an OEM RF power threshold.
  const x=clamp((power-.12)/.63,0,1);
  return x*x*(3-2*x);
}

export function evaluateRfSource(params){
  const emission=clamp(params.gunEmission,0,1.2);
  const timing=params.gunTiming;
  const power=clamp(params.magPower,0,1.2);
  const tune=params.magTune;
  const phase=params.rfPhase;

  const tuneEfficiency=gaussianEfficiency(tune,.62);
  const phaseEfficiency=gaussianEfficiency(phase,.72);
  const timingEfficiency=gaussianEfficiency(timing,.58);
  const powerEfficiency=powerCapture(power);

  const rfEfficiency=clamp(powerEfficiency*tuneEfficiency*phaseEfficiency,0,1);
  const captureFactor=clamp(rfEfficiency*timingEfficiency,0,1);

  // In a travelling-wave model, RF frequency/tune and phase primarily alter
  // the effective acceleration/capture. Power must be sufficient, then changes
  // mainly alter available accelerating field. All gains below are normalized.
  const beamLoadingPenalty=.035*Math.max(0,emission-1)/.2;
  const energyFactor=clamp(
    1
      +.10*(power-1)
      -.11*(1-tuneEfficiency)
      -.075*(1-phaseEfficiency)
      -beamLoadingPenalty,
    .72,
    1.08
  );

  const spreadPenalty=clamp(
    .34*(1-tuneEfficiency)
      +.24*(1-phaseEfficiency)
      +.22*(1-timingEfficiency)
      +.12*(1-powerEfficiency),
    0,
    .85
  );

  const sourceSigmaScale=1+1.15*(1-captureFactor);
  const sourceFactor=clamp(emission*captureFactor,0,1.1);

  return {
    emissionFactor:emission,
    timingEfficiency,
    powerEfficiency,
    tuneEfficiency,
    phaseEfficiency,
    rfEfficiency,
    captureFactor,
    sourceFactor,
    energyFactor,
    effectiveEnergy:clamp(params.energy*energyFactor,.70,1.12),
    effectiveSpread:clamp(params.spread+spreadPenalty,0,1.5),
    sourceSigmaScale,
    spreadPenalty
  };
}
