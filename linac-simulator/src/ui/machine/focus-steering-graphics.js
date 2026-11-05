import {NS,WAVE_ANCHORS} from './geometry.js';

const anchorByStage=stage=>WAVE_ANCHORS.find(anchor=>anchor.stage===stage);

export function focusSteeringTopologySpec(){
  // Public Elekta SL25 literature supports the order
  // Focus 1 -> 1R/1T -> Focus 2 -> 2R/2T around the travelling-wave guide.
  // It also distinguishes primary injection centering from secondary target-angle
  // alignment. Dimensions below are normalized illustration values only.
  return [
    {stage:'focus1',kind:'focus',role:'upstream-waveguide-focusing',effect:'beam-envelope-conditioning',length:84,radius:67},
    {stage:'steer1',kind:'steering',role:'primary-injection-centering',effect:'trajectory-centering-and-wall-clearance',length:54,radius:48,channels:['R','T']},
    {stage:'focus2',kind:'focus',role:'downstream-waveguide-focusing',effect:'downstream-envelope-conditioning',length:84,radius:67},
    {stage:'steer2',kind:'steering',role:'secondary-target-angle-alignment',effect:'downstream-axis-and-target-alignment',length:54,radius:46,channels:['R','T']}
  ].map(spec=>({...spec,...anchorByStage(spec.stage),angleDeg:-22.5}));
}

export function steeringCausalitySpec(){
  return [
    {from:'focus1',to:'steer1',label:'envelope → injection centering'},
    {from:'steer1',to:'focus2',label:'trajectory / wall clearance'},
    {from:'focus2',to:'steer2',label:'envelope → downstream steering'},
    {from:'steer2',to:'bendEntry',label:'axis / target alignment'}
  ];
}

function svg(name,attrs={}){
  const element=document.createElementNS(NS,name);
  for(const [key,value] of Object.entries(attrs)) element.setAttribute(key,String(value));
  return element;
}

export function steeringCoilSpec(){
  return {topology:'two-orthogonal-dipole-coil-pairs',sideHalfLength:25,
    guideHalfHeight:47,coilInner:53,coilOuter:70,
    radialDirection:'in-bending-plane',transverseDirection:'out-of-bending-plane'};
}

function addSteeringGraphic(parent,spec){
  const coil=steeringCoilSpec();
  parent.setAttribute('data-topology',coil.topology);
  // Longitudinal cutaway: both saddle-coil pairs surround the guide. No coil
  // body is placed on the beam axis; the second pair is shown as a projection.
  for(const sign of [-1,1]){
    parent.appendChild(svg('rect',{x:-coil.sideHalfLength,y:sign<0?-coil.coilOuter:coil.coilInner,
      width:coil.sideHalfLength*2,height:coil.coilOuter-coil.coilInner,rx:6,
      class:'hit steeringRadialCoil','data-channel':'R'}));
    parent.appendChild(svg('path',{
      d:`M-30 ${sign*49} H30 M-30 ${sign*75} H30`,
      class:'steeringTransverseCoil','data-channel':'T','stroke-dasharray':'4 3',fill:'none'}));
  }
  const label=svg('text',{x:0,y:-84,'text-anchor':'middle',class:'steeringChannelLabel'});
  label.textContent=spec.stage==='steer1'?'1R / 1T':'2R / 2T';parent.appendChild(label);
}

function addCrossSection(parent){
  const panel=svg('g',{id:'steeringCrossSection',transform:'translate(315 315)',
    'data-view':'beam-axis-cross-section','data-topology':'orthogonal-steering-directions'});
  panel.appendChild(svg('rect',{x:-155,y:-125,width:330,height:250,rx:14,fill:'#0c1c2a',stroke:'#40586c','stroke-width':2}));
  const text=(x,y,value)=>{const t=svg('text',{x,y,fill:'#d7e5ef','font-size':14});t.textContent=value;panel.appendChild(t);};
  text(-133,-98,'1R/1T en 2R/2T · doorsnede');
  text(-133,103,'Kijkrichting langs bundel · schematisch');
  panel.appendChild(svg('circle',{cx:0,cy:0,r:46,fill:'#07111b',stroke:'#8ca6b8','stroke-width':3}));
  // Opposed coil pairs at right angles; colours identify the circuit, not N/S.
  for(const sign of [-1,1]){
    panel.appendChild(svg('rect',{x:-28,y:sign<0?-79:57,width:56,height:22,rx:6,class:'steeringTransverseCoil','data-channel':'T'}));
    panel.appendChild(svg('rect',{x:sign<0?-79:57,y:-28,width:22,height:56,rx:6,class:'steeringRadialCoil','data-channel':'R'}));
  }
  // Directions are electron deflection, not magnetic field: F = q v × B.
  panel.appendChild(svg('path',{d:'M0 29 V-29 M-5 -21 L0 -29 L5 -21',stroke:'#f0c64b','stroke-width':2,fill:'none','data-direction':'R'}));
  panel.appendChild(svg('path',{d:'M-29 0 H29 M21 -5 L29 0 L21 5',stroke:'#8ecfff','stroke-width':2,fill:'none','data-direction':'T'}));
  text(8,-18,'R');text(19,20,'T');
  text(92,-4,'R ⟂ T');text(92,17,'sturing');
  parent.appendChild(panel);
}

export function initFocusSteeringGraphics(){
  const hardware=document.querySelector('#machineHardware');
  if(!hardware||document.querySelector('#focusSteeringTopologyOverlay'))return;
  const overlay=svg('g',{id:'focusSteeringTopologyOverlay',
    'data-topology':'focus1-steer1-focus2-steer2','data-geometry':'normalized-educational'});
  // Replace each old illustration in its interactive component, instead of
  // adding competing translucent hardware above the waveguide.
  for(const spec of focusSteeringTopologySpec()){
    const part=document.querySelector(`[data-part="${spec.stage}"]`);
    if(!part)continue;
    part.removeAttribute('opacity');part.removeAttribute('data-legacy-envelope');
    part.setAttribute('data-role',spec.role);
    const group=svg('g',{transform:`translate(${spec.x} ${spec.y}) rotate(${spec.angleDeg})`,
      'data-stage':spec.stage,'data-geometry':'normalized-educational'});
    part.replaceChildren(group);
    if(spec.kind==='steering')addSteeringGraphic(group,spec);
  }
  addCrossSection(overlay);
  hardware.appendChild(overlay);
  // Move existing labels with their hardware, and suppress duplicate steering
  // labels now owned by the component itself.
  for(const text of document.querySelectorAll('#labels text')){
    const key={'Focus 1':'focus1','Focus 2':'focus2','1R / 1T':'steer1','2R / 2T':'steer2'}[text.textContent];
    if(!key)continue;
    const spec=focusSteeringTopologySpec().find(s=>s.stage===key);
    text.setAttribute('x',spec.x-34);text.setAttribute('y',spec.y-104);
    if(spec.kind==='steering')text.setAttribute('display','none');
  }
}
