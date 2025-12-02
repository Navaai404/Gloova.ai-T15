const CACHE_NAME = 'gloova-v15-supabase-icon'; // Versão nova para forçar atualização
const urlsToCache = [
  '/',
  '/index.html',
  // URL Oficial do Ícone no Supabase
  'https://vqqmimgdziakrpoekspw.supabase.co/storage/v1/object/public/assets/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Força ativação imediata
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: Caching files from Supabase Storage');
      // Usa .catch para não quebrar a instalação se a URL falhar
      return cache.addAll(urlsToCache).catch(err => console.warn('SW: Erro ao cachear ícone:', err));
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