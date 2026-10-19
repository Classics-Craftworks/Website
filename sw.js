/* Service worker: makes the site installable (see manifest.json), keeps the
   page shell available offline, and speeds up repeat visits.

   - Pages, scripts and styles: network first, so updates show straight away.
     If the network is slow (NETWORK_TIMEOUT_MS) or down, the cached copy is
     used; a slow request keeps going and refreshes the cache for next time.
   - Fonts: cached copy first, never refreshed (rename a font file to change it).
   - Images: cached copy first, refreshed in the background at most once every
     IMAGE_REFRESH_MS, rather than on every page view.
   - Offline, a page that was never cached falls back to the home page.

   Bump CACHE when this file's strategy changes; old caches are deleted on
   activate. SHELL below is only a head start: anything missing from it is
   still cached the first time it is fetched. */
const CACHE = 'ccw-cache-v8';
const NETWORK_TIMEOUT_MS = 4000;
const IMAGE_REFRESH_MS = 24 * 60 * 60 * 1000;
const STAMP = 'x-sw-cached-at'; // when an image was cached; added by storeImage()

const SHELL = [
  '/',
  '/data-packs-mods',
  '/resource-packs',
  '/other-projects',
  '/about',
  '/updates',
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

// Same as store(), but records when the image was cached so the next view can
// tell whether it's due a refresh. (Files added by the install step have no
// stamp, so they're refreshed once on first use, then stamped.)
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
  return caches.match(request).then(hit => {
    if (hit) return hit;
    const fetched = fetch(request).then(response => store(request, response));
    return fetched.catch(() => Response.error());
  });
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
