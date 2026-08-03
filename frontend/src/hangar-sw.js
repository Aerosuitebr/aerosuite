const CACHE = 'aerosuite-hangar-v3';
const API_CACHE = 'aerosuite-hangar-api-v1';
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/favicon.ico', '/favicon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.filter(key => key !== CACHE && key !== API_CACHE).map(key => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function isStaticAsset(pathname) {
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.startsWith('/assets/')
  );
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  const url = new URL(event.request.url);
  if (!isSameOrigin(url)) {
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    if (event.request.method === 'GET' && url.pathname.startsWith('/api/os/job-card/')) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(API_CACHE).then(cache => cache.put(event.request, copy));
            }
            return response;
          })
          .catch(() => caches.match(event.request).then(cached => cached || fetch(event.request)))
      );
    }
    return;
  }

  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname.startsWith('/hangar')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() =>
          caches.match('/index.html').then(cached => cached || caches.match('/index.html'))
        )
    );
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then(response => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
  }
});
