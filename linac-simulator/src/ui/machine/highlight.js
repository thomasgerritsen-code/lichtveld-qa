export function setActiveControlEffect(effect){
  document.querySelectorAll('.controlActiveHardware')
    .forEach(element=>element.classList.remove('controlActiveHardware'));
  document.querySelectorAll('.planeAttention')
    .forEach(element=>element.classList.remove('planeAttention'));

  if(!effect)return;

  const parts=Array.isArray(effect.part)?effect.part:[effect.part];
  parts.forEach(part=>{
    document.querySelectorAll(`[data-part="${part}"]`)
      .forEach(element=>element.classList.add('controlActiveHardware'));
  });

  if(effect.plane==='radial'){
    document.querySelector('#radialPlane')?.closest('div')?.classList.add('planeAttention');
  }
  if(effect.plane==='transverse'){
    document.querySelector('#transversePlane')?.closest('div')?.classList.add('planeAttention');
  }
  if(effect.plane==='both'){
    document.querySelector('#radialPlane')?.closest('div')?.classList.add('planeAttention');
    document.querySelector('#transversePlane')?.closest('div')?.classList.add('planeAttention');
  }
}
