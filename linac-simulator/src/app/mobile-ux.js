function scrollToSection(element){
  element?.scrollIntoView({behavior:'smooth',block:'start'});
}

export function initMobileUx(){
  const query=window.matchMedia('(max-width:700px)');
  const toolbar=document.querySelector('.simToolbar');
  const consolePanel=document.querySelector('.integrityConsole');
  const controls=document.querySelector('.controls');
  const viewer=document.querySelector('.panelCard');
  const viewport=document.querySelector('#machineViewport');
  const fitBtn=document.querySelector('#fitBtn');

  if(!toolbar||!consolePanel||!controls||!viewer||!viewport||!fitBtn)return;

  const nav=document.createElement('nav');
  nav.className='mobileQuickNav';
  nav.setAttribute('aria-label','Mobiele simulatornavigatie');
  nav.innerHTML='<button type="button" data-mobile-target="console">Console</button><button type="button" data-mobile-target="controls">Instellingen</button><button type="button" data-mobile-target="machine">Machine</button>';
  toolbar.insertAdjacentElement('afterend',nav);

  const hint=document.createElement('div');
  hint.className='mobileViewerHint';
  hint.textContent='Mobiel: veeg horizontaal voor detail. Gebruik Overzicht om de volledige machine in één beeld te zien.';
  viewport.insertAdjacentElement('beforebegin',hint);

  function setViewerMode(fit){
    viewport.classList.toggle('mobileFit',fit);
    fitBtn.setAttribute('aria-pressed',String(fit));
    fitBtn.textContent=fit?'Detail':'Overzicht';
    if(fit)viewport.scrollTo({left:0,top:0,behavior:'smooth'});
  }

  function applyResponsiveState(){
    document.documentElement.classList.toggle('mobileSimulator',query.matches);
    nav.hidden=!query.matches;
    hint.hidden=!query.matches;
    if(query.matches){
      setViewerMode(false);
      fitBtn.hidden=false;
    }else{
      viewport.classList.remove('mobileFit');
      fitBtn.removeAttribute('aria-pressed');
      fitBtn.textContent='Pas in beeld';
      fitBtn.hidden=false;
    }
  }

  nav.addEventListener('click',event=>{
    const button=event.target.closest('[data-mobile-target]');
    if(!button)return;
    const targets={console:consolePanel,controls,machine:viewer};
    scrollToSection(targets[button.dataset.mobileTarget]);
  });

  fitBtn.onclick=()=>{
    if(!query.matches){
      viewport.scrollTo({left:0,top:0,behavior:'smooth'});
      return;
    }
    setViewerMode(!viewport.classList.contains('mobileFit'));
  };

  if(query.addEventListener)query.addEventListener('change',applyResponsiveState);
  else query.addListener(applyResponsiveState);

  applyResponsiveState();
}
