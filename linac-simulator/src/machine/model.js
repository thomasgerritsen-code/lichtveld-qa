export const UI_DEFAULTS = Object.freeze({
  f1:60,r1:0,t1:0,f2:62,r2:0,t2:0,energy:50,spread:25,coarse:0,fine:0,fx:10,fy:10,
  doseRateSet:600,gantry:0
});

export const MODEL = Object.freeze({
  waveguideAngleDeg:-22.5,
  optics:{
    sourceToF1:2.0,
    f1ToSteer1:1.0,
    steer1ToF2:1.2,
    f2ToSteer2:1.0,
    steer2ToBend:1.4,
    focus1RotationDeg:18,
    focus2RotationDeg:-14,
    sourceSigma:[.018,.009,.018,.009]
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
      focus2:{r:.11,t:.11},
      steer2:{r:.10,t:.10},
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
  gun:['Electron gun','Start van de elektronenbundel.'],
  waveguide:['Accelerating waveguide','Travelling-wave versnellingsstructuur.'],
  focus1:['Focus 1','Eerste focuselement vóór primary steering. In het 4D onderwijsmodel bevat het ook een kleine gekoppelde R/T-rotatie.'],
  steer1:['1R / 1T','Primary steering van de elektronenbundel.'],
  focus2:['Focus 2','Tweede focuselement tussen primary en secondary steering.'],
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
