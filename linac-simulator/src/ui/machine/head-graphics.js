const SVG_NS='http://www.w3.org/2000/svg';

export function primaryCollimatorVisualState(){
  // IAEA public linac descriptions define the primary photon collimator as a fixed
  // shielding block with a conical opening that diverges downstream from the target.
  // These SVG coordinates are intentionally normalized for illustration/readability;
  // they are not OEM dimensions, shielding thicknesses, target distances or service data.
  const center=1450;
  const top=792;
  const bottom=837;
  const outerLeft=1352;
  const outerRight=1548;
  const apertureTopHalf=17;
  const apertureBottomHalf=39;

  const leftInnerTop=center-apertureTopHalf;
  const leftInnerBottom=center-apertureBottomHalf;
  const rightInnerTop=center+apertureTopHalf;
  const rightInnerBottom=center+apertureBottomHalf;

  return {
    role:'fixed-primary-collimator',
    apertureTopology:'downstream-diverging-conical',
    center,
    top,
    bottom,
    apertureTopHalf,
    apertureBottomHalf,
    leftPath:`M${outerLeft} ${top} H${leftInnerTop} L${leftInnerBottom} ${bottom} H${outerLeft} Z`,
    rightPath:`M${outerRight} ${top} H${rightInnerTop} L${rightInnerBottom} ${bottom} H${outerRight} Z`
  };
}

export function targetAssemblyVisualState(){
  // Elekta's public linac explanation places the photon target directly after the
  // slalom/flight-tube electron path. IAEA teaching material then places the fixed
  // primary collimator immediately downstream of the x-ray target. Public target
  // literature also describes a thin high-Z target on a thermally conductive backing.
  // Only that topology is illustrated here. All SVG proportions are normalized and
  // intentionally avoid OEM target thicknesses, cooling geometry or service dimensions.
  const center=1450;
  const faceY=760;
  const faceWidth=34;
  const faceHeight=6;
  const backingWidth=54;
  const backingHeight=7;
  const backingY=faceY+faceHeight;
  const primaryTop=792;

  return {
    role:'photon-target-assembly',
    topology:'thin-target-with-backing-upstream-of-primary-collimator',
    center,
    faceY,
    faceWidth,
    faceHeight,
    backingWidth,
    backingHeight,
    backingY,
    primaryTop,
    faceX:center-faceWidth/2,
    backingX:center-backingWidth/2,
    downstreamClearance:primaryTop-(backingY+backingHeight)
  };
}

export function opticalFieldVisualState(){
  // IAEA linac teaching material identifies a field-defining light system, while
  // public treatment-head descriptions show a mirror and filament lamp downstream
  // of the monitor chamber. Illustrate that optical topology explicitly: a thin
  // tilted mirror crossing the treatment axis plus an off-axis lamp. Coordinates,
  // angle, spacing and lamp size are normalized schematic geometry only; they are
  // not Elekta service dimensions, optical calibration values or alignment settings.
  const center=1450;
  const mirrorLeft={x:1399,y:944};
  const mirrorRight={x:1501,y:962};
  const thickness=4;
  const lamp={cx:1542,cy:944,r:9};
  const mirrorPath=[
    `M${mirrorLeft.x} ${mirrorLeft.y}`,
    `L${mirrorRight.x} ${mirrorRight.y}`,
    `L${mirrorRight.x} ${mirrorRight.y+thickness}`,
    `L${mirrorLeft.x} ${mirrorLeft.y+thickness}`,
    'Z'
  ].join(' ');

  return {
    role:'optical-field-system',
    topology:'tilted-field-mirror-with-off-axis-lamp',
    center,
    mirrorLeft,
    mirrorRight,
    mirrorPath,
    lamp,
    mirrorRole:'field-light-mirror',
    lampRole:'field-light-lamp',
    mirrorCrossesBeamAxis:mirrorLeft.x<center&&mirrorRight.x>center,
    lampOffsetFromAxis:lamp.cx-center
  };
}

function replaceWithPath(element){
  if(!element||element.tagName?.toLowerCase()==='path')return element;
  const path=document.createElementNS(SVG_NS,'path');
  for(const {name,value} of element.attributes)path.setAttribute(name,value);
  for(const attribute of ['x1','x2','y1','y2'])path.removeAttribute(attribute);
  element.replaceWith(path);
  return path;
}

export function initOpticalFieldGraphics(){
  const group=document.querySelector('[data-part="mirror"]');
  if(!group)return;

  const visual=opticalFieldVisualState();
  const mirror=replaceWithPath(group.querySelector('.mirror'));
  if(mirror){
    mirror.setAttribute('d',visual.mirrorPath);
    mirror.setAttribute('data-role',visual.mirrorRole);
    mirror.setAttribute('fill','#bfe8ef');
    mirror.setAttribute('fill-opacity','.34');
    mirror.setAttribute('stroke','#d7f3f6');
    mirror.setAttribute('stroke-width','1.6');
  }

  let lamp=group.querySelector('[data-role="field-light-lamp"]');
  if(!lamp){
    lamp=document.createElementNS(SVG_NS,'circle');
    lamp.setAttribute('class','fieldLightLamp');
    group.appendChild(lamp);
  }
  lamp.setAttribute('cx',String(visual.lamp.cx));
  lamp.setAttribute('cy',String(visual.lamp.cy));
  lamp.setAttribute('r',String(visual.lamp.r));
  lamp.setAttribute('data-role',visual.lampRole);
  lamp.setAttribute('fill','#f3d47a');
  lamp.setAttribute('fill-opacity','.82');
  lamp.setAttribute('stroke','#ffe6a2');
  lamp.setAttribute('stroke-width','1.6');

  group.setAttribute('data-role',visual.role);
  group.setAttribute('data-topology',visual.topology);
}

export function initTargetAssemblyGraphics(){
  const group=document.querySelector('#photonTarget');
  const face=group?.querySelector('.target');
  if(!group||!face)return;

  const visual=targetAssemblyVisualState();
  face.setAttribute('x',String(visual.faceX));
  face.setAttribute('y',String(visual.faceY));
  face.setAttribute('width',String(visual.faceWidth));
  face.setAttribute('height',String(visual.faceHeight));
  face.setAttribute('rx','1.5');
  face.setAttribute('data-role','x-ray-target-face');

  let backing=group.querySelector('.targetBacking');
  if(!backing){
    backing=document.createElementNS(SVG_NS,'rect');
    backing.setAttribute('class','targetBacking');
    group.insertBefore(backing,face.nextSibling);
  }
  backing.setAttribute('x',String(visual.backingX));
  backing.setAttribute('y',String(visual.backingY));
  backing.setAttribute('width',String(visual.backingWidth));
  backing.setAttribute('height',String(visual.backingHeight));
  backing.setAttribute('rx','2');
  backing.setAttribute('fill','#52677b');
  backing.setAttribute('stroke','#9fb0c0');
  backing.setAttribute('stroke-width','1.5');
  backing.setAttribute('data-role','target-backing');

  group.setAttribute('data-role',visual.role);
  group.setAttribute('data-topology',visual.topology);
}

export function initPrimaryCollimatorGraphics(){
  const pieces=[...document.querySelectorAll('#photonHead .primaryColl')];
  if(pieces.length<2)return;

  const visual=primaryCollimatorVisualState();
  pieces[0].setAttribute('d',visual.leftPath);
  pieces[1].setAttribute('d',visual.rightPath);

  pieces.forEach((piece,index)=>{
    piece.setAttribute('data-role',visual.role);
    piece.setAttribute('data-aperture-topology',visual.apertureTopology);
    piece.setAttribute('data-side',index===0?'left':'right');
  });

  const group=document.querySelector('#photonHead');
  group?.setAttribute('data-primary-collimator',visual.apertureTopology);
}
