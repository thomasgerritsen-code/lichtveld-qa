import {photonProfiles,electronProfile} from '../physics/detector.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function thresholdCrossing(points,threshold){
  const right=points.filter(point=>point.x>=0);
  for(let i=1;i<right.length;i++){
    const a=right[i-1],b=right[i];
    if((a.y-threshold)*(b.y-threshold)<=0&&a.y!==b.y){
      const t=(threshold-a.y)/(b.y-a.y);
      return a.x+(b.x-a.x)*t;
    }
  }
  return right.at(-1)?.x??1;
}

export function relativeEdgeWidth(points){
  if(!Array.isArray(points)||points.length<2)return 0;
  const x80=thresholdCrossing(points,.8);
  const x20=thresholdCrossing(points,.2);
  return Math.max(0,x20-x80);
}

export function patientPlaneVisualState({sim,params,view,radiation,delivery}){
  const mode=view?.mode==='electron'?'electron':'photon';
  const filter=view?.filter==='fff'?'fff':'ff';
  const active=Boolean(delivery?.radiationActive);
  const fieldXcm=clamp(Number(params?.fieldXcm)||10,1,40);
  const fieldYcm=clamp(Number(params?.fieldYcm)||10,1,40);

  const profiles=mode==='photon'
    ?photonProfiles(sim,params,filter)
    :electronProfile(sim,params);
  const radial=profiles.radial;
  const transverse=profiles.transverse;

  const centerR=clamp(profiles.centerR??0,-.25,.25);
  const centerT=clamp(profiles.centerT??0,-.25,.25);
  const primary=active?clamp(radiation?.primaryTransmission??0,0,1):0;
  const patientOutput=active?clamp(delivery?.relativePatientOutput??0,0,1.4):0;
  const scatter=active?clamp(radiation?.scatterFraction??0,0,1):0;
  const electronScatter=mode==='electron'&&active
    ?clamp(radiation?.electronScatterFraction??0,0,1)
    :0;
  const photonContamination=mode==='electron'&&active
    ?clamp(radiation?.electronPhotonContaminationFraction??0,0,1)
    :0;

  return {
    mode,
    filter,
    active,
    fieldXcm,
    fieldYcm,
    fieldWidth:70+250*(fieldXcm/40),
    fieldHeight:52+178*(fieldYcm/40),
    centerX:210+centerT*170,
    centerY:145+centerR*120,
    centerR,
    centerT,
    primary,
    patientOutput,
    scatter,
    electronScatter,
    photonContamination,
    radialEdgeWidth:relativeEdgeWidth(radial),
    transverseEdgeWidth:relativeEdgeWidth(transverse),
    profileLabel:mode==='electron'
      ?'Applicator-shaped electron fluence'
      :filter==='fff'
        ?'FFF · central-peaked profile'
        :'FF · flattened profile',
    note:mode==='electron'
      ?'Halo = genormaliseerde applicator/head scatter; kleine photon-component wordt apart getoond.'
      :filter==='fff'
        ?'FFF toont kwalitatief een sterkere centrale piek en minder head scatter dan FF.'
        :'FF toont kwalitatief een vlakker centraal profiel met relatief meer head scatter.'
  };
}

export function headToIsocentreProjectionState(state){
  // Source-backed topology only: treatment-head collimation defines a diverging
  // field about the central beam axis and the useful beam intersects the
  // isocentre/patient plane downstream. All coordinates below are normalized
  // illustration geometry; they are not Elekta distances, SAD values or
  // proprietary head dimensions.
  const headY=76;
  const apertureY=112;
  const isocentreY=250;
  const axisX=210;
  const apertureHalfWidth=12+40*(state.fieldXcm/40);
  const isoHalfWidth=35+125*(state.fieldXcm/40);
  const steeringShift=state.centerT*92;
  const isoCenterX=axisX+steeringShift;
  const leftIso=isoCenterX-isoHalfWidth;
  const rightIso=isoCenterX+isoHalfWidth;

  return {
    headY,
    apertureY,
    isocentreY,
    axisX,
    apertureHalfWidth,
    isoHalfWidth,
    isoCenterX,
    leftIso,
    rightIso,
    sourceLabel:state.mode==='electron'?'electron scattering / collimation':'target / photon source proxy',
    apertureLabel:state.mode==='electron'?'electron field definition':'Agility MLC + diaphragms',
    projectionLabel:'schematic · normalized · not to scale'
  };
}

function addStylesheet(){
  if(document.querySelector('link[data-patient-plane-style]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='./patient-plane.css?v=2';
  link.dataset.patientPlaneStyle='1';
  document.head.appendChild(link);
}

function setText(root,selector,value){
  const node=root.querySelector(selector);
  if(node)node.textContent=value;
}

function setAttr(root,selector,name,value){
  const node=root.querySelector(selector);
  if(node)node.setAttribute(name,String(value));
}

function buildCard(){
  const card=document.createElement('article');
  card.className='panelCard diagnosticsCard patientPlaneCard';
  card.innerHTML=`<div class="metricsHead"><div><strong>Head → isocentre → patient plane</strong><span>Ruimtelijke golden-path projectie plus genormaliseerde veld- en profielrespons</span></div><span class="metricsNote">educatief · geen dosisberekening</span></div>
    <div class="patientPlaneGrid">
      <div class="patientPlaneVisuals">
        <svg class="patientProjectionSvg" viewBox="0 0 420 285" role="img" aria-label="Schematische projectie van treatment head naar isocentre">
          <defs>
            <linearGradient id="projectionPhotonCone" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffe28a" stop-opacity=".18"/><stop offset="1" stop-color="#e7c45d" stop-opacity=".48"/></linearGradient>
            <linearGradient id="projectionElectronCone" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#a7f0ff" stop-opacity=".18"/><stop offset="1" stop-color="#63ddff" stop-opacity=".42"/></linearGradient>
          </defs>
          <rect x="122" y="24" width="176" height="66" rx="13" class="projectionHead"/>
          <text x="210" y="48" text-anchor="middle" class="projectionHeadTitle">TREATMENT HEAD</text>
          <text id="projectionSourceLabel" x="210" y="69" text-anchor="middle" class="projectionSubLabel">target / photon source proxy</text>
          <rect id="projectionAperture" x="178" y="102" width="64" height="20" rx="4" class="projectionAperture"/>
          <text id="projectionApertureLabel" x="210" y="139" text-anchor="middle" class="projectionSubLabel">Agility MLC + diaphragms</text>
          <path id="projectionCone" d="M178 122 L80 250 L340 250 L242 122 Z" class="projectionCone"/>
          <line id="projectionAxis" x1="210" y1="78" x2="210" y2="250" class="projectionAxis"/>
          <line x1="52" y1="250" x2="368" y2="250" class="projectionIsocentrePlane"/>
          <circle id="projectionIsocentre" cx="210" cy="250" r="6" class="projectionIsocentre"/>
          <text x="58" y="240" class="projectionLabel">isocentre / patient plane</text>
          <text id="projectionScaleNote" x="58" y="273" class="projectionScaleNote">schematic · normalized · not to scale</text>
        </svg>

        <svg class="patientPlaneSvg" viewBox="0 0 420 290" role="img" aria-label="Genormaliseerde patient-plane bundelweergave">
          <defs>
            <radialGradient id="patientFffGradient"><stop offset="0" stop-color="#ffe28a" stop-opacity=".92"/><stop offset=".62" stop-color="#f2c55b" stop-opacity=".52"/><stop offset="1" stop-color="#dca838" stop-opacity=".22"/></radialGradient>
            <radialGradient id="patientElectronGradient"><stop offset="0" stop-color="#a7f0ff" stop-opacity=".86"/><stop offset=".72" stop-color="#63ddff" stop-opacity=".48"/><stop offset="1" stop-color="#2c9dc0" stop-opacity=".20"/></radialGradient>
          </defs>
          <rect x="28" y="20" width="364" height="250" rx="14" class="patientPlaneSurface"/>
          <ellipse id="patientScatterHalo" cx="210" cy="145" rx="154" ry="108" class="patientScatterHalo"/>
          <rect id="patientFieldShape" x="120" y="85" width="180" height="120" rx="5" class="patientFieldShape"/>
          <line x1="210" y1="30" x2="210" y2="260" class="patientPlaneAxis"/>
          <line x1="38" y1="145" x2="382" y2="145" class="patientPlaneAxis"/>
          <circle id="patientBeamCenter" cx="210" cy="145" r="6" class="patientBeamCenter"/>
          <text x="42" y="45" class="patientPlaneLabel">Patient plane · normalized top view</text>
          <text id="patientFieldLabel" x="42" y="248" class="patientPlaneLabel2">10.0 × 10.0 cm</text>
        </svg>
      </div>
      <div class="patientPlaneReadout">
        <div><small>Beam profile</small><strong id="patientProfileLabel">—</strong></div>
        <div><small>Useful primary</small><strong id="patientPrimaryOut">0%</strong></div>
        <div><small>Patient output proxy</small><strong id="patientRelativeOutput">0.000 rel.</strong></div>
        <div><small>Total secondary / scatter</small><strong id="patientScatterOut">0.0%</strong></div>
        <div><small>Edge width R / T</small><strong id="patientEdgeOut">0.000 / 0.000 rel.</strong></div>
        <div><small>Projection</small><strong id="patientProjectionOut">10.0 cm → isocentre</strong></div>
        <div id="patientElectronComponents" class="patientElectronComponents"><small>Electron scatter / photon component</small><strong id="patientElectronOut">0.0% / 0.0%</strong></div>
        <p id="patientPlaneNote"></p>
      </div>
    </div>`;
  return card;
}

export function initPatientPlane(controller){
  addStylesheet();
  const viewer=document.querySelector('.layout > section');
  if(!viewer||document.querySelector('.patientPlaneCard'))return null;
  const card=buildCard();
  viewer.appendChild(card);

  const field=card.querySelector('#patientFieldShape');
  const halo=card.querySelector('#patientScatterHalo');
  const aperture=card.querySelector('#projectionAperture');
  const cone=card.querySelector('#projectionCone');
  const axis=card.querySelector('#projectionAxis');
  const isoMarker=card.querySelector('#projectionIsocentre');

  const update=()=>{
    const result=window.linacSimulator;
    if(!result?.sim||!result?.params||!result?.view)return;
    const state=patientPlaneVisualState(result);
    const projection=headToIsocentreProjectionState(state);
    const w=state.fieldWidth,h=state.fieldHeight;
    field.setAttribute('x',(210-w/2).toFixed(1));
    field.setAttribute('y',(145-h/2).toFixed(1));
    field.setAttribute('width',w.toFixed(1));
    field.setAttribute('height',h.toFixed(1));
    field.classList.toggle('fff',state.mode==='photon'&&state.filter==='fff');
    field.classList.toggle('electron',state.mode==='electron');
    field.style.opacity=state.active?String(.28+.62*Math.min(1,state.patientOutput)):'0.08';

    halo.style.opacity=state.active?String(clamp(.10+state.scatter*2.2,.10,.58)):'0';
    halo.classList.toggle('electron',state.mode==='electron');
    setAttr(card,'#patientBeamCenter','cx',state.centerX.toFixed(1));
    setAttr(card,'#patientBeamCenter','cy',state.centerY.toFixed(1));

    const apertureX=projection.axisX-projection.apertureHalfWidth;
    aperture.setAttribute('x',apertureX.toFixed(1));
    aperture.setAttribute('width',(projection.apertureHalfWidth*2).toFixed(1));
    cone.setAttribute('d',`M${apertureX.toFixed(1)} ${projection.apertureY} L${projection.leftIso.toFixed(1)} ${projection.isocentreY} L${projection.rightIso.toFixed(1)} ${projection.isocentreY} L${(projection.axisX+projection.apertureHalfWidth).toFixed(1)} ${projection.apertureY} Z`);
    cone.classList.toggle('electron',state.mode==='electron');
    cone.style.opacity=state.active?String(.28+.52*Math.min(1,state.patientOutput)):'0.08';
    axis.setAttribute('x2',projection.isoCenterX.toFixed(1));
    isoMarker.setAttribute('cx',projection.isoCenterX.toFixed(1));

    setText(card,'#projectionSourceLabel',projection.sourceLabel);
    setText(card,'#projectionApertureLabel',projection.apertureLabel);
    setText(card,'#projectionScaleNote',projection.projectionLabel);
    setText(card,'#patientFieldLabel',`${state.fieldXcm.toFixed(1)} × ${state.fieldYcm.toFixed(1)} cm`);
    setText(card,'#patientProfileLabel',state.profileLabel);
    setText(card,'#patientPrimaryOut',(state.primary*100).toFixed(1)+'%');
    setText(card,'#patientRelativeOutput',state.patientOutput.toFixed(3)+' rel.');
    setText(card,'#patientScatterOut',(state.scatter*100).toFixed(1)+'%');
    setText(card,'#patientEdgeOut',`${state.radialEdgeWidth.toFixed(3)} / ${state.transverseEdgeWidth.toFixed(3)} rel.`);
    setText(card,'#patientProjectionOut',`${state.fieldXcm.toFixed(1)} cm X → isocentre`);
    setText(card,'#patientElectronOut',`${(state.electronScatter*100).toFixed(1)}% / ${(state.photonContamination*100).toFixed(1)}%`);
    setText(card,'#patientPlaneNote',state.note+' De zijprojectie toont alleen de brongebaseerde topologie van head-aperture naar isocentre; afstanden en hoeken zijn genormaliseerd en niet op schaal.');
    card.querySelector('#patientElectronComponents').hidden=state.mode!=='electron';
    card.classList.toggle('beamInactive',!state.active);
  };

  controller?.store?.subscribe(update);
  update();
  return {card,update};
}
