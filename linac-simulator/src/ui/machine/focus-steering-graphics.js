import {NS,WAVE_ANCHORS} from './geometry.js';

const anchorByStage=stage=>WAVE_ANCHORS.find(anchor=>anchor.stage===stage);

export function focusSteeringTopologySpec(){
  // Public Elekta SL25 literature supports the order
  // Focus 1 -> 1R/1T -> Focus 2 -> 2R/2T around the travelling-wave guide.
  // Dimensions below are normalized illustration values only: they do not
  // represent OEM coil dimensions, currents, fields or service geometry.
  return [
    {stage:'focus1',kind:'focus',role:'upstream-waveguide-focusing',length:86,radius:55},
    {stage:'steer1',kind:'steering',role:'primary-injection-centering',length:54,radius:48,channels:['R','T']},
    {stage:'focus2',kind:'focus',role:'downstream-waveguide-focusing',length:78,radius:52},
    {stage:'steer2',kind:'steering',role:'secondary-target-angle-alignment',length:54,radius:46,channels:['R','T']}
  ].map(spec=>({...spec,...anchorByStage(spec.stage),angleDeg:-22.5}));
}

function svg(name,attrs={}){
  const element=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs)) element.setAttribute(key,String(value));
  return element;
}

function addFocusGraphic(parent,spec){
  const group=svg('g',{
    class:'focusTopologyGraphic',
    'data-stage':spec.stage,
    'data-role':spec.role,
    'data-geometry':'normalized-educational',
    transform:`translate(${spec.x} ${spec.y}) rotate(${spec.angleDeg})`
  });

  const body=svg('rect',{
    x:-spec.length/2,y:-spec.radius,width:spec.length,height:spec.radius*2,
    rx:18,class:'focusSolenoidBody'
  });
  group.appendChild(body);

  const windingCount=7;
  for(let i=0;i<windingCount;i++){
    const x=-spec.length*.38+i*(spec.length*.76/(windingCount-1));
    group.appendChild(svg('ellipse',{
      cx:x,cy:0,rx:7,ry:spec.radius-8,class:'focusSolenoidTurn'
    }));
  }

  group.appendChild(svg('line',{
    x1:-spec.length*.47,y1:0,x2:spec.length*.47,y2:0,class:'focusAxisGuide'
  }));
  parent.appendChild(group);
}

function addSteeringGraphic(parent,spec){
  const group=svg('g',{
    class:'steeringTopologyGraphic',
    'data-stage':spec.stage,
    'data-role':spec.role,
    'data-geometry':'normalized-educational',
    transform:`translate(${spec.x} ${spec.y}) rotate(${spec.angleDeg})`
  });

  // Side-view educational symbol: the R pair is drawn above/below the guide;
  // the T pair is shown as fore/aft coil symbols. This makes the two independent
  // steering channels legible without claiming their exact proprietary shape.
  for(const sign of [-1,1]){
    group.appendChild(svg('rect',{
      x:-spec.length/2,y:sign<0?-(spec.radius+18):spec.radius,
      width:spec.length,height:18,rx:7,class:'steeringRadialCoil'
    }));
  }
  for(const sign of [-1,1]){
    group.appendChild(svg('circle',{
      cx:sign*(spec.length*.36),cy:0,r:15,class:'steeringTransverseCoil'
    }));
  }
  group.appendChild(svg('line',{
    x1:-spec.length*.58,y1:0,x2:spec.length*.58,y2:0,class:'steeringAxisGuide'
  }));
  const r=svg('text',{x:spec.length*.62,y:-spec.radius+9,class:'steeringChannelLabel'});r.textContent='R';group.appendChild(r);
  const t=svg('text',{x:spec.length*.62,y:spec.radius-2,class:'steeringChannelLabel'});t.textContent='T';group.appendChild(t);
  parent.appendChild(group);
}

export function initFocusSteeringGraphics(){
  const hardware=document.querySelector('#machineHardware');
  if(!hardware||document.querySelector('#focusSteeringTopologyOverlay'))return;

  for(const selector of ['[data-part="focus1"]','[data-part="steer1"]','[data-part="focus2"]','[data-part="steer2"]']){
    const legacy=document.querySelector(selector);
    if(legacy){
      legacy.setAttribute('opacity','.18');
      legacy.setAttribute('data-legacy-envelope','1');
    }
  }

  const overlay=svg('g',{
    id:'focusSteeringTopologyOverlay',
    'data-topology':'focus1-steer1-focus2-steer2',
    'data-geometry':'normalized-educational'
  });

  for(const spec of focusSteeringTopologySpec()){
    if(spec.kind==='focus') addFocusGraphic(overlay,spec);
    else addSteeringGraphic(overlay,spec);
  }

  const slalom=document.querySelector('#slalomHardware');
  if(slalom) hardware.insertBefore(overlay,slalom);
  else hardware.appendChild(overlay);
}
