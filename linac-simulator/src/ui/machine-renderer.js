import {initHardware} from './machine/hardware.js';
import {renderBeam} from './machine/beam-renderer.js';
import {applySelectorMotion} from './machine/target-selector.js';
import {updateTreatmentHead} from './machine/treatment-head.js';
import {setActiveControlEffect} from './machine/highlight.js';
import {renderScatter} from './machine/scatter-renderer.js';

export {initHardware,setActiveControlEffect};
export {buildMechanicalGeometry,buildMechanicalPath} from './machine/geometry.js';

export function render(params,sim,overlays,view={mode:'photon',filter:'ff'},radiation=null){
  const beamPath=renderBeam(params,sim,overlays,radiation);
  applySelectorMotion(view.mode);
  updateTreatmentHead(params,view,radiation);
  if(radiation)renderScatter(sim,radiation,{visible:overlays.scatter!==false});
  return beamPath;
}
