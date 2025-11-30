const CACHE_NAME = 'gloova-v7-native';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
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
  // Prioriza cache para imagens para performance, network para dados
  if (event.request.destination === 'image') {
     event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
           return cachedResponse || fetch(event.request);
        })
     );
  } else {
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});