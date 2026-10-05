/* Minimal service worker.
   It exists so browsers that require one (mainly Chrome and Edge) will
   offer to install the site as an app, per manifest.json. It deliberately
   caches nothing: every request goes straight to the network, exactly as
   if there were no service worker, so visitors can never be served a
   stale copy of the site. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => event.respondWith(fetch(event.request)));
