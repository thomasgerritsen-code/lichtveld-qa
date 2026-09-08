import {photonProfiles,electronProfile,virtualEpid} from './detector.js?v=5';
import {SOURCES,CLAIMS,sourceById} from './sources.js?v=5';

const NS='http://www.w3.org/2000/svg';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const pathFrom=(pts,w=300,h=130,pad=14)=>{
  return pts.map((p,i)=>{
    const x=pad+(p.x+1)/2*(w-2*pad);
    const y=h-pad-p.y*(h-2*pad);
    return (i?'L ':'M ')+x.toFixed(1)+' '+y.toFixed(1);
  }).join(' ');
};

function makeSvgPath(svg,id,cls){
  const p=document.createElementNS(NS,'path');p.id=id;p.setAttribute('class',cls);svg.appendChild(p);return p;
}
function makeText(svg,x,y,text,cls='diagLabel'){
  const t=document.createElementNS(NS,'text');t.setAttribute('x',x);t.setAttribute('y',y);t.setAttribute('class',cls);t.textContent=text;svg.appendChild(t);return t;
}

export function initDiagnostics(){
  const viewer=document.querySelector('.layout > section');

  const planeCard=document.createElement('article');
  planeCard.className='panelCard diagnosticsCard';
  planeCard.innerHTML=`<div class="metricsHead"><div><strong>Radial + transverse beam views</strong><span>Centroid, 1σ/2σ envelope en lokale hoek</span></div><span class="metricsNote">4D gekoppeld model</span></div>
  <div class="planeGrid">
    <div><h4>Radial R / R′</h4><svg id="radialPlane" viewBox="0 0 520 180"></svg></div>
    <div><h4>Transverse T / T′</h4><svg id="transversePlane" viewBox="0 0 520 180"></svg></div>
  </div>`;
  viewer.appendChild(planeCard);

  const profileCard=document.createElement('article');
  profileCard.className='panelCard diagnosticsCard';
  profileCard.innerHTML=`<div class="metricsHead"><div><strong>Behandelbundel + monitor chamber</strong><span>Relatief profiel, focal-spot koppeling en virtuele feedback</span></div><span class="metricsNote">geen dosisberekening</span></div>
  <div class="profileGrid">
    <div class="profilePane"><h4 id="profileTitleR">Radial profile</h4><svg id="profileR" viewBox="0 0 340 160"></svg></div>
    <div class="profilePane"><h4 id="profileTitleT">Transverse profile</h4><svg id="profileT" viewBox="0 0 340 160"></svg></div>
    <div class="signalPane">
      <div class="signalGrid">
        <div><small>Dose A</small><strong id="doseA">1.000</strong></div>
        <div><small>Dose B</small><strong id="doseB">1.000</strong></div>
        <div><small>Radial tilt</small><strong id="radialTilt">0.000</strong></div>
        <div><small>Transverse tilt</small><strong id="transverseTilt">0.000</strong></div>
        <div><small>Field center R/T</small><strong id="fieldCenter">0.000 / 0.000</strong></div>
        <div><small>Symmetry R/T</small><strong id="fieldSymmetry">0.0 / 0.0</strong></div>
      </div>
      <div class="controlBreakdown">
        <strong>2R/2T control breakdown</strong>
        <div><span>Set</span><b id="setBreakdown">0.000 / 0.000</b></div>
        <div><span>LUT</span><b id="lutBreakdown">0.000 / 0.000</b></div>
        <div><span>Servo</span><b id="servoBreakdown">0.000 / 0.000</b></div>
      </div>
    </div>
  </div>`;
  viewer.appendChild(profileCard);

  const qaCard=document.createElement('article');
  qaCard.className='panelCard diagnosticsCard';
  qaCard.innerHTML=`<div class="metricsHead"><div><strong>Virtuele EPID / focal-spot QA</strong><span>Geometrisch onderwijsbeeld van MLC- en diaphragm-centra</span></div><label class="qaToggle"><input id="qaToggle" type="checkbox"> QA-overlay</label></div>
    <div class="qaGrid">
      <svg id="epidSvg" viewBox="0 0 420 300">
        <rect x="45" y="35" width="330" height="230" rx="8" class="epidPanel"/>
        <line x1="210" y1="35" x2="210" y2="265" class="epidAxis"/><line x1="45" y1="150" x2="375" y2="150" class="epidAxis"/>
        <rect id="epidField" x="110" y="85" width="200" height="130" class="epidField"/>
        <circle id="epidMlc" cx="210" cy="150" r="7" class="epidMlc"/><circle id="epidJaw" cx="210" cy="150" r="7" class="epidJaw"/>
        <circle id="epidFocal" cx="210" cy="150" r="4" class="epidFocal"/>
        <text x="58" y="58" class="diagLabel">MLC centre</text><text x="58" y="76" class="diagLabel2">Diaphragm centre</text>
      </svg>
      <div class="qaReadout">
        <div><small>Relatieve focal-spot offset</small><strong id="qaFocal">0.000</strong></div>
        <div><small>MLC ↔ diaphragm separation</small><strong id="qaSep">0.000</strong></div>
        <p>Dit is alleen een geometrisch principebeeld. Er worden geen klinische toleranties, meetprocedures of kalibratiewaarden gebruikt.</p>
      </div>
    </div>`;
  viewer.appendChild(qaCard);

  const sourceCard=document.createElement('article');
  sourceCard.className='panelCard diagnosticsCard sourceAuditCard';
  sourceCard.innerHTML=`<div class="metricsHead"><div><strong>Bron-audit en confidence</strong><span>Machinefamilie, bronsoort en modelgrens per claim</span></div></div><div id="sourceAudit" class="sourceAudit"></div>`;
  viewer.appendChild(sourceCard);

  const qaToggle=qaCard.querySelector('#qaToggle');
  qaToggle.addEventListener('change',()=>qaCard.querySelector('#epidSvg').classList.toggle('qaActive',qaToggle.checked));

  function renderPlane(svg,stages,axis){
    svg.innerHTML='';
    const w=520,h=180,pad=28;
    const vals=stages.map((s,i)=>({
      x:i/(stages.length-1),
      c:axis==='r'?s.r:s.t,
      sig:axis==='r'?s.sigmaR:s.sigmaT
    }));
    const max=Math.max(.03,...vals.map(v=>Math.abs(v.c)+2*v.sig));
    const X=f=>pad+f*(w-2*pad),Y=v=>h/2-v/max*(h/2-pad);
    const upper2=[],lower2=[],upper1=[],lower1=[],center=[];
    vals.forEach(v=>{center.push([X(v.x),Y(v.c)]);upper1.push([X(v.x),Y(v.c+v.sig)]);lower1.push([X(v.x),Y(v.c-v.sig)]);upper2.push([X(v.x),Y(v.c+2*v.sig)]);lower2.push([X(v.x),Y(v.c-2*v.sig)]);});
    const poly=(a,b)=>a.concat([...b].reverse()).map(p=>p.join(',')).join(' ');
    const p2=document.createElementNS(NS,'polygon');p2.setAttribute('points',poly(upper2,lower2));p2.setAttribute('class','env2');svg.appendChild(p2);
    const p1=document.createElementNS(NS,'polygon');p1.setAttribute('points',poly(upper1,lower1));p1.setAttribute('class','env1');svg.appendChild(p1);
    const axisLine=document.createElementNS(NS,'line');axisLine.setAttribute('x1',pad);axisLine.setAttribute('x2',w-pad);axisLine.setAttribute('y1',h/2);axisLine.setAttribute('y2',h/2);axisLine.setAttribute('class','planeAxis');svg.appendChild(axisLine);
    const cpath=document.createElementNS(NS,'path');cpath.setAttribute('d',center.map((p,i)=>(i?'L ':'M ')+p[0]+' '+p[1]).join(' '));cpath.setAttribute('class','planeCentroid');svg.appendChild(cpath);
    const picks=[0,1,2,3,4,5,6,7,8,9].filter(i=>i<stages.length);
    picks.forEach(i=>{const x=X(i/(stages.length-1));const l=document.createElementNS(NS,'line');l.setAttribute('x1',x);l.setAttribute('x2',x);l.setAttribute('y1',h-pad+4);l.setAttribute('y2',h-pad+9);l.setAttribute('class','planeTick');svg.appendChild(l);});
    makeText(svg,8,18,'2σ','diagLabel2');makeText(svg,8,34,'1σ','diagLabel2');
  }

  function renderProfile(svg,pts){
    svg.innerHTML='';
    const axis=document.createElementNS(NS,'line');axis.setAttribute('x1',14);axis.setAttribute('x2',326);axis.setAttribute('y1',146);axis.setAttribute('y2',146);axis.setAttribute('class','profileAxis');svg.appendChild(axis);
    const p=makeSvgPath(svg,'','profileLine');p.setAttribute('d',pathFrom(pts,340,160,14));
  }

  function renderSources(){
    const host=sourceCard.querySelector('#sourceAudit');
    host.innerHTML=Object.values(CLAIMS).map(claim=>{
      const src=claim.sourceIds.map(id=>sourceById(id)).filter(Boolean);
      return `<details><summary><span>${claim.label}</span><b class="confidence ${claim.confidence}">${claim.confidence}</b></summary>
        <div class="claimBody">${claim.note?`<p>${claim.note}</p>`:''}
          ${src.map(s=>`<a href="${s.url}" target="_blank" rel="noopener"><strong>${s.title}</strong><span>${s.type} · ${s.scope}</span></a>`).join('')}
        </div></details>`;
    }).join('');
  }
  renderSources();

  return {
    update({sim,params,mode,filter,chamber,control}){
      renderPlane(planeCard.querySelector('#radialPlane'),sim.stages,'r');
      renderPlane(planeCard.querySelector('#transversePlane'),sim.stages,'t');

      if(mode==='photon'){
        const p=photonProfiles(sim,params,filter);
        renderProfile(profileCard.querySelector('#profileR'),p.radial);
        renderProfile(profileCard.querySelector('#profileT'),p.transverse);
        profileCard.querySelector('#profileTitleR').textContent=`Radial photon profile · ${filter.toUpperCase()}`;
        profileCard.querySelector('#profileTitleT').textContent=`Transverse photon profile · ${filter.toUpperCase()}`;
        profileCard.querySelector('#fieldCenter').textContent=`${p.centerR.toFixed(3)} / ${p.centerT.toFixed(3)}`;
        profileCard.querySelector('#fieldSymmetry').textContent=`${p.symmetryR.toFixed(1)} / ${p.symmetryT.toFixed(1)}`;
      }else{
        const e=electronProfile(sim,params);
        renderProfile(profileCard.querySelector('#profileR'),e.profile);
        renderProfile(profileCard.querySelector('#profileT'),e.profile);
        profileCard.querySelector('#profileTitleR').textContent='Electron fluence · scattering model';
        profileCard.querySelector('#profileTitleT').textContent='Electron fluence · applicator model';
        profileCard.querySelector('#fieldCenter').textContent=`0.000 / ${e.center.toFixed(3)}`;
        profileCard.querySelector('#fieldSymmetry').textContent='n.v.t.';
      }

      profileCard.querySelector('#doseA').textContent=chamber.doseA.toFixed(3);
      profileCard.querySelector('#doseB').textContent=chamber.doseB.toFixed(3);
      profileCard.querySelector('#radialTilt').textContent=chamber.radialTilt.toFixed(3);
      profileCard.querySelector('#transverseTilt').textContent=chamber.transverseTilt.toFixed(3);
      profileCard.querySelector('#setBreakdown').textContent=`${params.r2.toFixed(3)} / ${params.t2.toFixed(3)}`;
      profileCard.querySelector('#lutBreakdown').textContent=`${control.lut.r2.toFixed(3)} / ${control.lut.t2.toFixed(3)}`;
      profileCard.querySelector('#servoBreakdown').textContent=`${control.servo.r2.toFixed(3)} / ${control.servo.t2.toFixed(3)}`;

      const q=virtualEpid(sim,params);
      const mapX=v=>210+v*260,mapY=v=>150+v*190;
      qaCard.querySelector('#epidMlc').setAttribute('cx',mapX(q.mlcCenter.x));qaCard.querySelector('#epidMlc').setAttribute('cy',mapY(q.mlcCenter.y));
      qaCard.querySelector('#epidJaw').setAttribute('cx',mapX(q.diaphragmCenter.x));qaCard.querySelector('#epidJaw').setAttribute('cy',mapY(q.diaphragmCenter.y));
      qaCard.querySelector('#epidFocal').setAttribute('cx',mapX(q.focal.x));qaCard.querySelector('#epidFocal').setAttribute('cy',mapY(q.focal.y));
      const fw=250*q.field.x,fh=180*q.field.y;
      const field=qaCard.querySelector('#epidField');field.setAttribute('x',210-fw/2);field.setAttribute('y',150-fh/2);field.setAttribute('width',fw);field.setAttribute('height',fh);
      qaCard.querySelector('#qaFocal').textContent=Math.hypot(q.focal.x,q.focal.y).toFixed(3);
      qaCard.querySelector('#qaSep').textContent=q.separation.toFixed(3);
      qaCard.querySelector('#epidSvg').classList.toggle('qaActive',qaToggle.checked);
    },
    isQaActive(){return qaToggle.checked;}
  };
}
