import {createController} from './controller.js';
import {initMobileUx} from './mobile-ux.js';
import {initGoldenPath} from './golden-path.js';
import {initFocusSteeringGraphics} from '../ui/machine/focus-steering-graphics.js';
import {initFocusCoilFidelity} from '../ui/machine/focus-coil-fidelity.js';
import {initBackscatterPlateGraphics} from '../ui/machine/backscatter-plate.js';
import {initRfWaveguideTopologyGraphics} from '../ui/machine/rf-waveguide-topology.js';
import {initAgilityLeafGuides} from '../ui/machine/agility-guides.js';
import {initAgilityCausality} from '../ui/machine/agility-causality.js';
import {initHeadModeRoute} from '../ui/machine/head-mode-route.js';
import {initPatientPlane} from '../ui/patient-plane.js';
import {initSlalomContinuity} from '../../js/slalom-continuity.js';

for(const href of ['./mobile.css?v=1','./focus-steering.css?v=1','./golden-path.css?v=1']){
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=href;
  document.head.appendChild(link);
}

const controller=createController();
controller.start();
initMobileUx();
initFocusSteeringGraphics();
initFocusCoilFidelity();
initBackscatterPlateGraphics();
initRfWaveguideTopologyGraphics();
initAgilityLeafGuides();
initAgilityCausality(controller);
initSlalomContinuity();
initHeadModeRoute(controller);
initPatientPlane(controller);
initGoldenPath(controller);

window.linacApp=controller;