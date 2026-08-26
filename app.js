'use strict';
const A4_W=210,A4_H=297,PPM=3,OUT_W=Math.round(A4_W*PPM),OUT_H=Math.round(A4_H*PPM);
const REF=[{name:'G / A',x:15,y:15},{name:'G / B',x:195,y:15},{name:'TARGET / B',x:195,y:282},{name:'TARGET / A',x:15,y:282}];
const FIELD=100,FX0=(A4_W-FIELD)/2,FY0=(A4_H-FIELD)/2,FX1=FX0+FIELD,FY1=FY0+FIELD;
const $=id=>document.getElementById(id),input=$('photoInput'),pc=$('photoCanvas'),rc=$('resultCanvas');
const pctx=pc.getContext('2d',{willReadFrequently:true}),rctx=rc.getContext('2d',{willReadFrequently:true});
let sourceImage=null,points=[],analysis=null;

input.addEventListener('change',async e=>{
  const f=e.target.files?.[0]; if(!f)return;
  try{
    const bmp=await createImageBitmap(f),s=Math.min(1,1800/Math.max(bmp.width,bmp.height));
    pc.width=Math.round(bmp.width*s); pc.height=Math.round(bmp.height*s);
    pctx.drawImage(bmp,0,0,pc.width,pc.height);
    sourceImage=pctx.getImageData(0,0,pc.width,pc.height); points=[]; analysis=null;
    $('detectionCard').hidden=false; $('resultCard').hidden=true;
    $('detectStatus').textContent='Vier hoekmarkers automatisch zoeken...';
    $('detectionCard').scrollIntoView({behavior:'smooth'});
    setTimeout(autoDetectAndAnalyze,80);
  }catch(err){alert('Foto kon niet worden geopend: '+err.message)}
});
$('retryBtn').onclick=()=>autoDetectAndAnalyze();

function gray(r,g,b){return .2126*r+.7152*g+.0722*b}
function makeSmall(maxDim=950){
  const sc=Math.min(1,maxDim/Math.max(sourceImage.width,sourceImage.height));
  const w=Math.round(sourceImage.width*sc),h=Math.round(sourceImage.height*sc);
  const c=document.createElement('canvas');c.width=w;c.height=h;
  const x=c.getContext('2d',{willReadFrequently:true});
  const tmp=document.createElement('canvas');tmp.width=sourceImage.width;tmp.height=sourceImage.height;
  tmp.getContext('2d').putImageData(sourceImage,0,0);x.drawImage(tmp,0,0,w,h);
  return{img:x.getImageData(0,0,w,h),scale:sourceImage.width/w};
}
function components(mask,w,h,minArea,maxArea){
  const seen=new Uint8Array(w*h),stack=new Int32Array(w*h),out=[];
  for(let i=0;i<w*h;i++){
    if(!mask[i]||seen[i])continue;
    let sp=0;stack[sp++]=i;seen[i]=1;let area=0,minx=w,miny=h,maxx=0,maxy=0,sx=0,sy=0;
    while(sp){
      const q=stack[--sp],y=(q/w)|0,x=q-y*w;area++;sx+=x;sy+=y;
      if(x<minx)minx=x;if(x>maxx)maxx=x;if(y<miny)miny=y;if(y>maxy)maxy=y;
      for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){
        const n=yy*w+xx;if(!seen[n]&&mask[n]){seen[n]=1;stack[sp++]=n}
      }
    }
    if(area>=minArea&&area<=maxArea)out.push({area,minx,miny,maxx,maxy,cx:sx/area,cy:sy/area});
  }
  return out;
}
function detectMarkers(){
  if(!sourceImage)throw new Error('Geen foto geladen.');
  const {img,scale}=makeSmall(),w=img.width,h=img.height,d=img.data,N=w*h;
  const bright=new Uint8Array(N),dark=new Uint8Array(N);
  for(let i=0;i<N;i++){
    const g=gray(d[i*4],d[i*4+1],d[i*4+2]);
    if(g>145)bright[i]=1;
    if(g<85)dark[i]=1;
  }
  const bc=components(bright,w,h,Math.round(N*.06),N);
  if(!bc.length)throw new Error('Het witte A4-blad is niet duidelijk genoeg herkenbaar. Zorg dat het hele blad zichtbaar is en contrasteert met de ondergrond.');
  const paper=bc.sort((a,b)=>b.area-a.area)[0];
  const pw=paper.maxx-paper.minx+1,ph=paper.maxy-paper.miny+1;
  const minM=Math.max(12,Math.round(N*.000025)),maxM=Math.round(N*.008);
  let cand=components(dark,w,h,minM,maxM).filter(c=>{
    const bw=c.maxx-c.minx+1,bh=c.maxy-c.miny+1,ratio=bw/bh,fill=c.area/(bw*bh);
    const inside=c.cx>paper.minx-pw*.08&&c.cx<paper.maxx+pw*.08&&c.cy>paper.miny-ph*.08&&c.cy<paper.maxy+ph*.08;
    return inside&&ratio>.55&&ratio<1.8&&fill>.18&&fill<.95&&bw>5&&bh>5;
  });
  if(cand.length<4)throw new Error(`Slechts ${cand.length} geschikte hoekmarker(s) gevonden. Gebruik het nieuwe referentieblad en zorg dat alle vier markers scherp zichtbaar zijn.`);
  const targets=[{x:paper.minx,y:paper.miny},{x:paper.maxx,y:paper.miny},{x:paper.maxx,y:paper.maxy},{x:paper.minx,y:paper.maxy}];
  const chosen=[],used=new Set();
  for(const t of targets){
    let best=null,bestScore=1e99;
    cand.forEach((c,idx)=>{if(used.has(idx))return;const bw=c.maxx-c.minx+1,bh=c.maxy-c.miny+1;const dist=((c.cx-t.x)/pw)**2+((c.cy-t.y)/ph)**2;const sq=Math.abs(Math.log(bw/bh));const score=dist+sq*.12;if(score<bestScore){bestScore=score;best={c,idx}}});
    if(!best)throw new Error('De vier hoekmarkers konden niet eenduidig worden gekoppeld.');
    used.add(best.idx);chosen.push(best.c);
  }
  const pts=chosen.map(c=>({x:c.cx*scale,y:c.cy*scale}));
  const quadArea=Math.abs(pts.reduce((s,p,i)=>{const q=pts[(i+1)%4];return s+p.x*q.y-q.x*p.y},0))/2;
  if(quadArea<sourceImage.width*sourceImage.height*.08)throw new Error('De gevonden markers liggen te dicht bij elkaar. Maak een foto waarop het hele A4-blad zichtbaar is.');
  return pts;
}
function drawDetected(){
  pctx.putImageData(sourceImage,0,0);pctx.lineWidth=Math.max(3,pc.width/450);pctx.font=`bold ${Math.max(17,pc.width/34)}px system-ui`;
  points.forEach((p,i)=>{pctx.beginPath();pctx.arc(p.x,p.y,Math.max(10,pc.width/90),0,Math.PI*2);pctx.strokeStyle='#00c853';pctx.stroke();pctx.fillStyle='#00a844';pctx.fillText(REF[i].name,p.x+14,p.y-12)});
  pctx.strokeStyle='#00c853';pctx.beginPath();points.forEach((p,i)=>i?pctx.lineTo(p.x,p.y):pctx.moveTo(p.x,p.y));pctx.closePath();pctx.stroke();
}
async function autoDetectAndAnalyze(){
  if(!sourceImage)return;
  try{
    $('detectStatus').textContent='Markers zoeken...';await new Promise(r=>setTimeout(r,40));
    points=detectMarkers();drawDetected();
    $('detectStatus').textContent='4/4 markers gevonden - G boven, TARGET onder, A links, B rechts. Analyse uitvoeren...';
    await new Promise(r=>setTimeout(r,60));
    const rect=rectify();rc.width=OUT_W;rc.height=OUT_H;rctx.putImageData(rect,0,0);analysis=analyzeRect(rect);drawOverlay();showResult();
    $('detectStatus').textContent='Automatische herkenning en analyse voltooid.';
    $('resultCard').hidden=false;$('resultCard').scrollIntoView({behavior:'smooth'});
  }catch(e){points=[];if(sourceImage)pctx.putImageData(sourceImage,0,0);$('detectStatus').textContent='Automatische herkenning niet gelukt.';alert('Analyse mislukt: '+e.message)}
}
function solve(A,b){const n=b.length,M=A.map((r,i)=>[...r,b[i]]);for(let k=0;k<n;k++){let m=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[m][k]))m=i;[M[k],M[m]]=[M[m],M[k]];if(Math.abs(M[k][k])<1e-12)throw new Error('Kalibratie is geometrisch instabiel.');const d=M[k][k];for(let j=k;j<=n;j++)M[k][j]/=d;for(let i=0;i<n;i++)if(i!==k){const q=M[i][k];for(let j=k;j<=n;j++)M[i][j]-=q*M[k][j]}}return M.map(r=>r[n])}
function homography(dst,src){const A=[],b=[];for(let i=0;i<4;i++){const x=dst[i].x,y=dst[i].y,u=src[i].x,v=src[i].y;A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)}return[...solve(A,b),1]}
function mapH(h,x,y){const d=h[6]*x+h[7]*y+h[8];return{x:(h[0]*x+h[1]*y+h[2])/d,y:(h[3]*x+h[4]*y+h[5])/d}}
function sampleBilinear(data,w,h,x,y){if(x<0||y<0||x>=w-1||y>=h-1)return[255,255,255,255];const x0=Math.floor(x),y0=Math.floor(y),dx=x-x0,dy=y-y0,out=[0,0,0,255];for(let c=0;c<3;c++){const i00=(y0*w+x0)*4+c,i10=i00+4,i01=i00+w*4,i11=i01+4;out[c]=data[i00]*(1-dx)*(1-dy)+data[i10]*dx*(1-dy)+data[i01]*(1-dx)*dy+data[i11]*dx*dy}return out}
function rectify(){const dst=REF.map(p=>({x:p.x*PPM,y:p.y*PPM})),h=homography(dst,points),out=new ImageData(OUT_W,OUT_H),sd=sourceImage.data;for(let y=0;y<OUT_H;y++)for(let x=0;x<OUT_W;x++){const s=mapH(h,x,y),rgba=sampleBilinear(sd,sourceImage.width,sourceImage.height,s.x,s.y),i=(y*OUT_W+x)*4;out.data[i]=rgba[0];out.data[i+1]=rgba[1];out.data[i+2]=rgba[2];out.data[i+3]=255}return out}
function grayAt(d,i){return .2126*d[i]+.7152*d[i+1]+.0722*d[i+2]}function smooth(a,r=8){const out=new Float32Array(a.length),p=new Float64Array(a.length+1);for(let i=0;i<a.length;i++)p[i+1]=p[i]+a[i];for(let i=0;i<a.length;i++){const lo=Math.max(0,i-r),hi=Math.min(a.length,i+r+1);out[i]=(p[hi]-p[lo])/(hi-lo)}return out}
function profile(img,axis,x0,y0,x1,y1){const d=img.data,w=img.width;if(axis==='x'){const a=new Float32Array(x1-x0);for(let x=x0;x<x1;x++){let v=[];for(let y=y0;y<y1;y+=3)v.push(grayAt(d,(y*w+x)*4));v.sort((a,b)=>a-b);a[x-x0]=v[Math.floor(v.length/2)]}return smooth(a)}const a=new Float32Array(y1-y0);for(let y=y0;y<y1;y++){let v=[];for(let x=x0;x<x1;x+=3)v.push(grayAt(d,(y*w+x)*4));v.sort((a,b)=>a-b);a[y-y0]=v[Math.floor(v.length/2)]}return smooth(a)}
function derivative(a){const d=new Float32Array(a.length);for(let i=1;i<a.length-1;i++)d[i]=(a[i+1]-a[i-1])/2;return d}function peakAbs(d,e,s){let lo=Math.max(1,Math.round(e-s)),hi=Math.min(d.length-2,Math.round(e+s)),best=lo,bv=-1;for(let i=lo;i<=hi;i++){const v=Math.abs(d[i]);if(v>bv){bv=v;best=i}}return{idx:best,strength:bv}}
function analyzeRect(img){const m=25,x0=Math.round((FX0-m)*PPM),x1=Math.round((FX1+m)*PPM),y0=Math.round((FY0-m)*PPM),y1=Math.round((FY1+m)*PPM),cp=derivative(profile(img,'x',x0,y0,x1,y1)),rp=derivative(profile(img,'y',x0,y0,x1,y1)),s=30*PPM,L=peakAbs(cp,m*PPM,s),R=peakAbs(cp,(m+100)*PPM,s),T=peakAbs(rp,m*PPM,s),B=peakAbs(rp,(m+100)*PPM,s),Xl=x0+L.idx,Xr=x0+R.idx,Yt=y0+T.idx,Yb=y0+B.idx,width=(Xr-Xl)/PPM,height=(Yb-Yt)/PPM;if(width<60||width>140||height<60||height>140)throw new Error(`Onwaarschijnlijke veldmaat gevonden (${width.toFixed(1)} x ${height.toFixed(1)} mm). Controleer de foto en markerherkenning.`);return{width,height,left:Xl/PPM-FX0,right:Xr/PPM-FX1,top:Yt/PPM-FY0,bottom:Yb/PPM-FY1,cx:(Xl+Xr)/(2*PPM)-A4_W/2,cy:(Yt+Yb)/(2*PPM)-A4_H/2,bounds:[Xl,Yt,Xr,Yb]}}
function drawOverlay(){const[xl,yt,xr,yb]=analysis.bounds;rctx.lineWidth=3;rctx.strokeStyle='#222';rctx.strokeRect(FX0*PPM,FY0*PPM,100*PPM,100*PPM);rctx.strokeStyle='#ff2424';rctx.strokeRect(xl,yt,xr-xl,yb-yt);rctx.strokeStyle='#1769ff';rctx.beginPath();rctx.moveTo(OUT_W/2-18,OUT_H/2);rctx.lineTo(OUT_W/2+18,OUT_H/2);rctx.moveTo(OUT_W/2,OUT_H/2-18);rctx.lineTo(OUT_W/2,OUT_H/2+18);rctx.stroke();rctx.font='bold 18px system-ui';rctx.fillStyle='#111';rctx.fillText('G',OUT_W/2-5,28);rctx.fillText('TARGET',OUT_W/2-34,OUT_H-14);rctx.fillText('A',12,OUT_H/2+5);rctx.fillText('B',OUT_W-25,OUT_H/2+5)}
function mm(v){return`${v>=0?'+':''}${v.toFixed(2)} mm`}function showResult(){$('widthOut').textContent=analysis.width.toFixed(2)+' mm';$('heightOut').textContent=analysis.height.toFixed(2)+' mm';$('leftOut').textContent=mm(analysis.left);$('rightOut').textContent=mm(analysis.right);$('topOut').textContent=mm(analysis.top);$('bottomOut').textContent=mm(analysis.bottom);$('cxOut').textContent=mm(analysis.cx);$('cyOut').textContent=mm(analysis.cy);updateBadge()}
function updateBadge(){if(!analysis)return;const t=parseFloat($('tolerance').value),bad=[analysis.left,analysis.right,analysis.top,analysis.bottom].some(v=>Math.abs(v)>t),b=$('statusBadge');b.textContent=bad?'BUITEN INGESTELDE TOLERANTIE':'BINNEN INGESTELDE TOLERANTIE';b.className='badge '+(bad?'fail':'pass')}$('tolerance').addEventListener('input',updateBadge);
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}$('saveImageBtn').onclick=()=>rc.toBlob(b=>download(b,`lichtveld_${new Date().toISOString().replace(/[:.]/g,'-')}.png`),'image/png');$('saveCsvBtn').onclick=()=>{if(!analysis)return;const h='timestamp,width_mm,height_mm,left_A_mm,right_B_mm,top_G_mm,bottom_TARGET_mm,center_x_mm,center_y_mm\n',r=[new Date().toISOString(),analysis.width,analysis.height,analysis.left,analysis.right,analysis.top,analysis.bottom,analysis.cx,analysis.cy].join(',')+'\n';download(new Blob([h+r],{type:'text/csv'}),'lichtveld_meting.csv')};if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
