const CACHE_NAME = 'mark-forster-v1-dynamic';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.tsx',
  '/icon.svg',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request)
            .then(networkResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    if (event.request.url.startsWith('chrome-extension://')) {
                        return networkResponse;
                    }
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            })
            .catch(() => {
                return caches.match(event.request)
                    .then(cachedResponse => {
                        return cachedResponse || new Response('Network error occurred and no cache available', {
                            status: 404,
                            statusText: 'Not Found'
                        });
                    });
            })
    );
});
