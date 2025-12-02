const CACHE_NAME = 'gloova-v14-cdn-icons'; // Nova versão para limpar cache antigo
const urlsToCache = [
  '/',
  '/index.html',
  // URL Externa do ícone (CDN)
  'https://cdn-icons-png.flaticon.com/512/2652/2652218.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força ativação imediata
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching files from CDN');
      // Usa .catch para não quebrar a instalação se a CDN falhar
      return cache.addAll(urlsToCache).catch(err => console.warn('SW: Erro ao cachear CDN:', err));
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

  // Estratégia Network First para o App
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