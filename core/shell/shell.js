/* Shell: everything every page needs (helpers, header, footer, news seen-state, settings menu, announcement
   card, back-to-top), driven by SITE_DATA (data.js). It knows nothing about project catalogues or home-page
   blocks: features (core/features/*) plug in through SITE_HOOKS below, and a site only loads the features it
   lists in site.config.js. */

/* ---------- Hooks for features ----------
   Features load after this file and register themselves here, so the shell never calls a feature's functions
   directly (they may not be loaded). Every hook has a do-nothing default. */

const SITE_HOOKS = {
  // Things that can be "new since your last visit" (the catalogue's downloads). Each source:
  //   pageCount(page)  unseen items for one nav page (the header badge)
  //   total()          unseen items overall (Settings > "Mark all as read")
  //   markAllSeen()    counts everything published so far as seen
  unread: [],
  // (path, hashId) => image src | null: the picture for a news entry whose same-site link points at a feature's content.
  announceImage: [],
  // CSS selectors for linked #targets that get the "you were sent here" highlight.
  deepLinkHighlight: [],
  // name -> () => value: fills {name} in news and stats text.
  placeholders: {},
  // () => [{ id, title, image, modrinth }]: the projects news entries can refer to.
  projects: () => [],
  // (section, { toAbsolute, siteUrl, publisherId }) => { items, label } | null: extra JSON-LD for the page.
  structuredData: null,

  // The home page (home.js) runs these at set points, in the order features loaded.
  home: {
    redirect: [],   // () => true if the visitor was sent elsewhere (old deep links), which stops the page
    featured: null, // (splash, card) => true if it filled the splash's featured card
    blocks: []      // () => void: fills the main area (the catalogue's cards, the landing blocks)
  }
};

/* ---------- Helpers ---------- */

// Site-relative paths ("about", "images/x.webp") become root-absolute so they resolve
// from any URL depth. Absolute URLs, "/..." paths, "#hash" and "mailto:" are left alone.
function sitePath(path) {
  return /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(path) ? path : '/' + path;
}

function iconUrl(name) {
  return `url('${sitePath(`images/icons/${name || 'link'}.svg`)}')`;
}

function setMask(node, url) {
  node.style.webkitMaskImage = url;
  node.style.maskImage = url;
}

function icon(name, cls) {
  const span = document.createElement('span');
  span.className = 'icon' + (cls ? ' ' + cls : '');
  span.setAttribute('aria-hidden', 'true');
  setMask(span, iconUrl(name));
  return span;
}
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Note: `href` opens a new tab; use internalLink() for same-site links.
function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text) node.textContent = opts.text;
  if (opts.href) { node.href = opts.href; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
  if (opts.src) node.src = sitePath(opts.src);
  if (opts.alt !== undefined) node.alt = opts.alt;
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  children.forEach(c => c && node.appendChild(c));
  return node;
}

function internalLink(className, href, children, label) {
  const a = document.createElement('a');
  a.className = className;
  a.href = sitePath(href);
  if (label) a.setAttribute('aria-label', label);
  children.forEach(c => c && a.appendChild(c));
  return a;
}

// Fills {name} in text from data.js / stats.js, for each name a feature registered in SITE_HOOKS.placeholders
// (the catalogue registers {projects}); other {braces} are left as written.
function fillPlaceholders(text) {
  return String(text).replace(/\{(\w+)\}/g, (whole, name) => SITE_HOOKS.placeholders[name] ? SITE_HOOKS.placeholders[name]() : whole);
}

// prefersReducedMotion() comes from settings.js: the device setting unless the visitor overrode it.

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const relativeWords = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });
const relativeCounts = new Intl.RelativeTimeFormat('en-GB', { numeric: 'always' });

// "Today", "Yesterday", "3 days ago", "2 weeks ago" for entries under a month old; future
// dates likewise ("Tomorrow", "In 3 days") up to a month ahead; null otherwise.
function relativeNewsDate(iso) {
  if (!datesAreRelative()) return null;
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d)) return null;

  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - d.getTime()) / 86400000); // negative = in the future

  // The date one month from today in the entry's direction; a short month clamps
  // (31 Mar - 1 month = 28 Feb, not 3 Mar).
  const shift = days < 0 ? 1 : -1;
  const limit = new Date(today);
  const day = limit.getUTCDate();
  limit.setUTCDate(1);
  limit.setUTCMonth(limit.getUTCMonth() + shift);
  limit.setUTCDate(Math.min(day, new Date(Date.UTC(limit.getUTCFullYear(), limit.getUTCMonth() + 1, 0)).getUTCDate()));
  if (days < 0 ? d.getTime() >= limit.getTime() : d.getTime() <= limit.getTime()) return null;

  const n = Math.abs(days);
  return capitalise(n < 7 ? relativeWords.format(shift * n, 'day') : relativeCounts.format(shift * Math.floor(n / 7), 'week'));
}

function renderBrand(brand) {
  const logo = document.getElementById('brand-logo');
  const src = sitePath(brand.logo);
  if (logo.getAttribute('src') !== src) logo.src = src; // an identical src can restart the request
  logo.alt = '';
  document.getElementById('brand-name').textContent = brand.name;

  // April Fools (styles.css) swaps the name for brand.aprilFoolsName, upper-cased like brand.name; a site
  // without one keeps its own name that day.
  if (brand.aprilFoolsName) {
    const fools = brand.aprilFoolsName.toUpperCase();
    document.querySelectorAll('.brand-name, .footer-brand-name').forEach(node => node.setAttribute('data-fools-name', fools));
  }
}

// Marker for something new since the visitor's last visit (news entries and project downloads).
function newDot() {
  const text = 'New since your last visit';
  return el('span', { class: 'news-new-dot', attrs: { 'data-tooltip': text, role: 'img', 'aria-label': text } });
}

// "2026-10-13" -> "13 Oct 2026" (or with other Intl options); invalid input is returned as is.
function formatDate(iso, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });
}

/* ---------- Header ---------- */

// Unseen items on a nav page (the catalogue's `notify` downloads), from whatever feature registered a source.
function countUnseenNotifications(page) {
  return SITE_HOOKS.unread.reduce((sum, source) => sum + source.pageCount(page), 0);
}

/* ---------- News data and seen-state (shared with news.js) ---------- */

function newsData() {
  return typeof LATEST_UPDATES !== 'undefined' ? LATEST_UPDATES : null;
}

function newsEntries() {
  const news = newsData();
  const entries = ((news && news.entries) || []).filter(e => e && e.title && e.date);
  // ISO dates sort as text; the sort is stable, so same-day entries keep their file order.
  return entries.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

// Stable anchor for an entry, used to link to it on the News page.
function newsEntryId(entry) {
  return slugify(entry.date + ' ' + entry.title);
}

/* ---------- "New since your last visit" ----------
   Seen entries are kept in localStorage; newer ones get a dot. The previous visit's list is
   held for the browser session so reloads don't clear the dots. A first visit marks nothing. */

const NEWS_SEEN_KEY = 'news-seen';
const NEWS_BASELINE_KEY = 'news-seen-baseline';

function parseIdList(text) {
  try {
    const list = JSON.parse(text);
    return Array.isArray(list) ? list : null;
  } catch { return null; }
}

let newsBaselineCache; // Set of already-seen entry ids, or null if unknown

// Entry ids seen before this visit; null when unknown.
function newsBaseline() {
  if (newsBaselineCache !== undefined) return newsBaselineCache;
  let list = null;
  try { list = parseIdList(sessionStorage.getItem(NEWS_BASELINE_KEY)); } catch { /* session storage unavailable */ }
  if (!list) {
    list = parseIdList(storageGet(NEWS_SEEN_KEY));
    if (list) { try { sessionStorage.setItem(NEWS_BASELINE_KEY, JSON.stringify(list)); } catch { /* ignore */ } }
  }
  newsBaselineCache = list ? new Set(list) : null;
  return newsBaselineCache;
}

function isNewEntry(entry) {
  if (!newDotsEnabled()) return false;
  const seen = newsBaseline();
  return !!seen && !seen.has(newsEntryId(entry));
}

// Everything listed on the News page counts as seen from the next visit on.
function markNewsSeen(entries) {
  newsBaseline(); // fix this visit's baseline before the saved list changes
  storageSet(NEWS_SEEN_KEY, JSON.stringify(entries.map(newsEntryId)));
}

// Entries not yet listed on the News page by this browser; 0 until it has opened News once.
function unseenNewsCount() {
  const seen = parseIdList(storageGet(NEWS_SEEN_KEY));
  if (!seen) return 0;
  const known = new Set(seen);
  return newsEntries().filter(e => !known.has(newsEntryId(e))).length;
}
const countUnseenNews = () => newDotsEnabled() ? unseenNewsCount() : 0;

/* ---------- Unread summary and "Mark all as read" (used by the Settings page) ---------- */

const DOTS_EVENT = 'site:dots'; // fired on document when what counts as read changes

// What is waiting, whether or not dots are switched on: { downloads, news }.
function unreadSummary() {
  return { downloads: SITE_HOOKS.unread.reduce((sum, source) => sum + source.total(), 0), news: unseenNewsCount() };
}

// Everything published so far counts as seen, now and for the rest of this browser session.
function markAllSeen() {
  SITE_HOOKS.unread.forEach(source => source.markAllSeen());

  const ids = newsEntries().map(newsEntryId);
  storageSet(NEWS_SEEN_KEY, JSON.stringify(ids));
  try { sessionStorage.setItem(NEWS_BASELINE_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
  newsBaselineCache = new Set(ids);

  document.dispatchEvent(new Event(DOTS_EVENT));
}

// Count pill for nav items; shows "9+" above nine.
function navBadgeDot(count, noun = ['update', 'updates']) {
  const text = `${count} new ${noun[count === 1 ? 0 : 1]}`;
  return el('span', {
    class: 'nav-jump-dot',
    attrs: { 'data-tooltip': text, 'aria-label': text }
  }, [
    el('span', { attrs: { 'aria-hidden': 'true' }, text: count > 9 ? '9+' : String(count) })
  ]);
}

// Settings dropdown (header): quick toggles for dark mode and the seasonal theme, plus a link to the
// full Settings page. Popover on desktop, accordion in the mobile menu. Added to the menu after the nav; search.js moves it to the end
// of the header (.nav-settings-menu).
const SEASON_PREV_KEY = 'seasonal-prev';

function buildSettingsMenu(settingsPage, currentUrl, mobile) {
  const menuId = 'settings-menu';
  let uid = 0;

  const trigger = el('button', {
    class: 'nav-link nav-settings' + (currentUrl === settingsPage.url ? ' is-current' : ''),
    attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': menuId, 'aria-haspopup': 'true', 'data-tooltip': settingsPage.label }
  }, [
    icon(settingsPage.icon, 'icon-sm'),
    el('span', { text: settingsPage.label }),
    el('span', { class: 'nav-chevron nav-settings-chevron', attrs: { 'aria-hidden': 'true' } })
  ]);

  function toggleRow(iconName, label) {
    const id = `quick-switch-${++uid}`;
    const input = el('input', { attrs: { type: 'checkbox', role: 'switch', id, 'aria-labelledby': id + '-label' } });
    const text = el('span', { class: 'quick-setting-text' }, [
      el('span', { class: 'quick-setting-label', text: label, attrs: { id: id + '-label' } })
    ]);
    const row = el('label', { class: 'quick-setting', attrs: { for: id } }, [
      icon(iconName, 'icon-sm'),
      text,
      el('span', { class: 'switch' }, [input, el('span', { class: 'switch-track', attrs: { 'aria-hidden': 'true' } })])
    ]);
    return { row, input, text };
  }

  const dark = toggleRow('moon', 'Dark mode');
  const season = toggleRow('snowflake', 'Seasonal theme');
  const seasonName = el('span', { class: 'quick-setting-note' });
  season.text.appendChild(seasonName);

  // The dark variant to return to (the OLED theme if that is what the visitor had).
  let lastDark = 'dark';
  dark.input.addEventListener('change', () => {
    updateSettings({ theme: dark.input.checked ? lastDark : 'light' });
  });

  const readPrev = () => { try { return sessionStorage.getItem(SEASON_PREV_KEY); } catch { return null; } };
  const writePrev = value => { try { sessionStorage.setItem(SEASON_PREV_KEY, value); } catch { /* this view only */ } };
  const validPrev = () => { const v = readPrev(); return v && v !== 'off' && SETTING_CHOICES.seasonal.includes(v) ? v : 'auto'; };

  season.input.addEventListener('change', () => {
    if (season.input.checked) {
      updateSettings({ seasonal: validPrev() });
    } else {
      writePrev(getSettings().seasonal);
      updateSettings({ seasonal: 'off' });
    }
  });

  const settingsLink = internalLink('nav-dropdown-item quick-settings-link', settingsPage.url, [
    icon('settings', 'icon-sm'),
    el('span', { text: 'All settings' })
  ]);
  if (currentUrl === settingsPage.url) {
    settingsLink.classList.add('is-current');
    settingsLink.setAttribute('aria-current', 'page');
  }

  const menu = el('div', { class: 'nav-dropdown-menu quick-settings', attrs: { id: menuId, hidden: '' } }, [
    dark.row, season.row, el('hr', { class: 'quick-settings-divider' }), settingsLink
  ]);
  const wrap = el('div', { class: 'nav-dropdown nav-settings-menu' }, [trigger, menu]);

  // Keeps the switches in step with the settings, whoever changed them.
  function sync() {
    const s = getSettings();
    const theme = effectiveTheme(s);
    dark.input.checked = theme !== 'light';
    if (theme === 'oled') lastDark = 'oled';
    else if (theme === 'dark') lastDark = 'dark';

    const active = effectiveSeason(s);
    // Still shown right after being switched off here, so it can be switched back on.
    const canRestore = s.seasonal === 'off' && (automaticSeason() || validPrev() !== 'auto');
    season.row.hidden = !(active || canRestore);
    season.input.checked = !!active;
    const name = SEASON_NAMES[active || (s.seasonal === 'off' ? (automaticSeason() || (validPrev() !== 'auto' ? validPrev() : '')) : '')] || '';
    seasonName.textContent = name;
    seasonName.hidden = !name;
  }
  sync();
  document.addEventListener(SETTINGS_EVENT, sync);

  const setOpen = (open, opts = {}) => {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    wrap.classList.toggle('is-open', open);
    if (open) sync();
    if (!open && opts.refocus) trigger.focus();
  };
  trigger.addEventListener('click', () => setOpen(menu.hidden));
  trigger.addEventListener('keydown', e => {
    if (e.key !== 'ArrowDown') return;
    e.preventDefault();
    setOpen(true);
    dark.input.focus();
  });
  wrap.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || menu.hidden) return;
    e.preventDefault(); // stops the mobile menu folding as well
    setOpen(false, { refocus: true });
  });
  wrap.addEventListener('focusout', e => {
    // Clicking a label leaves no focused element (relatedTarget is null), so only a real move elsewhere closes it.
    if (!mobile.matches && e.relatedTarget && !wrap.contains(e.relatedTarget)) setOpen(false);
  });
  document.addEventListener('pointerdown', e => {
    if (!mobile.matches && !wrap.contains(e.target)) setOpen(false);
  });
  mobile.addEventListener('change', () => setOpen(false));
  return wrap;
}

// Keep in sync with the 900px breakpoint in styles.css.
const MOBILE_NAV_QUERY = '(max-width: 900px)';

// Builds the nav: Home, a Projects dropdown (pages with a "section"), News, About.
// search.js adds the search box. On small screens the menu folds behind a button
// and the dropdown becomes an accordion.
function renderSiteHeader(pages, currentUrl) {
  const header = document.getElementById('site-header');
  const inner = document.getElementById('site-header-inner');
  const menuWrap = document.getElementById('site-menu');
  const nav = document.getElementById('site-nav');
  if (!header || !inner || !menuWrap || !nav || !pages || !pages.length) return;

  const mobile = window.matchMedia(MOBILE_NAV_QUERY);
  const home = pages.find(p => p.url === '/');
  const about = pages.find(p => p.url === 'about');
  const newsPage = pages.find(p => p.url === 'news');
  const settingsPage = pages.find(p => p.url === 'settings');
  const projectPages = pages.filter(p => p.section);
  const externalPages = pages.filter(p => /^https?:\/\//i.test(p.url)); // links out (the wiki), shown after About

  // Elements carrying a count pill; syncDots() redraws them at load and on back/forward restore.
  const dotTargets = [];
  const trackDots = (target, getCount, noun) => dotTargets.push({ target, getCount, noun });
  const totalProjectBadges = () => projectPages.reduce((sum, p) => sum + countUnseenNotifications(p), 0);

  function syncDots() {
    dotTargets.forEach(({ target, getCount, noun }) => {
      const existing = target.querySelector(':scope > .nav-jump-dot');
      const count = getCount();
      if (count > 0) {
        const fresh = navBadgeDot(count, noun);
        if (existing) existing.replaceWith(fresh);
        else target.appendChild(fresh);
      } else if (existing) {
        existing.remove();
      }
    });
  }

  function pageLink(page, className) {
    // An absolute url (the wiki, say) is an external link: it opens in a new tab and says so.
    if (/^https?:\/\//i.test(page.url)) {
      return el('a', {
        href: page.url,
        class: className + ' nav-external',
        attrs: { 'aria-label': `${page.label} (opens in a new tab)` }
      }, [icon(page.icon, 'icon-sm'), el('span', { text: page.label }), icon('newtab', 'icon-sm nav-external-icon')]);
    }
    const a = internalLink(className, page.url, [icon(page.icon, 'icon-sm'), el('span', { text: page.label })]);
    if (page.url === currentUrl) {
      a.classList.add('is-current');
      a.setAttribute('aria-current', 'page');
    }
    return a;
  }

  if (home) nav.appendChild(pageLink(home, 'nav-link'));

  let setDropdown = () => {};
  if (projectPages.length) {
    const menuId = 'projects-menu';
    const onProjectPage = projectPages.some(p => p.url === currentUrl);
    const label = (SITE_DATA.home && SITE_DATA.home.projectsHeading) || 'Projects';

    const trigger = el('button', {
      class: 'nav-link nav-dropdown-toggle' + (onProjectPage ? ' is-current' : ''),
      attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': menuId }
    }, [
      icon('compass', 'icon-sm'),
      el('span', { text: label }),
      el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
    ]);
    trackDots(trigger, totalProjectBadges);

    const items = projectPages.map(page => {
      const a = pageLink(page, 'nav-dropdown-item');
      trackDots(a, () => countUnseenNotifications(page));
      return a;
    });
    const menu = el('div', { class: 'nav-dropdown-menu', attrs: { id: menuId, hidden: '' } }, items);
    const dropdown = el('div', { class: 'nav-dropdown' }, [trigger, menu]);
    nav.appendChild(dropdown);

    setDropdown = (open, opts = {}) => {
      menu.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      dropdown.classList.toggle('is-open', open);
      if (!open && opts.refocus) trigger.focus();
    };

    trigger.addEventListener('click', () => setDropdown(menu.hidden));
    trigger.addEventListener('keydown', e => {
      if (e.key !== 'ArrowDown') return;
      e.preventDefault();
      setDropdown(true);
      items[0].focus();
    });

    menu.addEventListener('keydown', e => {
      const i = items.indexOf(document.activeElement);
      let next = -1;
      if (e.key === 'ArrowDown') next = (i + 1) % items.length;
      else if (e.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;
      else if (e.key === 'Escape') {
        e.preventDefault();
        setDropdown(false, { refocus: true });
        return;
      }
      if (next < 0) return;
      e.preventDefault();
      items[next].focus();
    });

    // Popover on desktop (closes on outside focus/click); accordion on mobile.
    dropdown.addEventListener('focusout', e => {
      if (!mobile.matches && !dropdown.contains(e.relatedTarget)) setDropdown(false);
    });
    document.addEventListener('pointerdown', e => {
      if (!mobile.matches && !dropdown.contains(e.target)) setDropdown(false);
    });
  }

  if (newsPage) {
    const newsLink = pageLink(newsPage, 'nav-link');
    trackDots(newsLink, countUnseenNews, ['news entry', 'news entries']);
    nav.appendChild(newsLink);
  }
  if (about) nav.appendChild(pageLink(about, 'nav-link'));
  externalPages.forEach(page => nav.appendChild(pageLink(page, 'nav-link')));
  // Settings sits in the menu beside the nav, not inside it: the search box (catalog sites) then takes it to its
  // right, and on a site without search the stylesheet pushes it to the far right of the header.
  if (settingsPage) menuWrap.appendChild(buildSettingsMenu(settingsPage, currentUrl, mobile));

  // Mobile menu button; its pill totals every project page.
  const toggle = el('button', {
    class: 'nav-toggle',
    attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': menuWrap.id, 'aria-label': 'Open menu' }
  }, [
    el('span', { class: 'nav-toggle-bars', attrs: { 'aria-hidden': 'true' } })
  ]);
  trackDots(toggle, () => totalProjectBadges() + countUnseenNews());
  inner.insertBefore(toggle, menuWrap);

  const setMenu = open => {
    header.classList.toggle('is-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-menu-open')));

  // Escape folds the mobile menu unless the dropdown or search already used it.
  header.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (!mobile.matches || !header.classList.contains('is-menu-open')) return;
    setMenu(false);
    toggle.focus();
  });

  // Crossing the breakpoint resets both menus.
  mobile.addEventListener('change', () => {
    setMenu(false);
    setDropdown(false);
  });

  syncDots();
  window.addEventListener('pageshow', event => {
    if (event.persisted) syncDots();
  });
  // Settings turned dots on or off, or marked everything as read.
  document.addEventListener(DOTS_EVENT, syncDots);
  document.addEventListener(SETTINGS_EVENT, syncDots);

  // Keeps linked headings clear of the sticky header (skipped while the mobile menu overlays the page).
  const syncScrollOffset = () => {
    if (header.classList.contains('is-menu-open')) return;
    const offset = header.getBoundingClientRect().height + 16;
    document.documentElement.style.setProperty('--sticky-nav-offset', `${Math.round(offset)}px`);
  };
  syncScrollOffset();
  if (window.ResizeObserver) new ResizeObserver(syncScrollOffset).observe(header);
  else window.addEventListener('resize', syncScrollOffset);
}

// Listbox sort dropdown, shared with the News page. Returns { node, set(key) }.
function buildSortDropdown({ options, current, label, menuId, onChange }) {
  let selected = current;
  // Labels share one grid cell so the button never changes width.
  const values = new Map(options.map(o => [o.key, el('span', { text: o.label })]));
  const trigger = el('button', {
    class: 'news-sort-trigger',
    attrs: { type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-controls': menuId, 'aria-label': label }
  }, [
    el('span', { class: 'news-sort-value' }, [...values.values()]),
    el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
  ]);
  const items = new Map(options.map(o => [o.key, el('button', {
    class: 'nav-dropdown-item news-sort-item',
    text: o.label,
    attrs: { type: 'button', role: 'option', 'data-sort': o.key, 'aria-selected': 'false' }
  })]));
  const itemList = [...items.values()];
  const menu = el('div', { class: 'nav-dropdown-menu news-sort-menu', attrs: { id: menuId, role: 'listbox', 'aria-label': label, hidden: '' } }, itemList);
  const dropdown = el('div', { class: 'nav-dropdown news-sort-dropdown' }, [trigger, menu]);

  function setOpen(open, refocus) {
    menu.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    dropdown.classList.toggle('is-open', open);
    if (!open && refocus) trigger.focus();
  }
  function set(key) {
    selected = key;
    values.forEach((node, k) => node.classList.toggle('is-hidden', k !== key));
    items.forEach((item, k) => {
      item.setAttribute('aria-selected', String(k === key));
      item.classList.toggle('is-current', k === key);
    });
  }

  items.forEach((item, key) => item.addEventListener('click', () => {
    setOpen(false, true);
    if (key !== selected) { set(key); onChange(key); }
  }));
  trigger.addEventListener('click', () => setOpen(menu.hidden));
  trigger.addEventListener('keydown', e => {
    if (e.key !== 'ArrowDown') return;
    e.preventDefault();
    setOpen(true);
    items.get(selected).focus();
  });
  menu.addEventListener('keydown', e => {
    const i = itemList.indexOf(document.activeElement);
    let next = -1;
    if (e.key === 'ArrowDown') next = (i + 1) % itemList.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + itemList.length) % itemList.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = itemList.length - 1;
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false, true); return; }
    if (next < 0) return;
    e.preventDefault();
    itemList[next].focus();
  });
  dropdown.addEventListener('focusout', e => { if (!dropdown.contains(e.relatedTarget)) setOpen(false); });
  document.addEventListener('pointerdown', e => { if (!dropdown.contains(e.target)) setOpen(false); });

  set(current);
  return {
    set,
    node: el('div', { class: 'news-sort' }, [
      el('span', { class: 'news-sort-label', text: 'Sort', attrs: { 'aria-hidden': 'true' } }),
      dropdown
    ])
  };
}

function footerLink(href, iconName, label) {
  const a = internalLink('footer-link footer-social', href, [icon(iconName, 'icon-sm'), el('span', { text: label })]);
  const li = document.createElement('li');
  li.appendChild(a);
  return li;
}

function renderFooter(socials, footer, version) {
  const projectsList = document.getElementById('footer-projects');
  if (projectsList) {
    SITE_DATA.pages.filter(p => p.section).forEach(p => projectsList.appendChild(footerLink(p.url, p.icon, p.label)));
  }

  const socialList = document.getElementById('social-links');
  socials.forEach(s => {
    const li = footerLink(s.url, s.icon, s.label);
    const a = li.firstChild;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    socialList.appendChild(li);
  });

  document.getElementById('copyright').textContent = footer.copyright;
  document.getElementById('disclaimer').textContent = footer.disclaimer;

  const credits = footer.iconCredits;
  if (credits) {
    const creditsEl = document.getElementById('icon-credits');
    if (credits.prefix) creditsEl.appendChild(document.createTextNode(credits.prefix));
    creditsEl.appendChild(el('a', { href: credits.url, class: 'credits-link', text: credits.label }));
  }

  if (version) {
    const versionEl = document.getElementById('site-version');
    const { label, url } = typeof version === 'object' ? version : { label: version };
    if (url) versionEl.appendChild(el('a', { href: url, class: 'version-link', text: label }));
    else versionEl.textContent = label;
  }
}

/* ---------- Page behaviour ---------- */

// Removes the loading placeholders that each page's HTML ships with ([data-skeleton]).
function clearSkeletons() {
  document.querySelectorAll('[data-skeleton]').forEach(node => node.remove());
}

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  btn.appendChild(el('span', { class: 'back-to-top-glyph', attrs: { 'aria-hidden': 'true' } }));

  const SHOW_AFTER = 180; // px scrolled before the button appears

  if ('IntersectionObserver' in window) {
    // Invisible marker over the top SHOW_AFTER px: the button shows once it scrolls out of view.
    const marker = document.createElement('div');
    marker.setAttribute('aria-hidden', 'true');
    Object.assign(marker.style, {
      position: 'absolute', top: '0', left: '0', width: '1px',
      height: SHOW_AFTER + 'px', pointerEvents: 'none', visibility: 'hidden'
    });
    document.body.appendChild(marker);
    new IntersectionObserver(entries => {
      btn.classList.toggle('is-visible', !entries[entries.length - 1].isIntersecting);
    }).observe(marker);
  } else {
    const update = () => btn.classList.toggle('is-visible', window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}

// Scrolls to the #id in the URL and briefly highlights it if a feature asked for that kind of target to be highlighted.
function handleDeepLink() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target) return;

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'auto', block: 'start' });

    if (SITE_HOOKS.deepLinkHighlight.some(selector => target.matches(selector))) {
      target.classList.add('is-linked-target');
      target.addEventListener('animationend', () => target.classList.remove('is-linked-target'), { once: true });
    }
  });
}

// Adds JSON-LD: Organization and WebSite, plus whatever SITE_HOOKS.structuredData adds (the catalogue's
// projects). Pass a section for just its projects, or null for all.
function renderStructuredData(data, section) {
  const canonical = document.querySelector('link[rel="canonical"]');
  const siteUrl = canonical ? canonical.href : location.origin + '/';
  const root = new URL('/', siteUrl).href;
  const toAbsolute = path => path ? new URL(path, siteUrl).href : undefined;

  // Matches the page's social tags; brand.name is the all-caps display version.
  const siteMeta = document.querySelector('meta[property="og:site_name"]');
  const siteName = (siteMeta && siteMeta.content) || data.brand.name;
  const splash = data.home && data.home.splash;
  const description = (data.home && data.home.description) || (splash && splash.subtitle) || '';

  const organization = {
    '@type': 'Organization',
    '@id': root + '#organization',
    name: siteName,
    url: root,
    logo: toAbsolute(data.brand.logo),
    sameAs: (data.socials || []).map(l => l.url)
  };
  if (description) organization.description = description;

  const website = {
    '@type': 'WebSite',
    '@id': root + '#website',
    name: siteName,
    url: root,
    publisher: { '@id': organization['@id'] }
  };
  if (description) website.description = description;

  // Extra entries (the catalogue's downloadable projects) come from the feature that registered them.
  const extra = SITE_HOOKS.structuredData && SITE_HOOKS.structuredData(section, { toAbsolute, siteUrl, publisherId: organization['@id'] });

  const graph = [organization, website];
  if (extra && extra.items.length) {
    graph.push({
      '@type': 'ItemList',
      name: `${siteName} ${extra.label}`,
      itemListElement: extra.items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, item }))
    });
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  document.head.appendChild(script);
}

/* ---------- Tooltip placement ----------
   Tooltips open above; near the sticky header they open below (.tooltip-below). */

function placeTooltip(target) {
  const el = target instanceof Element ? target.closest('[data-tooltip]') : null;
  if (!el || el.closest('.site-header') || el.id === 'back-to-top') return;

  const header = document.querySelector('.site-header');
  const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
  const tipHeight = parseFloat(getComputedStyle(el, '::after').height) || 40;
  const needed = tipHeight + 14; // tooltip, its 10px offset and a little air
  el.classList.toggle('tooltip-below', el.getBoundingClientRect().top - headerBottom < needed);
}

['mouseover', 'focusin', 'pointerdown'].forEach(type =>
  document.addEventListener(type, e => placeTooltip(e.target)));

/* ---------- News helpers and announcement card ----------
   Shared here (not in news.js) so pages without a news feed can show the corner card
   without loading news.js. */

const NEWS_DEFAULT_RGB = '116, 196, 231'; // same blue as --accent-rgb

// "#41a0c8" or "#4ac" -> "65, 160, 200"; anything else -> null.
function hexToRgb(hex) {
  let h = String(hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, c => c + c);
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ');
}

// { key, label, rgb } for a tag key, with fallbacks for tags not in `tags`.
function newsTag(key) {
  const defined = ((newsData() || {}).tags || {})[key] || {};
  return {
    key,
    label: defined.label || capitalise(String(key)),
    rgb: hexToRgb(defined.color) || NEWS_DEFAULT_RGB
  };
}

// Set through the style API, which the Content-Security-Policy allows (inline style="" isn't).
function setTagColor(node, tag) {
  node.style.setProperty('--news-rgb', tag.rgb);
}

const formatNewsDate = iso => displayDate(iso, 'long');

// Calendar icon for dates; dropped if images/icons/calendar.svg is missing.
function calendarIcon() {
  const node = icon('calendar', 'icon-sm news-date-icon');
  const probe = new Image();
  probe.onerror = () => node.remove();
  probe.src = sitePath('images/icons/calendar.svg');
  return node;
}

// Date with calendar icon. Recent entries show a relative date with the full date as a tooltip.
function newsDate(entry) {
  const full = formatNewsDate(entry.date);
  const relative = relativeNewsDate(entry.date);
  return el('span', { class: 'news-when' + (relative ? ' has-tooltip' : ''), attrs: relative ? { 'data-tooltip': full } : {} }, [
    calendarIcon(),
    el('time', { class: 'news-date', text: relative || full, attrs: { datetime: entry.date } })
  ]);
}

const newsArrow = () => el('span', { class: 'news-link-arrow', attrs: { 'aria-hidden': 'true' } });

// True for an .svg image path.
function isSvgSrc(src) {
  return /\.svg(?:[?#].*)?$/i.test(src);
}

// SVGs in <img> are black and vanish on the dark background, so draw them as a coloured mask.
function svgMask(src, cls) {
  const node = el('span', { class: 'icon ' + cls, attrs: { 'aria-hidden': 'true' } });
  setMask(node, `url('${sitePath(src)}')`);
  return node;
}

// The newest entry with announce: true; shown as the corner card and pinned first on the News page.
const announcedEntry = entries => entries.find(e => e.announce === true) || null;

function newsTagPills(entry) {
  return (entry.tags || []).map(key => {
    const tag = newsTag(key);
    const pill = el('span', { class: 'news-tag', text: tag.label });
    setTagColor(pill, tag);
    return pill;
  });
}

// "View full update" link to an entry on the News page, or null if the site has no News page.
function viewUpdateLink(entry) {
  const page = (SITE_DATA.pages || []).find(p => p.url === 'news');
  return page && internalLink('news-link', `${page.url}#entry=${newsEntryId(entry)}`, [
    el('span', { text: 'View full update' }),
    newsArrow()
  ]);
}

/* Corner card on every page except News and 404, built from the newest `announce: true`
   entry. Dismissal is remembered per entry. */

const ANNOUNCE_KEY = 'announcement-dismissed';

// The entry's `image`, else whatever a feature finds for the content its same-site `url` points at (a project's icon).
function announceImage(entry) {
  if (entry.image) return entry.image;
  if (!entry.url) return null;

  let u;
  try { u = new URL(entry.url, location.origin); } catch { return null; }
  if (u.origin !== location.origin) return null;

  const path = u.pathname.replace(/^\/|\/$/g, '');
  const id = decodeURIComponent(u.hash.slice(1));
  for (const resolve of SITE_HOOKS.announceImage) {
    const src = resolve(path, id);
    if (src) return src;
  }
  return null;
}

function removeAnnouncementCard() {
  const card = document.querySelector('aside.announce');
  if (card) card.remove();
  document.body.classList.remove('has-announcement');
  document.documentElement.style.removeProperty('--announce-h');
}

function initAnnouncementCard() {
  if (document.getElementById('news-page')) return;
  if (!getSettings().showAnnouncements) return; // Settings > "Announcement pop-ups"
  if (document.querySelector('aside.announce')) return;

  const entry = announcedEntry(newsEntries());
  if (!entry) return;

  const id = entry.date + '|' + entry.title;
  if (storageGet(ANNOUNCE_KEY) === id) return;

  const src = announceImage(entry);
  const media = el('div', { class: 'announce-media', attrs: { 'aria-hidden': 'true' } }, [
    !src ? icon('announcements', 'announce-icon')
      : isSvgSrc(src) ? svgMask(src, 'announce-svg')
      : el('img', { class: 'announce-img', src, alt: '', attrs: { width: '120', height: '120', draggable: 'false', decoding: 'async' } })
  ]);

  const link = viewUpdateLink(entry);

  const close = el('button', { class: 'announce-close', attrs: { type: 'button', 'aria-label': 'Dismiss announcement', 'data-tooltip': 'Dismiss' } }, [el('span', { class: 'close-glyph', attrs: { 'aria-hidden': 'true' } })]);
  const card = el('aside', { class: 'announce' + (link ? ' is-linked' : ''), attrs: { role: 'region', 'aria-label': 'Latest news' } }, [
    el('div', { class: 'news-meta announce-meta' }, [
      ...newsTagPills(entry),
      newsDate(entry)
    ]),
    media,
    el('div', { class: 'announce-body' }, [
      el('p', { class: 'announce-title', text: entry.title }),
      entry.text ? el('p', { class: 'announce-text', text: fillPlaceholders(entry.text) }) : null,
      link
    ]),
    close
  ]);

  const root = document.documentElement;
  let observer = null;
  const setHeight = () => root.style.setProperty('--announce-h', card.offsetHeight + 'px');

  close.addEventListener('click', () => {
    storageSet(ANNOUNCE_KEY, id);
    if (observer) observer.disconnect();
    card.remove();
    document.body.classList.remove('has-announcement');
    root.style.removeProperty('--announce-h');
  });

  document.body.appendChild(card);
  document.body.classList.add('has-announcement');
  setHeight();
  if ('ResizeObserver' in window) {
    observer = new ResizeObserver(setHeight);
    observer.observe(card);
  }
}

