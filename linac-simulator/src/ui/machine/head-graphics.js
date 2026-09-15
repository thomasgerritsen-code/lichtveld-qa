const SVG_NS='http://www.w3.org/2000/svg';

export function treatmentHeadHousingVisualState(){
  // Public IAEA material supports a treatment head enclosing the target/primary
  // collimation, filtering/scattering, monitor and downstream beam-shaping chain.
  // This is a normalized cutaway silhouette only: no OEM shielding thicknesses,
  // service dimensions, clearances or proprietary internal geometry are implied.
  return {
    role:'treatment-head-housing',
    topology:'flight-tube-neck-to-collimation-stack',
    center:1450,
    neck:{x:1418,y:724,width:64,height:38},
    upperBodyPath:'M1362 746 Q1362 728 1382 718 H1518 Q1538 728 1538 746 V918 Q1538 934 1524 942 H1376 Q1362 934 1362 918 Z',
    lowerBodyPath:'M1340 938 H1560 L1582 1030 Q1586 1048 1568 1056 H1332 Q1314 1048 1318 1030 Z'
  };
}

export function initTreatmentHeadHousingGraphics(){
  const anchor=document.querySelector('[data-part="head"]');
  if(!anchor||document.querySelector('#treatmentHeadHousing'))return;
  const visual=treatmentHeadHousingVisualState();
  const group=document.createElementNS(SVG_NS,'g');
  group.id='treatmentHeadHousing';
  group.setAttribute('data-role',visual.role);
  group.setAttribute('data-topology',visual.topology);
  group.setAttribute('data-geometry','normalized-educational');
  group.setAttribute('pointer-events','none');

  const upper=document.createElementNS(SVG_NS,'path');
  upper.setAttribute('d',visual.upperBodyPath);
  upper.setAttribute('fill','#1d2c36');
  upper.setAttribute('fill-opacity','.46');
  upper.setAttribute('stroke','#718797');
  upper.setAttribute('stroke-width','3');
  group.appendChild(upper);

  const lower=document.createElementNS(SVG_NS,'path');
  lower.setAttribute('d',visual.lowerBodyPath);
  lower.setAttribute('fill','#17252e');
  lower.setAttribute('fill-opacity','.42');
  lower.setAttribute('stroke','#718797');
  lower.setAttribute('stroke-width','3');
  group.appendChild(lower);

  const neck=document.createElementNS(SVG_NS,'rect');
  neck.setAttribute('x',String(visual.neck.x));
  neck.setAttribute('y',String(visual.neck.y));
  neck.setAttribute('width',String(visual.neck.width));
  neck.setAttribute('height',String(visual.neck.height));
  neck.setAttribute('rx','8');
  neck.setAttribute('fill','#253945');
  neck.setAttribute('stroke','#8fa3b2');
  neck.setAttribute('stroke-width','3');
  group.appendChild(neck);

  // Put the enclosure behind the existing target/window/head internals so this
  // visual layer cannot replace their DOM hooks, mode switching or physics state.
  anchor.parentNode?.insertBefore(group,anchor);
}

export function primaryCollimatorVisualState(){
  const center=1450,top=792,bottom=837,outerLeft=1352,outerRight=1548,apertureTopHalf=17,apertureBottomHalf=39;
  const leftInnerTop=center-apertureTopHalf,leftInnerBottom=center-apertureBottomHalf,rightInnerTop=center+apertureTopHalf,rightInnerBottom=center+apertureBottomHalf;
  return {role:'fixed-primary-collimator',apertureTopology:'downstream-diverging-conical',center,top,bottom,apertureTopHalf,apertureBottomHalf,leftPath:`M${outerLeft} ${top} H${leftInnerTop} L${leftInnerBottom} ${bottom} H${outerLeft} Z`,rightPath:`M${outerRight} ${top} H${rightInnerTop} L${rightInnerBottom} ${bottom} H${outerRight} Z`};
}
export function targetAssemblyVisualState(){const center=1450,faceY=760,faceWidth=34,faceHeight=6,backingWidth=54,backingHeight=7,backingY=faceY+faceHeight,primaryTop=792;return {role:'photon-target-assembly',topology:'thin-target-with-backing-upstream-of-primary-collimator',center,faceY,faceWidth,faceHeight,backingWidth,backingHeight,backingY,primaryTop,faceX:center-faceWidth/2,backingX:center-backingWidth/2,downstreamClearance:primaryTop-(backingY+backingHeight)};}
export function electronWindowVisualState(){const center=1450,membraneY=768,membraneWidth=44,membraneHeight=3,frameWidth=70,frameHeight=11,frameY=membraneY-frameHeight/2;return {role:'electron-vacuum-exit-window',topology:'thin-membrane-in-support-frame-upstream-of-scattering-foils',center,membraneY,membraneWidth,membraneHeight,membraneX:center-membraneWidth/2,frameWidth,frameHeight,frameX:center-frameWidth/2,frameY,membraneRole:'electron-window-membrane',frameRole:'electron-window-support',scatteringFoilY:852,downstreamSeparation:852-(membraneY+membraneHeight/2)};}
export function electronScatteringFoilVisualState(){const center=1450,primaryY=851,primaryHalfWidth=35,secondaryY=889,secondaryHalfWidth=39,secondaryDepth=10;return {role:'electron-dual-scattering-foil-system',topology:'thin-primary-foil-followed-by-shaped-secondary-foil',center,primary:{role:'primary-electron-scattering-foil',x1:center-primaryHalfWidth,x2:center+primaryHalfWidth,y:primaryY},secondary:{role:'secondary-electron-scattering-foil',path:`M${center-secondaryHalfWidth} ${secondaryY} Q${center} ${secondaryY+secondaryDepth} ${center+secondaryHalfWidth} ${secondaryY} Q${center} ${secondaryY+secondaryDepth*.35} ${center-secondaryHalfWidth} ${secondaryY} Z`,y:secondaryY},ordering:['electron-window','primary-scattering-foil','secondary-scattering-foil','monitor-chamber']};}
export function opticalFieldVisualState(){const center=1450,mirrorLeft={x:1399,y:944},mirrorRight={x:1501,y:962},thickness=4,lamp={cx:1542,cy:944,r:9};const mirrorPath=[`M${mirrorLeft.x} ${mirrorLeft.y}`,`L${mirrorRight.x} ${mirrorRight.y}`,`L${mirrorRight.x} ${mirrorRight.y+thickness}`,`L${mirrorLeft.x} ${mirrorLeft.y+thickness}`,'Z'].join(' ');return {role:'optical-field-system',topology:'tilted-field-mirror-with-off-axis-lamp',center,mirrorLeft,mirrorRight,mirrorPath,lamp,mirrorRole:'field-light-mirror',lampRole:'field-light-lamp',mirrorCrossesBeamAxis:true,lampOffsetFromAxis:lamp.cx-center};}
function replaceWithPath(element){if(!element||element.tagName?.toLowerCase()==='path')return element;const path=document.createElementNS(SVG_NS,'path');for(const {name,value} of element.attributes)path.setAttribute(name,value);for(const attribute of ['x1','x2','y1','y2'])path.removeAttribute(attribute);element.replaceWith(path);return path;}
function initElectronScatteringFoilGraphics(){const group=document.querySelector('#electronHead');if(!group)return;const visual=electronScatteringFoilVisualState(),primary=group.querySelector('.foil'),secondary=group.querySelector('.foil2');if(primary){primary.setAttribute('x1',String(visual.primary.x1));primary.setAttribute('x2',String(visual.primary.x2));primary.setAttribute('y1',String(visual.primary.y));primary.setAttribute('y2',String(visual.primary.y));primary.setAttribute('data-role',visual.primary.role);primary.setAttribute('stroke-width','2.4');}if(secondary){const path=replaceWithPath(secondary);path?.setAttribute('d',visual.secondary.path);path?.setAttribute('data-role',visual.secondary.role);path?.setAttribute('fill','#7fd9e8');path?.setAttribute('fill-opacity','.28');path?.setAttribute('stroke','#9de8f2');path?.setAttribute('stroke-width','1.6');}group.setAttribute('data-role',visual.role);group.setAttribute('data-topology',visual.topology);}
export function initElectronWindowGraphics(){const group=document.querySelector('#electronWindow');if(!group)return;const visual=electronWindowVisualState();group.querySelector('.electronWindow')?.remove();let frame=group.querySelector('[data-role="electron-window-support"]');if(!frame){frame=document.createElementNS(SVG_NS,'rect');frame.setAttribute('class','electronWindowSupport');group.insertBefore(frame,group.firstChild);}for(const [k,v] of Object.entries({x:visual.frameX,y:visual.frameY,width:visual.frameWidth,height:visual.frameHeight,rx:3,fill:'#465a6d',stroke:'#9fb0c0','stroke-width':1.4,'data-role':visual.frameRole}))frame.setAttribute(k,String(v));let membrane=group.querySelector('[data-role="electron-window-membrane"]');if(!membrane){membrane=document.createElementNS(SVG_NS,'rect');membrane.setAttribute('class','electronWindowMembrane');group.insertBefore(membrane,group.querySelector('.portLabel'));}for(const [k,v] of Object.entries({x:visual.membraneX,y:visual.membraneY-visual.membraneHeight/2,width:visual.membraneWidth,height:visual.membraneHeight,rx:1,fill:'#d9dfe5',stroke:'#f2f5f7','stroke-width':.8,'data-role':visual.membraneRole}))membrane.setAttribute(k,String(v));group.setAttribute('data-role',visual.role);group.setAttribute('data-topology',visual.topology);initElectronScatteringFoilGraphics();}
export function initOpticalFieldGraphics(){const group=document.querySelector('[data-part="mirror"]');if(!group)return;const visual=opticalFieldVisualState(),mirror=replaceWithPath(group.querySelector('.mirror'));if(mirror){mirror.setAttribute('d',visual.mirrorPath);mirror.setAttribute('data-role',visual.mirrorRole);mirror.setAttribute('fill','#bfe8ef');mirror.setAttribute('fill-opacity','.34');mirror.setAttribute('stroke','#d7f3f6');mirror.setAttribute('stroke-width','1.6');}let lamp=group.querySelector('[data-role="field-light-lamp"]');if(!lamp){lamp=document.createElementNS(SVG_NS,'circle');lamp.setAttribute('class','fieldLightLamp');group.appendChild(lamp);}for(const [k,v] of Object.entries({cx:visual.lamp.cx,cy:visual.lamp.cy,r:visual.lamp.r,'data-role':visual.lampRole,fill:'#f3d47a','fill-opacity':.82,stroke:'#ffe6a2','stroke-width':1.6}))lamp.setAttribute(k,String(v));group.setAttribute('data-role',visual.role);group.setAttribute('data-topology',visual.topology);}
export function initTargetAssemblyGraphics(){const group=document.querySelector('#photonTarget'),face=group?.querySelector('.target');if(!group||!face)return;const visual=targetAssemblyVisualState();for(const [k,v] of Object.entries({x:visual.faceX,y:visual.faceY,width:visual.faceWidth,height:visual.faceHeight,rx:1.5,'data-role':'x-ray-target-face'}))face.setAttribute(k,String(v));let backing=group.querySelector('.targetBacking');if(!backing){backing=document.createElementNS(SVG_NS,'rect');backing.setAttribute('class','targetBacking');group.insertBefore(backing,face.nextSibling);}for(const [k,v] of Object.entries({x:visual.backingX,y:visual.backingY,width:visual.backingWidth,height:visual.backingHeight,rx:2,fill:'#52677b',stroke:'#9fb0c0','stroke-width':1.5,'data-role':'target-backing'}))backing.setAttribute(k,String(v));group.setAttribute('data-role',visual.role);group.setAttribute('data-topology',visual.topology);}
export function initPrimaryCollimatorGraphics(){const pieces=[...document.querySelectorAll('#photonHead .primaryColl')];if(pieces.length<2)return;const visual=primaryCollimatorVisualState();pieces[0].setAttribute('d',visual.leftPath);pieces[1].setAttribute('d',visual.rightPath);pieces.forEach((piece,index)=>{piece.setAttribute('data-role',visual.role);piece.setAttribute('data-aperture-topology',visual.apertureTopology);piece.setAttribute('data-side',index===0?'left':'right');});const group=document.querySelector('#photonHead');group?.setAttribute('data-primary-collimator',visual.apertureTopology);}
