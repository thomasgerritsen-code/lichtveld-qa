import {createController} from './controller.js';
import {initMobileUx} from './mobile-ux.js';

const mobileStyles=document.createElement('link');
mobileStyles.rel='stylesheet';
mobileStyles.href='./mobile.css?v=1';
document.head.appendChild(mobileStyles);

const controller=createController();
controller.start();
initMobileUx();

window.linacApp=controller;
