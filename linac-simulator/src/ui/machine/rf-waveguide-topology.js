import {inputModeTransformerSpec} from './hardware.js';

const SVG_NS='http://www.w3.org/2000/svg';

export function rfWaveguideVisualState(){
  // Public accelerator teaching and Elekta-oriented diagrams support this qualitative
  // topology: magnetron RF is carried by a feed waveguide through an RF coupler into
  // a travelling-wave accelerating structure. The entrance cells provide capture /
  // bunching before the main relativistic acceleration section.
  // Coordinates below only annotate the simulator's existing schematic and are
  // normalized educational geometry, not OEM dimensions or service geometry.
  return {
    topology:['magnetron','rf-feed-waveguide','rf-coupler','capture-bunching-cells','main-accelerating-cells'],
    coupler:{x:inputModeTransformerSpec().localX+inputModeTransformerSpec().localWidth/2,y:27,width:inputModeTransformerSpec().localWidth,height:inputModeTransformerSpec().localHeight},
    buncher:{x1:18,x2:160,y:39},
    accelerator:{x1:170,x2:646,y:39},
    geometry:'normalized-educational'
  };
}

function svg(name,attrs={}){
  const el=document.createElementNS(SVG_NS,name);
  Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,String(value)));
  return el;
}

export function initRfWaveguideTopologyGraphics(){
  const waveguide=document.querySelector('[data-part="waveguide"] > g');
  if(!waveguide||waveguide.querySelector('[data-role="rf-waveguide-topology"]'))return;

  const visual=rfWaveguideVisualState();
  const layer=svg('g',{
    'data-role':'rf-waveguide-topology',
    'data-geometry':visual.geometry,
    'pointer-events':'none'
  });

  // The base hardware owns the physical input coupler; annotate that same
  // element rather than drawing a second RF feed inside the accelerator.
  waveguide.querySelector('#inputModeTransformer')?.setAttribute('data-role','rf-coupler');

  const makeBracket=(region,label)=>{
    const g=svg('g',{'data-role':label==='capture / bunching'?'bunching-region':'acceleration-region'});
    g.appendChild(svg('path',{
      d:`M ${region.x1} ${region.y} v 8 H ${region.x2} v -8`,
      fill:'none',stroke:'#6f91ad','stroke-width':1.5
    }));
    const text=svg('text',{
      x:(region.x1+region.x2)/2,y:region.y+22,'text-anchor':'middle',
      fill:'#9db7cc','font-size':11,'font-family':'system-ui, sans-serif'
    });
    text.textContent=label;
    g.appendChild(text);
    return g;
  };

  layer.appendChild(makeBracket(visual.buncher,'capture / bunching'));
  layer.appendChild(makeBracket(visual.accelerator,'main acceleration'));
  waveguide.appendChild(layer);
}

