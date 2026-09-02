const CACHE='fitness-coach-v11';
const APP_SHELL=['./','./index.html','./manifest.webmanifest','./favicon.ico',
'./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install', event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event=>{
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys=>Promise.all(
        keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
      ))
    ])
  );
});

self.addEventListener('fetch', event=>{
  const req=event.request;
  if(req.method!=='GET') return;

  // HTML/app shell: always try the network first so GitHub Pages changes
  // are picked up immediately. Fall back to cache when offline.
  if(req.mode==='navigate' || new URL(req.url).pathname.endsWith('/index.html')){
    event.respondWith(
      fetch(req, {cache:'no-store'})
        .then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy));
          return res;
        })
        .catch(()=>caches.match(req).then(r=>r || caches.match('./index.html')))
    );
    return;
  }

  // Other assets: network first, cache fallback.
  event.respondWith(
    fetch(req)
      .then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(c=>c.put(req,copy));
        return res;
      })
      .catch(()=>caches.match(req))
  );
});
