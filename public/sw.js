const CACHE_NAME = 'gloova-v5-icon'; // Versão incrementada para forçar atualização
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-512.png' // Agora o ícone será cacheado
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
  // Estratégia Stale-While-Revalidate para imagens
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

  // Estratégia Padrão
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});