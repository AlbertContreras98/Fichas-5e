// Sube VERSION cada vez que cambies la app para que los dispositivos descarguen la nueva.
const VERSION = 'fichas-v51';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'css/themes.css',
  'data/classes.js',
  'data/spells.js',
  'data/origins.js',
  'data/glossary.js',
  'data/creatures.js',
  'data/items.js',
  'data/beasts.js',
  'js/core/constants.js',
  'js/core/utils.js',
  'js/core/model.js',
  'js/core/rules.js',
  'js/ui/glossary.js',
  'js/ui/modals.js',
  'js/features/creatures.js',
  'js/core/effects.js',
  'js/views/top.js',
  'js/views/play.js',
  'js/views/turn.js',
  'js/views/inventory.js',
  'js/views/editor.js',
  'js/views/characters.js',
  'js/views/render.js',
  'js/features/tour.js',
  'js/features/spell-search.js',
  'js/features/wizard.js',
  'js/features/diary.js',
  'js/features/rest.js',
  'js/actions/index.js',
  'js/actions/play.js',
  'js/actions/combat.js',
  'js/actions/inventory.js',
  'js/actions/creatures.js',
  'js/actions/diary.js',
  'js/actions/rest.js',
  'js/actions/wizard.js',
  'js/actions/characters.js',
  'js/actions/settings.js',
  'js/events.js',
  'js/pwa.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/favicon.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches
      .open(VERSION)
      .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches
      .keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Página: primero la red (para coger actualizaciones), si no hay conexión, la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req.url, { cache: 'no-cache' })
        .then(r => {
          const cp = r.clone();
          caches.open(VERSION).then(c => c.put('index.html', cp));
          return r;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }
  // Código de la app: primero la red, si no hay conexión, la copia guardada.
  if (url.origin === location.origin && /\.(js|css)$/.test(url.pathname)) {
    e.respondWith(
      fetch(req.url, { cache: 'no-cache' })
        .then(r => {
          const cp = r.clone();
          caches.open(VERSION).then(c => c.put(req, cp));
          return r;
        })
        .catch(() => caches.match(req))
    );
    return;
  }
  // Resto (iconos, fuentes de Google): copia guardada al instante y se refresca por detrás.
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(
      caches.open(VERSION).then(async c => {
        const hit = await c.match(req);
        const net = fetch(req)
          .then(r => {
            if (r.ok || r.type === 'opaque') c.put(req, r.clone());
            return r;
          })
          .catch(() => hit);
        return hit || net;
      })
    );
  }
});
