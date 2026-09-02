'use strict';

// Meetdata VT -> wekelijkse Linac QA importmodule.
// Importeert uitsluitend de ruwe waarden gun_vacuum en target_vacuum die de
// Meetdata-helper op de reeds geauthenticeerde Meetdata VT-pagina heeft gezien.
// Er worden geen grenswaarden, conversies of klinische interpretaties toegepast.

const MEETDATA_STORE_KEY='linac-weekly-meetdata-v1';
const MEETDATA_HASH_PREFIX='#meetdata=';
let meetdataSnapshot=null;

function mdEl(id){return document.getElementById(id)}
function mdEsc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]))}
function mdNormSystem(s){return String(s||'').trim().replace(/-monitor$/i,'').toUpperCase().replace(/\s+/g,'')}
function mdNumber(v){const n=Number(v);return Number.isFinite(n)?n:null}
function mdFormat(v){const n=mdNumber(v);return n===null?'-':String(n)}
function mdFormatTime(iso){
  const d=new Date(iso);if(Number.isNaN(d.getTime()))return 'onbekend tijdstip';
  return d.toLocaleString('nl-NL',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
}
function mdB64urlDecode(s){
  try{let x=s.replace(/-/g,'+').replace(/_/g,'/');while(x.length%4)x+='=';return decodeURIComponent(escape(atob(x)))}catch(e){return null}
}
function mdParseHash(){
  if(!location.hash.startsWith(MEETDATA_HASH_PREFIX))return null;
  const encoded=location.hash.slice(MEETDATA_HASH_PREFIX.length);
  history.replaceState(null,'',location.pathname+location.search);
  const raw=mdB64urlDecode(encoded);if(!raw)return {error:'Importgegevens konden niet worden gelezen.'};
  try{return JSON.parse(raw)}catch(e){return {error:'Importgegevens hebben geen geldig formaat.'}}
}
function mdLoadStore(){
  try{const raw=localStorage.getItem(MEETDATA_STORE_KEY);if(raw)meetdataSnapshot=JSON.parse(raw)}catch(e){meetdataSnapshot=null}
}
function mdSaveStore(){
  try{if(meetdataSnapshot)localStorage.setItem(MEETDATA_STORE_KEY,JSON.stringify(meetdataSnapshot));else localStorage.removeItem(MEETDATA_STORE_KEY)}catch(e){console.warn('Meetdata metadata kon niet worden opgeslagen',e)}
}
function mdClearStore(){meetdataSnapshot=null;mdSaveStore();mdRender()}
function mdValidate(p){
  if(!p||p.error)return {ok:false,error:p?.error||'Geen importgegevens ontvangen.'};
  if(p.source!=='MeetdataVT')return {ok:false,error:'Onbekende Meetdata-bron.'};
  const system=mdNormSystem(p.system||p.monitor);const gun=mdNumber(p.gun),target=mdNumber(p.target);const ts=new Date(p.capturedAt||'');
  if(!/^U\d+[A-Z]?$/.test(system))return {ok:false,error:'Systeemnaam uit Meetdata VT werd niet herkend.'};
  if(gun===null||target===null)return {ok:false,error:'Gun- en Target-vacuüm zijn niet allebei numeriek.'};
  if(Number.isNaN(ts.getTime()))return {ok:false,error:'Meetdata-tijdstip ontbreekt of is ongeldig.'};
  const age=Math.abs(Date.now()-ts.getTime());if(age>30*60*1000)return {ok:false,error:'De ontvangen Meetdata-metingen zijn ouder dan 30 minuten. Open Meetdata VT opnieuw en importeer actuele waarden.'};
  return {ok:true,data:{version:1,source:'Meetdata VT',system,monitor:String(p.monitor||system+'-monitor'),gun,target,capturedAt:ts.toISOString(),importedAt:new Date().toISOString(),raw:true,manualGun:false,manualTarget:false}};
}
function mdInstallUi(){
  const tech=document.getElementById('techniek');if(!tech)return;
  const firstCard=tech.querySelector('.qaCard');if(!firstCard)return;
  if(!document.getElementById('meetdataImportPanel')){
    const panel=document.createElement('section');panel.className='qaCard';panel.id='meetdataImportPanel';
    panel.innerHTML=`<div class="taskHeader"><div><h3>Meetdata VT · vacuümimport</h3><p>Ruwe Meetdata-waarden voor Vac Gun (i227) en Vac Target (i228); geen conversie of extra grenswaarden.</p></div><span id="meetdataBadge" class="taskState">Niet geïmporteerd</span></div>
      <div id="meetdataStatus" class="noticeText">Gebruik de Meetdata-helper om de twee actuele vacuümwaarden vanaf de interne Meetdata VT-pagina mee te nemen.</div>
      <div class="actionGrid lightActions" style="margin-top:12px"><a class="actionButton" href="meetdata-helper.html?v=1" target="_blank" rel="noopener">Meetdata-helper instellen</a><button id="meetdataClear" class="actionButton" type="button">Importmarkering wissen</button></div>`;
    firstCard.insertAdjacentElement('afterend',panel);
    document.getElementById('meetdataClear')?.addEventListener('click',()=>{if(confirm('Alleen de Meetdata-importmarkering wissen? De ingevulde vacuümwaarden blijven staan.'))mdClearStore()});
  }
  ['vacuumGun','vacuumTarget'].forEach(id=>{const el=mdEl(id);if(!el||el.dataset.mdBound)return;el.dataset.mdBound='1';el.addEventListener('input',()=>mdTrackManual(id))});
}
function mdTrackManual(id){
  if(!meetdataSnapshot)return;const el=mdEl(id);if(!el)return;
  if(id==='vacuumGun')meetdataSnapshot.manualGun=String(el.value)!==String(meetdataSnapshot.gun);
  if(id==='vacuumTarget')meetdataSnapshot.manualTarget=String(el.value)!==String(meetdataSnapshot.target);
  mdSaveStore();mdRender();
}
function mdApply(snapshot){
  const sys=mdEl('systemName'),gun=mdEl('vacuumGun'),target=mdEl('vacuumTarget');if(!sys||!gun||!target)return {ok:false,error:'Wekelijkse formuliervelden konden niet worden gevonden.'};
  const existing=mdNormSystem(sys.value);
  if(existing&&existing!==snapshot.system)return {ok:false,error:`Systeemcontrole: formulier staat op ${existing}, maar Meetdata VT leverde ${snapshot.system}. Er is niets overschreven.`};
  if(!existing)sys.value=snapshot.system;
  gun.value=String(snapshot.gun);target.value=String(snapshot.target);
  gun.dispatchEvent(new Event('input',{bubbles:true}));target.dispatchEvent(new Event('input',{bubbles:true}));sys.dispatchEvent(new Event('input',{bubbles:true}));
  meetdataSnapshot=snapshot;mdSaveStore();
  try{if(typeof persist==='function')persist();if(typeof refreshAll==='function')refreshAll()}catch(e){}
  return {ok:true};
}
function mdRender(extraError=''){
  const badge=mdEl('meetdataBadge'),status=mdEl('meetdataStatus');if(!badge||!status)return;
  if(extraError){badge.textContent='Import geblokkeerd';badge.className='taskState fail';status.innerHTML='<strong>'+mdEsc(extraError)+'</strong>';return}
  if(!meetdataSnapshot){badge.textContent='Niet geïmporteerd';badge.className='taskState';status.textContent='Gebruik de Meetdata-helper om de twee actuele vacuümwaarden vanaf de interne Meetdata VT-pagina mee te nemen.';return}
  const changed=!!(meetdataSnapshot.manualGun||meetdataSnapshot.manualTarget);
  badge.textContent=changed?'Handmatig gewijzigd':'Meetdata geïmporteerd';badge.className='taskState '+(changed?'fail':'done');
  let txt=`${meetdataSnapshot.system} · ${mdFormatTime(meetdataSnapshot.capturedAt)} · Vac Gun ${mdFormat(meetdataSnapshot.gun)} · Vac Target ${mdFormat(meetdataSnapshot.target)}. Bronwaarden ongewijzigd uit Meetdata VT.`;
  if(changed){const parts=[];if(meetdataSnapshot.manualGun)parts.push('Vac Gun');if(meetdataSnapshot.manualTarget)parts.push('Vac Target');txt+=` ${parts.join(' en ')} daarna handmatig gewijzigd in het formulier.`}
  status.textContent=txt;
}
function mdRestoreMarkers(){
  if(!meetdataSnapshot)return;
  const sys=mdNormSystem(mdEl('systemName')?.value),gun=String(mdEl('vacuumGun')?.value||'').trim(),target=String(mdEl('vacuumTarget')?.value||'').trim();
  if(!sys&&!gun&&!target){meetdataSnapshot=null;mdSaveStore();return}
  mdTrackManual('vacuumGun');mdTrackManual('vacuumTarget');
}
function mdPatchCsv(){
  if(typeof downloadBlob!=='function'||downloadBlob.__meetdataWrapped)return;
  const original=downloadBlob;
  const wrapped=function(blob,name){
    if(!meetdataSnapshot||!/^linac_weekcontrole_.*\.csv$/i.test(String(name||''))){return original(blob,name)}
    blob.text().then(text=>{
      const row=(a,b,c,d)=>[a,b,c,d].map(v=>typeof csvEscape==='function'?csvEscape(v):String(v??'')).join(';');
      const status=(meetdataSnapshot.manualGun||meetdataSnapshot.manualTarget)?'Handmatig gewijzigd na import':'Automatisch geïmporteerd';
      const extra=[row('Meetdata VT','Bron systeem',meetdataSnapshot.system,''),row('Meetdata VT','Meettijd bron',meetdataSnapshot.capturedAt,''),row('Meetdata VT','Geïmporteerde Vac Gun i227',meetdataSnapshot.gun,status),row('Meetdata VT','Geïmporteerde Vac Target i228',meetdataSnapshot.target,status)];
      original(new Blob([text.replace(/\s*$/,'')+'\n'+extra.join('\n')],{type:'text/csv;charset=utf-8'}),name);
    }).catch(()=>original(blob,name));
  };
  wrapped.__meetdataWrapped=true;downloadBlob=wrapped;
}
function mdPatchNewCheck(){
  const btn=mdEl('newWeeklyCheck');if(!btn||btn.dataset.mdClearBound)return;btn.dataset.mdClearBound='1';btn.addEventListener('click',()=>{setTimeout(()=>{try{if(!localStorage.getItem('linac-weekly-qa-v12'))localStorage.removeItem(MEETDATA_STORE_KEY)}catch(e){}},0)},true);
}
function mdInit(){
  mdLoadStore();mdInstallUi();mdPatchNewCheck();mdPatchCsv();
  const incoming=mdParseHash();
  if(incoming){const v=mdValidate(incoming);if(!v.ok){mdRender(v.error);return}const a=mdApply(v.data);if(!a.ok){mdRender(a.error);return}}
  mdRestoreMarkers();mdRender();
}

mdInit();
