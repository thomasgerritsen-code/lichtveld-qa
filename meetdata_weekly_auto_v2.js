'use strict';

// Directe Meetdata VT -> wekelijkse Linac QA overdracht.
// De Meetdata-favoriet zet uitsluitend systeem + ruwe Vac Gun / Vac Targ waarden
// in het URL-fragment. Een fragment wordt niet naar de webserver meegestuurd.
// Na verwerken wordt het fragment direct uit de adresbalk verwijderd.
(()=>{
  const PREFIX='#meetdata=';

  function clearTransferFragment(){
    try{
      if(!location.hash.startsWith(PREFIX))return;
      const u=new URL(location.href);
      u.hash='';
      history.replaceState(null,'',u.pathname+(u.search||''));
    }catch(e){console.warn('Meetdata overdracht kon niet uit de URL worden verwijderd',e)}
  }

  function showTransferError(message){
    try{
      if(typeof mdRender==='function')mdRender(message);
      const status=document.getElementById('meetdataStatus');
      if(status)status.textContent=message;
    }catch(e){console.warn(e)}
  }

  function importFromFragment(){
    if(!location.hash.startsWith(PREFIX))return false;
    let parsed=null;
    try{
      const raw=decodeURIComponent(location.hash.slice(PREFIX.length));
      parsed=JSON.parse(raw);
    }catch(e){
      clearTransferFragment();
      showTransferError('De automatische Meetdata-overdracht kon niet worden gelezen. Gebruik zo nodig “Meetdata importeren”.');
      return false;
    }

    clearTransferFragment();
    if(typeof mdValidate!=='function'||typeof mdApply!=='function'){
      showTransferError('De Meetdata-importmodule is niet beschikbaar. Herlaad de wekelijkse controle.');
      return false;
    }

    const validated=mdValidate(parsed);
    if(!validated.ok){showTransferError(validated.error);return false}
    const applied=mdApply(validated.data);
    if(!applied.ok){showTransferError(applied.error);return false}

    if(typeof mdRender==='function')mdRender();
    const status=document.getElementById('meetdataStatus');
    if(status)status.textContent=`${validated.data.system} · Vac Gun ${validated.data.gun} · Vac Target ${validated.data.target} automatisch uit Meetdata VT overgenomen.`;
    return true;
  }

  importFromFragment();
})();
