/* Soya Market Radar service worker. Scope: this folder only. Research notes come from another address and are
   not cached here; the app keeps its own last copy so the list still shows offline.
   Bump VERSION (soyaradar-YYYYMMDDHHMMSS) whenever a cached file changes. */
const VERSION = 'soyaradar-20261121173452';

const PRECACHE = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'config.js',
  'manifest.webmanifest',
  'icons/radar-192.png',
  'icons/radar-512.png',
  'icons/radar-maskable-512.png',
  'icons/radar-apple-180.png',
  'assets/soycatory-mark.jpg',
  'assets/soya-glasses.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('soyaradar-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request, { ignoreSearch: request.mode === 'navigate' });
  const fresh = fetch(request).then((response) => {
    if (response && response.ok && response.type === 'basic') cache.put(request, response.clone());
    return response;
  });
  if (!cached) {
    try { return await fresh; } catch (err) { return (await cache.match('index.html')) || Response.error(); }
  }
  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 4000));
  try {
    const winner = await Promise.race([fresh, timeout]);
    if (winner && winner.ok) return winner;
  } catch (err) { /* offline: use the saved copy */ }
  fresh.catch(() => {});
  return cached;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location).pathname)) return;
  event.respondWith(networkFirst(request));
});
