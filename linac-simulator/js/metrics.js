const LABELS={gun:'Gun',focus1:'Focus 1',steer1:'1R / 1T',focus2:'Focus 2',steer2:'2R / 2T',bendEntry:'Bend entry',m1:'M1',m2:'M2',m3:'M3',target:'Target'};
const PARTS={gun:'gun',focus1:'focus1',steer1:'steer1',focus2:'focus2',steer2:'steer2',bendEntry:'flightTube',m1:'slalom',m2:'slalom',m3:'slalom',target:'target'};
const fmt=v=>Math.abs(v)<.0005?'0.000':v.toFixed(3);

export function initMetrics(){
  const viewer=document.querySelector('.layout > section');
  const card=document.createElement('article');
  card.className='panelCard metricsCard';
  card.innerHTML=`<div class="metricsHead"><div><strong>Live beam state per element</strong><span>Genormaliseerde positie, hoek en dispersie</span></div><span class="metricsNote">R/T en R′/T′ zijn dimensieloos</span></div>
    <div class="metricsScroll"><table class="metricsTable"><thead><tr><th>Element</th><th>R</th><th>R′</th><th>T</th><th>T′</th><th>Disp.</th><th>σ rel.</th></tr></thead><tbody id="metricsBody"></tbody></table></div>
    <p class="metricsFoot">De bending-dispersie gebruikt een genormaliseerd sector-magnet transfermodel. OEM veldkaarten, edge focusing en echte magnetische currents zijn niet opgenomen.</p>`;
  viewer.appendChild(card);
  const body=card.querySelector('#metricsBody');

  function update(stages){
    body.innerHTML='';
    stages.filter(s=>LABELS[s.name]).forEach(stage=>{
      const tr=document.createElement('tr');tr.dataset.stage=stage.name;
      const severity=Math.max(Math.abs(stage.r),Math.abs(stage.t),Math.abs(stage.rp),Math.abs(stage.tp));
      if(severity>.08)tr.classList.add('metricWarn');
      tr.innerHTML=`<th>${LABELS[stage.name]}</th><td>${fmt(stage.r)}</td><td>${fmt(stage.rp)}</td><td>${fmt(stage.t)}</td><td>${fmt(stage.tp)}</td><td>${fmt(stage.disp)}</td><td>${fmt(stage.sigma)}</td>`;
      tr.addEventListener('click',()=>{
        document.querySelectorAll('.metricHighlight').forEach(e=>e.classList.remove('metricHighlight'));
        const el=document.querySelector(`[data-part="${PARTS[stage.name]}"]`);if(el){el.classList.add('metricHighlight');setTimeout(()=>el.classList.remove('metricHighlight'),1100);}
      });
      body.appendChild(tr);
    });
  }
  return {update};
}
