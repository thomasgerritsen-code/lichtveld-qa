'use strict';
const STORE_KEY='linac-weekly-qa-v12';
const $w=id=>document.getElementById(id);
const choiceValues={};
let lightfieldSnapshot=null;

const weeklyGroups={
  geometry:['crosshair','lightfield','tableheight','lasers'],
  safety:['touchGantry','touchXviSource','touchIview','touchXviPanel','stopTable','stopHhc','roomdoorBuzzer','orangeLamp','doorInterrupt','doorContBuzzer','redTerminate'],
  technical:['sf6Pressure','waterPressure','vacuumGun','vacuumTarget'],
  xvi:['xviKvArm','xviRedLamp','hexaMovement','hexaFrame','hexaLasers']
};

function val(id){const el=$w(id);return el?String(el.value||'').trim():''}
function has(id){return val(id)!==''}
function setTaskState(task,done,fail=false){document.querySelectorAll(`[data-task-state="${task}"]`).forEach(el=>{el.textContent=done?(fail?'Afwijking':'Gereed'):'Open';el.className='taskState'+(done?(fail?' fail':' done'):'')})}
function setChoice(name,value,save=true){choiceValues[name]=value||'';const wrap=document.querySelector(`[data-choice="${name}"]`);if(wrap)wrap.querySelectorAll('button').forEach(b=>b.classList.toggle('selected',b.dataset.value===value));if(save){persist();refreshAll()}}
function getChoice(name){return choiceValues[name]||''}
function isChoiceDone(name){return !!getChoice(name)}
function isFail(name){return getChoice(name)==='niet-akkoord'}

function collectData(){
  const fields={};document.querySelectorAll('.persist').forEach(el=>{if(el.id)fields[el.id]=el.type==='checkbox'?el.checked:el.value});
  return {version:12,fields,choices:{...choiceValues},lightfield:lightfieldSnapshot,updated:new Date().toISOString()};
}
function persist(){try{localStorage.setItem(STORE_KEY,JSON.stringify(collectData()));$w('saveState').textContent='Lokaal opgeslagen · '+new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}catch(e){$w('saveState').textContent='Lokaal opslaan mislukt'}}
function restore(){try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return;const data=JSON.parse(raw);for(const[id,v]of Object.entries(data.fields||{})){const el=$w(id);if(!el)continue;if(el.type==='checkbox')el.checked=!!v;else el.value=v}Object.entries(data.choices||{}).forEach(([k,v])=>setChoice(k,v,false));lightfieldSnapshot=data.lightfield||null}catch(e){console.warn(e)}}

function initDate(){if(!val('qaDate')){const d=new Date(),p=n=>String(n).padStart(2,'0');$w('qaDate').value=`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`}}
function initPfn(){if(!localStorage.getItem(STORE_KEY)){const d=new Date();$w('pfnApplicable').checked=d.getDate()<=7}}
function togglePanels(){const pfn=$w('pfnApplicable').checked;$w('pfnControls').hidden=!pfn;const six=$w('sixWeeklyApplicable').checked;$w('sixWeeklyPanel').hidden=!six;const three=$w('threeMonthlyApplicable').checked;$w('threeMonthlyPanel').hidden=!three}

function lightfieldDone(){return !!(lightfieldSnapshot&&lightfieldSnapshot.width&&lightfieldSnapshot.height)}
function updateLightfieldSnapshot(){const card=$w('resultCard');if(!card||card.hidden)return;const read=id=>($w(id)?.textContent||'').trim();const width=read('widthOut'),height=read('heightOut');if(!width||width==='-'||!height||height==='-')return;lightfieldSnapshot={width,height,left:read('leftOut'),right:read('rightOut'),top:read('topOut'),bottom:read('bottomOut'),cx:read('cxOut'),cy:read('cyOut'),status:read('statusBadge'),captured:new Date().toISOString()};persist();refreshAll()}
function restoreLightfieldDisplay(){if(!lightfieldSnapshot)return;const map={widthOut:'width',heightOut:'height',leftOut:'left',rightOut:'right',topOut:'top',bottomOut:'bottom',cxOut:'cx',cyOut:'cy'};for(const[id,k]of Object.entries(map)){if($w(id))$w(id).textContent=lightfieldSnapshot[k]||'-'}if($w('statusBadge')){$w('statusBadge').textContent=lightfieldSnapshot.status||'OPGESLAGEN';$w('statusBadge').className='badge neutral'}$w('resultCard').hidden=false}

function completion(){
  const admin=['systemName','qaDate','initials1','initials2'];
  const adminDone=admin.filter(has).length;
  const cross=has('crosshairIso');
  const table=has('tableIntegrity')&&has('tableRuler');
  const geo={crosshair:cross,lightfield:lightfieldDone(),tableheight:table,lasers:isChoiceDone('lasers')};
  const technical={sf6Pressure:has('sf6Pressure'),waterPressure:has('waterPressure'),vacuumGun:has('vacuumGun'),vacuumTarget:has('vacuumTarget')};
  const safety=Object.fromEntries(weeklyGroups.safety.map(k=>[k,isChoiceDone(k)]));
  const xvi=Object.fromEntries(weeklyGroups.xvi.map(k=>[k,isChoiceDone(k)]));
  const pfnRequired=$w('pfnApplicable').checked; if(pfnRequired)technical.pfnLeak=isChoiceDone('pfnLeak');
  const sixRequired=$w('sixWeeklyApplicable').checked; const sixInputs=[...document.querySelectorAll('.periodicInput[data-periodic="six"]')]; const sixDone=!sixRequired||sixInputs.every(el=>String(el.value).trim()!=='');
  const threeRequired=$w('threeMonthlyApplicable').checked; const threeInputs=[...document.querySelectorAll('.periodicInput[data-periodic="three"]')]; const threeDone=!threeRequired||threeInputs.every(el=>String(el.value).trim()!=='');
  const allEntries=[...admin.map(id=>({label:document.querySelector(`#${id}`)?.dataset.label||id,done:has(id)})),
    {label:'Kruisdraadrotatie / Isocentrum',done:geo.crosshair},{label:'Lichtveld 10 × 10',done:geo.lightfield,fail:geo.lightfield&&/BUITEN/i.test(lightfieldSnapshot?.status||'')},{label:'Uitlezing tafelhoogte',done:geo.tableheight},{label:'Lasers overeenkomst',done:geo.lasers},
    ...weeklyGroups.safety.map(k=>({label:labelForChoice(k),done:safety[k],fail:isFail(k)})),
    ...weeklyGroups.technical.map(k=>({label:labelForField(k),done:technical[k]})),
    ...weeklyGroups.xvi.map(k=>({label:labelForChoice(k),done:xvi[k],fail:isFail(k)}))];
  if(pfnRequired)allEntries.push({label:'PFN lekkage',done:technical.pfnLeak,fail:isFail('pfnLeak')});
  if(sixRequired)allEntries.push({label:'Servo instellingen 6-wekelijks',done:sixDone});
  if(threeRequired)allEntries.push({label:'Gantrymovie KFM 3-maandelijks',done:threeDone});
  const done=allEntries.filter(x=>x.done).length,total=allEntries.length,fail=allEntries.some(x=>x.fail)||Object.keys(choiceValues).some(isFail);
  return {adminDone,geo,technical,safety,xvi,allEntries,done,total,fail,sixRequired,sixDone,threeRequired,threeDone};
}

const choiceLabels={lasers:'Lasers overeenkomst',touchGantry:'Touchguard Gantry',touchXviSource:'Touchguard XVI source',touchIview:'Touchguard iView panel',touchXviPanel:'Touchguard XVI panel',stopTable:'Stopknoppen tafel',stopHhc:'Stopknoppen HHC',roomdoorBuzzer:'Roomdoors 2 zoemer',orangeLamp:'Oranje lamp bunker',doorInterrupt:'Deur lamp Interrupt',doorContBuzzer:'Zoemer Deur cont.',redTerminate:'Rode lamp Terminate',xviKvArm:'XVI KV arm',xviRedLamp:'XVI rode lamp',hexaMovement:'HexaPOD bew. intl.',hexaFrame:'HexaPOD frame',hexaLasers:'HexaPOD lasers',pfnLeak:'PFN lekkage'};
const fieldLabels={sf6Pressure:'SF₆ druk',waterPressure:'Water druk',vacuumGun:'Vacuüm Gun i227',vacuumTarget:'Vacuüm Target i228'};
function labelForChoice(k){return choiceLabels[k]||k}function labelForField(k){return fieldLabels[k]||k}

function refreshAll(){togglePanels();const c=completion();
  setTaskState('crosshair',c.geo.crosshair);setTaskState('tableheight',c.geo.tableheight);setTaskState('lasers',c.geo.lasers,isFail('lasers'));
  const lf=$w('lightfieldTaskState');lf.textContent=c.geo.lightfield?'Gereed':'Open';lf.className='taskState'+(c.geo.lightfield?' done':'');
  const pct=c.total?Math.round(c.done/c.total*100):0;$w('progressBar').style.width=pct+'%';$w('progressText').textContent=`${c.done} van ${c.total} controles afgerond`;
  const state=$w('overallState'),sum=$w('summaryBadge');if(c.fail){state.textContent='AANDACHTSPUNT';state.className='overallBadge fail';sum.textContent='AANDACHTSPUNT';sum.className='overallBadge fail'}else if(c.done===c.total&&c.total){state.textContent='VOLLEDIG';state.className='overallBadge pass';sum.textContent='VOLLEDIG';sum.className='overallBadge pass'}else{state.textContent=pct?'IN UITVOERING':'NOG NIET GESTART';state.className='overallBadge neutral';sum.textContent='ONVOLLEDIG';sum.className='overallBadge neutral'}
  $w('tileGeometry').textContent=`${Object.values(c.geo).filter(Boolean).length} / 4`;
  $w('tileSafety').textContent=`${Object.values(c.safety).filter(Boolean).length} / ${weeklyGroups.safety.length}`;
  const techTotal=weeklyGroups.technical.length+($w('pfnApplicable').checked?1:0);const techDone=weeklyGroups.technical.filter(k=>c.technical[k]).length+($w('pfnApplicable').checked&&c.technical.pfnLeak?1:0);$w('tileTechnical').textContent=`${techDone} / ${techTotal}`;
  $w('tileXvi').textContent=`${Object.values(c.xvi).filter(Boolean).length} / ${weeklyGroups.xvi.length}`;
  const periodicBits=[];if(c.sixRequired)periodicBits.push('6w '+(c.sixDone?'✓':'open'));if(c.threeRequired)periodicBits.push('3m '+(c.threeDone?'✓':'open'));$w('tilePeriodic').textContent=periodicBits.length?periodicBits.join(' · '):'optioneel';
  const open=c.allEntries.filter(x=>!x.done||x.fail);$w('openItems').innerHTML=open.length?open.map(x=>`<div class="openItem${x.fail?' fail':''}">${x.fail?'Afwijking: ':'Open: '}${escapeHtml(x.label)}</div>`).join(''):'<div class="openItem">Alle verplichte onderdelen zijn ingevuld.</div>';
  $w('summaryText').textContent=c.fail?'Er zijn één of meer controles als niet akkoord gemarkeerd.':c.done===c.total?'Alle verplichte controles zijn afgerond.':'Nog niet alle verplichte controles zijn afgerond.';
}
function escapeHtml(s){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}

function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s}
function exportWeeklyCsv(){const rows=[['Sectie','Controle','Waarde','Status']];
  rows.push(['Administratie','Systeem',val('systemName'),''],['Administratie','Datum',val('qaDate'),''],['Administratie','Initialen 1',val('initials1'),''],['Administratie','Initialen 2',val('initials2'),'']);
  rows.push(['Geometrie','Kruisdraadrotatie Isocentrum [mm]',val('crosshairIso'),'']);
  if(lightfieldSnapshot){for(const[k,label]of [['width','Veldbreedte A-B'],['height','Veldhoogte G-T'],['left','A x1'],['right','B x2'],['top','G y1'],['bottom','T y2'],['cx','Isocentrum X'],['cy','Isocentrum Y']])rows.push(['Lichtveld 10x10',label,lightfieldSnapshot[k]||'','']);rows.push(['Lichtveld 10x10','Softwarestatus','',lightfieldSnapshot.status||''])}
  rows.push(['Geometrie','Integrity i146 [cm]',val('tableIntegrity'),''],['Geometrie','Licht liniaal [cm]',val('tableRuler'),''],['Geometrie','Lasers overeenkomst','',getChoice('lasers')]);
  for(const k of weeklyGroups.safety)rows.push(['Veiligheid',labelForChoice(k),'',getChoice(k)]);for(const k of weeklyGroups.technical)rows.push(['Technische waarden',labelForField(k),val(k),'']);if($w('pfnApplicable').checked)rows.push(['Technische waarden','PFN lekkage','',getChoice('pfnLeak')]);for(const k of weeklyGroups.xvi)rows.push(['XVI / HexaPOD',labelForChoice(k),'',getChoice(k)]);
  if($w('sixWeeklyApplicable').checked){document.querySelectorAll('.periodicInput[data-periodic="six"]').forEach(el=>rows.push(['6-wekelijks',el.id,el.value,'']))}if($w('threeMonthlyApplicable').checked){document.querySelectorAll('.periodicInput[data-periodic="three"]').forEach(el=>rows.push(['3-maandelijks',el.id,el.value,'']))}
  rows.push(['Opmerkingen','Extra',val('comments'),'']);const csv='\ufeff'+rows.map(r=>r.map(csvEscape).join(';')).join('\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`linac_weekcontrole_${val('systemName')||'systeem'}_${val('qaDate')||'datum'}.csv`)}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function newCheck(){if(!confirm('Nieuwe wekelijkse controle starten? Alle lokaal opgeslagen formuliergegevens van deze controle worden gewist.'))return;localStorage.removeItem(STORE_KEY);location.reload()}

function bind(){
  document.querySelectorAll('.persist').forEach(el=>el.addEventListener(el.type==='checkbox'?'change':'input',()=>{persist();refreshAll()}));
  document.querySelectorAll('.persistChoice').forEach(wrap=>wrap.querySelectorAll('button').forEach(btn=>btn.addEventListener('click',()=>setChoice(wrap.dataset.choice,btn.dataset.value))));
  $w('exportWeeklyCsv').addEventListener('click',exportWeeklyCsv);$w('printReport').addEventListener('click',()=>window.print());$w('newWeeklyCheck').addEventListener('click',newCheck);
  const result=$w('resultCard');if(result){new MutationObserver(()=>{if(!result.hidden)updateLightfieldSnapshot()}).observe(result,{attributes:true,attributeFilter:['hidden'],subtree:true,childList:true,characterData:true});['widthOut','heightOut','leftOut','rightOut','topOut','bottomOut','cxOut','cyOut','statusBadge'].forEach(id=>{const el=$w(id);if(el)new MutationObserver(updateLightfieldSnapshot).observe(el,{subtree:true,childList:true,characterData:true})})}
}

restore();initDate();initPfn();bind();togglePanels();restoreLightfieldDisplay();refreshAll();persist();