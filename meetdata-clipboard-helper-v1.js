(()=>{
  if(location.hostname!=='rtmonitoring.ds.umcutrecht.nl'){alert('Open eerst Meetdata VT.');return}
  const wanted=String(prompt('Welk Linac-systeem wil je overnemen? Bijvoorbeeld U11.','')||'').trim().toUpperCase();
  if(!/^U\d{1,2}$/.test(wanted)){alert('Geen geldig systeem opgegeven. Gebruik bijvoorbeeld U7 of U11.');return}
  const text=String(document.body.innerText||'').replace(/\r/g,'');
  const systems=[];const re=/\bU\d{1,2}(?:-monitor)?\b/ig;let m;
  while((m=re.exec(text)))systems.push({system:m[0].replace(/-monitor$/i,'').toUpperCase(),index:m.index});
  let segment='';
  for(let i=0;i<systems.length;i++){
    if(systems[i].system!==wanted)continue;
    let end=Math.min(text.length,systems[i].index+5000);
    for(let j=i+1;j<systems.length;j++){if(systems[j].system!==wanted){end=systems[j].index;break}}
    const s=text.slice(systems[i].index,end);
    if(/Vac\s*Gun/i.test(s)&&/Vac\s*Targ/i.test(s)){segment=s;break}
  }
  if(!segment){alert('Voor '+wanted+' kon geen zichtbaar blok met Vac Gun en Vac Targ worden gevonden. Zorg dat de waarden in Meetdata VT zichtbaar zijn.');return}
  const value='([-+]?\\d+[.,]\\d+(?:e[-+]?\\d+)?|[-+]?\\d+(?:e[-+]?\\d+))';
  const gm=segment.match(new RegExp('Vac\\s*Gun[\\s\\S]{0,180}?'+value,'i'));
  const tm=segment.match(new RegExp('Vac\\s*Targ[\\s\\S]{0,180}?'+value,'i'));
  if(!gm||!tm){alert('De zichtbare Vac Gun- of Vac Targ-waarde kon niet betrouwbaar worden gelezen voor '+wanted+'.');return}
  const gun=Number(gm[1].replace(',','.')),target=Number(tm[1].replace(',','.'));
  if(!Number.isFinite(gun)||!Number.isFinite(target)){alert('De gevonden vacuümwaarden zijn niet numeriek.');return}
  const check=confirm(wanted+' gevonden:\nVac Gun: '+gun+'\nVac Targ: '+target+'\n\nDeze twee waarden naar het klembord kopiëren?');
  if(!check)return;
  const payload=JSON.stringify({source:'MeetdataVT',system:wanted,gun,target,capturedAt:new Date().toISOString()});
  navigator.clipboard.writeText(payload).then(()=>alert('Meetdata gekopieerd. Open nu de wekelijkse QA en kies “Importeer Meetdata uit klembord”.')).catch(()=>prompt('Kopieer deze Meetdata handmatig:',payload));
})();
