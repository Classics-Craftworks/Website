/* News feed: renders LATEST_UPDATES (latest-updates.js; format documented
   there). Used by the home page (latest few, via renderNewsPreview) and by the
   Updates page (everything, with tag filters; this file builds that page
   itself). Needs latest-updates.js, data.js and section-page.js. */

const NEWS_DEFAULT_RGB = '65, 160, 200'; // same blue as --nav-accent-rgb

function newsData() {
  return typeof LATEST_UPDATES !== 'undefined' ? LATEST_UPDATES : null;
}

function newsEntries() {
  const news = newsData();
  const entries = ((news && news.entries) || []).filter(e => e && e.title && e.date);
  // ISO dates sort correctly as text; Array.sort is stable, so same-day
  // entries keep the order they have in latest-updates.js.
  return entries.slice().sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

function formatNewsDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// "#41a0c8" or "#4ac" -> "65, 160, 200"; anything else -> null.
function hexToRgb(hex) {
  let h = String(hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(h)) h = h.replace(/./g, c => c + c);
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ');
}

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
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

// The colour is passed as a CSS variable set through the style API, which
// the site's Content-Security-Policy allows (inline style="" attributes aren't).
function setTagColor(node, tag) {
  node.style.setProperty('--news-rgb', tag.rgb);
}

// Tag keys used by at least one entry: those listed in `tags` first, in that
// order, then any others in the order they appear.
function usedTagKeys(entries) {
  const used = new Set();
  entries.forEach(e => (e.tags || []).forEach(t => used.add(t)));
  const listed = Object.keys((newsData() || {}).tags || {}).filter(k => used.has(k));
  return listed.concat([...used].filter(k => !listed.includes(k)));
}

// Only http(s) and site-relative links become clickable (no javascript: etc.).
function newsSafeUrl(url) {
  return /^(https?:\/\/|\/|#|[^:]*$)/i.test(url);
}

// Link button for an entry's `url`. Same-site links stay in the tab; others
// open a new one.
function newsLink(entry) {
  if (!entry.url || !newsSafeUrl(entry.url)) return null;

  const a = internalLink('news-link', entry.url, [
    el('span', { text: entry.linkText || 'Read more' }),
    el('span', { class: 'news-link-arrow', attrs: { 'aria-hidden': 'true' } })
  ]);
  if (/^https?:/i.test(a.href) && new URL(a.href).origin !== location.origin) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

// Calendar icon for the Updates page. If images/icons/calendar.svg is missing
// the icon is dropped rather than shown as a blank square.
function calendarIcon() {
  const node = icon('calendar', 'icon-sm news-date-icon');
  const probe = new Image();
  probe.onerror = () => node.remove();
  probe.src = sitePath('images/icons/calendar.svg');
  return node;
}

// Date with its calendar icon, used wherever an update's date is shown.
function newsDate(entry) {
  return el('span', { class: 'news-when' }, [
    calendarIcon(),
    el('time', { class: 'news-date', text: formatNewsDate(entry.date), attrs: { datetime: entry.date } })
  ]);
}

function renderNewsItem(entry) {
  const pills = (entry.tags || []).map(key => {
    const tag = newsTag(key);
    const pill = el('span', { class: 'news-tag', text: tag.label });
    setTagColor(pill, tag);
    return pill;
  });
  const head = el('div', { class: 'news-meta' }, [
    ...pills,
    newsDate(entry)
  ]);

  const body = [
    head,
    el('h3', { class: 'news-title', text: entry.title }),
    entry.text ? el('p', { class: 'news-text', text: fillPlaceholders(entry.text) }) : null
  ];

  body.push(newsLink(entry));
  return el('li', { class: 'news-item' }, body);
}

// Home page: fills #news-section with the latest entries; hidden if there are none.
function renderNewsPreview() {
  const wrap = document.getElementById('news-section');
  const news = newsData();
  if (!wrap || !news) return;

  const entries = newsEntries().slice(0, news.homeCount || 3);
  if (!entries.length) { wrap.hidden = true; return; }

  document.getElementById('news-heading').textContent = news.homeHeading || news.heading || 'Latest updates';
  const list = document.getElementById('news-list');
  entries.forEach(e => list.appendChild(renderNewsItem(e)));

  const page = (SITE_DATA.pages || []).find(p => p.url === 'updates');
  const more = document.getElementById('news-more');
  if (page && more) {
    more.appendChild(internalLink('news-all', page.url, [
      el('span', { text: 'All updates' }),
      el('span', { class: 'news-link-arrow', attrs: { 'aria-hidden': 'true' } })
    ]));
  } else if (more) {
    more.remove();
  }
  wrap.hidden = false;
}

/* ---------- Updates page ---------- */

// Active filters and the search text live in the URL (#tags=release,new&q=snapshot)
// so a filtered view can be linked to.
function readHash(validTags) {
  const params = new URLSearchParams(location.hash.slice(1));
  const tags = (params.get('tags') || '').split(',').filter(k => validTags.includes(k));
  return { tags: new Set(tags), query: params.get('q') || '' };
}

function writeHash(active, query) {
  const params = new URLSearchParams();
  if (active.size) params.set('tags', [...active].join(','));
  if (query.trim()) params.set('q', query.trim());
  const text = params.toString();
  history.replaceState(null, '', location.pathname + location.search + (text ? '#' + text : ''));
}

// Everything a visitor could reasonably search for in an entry, lower-cased.
function searchText(entry) {
  return [
    entry.title,
    entry.text,
    entry.linkText,
    formatNewsDate(entry.date),
    entry.date,
    ...(entry.tags || []).map(k => newsTag(k).label)
  ].filter(Boolean).join(' ').toLowerCase();
}

function renderUpdatesPage() {
  const main = document.getElementById('updates');
  const news = newsData();
  if (!main || !news) return;

  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: 'updates-heading' } }, [
    el('span', { text: news.heading || 'Updates' })
  ]));
  if (news.intro) main.appendChild(el('p', { class: 'news-intro', text: news.intro }));

  const entries = newsEntries();
  if (!entries.length) {
    main.appendChild(el('p', { class: 'news-empty', text: 'Nothing here yet. Check back soon!' }));
    return;
  }

  const haystacks = new Map(entries.map(e => [e, searchText(e)]));
  const tagKeys = usedTagKeys(entries);
  const initial = readHash(tagKeys);
  const active = initial.tags; // empty set = every tag
  let query = initial.query;

  const list = el('ul', { class: 'news-list' });
  const status = el('p', { class: 'news-status', attrs: { 'aria-live': 'polite' } });
  const buttons = new Map(); // tag key (or '') -> button

  // Search box: same look as the header search.
  const input = el('input', {
    class: 'nav-search-input',
    attrs: {
      type: 'search',
      placeholder: 'Search updates…',
      'aria-label': 'Search updates',
      autocomplete: 'off',
      spellcheck: 'false',
      enterkeyhint: 'search'
    }
  });
  input.value = query;
  const clearBtn = el('button', { class: 'nav-search-clear', attrs: { type: 'button', 'aria-label': 'Clear search', hidden: '' } });
  const searchBox = el('div', { class: 'news-search', attrs: { role: 'search' } }, [
    icon('search', 'icon-sm nav-search-icon'),
    input,
    clearBtn
  ]);

  // Every word typed has to appear somewhere in the entry, in any order.
  function matches(entry) {
    if (active.size && !(entry.tags || []).some(t => active.has(t))) return false;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hay = haystacks.get(entry);
    return terms.every(t => hay.includes(t));
  }

  function refresh() {
    const shown = entries.filter(matches);
    list.replaceChildren(...shown.map(e => renderNewsItem(e)));

    buttons.forEach((btn, key) => {
      const on = key === '' ? !active.size : active.has(key);
      btn.setAttribute('aria-pressed', String(on));
    });
    clearBtn.hidden = !query;

    const filtering = active.size > 0 || query.trim() !== '';
    status.textContent = !shown.length
      ? (query.trim() ? 'No updates match your search.' : 'No updates match those tags.')
      : (filtering ? `Showing ${shown.length} of ${entries.length} updates` : '');
    writeHash(active, query);
  }

  input.addEventListener('input', () => { query = input.value; refresh(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; query = ''; refresh(); }
  });
  clearBtn.addEventListener('click', () => { input.value = ''; query = ''; refresh(); input.focus(); });

  function makeButton(key, label, tag) {
    const count = key === '' ? entries.length : entries.filter(e => (e.tags || []).includes(key)).length;
    const btn = el('button', { class: 'news-filter', attrs: { type: 'button', 'aria-pressed': 'false' } }, [
      el('span', { text: label }),
      el('span', { class: 'news-filter-count', text: String(count), attrs: { 'aria-hidden': 'true' } })
    ]);
    if (tag) setTagColor(btn, tag);
    btn.addEventListener('click', () => {
      if (key === '') active.clear();
      else if (active.has(key)) active.delete(key);
      else active.add(key);
      refresh();
    });
    buttons.set(key, btn);
    return btn;
  }

  // Search box and tag filters share a row (they wrap onto two on narrow screens).
  // The filters only appear when there's more than one tag to choose between.
  const tools = el('div', { class: 'news-tools' }, [searchBox]);
  if (tagKeys.length > 1) {
    tools.appendChild(el('div', { class: 'news-filters', attrs: { role: 'group', 'aria-label': 'Filter updates by tag' } }, [
      makeButton('', 'All', null),
      ...tagKeys.map(k => { const t = newsTag(k); return makeButton(k, t.label, t); })
    ]));
  }
  main.appendChild(tools);
  main.appendChild(status);
  main.appendChild(list);
  refresh();
}

if (document.getElementById('updates')) {
  renderBrand(SITE_DATA.brand);
  renderSiteHeader(SITE_DATA.pages || [], 'updates');
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderUpdatesPage();
}

/* ---------- Announcement card ---------- */
/* A card in the bottom-right corner of every page except Updates, built from
   the newest entry marked `announce: true` in latest-updates.js. Dismissing it
   is remembered per entry, so the next announced entry shows again. */

const ANNOUNCE_KEY = 'announcement-dismissed';

// Picture for the card: the entry's own `image`, else the icon of the project
// its same-site `url` points at (e.g. "/data-packs-mods#better-unpackables").
function announceImage(entry) {
  if (entry.image) return entry.image;
  if (!entry.url) return null;

  let u;
  try { u = new URL(entry.url, location.origin); } catch { return null; }
  if (u.origin !== location.origin) return null;

  const path = u.pathname.replace(/^\/|\/$/g, '');
  const id = decodeURIComponent(u.hash.slice(1));
  const page = (SITE_DATA.pages || []).find(p => p.url === path && p.section);
  const section = page && (SITE_DATA.sections || []).find(s => s.heading === page.section);
  const match = section && sectionIds(section).projects.find(p => p.id === id);
  return match ? match.project.image || null : null;
}

function initAnnouncementCard() {
  if (document.getElementById('updates')) return; // the list is already on screen there

  const entry = newsEntries().find(e => e.announce === true);
  if (!entry) return;

  const id = entry.date + '|' + entry.title;
  if (storageGet(ANNOUNCE_KEY) === id) return;

  const src = announceImage(entry);
  const media = el('div', { class: 'announce-media', attrs: { 'aria-hidden': 'true' } }, [
    src ? el('img', { class: 'announce-img', src, alt: '', attrs: { width: '120', height: '120', draggable: 'false', decoding: 'async' } })
        : icon('announcements', 'announce-icon')
  ]);

  const pills = (entry.tags || []).map(key => {
    const tag = newsTag(key);
    const pill = el('span', { class: 'news-tag', text: tag.label });
    setTagColor(pill, tag);
    return pill;
  });

  const close = el('button', { class: 'announce-close', attrs: { type: 'button', 'aria-label': 'Dismiss announcement', 'data-tooltip': 'Dismiss' } });
  // Tags and date run along the top; the icon sits below them beside the text.
  const card = el('aside', { class: 'announce', attrs: { role: 'region', 'aria-label': 'Latest update' } }, [
    el('div', { class: 'news-meta announce-meta' }, [
      ...pills,
      newsDate(entry)
    ]),
    media,
    el('div', { class: 'announce-body' }, [
      el('p', { class: 'announce-title', text: entry.title }),
      entry.text ? el('p', { class: 'announce-text', text: fillPlaceholders(entry.text) }) : null,
      newsLink(entry)
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

initAnnouncementCard();
