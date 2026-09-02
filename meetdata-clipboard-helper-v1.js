(()=>{
  if(location.hostname!=='rtmonitoring.ds.umcutrecht.nl'){alert('Open eerst Meetdata VT.');return}
  const text=document.body.innerText||'';
  const system=(text.match(/\bU\d{1,2}\b/i)||[])[0]||'';
  const gun=(text.match(/Vac\s*Gun[^\d+\-]*([-+]?\d+(?:[.,]\d+)?(?:e[-+]?\d+)?)/i)||[])[1]||'';
  const target=(text.match(/Vac\s*Targ[^\d+\-]*([-+]?\d+(?:[.,]\d+)?(?:e[-+]?\d+)?)/i)||[])[1]||'';
  if(!system||!gun||!target){alert('De zichtbare systeem-, Vac Gun- of Vac Targ-waarde kon niet worden gevonden.');return}
  const payload=JSON.stringify({source:'MeetdataVT',system:system.toUpperCase(),gun:Number(gun.replace(',','.')),target:Number(target.replace(',','.')),capturedAt:new Date().toISOString()});
  navigator.clipboard.writeText(payload).then(()=>alert('Meetdata gekopieerd. Open nu de wekelijkse QA en kies “Importeer Meetdata uit klembord”.')).catch(()=>prompt('Kopieer deze Meetdata handmatig:',payload));
})();
