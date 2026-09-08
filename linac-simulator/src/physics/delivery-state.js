const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export function equivalentSquare(xCm,yCm){
  const x=clamp(Number(xCm)||10,1,40);
  const y=clamp(Number(yCm)||10,1,40);
  return 2*x*y/(x+y);
}

export function photonOutputFactorProxy(xCm,yCm,filter='ff'){
  const eq=equivalentSquare(xCm,yCm);
  const isFff=filter==='fff';

  // Public Versa HD commissioning data report broad 1–40 cm square-field
  // output-factor ranges. This smooth curve is only an educational interpolation,
  // normalized to 10×10 cm = 1.000; it is not commissioning data.
  const lowAt1=isFff?.70:.69;
  const highAt40=isFff?1.09:1.16;

  if(eq<=10){
    const u=Math.log(10/eq)/Math.log(10);
    return 1-(1-lowAt1)*Math.pow(clamp(u,0,1),.72);
  }

  const u=Math.log(eq/10)/Math.log(4);
  return 1+(highAt40-1)*Math.pow(clamp(u,0,1),.82);
}

export function evaluateDelivery({radiation,machine,params,mode='photon',filter='ff'}){
  const powerOn=Boolean(machine?.powerOn);
  const beamRequested=Boolean(machine?.beamOn);
  const beamActive=powerOn&&beamRequested;
  const setpoint=clamp(params?.doseRateSet??600,30,600);
  const beamQuality=clamp(radiation?.primaryTransmission??0,0,1);

  const fieldFactor=mode==='photon'
    ?photonOutputFactorProxy(params?.fieldXcm??10,params?.fieldYcm??10,filter)
    :1;

  const usefulDoseRate=beamActive?setpoint*beamQuality:0;
  const patientOutputProxy=beamActive?usefulDoseRate*fieldFactor:0;
  const relativePatientOutput=beamActive?beamQuality*fieldFactor:0;

  let status='Machine OFF';
  if(powerOn&&!beamActive)status='READY · BEAM OFF';
  else if(beamActive&&usefulDoseRate<=.5)status='BEAM ON · geen useful output';
  else if(beamActive)status='BEAM ON';

  return {
    powerOn,
    beamActive,
    setpoint,
    beamQuality,
    fieldFactor,
    usefulDoseRate,
    patientOutputProxy,
    relativePatientOutput,
    status
  };
}
