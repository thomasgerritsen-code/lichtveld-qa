const CACHE='linac-weekly-qa-v12';
const CORE=['./','./index.html?v=12','./style.css?v=12','./app_v7.js?v=12','./weekly.js?v=12','./manifest.webmanifest?v=12','./umc-utrecht-banner.svg?v=1'];
const REFERENCES=['referentieblad_apriltag36h11_v3.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(REFERENCES.some(name=>url.pathname.endsWith('/'+name))){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}event.respondWith(fetch(event.request,{cache:'no-cache'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)))});
