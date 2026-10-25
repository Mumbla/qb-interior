// Offline cache: serve from the network first, fall back to cache when offline.
const CACHE = 'blockgo-v1';
const CORE = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest', 'icons/icon.svg',
  'js/main.js', 'js/state.js', 'js/board.js', 'js/pieces.js', 'js/render.js', 'js/fx.js', 'js/audio.js',
  'js/icons.js', 'js/ui.js', 'js/game.js', 'js/events.js', 'js/cards.js', 'js/shop.js', 'js/social.js', 'js/menu.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
