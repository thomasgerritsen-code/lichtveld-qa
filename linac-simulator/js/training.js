const SCENARIOS={
  radial:{
    label:'Radiale bronhoekfout',
    description:'Er is een verborgen radiale positie/hoekfout vóór Focus 1. Centreer zowel R als R′ aan de target met 1R en 2R.',
    hint:'1R en 2R zijn beide hoek-kicks, maar ze staan op verschillende plaatsen in de beamline. Daardoor hebben ze aan de target een andere combinatie van invloed op positie en hoek.',
    controls:['r1','r2'],
    axis:['R','R′'],
    hardware:['steer1','steer2','target'],
    disturbance:{radial:{x:-.00358,xp:.01236}}
  },
  transverse:{
    label:'Transverse bronfout',
    description:'Er is een verborgen transverse positie/hoekfout vóór Focus 1. Corrigeer T en T′ met 1T en 2T.',
    hint:'Kijk naar beide meters. Een instelling die T kleiner maakt kan T′ nog verkeerd laten staan. De tweede corrector geeft een tweede onafhankelijke respons aan de target.',
    controls:['t1','t2'],
    axis:['T','T′'],
    hardware:['steer1','steer2','target'],
    disturbance:{transverse:{x:.00358,xp:-.01236}}
  },
  bending:{
    label:'Bending mismatch',
    description:'De bending-array heeft een verborgen coarse/fine-offset. Breng target-offset en de resterende dispersie terug richting de nominale toestand.',
    hint:'Coarse werkt in dit model op de volledige M1/M2/M3-array. Fine is een extra M3-trim. Omdat die twee ingrepen niet op dezelfde plek werken, kun je de eindtoestand met beide verfijnen.',
    controls:['coarse','fine'],
    axis:['Target R','Disp.'],
    hardware:['slalom','slalom','target'],
    disturbance:{coarseBias:.22,fineBias:-.15}
  }
};

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));

function scoreFor(scenario,sim){
  if(!scenario)return 100;
  const t=sim.target;
  let e=0;
  if(scenario==='radial') e=Math.hypot(t.r*2.5,t.rp*1.5);
  else if(scenario==='transverse') e=Math.hypot(t.t*2.5,t.tp*1.5);
  else e=Math.hypot(t.r*2,t.rp*1.2,sim.mismatch*.45,(t.disp*sim.mismatch)*.10);
  return Math.max(0,Math.min(100,Math.round(100-e*900)));
}

function targetValues(scenario,sim){
  if(scenario==='radial') return [sim.target.r,sim.target.rp];
  if(scenario==='transverse') return [sim.target.t,sim.target.tp];
  if(scenario==='bending') return [sim.target.r,(sim.target.disp*sim.mismatch)*.10];
  return [0,0];
}

function meterPosition(value,scale){
  return 50 + clamp(value/scale,-1,1)*46;
}

export function initTraining({controls,onChange}){
  const host=document.querySelector('.controls');
  const note=document.querySelector('.modelNote');
  const panel=document.createElement('details');
  panel.className='trainingPanel';
  panel.open=true;
  panel.innerHTML=`<summary>Training mode</summary><div class="trainingBody">
    <label class="trainingSelectLabel">Oefening
      <select id="trainingScenario">
        <option value="">Uit</option>
        ${Object.entries(SCENARIOS).map(([k,s])=>`<option value="${k}">${s.label}</option>`).join('')}
      </select>
    </label>

    <p id="trainingDescription">Kies een oefening. Alle instellingen en scores zijn dimensieloos en uitsluitend educatief.</p>

    <div class="trainingScore">
      <span>Score</span><strong id="trainingScore">—</strong>
      <div class="scoreTrack"><i id="scoreBar"></i></div>
    </div>

    <div class="targetMeters" id="targetMeters" hidden>
      <div class="targetMeter">
        <div class="meterTitle"><span id="meter1Label">Positie</span><strong id="meter1Value">0.000</strong></div>
        <div class="zeroMeter"><i class="zeroLine"></i><b id="meter1Marker"></b></div>
      </div>
      <div class="targetMeter">
        <div class="meterTitle"><span id="meter2Label">Hoek</span><strong id="meter2Value">0.000</strong></div>
        <div class="zeroMeter"><i class="zeroLine"></i><b id="meter2Marker"></b></div>
      </div>
      <p class="meterHelp">Midden = nominale targettoestand. De meters tonen alleen relatieve modelgrootheden.</p>
    </div>

    <ol class="trainingSteps" id="trainingSteps" hidden>
      <li data-step="1"><span>1</span><div><strong id="step1Title">Bekijk de beginfout</strong><small id="step1Text">Let op positie én hoek.</small></div></li>
      <li data-step="2"><span>2</span><div><strong id="step2Title">Gebruik de eerste corrector</strong><small id="step2Text">Bekijk hoe beide targetmeters reageren.</small></div></li>
      <li data-step="3"><span>3</span><div><strong id="step3Title">Gebruik de tweede corrector</strong><small id="step3Text">Breng beide meters samen naar het midden.</small></div></li>
    </ol>

    <div class="whyBox" id="whyBox" hidden>
      <strong>Waarom werkt dit zo?</strong>
      <p id="whyText"></p>
    </div>

    <div class="trainingActions">
      <button id="trainingReset" type="button">Start opnieuw</button>
      <button id="trainingHint" type="button">Hint</button>
    </div>
    <p id="trainingHintText" class="trainingHint" hidden></p>
  </div>`;
  host.insertBefore(panel,note);

  let active='';
  const select=panel.querySelector('#trainingScenario');
  const desc=panel.querySelector('#trainingDescription');
  const scoreEl=panel.querySelector('#trainingScore');
  const bar=panel.querySelector('#scoreBar');
  const hint=panel.querySelector('#trainingHintText');
  const meters=panel.querySelector('#targetMeters');
  const steps=panel.querySelector('#trainingSteps');
  const whyBox=panel.querySelector('#whyBox');
  const whyText=panel.querySelector('#whyText');
  const marker1=panel.querySelector('#meter1Marker');
  const marker2=panel.querySelector('#meter2Marker');
  const value1=panel.querySelector('#meter1Value');
  const value2=panel.querySelector('#meter2Value');
  const label1=panel.querySelector('#meter1Label');
  const label2=panel.querySelector('#meter2Label');

  function clearControlHighlights(){
    document.querySelectorAll('.controlBody label.trainingTarget').forEach(l=>l.classList.remove('trainingTarget'));
  }
  function clearHardwareHighlights(){
    document.querySelectorAll('.trainingHardware').forEach(el=>el.classList.remove('trainingHardware'));
  }
  function highlightControls(){
    clearControlHighlights();
    if(!active)return;
    for(const id of SCENARIOS[active].controls){
      controls[id]?.closest('label')?.classList.add('trainingTarget');
    }
  }
  function highlightHardware(step){
    clearHardwareHighlights();
    if(!active)return;
    const part=SCENARIOS[active].hardware[Math.max(0,Math.min(2,step-1))];
    document.querySelectorAll(`[data-part="${part}"]`).forEach(el=>el.classList.add('trainingHardware'));
  }
  function neutralizeTargets(){
    if(!active)return;
    for(const id of SCENARIOS[active].controls) controls[id].value=0;
  }
  function configureExplanation(){
    if(!active)return;
    const s=SCENARIOS[active];
    label1.textContent=s.axis[0];
    label2.textContent=s.axis[1];

    if(active==='bending'){
      panel.querySelector('#step1Title').textContent='Bekijk de bending-fout';
      panel.querySelector('#step1Text').textContent='Target-offset en dispersie staan niet tegelijk nominaal.';
      panel.querySelector('#step2Title').textContent='Corrigeer met Coarse';
      panel.querySelector('#step2Text').textContent='Coarse verschuift de respons van de volledige slalom-array.';
      panel.querySelector('#step3Title').textContent='Trim met Fine';
      panel.querySelector('#step3Text').textContent='Fine werkt later in de lijn en geeft daarom een andere eindrespons.';
      whyText.textContent='Coarse en Fine zijn in dit educatieve model twee verschillende response-richtingen. Coarse beïnvloedt de gehele M1/M2/M3-keten; Fine voegt een extra M3-trim toe. Twee verschillende response-richtingen geven meer vrijheid om de eindtoestand te centreren.';
    }else{
      const names={r1:'1R',r2:'2R',t1:'1T',t2:'2T'};
      const [c1,c2]=s.controls.map(id=>names[id]||id);
      panel.querySelector('#step1Title').textContent='Bekijk de beginfout';
      panel.querySelector('#step1Text').textContent=`Let op ${s.axis[0]} én ${s.axis[1]} aan de target.`;
      panel.querySelector('#step2Title').textContent=`Verander ${c1}`;
      panel.querySelector('#step2Text').textContent='Deze steering-coil geeft lokaal een hoek-kick. Downstream drift en focusing zetten dat om in een verandering van zowel positie als hoek.';
      panel.querySelector('#step3Title').textContent=`Gebruik daarna ${c2}`;
      panel.querySelector('#step3Text').textContent='De tweede corrector staat verder downstream en heeft daarom een andere verhouding tussen target-positie en target-hoek.';
      whyText.textContent='Een steering-coil verandert lokaal vooral de richting van de elektronenbaan. Omdat de bundel daarna nog door drift- en focuselementen loopt, verschijnt die kick aan de target als een combinatie van positie- en hoekverandering. De tweede corrector staat op een andere longitudinale positie, dus zijn response-vector aan de target is anders. In een lineair model kun je met twee onafhankelijke correctoren twee eindvoorwaarden tegelijk aanpakken.';
    }
  }
  function currentStep(score){
    if(!active)return 0;
    const ids=SCENARIOS[active].controls;
    const first=Math.abs(+controls[ids[0]].value)>4;
    const second=Math.abs(+controls[ids[1]].value)>4;
    if(score>=92)return 3;
    if(first && second)return 3;
    if(first || second)return 2;
    return 1;
  }
  function updateStepUI(step,score){
    panel.querySelectorAll('.trainingSteps li').forEach((li,index)=>{
      const n=index+1;
      li.classList.toggle('activeStep',n===step && score<92);
      li.classList.toggle('doneStep',n<step || (score>=92 && n<=3));
    });
    highlightHardware(score>=92?3:step);
  }
  function applyScenario(resetControls=true){
    active=select.value;
    hint.hidden=true;
    panel.classList.remove('trainingSolved');
    clearHardwareHighlights();

    if(!active){
      desc.textContent='Kies een oefening. Alle instellingen en scores zijn dimensieloos en uitsluitend educatief.';
      scoreEl.textContent='—';
      bar.style.width='0%';
      meters.hidden=true;
      steps.hidden=true;
      whyBox.hidden=true;
      clearControlHighlights();
      onChange();
      return;
    }

    const s=SCENARIOS[active];
    desc.textContent=s.description;
    if(resetControls)neutralizeTargets();
    highlightControls();
    configureExplanation();
    meters.hidden=false;
    steps.hidden=false;
    whyBox.hidden=false;
    onChange();
  }

  select.addEventListener('change',()=>applyScenario(true));
  panel.querySelector('#trainingReset').addEventListener('click',()=>applyScenario(true));
  panel.querySelector('#trainingHint').addEventListener('click',()=>{
    if(!active)return;
    hint.textContent=SCENARIOS[active].hint;
    hint.hidden=false;
  });

  return {
    getDisturbance(){return active?SCENARIOS[active].disturbance:{};},
    update(sim){
      if(!active)return;

      const score=scoreFor(active,sim);
      scoreEl.textContent=score+'%';
      bar.style.width=score+'%';
      panel.classList.toggle('trainingSolved',score>=92);

      const [a,b]=targetValues(active,sim);
      value1.textContent=a.toFixed(3);
      value2.textContent=b.toFixed(3);
      const scale1=active==='bending'?.10:.08;
      const scale2=active==='bending'?.10:.08;
      marker1.style.left=meterPosition(a,scale1)+'%';
      marker2.style.left=meterPosition(b,scale2)+'%';
      marker1.classList.toggle('nearZero',Math.abs(a)<.01);
      marker2.classList.toggle('nearZero',Math.abs(b)<.01);

      const step=currentStep(score);
      updateStepUI(step,score);

      if(score>=92) desc.textContent='Doel gehaald. Beide eindvoorwaarden liggen in het genormaliseerde model voldoende dicht bij de nominale toestand.';
      else desc.textContent=SCENARIOS[active].description;
    },
    reset(){
      select.value='';
      active='';
      clearControlHighlights();
      clearHardwareHighlights();
      scoreEl.textContent='—';
      bar.style.width='0%';
      hint.hidden=true;
      meters.hidden=true;
      steps.hidden=true;
      whyBox.hidden=true;
      panel.classList.remove('trainingSolved');
    },
    isActive(){return !!active;}
  };
}
