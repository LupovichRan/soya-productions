/* Kafka Check service worker. Scope: this folder only.
   Bump VERSION (kafkacheck-YYYYMMDDHHMMSS) whenever a cached file changes. */
const VERSION = 'kafkacheck-20261121170955';

const PRECACHE = [
  './',
  'index.html',
  'styles.css',
  'rules.js',
  'app.js',
  'manifest.webmanifest',
  'icons/kafka-192.png',
  'icons/kafka-512.png',
  'icons/kafka-maskable-512.png',
  'icons/kafka-apple-180.png',
  'assets/soycatory-mark.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('kafkacheck-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/** Fresh copy first; after 4 seconds, or with no network, use the saved copy. */
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
  // Only this app's own files. Fonts and other apps are left alone.
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location).pathname)) return;
  event.respondWith(networkFirst(request));
});
