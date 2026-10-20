/* News feed: renders LATEST_UPDATES (latest-updates.js; format documented
   there). Used by the home page (latest few, via renderNewsPreview) and by the
   News page (everything, with search and tag filters; this file builds that
   page itself). Needs latest-updates.js, data.js and section-page.js. */

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

// Anchor for `url`, or null if it isn't a safe address. Same-site links stay
// in the tab; others open a new one.
function newsAnchor(className, url, children) {
  if (!url || !newsSafeUrl(url)) return null;

  const a = internalLink(className, url, children);
  if (/^https?:/i.test(a.href) && new URL(a.href).origin !== location.origin) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

const newsArrow = () => el('span', { class: 'news-link-arrow', attrs: { 'aria-hidden': 'true' } });

// Link button for an entry's `url`.
function newsLink(entry) {
  return newsAnchor('news-link', entry.url, [
    el('span', { text: entry.linkText || 'Read more' }),
    newsArrow()
  ]);
}

// Calendar icon for dates. If images/icons/calendar.svg is missing
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

// True if an image's four corners are solid, i.e. it's a full square icon
// (like the project icons) rather than artwork on a transparent background.
function isFullSquare(img) {
  try {
    const size = 16;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, size, size);
    return [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]]
      .every(([x, y]) => ctx.getImageData(x, y, 1, 1).data[3] > 230);
  } catch {
    return false;
  }
}

// True for an .svg image path.
function isSvgSrc(src) {
  return /\.svg(?:[?#].*)?$/i.test(src);
}

// SVGs loaded through <img> can't take the site's colours (these icons are
// plain black, which vanishes on the dark background), so they are drawn as a
// mask filled with the tile's colour instead, like the other icons.
function svgMask(src, cls) {
  const url = `url('${sitePath(src)}')`;
  const node = el('span', { class: 'icon ' + cls, attrs: { 'aria-hidden': 'true' } });
  node.style.webkitMaskImage = url;
  node.style.maskImage = url;
  return node;
}

// Picture tile for an entry (News page): its `image`, else the icon of the
// project its `url` points at, else a generic news glyph. Full square icons
// fill the tile on their own; transparent artwork and the glyph sit in an
// outlined frame.
function newsMedia(entry) {
  const src = announceImage(entry);
  const media = el('div', { class: 'news-item-media', attrs: { 'aria-hidden': 'true' } });
  if (!src) {
    media.classList.add('is-framed');
    media.appendChild(icon('news', 'news-item-glyph'));
    return media;
  }

  if (isSvgSrc(src)) {
    media.classList.add('is-framed');
    media.appendChild(svgMask(src, 'news-item-svg'));
    return media;
  }

  const img = el('img', { class: 'news-item-img', src, alt: '', attrs: { width: '120', height: '120', decoding: 'async', draggable: 'false' } });
  const decide = () => media.classList.add(isFullSquare(img) ? 'is-full' : 'is-framed');
  img.addEventListener('load', decide, { once: true });
  img.addEventListener('error', () => media.classList.add('is-framed'), { once: true });
  media.appendChild(img);
  return media;
}

// Home page cards are plain; the News page passes { detailed: true } for the icon tile.
// The entry the announcement card is built from: the newest with announce: true.
// The News page pins it to the top of the list.
function pinnedEntry(entries) {
  return entries.find(e => e.announce === true) || null;
}

function renderNewsItem(entry, opts = {}) {
  const pills = (entry.tags || []).map(key => {
    const tag = newsTag(key);
    const pill = el('span', { class: 'news-tag', text: tag.label });
    setTagColor(pill, tag);
    return pill;
  });
  // The News page puts the tags on the right of the entry; the home page
  // keeps them beside the date.
  const head = el('div', { class: 'news-meta' }, opts.detailed ? [newsDate(entry)] : [...pills, newsDate(entry)]);
  const link = newsLink(entry);

  const body = [
    head,
    el('h3', { class: 'news-title', text: entry.title }),
    entry.text ? el('p', { class: 'news-text', text: fillPlaceholders(entry.text) }) : null,
    link
  ];

  if (!opts.detailed) return el('li', { class: 'news-item' }, body);

  // With a link, the whole entry is clickable (the link stretches over it).
  const pin = opts.pinned
    ? el('span', { class: 'news-pin', attrs: { role: 'img', 'aria-label': 'Pinned', 'data-tooltip': 'Pinned' } }, [icon('pin', 'icon-sm')])
    : null;
  return el('li', { class: 'news-item news-item-detailed' + (link ? ' is-clickable' : '') + (pin ? ' is-pinned' : '') }, [
    pin,
    newsMedia(entry),
    el('div', { class: 'news-item-body' }, body),
    pills.length ? el('div', { class: 'news-item-tags' }, pills) : null
  ]);
}

// Home page: fills #news-section with the latest entries; hidden if there are none.
function renderNewsPreview() {
  const wrap = document.getElementById('news-section');
  const news = newsData();
  if (!wrap || !news) return;

  const entries = newsEntries().slice(0, news.homeCount || 3);
  if (!entries.length) { wrap.hidden = true; return; }

  document.getElementById('news-heading').textContent = news.homeHeading || news.heading || 'Latest news';
  const list = document.getElementById('news-list');
  entries.forEach(e => list.appendChild(renderNewsItem(e)));

  const page = (SITE_DATA.pages || []).find(p => p.url === 'news');
  const more = document.getElementById('news-more');
  if (page && more) {
    more.appendChild(internalLink('news-all', page.url, [
      el('span', { text: 'All news' }),
      el('span', { class: 'news-link-arrow', attrs: { 'aria-hidden': 'true' } })
    ]));
  } else if (more) {
    more.remove();
  }
  wrap.hidden = false;
}

/* ---------- News page ---------- */

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

// Sidebar "Quick links" panel.
function renderQuickLinks(cfg) {
  const links = ((cfg && cfg.links) || []).map(l => {
    const a = newsAnchor('news-quick', l.url, [
      icon(l.icon || 'link', 'icon-md news-quick-icon'),
      el('span', { class: 'news-quick-label', text: l.label }),
      el('span', { class: 'news-quick-arrow', attrs: { 'aria-hidden': 'true' } })
    ]);
    return a && el('li', {}, [a]);
  }).filter(Boolean);
  if (!links.length) return null;

  return el('section', { class: 'news-panel' }, [
    el('h2', { class: 'news-panel-heading', text: cfg.heading || 'Quick links' }),
    el('ul', { class: 'news-quick-list' }, links)
  ]);
}

// Sidebar info card: icon tile, heading, text, then an optional outlined
// `button` (plus an optional second, `button2`) and/or plain `link` ({ label, url, icon? }).
function renderSideCard(card) {
  if (!card || !card.heading) return null;

  const makeButton = b => b && newsAnchor('news-btn', b.url, [
    b.icon ? icon(b.icon, 'icon-sm') : null,
    el('span', { text: b.label }),
    el('span', { class: 'news-btn-arrow', attrs: { 'aria-hidden': 'true' } })
  ]);
  const button = makeButton(card.button);
  const button2 = makeButton(card.button2);
  const link = card.link && newsAnchor('news-link', card.link.url, [
    el('span', { text: card.link.label }),
    newsArrow()
  ]);

  return el('section', { class: 'news-panel news-card' }, [
    el('div', { class: 'news-card-icon', attrs: { 'aria-hidden': 'true' } }, [icon(card.icon || 'info', 'news-card-glyph')]),
    el('div', { class: 'news-card-body' }, [
      el('h2', { class: 'news-card-heading', text: card.heading }),
      card.text ? el('p', { class: 'news-card-text', text: card.text }) : null,
      button,
      button2,
      link
    ])
  ]);
}

function renderNewsPage() {
  const main = document.getElementById('news-page');
  const news = newsData();
  if (!main || !news) return;
  const side = news.sidebar || {};

  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: 'news-page-heading' } }, [
    el('span', { text: news.heading || 'News' })
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
      placeholder: side.searchPlaceholder || 'Search news…',
      'aria-label': 'Search news',
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
    // The pinned entry goes first (if it matches the current filters).
    const pinned = pinnedEntry(entries);
    if (pinned && shown.includes(pinned)) shown.splice(0, 0, ...shown.splice(shown.indexOf(pinned), 1));
    list.replaceChildren(...shown.map(e => renderNewsItem(e, { detailed: true, pinned: e === pinned })));

    buttons.forEach((btn, key) => {
      const on = key === '' ? !active.size : active.has(key);
      btn.setAttribute('aria-pressed', String(on));
    });
    clearBtn.hidden = !query;

    const filtering = active.size > 0 || query.trim() !== '';
    status.textContent = !shown.length
      ? (query.trim() ? 'Nothing matches your search.' : 'Nothing matches those tags.')
      : (filtering ? `Showing ${shown.length} of ${entries.length}` : '');
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

  // Tag filter dropdown: a toggle button that opens/collapses the list of
  // tags. "All" is always shown; only the first FILTER_VISIBLE tags show until
  // "Show more" is pressed (the button only exists when there are more).
  const FILTER_VISIBLE = 4;
  function buildFilterDropdown() {
    const panelId = 'news-filter-panel';
    const toggle = el('button', { class: 'news-filter-toggle', attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId } }, [
      el('span', { class: 'news-filter-toggle-label', text: side.filterHeading || 'Filter by tags' }),
      el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
    ]);

    const tagButtons = tagKeys.map(k => { const t = newsTag(k); return makeButton(k, t.label, t); });
    const options = el('div', { class: 'news-filters', attrs: { role: 'group', 'aria-label': 'Filter news by tag' } }, [
      makeButton('', 'All', null),
      ...tagButtons
    ]);
    const panel = el('div', { class: 'news-filter-panel', attrs: { id: panelId, hidden: '' } }, [options]);

    let expanded = false;
    let more = null;
    function applyMore() {
      tagButtons.forEach((b, i) => { b.hidden = !expanded && i >= FILTER_VISIBLE; });
      if (!more) return;
      more.setAttribute('aria-expanded', String(expanded));
      more.firstChild.textContent = expanded ? 'Show less' : 'Show ' + (tagButtons.length - FILTER_VISIBLE) + ' more';
    }
    if (tagButtons.length > FILTER_VISIBLE) {
      more = el('button', { class: 'news-filter-more', attrs: { type: 'button', 'aria-controls': panelId } }, [
        el('span'),
        el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
      ]);
      more.addEventListener('click', () => { expanded = !expanded; applyMore(); });
      panel.appendChild(more);
    }
    // A tag picked from a shared link might be hidden behind "Show more".
    expanded = tagKeys.slice(FILTER_VISIBLE).some(k => active.has(k));
    applyMore();

    const box = el('div', { class: 'news-filter-box' }, [toggle, panel]);
    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      box.classList.toggle('is-open', open);
    }
    toggle.addEventListener('click', () => setOpen(panel.hidden));
    setOpen(true);
    return box;
  }

  // Layout: the list, plus a sidebar. The sidebar is two blocks (search/filters,
  // then quick links and cards) so that on narrow screens the search and filters
  // come first, then the list, then the extras.
  const tools = el('div', { class: 'news-tools' }, [searchBox]);
  if (tagKeys.length > 1) {
    tools.appendChild(buildFilterDropdown());
  }

  const extras = [renderQuickLinks(side.quickLinks), ...(side.cards || []).map(renderSideCard)].filter(Boolean);
  const layout = el('div', { class: 'news-layout' + (extras.length ? '' : ' no-extras') }, [
    tools,
    el('div', { class: 'news-feed' }, [status, list]),
    extras.length ? el('aside', { class: 'news-extra', attrs: { 'aria-label': 'More about the news' } }, extras) : null
  ]);
  main.appendChild(layout);
  refresh();
}

if (document.getElementById('news-page')) {
  renderBrand(SITE_DATA.brand);
  renderSiteHeader(SITE_DATA.pages || [], 'news');
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderNewsPage();
}

/* ---------- Announcement card ---------- */
/* A card in the bottom-right corner of every page except News, built from
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
  if (document.getElementById('news-page')) return; // the list is already on screen there

  const entry = newsEntries().find(e => e.announce === true);
  if (!entry) return;

  const id = entry.date + '|' + entry.title;
  if (storageGet(ANNOUNCE_KEY) === id) return;

  const src = announceImage(entry);
  const media = el('div', { class: 'announce-media', attrs: { 'aria-hidden': 'true' } }, [
    !src ? icon('announcements', 'announce-icon')
      : isSvgSrc(src) ? svgMask(src, 'announce-svg')
      : el('img', { class: 'announce-img', src, alt: '', attrs: { width: '120', height: '120', draggable: 'false', decoding: 'async' } })
  ]);

  const pills = (entry.tags || []).map(key => {
    const tag = newsTag(key);
    const pill = el('span', { class: 'news-tag', text: tag.label });
    setTagColor(pill, tag);
    return pill;
  });

  const close = el('button', { class: 'announce-close', attrs: { type: 'button', 'aria-label': 'Dismiss announcement', 'data-tooltip': 'Dismiss' } });
  // Tags and date run along the top; the icon sits below them beside the text.
  const card = el('aside', { class: 'announce', attrs: { role: 'region', 'aria-label': 'Latest news' } }, [
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
