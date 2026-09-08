export const SOURCES = Object.freeze([
  {
    id:'elekta-how',
    title:'Elekta – How the linear accelerator works',
    url:'https://www.elekta.com/company/newsroom/videos/how-the-linear-accelerator-works-ff4ecjuoqeat1mh6ievmrg/',
    type:'manufacturer',
    scope:'Elekta linacs – high-level architecture',
    confidence:'high',
    claims:['Travelling-wave acceleration','Flight-tube magnets','Slalom bending','Target and MLC treatment chain']
  },
  {
    id:'appeldoorn-2020',
    title:'van Appeldoorn et al. – Gantry angle dependent beam control optimization',
    url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7700923/',
    type:'peer-reviewed',
    scope:'Elekta travelling-wave linac',
    confidence:'high',
    claims:['Focus 1 → 1R/1T → Focus 2 → 2R/2T','R/T steering terminology','Set + LUT + servo concept','Integrated chamber steering signal']
  },
  {
    id:'appeldoorn-2025',
    title:'van Appeldoorn et al. – New gantry angle-dependent beam control optimization',
    url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC11905234/',
    type:'peer-reviewed',
    scope:'Elekta travelling-wave linacs',
    confidence:'high',
    claims:['Gantry-angle steering dependence','Filtered servo corrections applied to LUT','CW/CCW dependence and hysteresis context']
  },
  {
    id:'iaea-1196',
    title:'IAEA – Radiation Oncology Physics handbook',
    url:'https://www-pub.iaea.org/MTCD/Publications/PDF/Pub1196_web.pdf',
    type:'international-reference',
    scope:'Medical linacs – generic architecture',
    confidence:'high',
    claims:['Steering and focusing coils','Evacuated transport','Bending magnets','Electron window, scattering foils and applicators']
  },
  {
    id:'paynter-2019',
    title:'Paynter – Elekta electron transport system (PhD thesis, Leeds)',
    url:'https://etheses.whiterose.ac.uk/id/eprint/25617/1/thesis_submission.pdf',
    type:'academic-thesis',
    scope:'Elekta Versa HD / Synergy transport schematics',
    confidence:'medium-high',
    claims:['Relative waveguide-to-bending-section proportions','44° / 44° / 112° transport layout','Compact slalom assembly after the waveguide']
  },
  {
    id:'waldron-2002',
    title:'Waldron – AAPM computer-controlled medical linac refresher course',
    url:'https://ccah.vetmed.ucdavis.edu/sites/g/files/dgvnsk4586/files/local_resources/pdfs/rad-onc-matney-x-ray-generators.pdf',
    type:'AAPM-education',
    scope:'Conceptual Elekta-style slalom layout',
    confidence:'medium',
    claims:['22° accelerator entry','45° down / 45° up / 112.5° down','Compact bending/flight-tube geometry','Vacuum bellows permits flight-tube movement','Separate photon-target and electron-window positions']
  },
  {
    id:'elekta-target-shift-2023',
    title:'Elekta Corrective Maintenance – target shift system (public mirror)',
    url:'https://www.scribd.com/document/842977102/Linac-Corrective-Maintenance-Beam-Physics-and-Dosimetry-1564743-01',
    type:'manufacturer-manual-public-mirror',
    scope:'Elekta medical linac target shift / beam bending system',
    confidence:'high',
    claims:['Flight tube and target move horizontally between photon and electron home positions','Stainless-steel bellows permits motion relative to the waveguide','Bending magnet assembly is adjacent to the target-shift drive and is not described as moving during normal mode selection']
  },
  {
    id:'elekta-patent',
    title:'Elekta patent – achromatic triple-magnet beam transport',
    url:'https://patents.google.com/patent/EP4010073B1/en',
    type:'patent',
    scope:'Elekta-style triple-magnet transport',
    confidence:'high',
    claims:['M1 energy analysis','M2 reverse bend/focusing','M3 >90° final bend','Main supply + additional M3 top-up concept']
  },
  {
    id:'versa-commissioning',
    title:'Narayanasamy et al. – Commissioning an Elekta Versa HD linear accelerator',
    url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5690217/',
    type:'peer-reviewed',
    scope:'Elekta Versa HD / Agility',
    confidence:'high',
    claims:['One sculpted diaphragm pair is orthogonal to the Agility MLC','MLC replaces the orthogonal jaw pair','80 interdigitating leaf pairs']
  },
  {
    id:'agility-focal',
    title:'Chojnowski et al. – Beam focal spot position determination for Agility',
    url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6036348/',
    type:'peer-reviewed',
    scope:'Elekta Agility head',
    confidence:'high',
    claims:['Agility uses one diaphragm pair plus MLC','Focal-spot offset observable with MLC/diaphragm geometry','MLC is closer to target than diaphragms']
  },
  {
    id:'agility-model',
    title:'Hernandez et al. – Challenges in modeling the Agility MLC',
    url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10092639/',
    type:'peer-reviewed',
    scope:'Elekta Agility MLC',
    confidence:'high',
    claims:['Large leaf thickness','Eccentric leaf-tip curvature','Defocused leaf sides','Tongue-and-groove modelling relevance']
  },
  {
    id:'agility-elekta',
    title:'Elekta – Agility MLC product announcement',
    url:'https://ir.elekta.com/investors/press-releases/2012/elektas-new-agility-mlc-solution-poised-to-revolutionize-beam-shaping-of-radiation-therapy-cancer-treatments/',
    type:'manufacturer',
    scope:'Agility',
    confidence:'high',
    claims:['160 tungsten leaves','5 mm projected leaf width']
  },
  {
    id:'fff',
    title:'Meshram et al. – Versa HD FF/FFF dosimetric properties',
    url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5690903/',
    type:'peer-reviewed',
    scope:'Elekta Versa HD photon beams',
    confidence:'medium-high',
    claims:['FF and FFF have different beam characteristics','FFF profile is not equivalent to simply drawing the FF profile without a filter']
  },
  {
    id:'out-of-field-review',
    title:'Hauri et al. – Analytical models for external photon beam radiotherapy out-of-field dose calculation',
    url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC10203488/',
    type:'peer-reviewed-review',
    scope:'External photon beam radiotherapy – secondary/out-of-field radiation',
    confidence:'high',
    claims:['Primary and secondary radiation are distinct components','Secondary radiation includes patient scatter, head/collimator scatter and leakage','Room scatter is a separate contribution']
  },
  {
    id:'epid-focal',
    title:'Chojnowski et al. – EPID-based focal spot determination',
    url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC6036348/',
    type:'peer-reviewed',
    scope:'Elekta Agility QA concept',
    confidence:'high',
    claims:['Focal-spot offset is linked to MLC/diaphragm-defined radiation centres','EPID can visualize the geometrical consequence']
  }
]);

export const CLAIMS = Object.freeze({
  opticsOrder:{confidence:'high',sourceIds:['appeldoorn-2020'],label:'Focus/steering volgorde'},
  focusCoupling:{confidence:'medium',sourceIds:['appeldoorn-2020'],label:'Helicale/coupled focusrespons',note:'De app gebruikt een vereenvoudigde gekoppelde 4D matrix, geen OEM solenoid field map.'},
  slalom:{confidence:'high',sourceIds:['elekta-patent','iaea-1196','elekta-how'],label:'M1/M2/M3 slalomfunctie'},
  bendGeometryScale:{confidence:'medium',sourceIds:['paynter-2019','waldron-2002','elekta-patent'],label:'Relatieve bending-assembly schaal',note:'De v6 hoofdtekening gebruikt gepubliceerde schematische verhoudingen. Exacte OEM-afmetingen van coils/pole pieces zijn publiek niet beschikbaar; daarom wordt de schaal als relatieve geometrie en niet als millimetermaat gepresenteerd.'},
  targetWindowSelector:{confidence:'high',sourceIds:['elekta-target-shift-2023','waldron-2002','paynter-2019'],label:'Bellows / flight-tube target-window selectie',note:'De flight tube + target/window bewegen horizontaal ten opzichte van de waveguide en binnen de vaste bending-magnet assembly. De app gebruikt geen OEM mechanische slag of timing.'},
  bendFields:{confidence:'model',sourceIds:['elekta-patent'],label:'Magnetische veldrespons',note:'Genormaliseerde sector-magnet matrices; geen OEM poolprofielen of veldkaarten.'},
  steeringFeedback:{confidence:'high',sourceIds:['appeldoorn-2020','appeldoorn-2025'],label:'Set + LUT + Servo'},
  agility:{confidence:'high',sourceIds:['agility-focal','agility-model','agility-elekta'],label:'Agility head / MLC'},
  controlCausality:{confidence:'high',sourceIds:['appeldoorn-2020','elekta-patent','versa-commissioning'],label:'Slider → fysiek subsysteem',note:'Steeringcorrecties beginnen bij hun eigen coils, main bending bij M1, M3 top-up pas bij M3 en field X/Y worden aan MLC/diaphragms gekoppeld. De grootte van de respons blijft een genormaliseerd onderwijsmodel.'},
  photonProfile:{confidence:'model',sourceIds:['fff','agility-focal'],label:'Photon profile koppeling',note:'Kwalitatief educatief profiel; geen dosisberekening.'},
  beamLossScatter:{confidence:'model',sourceIds:['out-of-field-review','iaea-1196','appeldoorn-2025'],label:'Beam loss, scatter en relatieve dose rate',note:'V12 koppelt genormaliseerde beam-interception aan verlies van useful-beam transmissie en een relatieve scatter-index. Dit is geen shieldingberekening, geen leakage-specificatie en geen klinische dose-rate calibratie.'},
  electronMode:{confidence:'high',sourceIds:['iaea-1196'],label:'Electron window / scattering foils / applicator'},
  epid:{confidence:'medium-high',sourceIds:['epid-focal'],label:'Virtuele EPID/focal-spot QA',note:'Alleen geometrisch principe, geen klinische procedure of tolerantie.'}
});

export function sourceById(id){ return SOURCES.find(s=>s.id===id); }
