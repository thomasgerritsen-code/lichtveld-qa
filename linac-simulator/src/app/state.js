import {UI_DEFAULTS} from '../machine/model.js';

export function createInitialState(){
  return {
    controls:{...UI_DEFAULTS},
    machine:{
      mode:'photon',
      filter:'ff',
      direction:'cw'
    },
    beamControl:{
      mode:'manual'
    },
    display:{
      dispersion:true,
      envelope:true,
      labels:true,
      mismatch:false,
      vectors:false
    },
    runtime:{
      paused:false,
      activeControlId:null
    }
  };
}
