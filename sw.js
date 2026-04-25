const STATIC_CACHE = 'dieta-bubu-static-v10';
const RUNTIME_CACHE = 'dieta-bubu-runtime-v10';
const APP_SHELL = './index.html';
const SAME_ORIGIN_ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/data.js',
    './js/generator.js',
    './js/app.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png',
    './icons/avatar-evelyn.svg',
    './vendor/tabler-icons/tabler-icons.min.css',
    './vendor/tabler-icons/fonts/tabler-icons.eot',
    './vendor/tabler-icons/fonts/tabler-icons.ttf',
    './vendor/tabler-icons/fonts/tabler-icons.woff',
    './vendor/tabler-icons/fonts/tabler-icons.woff2',
    './vendor/canvas-confetti/confetti.browser.min.js'
];
const RUNTIME_HOSTS = new Set([
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net'
]);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => cache.addAll(SAME_ORIGIN_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    const cacheAllowlist = [STATIC_CACHE, RUNTIME_CACHE];
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames.map((cacheName) => {
                    if (!cacheAllowlist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                    return undefined;
                })
            ))
            .then(async () => {
                if ('navigationPreload' in self.registration) {
                    await self.registration.navigationPreload.enable();
                }
            })
            .then(() => self.clients.claim())
    );
});

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    const networkPromise = fetch(request)
        .then((response) => {
            if (response && response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cachedResponse);

    return cachedResponse || networkPromise;
}

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    if (event.request.mode === 'navigate') {
        event.respondWith(
            (async () => {
                const preloadResponse = await event.preloadResponse;
                if (preloadResponse) {
                    return preloadResponse;
                }

                return fetch(event.request)
                .then((response) => {
                    if (response && response.ok) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(async () => {
                    return (await caches.match(event.request)) || caches.match(APP_SHELL);
                });
            })()
        );
        return;
    }

    if (url.origin === self.location.origin) {
        event.respondWith(staleWhileRevalidate(event.request, STATIC_CACHE));
        return;
    }

    if (RUNTIME_HOSTS.has(url.hostname)) {
        event.respondWith(staleWhileRevalidate(event.request, RUNTIME_CACHE));
    }
});
