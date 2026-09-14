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
