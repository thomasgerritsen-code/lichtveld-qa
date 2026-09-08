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
  const centroid=Math.hypot(
    stage.r/aperture.r,
    stage.t/aperture.t
  );
  const envelope=Math.max(
    (stage.sigmaR||0)/aperture.r,
    (stage.sigmaT||0)/aperture.t
  );
  return centroid+envelope*.35;
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

export function evaluateRadiationTransport(sim,{mode='photon',filter='ff',fieldXcm=10,fieldYcm=10}={}){
  const apertures=MODEL.radiation.apertures;
  const order=['focus1','steer1','wgAfter1','focus2','wgAfter2','steer2','wgExit','bendEntry','m1','m2','m3'];

  let transmission=1;
  let wallScatter=0;
  let firstStrike=null;
  let hardStrike=null;
  const events=[];

  const rf=sim.rf||null;
  if(rf&&rf.emissionFactor>.002&&rf.captureFactor<.995){
    const lostFraction=clamp((1-rf.captureFactor)*Math.min(1,rf.emissionFactor),0,1);
    if(lostFraction>.002){
      const hard=rf.captureFactor<.03;
      events.push({
        stage:'wgAfter1',
        type:'rf-loss',
        strength:clamp(lostFraction*.85,0,1),
        lostFraction,
        normalizedRadius:1-rf.captureFactor,
        hard
      });
      wallScatter+=lostFraction*.45;
      if(!firstStrike){
        firstStrike={
          stage:'wgAfter1',
          normalizedRadius:1-rf.captureFactor,
          hard
        };
      }
      if(hard&&!hardStrike){
        hardStrike={
          stage:'wgAfter1',
          normalizedRadius:1-rf.captureFactor,
          hard:true
        };
      }
    }
  }

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
      if(hard&&!hardStrike){
        hardStrike={
          stage:name,
          normalizedRadius:q,
          hard:true
        };
      }
    }

    transmission*=local;

    if(hardStrike?.stage==='wgAfter1'&&hardStrike.hard){
      transmission=0;
      break;
    }

    if(transmission<=1e-4){
      transmission=0;
      if(events.length){
        const event=events[events.length-1];
        event.hard=true;
        if(!hardStrike){
          hardStrike={
            stage:event.stage,
            normalizedRadius:event.normalizedRadius,
            hard:true
          };
        }
      }
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
    if(coupling.transmission===0&&!hardStrike){
      hardStrike={
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
  if(hardStrike?.hard&&hardStrike.stage!=='target'){
    primaryTransmission=0;
  }
  primaryTransmission=clamp(primaryTransmission,0,1);

  // A faint normal head-scatter component remains for a useful photon beam.
  // Its field-size dependence is qualitative and normalized around 10×10 cm.
  const x=Math.max(1,Math.min(40,Number(fieldXcm)||10));
  const y=Math.max(1,Math.min(40,Number(fieldYcm)||10));
  const eqSquare=2*x*y/(x+y);
  const fieldScatterScale=Math.max(.55,Math.min(1.40,.75+.25*(eqSquare/10)));
  const filterScatterScale=filter==='fff'?.65:1;
  const normalHeadScatter=mode==='photon'
    ?primaryTransmission*.025*fieldScatterScale*filterScatterScale
    :0;
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
    hardStrike,
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
