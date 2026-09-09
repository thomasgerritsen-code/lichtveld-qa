import {initHardware} from './machine/hardware.js';
import {renderBeam} from './machine/beam-renderer.js';
import {applySelectorMotion} from './machine/target-selector.js';
import {updateTreatmentHead} from './machine/treatment-head.js';
import {setActiveControlEffect} from './machine/highlight.js';
import {renderScatter} from './machine/scatter-renderer.js';
import {updateRfAnimation} from './machine/rf-renderer.js';

export {initHardware,setActiveControlEffect};
export {buildMechanicalGeometry,buildMechanicalPath} from './machine/geometry.js';

export function render(params,sim,overlays,view={mode:'photon',filter:'ff'},radiation=null,delivery=null){
  const beamPath=renderBeam(params,sim,overlays,radiation,delivery,view);
  applySelectorMotion(view.mode);
  updateTreatmentHead(params,view,delivery);
  updateRfAnimation(sim,delivery,view);
  if(radiation){
    renderScatter(sim,radiation,{
      visible:Boolean(delivery?.beamActive&&delivery?.sourceActive)&&overlays.scatter!==false
    });
  }
  return beamPath;
}
