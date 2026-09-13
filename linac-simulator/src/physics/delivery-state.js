const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function equivalentSquare(xCm,yCm){
  const x=clamp(Number(xCm)||10,1,40);
  const y=clamp(Number(yCm)||10,1,40);
  return 2*x*y/(x+y);
}

export function collimatorExchangeProxy(xCm,yCm,filter='ff'){
  const x=clamp(Number(xCm)||10,1,40);
  const y=clamp(Number(yCm)||10,1,40);
  if(Math.abs(x-y)<1e-12)return 1;

  // Published FF/FFF measurements report a collimator-exchange effect for
  // rectangular fields, with a smaller effect in FFF mode. RT-VTech models only
  // that qualitative asymmetry. X is MLC-defined and Y diaphragm-defined; the
  // sign of this schematic X/Y convention is not a claimed Versa HD calibration.
  // Coefficients are deliberately small, dimensionless teaching values, not
  // measured output corrections or TPS commissioning data.
  const signedAspect=clamp(Math.log(x/y)/Math.log(40),-1,1);
  const amplitude=filter==='fff'?.004:.012;
  return 1+amplitude*signedAspect;
}

export function photonOutputFactorProxy(xCm,yCm,filter='ff'){
  const eq=equivalentSquare(xCm,yCm);
  const isFff=filter==='fff';

  // Public Versa HD commissioning data report broad 1–40 cm square-field
  // output-factor ranges. This smooth curve is only an educational interpolation,
  // normalized to 10×10 cm = 1.000; it is not commissioning data.
  const lowAt1=isFff?.70:.69;
  const highAt40=isFff?1.09:1.16;

  let squareTrend;
  if(eq<=10){
    const u=Math.log(10/eq)/Math.log(10);
    squareTrend=1-(1-lowAt1)*Math.pow(clamp(u,0,1),.72);
  }else{
    const u=Math.log(eq/10)/Math.log(4);
    squareTrend=1+(highAt40-1)*Math.pow(clamp(u,0,1),.82);
  }

  return squareTrend*collimatorExchangeProxy(xCm,yCm,filter);
}

export function electronConeOutputProxy(xCm,yCm){
  const eq=equivalentSquare(xCm,yCm);

  // Versa HD commissioning literature explicitly characterizes electron cone/
  // cutout output factors across multiple applicator and field sizes and uses a
  // 10×10 cm applicator as the normalization reference. RT-VTech therefore no
  // longer treats every electron field as exactly 1.000. The curve below is a
  // deliberately shallow, dimensionless teaching proxy only: it encodes reduced
  // relative output for small cutouts and a modest increase for larger openings,
  // without reproducing any measured energy-, cone-, SSD- or cutout-specific data.
  if(eq<=10){
    const u=Math.log(10/eq)/Math.log(10);
    return 1-.08*Math.pow(clamp(u,0,1),.75);
  }

  const u=Math.log(eq/10)/Math.log(4);
  return 1+.04*Math.pow(clamp(u,0,1),.8);
}

export function evaluateDelivery({radiation,machine,params,sim=null,mode='photon',filter='ff'}){
  const powerOn=Boolean(machine?.powerOn);
  const beamRequested=Boolean(machine?.beamOn);
  const beamActive=powerOn&&beamRequested;
  const setpoint=clamp(params?.doseRateSet??600,37,600);
  const beamQuality=clamp(radiation?.primaryTransmission??0,0,1);
  const sourceFactor=clamp(sim?.rf?.sourceFactor??1,0,1.1);
  const sourceActive=(sim?.rf?.emissionFactor??1)>.002;

  const fieldFactor=mode==='photon'
    ?photonOutputFactorProxy(params?.fieldXcm??10,params?.fieldYcm??10,filter)
    :electronConeOutputProxy(params?.fieldXcm??10,params?.fieldYcm??10);

  const outputFraction=clamp(beamQuality*sourceFactor,0,1);
  const radiationActive=beamActive&&sourceActive;
  const usefulDoseRate=radiationActive?setpoint*outputFraction:0;
  const patientOutputProxy=radiationActive?usefulDoseRate*fieldFactor:0;
  const relativePatientOutput=radiationActive?outputFraction*fieldFactor:0;

  let status='Machine OFF';
  if(powerOn&&!beamActive)status='READY · BEAM OFF';
  else if(beamActive&&!sourceActive)status='BEAM ON · electron source uit';
  else if(beamActive&&usefulDoseRate<=.5)status='BEAM ON · geen useful output';
  else if(beamActive)status='BEAM ON';

  return {
    powerOn,
    beamActive,
    setpoint,
    beamQuality,
    sourceFactor,
    sourceActive,
    radiationActive,
    outputFraction,
    fieldFactor,
    usefulDoseRate,
    patientOutputProxy,
    relativePatientOutput,
    status
  };
}
