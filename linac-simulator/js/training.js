const SCENARIOS={
  radial:{
    label:'Radiale bronhoekfout',
    description:'Er is een verborgen radiale positie/hoekfout vóór Focus 1. Centreer positie én hoek aan de target met 1R en 2R.',
    hint:'Gebruik 1R en 2R als twee afzonderlijke correctoren: één enkele corrector kan in het algemeen niet tegelijk positie én hoek nul maken.',
    controls:['r1','r2'],
    disturbance:{radial:{x:.012,xp:.026}}
  },
  transverse:{
    label:'Transverse bronfout',
    description:'Er is een verborgen transverse fout vóór Focus 1. Corrigeer T en T′ met 1T en 2T.',
    hint:'Werk met 1T en 2T en kijk niet alleen naar positie T, maar ook naar de lokale hoek T′.',
    controls:['t1','t2'],
    disturbance:{transverse:{x:-.018,xp:.022}}
  },
  bending:{
    label:'Bending mismatch',
    description:'De nominale bending-array heeft een verborgen coarse/fine-offset. Breng target impact en achromatie terug richting nominale toestand.',
    hint:'Coarse beïnvloedt de complete M1/M2/M3-array; Fine is in dit model de extra M3-trim. Gebruik beide om de resterende targetfout te verkleinen.',
    controls:['coarse','fine'],
    disturbance:{coarseBias:.22,fineBias:-.15,energyOffset:.035}
  }
};

function scoreFor(scenario,sim){
  if(!scenario)return 100;
  const t=sim.target;
  let e=0;
  if(scenario==='radial')e=Math.hypot(t.r*2.5,t.rp*1.5);
  else if(scenario==='transverse')e=Math.hypot(t.t*2.5,t.tp*1.5);
  else e=Math.hypot(t.r*2,t.rp*1.2,sim.mismatch*.45,(t.disp*sim.target?.d||0));
  return Math.max(0,Math.min(100,Math.round(100-e*900)));
}

export function initTraining({controls,onChange}){
  const host=document.querySelector('.controls');
  const note=document.querySelector('.modelNote');
  const panel=document.createElement('details');
  panel.className='trainingPanel';panel.open=true;
  panel.innerHTML=`<summary>Training mode</summary><div class="trainingBody">
    <label class="trainingSelectLabel">Oefening<select id="trainingScenario"><option value="">Uit</option>${Object.entries(SCENARIOS).map(([k,s])=>`<option value="${k}">${s.label}</option>`).join('')}</select></label>
    <p id="trainingDescription">Kies een oefening. Alle waarden blijven dimensieloos en zijn uitsluitend educatief.</p>
    <div class="trainingScore"><span>Score</span><strong id="trainingScore">—</strong><div class="scoreTrack"><i id="scoreBar"></i></div></div>
    <div class="trainingActions"><button id="trainingReset" type="button">Start opnieuw</button><button id="trainingHint" type="button">Hint</button></div>
    <p id="trainingHintText" class="trainingHint" hidden></p>
  </div>`;
  host.insertBefore(panel,note);

  let active='';
  const select=panel.querySelector('#trainingScenario');
  const desc=panel.querySelector('#trainingDescription');
  const scoreEl=panel.querySelector('#trainingScore');
  const bar=panel.querySelector('#scoreBar');
  const hint=panel.querySelector('#trainingHintText');

  function clearHighlights(){document.querySelectorAll('.controlBody label.trainingTarget').forEach(l=>l.classList.remove('trainingTarget'));}
  function highlightControls(){
    clearHighlights();if(!active)return;
    for(const id of SCENARIOS[active].controls){const input=controls[id];input?.closest('label')?.classList.add('trainingTarget');}
  }
  function neutralizeTargets(){
    if(!active)return;
    for(const id of SCENARIOS[active].controls)controls[id].value=0;
  }
  function applyScenario(resetControls=true){
    active=select.value;hint.hidden=true;
    if(!active){desc.textContent='Kies een oefening. Alle waarden blijven dimensieloos en zijn uitsluitend educatief.';scoreEl.textContent='—';bar.style.width='0%';clearHighlights();onChange();return;}
    const s=SCENARIOS[active];desc.textContent=s.description;
    if(resetControls)neutralizeTargets();
    highlightControls();onChange();
  }
  select.addEventListener('change',()=>applyScenario(true));
  panel.querySelector('#trainingReset').addEventListener('click',()=>applyScenario(true));
  panel.querySelector('#trainingHint').addEventListener('click',()=>{if(!active)return;hint.textContent=SCENARIOS[active].hint;hint.hidden=false;});

  return {
    getDisturbance(){return active?SCENARIOS[active].disturbance:{};},
    update(sim){
      if(!active)return;
      const score=scoreFor(active,sim);scoreEl.textContent=score+'%';bar.style.width=score+'%';
      panel.classList.toggle('trainingSolved',score>=92);
      if(score>=92)desc.textContent='Doel gehaald. Positie/hoek zijn in het genormaliseerde model voldoende gecentreerd.';
      else desc.textContent=SCENARIOS[active].description;
    },
    reset(){select.value='';active='';clearHighlights();scoreEl.textContent='—';bar.style.width='0%';hint.hidden=true;panel.classList.remove('trainingSolved');},
    isActive(){return !!active;}
  };
}
