import {initHardware} from './machine/hardware.js';
import {renderBeam} from './machine/beam-renderer.js';
import {applySelectorMotion} from './machine/target-selector.js';
import {updateTreatmentHead} from './machine/treatment-head.js';
import {setActiveControlEffect} from './machine/highlight.js';

export {initHardware,setActiveControlEffect};
export {buildMechanicalGeometry,buildMechanicalPath} from './machine/geometry.js';

export function render(params,sim,overlays,view={mode:'photon',filter:'ff'}){
  const beamPath=renderBeam(params,sim,overlays);
  applySelectorMotion(view.mode);
  updateTreatmentHead(params,view);
  return beamPath;
}
