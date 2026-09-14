import {createController} from './controller.js';
import {initMobileUx} from './mobile-ux.js';
import {initGoldenPath} from './golden-path.js';
import {initFocusSteeringGraphics} from '../ui/machine/focus-steering-graphics.js';
import {initPatientPlane} from '../ui/patient-plane.js';

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
initPatientPlane(controller);
initGoldenPath(controller);

window.linacApp=controller;
