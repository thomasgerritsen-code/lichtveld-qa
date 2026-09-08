export const CONTROL_EFFECTS=Object.freeze({
  f1:{part:'focus1',plane:'both',start:'focus1',label:'Focus 1',text:'Verandert focus/envelope vanaf Focus 1. De centroidpositie verandert daar lokaal niet; downstream kan een reeds off-axis bundel wel anders evolueren.'},
  r1:{part:'steer1',plane:'radial',start:'steer1',label:'1R',text:'Lokale radiale hoek-kick bij primary steering. Alles vóór 1R blijft onveranderd; R en R′ veranderen downstream.'},
  t1:{part:'steer1',plane:'transverse',start:'steer1',label:'1T',text:'Lokale transverse hoek-kick bij primary steering. De hoofd-side-view is radiaal; het directe effect zie je vooral in de transverse beam view.'},
  f2:{part:'focus2',plane:'both',start:'focus2',label:'Focus 2',text:'Verandert focus/envelope vanaf Focus 2. Alles upstream van Focus 2 blijft visueel en fysisch onveranderd.'},
  r2:{part:'steer2',plane:'radial',start:'steer2',label:'2R',text:'Lokale radiale hoek-kick bij secondary steering. Beïnvloedt alleen het traject downstream richting bend en target.'},
  t2:{part:'steer2',plane:'transverse',start:'steer2',label:'2T',text:'Lokale transverse hoek-kick bij secondary steering. Beïnvloedt alleen T/T′ downstream.'},
  energy:{part:['waveguide','slalom'],plane:'energy',start:'waveguide',label:'Electron momentum',text:'Verandert de relatieve elektronenrigiditeit. Daardoor veranderen steeringgevoeligheid en bendingrespons, maar de bundel wordt niet vóór de relevante magneten kunstmatig verschoven.'},
  spread:{part:'slalom',plane:'energy',start:'m1',label:'Energiespreiding',text:'Verandert de chromatische bundelenvelop en de lage/hoge-energie rays vanaf M1. De centrale nominale ray blijft door spread alleen onveranderd.'},
  coarse:{part:'slalom',plane:'radial',start:'m1',label:'Main bending supply',text:'Werkt als gezamenlijke bending-respons op M1, M2 en M3. Het zichtbare effect begint daarom pas bij M1.'},
  fine:{part:'slalom',plane:'radial',start:'m3',label:'M3 top-up',text:'Extra laatste-magneettrim. De visualisatie laat vóór M3 geen effect van deze slider zien.'},
  fx:{part:'mlc',plane:'field',start:'mlc',label:'Veld X',text:'Stuurt de opening van de Agility MLC-leaf banks. De electron transportsectie vóór de treatment head blijft onveranderd.'},
  fy:{part:'jaws',plane:'field',start:'jaws',label:'Veld Y',text:'Stuurt de Y-diaphragms. De MLC- en electrontransportposities worden door deze slider niet verplaatst.'},
  gantry:{part:['steer2','monitor'],plane:'feedback',start:'gun',label:'Gantry angle',text:'Verandert de genormaliseerde gantry-afhankelijke beam disturbance en, indien actief, LUT/servo-correctie. Dit is een globale omgevings-/feedbackrespons, geen lokale magneetverplaatsing.'}
});
