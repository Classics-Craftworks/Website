/* Minimal service worker so Chrome/Edge offer to install the site (see
   manifest.json). It caches nothing: every request goes to the network. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => event.respondWith(fetch(event.request)));
