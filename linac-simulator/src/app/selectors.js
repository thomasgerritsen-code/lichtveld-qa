export function selectRawControls(state){
  return {...state.controls};
}

export function selectViewState(state){
  return {
    powerOn:state.machine.powerOn,
    beamOn:state.machine.beamOn,
    mode:state.machine.mode,
    filter:state.machine.filter,
    direction:state.machine.direction,
    controlMode:state.beamControl.mode,
    gantry:state.controls.gantry
  };
}

export function selectOverlayState(state){
  return {
    disp:state.display.dispersion,
    envelope:state.display.envelope,
    labels:state.display.labels,
    bad:state.display.mismatch,
    vectors:state.display.vectors,
    scatter:state.display.scatter
  };
}
