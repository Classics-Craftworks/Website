/* News feed: renders LATEST_UPDATES (format documented in latest-updates.js) as the
   home page preview and the full News page. Needs latest-updates.js, data.js and section-page.js. */

const NEWS_DEFAULT_RGB = '116, 196, 231'; // same blue as --accent-rgb

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
  const seen = newsBaseline();
  return !!seen && !seen.has(newsEntryId(entry));
}

// Everything listed on the News page counts as seen from the next visit on.
function markNewsSeen(entries) {
  newsBaseline(); // fix this visit's baseline before the saved list changes
  storageSet(NEWS_SEEN_KEY, JSON.stringify(entries.map(newsEntryId)));
}

function newDot() {
  return el('span', { class: 'news-new-dot', attrs: { 'data-tooltip': 'New since your last visit', role: 'img', 'aria-label': 'New since your last visit' } });
}

// "2026-10-13" -> "13 October 2026" (or with other Intl options); invalid input is returned as is.
function formatDate(iso, options) {
  const d = new Date(iso + 'T00:00:00Z');
  return isNaN(d) ? iso : d.toLocaleDateString('en-GB', { ...options, timeZone: 'UTC' });
}

const formatNewsDate = iso => formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' });

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

// Set through the style API, which the Content-Security-Policy allows (inline style="" isn't).
function setTagColor(node, tag) {
  node.style.setProperty('--news-rgb', tag.rgb);
}

// Tag keys in use: those listed in `tags` first (in that order), then any others.
function usedTagKeys(entries) {
  const used = new Set();
  entries.forEach(e => (e.tags || []).forEach(t => used.add(t)));
  const listed = Object.keys((newsData() || {}).tags || {}).filter(k => used.has(k));
  return listed.concat([...used].filter(k => !listed.includes(k)));
}

// An entry's Minecraft versions (`mc`: a string or a list of strings) as trimmed strings.
function entryMcVersions(entry) {
  const raw = Array.isArray(entry.mc) ? entry.mc : (entry.mc ? [entry.mc] : []);
  return raw.map(v => String(v).trim()).filter(Boolean);
}

// Compares version strings part by part ("26.10" > "26.4" > "1.21.11"); numbers by value.
function compareMcVersions(a, b) {
  const pa = a.split('.'), pb = b.split('.');
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] === undefined ? -1 : pa[i], y = pb[i] === undefined ? -1 : pb[i];
    const nx = /^\d+$/.test(x), ny = /^\d+$/.test(y);
    if (nx && ny && +x !== +y) return +x - +y;
    if (!(nx && ny) && String(x) !== String(y)) return String(x) < String(y) ? -1 : 1;
  }
  return 0;
}

// Minecraft versions used by at least one entry, newest first.
function usedMcVersions(entries) {
  const used = new Set();
  entries.forEach(e => entryMcVersions(e).forEach(v => used.add(v)));
  return [...used].sort((a, b) => compareMcVersions(b, a));
}

// Every project on the site, in site order.
let allProjectsCache;
function allProjects() {
  if (!allProjectsCache) {
    allProjectsCache = (SITE_DATA.sections || []).flatMap(section =>
      sectionIds(section).projects.map(({ id, project }) => ({
        id,
        title: project.title,
        image: project.image || null,
        modrinth: ((project.links || []).find(l => l.label === 'Modrinth') || {}).url || null
      })));
  }
  return allProjectsCache;
}

// An entry's `projects` as [{ id, version?, channel?, text? }]; a plain id string means { id }.
function projectRefs(entry) {
  return (entry.projects || [])
    .map(p => (typeof p === 'string' ? { id: p } : p))
    .filter(p => p && p.id);
}

// Project ids an entry belongs to: those in `projects`, plus the one its same-site `url` points at.
function entryProjectIds(entry, validIds) {
  const ids = new Set(projectRefs(entry).map(r => r.id).filter(id => validIds.includes(id)));
  if (entry.url) {
    try {
      const u = new URL(entry.url, location.origin);
      const id = decodeURIComponent(u.hash.slice(1));
      if (u.origin === location.origin && validIds.includes(id)) ids.add(id);
    } catch { /* not a usable address */ }
  }
  return [...ids];
}

// Only http(s) and site-relative links become clickable (no javascript: etc.).
function newsSafeUrl(url) {
  return /^(https?:\/\/|\/|#|[^:]*$)/i.test(url);
}

// Anchor for `url`, or null if unsafe. Same-site links stay in the tab; others open a new one.
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

// Calendar icon for dates; dropped if images/icons/calendar.svg is missing.
function calendarIcon() {
  const node = icon('calendar', 'icon-sm news-date-icon');
  const probe = new Image();
  probe.onerror = () => node.remove();
  probe.src = sitePath('images/icons/calendar.svg');
  return node;
}

const relativeWords = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });
const relativeCounts = new Intl.RelativeTimeFormat('en-GB', { numeric: 'always' });

// "Today", "Yesterday", "3 days ago", "2 weeks ago" for entries under a month old; future
// dates likewise ("Tomorrow", "In 3 days") up to a month ahead; null otherwise.
function relativeNewsDate(iso) {
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

// Date with calendar icon. Recent entries show a relative date with the full date as a tooltip.
function newsDate(entry) {
  const full = formatNewsDate(entry.date);
  const relative = relativeNewsDate(entry.date);
  return el('span', { class: 'news-when' + (relative ? ' has-tooltip' : ''), attrs: relative ? { 'data-tooltip': full } : {} }, [
    calendarIcon(),
    el('time', { class: 'news-date', text: relative || full, attrs: { datetime: entry.date } })
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

// SVGs in <img> are black and vanish on the dark background, so draw them as a coloured mask.
function svgMask(src, cls) {
  const node = el('span', { class: 'icon ' + cls, attrs: { 'aria-hidden': 'true' } });
  setMask(node, `url('${sitePath(src)}')`);
  return node;
}

// Picture tile: the entry's `image`, else its project's icon, else a news glyph.
// Square icons fill the tile; transparent artwork and the glyph get an outlined frame.
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

// The channel a version pill is coloured by: the ref's own `channel`, else the entry's first channel-like tag.
function refChannel(ref, entry) {
  const own = String(ref.channel || '').toLowerCase();
  if (RELEASE_CHANNELS[own]) return RELEASE_CHANNELS[own];
  const tags = entry.tags || [];
  const key = ['release', 'beta', 'alpha', 'unsupported'].find(k => tags.includes(k));
  return key ? Object.values(RELEASE_CHANNELS).find(c => c.tag === key) : null;
}

// Version pill, coloured by channel.
function versionPill(version, channel) {
  const pill = el('code', { class: 'version-pill', text: version });
  if (channel) {
    setTagColor(pill, newsTag(channel.tag));
    pill.title = channel.label;
  }
  return pill;
}

// Modrinth page for a version: the ref's `versionUrl`, else <project page>/version/<version>
// when the version looks like a release ("v8.0.0", not a snapshot name).
function versionUrl(ref, project) {
  if (ref.versionUrl) return ref.versionUrl;
  if (!project.modrinth || !/^v\d/i.test(ref.version || '')) return null;
  return `${project.modrinth}/version/${encodeURIComponent(ref.version)}`;
}

// Per-project rows: icon, name, version pill and optional description (object-form `projects` only).
function renderEntryProjects(entry) {
  const refs = projectRefs(entry).filter(r => r.version || r.text);
  if (!refs.length) return null;

  const rows = refs.map(ref => {
    const project = allProjects().find(p => p.id === ref.id);
    if (!project) return null;
    const pic = project.image ? el('img', { class: 'news-project-icon', src: project.image, alt: '', attrs: { width: '28', height: '28', decoding: 'async', draggable: 'false' } }) : null;
    const name = el('span', { class: 'news-project-name', text: project.title });
    const pill = ref.version ? versionPill(ref.version, refChannel(ref, entry)) : null;
    const text = ref.text ? el('p', { class: 'news-project-text', text: fillPlaceholders(ref.text) }) : null;
    // One link: the ref's `url`, else the version's Modrinth page, else the project's.
    const content = [el('div', { class: 'news-project-head' }, [pic, name, pill]), text];
    const target = ref.url || versionUrl(ref, project) || project.modrinth;
    const link = newsAnchor('news-project-link', target, content);
    if (link) link.setAttribute('aria-label', `${project.title}${ref.version ? ' ' + ref.version : ''} on Modrinth`);
    return el('li', { class: 'news-project' }, [
      link || el('div', { class: 'news-project-who' }, content)
    ]);
  }).filter(Boolean);
  return rows.length ? el('ul', { class: 'news-projects' }, rows) : null;
}

// The newest entry with announce: true; shown as the corner card and pinned first on the News page.
const announcedEntry = entries => entries.find(e => e.announce === true) || null;

// Pinned entries in display order: the announced entry, then those with pinned: true
// (in `entries` order, reversed when `oldestFirst`).
function pinnedEntries(entries, oldestFirst) {
  const announced = announcedEntry(entries);
  const others = entries.filter(e => e !== announced && e.pinned === true);
  if (oldestFirst) others.reverse();
  return announced ? [announced, ...others] : others;
}

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

const HOME_MAX_TAGS = 3;

// Home card meta: up to HOME_MAX_TAGS tags on one line (the last is dropped if they don't
// fit), with the date on its own line below.
function homeMeta(pills, entry) {
  const shown = pills.slice(0, HOME_MAX_TAGS);
  const row = shown.length ? el('div', { class: 'news-tags' }, shown) : null;
  const meta = el('div', { class: 'news-meta news-meta-stacked' }, [row, newsDate(entry)]);

  if (row && shown.length > 2 && window.ResizeObserver) {
    const fit = () => {
      shown[2].hidden = false;
      if (shown[2].offsetTop > shown[0].offsetTop) shown[2].hidden = true;
    };
    // The meta's width depends on the card, not on the tags, so this can't loop.
    new ResizeObserver(fit).observe(meta);
  }
  return meta;
}

function renderNewsItem(entry, opts = {}) {
  const pills = newsTagPills(entry);
  const dot = isNewEntry(entry) ? newDot() : null;
  // News page: tags sit beside the entry; home page: beside the date.
  const head = opts.detailed
    ? el('div', { class: 'news-meta' }, [newsDate(entry)])
    : homeMeta(pills, entry);
  // News page: the entry's own url; home page: its card on the News page.
  const link = opts.detailed ? newsLink(entry) : viewUpdateLink(entry);

  const body = [
    opts.detailed ? head : el('div', { class: 'news-item-top' }, [newsMedia(entry), head]),
    el('h3', { class: 'news-title' }, [dot, el('span', { text: entry.title })]),
    entry.text ? el('p', { class: 'news-text', text: fillPlaceholders(entry.text) }) : null,
    opts.detailed ? renderEntryProjects(entry) : null,
    link
  ];

  if (!opts.detailed) {
    return el('li', { class: 'news-item' + (link ? ' is-linked' : '') }, body);
  }

  return el('li', { attrs: { id: 'entry-' + newsEntryId(entry) }, class: 'news-item news-item-detailed' + (link ? ' is-clickable' : '') + (opts.pinned ? ' is-pinned' : '') }, [
    newsMedia(entry),
    el('div', { class: 'news-item-body' }, body),
    pills.length ? el('div', { class: 'news-item-tags' }, pills) : null
  ]);
}

// Home page: fills #latest-news with the latest entries; hidden if there are none.
function renderNewsPreview() {
  const wrap = document.getElementById('latest-news');
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
    more.appendChild(internalLink('news-all', page.url, [el('span', { text: 'All news' }), newsArrow()]));
  } else if (more) {
    more.remove();
  }
  wrap.hidden = false;
}

/* ---------- News page ---------- */

// "2026-10-13" -> "2026-10": the key entries are grouped and filtered by.
const newsMonthKey = entry => entry.date.slice(0, 7);

// "2026-10" -> "October 2026"
const formatMonth = key => formatDate(key + '-01', { month: 'long', year: 'numeric' });

// Filters and search live in the URL hash so a view can be linked to, e.g.
// #projects=better-unpackables&tags=release&mc=26.4&months=2026-10&sort=oldest&q=snapshot
function readHash(validTags, validProjects, validMonths, validMc) {
  const params = new URLSearchParams(location.hash.slice(1));
  const pick = (name, valid) => new Set((params.get(name) || '').split(',').filter(k => valid.includes(k)));
  return {
    tags: pick('tags', validTags),
    projects: pick('projects', validProjects),
    months: pick('months', validMonths),
    mc: pick('mc', validMc),
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest',
    query: params.get('q') || '',
    entry: params.get('entry') || ''
  };
}

function writeHash(active, activeProjects, activeMonths, activeMc, sort, query, entry) {
  const params = new URLSearchParams();
  if (entry) params.set('entry', entry);
  if (activeProjects.size) params.set('projects', [...activeProjects].join(','));
  if (active.size) params.set('tags', [...active].join(','));
  if (activeMc.size) params.set('mc', [...activeMc].join(','));
  if (activeMonths.size) params.set('months', [...activeMonths].join(','));
  if (sort === 'oldest') params.set('sort', 'oldest');
  if (query.trim()) params.set('q', query.trim());
  const text = params.toString();
  history.replaceState(null, '', location.pathname + location.search + (text ? '#' + text : ''));
}

// Everything searchable in an entry, lower-cased.
function searchText(entry, projectTitles) {
  return [
    entry.title,
    entry.text,
    entry.linkText,
    formatNewsDate(entry.date),
    entry.date,
    ...(entry.tags || []).map(k => newsTag(k).label),
    ...entryMcVersions(entry),
    ...projectTitles
  ].filter(Boolean).join(' ').toLowerCase();
}

// Channel -> pill label, and the tag (latest-updates.js) whose colour it uses.
const RELEASE_CHANNELS = {
  stable:      { label: 'Stable',      tag: 'release' },
  beta:        { label: 'Beta',        tag: 'beta' },
  alpha:       { label: 'Alpha',       tag: 'alpha' },
  unsupported: { label: 'Unsupported', tag: 'unsupported' }
};

// "2026-10-13" -> "13 Oct"
const formatShortDate = iso => formatDate(iso, { day: 'numeric', month: 'short' });

// One <li> per release (icon, project, version pill, date); shared by the News sidebar and the home page.
function releaseRows(cfg) {
  return ((cfg && cfg.releases) || []).filter(r => r && r.project).map(r => {
    const channel = RELEASE_CHANNELS[String(r.channel || '').toLowerCase()];
    const meta = [];
    if (r.version) meta.push(versionPill(r.version, channel));
    if (r.date) meta.push(el('time', { class: 'release-date', text: formatShortDate(r.date), attrs: { datetime: r.date } }));
    // With a url, the name is a link stretching over the row.
    const name = newsAnchor('release-project', r.url, [el('span', { text: r.project })])
      || el('span', { class: 'release-project', text: r.project });
    const image = (allProjects().find(p => p.title === r.project) || {}).image;
    const pic = image
      ? el('img', { class: 'release-icon', src: image, alt: '', attrs: { width: '36', height: '36', decoding: 'async', draggable: 'false' } })
      : null;
    return el('li', { class: 'release-item' + (name.tagName === 'A' ? ' is-clickable' : '') + (pic ? ' has-icon' : '') }, [
      pic,
      el('div', { class: 'release-body' }, [name, el('div', { class: 'release-meta' }, meta)])
    ]);
  });
}

// Sidebar "Latest releases" panel.
function renderLatestReleases(cfg) {
  const rows = releaseRows(cfg);
  if (!rows.length) return null;

  const KEY = 'news-releases-collapsed';
  let open = storageGet(KEY) !== '1';

  const listId = 'latest-releases-list';
  const list = el('ul', { class: 'release-list' }, rows);
  const body = el('div', { class: 'news-filter-panel news-release-body', attrs: { id: listId } }, [list]);
  const toggle = el('button', { class: 'news-filter-toggle', attrs: { type: 'button', 'aria-controls': listId } }, [
    el('span', { class: 'news-filter-toggle-label', text: cfg.heading || 'Latest releases' }),
    el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
  ]);
  const panel = el('section', { class: 'news-filter-box' }, [toggle, body]);
  const apply = () => {
    toggle.setAttribute('aria-expanded', String(open));
    body.hidden = !open;
    panel.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => {
    open = !open;
    apply();
    storageSet(KEY, open ? '0' : '1');
  });
  apply();
  return panel;
}

// Sidebar info card: optional icon tile, heading, text, then buttons and/or a plain link.
function renderSideCard(card) {
  if (!card || !card.heading) return null;

  const makeButton = (b, extra) => b && newsAnchor('news-btn' + (extra ? ' ' + extra : ''), b.url, [
    b.icon ? icon(b.icon, 'icon-sm') : null,
    el('span', { text: b.label }),
    el('span', { class: 'news-btn-arrow', attrs: { 'aria-hidden': 'true' } })
  ]);
  const button = makeButton(card.button);
  const button2 = makeButton(card.button2);
  const secondary = (card.secondary || []).map(b => makeButton(b, 'news-btn-secondary')).filter(Boolean);
  const secondaryRow = secondary.length ? el('div', { class: 'news-btn-row' }, secondary) : null;
  const link = card.link && newsAnchor('news-link', card.link.url, [
    el('span', { text: card.link.label }),
    newsArrow()
  ]);

  return el('section', { class: 'news-panel news-card' }, [
    card.icon ? el('div', { class: 'news-card-icon', attrs: { 'aria-hidden': 'true' } }, [icon(card.icon, 'news-card-glyph')]) : null,
    el('div', { class: 'news-card-body' }, [
      el('h2', { class: 'news-card-heading', text: card.heading }),
      card.text ? el('p', { class: 'news-card-text', text: card.text }) : null,
      button,
      button2,
      secondaryRow,
      link
    ])
  ]);
}

// A heading (icon or label, rule, count) above a list of entries; used for pinned entries and each month.
function newsGroup(title, groupEntries, opts = {}) {
  const total = opts.total || groupEntries.length;
  const head = el('div', { class: 'news-group-head' }, [
    el('h2', { class: 'news-group-title' }, [
      opts.icon ? icon(opts.icon, 'icon-sm news-group-icon') : null,
      el('span', { text: title })
    ]),
    el('span', { class: 'news-group-line', attrs: { 'aria-hidden': 'true' } }),
    opts.count === false ? null : el('span', { class: 'news-group-count', text: `${total} ${total === 1 ? 'post' : 'posts'}` })
  ]);
  const items = el('ul', { class: 'news-list' }, groupEntries.map(e => renderNewsItem(e, { detailed: true, pinned: !!opts.pinned && opts.pinned.has(e) })));
  return el('section', { class: 'news-group' }, [head, items]);
}

const NEWS_PAGE_SIZE = 10; // entries shown initially and added per "Show more" click

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

  const everyProject = allProjects();
  const everyId = everyProject.map(p => p.id);
  const entryProjects = new Map(entries.map(e => [e, entryProjectIds(e, everyId)]));
  // Only projects with at least one entry get a filter.
  const projects = everyProject.filter(p => entries.some(e => entryProjects.get(e).includes(p.id)));
  const projectIds = projects.map(p => p.id);
  const projectTitle = new Map(projects.map(p => [p.id, p.title]));
  const haystacks = new Map(entries.map(e => [e, searchText(e, entryProjects.get(e).map(id => projectTitle.get(id)))]));
  const tagKeys = usedTagKeys(entries);
  const monthKeys = [...new Set(entries.map(newsMonthKey))]; // newest first
  const mcKeys = usedMcVersions(entries); // newest first
  const initial = readHash(tagKeys, projectIds, monthKeys, mcKeys);
  // Active filter sets; an empty set means "all".
  const active = initial.tags;
  const activeProjects = initial.projects;
  const activeMonths = initial.months;
  const activeMc = initial.mc;
  let sort = initial.sort; // 'newest' | 'oldest'; pinned entries stay on top either way
  let query = initial.query;
  let focused = initial.entry; // entry linked via #entry=...; cleared on the first filter or search change
  let limit = NEWS_PAGE_SIZE; // non-pinned entries currently shown
  let rendered = false;

  const list = el('div', { class: 'news-groups' });
  const status = el('p', { class: 'news-status', attrs: { 'aria-live': 'polite' } });
  const moreBtn = el('button', { class: 'news-show-more', attrs: { type: 'button', hidden: '' } });
  moreBtn.addEventListener('click', () => { limit += NEWS_PAGE_SIZE; refresh(true); });
  // Filter buttons by option key ('' is the "All" button), paired with the set they toggle.
  const buttons = new Map(); // tags
  const projectButtons = new Map();
  const monthButtons = new Map();
  const mcButtons = new Map();
  const sortButtons = new Map(); // 'newest' / 'oldest' -> menu item
  const filterRegistries = [[buttons, active], [projectButtons, activeProjects], [mcButtons, activeMc], [monthButtons, activeMonths]];

  // Search box, styled like the header search.
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
  function matches(entry, terms) {
    if (active.size && !(entry.tags || []).some(t => active.has(t))) return false;
    if (activeProjects.size && !entryProjects.get(entry).some(id => activeProjects.has(id))) return false;
    if (activeMc.size && !entryMcVersions(entry).some(v => activeMc.has(v))) return false;
    if (activeMonths.size && !activeMonths.has(newsMonthKey(entry))) return false;
    const hay = haystacks.get(entry);
    return terms.every(t => hay.includes(t));
  }

  // "Show more" adds NEWS_PAGE_SIZE entries; any other change (filters, search, sort) restarts at page one.
  function refresh(keepLimit) {
    if (!keepLimit) limit = NEWS_PAGE_SIZE;
    if (rendered) focused = '';
    rendered = true;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const shown = entries.filter(e => matches(e, terms));
    // Pinned entries get their own group; the rest are grouped by month.
    const oldestFirst = sort === 'oldest';
    const pinnedShown = pinnedEntries(entries, oldestFirst).filter(e => shown.includes(e));
    const pinnedSet = new Set(pinnedShown);
    const byMonth = (oldestFirst ? monthKeys.slice().reverse() : monthKeys).map(key => {
      const inMonth = shown.filter(e => !pinnedSet.has(e) && newsMonthKey(e) === key);
      if (oldestFirst) inMonth.reverse();
      return { key, inMonth };
    }).filter(g => g.inMonth.length);
    const ordered = byMonth.flatMap(g => g.inMonth); // display order, pinned entry not included

    // A linked entry (#entry=...) must be on screen, so open enough pages to include it.
    const linkedAt = focused ? ordered.findIndex(e => newsEntryId(e) === focused) : -1;
    if (linkedAt >= limit) limit = Math.ceil((linkedAt + 1) / NEWS_PAGE_SIZE) * NEWS_PAGE_SIZE;

    const visible = new Set(ordered.slice(0, limit));
    const groups = [];
    if (pinnedShown.length) groups.push(newsGroup('Pinned', pinnedShown, { icon: 'pin', pinned: pinnedSet }));
    byMonth.forEach(({ key, inMonth }) => {
      const part = inMonth.filter(e => visible.has(e));
      if (part.length) groups.push(newsGroup(formatMonth(key), part, { total: inMonth.length }));
    });
    list.replaceChildren(...groups);

    const remaining = Math.max(0, ordered.length - limit);
    moreBtn.hidden = remaining === 0;
    moreBtn.textContent = `Show ${Math.min(remaining, NEWS_PAGE_SIZE)} more`; // what this click adds

    filterRegistries.forEach(([registry, set]) => registry.forEach((btn, key) => {
      btn.setAttribute('aria-pressed', String(key === '' ? !set.size : set.has(key)));
    }));
    groupUpdaters.forEach(update => update());
    sortButtons.forEach((item, key) => {
      item.setAttribute('aria-selected', String(key === sort));
      item.classList.toggle('is-current', key === sort);
    });
    sortValues.forEach((node, key) => node.classList.toggle('is-hidden', key !== sort));
    clearBtn.hidden = !query;

    const onScreen = pinnedShown.length + visible.size;
    countText.replaceChildren('Showing ', el('strong', { text: `${onScreen} of ${entries.length}` }), ` ${entries.length === 1 ? 'entry' : 'entries'}`);
    status.textContent = !shown.length
      ? (query.trim() ? 'Nothing matches your search.' : 'Nothing matches those filters.')
      : '';
    writeHash(active, activeProjects, activeMonths, activeMc, sort, query, focused);
  }

  input.addEventListener('input', () => { query = input.value; refresh(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; query = ''; refresh(); }
  });
  clearBtn.addEventListener('click', () => { input.value = ''; query = ''; refresh(); input.focus(); });

  // One filter button: toggles `key` in `set`; `registry` lets refresh() show which are on.
  function makeButton(key, label, tag, set, registry, count, image) {
    const pic = image ? el('img', { class: 'news-filter-icon', src: image, alt: '', attrs: { width: '20', height: '20', decoding: 'async', draggable: 'false' } }) : null;
    const btn = el('button', { class: 'news-filter' + (tag ? '' : ' is-plain'), attrs: { type: 'button', 'aria-pressed': 'false' } }, [
      pic,
      el('span', { text: label }),
      el('span', { class: 'news-filter-count', text: String(count), attrs: { 'aria-hidden': 'true' } })
    ]);
    if (tag) setTagColor(btn, tag);
    if (key !== '' && count === 0) btn.classList.add('is-empty');
    btn.addEventListener('click', () => {
      if (key === '') set.clear();
      else if (set.has(key)) set.delete(key);
      else set.add(key);
      refresh();
    });
    registry.set(key, btn);
    return btn;
  }

  const FILTER_VISIBLE = 4; // options per group shown before "Show more"

  // A titled, collapsible group of filter buttons ("All" first). `startOpen` is the default
  // state, but a group with a selection (e.g. from a shared link) always starts open.
  // Only `visible` options show until "Show more" is pressed. `noun` is "projects", "tags", etc.
  const groupUpdaters = []; // refresh() calls these so each title shows its selected count
  function buildFilterGroup(title, noun, visible, startOpen, allButton, optionButtons, keys, set, panelId) {
    const bodyId = 'news-filter-group-' + noun;
    const options = el('div', { class: 'news-filters', attrs: { role: 'group', 'aria-label': 'Filter news by ' + title.toLowerCase() } }, [
      allButton,
      ...optionButtons
    ]);
    const body = el('div', { class: 'news-filter-group-body', attrs: { id: bodyId } }, [options]);
    const selected = el('span', { class: 'news-filter-group-selected', attrs: { hidden: '' } });
    const heading = el('button', { class: 'news-filter-group-toggle', attrs: { type: 'button', 'aria-controls': bodyId } }, [
      el('span', { class: 'news-filter-group-label', text: title }),
      selected,
      el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
    ]);
    const group = el('div', { class: 'news-filter-group' }, [
      el('h3', { class: 'news-filter-group-title' }, [heading]),
      body
    ]);

    let open = startOpen || set.size > 0;
    function applyOpen() {
      heading.setAttribute('aria-expanded', String(open));
      body.hidden = !open;
      group.classList.toggle('is-open', open);
    }
    heading.addEventListener('click', () => { open = !open; applyOpen(); });
    applyOpen();
    groupUpdaters.push(() => {
      selected.textContent = String(set.size);
      selected.hidden = set.size === 0;
    });

    let expanded = false;
    let more = null;
    function applyMore() {
      optionButtons.forEach((b, i) => { b.hidden = !expanded && i >= visible; });
      if (!more) return;
      more.setAttribute('aria-expanded', String(expanded));
      more.firstChild.textContent = (expanded ? 'Show fewer ' : 'Show more ') + noun;
    }
    if (optionButtons.length > visible) {
      more = el('button', { class: 'news-filter-more', attrs: { type: 'button', 'aria-controls': panelId } }, [
        el('span'),
        el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
      ]);
      more.addEventListener('click', () => { expanded = !expanded; applyMore(); });
      body.appendChild(more);
    }
    // A selection from a shared link might be hidden behind "Show more".
    expanded = keys.slice(visible).some(k => set.has(k));
    applyMore();
    return group;
  }

  // Filter dropdown: a toggle opening a panel of filter groups.
  function buildFilterDropdown() {
    const panelId = 'news-filter-panel';
    const toggle = el('button', { class: 'news-filter-toggle', attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId } }, [
      el('span', { class: 'news-filter-toggle-label', text: side.filterHeading || 'Filters' }),
      el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
    ]);

    const groups = [];
    if (projects.length) {
      const projectCount = id => entries.filter(e => entryProjects.get(e).includes(id)).length;
      groups.push(buildFilterGroup(
        'Project', 'projects', FILTER_VISIBLE, true,
        makeButton('', 'All projects', null, activeProjects, projectButtons, entries.length),
        projects.map(p => makeButton(p.id, p.title, null, activeProjects, projectButtons, projectCount(p.id), p.image)),
        projectIds, activeProjects, panelId
      ));
    }
    if (mcKeys.length) {
      const mcCount = v => entries.filter(e => entryMcVersions(e).includes(v)).length;
      groups.push(buildFilterGroup(
        'Minecraft version', 'versions', FILTER_VISIBLE, false,
        makeButton('', 'All versions', null, activeMc, mcButtons, entries.length),
        mcKeys.map(v => makeButton(v, v, null, activeMc, mcButtons, mcCount(v))),
        mcKeys, activeMc, panelId
      ));
    }
    if (tagKeys.length > 1) {
      groups.push(buildFilterGroup(
        'Tags', 'tags', FILTER_VISIBLE, false,
        makeButton('', 'All tags', null, active, buttons, entries.length),
        tagKeys.map(k => { const t = newsTag(k); return makeButton(k, t.label, t, active, buttons, entries.filter(e => (e.tags || []).includes(k)).length); }),
        tagKeys, active, panelId
      ));
    }
    if (monthKeys.length > 1) {
      const monthCount = key => entries.filter(e => newsMonthKey(e) === key).length;
      groups.push(buildFilterGroup(
        'Month', 'months', FILTER_VISIBLE, false,
        makeButton('', 'All months', null, activeMonths, monthButtons, entries.length),
        monthKeys.map(k => makeButton(k, formatMonth(k), null, activeMonths, monthButtons, monthCount(k))),
        monthKeys, activeMonths, panelId
      ));
    }
    const panel = el('div', { class: 'news-filter-panel', attrs: { id: panelId, hidden: '' } }, groups);

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

  // Toolbar: "Showing X of Y entries" on the left, sort dropdown on the right.
  const countText = el('p', { class: 'news-count', attrs: { 'aria-live': 'polite' } });
  // Built like the nav's Projects dropdown.
  const SORT_OPTIONS = [['newest', 'Newest first'], ['oldest', 'Oldest first']];
  const sortMenuId = 'news-sort-menu';
  // Both labels share a grid cell (one hidden), so the button never resizes when the sort changes.
  const sortValues = new Map(SORT_OPTIONS.map(([key, label]) => [key, el('span', { text: label })]));
  const sortLabel = el('span', { class: 'news-sort-value' }, [...sortValues.values()]);
  const sortTrigger = el('button', { class: 'news-sort-trigger', attrs: { type: 'button', 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-controls': sortMenuId, 'aria-label': 'Sort news' } }, [
    sortLabel,
    el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
  ]);
  const sortItems = SORT_OPTIONS.map(([key, label]) => {
    const item = el('button', { class: 'nav-dropdown-item news-sort-item', text: label, attrs: { type: 'button', role: 'option', 'data-sort': key, 'aria-selected': 'false' } });
    item.addEventListener('click', () => { sort = key; setSortOpen(false, true); refresh(); });
    sortButtons.set(key, item);
    return item;
  });
  const sortMenu = el('div', { class: 'nav-dropdown-menu news-sort-menu', attrs: { id: sortMenuId, role: 'listbox', 'aria-label': 'Sort news', hidden: '' } }, sortItems);
  const sortDropdown = el('div', { class: 'nav-dropdown news-sort-dropdown' }, [sortTrigger, sortMenu]);

  function setSortOpen(open, refocus) {
    sortMenu.hidden = !open;
    sortTrigger.setAttribute('aria-expanded', String(open));
    sortDropdown.classList.toggle('is-open', open);
    if (!open && refocus) sortTrigger.focus();
  }
  sortTrigger.addEventListener('click', () => setSortOpen(sortMenu.hidden));
  sortTrigger.addEventListener('keydown', e => {
    if (e.key !== 'ArrowDown') return;
    e.preventDefault();
    setSortOpen(true);
    (sortButtons.get(sort) || sortItems[0]).focus();
  });
  sortMenu.addEventListener('keydown', e => {
    const i = sortItems.indexOf(document.activeElement);
    let next = -1;
    if (e.key === 'ArrowDown') next = (i + 1) % sortItems.length;
    else if (e.key === 'ArrowUp') next = (i - 1 + sortItems.length) % sortItems.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = sortItems.length - 1;
    else if (e.key === 'Escape') { e.preventDefault(); setSortOpen(false, true); return; }
    if (next < 0) return;
    e.preventDefault();
    sortItems[next].focus();
  });
  sortDropdown.addEventListener('focusout', e => {
    if (!sortDropdown.contains(e.relatedTarget)) setSortOpen(false);
  });
  document.addEventListener('pointerdown', e => {
    if (!sortDropdown.contains(e.target)) setSortOpen(false);
  });

  const sortBox = el('div', { class: 'news-sort' }, [
    el('span', { class: 'news-sort-label', text: 'Sort', attrs: { 'aria-hidden': 'true' } }),
    sortDropdown
  ]);
  const toolbar = el('div', { class: 'news-toolbar' }, [countText, sortBox]);

  const filterBox = (projects.length || tagKeys.length > 1 || mcKeys.length || monthKeys.length > 1) ? buildFilterDropdown() : null;
  const filters = filterBox ? el('div', { class: 'news-filter-area' }, [filterBox]) : null;
  const search = el('div', { class: 'news-search-area' }, [searchBox]);

  const extras = [renderLatestReleases(side.latestReleases), ...(side.cards || []).map(renderSideCard)].filter(Boolean);
  const layout = el('div', { class: 'news-layout' + (extras.length ? '' : ' no-extras') + (filters ? '' : ' no-filters') }, [
    toolbar,
    search,
    filters,
    el('div', { class: 'news-feed' }, [status, list, moreBtn]),
    extras.length ? el('aside', { class: 'news-extra', attrs: { 'aria-label': 'More about the news' } }, extras) : null
  ]);
  main.appendChild(layout);
  refresh();
  focusLinkedEntry(list, focused);
}

// Scrolls to the entry named in the URL (#entry=...) and briefly outlines it.
function focusLinkedEntry(list, id) {
  const target = id && list.querySelector('#' + CSS.escape('entry-' + id));
  if (!target) return;
  target.classList.add('is-targeted');
  target.scrollIntoView({ block: 'center' });
  setTimeout(() => target.classList.remove('is-targeted'), 2500);
}

if (document.getElementById('news-page')) {
  renderBrand(SITE_DATA.brand);
  renderSiteHeader(SITE_DATA.pages || [], 'news');
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderNewsPage();
  markNewsSeen(newsEntries());
  clearSkeletons();
  initBackToTop();
}

/* ---------- Announcement card ----------
   Corner card on every page except News, built from the newest `announce: true` entry.
   Dismissal is remembered per entry. */

const ANNOUNCE_KEY = 'announcement-dismissed';

// The entry's `image`, else the icon of the project its same-site `url` points at.
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
  if (document.getElementById('news-page')) return;

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

  const close = el('button', { class: 'announce-close', attrs: { type: 'button', 'aria-label': 'Dismiss announcement', 'data-tooltip': 'Dismiss' } });
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

initAnnouncementCard();
