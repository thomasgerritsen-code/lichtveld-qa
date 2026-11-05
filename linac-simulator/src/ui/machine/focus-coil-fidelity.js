const NS='http://www.w3.org/2000/svg';

export function focusCoilVisualSpec(){
  return {
    geometry:'normalized-educational',
    topology:'solenoidal-coil-pack-around-accelerating-waveguide',
    halfLength:42,
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
  for(const sign of [-1,1]){
    group.appendChild(svg('rect',{
      x:-spec.halfLength,y:sign<0?-spec.outerHalfHeight:spec.innerHalfHeight,
      width:spec.halfLength*2,height:spec.outerHalfHeight-spec.innerHalfHeight,
      rx:5,fill:'#563c2b',stroke:'#af8a66','stroke-width':2,
      class:'hit focusSolenoidBody'
    }));
  }
  group.setAttribute('data-view','longitudinal-cutaway');
  group.setAttribute('data-bore','open');

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

    // Preserve interaction/state hooks; only the single coil-pack drawing remains.
    for(const legacy of transformGroup.querySelectorAll('.focusWinding')){
      legacy.setAttribute('opacity','0');
      legacy.setAttribute('data-legacy-visual','1');
    }
    transformGroup.insertBefore(buildCoilPack(),transformGroup.firstChild);
  }
}

