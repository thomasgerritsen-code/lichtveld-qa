(()=>{
  const MEETDATA_ORIGIN='https://rtmonitoring.ds.umcutrecht.nl';
  const QA_ORIGIN='https://thomasgerritsen-code.github.io';
  const QA_URL=QA_ORIGIN+'/lichtveld-qa/wekelijkse-linac.html?v=4&meetdataBridge=1';
  if(location.origin!==MEETDATA_ORIGIN){alert('Open eerst Meetdata VT.');return}

  const last=localStorage.getItem('linacQaLastSystem')||'';
  const wanted=String(prompt('Welk Linac-systeem?',last||'U11')||'').trim().toUpperCase();
  if(!/^U\d{1,2}$/.test(wanted)){alert('Gebruik bijvoorbeeld U7 of U11.');return}
  localStorage.setItem('linacQaLastSystem',wanted);

  const qa=window.open(QA_URL,'linacWeeklyQA');
  if(!qa){alert('De wekelijkse QA kon niet worden geopend. Sta pop-ups voor Meetdata VT toe en probeer opnieuw.');return}

  let qaReady=false,finished=false;
  const values={gun:null,target:null};
  let capturedAt=null;

  function sourceTime(raw){
    const n=Number(raw);if(!Number.isFinite(n))return null;
    const ms=n>1e12?n:n>1e9?n*1000:null;
    if(!ms)return null;const d=new Date(ms);return Number.isNaN(d.getTime())?null:d.toISOString();
  }
  function inspect(text){
    if(finished||!text||(!text.includes('gun_vacuum')&&!text.includes('target_vacuum')))return;
    let doc;try{doc=new DOMParser().parseFromString('<root>'+text+'</root>','text/xml')}catch(e){return}
    if(doc.querySelector('parsererror'))return;
    for(const block of doc.getElementsByTagName('dndp')){
      const dn=String(block.getElementsByTagName('dn')[0]?.textContent||'').replace(/-monitor$/i,'').trim().toUpperCase();
      if(dn!==wanted)continue;
      for(const gdp of block.getElementsByTagName('gdp')){
        const names=[...gdp.getElementsByTagName('n')].map(n=>String(n.textContent||'').trim().toLowerCase());
        const kind=names.includes('gun_vacuum')?'gun':names.includes('target_vacuum')?'target':'';
        if(!kind)continue;
        const raw=String(gdp.getElementsByTagName('v')[0]?.textContent||'').trim().replace(',','.');
        const value=Number(raw);if(!Number.isFinite(value))continue;
        values[kind]=value;
        const t=sourceTime(String(gdp.getElementsByTagName('d')[0]?.textContent||'').trim());if(t)capturedAt=t;
      }
    }
    trySend();
  }
  function payload(){return {source:'MeetdataVT',system:wanted,gun:values.gun,target:values.target,capturedAt:capturedAt||new Date().toISOString()}}
  function trySend(){
    if(finished||!qaReady||!Number.isFinite(values.gun)||!Number.isFinite(values.target))return;
    qa.postMessage({type:'LinacMeetdataV2',data:payload()},QA_ORIGIN);
  }
  function sendError(message){try{qa.postMessage({type:'LinacMeetdataV2Error',message},QA_ORIGIN)}catch(e){}}
  function onMessage(ev){
    if(ev.origin!==QA_ORIGIN||ev.source!==qa||!ev.data)return;
    if(ev.data.type==='LinacQaReadyV2'){qaReady=true;trySend()}
    if(ev.data.type==='LinacQaImportedV2'){finished=true;window.removeEventListener('message',onMessage);try{qa.focus()}catch(e){}}
  }
  window.addEventListener('message',onMessage);

  if(!window.__linacQaXhrHookV2){
    window.__linacQaXhrHookV2=true;
    const open=XMLHttpRequest.prototype.open,send=XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open=function(method,url){this.__linacQaUrl=String(url||'');return open.apply(this,arguments)};
    XMLHttpRequest.prototype.send=function(){
      if(String(this.__linacQaUrl||'').includes('commands4.asp'))this.addEventListener('load',()=>{try{inspect(this.responseText)}catch(e){}});
      return send.apply(this,arguments)
    };
    if(window.fetch){const originalFetch=window.fetch;window.fetch=function(){const p=originalFetch.apply(this,arguments);try{const u=String(arguments[0]?.url||arguments[0]||'');if(u.includes('commands4.asp'))p.then(r=>r.clone().text()).then(inspect).catch(()=>{})}catch(e){}return p}}
  }

  setTimeout(()=>{if(!finished&&(!Number.isFinite(values.gun)||!Number.isFinite(values.target)))sendError('Nog geen Vac Gun / Vac Target ontvangen voor '+wanted+'. Laat Meetdata VT nog even open; de helper wacht op de volgende dashboard-update.')},15000);
  setTimeout(()=>{if(!finished&&(!Number.isFinite(values.gun)||!Number.isFinite(values.target)))sendError('Geen actuele vacuümwaarden ontvangen voor '+wanted+'. Vernieuw Meetdata VT en klik daarna opnieuw op de favoriet.')},45000);
})();
