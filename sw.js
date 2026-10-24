/* Service worker: installable site, offline page shell, faster repeat visits.

   - Pages, scripts, styles: network first; the cached copy is used if the network is
     slower than NETWORK_TIMEOUT_MS or down (a slow request still refreshes the cache).
   - Fonts: cache first, never refreshed (rename a font file to change it).
   - Images: cache first, refreshed in the background at most every IMAGE_REFRESH_MS.
   - Uncached pages fall back to the home page when offline.

   Bump CACHE when the strategy changes. SHELL is only a head start; anything else is
   cached on first fetch. */
const CACHE = 'ccw-cache-v8';
const NETWORK_TIMEOUT_MS = 4000;
const IMAGE_REFRESH_MS = 24 * 60 * 60 * 1000;
const STAMP = 'x-sw-cached-at'; // header recording when an image was cached

const SHELL = [
  '/',
  '/data-packs-mods',
  '/resource-packs',
  '/other-projects',
  '/about',
  '/news',
  '/styles.css',
  '/site-error.js',
  '/data.js',
  '/stats.js',
  '/section-page.js',
  '/index.js',
  '/about.js',
  '/news.js',
  '/latest-updates.js',
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
      // allSettled: one missing file mustn't block install. `reload` bypasses the HTTP cache.
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
  // Only complete same-origin successes (not 404s or partial 206s).
  if (response && response.status === 200 && response.type === 'basic') {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
  }
  return response;
}

function cachedMatch(request) {
  // Ignoring the query string lets "/?utm_source=x" hit the cached home page.
  return caches.match(request, { ignoreSearch: request.mode === 'navigate' });
}

function offlineFallback(request) {
  const home = request.mode === 'navigate' ? caches.match('/') : Promise.resolve(undefined);
  return home.then(hit => hit || Response.error());
}

function networkFirst(event, request) {
  const network = fetch(request).then(response => store(request, response));
  // A request outlasting the timeout still finishes and refreshes the cache.
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

// Like store(), but stamps the cache time. Unstamped files (from install) refresh once on first use.
function storeImage(request, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const copy = response.clone();
    copy.blob().then(body => {
      const headers = new Headers(copy.headers);
      headers.set(STAMP, String(Date.now()));
      const stamped = new Response(body, { status: copy.status, statusText: copy.statusText, headers });
      return caches.open(CACHE).then(cache => cache.put(request, stamped));
    }).catch(() => {});
  }
  return response;
}

function cacheFirst(event, request) {
  return caches.match(request).then(hit =>
    hit || fetch(request).then(response => store(request, response)).catch(() => Response.error()));
}

function staleWhileRevalidate(event, request) {
  return caches.match(request).then(hit => {
    const age = hit ? Date.now() - Number(hit.headers.get(STAMP) || 0) : Infinity;
    if (hit && age < IMAGE_REFRESH_MS) return hit;

    const refresh = fetch(request).then(response => storeImage(request, response));
    event.waitUntil(refresh.catch(() => {}));
    return hit || refresh.catch(() => Response.error());
  });
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  const handler =
    request.destination === 'font' ? cacheFirst :
    request.destination === 'image' ? staleWhileRevalidate :
    networkFirst;
  event.respondWith(handler(event, request));
});
