'use strict';
const detectMarkersV4Core=detectMarkers;
detectMarkers=function(){try{return detectMarkersV4Core()}catch(e){if(e&&e.message)e.message=e.message.replace(/APRILTAG36H11-V2/g,'APRILTAG36H11-V4').replace(/APRILTAG36H11-V3/g,'APRILTAG36H11-V4');throw e}};
capturePlusFromCurrent=function(){
  if(crosshairBusy||crosshairSnapshot.plus||!sourceImage||!points||points.length!==4)return;
  crosshairBusy=true;
  try{const rect=rectify(),c=analyzeCrosshairRect(rect);crosshairSnapshot.plus=c;saveCrossStore();renderCrosshair();drawCrosshairOverlay(rctx,c);refreshAll()}
  catch(e){crosshairSnapshot.plus=null;saveCrossStore();renderCrosshair();refreshAll();const s=document.getElementById('crossPlusStatus');if(s){s.textContent='Herkenning onzeker';s.className='badge neutral'}console.warn('C+90 kruisdraad:',e.message)}
  finally{crosshairBusy=false}
};