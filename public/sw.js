// Service worker de Resist : rend l'app installable (et donc présente dans le menu Partager
// d'Android) et garde la dernière version de Paraphe pour l'ouvrir sans réseau.
const CACHE = 'resist-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.mode !== 'navigate') return;
  const url = new URL(req.url);
  if (url.pathname !== '/paraphe') return;
  // Réseau d'abord (pour recevoir ?text= du partage) ; la page n'est gardée que si c'est bien Paraphe.
  e.respondWith(fetch(req).then(r => {
    if (r.ok && r.headers.get('x-paraphe') === '1') { const copie = r.clone(); caches.open(CACHE).then(c => c.put('/paraphe', copie)) }
    return r
  }).catch(() => caches.match('/paraphe').then(r => r || Response.error())));
});
