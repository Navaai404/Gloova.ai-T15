const CACHE_NAME = 'gloova-v12-pwa-fix'; 
const urlsToCache = [
  '/',
  '/index.html',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching files');
      // Usa .catch para não quebrar se uma imagem faltar
      return cache.addAll(urlsToCache).catch(err => console.warn('SW: Cache parcial (verifique se as imagens existem na pasta public):', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
             return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image') {
     event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
           const fetchPromise = fetch(event.request).then((networkResponse) => {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
              return networkResponse;
           });
           return cachedResponse || fetchPromise;
        })
     );
     return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});