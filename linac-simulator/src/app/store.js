import {createInitialState} from './state.js';

export function reducer(state,action){
  switch(action.type){
    case 'control/set':
      return {...state,controls:{...state.controls,[action.id]:action.value}};
    case 'control/input':
      return {
        ...state,
        controls:{...state.controls,[action.id]:action.value},
        runtime:{...state.runtime,activeControlId:action.id}
      };
    case 'controls/setMany':
      return {...state,controls:{...state.controls,...action.values}};
    case 'machine/set':
      return {...state,machine:{...state.machine,[action.key]:action.value}};
    case 'beamControl/setMode':
      return {...state,beamControl:{...state.beamControl,mode:action.mode}};
    case 'display/set':
      return {...state,display:{...state.display,[action.key]:action.value}};
    case 'runtime/set':
      return {...state,runtime:{...state.runtime,[action.key]:action.value}};
    case 'app/reset':
      return createInitialState();
    default:
      return state;
  }
}

export function createStore(initialState=createInitialState()){
  let state=initialState;
  const listeners=new Set();

  return {
    getState(){return state;},
    dispatch(action){
      const next=reducer(state,action);
      if(next===state)return action;
      state=next;
      listeners.forEach(listener=>listener(state,action));
      return action;
    },
    subscribe(listener){
      listeners.add(listener);
      return ()=>listeners.delete(listener);
    }
  };
}
