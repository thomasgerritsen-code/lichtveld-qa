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
    coupler:{x:220,y:0,width:28,height:62},
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

  const c=visual.coupler;
  layer.appendChild(svg('rect',{
    x:c.x-c.width/2,y:c.y-c.height/2,width:c.width,height:c.height,rx:6,
    fill:'#172c41',stroke:'#e2b75c','stroke-width':2.2,
    'data-role':'rf-coupler'
  }));
  layer.appendChild(svg('path',{
    d:`M ${c.x-8} -18 L ${c.x+8} -18 L ${c.x+8} 18 L ${c.x-8} 18 Z`,
    fill:'none',stroke:'#ffd66b','stroke-width':1.5,'stroke-dasharray':'4 3'
  }));

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
