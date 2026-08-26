const CACHE='lichtveld-qa-v7-perspective-apriltag';
const CORE=['./','./index.html','./style.css?v=7','./app_v7.js?v=7','./manifest.webmanifest?v=7'];
const REFERENCE='referentieblad_apriltag36h11_v2.svg';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(url.pathname.endsWith('/'+REFERENCE)){event.respondWith(fetch(event.request,{cache:'no-store'}));return;}event.respondWith(fetch(event.request,{cache:'no-cache'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response}).catch(()=>caches.match(event.request)))});
