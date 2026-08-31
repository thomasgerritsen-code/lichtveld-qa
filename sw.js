const CACHE='linac-dashboard-v25-clean-v18';
const CORE=[
  './','./index.html?v=18','./dashboard.css?v=4','./manifest.webmanifest?v=13','./umc-utrecht-banner.svg?v=1',
  './apparaatkeuze.html?v=2','./linac-controles.html?v=2','./mrl-controles.html?v=1',
  './e3m1.html?v=1','./e3m2.html?v=1','./e3m3.html?v=1','./e3m4.html?v=1',
  './wekelijkse-linac.html?v=1','./crosshair_v1.js?v=1','./crosshair_guard_v1.js?v=1','./referentieblad_apriltag36h11_v4.svg?v=1',
  './periodieke-controles.html?v=13','./style.css?v=13','./app_v7.js?v=13','./weekly.js?v=13',
  './manuals.html?v=1','./all-diagrams.html?v=1'
];
const REFERENCES=['referentieblad_apriltag36h11_v3.svg','referentieblad_apriltag36h11_v4.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.origin!==self.location.origin)return;if(REFERENCES.some(name=>url.pathname.endsWith('/'+name))){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}event.respondWith(fetch(event.request,{cache:'no-cache'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)))});