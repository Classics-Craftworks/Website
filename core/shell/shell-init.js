/* Shell start-up that must run after the features have loaded (they may add to what it reads, such as the
   catalogue's icon for a news entry) but before the page's own script: the announcement card and the
   service worker. */

if (!document.querySelector('.not-found')) {
  initAnnouncementCard();
  // Turned off (or back on) in Settings, here or in another tab.
  document.addEventListener(SETTINGS_EVENT, () => {
    if (getSettings().showAnnouncements) initAnnouncementCard(); else removeAnnouncementCard();
  });
}

// Service worker (sw.js): installable site, offline page shell.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
