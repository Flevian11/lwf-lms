const CACHE_NAME = 'lwf-static-v1';

const STATIC_ASSETS = [
    '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );

    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            )
        )
    );

    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    /*
     * Never cache authenticated application navigation,
     * API requests, POST-like mutations, or dynamic LMS data.
     */
    if (
        request.mode === 'navigate' ||
        url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/admin/')
    ) {
        event.respondWith(
            fetch(request).catch(() => caches.match('/'))
        );

        return;
    }

    event.respondWith(
        fetch(request).catch(() => caches.match(request))
    );
});