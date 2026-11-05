import {transportProjection,fieldProjection,beamEyeProjection,spotProjection,intensity,DISPLAY_SCALE,CONTROL_EFFECTS} from './presentation.js';
import {DEFAULTS,COMPONENTS,HEAD,SOURCES,SOLENOID_LENGTH,UNIT_PX,APERTURES,simulate,setMachine} from './model.js';

export function mountRebuiltSimulator(){
let state={...DEFAULTS},selected='focus1',view='complete',activeControl='f1';
const $=s=>document.querySelector(s),NS='http://www.w3.org/2000/svg';
const controls=[['f1','Focus 1',0,1,.01],['r1','1R',-1,1,.01],['t1','1T',-1,1,.01],['f2','Focus 2',0,1,.01],['r2','2R',-1,1,.01],['t2','2T',-1,1,.01],['momentum','Momentum (relatief)',.8,1.2,.005],['emission','Bronsterkte (relatief)',0,1,.01],['fieldX','Veld X op isocentrum (cm)',1,40,.5],['fieldY','Veld Y op isocentrum (cm)',1,40,.5]];
const views={complete:'0 0 1420 1010',transport:'40 170 920 470',head:'940 440 460 545',mlc:'75 15 635 220'};
function svg(tag,attrs={},parent){const el=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));parent?.append(el);return el;}
function label(parent,x,y,text,size=14,fill='#b8cddd'){const t=svg('text',{x,y,'font-size':size,fill},parent);t.textContent=text;return t;}
const path=pts=>pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
function part(parent,id){const g=svg('g',{'data-part':id,tabindex:0,role:'button','aria-label':COMPONENTS.find(c=>c.id===id)?.label??id},parent);g.addEventListener('click',()=>select(id));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(id);}});return g;}
function select(id){selected=id;render();}
$('#settings').innerHTML=controls.map(([id,title,min,max,step])=>`<label for="${id}"><span>${title}</span><output id="${id}Value"></output><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${state[id]}"></label>`).join('');
for(const[id]of controls)$('#'+id).addEventListener('input',e=>{state=setMachine(state,id,Number(e.target.value));activeControl=id;selected=({f1:'focus1',f2:'focus2',r1:'steer1',t1:'steer1',r2:'steer2',t2:'steer2',fieldX:state.mode==='electron'?'patient':'mlc',fieldY:state.mode==='electron'?'patient':'jaws',emission:'gun',momentum:'m1'})[id]??selected;render();});
$('#componentList').innerHTML=COMPONENTS.map((c,i)=>`<button data-select="${c.id}"><small>${String(i+1).padStart(2,'0')}</small>${c.label}</button>`).join('');
$('#componentList').addEventListener('click',e=>{const b=e.target.closest('[data-select]');if(b)select(b.dataset.select);});
$('#sources').innerHTML=SOURCES.map(([title,url])=>`<li><a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></li>`).join('');
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>{state=setMachine(state,'mode',b.dataset.mode);render();};
for(const b of document.querySelectorAll('[data-filter]'))b.onclick=()=>{state=setMachine(state,'filter',b.dataset.filter);render();};
for(const b of document.querySelectorAll('[data-view]'))b.onclick=()=>{view=b.dataset.view;render();};
$('#power').onclick=()=>{state=setMachine(state,'power',!state.power);render();};
$('#beamOn').onclick=()=>{state=setMachine(state,'beam',true);render();};
$('#beamOff').onclick=()=>{state=setMachine(state,'beam',false);render();};
$('#reset').onclick=()=>{state={...DEFAULTS};for(const[id]of controls)$('#'+id).value=state[id];render();};
$('#fault').onclick=()=>{state={...state,r1:.85,t2:-.6};for(const[id]of controls)$('#'+id).value=state[id];render();};
for(const b of document.querySelectorAll('[data-tab]'))b.onclick=()=>{for(const p of document.querySelectorAll('[data-panel]'))p.hidden=p.dataset.panel!==b.dataset.tab;for(const n of document.querySelectorAll('[data-tab]'))n.setAttribute('aria-selected',String(n===b));};
function drawMachine(sim){
 const canvas=$('#machine'),g=sim.geometry,x=g.headX,field=fieldProjection(state);canvas.replaceChildren();canvas.setAttribute('viewBox',views[view]);
 const defs=svg('defs',{},canvas),clip=svg('clipPath',{id:'bevClip'},defs);svg('rect',{x:120,y:55,width:280,height:140},clip);
 const main=svg('g',{class:'hardware'},canvas);
 const bore=2*APERTURES.tube*DISPLAY_SCALE;
 // Reference hardware is kept distinct from the schematic cabinet silhouette.
 svg('path',{d:`M65 565 L65 450 L760 157 Q850 110 966 135 H1250 V865 H1010 V500 L765 350 L110 620 Z`,class:'gantry'},main);
 const incoming=g.points.slice(0,g.guideEndIndex+1);
 svg('path',{d:path(incoming),class:'guideOuter',style:`stroke-width:${bore+8}px`},main);svg('path',{d:path(incoming),class:'guideBore',style:`stroke-width:${bore}px`},main);
 const a=incoming[0],b=incoming.at(-1),ang=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI;
 for(let i=1;i<26;i++){const t=i/26,cx=a.x+(b.x-a.x)*t,cy=a.y+(b.y-a.y)*t;svg('path',{d:`M-1 -23 V-19.5 M-1 19.5 V23`,transform:`translate(${cx} ${cy}) rotate(${ang})`,class:'iris'},main);}
 for(const c of g.stations){
  const half=c.kind==='solenoid'?SOLENOID_LENGTH*UNIT_PX/2:0,cx=c.x-Math.cos(ang*Math.PI/180)*half,cy=c.y-Math.sin(ang*Math.PI/180)*half;
  const p=part(main,c.id);p.setAttribute('transform',`translate(${cx} ${cy}) rotate(${ang})`);
  if(c.kind==='source'){
   svg('path',{d:'M-42 -28 H-6 L18 -12 V12 L-6 28 H-42 Z',class:'gun'},p);svg('path',{d:'M-29 -15 Q-40 0 -29 15 M-8 -15 V-5 M-8 5 V15',class:'electrode'},p);
  }else if(c.kind==='solenoid'){
   for(const sign of [-1,1]){svg('rect',{x:-half,y:sign<0?-46:29,width:half*2,height:17,rx:4,class:'focus'},p);for(let i=0;i<7;i++)svg('path',{d:`M${-21+i*7} ${sign*32} V${sign*43}`,class:'winding'},p);}
  }else if(c.kind==='steering'){
   for(const sign of [-1,1]){svg('rect',{x:-18,y:sign<0?-43:30,width:36,height:13,rx:4,class:'steering'},p);svg('path',{d:`M-20 ${sign*49} H20`,class:'tCoil'},p);}
  }else for(let i=0;i<6;i++)svg('path',{d:`M${-15+i*5} -19 V19`,class:'bellows'},p);
  label(main,cx-32,cy-69,c.label,14);
 }
 const tube=g.points.slice(g.guideEndIndex);svg('path',{d:path(tube),class:'tubeOuter',style:`stroke-width:${bore+8}px`},main);svg('path',{d:path(tube),class:'tubeBore',style:`stroke-width:${bore}px`},main);
 for(const c of g.bends){const p=part(main,c.id),pts=g.points.slice(c.start,c.end+1);svg('path',{d:path(pts),class:'bend'},p);svg('path',{d:path(pts),class:'bendGap',style:`stroke-width:${bore}px`},p);label(main,c.x-28,c.y-43,c.label);}
 // RF branch is not an electron transport line.
 svg('path',{d:'M250 660 V600 L180 560 L170 505',class:'rfFeed'},main);
 svg('rect',{x:205,y:640,width:90,height:60,rx:10,class:'rfSource'},main);label(main,216,665,'RF-bron',13);label(main,216,685,'magnetron',11);
 svg('rect',{x:212,y:589,width:76,height:26,rx:5,class:'isolator'},main);label(main,222,607,'Isolator',12);
 const services=[['Modulator','Pulsen → gun + RF'],['Vacuüm','Bundelbuis'],['Koeling','RF, buis, target']];
 services.forEach(([title,sub],i)=>{const sx=80+i*207;svg('rect',{x:sx,y:798,width:185,height:62,rx:9,class:'service'},main);label(main,sx+12,822,title);label(main,sx+12,844,sub,11);});label(main,80,885,'Hulpsystemen · functioneel, geen fysieke aansluitkaart',12);
 // Fixed, shared treatment-head frame.
 svg('path',{d:`M${x-95} 454 H${x+95} V826 H${x-95} Z`,class:'headHousing'},main);
 const target=part(main,'target');svg('rect',{x:x-19,y:state.mode==='photon'?HEAD.target:HEAD.window,width:38,height:state.mode==='photon'?7:3,class:state.mode==='photon'?'target':'foil'},target);
 const primary=part(main,'primary');for(const sign of [-1,1])svg('path',{d:sign<0?`M${x-95} 516 H${x-16} L${x-32} 560 H${x-95} Z`:`M${x+95} 516 H${x+16} L${x+32} 560 H${x+95} Z`,class:'absorber'},primary);
 const filter=part(main,'filter');
 if(state.mode==='electron'){
  svg('path',{d:`M${x-24} ${HEAD.primaryFoil} H${x+24}`,class:'foil'},filter);svg('path',{d:`M${x-39} 615 Q${x} 631 ${x+39} 615 Q${x} 621 ${x-39} 615 Z`,class:'foil'},filter);
 }else svg('path',{d:state.filter==='ff'?`M${x} 578 L${x+33} 617 H${x-33} Z`:`M${x-35} 594 H${x+35} V599 H${x-35} Z`,class:'filter'},filter);
 const monitor=part(main,'monitor');HEAD.monitor.forEach((y,i)=>{svg('rect',{x:x-73,y:y-5,width:146,height:10,rx:3,class:i===2?'quality':'monitor'},monitor);if(i===2)for(let j=0;j<7;j++)svg('path',{d:`M${x-62+j*19} ${y} h12`,class:'qualityElectrode'},monitor);});
 svg('path',{d:`M${x-73} 687 H${x+73}`,class:'backscatter'},main);svg('path',{d:`M${x-65} 703 L${x+65} 718`,class:'mirror'},main);svg('circle',{cx:x+80,cy:703,r:7,class:'lamp'},main);
 const mlc=part(main,'mlc'),gap=field.mlcHalfX;
 for(const sign of [-1,1])svg('rect',{x:sign<0?x-125:x+gap,y:HEAD.mlc,width:125-gap,height:35,rx:5,class:'absorber'},mlc);
 const jaws=part(main,'jaws');
 // The Y opening lies perpendicular to this radial side view. Its movement
 // is shown in the beam-eye view rather than falsely moving in the X plane.
 svg('rect',{x:x-100,y:HEAD.jaws,width:200,height:17,rx:4,class:'diaphragm sideJaw','data-gap-y':field.jawHalfY},jaws);
 if(state.mode==='electron')for(const sign of [-1,1])svg('path',{d:`M${x+sign*(field.applicatorTopX+4)} 828 L${x+sign*(field.applicatorBottomX+4)} 907`,class:'applicator'},main);
 const patient=part(main,'patient');svg('path',{d:`M${x-165} 940 H${x+165}`,class:'patientPlane'},patient);label(main,x-37,966,'Patiëntvlak',13);
 const labels=[[480,state.mode==='photon'?'Target':'Venster'],[540,'Primaire collimator'],[601,state.mode==='electron'?'Verstrooiingsfolies':state.filter==='ff'?'Flattening filter':'FFF-plaat'],[660,'Monitorkamers'],[710,'Spiegel / veldlicht'],[772,'MLC · zijprofiel'],[814,'Y · loodrecht op beeld']];
 labels.forEach(([y,title])=>{svg('path',{d:`M${x+98} ${y} h13`,class:'leader'},main);label(main,x+117,y+4,title,11);});
 // The radial side view and its ±2σ envelope use identical sampled optics.
 const projection=transportProjection(sim,'r');
 if(projection.length){
  const band=path([...projection.map(p=>p.upper),...projection.map(p=>p.lower).reverse()])+' Z';
  svg('path',{d:band,class:'transportEnvelope','data-envelope':'radial',opacity:sim.sourceActive?Math.max(.08,intensity(sim,state)*.32):.08},canvas);
 }
 if(sim.sourceActive){
  svg('path',{d:path(projection.map(p=>p.center)),class:'electronBeam',opacity:intensity(sim,state),'data-intensity':intensity(sim,state)},canvas);
  if(sim.strike){const last=projection.at(-1),row=sim.rows[sim.strike.index],p=sim.strike.plane==='r'?(row.r>=0?last.upper:last.lower):last.center;svg('circle',{cx:p.x,cy:p.y,r:8,class:'strike'},canvas);label(canvas,p.x+12,p.y-10,sim.strike.plane==='t'?'T-opvang (dwars)':'R-opvang',12,'#f6a077');}
 }
 if(sim.radiationActive){
  const apexX=x-sim.target.r*DISPLAY_SCALE,half=field.halfX;
  svg('path',{d:`M${apexX} ${field.sourceY+7} L${x-half} ${HEAD.patient} H${x+half} Z`,class:state.mode==='photon'?'photonBeam':'therapyElectron',opacity:intensity(sim,state),'data-half-x':half,'data-half-y':field.halfY},canvas);
 }
 drawBeamEye(canvas,sim);drawTargetSpot(canvas,sim);
 label(canvas,65,985,sim.sourceActive?'Radiaal zijaanzicht · blauwe band = ±2σ':'Optische voorspelling · bundel uit',12);
 for(const p of canvas.querySelectorAll('[data-part]'))p.classList.toggle('chosen',p.dataset.part===selected);
}
function drawBeamEye(canvas,sim){
 const g=svg('g',{'data-role':'beam-eye'},canvas),v=beamEyeProjection(state),cx=260,cy=125;
 svg('rect',{x:80,y:20,width:620,height:210,rx:10,class:'inset'},g);
 label(g,98,43,'MLC & VELD · AANZICHT LANGS DE BUNDEL',14);
 const leaves=svg('g',{'clip-path':'url(#bevClip)'},g);
 for(const row of v.rows)for(const sign of [-1,1])svg('rect',{x:sign<0?120:cx+v.mlcHalfX,y:row.y,width:Math.max(0,140-v.mlcHalfX),height:row.height,class:'bevLeaf','data-leaf':row.index,'data-bank':sign<0?'A':'B'},leaves);
 for(const top of [true,false])svg('rect',{x:120,y:top?55:cy+v.jawHalfY,width:280,height:Math.max(0,70-v.jawHalfY),class:'bevJaw','data-side':top?'top':'bottom'},g);
 svg('rect',{x:cx-v.halfX,y:cy-v.halfY,width:v.halfX*2,height:v.halfY*2,class:'fieldFootprint',opacity:sim.radiationActive?intensity(sim,state):.2,'data-field':'isocentre'},g);
 label(g,430,81,'X ↔ MLC / applicator',13,'#ebc96a');label(g,430,106,'Y ↕ diafragma / applicator',13,'#7bd6c7');
 label(g,430,147,`${state.fieldX} × ${state.fieldY} cm @ iso`,13);
 label(g,430,175,state.mode==='electron'?'MLC en diafragma’s geparkeerd':'X en Y hebben dezelfde beeldschaal',11);
 label(g,98,219,'160 bladeren in één laag · veldprojectie, geen materiaaltransport',11);
}
function drawTargetSpot(canvas,sim){
 const g=svg('g',{'data-role':'target-spot'},canvas),p=spotProjection(sim),cx=1040,cy=107;
 svg('rect',{x:820,y:20,width:550,height:170,rx:10,class:'inset'},g);
 label(g,838,43,'TARGET · LOKALE R/T-DOORSNEDE',14);
 svg('path',{d:`M${cx-70} ${cy} H${cx+70} M${cx} ${cy-48} V${cy+48}`,class:'plotAxis'},g);
 label(g,cx+80,cy+5,'T',13,'#76cbe4');label(g,cx-4,cy-53,'R',13,'#e9bd57');
 if(!p.intercepted){
  svg('ellipse',{cx:cx+p.t,cy:cy-p.r,rx:p.rx,ry:p.ry,class:'targetSpot',opacity:sim.radiationActive?intensity(sim,state):.25,'data-r':sim.target.r,'data-t':sim.target.t,'data-sigma-r':sim.target.sigmaR,'data-sigma-t':sim.target.sigmaT},g);
  label(g,838,172,'Ellips = 2σ · detailschaal ×4 t.o.v. de bundelbuis',11);
 }else label(g,850,133,'Bundel onderschept vóór het target',13,'#f6a077');
 if(!p.intercepted){label(g,1180,81,`R ${sim.target.r.toFixed(3)}`,12);label(g,1180,103,`T ${sim.target.t.toFixed(3)}`,12);}
}
function drawOptics(sim){
 const plot=$('#opticsPlot');plot.replaceChildren();
 const rows=sim.strike?sim.rows.slice(0,sim.strike.index+1):sim.rows;
 for(const [key,index,color]of [['r',0,'#e9bd57'],['t',1,'#76cbe4']]){
  const y=90+index*155;svg('path',{d:`M35 ${y} H780`,class:'plotAxis'},plot);
  const extent=Math.max(.08,...rows.flatMap(p=>[Math.abs(p.r)+2*p.sigmaR,Math.abs(p.t)+2*p.sigmaT]));
  const coordinate=(p,value)=>({x:35+p.s/sim.geometry.totalLength*745,y:y-value*55/extent});
  label(plot,665,y-60,`±${extent.toFixed(3)} rel.`,11,color);
  const upper=rows.map(p=>coordinate(p,p[key]+2*p[key==='r'?'sigmaR':'sigmaT']));
  const lower=rows.map(p=>coordinate(p,p[key]-2*p[key==='r'?'sigmaR':'sigmaT'])).reverse();
  svg('path',{d:path([...upper,...lower])+' Z',fill:color,'fill-opacity':.14},plot);
  svg('path',{d:path(rows.map(p=>coordinate(p,p[key]))),fill:'none',stroke:color,'stroke-width':2},plot);label(plot,35,y-60,index?'Transverse T / T′':'Radial R / R′',15,color);
 }
}
function render(){
 const sim=simulate(state);drawMachine(sim);drawOptics(sim);
 const c=COMPONENTS.find(c=>c.id===selected);$('#partTitle').textContent=c.label;$('#partDescription').textContent=c.description;
 for(const b of document.querySelectorAll('[data-select]'))b.setAttribute('aria-pressed',String(b.dataset.select===selected));
 for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===view));
 for(const b of document.querySelectorAll('[data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode));
 for(const b of document.querySelectorAll('[data-filter]')){b.setAttribute('aria-pressed',String(b.dataset.filter===state.filter));b.disabled=state.mode==='electron';}
 for(const[id]of controls)$('#'+id+'Value').textContent=state[id].toFixed(id.startsWith('field')?1:id==='momentum'?3:2);
 $('#power').textContent=state.power?'Machine aan':'Machine uit';$('#power').setAttribute('aria-pressed',String(state.power));$('#beamOn').disabled=!state.power;$('#beamOff').disabled=!state.beam;
 $('#beamStatus').textContent=!state.power?'UIT':sim.strike&&sim.sourceActive?'BUNDELOPVANG':sim.radiationActive?'BUNDEL AAN':'GEREED · BUNDEL UIT';$('#beamStatus').dataset.active=String(sim.radiationActive);
 $('#modeReadout').textContent=state.mode==='electron'?'Elektronen':'Fotonen '+state.filter.toUpperCase();$('#fieldReadout').textContent=`${state.fieldX} × ${state.fieldY} cm`;
 $('#outputReadout').textContent=sim.relativeOutput.toFixed(2)+' rel.';$('#targetReadout').textContent=sim.strike?'Bundel onderschept':'Binnen modelopening';
 $('#route').textContent=sim.route.map(id=>({'thin-plate':'FFF-plaat','primary-foil':'primaire folie','secondary-foil':'secundaire folie','parked-mlc':'MLC geparkeerd','primary-collimator':'primaire collimator','electron-window':'venster'}[id]??id)).join(' → ');
 $('#sliderFeedback').textContent=CONTROL_EFFECTS[activeControl]??'';
 $('#opticsReadout').textContent=sim.strike?'Bundel onderschept: het target wordt niet bereikt. De grafieken stoppen bij de modelopening.':`Target R: ${sim.target.r.toFixed(4)} · T: ${sim.target.t.toFixed(4)} · σR: ${sim.target.sigmaR.toFixed(4)} · σT: ${sim.target.sigmaT.toFixed(4)} — genormaliseerde eenheden`;
 window.linacV2={state:{...state},result:sim};
}
render();
}
if(typeof document!=='undefined')mountRebuiltSimulator();
