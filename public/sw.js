/**
 * Service Worker: Caesar Cipher Progressive Web App (PWA)
 * Phase 9: Full Offline Shell & Security-Safe Caching
 */

const CACHE_NAME = 'caesar-cipher-pwa-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

// Security Policy: Never cache sensitive API routes or credentials in SW cache
const EXCLUDED_API_PATTERNS = [
  /\/api\/auth/,
  /\/api\/messages/,
  /\/api\//
];

// 1. Install Event: Pre-cache App Shell & Static Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Best-effort pre-cache (ignore individual fetch errors during install)
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((response) => {
              if (response.ok) {
                return cache.put(url, response);
              }
            })
            .catch(() => {
              // Ignore precache network misses during offline install
            })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Purge Stale Caches & Claim Clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event: Safe Offline Shell Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Security Check: Strictly bypass caching for any backend API routes (zero credential/token caching)
  const isApiRoute = EXCLUDED_API_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (isApiRoute) {
    return; // Pass through straight to network
  }

  // Navigation requests (HTML SPA routing)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedIndex = await cache.match('/index.html') || await cache.match('/');
        if (cachedIndex) {
          return cachedIndex;
        }
        return new Response(
          '<!DOCTYPE html><html><body style="background:#0A0B08;color:#A3B18A;font-family:monospace;padding:2rem;text-align:center;"><h2>Caesar Console // Offline Shell</h2><p>Application is operational in offline airgap mode.</p><button onclick="window.location.reload()" style="background:#141611;color:#A3B18A;border:1px solid #A3B18A;padding:8px 16px;cursor:pointer;">Reload</button></body></html>',
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Static Assets (scripts, styles, images, fonts, icons) -> Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, rely on cache or ignore
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Message Event for manual trigger / update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
