const CACHE='lichtveld-qa-v6-versioned-reference';
const CORE=['./','./index.html','./style.css?v=6','./app.js?v=6','./manifest.webmanifest?v=6'];
const REFERENCE='referentieblad_apriltag36h11_v1.svg';

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);

  // Het referentieblad is bewust network-first en wordt niet permanent gecachet.
  // Een nieuwe versie krijgt bovendien altijd een nieuwe bestandsnaam.
  if(url.pathname.endsWith('/'+REFERENCE)){
    event.respondWith(
      fetch(event.request,{cache:'no-store'})
        .catch(()=>caches.match(event.request))
    );
    return;
  }

  // HTML en versiegebonden kernbestanden: network-first, cache alleen als fallback.
  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>caches.match(event.request))
  );
});
