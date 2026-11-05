// Reuse the existing live controls and readouts: no duplicate IDs or state.
export function initOverviewLayout(){
  const controls=document.querySelector('.controls');
  const viewer=document.querySelector('.layout > section');
  const machine=viewer?.querySelector('.panelCard');
  const consolePanel=document.querySelector('.integrityConsole');
  if(!controls||!viewer||!machine||!consolePanel)return;
  document.body.classList.add('overviewPage');
  machine.id='machineOverview';
  machine.classList.add('machineOverview');
  const title=document.createElement('h2');title.className='settingsHeading';title.textContent='Instellingen';
  controls.prepend(title,consolePanel);
  for(const detail of controls.querySelectorAll('details'))detail.open=false;
  const model=document.querySelector('.modelNote');
  if(model){const d=document.createElement('details');d.innerHTML='<summary>Over dit onderwijsmodel</summary>';model.before(d);d.append(model);}

  const actions=document.createElement('div');actions.className='overviewActions';
  actions.setAttribute('aria-label','Bundelbediening');
  actions.append(document.querySelector('.consolePowerBlock'));
  const mode=document.createElement('div');mode.className='overviewMode';
  const label=document.createElement('span');label.textContent='Stralingsmodus';mode.append(label);
  mode.append(document.querySelector('#photonBtn').parentElement,document.querySelector('#ffWrap'));
  actions.append(mode);
  const beamState=document.querySelector('#beamStateText').closest('.consoleState');
  beamState.classList.add('overviewBeamState');
  machine.querySelector('.viewerHead').insertBefore(beamState,document.querySelector('#fitBtn'));
  machine.querySelector('.viewerHead').after(actions);

  const summary=document.createElement('div');summary.className='overviewReadouts';
  summary.setAttribute('aria-label','Actuele bundelstatus');
  for(const id of ['modeOut','fieldOut','doseRateOut','impactOut'])summary.append(document.getElementById(id).closest('.stat'));
  actions.after(summary);
  document.querySelector('#machineSvg').setAttribute('viewBox','0 155 1500 965');
  const info=document.querySelector('.info');machine.append(info);

  function fold(element,label){
    const d=document.createElement('details');d.className='overviewDetail';
    const s=document.createElement('summary');s.textContent=label;d.append(s);
    element.before(d);d.append(element);return d;
  }
  const path=document.querySelector('.goldenPathPanel');
  if(path){const d=fold(path,'Volg de bundel stap voor stap');machine.after(d);}
  // Keep all measurements available while showing only the primary view first.
  for(const card of [...viewer.querySelectorAll(':scope > .panelCard')]){
    if(card===machine)continue;
    const label=card.querySelector('.metricsHead strong')?.textContent||'Meer bundelgegevens';
    fold(card,label);
  }
  // The enlarged machine view starts fully fitted on touch screens.
  if(window.matchMedia('(max-width:700px)').matches){
    document.querySelector('#machineViewport').classList.add('mobileFit');
    const fit=document.querySelector('#fitBtn');fit.textContent='Detail';fit.setAttribute('aria-pressed','true');
  }
  document.querySelector('.viewerHead strong').textContent='De versneller in één overzicht';
  document.querySelector('.viewerHead span').textContent='Klik op een onderdeel voor uitleg';
}
