'use strict';

const A4_W=210, A4_H=297, PPM=3;
const OUT_W=Math.round(A4_W*PPM), OUT_H=Math.round(A4_H*PPM);
const FIELD=100, FX0=(A4_W-FIELD)/2, FY0=(A4_H-FIELD)/2, FX1=FX0+FIELD, FY1=FY0+FIELD;
const REF=[
  {id:1,name:'G / A',x:18,y:18},
  {id:2,name:'G / B',x:192,y:18},
  {id:3,name:'T / B',x:192,y:279},
  {id:4,name:'T / A',x:18,y:279}
];

const $=id=>document.getElementById(id);
const input=$('photoInput'), pc=$('photoCanvas'), rc=$('resultCanvas');
const pctx=pc.getContext('2d',{willReadFrequently:true});
const rctx=rc.getContext('2d',{willReadFrequently:true});
let sourceImage=null, points=[], analysis=null, detectedMarkers=[];

input.addEventListener('change', async e=>{
  const f=e.target.files?.[0];
  if(!f) return;
  try{
    const bmp=await createImageBitmap(f);
    const s=Math.min(1,2200/Math.max(bmp.width,bmp.height));
    pc.width=Math.round(bmp.width*s);
    pc.height=Math.round(bmp.height*s);
    pctx.drawImage(bmp,0,0,pc.width,pc.height);
    sourceImage=pctx.getImageData(0,0,pc.width,pc.height);
    points=[]; detectedMarkers=[]; analysis=null;
    $('detectionCard').hidden=false;
    $('resultCard').hidden=true;
    $('detectStatus').textContent='Vier unieke referentiemarkers zoeken...';
    $('detectionCard').scrollIntoView({behavior:'smooth'});
    setTimeout(autoDetectAndAnalyze,100);
  }catch(err){ alert('Foto kon niet worden geopend: '+err.message); }
});
$('retryBtn').onclick=()=>autoDetectAndAnalyze();

function luminance(r,g,b){return .2126*r+.7152*g+.0722*b}
function makeSmall(maxDim=1200){
  const sc=Math.min(1,maxDim/Math.max(sourceImage.width,sourceImage.height));
  const w=Math.max(1,Math.round(sourceImage.width*sc));
  const h=Math.max(1,Math.round(sourceImage.height*sc));
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const x=c.getContext('2d',{willReadFrequently:true});
  const tmp=document.createElement('canvas');
  tmp.width=sourceImage.width; tmp.height=sourceImage.height;
  tmp.getContext('2d').putImageData(sourceImage,0,0);
  x.drawImage(tmp,0,0,w,h);
  return {img:x.getImageData(0,0,w,h), scale:sourceImage.width/w};
}

function components(mask,w,h,minArea,maxArea){
  const seen=new Uint8Array(w*h), stack=new Int32Array(w*h), out=[];
  for(let i=0;i<w*h;i++){
    if(!mask[i] || seen[i]) continue;
    let sp=0; stack[sp++]=i; seen[i]=1;
    let area=0,minx=w,miny=h,maxx=0,maxy=0,sx=0,sy=0;
    while(sp){
      const q=stack[--sp], y=(q/w)|0, x=q-y*w;
      area++; sx+=x; sy+=y;
      if(x<minx)minx=x; if(x>maxx)maxx=x;
      if(y<miny)miny=y; if(y>maxy)maxy=y;
      for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++){
        for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++){
          const n=yy*w+xx;
          if(!seen[n] && mask[n]){seen[n]=1; stack[sp++]=n;}
        }
      }
    }
    if(area>=minArea && area<=maxArea) out.push({area,minx,miny,maxx,maxy,cx:sx/area,cy:sy/area});
  }
  return out;
}

function patchMean(img,cx,cy,rx,ry){
  const d=img.data,w=img.width,h=img.height;
  const x0=Math.max(0,Math.floor(cx-rx)), x1=Math.min(w-1,Math.ceil(cx+rx));
  const y0=Math.max(0,Math.floor(cy-ry)), y1=Math.min(h-1,Math.ceil(cy+ry));
  let s=0,n=0;
  for(let y=y0;y<=y1;y++) for(let x=x0;x<=x1;x++){
    const i=(y*w+x)*4; s+=luminance(d[i],d[i+1],d[i+2]); n++;
  }
  return n?s/n:255;
}

function decodeMarker(img,c){
  const bw=c.maxx-c.minx+1, bh=c.maxy-c.miny+1, ratio=bw/bh;
  if(ratio<0.62 || ratio>1.62 || Math.min(bw,bh)<18) return null;
  const vals=[], prx=Math.max(1,bw/20), pry=Math.max(1,bh/20);
  for(let r=0;r<3;r++) for(let col=0;col<3;col++){
    const x=c.minx+((1.5+col)/5)*bw, y=c.miny+((1.5+r)/5)*bh;
    vals.push(patchMean(img,x,y,prx,pry));
  }
  const sorted=[...vals].sort((a,b)=>a-b);
  let bestGap=-1,bestK=-1;
  for(let k=1;k<=4;k++){
    const gap=sorted[k]-sorted[k-1];
    if(gap>bestGap){bestGap=gap;bestK=k;}
  }
  if(bestK<1 || bestK>4 || bestGap<18) return null;
  const threshold=(sorted[bestK-1]+sorted[bestK])/2;
  const bits=vals.map(v=>v<threshold?1:0), id=bits.reduce((a,b)=>a+b,0);
  if(id<1 || id>4) return null;

  const border=[], borderPos=[.10,.30,.50,.70,.90];
  for(const t of borderPos){
    border.push(patchMean(img,c.minx+t*bw,c.miny+.10*bh,prx,pry));
    border.push(patchMean(img,c.minx+t*bw,c.miny+.90*bh,prx,pry));
    border.push(patchMean(img,c.minx+.10*bw,c.miny+t*bh,prx,pry));
    border.push(patchMean(img,c.minx+.90*bw,c.miny+t*bh,prx,pry));
  }
  const borderMean=border.reduce((a,b)=>a+b,0)/border.length;
  const lightVals=vals.filter((_,i)=>!bits[i]);
  if(!lightVals.length) return null;
  const lightMean=lightVals.reduce((a,b)=>a+b,0)/lightVals.length;
  if(lightMean-borderMean<12) return null;

  const squareness=1-Math.min(.8,Math.abs(Math.log(ratio)));
  const contrast=Math.min(1,(lightMean-borderMean)/80);
  const cluster=Math.min(1,bestGap/80);
  const confidence=Math.max(0,squareness)*.25+contrast*.35+cluster*.40;
  return {id,confidence,cx:c.cx,cy:c.cy,bbox:c};
}

function polygonArea(pts){
  let s=0;
  for(let i=0;i<pts.length;i++){const p=pts[i],q=pts[(i+1)%pts.length];s+=p.x*q.y-q.x*p.y;}
  return Math.abs(s)/2;
}
function dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}

function detectMarkers(){
  if(!sourceImage) throw new Error('Geen foto geladen.');
  const {img,scale}=makeSmall(), w=img.width,h=img.height,d=img.data,N=w*h;
  const sample=[], step=Math.max(1,Math.floor(N/50000));
  for(let p=0;p<N;p+=step){const i=p*4;sample.push(luminance(d[i],d[i+1],d[i+2]));}
  sample.sort((a,b)=>a-b);
  const q10=sample[Math.floor(sample.length*.10)], q50=sample[Math.floor(sample.length*.50)];
  const darkThr=Math.min(115,Math.max(45,q10+(q50-q10)*.35));

  const dark=new Uint8Array(N);
  for(let i=0;i<N;i++){const j=i*4;if(luminance(d[j],d[j+1],d[j+2])<darkThr)dark[i]=1;}
  const minSide=Math.min(w,h), minArea=Math.max(45,Math.round(N*.00003)), maxArea=Math.round(N*.018);
  const comps=components(dark,w,h,minArea,maxArea).filter(c=>{
    const bw=c.maxx-c.minx+1,bh=c.maxy-c.miny+1,ratio=bw/bh,fill=c.area/(bw*bh);
    return Math.min(bw,bh)>minSide*.018 && Math.max(bw,bh)<minSide*.20 && ratio>.55 && ratio<1.8 && fill>.12 && fill<.92;
  });

  const decoded=[];
  for(const c of comps){const m=decodeMarker(img,c);if(m&&m.confidence>.25)decoded.push(m);}
  const byId=new Map();
  for(const m of decoded){const old=byId.get(m.id);if(!old||m.confidence>old.confidence)byId.set(m.id,m);}
  const missing=[1,2,3,4].filter(id=>!byId.has(id));
  if(missing.length){
    const labels={1:'G/A',2:'G/B',3:'T/B',4:'T/A'};
    throw new Error('Niet alle vier referentiemarkers zijn betrouwbaar herkend. Ontbrekend: '+missing.map(id=>labels[id]).join(', ')+'. Zorg dat het hele nieuwe referentieblad zichtbaar, vlak en scherp gefotografeerd is.');
  }

  const markers=[1,2,3,4].map(id=>byId.get(id));
  const pts=markers.map(m=>({x:m.cx*scale,y:m.cy*scale}));
  if(polygonArea(pts)<sourceImage.width*sourceImage.height*.08) throw new Error('De vier markers vormen een te klein meetvlak. Neem het volledige A4-blad ruimer in beeld.');
  const top=dist(pts[0],pts[1]),right=dist(pts[1],pts[2]),bottom=dist(pts[2],pts[3]),left=dist(pts[3],pts[0]);
  if(Math.min(top,right,bottom,left)<40) throw new Error('De markergeometrie is niet betrouwbaar.');
  const widthRatio=Math.max(top,bottom)/Math.min(top,bottom),heightRatio=Math.max(left,right)/Math.min(left,right);
  if(widthRatio>2.0||heightRatio>2.0) throw new Error('Te sterke perspectiefvervorming. Maak de foto meer loodrecht boven het blad.');
  detectedMarkers=markers;
  return pts;
}

function drawDetected(){
  pctx.putImageData(sourceImage,0,0);
  pctx.lineWidth=Math.max(3,pc.width/450);pctx.font=`bold ${Math.max(17,pc.width/34)}px system-ui`;
  points.forEach((p,i)=>{pctx.beginPath();pctx.arc(p.x,p.y,Math.max(12,pc.width/90),0,Math.PI*2);pctx.strokeStyle='#00c853';pctx.stroke();pctx.fillStyle='#00a844';pctx.fillText(REF[i].name,p.x+14,p.y-12);});
  pctx.strokeStyle='#00c853';pctx.beginPath();points.forEach((p,i)=>i?pctx.lineTo(p.x,p.y):pctx.moveTo(p.x,p.y));pctx.closePath();pctx.stroke();
}

async function autoDetectAndAnalyze(){
  if(!sourceImage)return;
  try{
    $('detectStatus').textContent='Unieke markers G/A, G/B, T/B en T/A zoeken...';await new Promise(r=>setTimeout(r,50));
    points=detectMarkers();drawDetected();
    $('detectStatus').textContent='4/4 unieke markers herkend. Perspectief corrigeren en lichtveld analyseren...';await new Promise(r=>setTimeout(r,70));
    const rect=rectify();rc.width=OUT_W;rc.height=OUT_H;rctx.putImageData(rect,0,0);analysis=analyzeRect(rect);drawOverlay();showResult();
    $('detectStatus').textContent='4/4 markers automatisch herkend: G boven, T onder, A links, B rechts.';
    $('resultCard').hidden=false;$('resultCard').scrollIntoView({behavior:'smooth'});
  }catch(e){
    points=[];detectedMarkers=[];analysis=null;if(sourceImage)pctx.putImageData(sourceImage,0,0);$('resultCard').hidden=true;$('detectStatus').textContent='Geen geldige automatische kalibratie - meting geblokkeerd.';alert('Analyse gestopt: '+e.message);
  }
}

function solve(A,b){const n=b.length,M=A.map((r,i)=>[...r,b[i]]);for(let k=0;k<n;k++){let m=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[m][k]))m=i;[M[k],M[m]]=[M[m],M[k]];if(Math.abs(M[k][k])<1e-12)throw new Error('Kalibratie is geometrisch instabiel.');const dv=M[k][k];for(let j=k;j<=n;j++)M[k][j]/=dv;for(let i=0;i<n;i++)if(i!==k){const q=M[i][k];for(let j=k;j<=n;j++)M[i][j]-=q*M[k][j]}}return M.map(r=>r[n])}
function homography(dst,src){const A=[],b=[];for(let i=0;i<4;i++){const x=dst[i].x,y=dst[i].y,u=src[i].x,v=src[i].y;A.push([x,y,1,0,0,0,-u*x,-u*y]);b.push(u);A.push([0,0,0,x,y,1,-v*x,-v*y]);b.push(v)}return[...solve(A,b),1]}
function mapH(h,x,y){const d=h[6]*x+h[7]*y+h[8];return{x:(h[0]*x+h[1]*y+h[2])/d,y:(h[3]*x+h[4]*y+h[5])/d}}
function sampleBilinear(data,w,h,x,y){if(x<0||y<0||x>=w-1||y>=h-1)return[255,255,255,255];const x0=Math.floor(x),y0=Math.floor(y),dx=x-x0,dy=y-y0,out=[0,0,0,255];for(let c=0;c<3;c++){const i00=(y0*w+x0)*4+c,i10=i00+4,i01=i00+w*4,i11=i01+4;out[c]=data[i00]*(1-dx)*(1-dy)+data[i10]*dx*(1-dy)+data[i01]*(1-dx)*dy+data[i11]*dx*dy}return out}
function rectify(){const dst=REF.map(p=>({x:p.x*PPM,y:p.y*PPM})),h=homography(dst,points),out=new ImageData(OUT_W,OUT_H),sd=sourceImage.data;for(let y=0;y<OUT_H;y++)for(let x=0;x<OUT_W;x++){const s=mapH(h,x,y),rgba=sampleBilinear(sd,sourceImage.width,sourceImage.height,s.x,s.y),i=(y*OUT_W+x)*4;out.data[i]=rgba[0];out.data[i+1]=rgba[1];out.data[i+2]=rgba[2];out.data[i+3]=255}return out}

function grayAt(d,i){return .2126*d[i]+.7152*d[i+1]+.0722*d[i+2]}
function smooth(a,r=8){const out=new Float32Array(a.length),p=new Float64Array(a.length+1);for(let i=0;i<a.length;i++)p[i+1]=p[i]+a[i];for(let i=0;i<a.length;i++){const lo=Math.max(0,i-r),hi=Math.min(a.length,i+r+1);out[i]=(p[hi]-p[lo])/(hi-lo)}return out}
function profile(img,axis,x0,y0,x1,y1){const d=img.data,w=img.width;if(axis==='x'){const a=new Float32Array(x1-x0);for(let x=x0;x<x1;x++){const v=[];for(let y=y0;y<y1;y+=3)v.push(grayAt(d,(y*w+x)*4));v.sort((a,b)=>a-b);a[x-x0]=v[Math.floor(v.length/2)]}return smooth(a)}const a=new Float32Array(y1-y0);for(let y=y0;y<y1;y++){const v=[];for(let x=x0;x<x1;x+=3)v.push(grayAt(d,(y*w+x)*4));v.sort((a,b)=>a-b);a[y-y0]=v[Math.floor(v.length/2)]}return smooth(a)}
function derivative(a){const d=new Float32Array(a.length);for(let i=1;i<a.length-1;i++)d[i]=(a[i+1]-a[i-1])/2;return d}
function peakAbs(d,e,s){let lo=Math.max(1,Math.round(e-s)),hi=Math.min(d.length-2,Math.round(e+s)),best=lo,bv=-1;for(let i=lo;i<=hi;i++){const v=Math.abs(d[i]);if(v>bv){bv=v;best=i}}return{idx:best,strength:bv}}
function analyzeRect(img){const m=25,x0=Math.round((FX0-m)*PPM),x1=Math.round((FX1+m)*PPM),y0=Math.round((FY0-m)*PPM),y1=Math.round((FY1+m)*PPM),cp=derivative(profile(img,'x',x0,y0,x1,y1)),rp=derivative(profile(img,'y',x0,y0,x1,y1)),s=30*PPM,L=peakAbs(cp,m*PPM,s),R=peakAbs(cp,(m+100)*PPM,s),G=peakAbs(rp,m*PPM,s),T=peakAbs(rp,(m+100)*PPM,s),Xl=x0+L.idx,Xr=x0+R.idx,Yg=y0+G.idx,Yt=y0+T.idx,width=(Xr-Xl)/PPM,height=(Yt-Yg)/PPM;if(width<60||width>140||height<60||height>140)throw new Error(`Onwaarschijnlijke veldmaat gevonden (${width.toFixed(1)} x ${height.toFixed(1)} mm). Controleer foto, markerherkenning en belichting.`);const strengths=[L.strength,R.strength,G.strength,T.strength];if(Math.min(...strengths)<0.8)throw new Error('Het contrast van een of meer lichtveldranden is te laag voor een betrouwbare automatische meting.');return{width,height,left:Xl/PPM-FX0,right:Xr/PPM-FX1,top:Yg/PPM-FY0,bottom:Yt/PPM-FY1,cx:(Xl+Xr)/(2*PPM)-A4_W/2,cy:(Yg+Yt)/(2*PPM)-A4_H/2,bounds:[Xl,Yg,Xr,Yt]}}
function drawOverlay(){const[xl,yg,xr,yt]=analysis.bounds;rctx.lineWidth=3;rctx.strokeStyle='#222';rctx.strokeRect(FX0*PPM,FY0*PPM,100*PPM,100*PPM);rctx.strokeStyle='#ff2424';rctx.strokeRect(xl,yg,xr-xl,yt-yg);rctx.strokeStyle='#1769ff';rctx.beginPath();rctx.moveTo(OUT_W/2-18,OUT_H/2);rctx.lineTo(OUT_W/2+18,OUT_H/2);rctx.moveTo(OUT_W/2,OUT_H/2-18);rctx.lineTo(OUT_W/2,OUT_H/2+18);rctx.stroke();rctx.font='bold 18px system-ui';rctx.fillStyle='#111';rctx.fillText('G',OUT_W/2-5,28);rctx.fillText('T',OUT_W/2-5,OUT_H-14);rctx.fillText('A',12,OUT_H/2+5);rctx.fillText('B',OUT_W-25,OUT_H/2+5)}
function mm(v){return`${v>=0?'+':''}${v.toFixed(2)} mm`}
function showResult(){$('widthOut').textContent=analysis.width.toFixed(2)+' mm';$('heightOut').textContent=analysis.height.toFixed(2)+' mm';$('leftOut').textContent=mm(analysis.left);$('rightOut').textContent=mm(analysis.right);$('topOut').textContent=mm(analysis.top);$('bottomOut').textContent=mm(analysis.bottom);$('cxOut').textContent=mm(analysis.cx);$('cyOut').textContent=mm(analysis.cy);updateBadge()}
function updateBadge(){if(!analysis)return;const t=parseFloat($('tolerance').value),bad=[analysis.left,analysis.right,analysis.top,analysis.bottom].some(v=>Math.abs(v)>t),b=$('statusBadge');b.textContent=bad?'BUITEN INGESTELDE TOLERANTIE':'BINNEN INGESTELDE TOLERANTIE';b.className='badge '+(bad?'fail':'pass')}
$('tolerance').addEventListener('input',updateBadge);
function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$('saveImageBtn').onclick=()=>rc.toBlob(b=>download(b,`lichtveld_${new Date().toISOString().replace(/[:.]/g,'-')}.png`),'image/png');
$('saveCsvBtn').onclick=()=>{if(!analysis)return;const h='timestamp,width_mm,height_mm,A_left_mm,B_right_mm,G_top_mm,T_bottom_mm,center_x_mm,center_y_mm\n',r=[new Date().toISOString(),analysis.width,analysis.height,analysis.left,analysis.right,analysis.top,analysis.bottom,analysis.cx,analysis.cy].join(',')+'\n';download(new Blob([h+r],{type:'text/csv'}),'lichtveld_meting.csv')};
if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
