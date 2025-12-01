const CACHE_NAME = 'gloova-v9-final-icon'; // Versão nova
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-512.png' // Nome correto da sua imagem
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // O .catch garante que se a imagem falhar, o app ainda instala
      return cache.addAll(urlsToCache).catch(err => console.warn('Erro no cache:', err));
    })
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

  // Estratégia Network First para dados, Cache First para assets
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});