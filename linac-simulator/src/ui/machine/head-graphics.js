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
