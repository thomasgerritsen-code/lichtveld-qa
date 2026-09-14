const SVG_NS='http://www.w3.org/2000/svg';

export function backscatterPlateVisualState(){
  // Public Elekta/Agility treatment-head Monte Carlo literature consistently places
  // a backscatter plate immediately downstream of the monitor ion chamber and
  // upstream of the optical mirror / beam-shaping hardware. Its purpose is to reduce
  // radiation scattered back from downstream collimation into the monitor chamber.
  // All coordinates, dimensions and styling here are normalized educational graphics;
  // they are not OEM plate dimensions, material specifications or service geometry.
  const center=1450;
  const y=934;
  const width=142;
  const height=6;

  return {
    role:'monitor-backscatter-plate',
    topology:'monitor-chamber-backscatter-plate-before-mirror',
    function:'reduce-downstream-collimator-backscatter-into-monitor',
    center,
    x:center-width/2,
    y,
    width,
    height,
    ordering:['monitor-chamber','backscatter-plate','field-light-mirror','agility-mlc-diaphragms']
  };
}

export function initBackscatterPlateGraphics(){
  const photonHead=document.querySelector('#photonHead');
  if(!photonHead||photonHead.querySelector('[data-role="monitor-backscatter-plate"]'))return;

  const visual=backscatterPlateVisualState();
  const plate=document.createElementNS(SVG_NS,'rect');
  plate.setAttribute('x',String(visual.x));
  plate.setAttribute('y',String(visual.y));
  plate.setAttribute('width',String(visual.width));
  plate.setAttribute('height',String(visual.height));
  plate.setAttribute('rx','2');
  plate.setAttribute('fill','#8f9aa5');
  plate.setAttribute('stroke','#d1d9df');
  plate.setAttribute('stroke-width','1.2');
  plate.setAttribute('data-role',visual.role);
  plate.setAttribute('data-topology',visual.topology);
  plate.setAttribute('data-geometry','normalized-educational');
  plate.setAttribute('pointer-events','none');
  photonHead.appendChild(plate);
}
