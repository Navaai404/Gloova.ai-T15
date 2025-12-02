const CACHE_NAME = 'gloova-v11-final-icons'; // Nova versão para limpar cache antigo
const urlsToCache = [
  '/',
  '/index.html',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon-32x32.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força ativação imediata
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching files');
      // Usa .catch para não quebrar a instalação se um ícone faltar
      return cache.addAll(urlsToCache).catch(err => console.warn('SW: Cache parcial:', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
             console.log('SW: Clearing old cache', name);
             return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Estratégia Stale-While-Revalidate para imagens (Ícones carregam rápido)
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

  // Estratégia Network First para o App (Garante atualização)
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