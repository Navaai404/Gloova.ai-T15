// Service Worker Básico para PWA
const CACHE_NAME = 'gloova-app-v1';

// Instalação
self.addEventListener('install', (event) => {
  self.skipWaiting();
  console.log('[Service Worker] Instalado');
});

// Ativação
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado');
  return self.clients.claim();
});

// Interceptação de Rede (Cache First Strategy simplificada para offline básico)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});