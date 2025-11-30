// Service Worker Padrão para PWA
const CACHE_NAME = 'gloova-pwa-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon-512.png?v=2'
];

self.addEventListener('install', (event) => {
  // Força o SW a assumir o controle imediatamente
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', (event) => {
  // Limpa caches antigos para garantir que o novo ícone apareça
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  );
});