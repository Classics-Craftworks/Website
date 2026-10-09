/* Service worker: makes the site installable (see manifest.json) and caches
   same-origin files for faster repeat visits and basic offline use. */
const CACHE = 'ccw-cache';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function store(request, response) {
  if (response && response.ok && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(request, copy));
  }
  return response;
}

function networkFirst(request) {
  return fetch(request)
    .then(response => store(request, response))
    .catch(() => caches.match(request).then(hit => hit || Response.error()));
}

function staleWhileRevalidate(request) {
  return caches.match(request).then(hit => {
    const refresh = fetch(request).then(response => store(request, response)).catch(() => hit || Response.error());
    return hit || refresh;
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isAsset = request.destination === 'font' || request.destination === 'image';
  event.respondWith(isAsset ? staleWhileRevalidate(request) : networkFirst(request));
});
