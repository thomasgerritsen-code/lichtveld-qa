import {MODEL} from '../../machine/model.js';
import {DEG} from './geometry.js';

export function selectorVector(){
  const travel=MODEL.visual?.selectorTravelPx||0;
  const angle=(MODEL.visual?.selectorAxisDeg??0)*DEG;
  return {x:Math.cos(angle)*travel,y:Math.sin(angle)*travel};
}

export function applySelectorMotion(mode){
  const vector=selectorVector();
  const electron=mode==='electron';
  const dx=electron?vector.x:0;
  const dy=electron?vector.y:0;

  const tube=document.querySelector('#flightTubeCarriage');
  const carriage=document.querySelector('#selectorCarriage');
  if(tube)tube.style.transform=`translate(${dx}px,${dy}px)`;
  if(carriage)carriage.style.transform=`translate(${dx}px,${dy}px)`;

  const window=document.querySelector('#electronWindow');
  if(window)window.setAttribute('transform',`translate(${-vector.x.toFixed(2)} ${-vector.y.toFixed(2)})`);

  const lines=[...document.querySelectorAll('#bellowsLines line')];
  lines.forEach((line,index)=>{
    const fraction=(index+1)/(lines.length+1);
    line.style.transform=`translate(${(dx*fraction).toFixed(2)}px,${(dy*fraction).toFixed(2)}px)`;
  });

  document.querySelector('#selectorGuide')?.classList.toggle('electronSelected',electron);
}

export function enableSelectorTransitions(){
  for(const element of [
    document.querySelector('#flightTubeCarriage'),
    document.querySelector('#selectorCarriage')
  ]){
    if(!element)continue;
    element.style.transition='transform .55s cubic-bezier(.2,.8,.2,1)';
    element.style.transformBox='fill-box';
    element.style.transformOrigin='center';
  }

  document.querySelectorAll('#bellowsLines line').forEach(line=>{
    line.style.transition='transform .55s cubic-bezier(.2,.8,.2,1)';
    line.style.transformBox='fill-box';
    line.style.transformOrigin='center';
  });
}
