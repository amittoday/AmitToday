const CACHE_NAME = 'amit-app-v4';
const API_CACHE_NAME = 'amit-api-cache-v4';

const STATIC_ASSETS = [
  '/',
  '/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching core offline assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn("[ServiceWorker] Initial static cache failed (expected in production), dynamic caching will catch resources:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            console.log('[ServiceWorker] Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests for static asset caching, but handle APIs
  if (event.request.method !== 'GET' && event.request.method !== 'POST') {
    return;
  }

  // API Caching Strategy: Network First, falling back to cached response
  if (url.pathname.startsWith('/api/')) {
    const isDataQuery = 
      url.pathname === '/api/data/collection' || 
      url.pathname === '/api/chat/history' || 
      url.pathname === '/api/notifications' || 
      url.pathname === '/api/services-master' ||
      url.pathname === '/api/admin/orders' ||
      url.pathname.startsWith('/api/orders/track/');

    if (isDataQuery) {
      event.respondWith(
        fetch(event.request.clone())
          .then((response) => {
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(API_CACHE_NAME).then((cache) => {
                if (event.request.method === 'POST') {
                  // Cache POST request by reading the request body and indexing under a custom virtual GET URL
                  event.request.clone().text().then(bodyText => {
                    const virtualUrl = event.request.url + '?body=' + encodeURIComponent(bodyText);
                    cache.put(virtualUrl, responseClone);
                  });
                } else {
                  cache.put(event.request, responseClone);
                }
              });
            }
            return response;
          })
          .catch(async () => {
            // Offline fallback: try to serve matching cached response
            console.log('[ServiceWorker] API call failed or offline. Serving from API cache:', url.pathname);
            const cache = await caches.open(API_CACHE_NAME);
            if (event.request.method === 'POST') {
              try {
                const bodyText = await event.request.clone().text();
                const virtualUrl = event.request.url + '?body=' + encodeURIComponent(bodyText);
                const matched = await cache.match(virtualUrl);
                if (matched) {
                  return matched;
                }
              } catch (e) {
                console.warn("[ServiceWorker] Offline POST cache read failed:", e);
              }
            } else {
              const matchedDirect = await cache.match(event.request);
              if (matchedDirect) {
                return matchedDirect;
              }
            }

            // Return generic offline JSON structure
            return new Response(JSON.stringify({ 
              success: true, 
              offline: true, 
              data: [], 
              message: "Offline mode enabled. Currently demonstrating stored local ledger data." 
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          })
      );
      return;
    }
  }

  // Google Fonts & Static Assets Strategy: Cache First, fallback to Network
  const isGoogleFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const isStaticAsset = 
    url.pathname.includes('/assets/') || 
    url.pathname.endsWith('.js') || 
    url.pathname.endsWith('.css') || 
    url.pathname.endsWith('.png') || 
    url.pathname.endsWith('.jpg') || 
    url.pathname.endsWith('.jpeg') || 
    url.pathname.endsWith('.gif') || 
    url.pathname.endsWith('.svg') || 
    url.pathname.endsWith('.ico') || 
    url.pathname.endsWith('.woff') || 
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.ttf');

  if (isGoogleFont || isStaticAsset || STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          // Cache successful responses or opaque CORS responses (status 0) for Google Fonts/CDN assets
          if ((response.status === 200 || response.status === 0) && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch((err) => {
          console.warn('[ServiceWorker] Static asset fetch failed and not in cache:', url.pathname, err);
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html') || caches.match('/');
          }
        });
      })
    );
    return;
  }

  // Default fallback: Network First, then cache fallback for navigate requests
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('/index.html') || caches.match('/');
      }
    })
  );
});
