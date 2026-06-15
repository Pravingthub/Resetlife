/* Reset 87 — service worker. Network-first for the page, cache-first for assets. */
const CACHE = 'reset87-v9';
const ASSETS = [
  './','./index.html','./manifest.webmanifest',
  './icon-192.png','./icon-512.png','./icon-maskable-512.png','./apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const req = e.request;
  const isDoc = req.mode === 'navigate' || req.destination === 'document';
  if (isDoc) {
    // network-first: always get the freshest page when online
    e.respondWith(
      fetch(req).then(resp => {
        try { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{}); } catch(_){}
        return resp;
      }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
    );
    return;
  }
  // assets: cache-first with background refresh
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(resp => {
        try { const copy = resp.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{}); } catch(_){}
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
