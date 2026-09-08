import {MODEL} from '../machine/model.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function smoothPass(q,start=.55,end=1.05){
  if(q<=start)return 1;
  if(q>=end)return 0;
  const x=(q-start)/(end-start);
  const smooth=x*x*(3-2*x);
  return 1-smooth;
}

function stageByName(sim,name){
  return sim.stages.find(stage=>stage.name===name);
}

function normalizedRadius(stage,aperture){
  if(!stage||!aperture)return 0;
  return Math.hypot(
    stage.r/aperture.r,
    stage.t/aperture.t
  );
}

function targetCoupling(target,mode){
  const acceptance=MODEL.radiation.targetAcceptance[mode]||
    MODEL.radiation.targetAcceptance.photon;

  const position=Math.hypot(
    target.r/acceptance.r,
    target.t/acceptance.t
  );
  const angle=Math.hypot(
    target.rp/acceptance.rp,
    target.tp/acceptance.tp
  );

  const combined=Math.hypot(position,angle*.45);
  return {
    combined,
    transmission:smoothPass(combined,.35,1.15)
  };
}

export function evaluateRadiationTransport(sim,{mode='photon'}={}){
  const apertures=MODEL.radiation.apertures;
  const order=['focus1','steer1','focus2','steer2','bendEntry','m1','m2','m3'];

  let transmission=1;
  let wallScatter=0;
  let firstStrike=null;
  const events=[];

  for(const name of order){
    const stage=stageByName(sim,name);
    const aperture=apertures[name];
    const q=normalizedRadius(stage,aperture);
    const local=smoothPass(q,.55,1.05);
    const incoming=transmission;
    const lost=incoming*(1-local);

    if(lost>.002){
      const hard=q>=1.05;
      const event={
        stage:name,
        type:'wall',
        strength:clamp(lost*1.35,0,1),
        lostFraction:lost,
        normalizedRadius:q,
        hard
      };
      events.push(event);
      wallScatter+=lost*(.70+.20*Math.min(1,q));

      if(!firstStrike){
        firstStrike={
          stage:name,
          normalizedRadius:q,
          hard
        };
      }
    }

    transmission*=local;

    if(transmission<=1e-4){
      transmission=0;
      if(firstStrike)firstStrike.hard=true;
      if(events.length)events[events.length-1].hard=true;
      break;
    }
  }

  const coupling=targetCoupling(sim.target,mode);
  const targetIncoming=transmission;
  const targetLost=targetIncoming*(1-coupling.transmission);

  if(targetLost>.002){
    events.push({
      stage:'target',
      type:mode==='photon'?'target-miss':'window-miss',
      strength:clamp(targetLost*1.1,0,1),
      lostFraction:targetLost,
      normalizedRadius:coupling.combined,
      hard:coupling.transmission===0
    });

    if(!firstStrike&&coupling.transmission===0){
      firstStrike={
        stage:'target',
        normalizedRadius:coupling.combined,
        hard:true
      };
    }
  }

  const targetTransmission=transmission*coupling.transmission;

  // Continuous alignment factor: even before a hard wall strike, poorer target
  // position/angle reduces the useful beam. This is a normalized teaching proxy.
  const alignmentFactor=Math.exp(-Math.pow(sim.error/.28,2));

  let primaryTransmission=targetTransmission*alignmentFactor;
  if(firstStrike?.hard&&firstStrike.stage!=='target'){
    primaryTransmission=0;
  }
  primaryTransmission=clamp(primaryTransmission,0,1);

  // A faint normal head-scatter component remains for a useful photon beam.
  // Wall/interception scatter is tracked separately and rises as primary beam is lost.
  const normalHeadScatter=mode==='photon' ? primaryTransmission*.025 : 0;
  const missScatter=targetLost*.35;
  const scatterFraction=clamp(wallScatter+missScatter+normalHeadScatter,0,1);

  const doseRatePercent=primaryTransmission<.005
    ?0
    :Math.round(primaryTransmission*1000)/10;

  return {
    primaryTransmission,
    doseRatePercent,
    alignmentFactor,
    transportTransmission:transmission,
    targetCoupling:coupling.transmission,
    scatterFraction,
    scatterIndex:Math.round(scatterFraction*1000)/10,
    wallScatterFraction:clamp(wallScatter,0,1),
    firstStrike,
    events,
    status:doseRatePercent===0
      ?'Geen primaire output'
      :firstStrike
        ?'Bundel onderschept'
        :doseRatePercent<85
          ?'Lage transmissie'
          :'Normale transmissie'
  };
}
