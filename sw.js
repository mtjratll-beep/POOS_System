// Service Worker for نظام محاسبي قافلة الصحراء
// Enables full offline functionality

const CACHE_NAME = 'desert-caravan-v3';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './manifest.json',
    './logo.png',
    './html2pdf.bundle.min.js',
    './sw.js'
];

// Install: cache all core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.all(ASSETS_TO_CACHE.map(asset => cache.add(asset).catch(err => console.log('Asset cache skipped:', asset, err)))).catch(err => {
                console.log('Cache addAll error (non-critical):', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((name) => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: serve from cache, fall back to network (cache-first for offline)
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return cached response if available (works offline)
            if (cachedResponse) {
                return cachedResponse;
            }
            // Otherwise try network and cache the result
            return fetch(event.request).then((networkResponse) => {
                // Only cache successful responses
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Network failed and no cache - return offline fallback
                if (event.request.destination === 'document') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});
