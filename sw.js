const CACHE='linac-dashboard-v38-architecture-v10';
const CORE=[
  './','./index.html?v=26','./dashboard.css?v=4','./manifest.webmanifest?v=13','./umc-utrecht-banner.svg?v=1',
  './apparaatkeuze.html?v=2','./linac-controles.html?v=2','./mrl-controles.html?v=1',
  './e3m1.html?v=1','./e3m2.html?v=1','./e3m3.html?v=1','./e3m4.html?v=1',
  './wekelijkse-linac.html?v=3','./crosshair_v1.js?v=1','./crosshair_guard_v1.js?v=1','./meetdata_weekly_v1.js?v=3',
  './meetdata-helper.html?v=3','./meetdata-clipboard-helper-v1.js?v=3','./referentieblad_apriltag36h11_v4.svg?v=1',
  './periodieke-controles.html?v=13','./style.css?v=13','./app_v7.js?v=13','./weekly.js?v=13',
  './manuals.html?v=1','./all-diagrams.html?v=8',
  './linac-simulator/index.html','./linac-simulator/simulator.css','./linac-simulator/src/app/bootstrap.js','./linac-simulator/src/app/controller.js','./linac-simulator/src/app/state.js','./linac-simulator/src/app/store.js','./linac-simulator/src/app/selectors.js','./linac-simulator/src/machine/model.js','./linac-simulator/src/machine/control-effects.js','./linac-simulator/src/data/sources.js','./linac-simulator/src/physics/beam-model.js','./linac-simulator/src/physics/beam-state.js','./linac-simulator/src/physics/feedback.js','./linac-simulator/src/physics/detector.js','./linac-simulator/src/physics/math/matrix.js','./linac-simulator/src/physics/optics/elements.js','./linac-simulator/src/physics/bending/elements.js','./linac-simulator/src/ui/machine-renderer.js','./linac-simulator/src/ui/training.js','./linac-simulator/src/ui/metrics.js','./linac-simulator/src/ui/diagnostics.js'
];
const REFERENCES=['referentieblad_apriltag36h11_v3.svg','referentieblad_apriltag36h11_v4.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;if(REFERENCES.some(name=>url.pathname.endsWith('/'+name))){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}event.respondWith(fetch(event.request,{cache:'no-cache'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)))});