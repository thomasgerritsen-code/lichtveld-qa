const SVG_NS='http://www.w3.org/2000/svg';

export function headModeRouteState({mode='photon',filter='ff'}={}){
  if(mode==='electron'){
    return {
      mode:'electron',
      accent:'#63ddff',
      topology:'head-entrance-to-electron-window-to-dual-scattering-foils-to-monitor',
      stages:[
        {id:'head-entrance',label:'Head entrance'},
        {id:'electron-window',label:'Electron window'},
        {id:'electron-scatter',label:'Primary + shaped secondary foils'},
        {id:'monitor',label:'Monitor chamber'}
      ],
      inactive:['photon-target','photon-filter']
    };
  }

  const fff=filter==='fff';
  return {
    mode:'photon',
    filter:fff?'fff':'ff',
    accent:'#ffd66b',
    topology:fff
      ?'head-entrance-to-photon-target-to-fff-open-filter-position-to-monitor'
      :'head-entrance-to-photon-target-to-flattening-filter-to-monitor',
    stages:[
      {id:'head-entrance',label:'Head entrance'},
      {id:'photon-target',label:'Photon target → bremsstrahlung'},
      {id:'photon-filter',label:fff?'FFF · flattening filter out':'FF · flattening filter in'},
      {id:'monitor',label:'Monitor chamber'}
    ],
    inactive:['electron-window','electron-scatter']
  };
}

function svg(name,attrs={}){
  const element=document.createElementNS(SVG_NS,name);
  for(const [key,value] of Object.entries(attrs))element.setAttribute(key,String(value));
  return element;
}

function ensureOverlay(){
  const hardware=document.querySelector('#machineHardware');
  if(!hardware)return null;
  let group=document.querySelector('#headModeRouteOverlay');
  if(group)return group;

  group=svg('g',{id:'headModeRouteOverlay','data-role':'mode-dependent-head-route','pointer-events':'none'});
  const spine=svg('path',{d:'M1290 765 L1290 925',fill:'none','stroke-width':'2.5','stroke-dasharray':'5 5'});
  spine.classList.add('headModeRouteSpine');
  group.appendChild(spine);

  const ys=[770,820,870,920];
  for(let i=0;i<4;i++){
    const node=svg('g',{'data-route-index':i});
    const circle=svg('circle',{cx:1290,cy:ys[i],r:5,'stroke-width':'1.5'});
    const text=svg('text',{x:1302,y:ys[i]+4,'font-size':'12'});
    node.append(circle,text);
    group.appendChild(node);
  }
  hardware.appendChild(group);
  return group;
}

export function renderHeadModeRoute(state){
  const route=headModeRouteState(state);
  const group=ensureOverlay();
  if(!group)return route;

  group.setAttribute('data-mode',route.mode);
  group.setAttribute('data-topology',route.topology);
  group.querySelector('.headModeRouteSpine')?.setAttribute('stroke',route.accent);

  group.querySelectorAll('[data-route-index]').forEach((node,index)=>{
    const stage=route.stages[index];
    node.setAttribute('data-stage',stage.id);
    const circle=node.querySelector('circle');
    const text=node.querySelector('text');
    circle?.setAttribute('fill',route.accent);
    circle?.setAttribute('stroke',route.accent);
    if(text){
      text.textContent=stage.label;
      text.setAttribute('fill',route.accent);
    }
  });

  const target=document.querySelector('#photonTarget');
  const windowPort=document.querySelector('#electronWindow');
  const photonHead=document.querySelector('#photonHead');
  const electronHead=document.querySelector('#electronHead');
  target?.setAttribute('data-route-state',route.mode==='photon'?'active':'inactive');
  windowPort?.setAttribute('data-route-state',route.mode==='electron'?'active':'inactive');
  photonHead?.setAttribute('data-route-state',route.mode==='photon'?'active':'inactive');
  electronHead?.setAttribute('data-route-state',route.mode==='electron'?'active':'inactive');
  document.querySelector('#flatteningFilter')?.setAttribute('data-filter-state',route.mode==='photon'?(route.filter==='ff'?'in':'out'):'inactive');
  document.querySelector('[data-part="monitor"]')?.setAttribute('data-route-state','shared-downstream');
  return route;
}

export function initHeadModeRoute(controller){
  const update=()=>{
    const machine=controller?.store?.getState?.().machine||{};
    renderHeadModeRoute({mode:machine.mode,filter:machine.filter});
  };
  update();
  return controller?.store?.subscribe?.(update)||(()=>{});
}
