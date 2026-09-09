export const UI_DEFAULTS = Object.freeze({
  gunEmission:100,gunTiming:0,magPower:100,magTune:0,rfPhase:0,
  f1:60,r1:0,t1:0,f2:62,r2:0,t2:0,energy:50,spread:25,coarse:0,fine:0,fx:10,fy:10,
  doseRateSet:600,gantry:0
});

// A visible but still transmitted teaching fault. Hard waveguide interceptions
// remain available by moving 1R/1T or 2R/2T farther toward their limits.
export const EXAMPLE_DEVIATION = Object.freeze({
  gunEmission:95,gunTiming:5,magPower:98,magTune:5,rfPhase:-3,
  f1:55,r1:3,t1:-3,f2:58,r2:-4,t2:4,
  energy:49,spread:35,coarse:5,fine:-3,fx:30,fy:18,
  doseRateSet:450,gantry:238
});

export const MODEL = Object.freeze({
  waveguideAngleDeg:-22.5,
  optics:{
    sourceToF1:2.0,
    f1ToSteer1:1.0,
    steer1ToF2:1.2,
    f2ToSteer2:1.0,
    steer2ToBend:1.4,
    sourceSigma:[.018,.009,.018,.009],
    focus1MinScale:.55,
    focus2MinScale:.30
  },
  bend:{
    m1Deg:45,
    m2Deg:-45,
    m3Deg:112.5,
    rho:[1.0,.95,1.18],
    drift:[.85,.90,.55],
    dispersionScale:[1.0,2.0312423,.29325213]
  },
  visual:{
    // Relative visual scale inferred from published Elekta transport schematics.
    // It is intentionally not presented as an OEM mechanical dimension.
    bendAssemblyScale:.58,
    bendPivot:[805,499],
    headShiftX:-304,
    // Visual-only target/window selector travel. This is a normalized schematic motion,
    // not an OEM mechanical travel specification.
    selectorTravelPx:26,
    selectorAxisDeg:0,
    beamOffsetPx:560,
    dispersionVisualScale:28,
    scatterVisualScale:1
  },
  radiation:{
    // Dimensionless educational apertures. These are deliberately not OEM bore sizes.
    apertures:{
      focus1:{r:.13,t:.13},
      steer1:{r:.12,t:.12},
      wgAfter1:{r:.034,t:.034},
      focus2:{r:.11,t:.11},
      wgAfter2:{r:.031,t:.031},
      steer2:{r:.10,t:.10},
      wgExit:{r:.028,t:.028},
      bendEntry:{r:.105,t:.105},
      m1:{r:.11,t:.12},
      m2:{r:.095,t:.17},
      m3:{r:.085,t:.20}
    },
    targetAcceptance:{
      photon:{r:.070,t:.070,rp:.080,tp:.080},
      electron:{r:.095,t:.095,rp:.100,tp:.100}
    }
  
  }
});

export const PART_INFO = Object.freeze({
  gun:['Electron gun','Start van de elektronenbundel. Emission en timing zijn in v14 alleen genormaliseerde onderwijsparameters.'],
  magnetron:['Magnetron / RF source','Microwave/RF-bron die de travelling-wave accelerating structure voedt. Vermogen, tune/AFC-offset en RF phase zijn genormaliseerde simulatorparameters; geen OEM servicewaarden.'],
  waveguide:['Accelerating waveguide','Travelling-wave versnellingsstructuur.'],
  focus1:['Focus 1','Eerste focuselement vóór primary steering. In v14/v15 verandert deze bediening alleen de R/T-beamenvelop en niet de centroidpositie of -hoek.'],
  steer1:['1R / 1T','Primary steering van de elektronenbundel.'],
  focus2:['Focus 2','Tweede focuselement tussen primary en secondary steering. Het comprimeert de al door Focus 1 verkleinde envelope verder zonder centroid-kick.'],
  steer2:['2R / 2T','Secondary steering vóór de bending assembly. Set, LUT en servo kunnen hier als afzonderlijke bijdragen worden weergegeven.'],
  bellows:['Centre joint / bellows','Vacuumovergang die de horizontale target-shift van de flight tube mogelijk maakt terwijl de waveguide en bending magnets op hun plaats blijven.'],
  slalom:['Slalom bending assembly','M1, M2 en M3 vormen samen de achromatische bendingsectie.'],
  flightTube:['Flight tube','Geëvacueerde flight tube die bij Photon ↔ Electron horizontaal door de vaste M1/M2/M3-poolgaps verschuift. De beam trajectory blijft in dit onderwijsmodel vast.'],
  head:['Treatment head','Behandelkop met target/window, monitoring en collimatie.'],
  target:['Target','Photon mode: elektronen produceren bremsstrahlung in de target.'],
  window:['Electron window','Electron mode: de target wordt omzeild.'],
  filter:['FF / FFF','FF en FFF worden als verschillende relatieve profielmodellen weergegeven; niet alleen als filter zichtbaar/onzichtbaar.'],
  monitor:['Monitor chamber','In het model levert de chamber relatieve dose- en tilt-signalen voor de virtuele servo.'],
  mirror:['Mirror','Optische lichtveld-/veldprojectie.'],
  mlc:['Agility MLC','160-leaf Agility-principe; leaf tips en defocus worden schematisch weergegeven.'],
  jaws:['Y diaphragms','Y-collimatie onder de MLC.'],
  applicator:['Electron applicator','Collimatie voor electronbehandeling.'],
  patient:['Patiëntvlak','Eind van het weergegeven bundeltraject.']
});
