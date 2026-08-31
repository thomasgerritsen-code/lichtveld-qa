'use strict';

// Wekelijkse Linac QA uitbreiding: gecombineerd lichtveld + kruisdraad.
// Geen klinische toleranties worden in deze module toegepast; de numerieke
// kruisdraadresultaten zijn meet-/onderzoeksuitvoer en moeten lokaal worden gevalideerd.

const CROSS_STORE_KEY='linac-weekly-crosshair-v1';
let crosshairSnapshot={plus:null,minus:null,updated:null};
let crosshairBusy=false;

function crossEsc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function crossMm(v){return Number.isFinite(v)?`${v>=0?'+':''}${v.toFixed(2)} mm`:'-'}
function crossDeg(v){return Number.isFinite(v)?`${v>=0?'+':''}${v.toFixed(2)}°`:'-'}
function crossAngle(v){return Number.isFinite(v)?`${v.toFixed(2)}°`:'-'}

function loadCrossStore(){
  try{const raw=localStorage.getItem(CROSS_STORE_KEY);if(raw){const d=JSON.parse(raw);crosshairSnapshot={plus:d.plus||null,minus:d.minus||null,updated:d.updated||null}}}catch(e){console.warn('Kruisdraadgegevens konden niet worden hersteld',e)}
}
function saveCrossStore(){
  crosshairSnapshot.updated=new Date().toISOString();
  try{localStorage.setItem(CROSS_STORE_KEY,JSON.stringify(crosshairSnapshot))}catch(e){console.warn('Kruisdraadgegevens konden niet worden opgeslagen',e)}
}
function crosshairDone(){return !!(crosshairSnapshot.plus&&crosshairSnapshot.minus)}

function installCrosshairUi(){
  const back=document.querySelector('.appShell > div:first-child a');
  if(back){back.href='linac-controles.html?v=2';back.textContent='← Linac controles'}
  document.querySelectorAll('.referenceLink').forEach(a=>{a.href='referentieblad_apriltag36h11_v4.svg?v=1';const spans=a.querySelectorAll('span');if(spans.length>=2)spans[1].textContent='Referentieblad V4 openen / printen'});
  const footer=document.querySelector('.appFooter > div:first-child');if(footer)footer.innerHTML='Linac wekelijkse QA <span>•</span> Slimme meetflow v14 <span>•</span> Referentieblad APRILTAG36H11-V4';

  const crossState=document.querySelector('[data-task-state="crosshair"]');
  const crossCard=crossState?.closest('.taskCard');
  if(crossCard){
    crossCard.innerHTML=`
      <div class="taskHeader"><div><h3>Kruisdraadrotatie · automatisch met referentieblad V4</h3><p>G0, C+90 en C−90 · dezelfde AprilTag-kalibratie als de lichtveldmeting</p></div><span class="taskState" data-task-state="crosshair">Open</span></div>
      <p class="noticeText">De centrale zone van referentieblad V4 is blanco. De app bepaalt het echte bladmiddelpunt uit de vier AprilTags en fit daarna de horizontale en verticale optische kruisdraad. Er worden geen nieuwe acceptatiegrenzen toegepast.</p>
      <div class="lightfieldResultGrid">
        <div class="resultTable">
          <div class="resultRow statusRow"><span>C+90 · stap 1</span><strong id="crossPlusStatus" class="badge neutral">Nog niet gemeten</strong></div>
          <div class="resultRow"><span>X (A− / B+)</span><strong id="crossPlusX">-</strong></div>
          <div class="resultRow"><span>Y (G− / T+)</span><strong id="crossPlusY">-</strong></div>
          <div class="resultRow"><span>A–B hoekafwijking</span><strong id="crossPlusH">-</strong></div>
          <div class="resultRow"><span>G–T hoekafwijking</span><strong id="crossPlusV">-</strong></div>
          <div class="resultRow"><span>Onderlinge hoek</span><strong id="crossPlusOrth">-</strong></div>
        </div>
        <div class="resultTable">
          <div class="resultRow statusRow"><span>C−90 · stap 2</span><strong id="crossMinusStatus" class="badge neutral">Nog niet gemeten</strong></div>
          <div class="resultRow"><span>X (A− / B+)</span><strong id="crossMinusX">-</strong></div>
          <div class="resultRow"><span>Y (G− / T+)</span><strong id="crossMinusY">-</strong></div>
          <div class="resultRow"><span>A–B hoekafwijking</span><strong id="crossMinusH">-</strong></div>
          <div class="resultRow"><span>G–T hoekafwijking</span><strong id="crossMinusV">-</strong></div>
          <div class="resultRow"><span>Onderlinge hoek</span><strong id="crossMinusOrth">-</strong></div>
        </div>
      </div>
      <div id="crossCompare" class="pageCard" style="margin:12px 0 0;padding:14px;box-shadow:none" hidden>
        <strong>Vergelijking C+90 ↔ C−90</strong>
        <div class="formGrid threeCol" style="margin-top:10px"><div><small>ΔX</small><div id="crossDeltaX">-</div></div><div><small>ΔY</small><div id="crossDeltaY">-</div></div><div><small>Verschuiving snijpunt</small><div id="crossShift">-</div></div></div>
      </div>
      <div class="actionGrid lightActions" style="margin-top:12px"><label class="primaryAction" for="crossMinusInput">Stap 2 · Foto G0 / C−90</label><input id="crossMinusInput" type="file" accept="image/*" capture="environment" hidden><button id="clearCrossMinus" class="actionButton" type="button">C−90 opnieuw</button></div>
      <div id="crossMinusMessage" class="instruction" style="margin-top:8px">Voer eerst stap 1 uit bij het lichtveld hieronder. Draai daarna alleen de collimator naar C−90 en maak hier de tweede foto.</div>
      <div id="crossMinusPreview" class="canvasWrap analyzedPreview" hidden style="margin-top:12px"><canvas id="crossMinusCanvas"></canvas></div>`;
  }

  const lf=document.querySelector('.lightfieldCard');
  if(lf){
    const h=lf.querySelector('h3');if(h)h.textContent='Stap 1 · Lichtveld 10 × 10 + kruisdraad C+90';
    const p=lf.querySelector('.lightfieldIntro p');if(p)p.innerHTML='Gebruik referentieblad <strong>APRILTAG36H11-V4</strong>. Maak bij <strong>G0 / C+90</strong> één foto. De app gebruikt dezelfde perspectiefcorrectie voor de lichtveldmaten én de kruisdraadpositie/hoek.';
    const lab=lf.querySelector('label[for="photoInput"]');if(lab)lab.textContent='Stap 1 · Foto G0 / C+90';
  }
  const minusInput=document.getElementById('crossMinusInput');if(minusInput)minusInput.addEventListener('change',onMinusPhoto);
  const clear=document.getElementById('clearCrossMinus');if(clear)clear.addEventListener('click',()=>{crosshairSnapshot.minus=null;saveCrossStore();renderCrosshair();const inp=document.getElementById('crossMinusInput');if(inp){inp.value='';inp.click()}});
  const primary=document.getElementById('photoInput');if(primary)primary.addEventListener('change',()=>{crosshairSnapshot.plus=null;crosshairSnapshot.minus=null;saveCrossStore();renderCrosshair();refreshAll()},true);
}

function crossGray(img,x,y){
  const d=img.data,w=img.width,h=img.height;
  if(x<0||y<0||x>=w-1||y>=h-1)return 255;
  const x0=Math.floor(x),y0=Math.floor(y),dx=x-x0,dy=y-y0;
  const g=(xx,yy)=>{const i=(yy*w+xx)*4;return .2126*d[i]+.7152*d[i+1]+.0722*d[i+2]};
  return g(x0,y0)*(1-dx)*(1-dy)+g(x0+1,y0)*dx*(1-dy)+g(x0,y0+1)*(1-dx)*dy+g(x0+1,y0+1)*dx*dy;
}
function meanValues(a){let s=0;for(const v of a)s+=v;return a.length?s/a.length:255}
function percentile(a,p){if(!a.length)return 255;const b=[...a].sort((x,y)=>x-y);return b[Math.min(b.length-1,Math.max(0,Math.round((b.length-1)*p)))]}
function weightedFit(xs,ys,ws){
  let sw=0,sx=0,sy=0;for(let i=0;i<xs.length;i++){sw+=ws[i];sx+=ws[i]*xs[i];sy+=ws[i]*ys[i]}
  if(sw<=0)throw new Error('Te weinig kruisdraadcontrast.');const mx=sx/sw,my=sy/sw;let den=0,num=0;for(let i=0;i<xs.length;i++){den+=ws[i]*(xs[i]-mx)*(xs[i]-mx);num+=ws[i]*(xs[i]-mx)*(ys[i]-my)}
  if(den<1e-6)throw new Error('Kruisdraadfit geometrisch instabiel.');const m=num/den,b=my-m*mx;let se=0;for(let i=0;i<xs.length;i++){const e=ys[i]-(m*xs[i]+b);se+=ws[i]*e*e}return{m,b,rmse:Math.sqrt(se/sw)}
}
function profileMeanRow(img,y,x0,x1,centerX,excludePx){const vals=[];for(let x=x0;x<=x1;x+=2)if(Math.abs(x-centerX)>excludePx)vals.push(crossGray(img,x,y));return meanValues(vals)}
function profileMeanCol(img,x,y0,y1,centerY,excludePx){const vals=[];for(let y=y0;y<=y1;y+=2)if(Math.abs(y-centerY)>excludePx)vals.push(crossGray(img,x,y));return meanValues(vals)}
function findHorizontalSeed(img,cx,cy,x0,x1){
  const search=12*PPM,nb=3*PPM,exclude=4*PPM;let best={score:Infinity,pos:cy};
  for(let y=Math.round(cy-search);y<=Math.round(cy+search);y++){
    const c=profileMeanRow(img,y,x0,x1,cx,exclude),a=profileMeanRow(img,y-nb,x0,x1,cx,exclude),b=profileMeanRow(img,y+nb,x0,x1,cx,exclude),score=c-(a+b)/2;if(score<best.score)best={score,pos:y}
  }return best
}
function findVerticalSeed(img,cx,cy,y0,y1){
  const search=12*PPM,nb=3*PPM,exclude=4*PPM;let best={score:Infinity,pos:cx};
  for(let x=Math.round(cx-search);x<=Math.round(cx+search);x++){
    const c=profileMeanCol(img,x,y0,y1,cy,exclude),a=profileMeanCol(img,x-nb,y0,y1,cy,exclude),b=profileMeanCol(img,x+nb,y0,y1,cy,exclude),score=c-(a+b)/2;if(score<best.score)best={score,pos:x}
  }return best
}
function analyzeCrosshairRect(img){
  const cx=A4_W*PPM/2,cy=A4_H*PPM/2,half=24*PPM,band=5*PPM,central=5*PPM;
  const x0=Math.round(cx-half),x1=Math.round(cx+half),y0=Math.round(cy-half),y1=Math.round(cy+half);
  const hs=findHorizontalSeed(img,cx,cy,x0,x1),vs=findVerticalSeed(img,cx,cy,y0,y1);
  const hx=[],hy=[],hw=[];let hContrast=0,hTotal=0;
  for(let x=x0;x<=x1;x+=2){if(Math.abs(x-cx)<central)continue;const vals=[];for(let y=Math.round(hs.pos-band);y<=Math.round(hs.pos+band);y++)vals.push(crossGray(img,x,y));const bg=percentile(vals,.82);let sw=0,sy=0,peak=0;for(let k=0;k<vals.length;k++){const w=Math.max(0,bg-vals[k]-4);if(w>0){const yy=Math.round(hs.pos-band)+k;sw+=w;sy+=w*yy;if(w>peak)peak=w}}if(sw>12&&peak>5){hx.push(x);hy.push(sy/sw);hw.push(peak);hContrast+=peak;hTotal++}}
  const vx=[],vy=[],vw=[];let vContrast=0,vTotal=0;
  for(let y=y0;y<=y1;y+=2){if(Math.abs(y-cy)<central)continue;const vals=[];for(let x=Math.round(vs.pos-band);x<=Math.round(vs.pos+band);x++)vals.push(crossGray(img,x,y));const bg=percentile(vals,.82);let sw=0,sx=0,peak=0;for(let k=0;k<vals.length;k++){const w=Math.max(0,bg-vals[k]-4);if(w>0){const xx=Math.round(vs.pos-band)+k;sw+=w;sx+=w*xx;if(w>peak)peak=w}}if(sw>12&&peak>5){vx.push(y);vy.push(sx/sw);vw.push(peak);vContrast+=peak;vTotal++}}
  const expected=Math.max(1,Math.floor(((x1-x0)/(2))-central));
  const hf=weightedFit(hx,hy,hw),vf=weightedFit(vx,vy,vw);
  const hCov=hTotal/expected,vCov=vTotal/expected,hC=hTotal?hContrast/hTotal:0,vC=vTotal?vContrast/vTotal:0;
  if(hCov<.38||vCov<.38||hC<7||vC<7||hf.rmse/PPM>1.8||vf.rmse/PPM>1.8)throw new Error('Kruisdraad niet betrouwbaar genoeg herkend. Zorg voor een scherp, contrastrijk beeld en een volledig zichtbaar V4-referentieblad.');
  const den=1-vf.m*hf.m;if(Math.abs(den)<.1)throw new Error('Kruisdraadlijnen konden niet betrouwbaar worden gescheiden.');
  const xi=(vf.m*hf.b+vf.b)/den,yi=hf.m*xi+hf.b;
  const hDeg=Math.atan(hf.m)*180/Math.PI,vFull=Math.atan2(1,vf.m)*180/Math.PI,vDev=vFull-90;let orth=Math.abs(vFull-hDeg)%180;if(orth>90)orth=180-orth;
  return{x:(xi-cx)/PPM,y:(yi-cy)/PPM,h:hDeg,v:vDev,orth,intersection:{x:xi,y:yi},horizontal:hf,vertical:vf,quality:{hCoverage:hCov,vCoverage:vCov,hContrast:hC,vContrast:vC,hRmse:hf.rmse/PPM,vRmse:vf.rmse/PPM}};
}

function drawCrosshairOverlay(ctx,c){
  if(!ctx||!c)return;const cx=A4_W*PPM/2,cy=A4_H*PPM/2,span=28*PPM;
  ctx.save();ctx.lineWidth=3;ctx.strokeStyle='#1769ff';ctx.beginPath();ctx.moveTo(cx-14,cy);ctx.lineTo(cx+14,cy);ctx.moveTo(cx,cy-14);ctx.lineTo(cx,cy+14);ctx.stroke();
  ctx.strokeStyle='#00a844';ctx.lineWidth=2.5;ctx.beginPath();let xa=cx-span,xb=cx+span;ctx.moveTo(xa,c.horizontal.m*xa+c.horizontal.b);ctx.lineTo(xb,c.horizontal.m*xb+c.horizontal.b);let ya=cy-span,yb=cy+span;ctx.moveTo(c.vertical.m*ya+c.vertical.b,ya);ctx.lineTo(c.vertical.m*yb+c.vertical.b,yb);ctx.stroke();ctx.fillStyle='#00a844';ctx.beginPath();ctx.arc(c.intersection.x,c.intersection.y,6,0,Math.PI*2);ctx.fill();ctx.restore();
}

function renderOne(prefix,c){
  const set=(s,v)=>{const e=document.getElementById(prefix+s);if(e)e.textContent=v};
  const status=document.getElementById(prefix+'Status');if(status){status.textContent=c?'Gemeten':'Nog niet gemeten';status.className='badge '+(c?'pass':'neutral')}
  set('X',c?crossMm(c.x):'-');set('Y',c?crossMm(c.y):'-');set('H',c?crossDeg(c.h):'-');set('V',c?crossDeg(c.v):'-');set('Orth',c?crossAngle(c.orth):'-');
}
function renderCrosshair(){
  renderOne('crossPlus',crosshairSnapshot.plus);renderOne('crossMinus',crosshairSnapshot.minus);const cmp=document.getElementById('crossCompare');
  if(crosshairSnapshot.plus&&crosshairSnapshot.minus){const dx=crosshairSnapshot.minus.x-crosshairSnapshot.plus.x,dy=crosshairSnapshot.minus.y-crosshairSnapshot.plus.y,shift=Math.hypot(dx,dy);if(cmp)cmp.hidden=false;document.getElementById('crossDeltaX').textContent=crossMm(dx);document.getElementById('crossDeltaY').textContent=crossMm(dy);document.getElementById('crossShift').textContent=shift.toFixed(2)+' mm'}else if(cmp)cmp.hidden=true;
  const msg=document.getElementById('crossMinusMessage');if(msg){msg.textContent=crosshairSnapshot.minus?'C−90 gemeten. Controleer de groene detectielijnen in de voorbeeldafbeelding.':crosshairSnapshot.plus?'C+90 is gemeten. Draai alleen de collimator naar C−90 en maak de tweede foto.':'Voer eerst stap 1 uit bij het lichtveld hieronder (G0 / C+90).'}
}

function capturePlusFromCurrent(){
  if(crosshairBusy||!sourceImage||!points||points.length!==4)return;
  try{const rect=rectify(),c=analyzeCrosshairRect(rect);crosshairSnapshot.plus=c;saveCrossStore();renderCrosshair();drawCrosshairOverlay(rctx,c);refreshAll()}catch(e){crosshairSnapshot.plus=null;saveCrossStore();renderCrosshair();refreshAll();const s=document.getElementById('crossPlusStatus');if(s){s.textContent='Herkenning onzeker';s.className='badge neutral'}console.warn('C+90 kruisdraad:',e.message)}
}

async function fileToImageData(file){const bmp=await createImageBitmap(file),scale=Math.min(1,2200/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.round(bmp.width*scale);c.height=Math.round(bmp.height*scale);const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(bmp,0,0,c.width,c.height);return x.getImageData(0,0,c.width,c.height)}
async function onMinusPhoto(e){
  const file=e.target.files?.[0];if(!file)return;const msg=document.getElementById('crossMinusMessage');if(!crosshairSnapshot.plus){if(msg)msg.textContent='Maak eerst stap 1 (G0 / C+90), zodat beide metingen bij dezelfde meetopstelling horen.';e.target.value='';return}
  crosshairBusy=true;if(msg)msg.textContent='C−90: AprilTags zoeken en kruisdraad analyseren...';
  const savedSource=sourceImage,savedPoints=points,savedAnalysis=analysis;
  try{sourceImage=await fileToImageData(file);points=[];points=detectMarkers();const rect=rectify(),c=analyzeCrosshairRect(rect);crosshairSnapshot.minus=c;saveCrossStore();const cv=document.getElementById('crossMinusCanvas');if(cv){cv.width=OUT_W;cv.height=OUT_H;const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.putImageData(rect,0,0);drawCrosshairOverlay(ctx,c);document.getElementById('crossMinusPreview').hidden=false}renderCrosshair();refreshAll()}
  catch(err){crosshairSnapshot.minus=null;saveCrossStore();renderCrosshair();refreshAll();if(msg)msg.textContent='C−90 analyse gestopt: '+String(err.message||err).replace(/APRILTAG36H11-V2/g,'APRILTAG36H11-V4')}
  finally{sourceImage=savedSource;points=savedPoints;analysis=savedAnalysis;crosshairBusy=false}
}

const coreCompletion=completion;
completion=function(){const c=coreCompletion(),done=crosshairDone();c.geo.crosshair=done;const row=c.allEntries.find(x=>/Kruisdraadrotatie/.test(x.label));if(row){row.done=done;row.fail=false}c.done=c.allEntries.filter(x=>x.done).length;c.total=c.allEntries.length;return c};

function exportWeeklyCsvV14(){const rows=[['Sectie','Controle','Waarde','Status']];
  rows.push(['Administratie','Systeem',val('systemName'),''],['Administratie','Datum',val('qaDate'),''],['Administratie','Initialen 1',val('initials1'),''],['Administratie','Initialen 2',val('initials2'),'']);
  for(const [label,c] of [['Kruisdraad C+90',crosshairSnapshot.plus],['Kruisdraad C-90',crosshairSnapshot.minus]])if(c){rows.push(['Geometrie',label+' X [mm]',c.x.toFixed(3),''],['Geometrie',label+' Y [mm]',c.y.toFixed(3),''],['Geometrie',label+' A-B hoekafwijking [deg]',c.h.toFixed(3),''],['Geometrie',label+' G-T hoekafwijking [deg]',c.v.toFixed(3),''],['Geometrie',label+' onderlinge hoek [deg]',c.orth.toFixed(3),''])}
  if(crosshairSnapshot.plus&&crosshairSnapshot.minus){const dx=crosshairSnapshot.minus.x-crosshairSnapshot.plus.x,dy=crosshairSnapshot.minus.y-crosshairSnapshot.plus.y;rows.push(['Geometrie','Kruisdraad ΔX C-90 - C+90 [mm]',dx.toFixed(3),''],['Geometrie','Kruisdraad ΔY C-90 - C+90 [mm]',dy.toFixed(3),''],['Geometrie','Kruisdraad verschuiving snijpunt [mm]',Math.hypot(dx,dy).toFixed(3),''])}
  if(lightfieldSnapshot){for(const[k,label]of [['width','Veldbreedte A-B'],['height','Veldhoogte G-T'],['left','A x1'],['right','B x2'],['top','G y1'],['bottom','T y2'],['cx','Isocentrum X'],['cy','Isocentrum Y']])rows.push(['Lichtveld 10x10',label,lightfieldSnapshot[k]||'','']);rows.push(['Lichtveld 10x10','Softwarestatus','',lightfieldSnapshot.status||''])}
  rows.push(['Geometrie','Integrity i146 [cm]',val('tableIntegrity'),''],['Geometrie','Licht liniaal [cm]',val('tableRuler'),''],['Geometrie','Lasers overeenkomst','',getChoice('lasers')]);
  for(const k of weeklyGroups.safety)rows.push(['Veiligheid',labelForChoice(k),'',getChoice(k)]);for(const k of weeklyGroups.technical)rows.push(['Technische waarden',labelForField(k),val(k),'']);if($w('pfnApplicable').checked)rows.push(['Technische waarden','PFN lekkage','',getChoice('pfnLeak')]);for(const k of weeklyGroups.xvi)rows.push(['XVI / HexaPOD',labelForChoice(k),'',getChoice(k)]);
  if($w('sixWeeklyApplicable').checked)document.querySelectorAll('.periodicInput[data-periodic="six"]').forEach(el=>rows.push(['6-wekelijks',el.id,el.value,'']));if($w('threeMonthlyApplicable').checked)document.querySelectorAll('.periodicInput[data-periodic="three"]').forEach(el=>rows.push(['3-maandelijks',el.id,el.value,'']));
  rows.push(['Opmerkingen','Extra',val('comments'),'']);const csv='\ufeff'+rows.map(r=>r.map(csvEscape).join(';')).join('\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`linac_weekcontrole_${val('systemName')||'systeem'}_${val('qaDate')||'datum'}.csv`)}

loadCrossStore();installCrosshairUi();renderCrosshair();
const resultCardCross=document.getElementById('resultCard');if(resultCardCross)new MutationObserver(()=>{if(!resultCardCross.hidden)setTimeout(capturePlusFromCurrent,30)}).observe(resultCardCross,{attributes:true,attributeFilter:['hidden']});
['widthOut','heightOut','cxOut','cyOut'].forEach(id=>{const el=document.getElementById(id);if(el)new MutationObserver(()=>{if(!document.getElementById('resultCard')?.hidden)setTimeout(capturePlusFromCurrent,20)}).observe(el,{subtree:true,childList:true,characterData:true})});
const exportBtnCross=document.getElementById('exportWeeklyCsv');if(exportBtnCross)exportBtnCross.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();exportWeeklyCsvV14()},true);
const newBtnCross=document.getElementById('newWeeklyCheck');if(newBtnCross)newBtnCross.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();if(!confirm('Nieuwe wekelijkse controle starten? Alle lokaal opgeslagen formulier- en kruisdraadgegevens van deze controle worden gewist.'))return;localStorage.removeItem(STORE_KEY);localStorage.removeItem(CROSS_STORE_KEY);location.reload()},true);
refreshAll();