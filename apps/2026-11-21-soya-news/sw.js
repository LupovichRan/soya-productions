/* Soya News service worker. Scope: this folder only.
   Bump VERSION (soyanews-YYYYMMDDHHMMSS) whenever a cached file changes.
   It also checks for a new issue about once a day where the browser allows it (periodic background sync on an
   installed app), and shows a notification if one appears. Soycatory runs no push server; the 'push' handler is
   here for when one exists. Nothing is sent from here. */
const VERSION = 'soyanews-20261121103000';
const META = 'soyanews-meta';

const PRECACHE = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'issues.json',
  'manifest.webmanifest',
  'icons/news-192.png',
  'icons/news-512.png',
  'icons/news-maskable-512.png',
  'icons/news-apple-180.png',
  'assets/soycatory-mark.jpg',
  'assets/soya-sit.svg',
  'assets/soya-happy.svg',
  'assets/soya-wow.svg',
  'assets/soya-glasses.svg',
  'assets/soya-party.svg',
  'assets/soya-crown.svg',
  'assets/soya-bell.svg',
  'assets/soya-sleepy.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('soyanews-') && k !== VERSION && k !== META).map((k) => caches.delete(k))))
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

/* The id of the newest issue this device knows about, kept in a small cache entry. */
async function seenId() { const r = await (await caches.open(META)).match('seen'); return r ? r.text() : ''; }
async function setSeen(id) { if (id) await (await caches.open(META)).put('seen', new Response(String(id))); }

const WORDS = {
  en: ['Soya News', 'A new issue is out! Tap to read it.'],
  he: ['החדשות של סויה', 'יצא גיליון חדש! לוחצים כדי לקרוא.'],
  fr: ['Les Nouvelles de Soya', 'Un nouveau numéro est sorti ! Touche pour le lire.'],
};
function words(lang) { return WORDS[lang] || WORDS.en; }

async function checkForIssue() {
  const res = await fetch(new URL('issues.json', self.location), { cache: 'no-cache' });
  if (!res.ok) return;
  const data = await res.json();
  const latest = data && data.issues && data.issues[0];
  if (!latest) return;
  const seen = await seenId();
  if (seen && latest.id !== seen) {
    const lang = (await (await caches.open(META)).match('lang').then((r) => r && r.text())) || 'en';
    const [title, body] = words(lang);
    await self.registration.showNotification(title, { body, icon: 'icons/news-192.png', badge: 'icons/news-192.png', tag: 'soya-news', data: { url: './?issue=' + encodeURIComponent(latest.id) } });
  }
  await setSeen(latest.id);
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'soya-news-check') event.waitUntil(checkForIssue().catch(() => {}));
});

self.addEventListener('push', (event) => {
  let msg = {}; try { msg = event.data ? event.data.json() : {}; } catch (err) { msg = {}; }
  const [title, body] = words(msg.lang);
  event.waitUntil(self.registration.showNotification(msg.title || title, { body: msg.body || body, icon: 'icons/news-192.png', tag: 'soya-news', data: { url: msg.url || './' } }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL((event.notification.data && event.notification.data.url) || './', self.location).href;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) if (c.url.startsWith(new URL('./', self.location).href) && 'focus' in c) { c.navigate(target); return c.focus(); }
    return self.clients.openWindow(target);
  }));
});

self.addEventListener('message', (event) => {
  const m = event.data || {};
  if (m.type === 'seen') event.waitUntil(setSeen(m.id).then(() => m.lang ? caches.open(META).then((c) => c.put('lang', new Response(String(m.lang)))) : null));
});
