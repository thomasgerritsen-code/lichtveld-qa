export function updateRfAnimation(sim,delivery,view={mode:'photon'}){
  const rf=sim?.rf;
  if(!rf)return;

  const active=Boolean(delivery?.beamActive&&delivery?.sourceActive);
  const intensity=active?Math.max(.04,Math.min(1,rf.rfEfficiency)):0;
  const capture=active?Math.max(.04,Math.min(1,rf.captureFactor)):0;

  const magnetron=document.querySelector('#magnetronAssembly');
  const feed=document.querySelector('#rfFeedPath');
  const accel=document.querySelector('#rfAccelWave');
  const glow=document.querySelector('#magnetronGlow');
  const targetFlash=document.querySelector('#targetConversionFlash');

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

  const targetActive=Boolean(
    active&&
    view.mode==='photon'&&
    (delivery?.outputFraction??0)>.002
  );
  if(targetFlash){
    targetFlash.classList.toggle('active',targetActive);
    targetFlash.style.opacity=String(targetActive?Math.max(.08,Math.min(.65,delivery.outputFraction*.65)):0);
  }
}
