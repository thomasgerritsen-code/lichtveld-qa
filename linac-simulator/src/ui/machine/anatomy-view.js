import {NS,headTranslationX} from './geometry.js';
import {slalomTopologyVisualState} from './hardware.js';

export const ANATOMY_SOURCES=[
  {title:'IAEA · systeemopbouw en behandelkop',url:'https://international.anl.gov/training/materials/IAEA%20Publications/Radiation%20Oncology%20Physics%20Handbook/Radiation%20Oncology%20Physics%20-%20Slides%20-%20pdf/Chapter_05_Teletherapy_machines.pdf'},
  {title:'AAPM / Waldron · SL25-transport en modusselectie',url:'https://www.aapm.org/meetings/02Am/pdf/8280-44071.pdf'},
  {title:'Van Appeldoorn · focus en R/T-steering',url:'https://aapm.onlinelibrary.wiley.com/doi/full/10.1002/acm2.13047'},
  {title:'Ohira · Agility-kop en MLC',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC7652464/'},
  {title:'Cashmore · Elekta FF en FFF',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC5874110/'},
  {title:'Elekta · bundelvorming en monitorkamers',url:'https://www.elekta.com/company/newsroom/videos/how-the-linear-accelerator-works-ff4ecjuoqeat1mh6ievmrg/'}
];
export const ANATOMY_VIEWS={
  complete:{label:'Complete machine',box:'0 155 1500 965'},
  transport:{label:'Versnellingsbuis',box:'30 395 925 550'},
  head:{label:'Behandelkop',box:'940 700 530 420'},
  mlc:{label:'MLC · bundelaanzicht',box:'770 155 690 255'}
};

export function mlcBeamEyeState(fieldX=10,fieldY=10,mode='photon'){
  const parked=mode==='electron';
  const clamp=x=>Math.max(1,Math.min(40,Number(x)||10));
  const halfX=parked?174:clamp(fieldX)/40*160;
  const halfY=parked?84:clamp(fieldY)/40*84;
  return {parked,halfX,halfY,center:{x:225,y:137},rows:Array.from({length:80},(_,index)=>({index,y:53+index*2.1,height:1.8}))};
}
function svg(name,attrs={}){
  const el=document.createElementNS(NS,name);
  for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));
  return el;
}
function text(parent,x,y,value,size=13,fill='#bed0df'){
  const el=svg('text',{x,y,'font-size':size,fill,'font-family':'system-ui,sans-serif'});el.textContent=value;parent.append(el);return el;
}
function buildBeamEye(hardware){
  const group=svg('g',{id:'mlcBeamEye',transform:'translate(790 165)','data-view':'beam-eye','data-geometry':'normalized-educational'});
  group.append(svg('rect',{x:0,y:0,width:650,height:235,rx:12,fill:'#0d1e2c',stroke:'#456176','stroke-width':1.6}));
  text(group,18,24,'AGILITY · AANZICHT LANGS DE BUNDEL',14);
  text(group,18,43,'80 bladparen in één collimatielaag — geen 80 lagen in de bundelrichting',11);
  const leaves=svg('g',{'data-role':'beam-eye-leaves'});group.append(leaves);
  const aperture=svg('rect',{id:'beamEyeAperture',fill:'#ffd66b','fill-opacity':'.14',stroke:'#ffd66b','stroke-width':1});group.append(aperture);
  for(const bank of ['A','B'])for(let i=0;i<80;i++)leaves.append(svg('rect',{'data-bank':bank,'data-leaf-index':i,fill:'#5f798c',stroke:'#9eb4c3','stroke-width':.25}));
  const jaws=svg('g',{'data-role':'beam-eye-diaphragms'});group.append(jaws);
  for(const side of ['top','bottom'])jaws.append(svg('rect',{'data-side':side,x:30,width:390,fill:'#172b3a','fill-opacity':'.92',stroke:'#73d7ca','stroke-width':1.5}));
  text(group,452,81,'X ↔ MLC-bladeren',13,'#ffd66b');
  text(group,452,109,'Y ↕ diafragma’s',13,'#81e7d6');
  text(group,452,150,'Zijdoorsnede hieronder:',12);text(group,452,170,'één bladprofiel per bank.',12);
  const mode=text(group,452,205,'',12);mode.id='beamEyeMode';
  hardware.append(group);
}
function renderBeamEye(state){
  const mode=state.machine.mode;
  const v=mlcBeamEyeState(state.controls.fx,state.controls.fy,mode);
  const group=document.querySelector('#mlcBeamEye');
  group.setAttribute('data-mode',mode);
  group.querySelectorAll('[data-leaf-index]').forEach(el=>{
    const row=v.rows[Number(el.getAttribute('data-leaf-index'))],left=el.getAttribute('data-bank')==='A';
    const x=left?30:v.center.x+v.halfX;
    const width=left?v.center.x-v.halfX-30:420-x;
    for(const [k,value] of Object.entries({x,y:row.y,width:Math.max(0,width),height:row.height}))el.setAttribute(k,String(value));
  });
  const a=group.querySelector('#beamEyeAperture');
  for(const [k,value] of Object.entries({x:v.center.x-v.halfX,y:v.center.y-v.halfY,width:v.halfX*2,height:v.halfY*2}))a.setAttribute(k,String(value));
  group.querySelectorAll('[data-side]').forEach(el=>{
    const top=el.getAttribute('data-side')==='top';
    el.setAttribute('y',String(top?53:v.center.y+v.halfY));
    el.setAttribute('height',String(Math.max(0,84-v.halfY)));
  });
  group.querySelector('#beamEyeMode').textContent=v.parked?'Elektronen: MLC geparkeerd':`${state.controls.fx} × ${state.controls.fy} cm @ iso`;
}
function shareHeadHardware(){
  // The absorber bodies remain in the head when the selected port changes.
  const shared=svg('g',{id:'sharedHeadHardware',transform:`translate(${headTranslationX()} 0)`,'data-role':'shared-head-hardware'});
  const photon=document.querySelector('#photonHead');
  for(const el of photon.querySelectorAll('.primaryColl,[data-role="monitor-backscatter-plate"]'))shared.append(el);
  photon.before(shared);
  const monitor=document.querySelector('[data-part="monitor"]');
  // A third chamber plane with seven lateral electrode indicators; no axial
  // row of seven chambers is implied by this schematic representation.
  const q=svg('g',{'data-role':'beam-quality-monitor','data-electrode-count':7});
  for(let i=0;i<7;i++)q.append(svg('line',{x1:1381+i*20,x2:1397+i*20,y1:927,y2:927,stroke:'#c8a9f5','stroke-width':2.2}));
  monitor.append(q);
}
function addServices(hardware){
  const g=svg('g',{id:'linacSupportSystems','data-role':'auxiliary-systems','data-geometry':'functional-block-diagram'});
  const blocks=[{x:65,title:'MODULATOR',sub:'Pulsen → gun + RF-bron'},{x:300,title:'VACUÜM',sub:'Geëvacueerde bundelbuis'},{x:535,title:'KOELING',sub:'RF-bron, buis en target'}];
  for(const b of blocks){g.append(svg('rect',{x:b.x,y:1020,width:215,height:65,rx:9,fill:'#102330',stroke:'#486578','stroke-width':1.5}));text(g,b.x+12,1043,b.title,13);text(g,b.x+12,1065,b.sub,11);}
  text(g,65,1110,'Hulpsystemen · functioneel schema; geen weergave van fysieke aansluitingen',11);
  hardware.append(g);
  // RF power feed is distinct from the vacuum electron beam line.
  const isolator=svg('g',{id:'rfIsolator','data-role':'rf-isolator'});
  isolator.append(svg('rect',{x:263,y:792,width:70,height:31,rx:6,fill:'#254252',stroke:'#9b7fce','stroke-width':2,transform:'rotate(32 298 807)'}));
  text(isolator,335,822,'RF-isolator',12,'#c5a9e8');
  hardware.append(isolator);
}
function labelBends(){
  const stations=slalomTopologyVisualState();
  for(const node of document.querySelectorAll('#labels text')){
    const i=['M1','M2','M3'].indexOf(node.textContent);
    if(i<0)continue;
    node.setAttribute('x',stations[i].x-17);node.setAttribute('y',stations[i].y-55);
    node.textContent=`M${i+1} · ${[45,-45,112.5][i]}°`;
  }
}
function addResearchPanel(machine){
  const panel=document.createElement('details');panel.className='overviewDetail anatomySources';
  const summary=document.createElement('summary');summary.textContent='Anatomie en bronnen · wat stelt deze versneller voor?';panel.append(summary);
  const body=document.createElement('div');body.className='anatomyNotes';
  body.innerHTML='<p><strong>Elekta-principe, geen replica van één model.</strong> Het transport volgt gepubliceerde SL25-schema’s; de collimatie toont Agility. FFF is een aanvullende moderne referentie. Afmetingen zijn schematisch.</p><p>De kop bevat achtereenvolgens target of elektronenvenster, primaire collimatie, filter of verstrooiingsfolies, monitoring en veldbegrenzing. De MLC staat in een aparte projectie langs de bundel; in de zijdoorsnede zie je twee representatieve bladprofielen.</p><p>Focusspoelen veroorzaken in werkelijkheid ook baanrotatie. De focusregelaars gebruiken hier nog een vereenvoudigd envelopmodel. De echte flight-tube-modusbeweging en de carousel worden uitgelegd, maar niet als exacte mechanische animatie nagebootst.</p>';
  const list=document.createElement('ul');for(const source of ANATOMY_SOURCES){const li=document.createElement('li'),a=document.createElement('a');a.href=source.url;a.textContent=source.title;a.target='_blank';a.rel='noopener noreferrer';li.append(a);list.append(li);}body.append(list);
  const a=document.createElement('a');a.href='https://github.com/thomasgerritsen-code/lichtveld-qa/blob/main/linac-simulator/research/linac-anatomy.md';a.textContent='Lees het onderzoek en alle ontwerpbesluiten';body.append(a);panel.append(body);machine.after(panel);
}
export function initAnatomyView(controller){
  const hardware=document.querySelector('#machineHardware');
  const machine=document.querySelector('#machineOverview');
  if(!hardware||!machine||document.querySelector('#mlcBeamEye'))return;
  shareHeadHardware();buildBeamEye(hardware);addServices(hardware);labelBends();
  const bar=document.createElement('nav');bar.className='anatomyViewNav';bar.setAttribute('aria-label','Anatomische aanzichten');
  const diagram=document.querySelector('#machineSvg');
  function select(key){
    diagram.setAttribute('viewBox',ANATOMY_VIEWS[key].box);
    for(const b of bar.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.view===key));
    diagram.setAttribute('data-anatomy-view',key);
  }
  for(const [key,v] of Object.entries(ANATOMY_VIEWS)){
    const b=document.createElement('button');b.type='button';b.dataset.view=key;b.textContent=v.label;b.addEventListener('click',()=>select(key));bar.append(b);
  }
  machine.querySelector('#machineViewport').before(bar);select('complete');
  const reference=document.createElement('div');reference.className='anatomyReference';reference.textContent='Elekta travelling-wave · SL25-transportreferentie + Agility-kop · schematische anatomie';bar.before(reference);
  addResearchPanel(machine);
  const update=()=>renderBeamEye(controller.store.getState());update();controller.store.subscribe(update);
}
