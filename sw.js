/* Service worker: makes the site installable (see manifest.json), keeps the
   page shell available offline, and speeds up repeat visits.

   - Pages, scripts and styles: network first, so updates show straight away.
     If the network is slow (NETWORK_TIMEOUT_MS) or down, the cached copy is
     used; a slow request keeps going and refreshes the cache for next time.
   - Fonts and images: cached copy first, refreshed in the background.
   - Offline, a page that was never cached falls back to the home page.

   Bump CACHE when this file's strategy changes; old caches are deleted on
   activate. SHELL below is only a head start: anything missing from it is
   still cached the first time it is fetched. */
const CACHE = 'ccw-cache-v2';
const NETWORK_TIMEOUT_MS = 4000;

const SHELL = [
  '/',
  '/data-packs-mods',
  '/resource-packs',
  '/other-projects',
  '/about',
  '/styles.css',
  '/site-error.js',
  '/data.js',
  '/stats.js',
  '/section-page.js',
  '/index.js',
  '/about.js',
  '/search.js',
  '/manifest.json',
  '/fonts/Inter-Regular.woff2',
  '/fonts/Inter-Medium.woff2',
  '/fonts/Inter-SemiBold.woff2',
  '/fonts/Inter-Bold.woff2',
  '/fonts/minercraftory.woff2',
  '/images/logo.png',
  '/images/background.png',
  '/images/splash-bg.webp'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      // One missing file shouldn't stop the worker installing, so each is added on its own.
      // `reload` skips the browser's HTTP cache so the shell starts out fresh.
      .then(cache => Promise.allSettled(SHELL.map(url => cache.add(new Request(url, { cache: 'reload' })))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function store(request, response) {
  // Only complete, same-origin successes (not 404s or partial 206 responses).
  if (response && response.status === 200 && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
  }
  return response;
}

function cachedMatch(request) {
  // Ignoring the query string lets "/?utm_source=x" use the cached home page.
  return caches.match(request, { ignoreSearch: request.mode === 'navigate' });
}

function offlineFallback(request) {
  const home = request.mode === 'navigate' ? caches.match('/') : Promise.resolve(undefined);
  return home.then(hit => hit || Response.error());
}

function networkFirst(event, request) {
  const network = fetch(request).then(response => store(request, response));
  // Lets a request that outlasts the timeout still finish and refresh the cache.
  event.waitUntil(network.catch(() => {}));

  return new Promise(resolve => {
    let done = false;
    const finish = response => { if (!done) { done = true; clearTimeout(timer); resolve(response); } };

    const timer = setTimeout(() => {
      cachedMatch(request).then(hit => { if (hit) finish(hit); });
    }, NETWORK_TIMEOUT_MS);

    network.then(finish, () =>
      cachedMatch(request).then(hit => hit || offlineFallback(request)).then(finish));
  });
}

function staleWhileRevalidate(event, request) {
  return caches.match(request).then(hit => {
    const refresh = fetch(request).then(response => store(request, response));
    event.waitUntil(refresh.catch(() => {}));
    return hit || refresh.catch(() => Response.error());
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isAsset = request.destination === 'font' || request.destination === 'image';
  event.respondWith(isAsset ? staleWhileRevalidate(event, request) : networkFirst(event, request));
});
