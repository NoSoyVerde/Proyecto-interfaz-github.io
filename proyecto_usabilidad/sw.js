// simple service worker with aggressive caching for static resources
const CACHE_NAME = 'flatsome-static-v1';
const PRECACHE_URLS = [
  './',
  './index.html',
  './static/styles/styles.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // cache-first strategy for anything under /static/ or images
  const req = event.request;
  const url = new URL(req.url);
  // ignore cross-origin requests (fonts/images might be external though) - only cache same origin
  if (url.origin === location.origin) {
    if (url.pathname.includes('/static/') || url.pathname.match(/\.(png|jpg|jpeg|webp|svg)$/)) {
      event.respondWith(
        caches.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req).then(resp => {
            // put copy in cache
            caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone()));
            return resp;
          });
        })
      );
    }
  }
});