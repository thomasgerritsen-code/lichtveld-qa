const BASE_STAGES=Object.freeze([
  {id:'gun',label:'Electron gun',parts:['gun'],cause:'Electronenbron',effect:'Start van de transportketen.'},
  {id:'rf',label:'RF / acceleration',parts:['magnetron','waveguide'],cause:'RF voedt de travelling-wave structuur',effect:'Bepaalt de genormaliseerde acceleratorrespons.'},
  {id:'focus1',label:'Focus 1',parts:['focus1'],cause:'Eerste focusering',effect:'Comprimeert de upstream beamenvelop.'},
  {id:'steer1',label:'1R / 1T',parts:['steer1'],cause:'Primary steering',effect:'Centreert de bundel vóór de tweede focussectie.'},
  {id:'focus2',label:'Focus 2',parts:['focus2'],cause:'Tweede focusering',effect:'Comprimeert de al verkleinde downstream envelop verder.'},
  {id:'steer2',label:'2R / 2T',parts:['steer2'],cause:'Secondary steering',effect:'Stuurt de downstream trajectory richting bending en head.'},
  {id:'bend',label:'Slalom / flight tube',parts:['slalom','flightTube'],cause:'M1 → M2 → M3',effect:'Buigt de elektronenbundel naar de treatment head.'},
  {id:'formation',label:'Beam formation',parts:[],cause:'Mode-afhankelijke beam formation',effect:'Wordt per Photon/Electron-mode ingevuld.'},
  {id:'monitor',label:'Monitor chamber',parts:['monitor'],cause:'Beam monitoring',effect:'Volgt genormaliseerde output en uniformiteit vóór collimatie.'},
  {id:'shaping',label:'Beam shaping',parts:[],cause:'Mode-afhankelijke veldvorming',effect:'Wordt per Photon/Electron-mode ingevuld.'},
  {id:'patient',label:'Isocentre / patiënt',parts:['patient'],cause:'Geprojecteerd behandelveld',effect:'Laat de downstream consequentie op het patiëntvlak zien.'}
]);

export function resolveGoldenPath(mode='photon',filter='ff'){
  return BASE_STAGES.map(stage=>{
    if(stage.id==='formation'){
      return mode==='electron'
        ? {...stage,label:'Electron window + foils',parts:['window','head'],cause:'Electron window → scattering foils',effect:'Verbreedt de electron pencil beam vóór monitoring.'}
        : {...stage,label:`Target + ${String(filter).toUpperCase()}`,parts:['target','filter','head'],cause:'Target → bremsstrahlung → filtering',effect:filter==='fff'?'FFF behoudt een centraler gepiekt profiel.':'FF maakt het centrale photonprofiel relatief vlakker.'};
    }
    if(stage.id==='shaping'){
      return mode==='electron'
        ? {...stage,label:'Electron applicator',parts:['applicator'],cause:'Electron field definition',effect:'Applicator/field opening bepaalt de electron-field footprint.'}
        : {...stage,label:'Agility + diaphragms',parts:['mlc','jaws'],cause:'MLC + sculpted diaphragms',effect:'Vormen het photonveld vóór projectie naar isocentre.'};
    }
    return {...stage};
  });
}

function stageMarkup(stage,index,total){
  return `<button type="button" class="goldenPathStep" data-golden-stage="${stage.id}" aria-label="Stap ${index+1} van ${total}: ${stage.label}"><span>${index+1}</span><b>${stage.label}</b><small>${stage.cause}</small></button>`;
}

function firstPartElement(parts){
  for(const part of parts){
    const element=document.querySelector(`.component[data-part="${part}"]`);
    if(element)return element;
  }
  return null;
}

export function initGoldenPath(controller){
  const hero=document.querySelector('.hero');
  const viewer=document.querySelector('.panelCard');
  if(!hero||!viewer||!controller?.store)return null;

  const panel=document.createElement('section');
  panel.className='goldenPathPanel';
  panel.setAttribute('aria-label','Golden path door de LINAC');
  panel.innerHTML=`<div class="goldenPathHead"><div><span>Golden path</span><strong>Volg de bundel stap voor stap</strong></div><div class="goldenPathActions"><button type="button" data-golden-prev aria-label="Vorige stap">←</button><button type="button" data-golden-next aria-label="Volgende stap">→</button></div></div><div class="goldenPathSteps" role="list"></div><div class="goldenPathExplanation" aria-live="polite"><strong></strong><span></span></div>`;
  hero.insertAdjacentElement('afterend',panel);

  const stepsHost=panel.querySelector('.goldenPathSteps');
  const explanation=panel.querySelector('.goldenPathExplanation');
  let activeIndex=0;
  let renderedKey='';
  let stages=[];

  function clearHighlights(){
    document.querySelectorAll('.goldenPathActive,.goldenPathDownstream').forEach(el=>{
      el.classList.remove('goldenPathActive','goldenPathDownstream');
    });
  }

  function highlightStage(index,{scroll=false}={}){
    if(!stages.length)return;
    activeIndex=Math.max(0,Math.min(stages.length-1,index));
    const stage=stages[activeIndex];
    clearHighlights();
    panel.querySelectorAll('.goldenPathStep').forEach((button,i)=>{
      button.classList.toggle('active',i===activeIndex);
      button.setAttribute('aria-current',i===activeIndex?'step':'false');
    });

    for(const part of stage.parts){
      document.querySelectorAll(`.component[data-part="${part}"]`).forEach(el=>el.classList.add('goldenPathActive'));
    }
    for(const later of stages.slice(activeIndex+1)){
      for(const part of later.parts){
        document.querySelectorAll(`.component[data-part="${part}"]`).forEach(el=>el.classList.add('goldenPathDownstream'));
      }
    }

    explanation.querySelector('strong').textContent=`${activeIndex+1}/${stages.length} · ${stage.label}`;
    explanation.querySelector('span').textContent=`${stage.cause} → ${stage.effect}`;

    const component=firstPartElement(stage.parts);
    component?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    panel.querySelector(`[data-golden-stage="${stage.id}"]`)?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
    if(scroll&&window.matchMedia('(max-width:700px)').matches){
      viewer.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }

  function renderStages(){
    const state=controller.store.getState();
    const mode=state.machine.mode;
    const filter=state.machine.filter;
    const key=`${mode}:${filter}`;
    if(key===renderedKey)return;
    renderedKey=key;
    const currentId=stages[activeIndex]?.id;
    stages=resolveGoldenPath(mode,filter);
    stepsHost.innerHTML=stages.map((stage,index)=>stageMarkup(stage,index,stages.length)).join('');
    const nextIndex=Math.max(0,stages.findIndex(stage=>stage.id===currentId));
    highlightStage(nextIndex<0?0:nextIndex);
  }

  panel.addEventListener('click',event=>{
    const step=event.target.closest('[data-golden-stage]');
    if(step){
      const index=stages.findIndex(stage=>stage.id===step.dataset.goldenStage);
      highlightStage(index,{scroll:true});
      return;
    }
    if(event.target.closest('[data-golden-prev]'))highlightStage(activeIndex-1,{scroll:true});
    if(event.target.closest('[data-golden-next]'))highlightStage(activeIndex+1,{scroll:true});
  });

  renderStages();
  const unsubscribe=controller.store.subscribe(renderStages);
  return {destroy(){unsubscribe?.();clearHighlights();panel.remove();},getStages:()=>stages.slice(),select:index=>highlightStage(index)};
}
