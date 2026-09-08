export function updateRfAnimation(sim,delivery){
  const rf=sim?.rf;
  if(!rf)return;

  const active=Boolean(delivery?.beamActive&&delivery?.sourceActive);
  const intensity=active?Math.max(.04,Math.min(1,rf.rfEfficiency)):0;
  const capture=active?Math.max(.04,Math.min(1,rf.captureFactor)):0;

  const magnetron=document.querySelector('#magnetronAssembly');
  const feed=document.querySelector('#rfFeedPath');
  const accel=document.querySelector('#rfAccelWave');
  const glow=document.querySelector('#magnetronGlow');

  if(magnetron){
    magnetron.classList.toggle('rfActive',active);
    magnetron.style.setProperty('--rf-intensity',String(intensity));
    magnetron.style.setProperty('--rf-capture',String(capture));
  }
  for(const element of [feed,accel]){
    if(!element)continue;
    element.classList.toggle('rfActive',active);
    element.style.opacity=String(active?(0.25+0.75*intensity):0);
    const seconds=(1.5-.85*intensity).toFixed(2)+'s';
    element.style.setProperty('--rf-speed',seconds);
  }
  if(glow)glow.style.opacity=String(active?(0.12+0.42*intensity):0);
}
