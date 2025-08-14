const CACHE = 'carplay-webplayer-v1';
const ASSETS = ['/', '/index.html', '/app.js', '/manifest.webmanifest',
  '/cover-96.png', '/cover-192.png', '/cover-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => self.clients.claim());

// 簡易: まずキャッシュ、なければネット（stale-while-revalidateに近い）
self.addEventListener('fetch', (e) => {
  const { request } = e;
  e.respondWith((async () => {
    const cached = await caches.match(request);
    const fetchPromise = fetch(request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(request, copy));
      return res;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});
