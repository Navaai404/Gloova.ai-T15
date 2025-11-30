const CACHE_NAME = 'gloova-live-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força ativação imediata
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});