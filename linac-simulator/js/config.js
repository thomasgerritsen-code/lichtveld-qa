export const UI_DEFAULTS = Object.freeze({
  f1:60,r1:0,t1:0,f2:62,r2:0,t2:0,energy:55,spread:25,coarse:0,fine:0,fx:60,fy:60
});

export const MODEL = Object.freeze({
  waveguideAngleDeg:-22.5,
  optics:{
    sourceToF1:2.0,
    f1ToSteer1:1.0,
    steer1ToF2:1.2,
    f2ToSteer2:1.0,
    steer2ToBend:1.4
  },
  bend:{
    m1Deg:45,
    m2Deg:-45,
    m3Deg:112.5
  }
});

export const PART_INFO = Object.freeze({
  gun:['Electron gun','Start van de elektronenbundel.'],
  waveguide:['Accelerating waveguide','Travelling-wave versnellingsstructuur.'],
  focus1:['Focus 1','Eerste focuselement vóór primary steering.'],
  steer1:['1R / 1T','Primary steering van de elektronenbundel.'],
  focus2:['Focus 2','Tweede focuselement tussen primary en secondary steering.'],
  steer2:['2R / 2T','Secondary steering vóór de bending assembly.'],
  bellows:['Centre joint / bellows','Vacuumovergang vóór de flight tube.'],
  slalom:['Slalom bending assembly','M1, M2 en M3 vormen samen de achromatische bendingsectie.'],
  flightTube:['Flight tube','Geëvacueerde flight tube door de drie bendingmagneten.'],
  head:['Treatment head','Behandelkop met target/window, monitoring en collimatie.'],
  target:['Target','Photon mode: elektronen produceren bremsstrahlung in de target.'],
  window:['Electron window','Electron mode: de target wordt omzeild.'],
  filter:['FF / FFF','Flattening filter aanwezig in FF en uit de bundel in FFF.'],
  monitor:['Monitor chamber','Bewaking van de uitgezonden bundel.'],
  mirror:['Mirror','Optische lichtveld-/veldprojectie.'],
  mlc:['Agility MLC','MLC ligt dichter bij de bron dan de Y-diaphragms.'],
  jaws:['Y diaphragms','Y-collimatie onder de MLC.'],
  applicator:['Electron applicator','Collimatie voor electronbehandeling.'],
  patient:['Patiëntvlak','Eind van het weergegeven bundeltraject.']
});
