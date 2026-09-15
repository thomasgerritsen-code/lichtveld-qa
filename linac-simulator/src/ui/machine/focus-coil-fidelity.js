const NS='http://www.w3.org/2000/svg';

export function focusCoilVisualSpec(){
  return {
    geometry:'normalized-educational',
    topology:'solenoidal-coil-pack-around-accelerating-waveguide',
    halfLength:58,
    innerHalfHeight:48,
    outerHalfHeight:67,
    turnCount:9
  };
}

function svg(name,attrs={}){
  const node=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
  return node;
}

function buildCoilPack(){
  const spec=focusCoilVisualSpec();
  const group=svg('g',{
    class:'focusCoilFidelity',
    'data-geometry':spec.geometry,
    'data-topology':spec.topology
  });

  // A focus assembly is shown as a compact solenoidal sleeve around the beam pipe.
  // Dimensions are illustration-only; no Elekta coil dimensions or currents are implied.
  const housing=svg('rect',{
    x:-spec.halfLength,
    y:-spec.outerHalfHeight,
    width:spec.halfLength*2,
    height:spec.outerHalfHeight*2,
    rx:13,
    fill:'#172a38',
    stroke:'#7f9aaa',
    'stroke-width':2.2,
    opacity:.96
  });
  group.appendChild(housing);

  const bore=svg('rect',{
    x:-spec.halfLength-2,
    y:-spec.innerHalfHeight,
    width:spec.halfLength*2+4,
    height:spec.innerHalfHeight*2,
    rx:7,
    fill:'#09141c',
    stroke:'#afc1cb',
    'stroke-width':1.4
  });
  group.appendChild(bore);

  for(let i=0;i<spec.turnCount;i++){
    const x=-spec.halfLength+10+i*((spec.halfLength*2-20)/(spec.turnCount-1));
    for(const sign of [-1,1]){
      group.appendChild(svg('line',{
        x1:x,
        x2:x,
        y1:sign<0?-spec.outerHalfHeight+7:spec.innerHalfHeight+4,
        y2:sign<0?-spec.innerHalfHeight-4:spec.outerHalfHeight-7,
        stroke:'#b97945',
        'stroke-width':4,
        'stroke-linecap':'round',
        opacity:.92
      }));
    }
  }

  for(const sign of [-1,1]){
    group.appendChild(svg('line',{
      x1:-spec.halfLength+5,
      x2:spec.halfLength-5,
      y1:sign*57,
      y2:sign*57,
      stroke:'#d39a67',
      'stroke-width':2,
      opacity:.8
    }));
  }

  return group;
}

export function initFocusCoilFidelity(){
  for(const part of ['focus1','focus2']){
    const transformGroup=document.querySelector(`[data-part="${part}"] > g`);
    if(!transformGroup||transformGroup.querySelector('.focusCoilFidelity'))continue;

    // Preserve interaction/state hooks but retire the oversized diamond-like legacy artwork.
    for(const legacy of transformGroup.querySelectorAll('.focusWinding')){
      legacy.setAttribute('opacity','0');
      legacy.setAttribute('data-legacy-visual','1');
    }
    transformGroup.insertBefore(buildCoilPack(),transformGroup.firstChild);
  }
}
