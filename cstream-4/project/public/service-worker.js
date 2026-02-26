const CACHE_NAME = 'cstream-v1';
const STATIC_CACHE = 'cstream-static-v1';
const DYNAMIC_CACHE = 'cstream-dynamic-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/favicon.ico',
    '/android-chrome-192x192.png',
    '/android-chrome-512x512.png',
    '/site.webmanifest'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Caching static assets');
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.error('[SW] Failed to cache:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Skip chrome extensions and other protocols
    if (!url.protocol.startsWith('http')) return;

    // Skip API calls (let them go to network)
    if (url.pathname.startsWith('/api/') ||
        url.hostname.includes('supabase') ||
        url.hostname.includes('themoviedb') ||
        url.hostname.includes('googleapis')) {
        return;
    }

    // For SPA Navigation Requests (e.g. /admin, /auth)
    // Always fall back to index.html if the network fetch fails (like 404s on refresh under some PWA conditions)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(error => {
                console.error('[SW] Navigation fetch failed, serving offline index.html fallback:', error);
                return caches.match('/index.html');
            })
        );
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                // Return cached version and update cache in background
                event.waitUntil(
                    fetch(request).then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(DYNAMIC_CACHE).then((cache) => {
                                cache.put(request, networkResponse.clone());
                            });
                        }
                    }).catch(() => {
                        // Network failed, cached version already returned
                    })
                );
                return cachedResponse;
            }

            // Not in cache, fetch from network
            return fetch(request).then((networkResponse) => {
                // Cache successful responses
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(DYNAMIC_CACHE).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return networkResponse;
            }).catch((error) => {
                console.error('[SW] Fetch failed:', error);
                return caches.match('/index.html');
            });
        })
    );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
