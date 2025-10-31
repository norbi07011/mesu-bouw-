// Service Worker - umożliwia działanie offline i instalację PWA
const CACHE_NAME = 'norbs-faktur-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Instalacja Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => {
        console.log('[SW] Cache failed:', err);
      })
  );
  self.skipWaiting();
});

// Aktywacja Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Przechwytywanie requestów - strategia Network First (zawsze świeże dane)
self.addEventListener('fetch', (event) => {
  // Ignoruj chrome-extension i inne nietypowe requesty
  if (!event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Jeśli dostaliśmy odpowiedź, zapisz w cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Jeśli nie ma sieci, użyj cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Fallback dla HTML
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
        });
      })
  );
});

// Obsługa wiadomości z aplikacji
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

