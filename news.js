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

// Stable anchor for an entry, used to link to it on the News page.
function newsEntryId(entry) {
  return slugify(entry.date + ' ' + entry.title);
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

// Every project on the site, in site order: [{ id, title }]. The News page's
// project filter lists all of them, even ones with no entries yet.
function allProjects() {
  const out = [];
  (SITE_DATA.sections || []).forEach(section => {
    sectionIds(section).projects.forEach(p => out.push({ id: p.id, title: p.project.title, image: p.project.image || null, modrinth: ((p.project.links || []).find(l => l.label === 'Modrinth') || {}).url || null }));
  });
  return out;
}

// An entry's `projects` as [{ id, version?, channel?, text? }]; a plain id
// string is the same as { id }.
function projectRefs(entry) {
  return (entry.projects || [])
    .map(p => (typeof p === 'string' ? { id: p } : p))
    .filter(p => p && p.id);
}

// Project ids an entry belongs to: any listed in its `projects`, plus the one
// its same-site `url` points at (e.g. "/data-packs-mods#better-unpackables").
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

// Calendar icon for dates; dropped if images/icons/calendar.svg is missing.
function calendarIcon() {
  const node = icon('calendar', 'icon-sm news-date-icon');
  const probe = new Image();
  probe.onerror = () => node.remove();
  probe.src = sitePath('images/icons/calendar.svg');
  return node;
}

// "Today", "3 days ago", "2 weeks ago" while an entry is under a month old; null otherwise.
function relativeNewsDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d)) return null;

  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((today - d.getTime()) / 86400000);
  if (days < 0) return null;

  // One month back from today; a short month clamps (31 Mar -> 28 Feb, not 3 Mar).
  const limit = new Date(today);
  const day = limit.getUTCDate();
  limit.setUTCDate(1);
  limit.setUTCMonth(limit.getUTCMonth() - 1);
  limit.setUTCDate(Math.min(day, new Date(Date.UTC(limit.getUTCFullYear(), limit.getUTCMonth() + 1, 0)).getUTCDate()));
  if (d.getTime() <= limit.getTime()) return null;

  const words = new Intl.RelativeTimeFormat('en-GB', { numeric: 'auto' });
  const counts = new Intl.RelativeTimeFormat('en-GB', { numeric: 'always' });
  return capitalise(days < 7 ? words.format(-days, 'day') : counts.format(-Math.floor(days / 7), 'week'));
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

// SVGs in <img> are plain black and vanish on the dark background, so draw them as a coloured mask.
function svgMask(src, cls) {
  const url = `url('${sitePath(src)}')`;
  const node = el('span', { class: 'icon ' + cls, attrs: { 'aria-hidden': 'true' } });
  node.style.webkitMaskImage = url;
  node.style.maskImage = url;
  return node;
}

// Picture tile for an entry: its `image`, else its project's icon, else a news glyph.
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

// The channel a project's version pill is coloured by: its own `channel`, else
// the first channel-like tag on the entry (release shows as stable).
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

// Modrinth page for a project's version: the ref's own `versionUrl`, else
// <project page>/version/<version> when the version looks like a release
// ("v8.0.0", not a Minecraft snapshot name, which has no page of its own).
function versionUrl(ref, project) {
  if (ref.versionUrl) return ref.versionUrl;
  if (!project.modrinth || !/^v\d/i.test(ref.version || '')) return null;
  return `${project.modrinth}/version/${encodeURIComponent(ref.version)}`;
}

// Per-project rows inside an entry: icon, name, version pill and an optional
// description. Only entries whose `projects` use the object form get one.
function renderEntryProjects(entry) {
  const refs = projectRefs(entry).filter(r => r.version || r.text);
  if (!refs.length) return null;

  const all = allProjects();
  const rows = refs.map(ref => {
    const project = all.find(p => p.id === ref.id);
    if (!project) return null;
    const icon = project.image ? el('img', { class: 'news-project-icon', src: project.image, alt: '', attrs: { width: '28', height: '28', decoding: 'async', draggable: 'false' } }) : null;
    const name = el('span', { class: 'news-project-name', text: project.title });
    const pill = ref.version ? versionPill(ref.version, refChannel(ref, entry)) : null;
    const text = ref.text ? el('p', { class: 'news-project-text', text: fillPlaceholders(ref.text) }) : null;
    // Icon, name, pill and description are one link: the version's Modrinth page,
    // else the project's (or the ref's own `url`).
    const content = [el('div', { class: 'news-project-head' }, [icon, name, pill]), text];
    const target = ref.url || versionUrl(ref, project) || project.modrinth;
    const link = newsAnchor('news-project-link', target, content);
    if (link) link.setAttribute('aria-label', `${project.title}${ref.version ? ' ' + ref.version : ''} on Modrinth`);
    return el('li', { class: 'news-project' }, [
      link || el('div', { class: 'news-project-who' }, content)
    ]);
  }).filter(Boolean);
  return rows.length ? el('ul', { class: 'news-projects' }, rows) : null;
}

// The entry the announcement card is built from: the newest with announce: true.
// The News page pins it to the very top of the list.
function announcedEntry(entries) {
  return entries.find(e => e.announce === true) || null;
}

// Entries pinned on the News page, in display order: the announced entry
// first, then every entry with pinned: true (newest first, or oldest first
// when `oldestFirst`). `entries` is newest first.
function pinnedEntries(entries, oldestFirst) {
  const announced = announcedEntry(entries);
  const others = entries.filter(e => e !== announced && e.pinned === true);
  if (oldestFirst) others.reverse();
  return announced ? [announced, ...others] : others;
}

function renderNewsItem(entry, opts = {}) {
  const pills = (entry.tags || []).map(key => {
    const tag = newsTag(key);
    const pill = el('span', { class: 'news-tag', text: tag.label });
    setTagColor(pill, tag);
    return pill;
  });
  // News page: tags sit beside the entry; home page: beside the date.
  const head = el('div', { class: 'news-meta' }, opts.detailed ? [newsDate(entry)] : [...pills, newsDate(entry)]);
  // Home page: "View full update" links to the entry on the News page. News page: the entry's own url.
  const page = !opts.detailed && (SITE_DATA.pages || []).find(p => p.url === 'news');
  const link = opts.detailed
    ? newsLink(entry)
    : page && internalLink('news-link', `${page.url}#entry=${newsEntryId(entry)}`, [
        el('span', { text: 'View full update' }),
        newsArrow()
      ]);

  const body = [
    head,
    el('h3', { class: 'news-title', text: entry.title }),
    entry.text ? el('p', { class: 'news-text', text: fillPlaceholders(entry.text) }) : null,
    opts.detailed ? renderEntryProjects(entry) : null,
    link
  ];

  if (!opts.detailed) {
    return el('li', { class: 'news-item' + (link ? ' is-linked' : '') }, body);
  }

  // With a link, the whole entry is clickable (the link stretches over it).
  return el('li', { attrs: { id: 'entry-' + newsEntryId(entry) }, class: 'news-item news-item-detailed' + (link ? ' is-clickable' : '') + (opts.pinned ? ' is-pinned' : '') }, [
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

// "2026-10-13" -> "2026-10": the key entries are grouped and filtered by.
function newsMonthKey(entry) {
  return entry.date.slice(0, 7);
}

// "2026-10" -> "October 2026"
function formatMonth(key) {
  const d = new Date(key + '-01T00:00:00Z');
  if (isNaN(d)) return key;
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

// Filters and search live in the URL hash so a filtered view can be linked to,
// e.g. #projects=better-unpackables&tags=release&months=2026-10&sort=oldest&q=snapshot
function readHash(validTags, validProjects, validMonths) {
  const params = new URLSearchParams(location.hash.slice(1));
  const tags = (params.get('tags') || '').split(',').filter(k => validTags.includes(k));
  const projects = (params.get('projects') || '').split(',').filter(k => validProjects.includes(k));
  const months = (params.get('months') || '').split(',').filter(k => validMonths.includes(k));
  return { tags: new Set(tags), projects: new Set(projects), months: new Set(months), sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest', query: params.get('q') || '', entry: params.get('entry') || '' };
}

function writeHash(active, activeProjects, activeMonths, sort, query, entry) {
  const params = new URLSearchParams();
  if (entry) params.set('entry', entry);
  if (activeProjects.size) params.set('projects', [...activeProjects].join(','));
  if (active.size) params.set('tags', [...active].join(','));
  if (activeMonths.size) params.set('months', [...activeMonths].join(','));
  if (sort === 'oldest') params.set('sort', 'oldest');
  if (query.trim()) params.set('q', query.trim());
  const text = params.toString();
  history.replaceState(null, '', location.pathname + location.search + (text ? '#' + text : ''));
}

// Everything a visitor could reasonably search for in an entry, lower-cased.
function searchText(entry, projectTitles) {
  return [
    entry.title,
    entry.text,
    entry.linkText,
    formatNewsDate(entry.date),
    entry.date,
    ...(entry.tags || []).map(k => newsTag(k).label),
    ...projectTitles
  ].filter(Boolean).join(' ').toLowerCase();
}

// Channel -> label shown on the pill, and the tag (in latest-updates.js) whose colour it uses.
const RELEASE_CHANNELS = {
  stable:      { label: 'Stable',      tag: 'release' },
  beta:        { label: 'Beta',        tag: 'beta' },
  alpha:       { label: 'Alpha',       tag: 'alpha' },
  unsupported: { label: 'Unsupported', tag: 'unsupported' }
};

// "2026-10-13" -> "13 Oct"
function formatShortDate(iso) {
  const d = new Date(iso + 'T00:00:00Z');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

// Sidebar "Latest releases" panel: one row per release (icon, project, version pill, date).
function renderLatestReleases(cfg) {
  const rows = ((cfg && cfg.releases) || []).filter(r => r && r.project).map(r => {
    const channel = RELEASE_CHANNELS[String(r.channel || '').toLowerCase()];
      const meta = [];
    if (r.version) meta.push(versionPill(r.version, channel));
    if (r.date) meta.push(el('time', { class: 'release-date', text: formatShortDate(r.date), attrs: { datetime: r.date } }));
    // With a url, the project name is a link that stretches over the whole row.
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
  if (!rows.length) return null;

  // Collapse state is remembered per browser; storage access is guarded.
  const KEY = 'news-releases-collapsed';
  let open = true;
  try { open = localStorage.getItem(KEY) !== '1'; } catch (e) {}

  // Same box, toggle and chevron as the Filters dropdown above it.
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
    try { localStorage.setItem(KEY, open ? '0' : '1'); } catch (e) {}
  });
  apply();
  return panel;
}

// Sidebar info card: optional icon tile, heading, text, then `button`, `button2`, `secondary` buttons and/or a plain `link`.
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

// A heading (icon or label, rule, count) above a list of entries; used for the pinned entry and each month.
function newsGroup(title, groupEntries, opts = {}) {
  const head = el('div', { class: 'news-group-head' }, [
    el('h2', { class: 'news-group-title' }, [
      opts.icon ? icon(opts.icon, 'icon-sm news-group-icon') : null,
      el('span', { text: title })
    ]),
    el('span', { class: 'news-group-line', attrs: { 'aria-hidden': 'true' } }),
    opts.count === false ? null : el('span', { class: 'news-group-count', text: `${opts.total || groupEntries.length} ${(opts.total || groupEntries.length) === 1 ? 'post' : 'posts'}` })
  ]);
  const items = el('ul', { class: 'news-list' }, groupEntries.map(e => renderNewsItem(e, { detailed: true, pinned: !!opts.pinned && opts.pinned.has(e) })));
  return el('section', { class: 'news-group' }, [head, items]);
}

const NEWS_PAGE_SIZE = 10; // entries shown at first, and added by each "Show more" click

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
  const entryProjects = new Map(entries.map(e => [e, entryProjectIds(e, everyProject.map(p => p.id))]));
  // Only projects with at least one entry get a filter.
  const projects = everyProject.filter(p => entries.some(e => entryProjects.get(e).includes(p.id)));
  const projectIds = projects.map(p => p.id);
  const projectTitle = new Map(projects.map(p => [p.id, p.title]));
  const haystacks = new Map(entries.map(e => [e, searchText(e, entryProjects.get(e).map(id => projectTitle.get(id)))]));
  const tagKeys = usedTagKeys(entries);
  const monthKeys = [...new Set(entries.map(newsMonthKey))]; // newest first
  const initial = readHash(tagKeys, projectIds, monthKeys);
  const active = initial.tags; // empty set = every tag
  const activeProjects = initial.projects; // empty set = every project
  const activeMonths = initial.months; // empty set = every month
  let sort = initial.sort; // 'newest' or 'oldest'; pinned entries stay on top either way
  let query = initial.query;
  let focused = initial.entry; // an entry linked to from elsewhere (#entry=...); cleared on the first filter or search change
  let limit = NEWS_PAGE_SIZE; // how many (non-pinned) entries are shown
  let rendered = false;

  const list = el('div', { class: 'news-groups' }); // a heading and a list of entries per group (pinned, then each month)
  const status = el('p', { class: 'news-status', attrs: { 'aria-live': 'polite' } });
  const moreBtn = el('button', { class: 'news-show-more', attrs: { type: 'button', hidden: '' } });
  moreBtn.addEventListener('click', () => { limit += NEWS_PAGE_SIZE; refresh(true); });
  const buttons = new Map(); // tag key (or '') -> button
  const projectButtons = new Map(); // project id (or '') -> button
  const monthButtons = new Map(); // month key (or '') -> button
  const sortButtons = new Map(); // 'newest' / 'oldest' -> menu item

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
    if (activeProjects.size && !entryProjects.get(entry).some(id => activeProjects.has(id))) return false;
    if (activeMonths.size && !activeMonths.has(newsMonthKey(entry))) return false;
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hay = haystacks.get(entry);
    return terms.every(t => hay.includes(t));
  }

  // Only the first NEWS_PAGE_SIZE entries show at first; "Show more" adds that many again.
  // Any other change (filters, search, sort) starts over from the first page.
  function refresh(keepLimit) {
    if (!keepLimit) limit = NEWS_PAGE_SIZE;
    if (rendered) focused = '';
    rendered = true;
    const shown = entries.filter(matches);
    // Pinned entries (announced first) go under their own heading (those matching the current
    // filters); the rest are grouped by month, newest first.
    const oldestFirst = sort === 'oldest';
    const pinnedShown = pinnedEntries(entries, oldestFirst).filter(e => shown.includes(e));
    const pinnedSet = new Set(pinnedShown);
    const byMonth = (oldestFirst ? monthKeys.slice().reverse() : monthKeys).map(key => {
      const inMonth = shown.filter(e => !pinnedSet.has(e) && newsMonthKey(e) === key);
      if (oldestFirst) inMonth.reverse();
      return { key, inMonth };
    }).filter(g => g.inMonth.length);
    const ordered = byMonth.flatMap(g => g.inMonth); // display order, pinned entry not included

    // An entry linked to from elsewhere (#entry=...) must be on screen, so open enough pages to include it.
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

    buttons.forEach((btn, key) => {
      const on = key === '' ? !active.size : active.has(key);
      btn.setAttribute('aria-pressed', String(on));
    });
    projectButtons.forEach((btn, id) => {
      const on = id === '' ? !activeProjects.size : activeProjects.has(id);
      btn.setAttribute('aria-pressed', String(on));
    });
    monthButtons.forEach((btn, key) => {
      const on = key === '' ? !activeMonths.size : activeMonths.has(key);
      btn.setAttribute('aria-pressed', String(on));
    });
    groupUpdaters.forEach(update => update());
    sortButtons.forEach((item, key) => {
      item.setAttribute('aria-selected', String(key === sort));
      item.classList.toggle('is-current', key === sort);
    });
    sortValues.forEach((node, key) => node.classList.toggle('is-hidden', key !== sort));
    clearBtn.hidden = !query;

    // Entries on screen (pinned plus the loaded pages) out of every entry.
    const onScreen = pinnedShown.length + visible.size;
    countText.replaceChildren('Showing ', el('strong', { text: `${onScreen} of ${entries.length}` }), ` ${entries.length === 1 ? 'entry' : 'entries'}`);
    status.textContent = !shown.length
      ? (query.trim() ? 'Nothing matches your search.' : 'Nothing matches those filters.')
      : '';
    writeHash(active, activeProjects, activeMonths, sort, query, focused);
  }

  input.addEventListener('input', () => { query = input.value; refresh(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; query = ''; refresh(); }
  });
  clearBtn.addEventListener('click', () => { input.value = ''; query = ''; refresh(); input.focus(); });

  // One filter button. `set` is the active set it toggles, `registry` the map
  // refresh() uses to show which buttons are on, and `count` the entries it matches.
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

  // How many options each group shows before "Show more".
  const PROJECTS_VISIBLE = 4;
  const TAGS_VISIBLE = 4;
  const MONTHS_VISIBLE = 4;

  // A titled group of filter buttons: an "All" button, then the options. The title is a
  // button that collapses the group (`startOpen` sets its default; a group with something
  // already selected, e.g. from a shared link, always starts open). Only the first
  // `visible` options show until "Show more" is pressed (the button only exists when
  // there are more). `noun` is "projects" or "tags".
  const groupUpdaters = []; // refresh() calls these so each title shows how many options are selected
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
    // An option picked from a shared link might be hidden behind "Show more".
    expanded = keys.slice(visible).some(k => set.has(k));
    applyMore();
    return group;
  }

  // Filter dropdown: a toggle button that opens/collapses the panel, which holds
  // the project group, then the tag group.
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
        'Project', 'projects', PROJECTS_VISIBLE, true,
        makeButton('', 'All projects', null, activeProjects, projectButtons, entries.length),
        projects.map(p => makeButton(p.id, p.title, null, activeProjects, projectButtons, projectCount(p.id), p.image)),
        projectIds, activeProjects, panelId
      ));
    }
    if (tagKeys.length > 1) {
      groups.push(buildFilterGroup(
        'Tags', 'tags', TAGS_VISIBLE, false,
        makeButton('', 'All tags', null, active, buttons, entries.length),
        tagKeys.map(k => { const t = newsTag(k); return makeButton(k, t.label, t, active, buttons, entries.filter(e => (e.tags || []).includes(k)).length); }),
        tagKeys, active, panelId
      ));
    }
    if (monthKeys.length > 1) {
      const monthCount = key => entries.filter(e => newsMonthKey(e) === key).length;
      groups.push(buildFilterGroup(
        'Month', 'months', MONTHS_VISIBLE, false,
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

  // Toolbar above the entries, level with the search box: "Showing X of Y entries" on the left, sort dropdown on the right.
  const countText = el('p', { class: 'news-count', attrs: { 'aria-live': 'polite' } });
  // Custom dropdown, built like the nav's Projects dropdown (same menu panel and items).
  const SORT_OPTIONS = [['newest', 'Newest first'], ['oldest', 'Oldest first']];
  const sortMenuId = 'news-sort-menu';
  // Both labels sit in the same grid cell and only the current one is visible, so the button
  // is always as wide as the longer label and doesn't resize when the sort changes.
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

  // Grid items: search and toolbar share the top row, then filters and the entries, then the extras.
  const filterBox = (projects.length || tagKeys.length > 1 || monthKeys.length > 1) ? buildFilterDropdown() : null;
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

// Scrolls to the entry named in the URL (#entry=...) and flashes its outline.
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
  initBackToTop();
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

  // "View full update" links to the entry and stretches over the card; the close button stays above.
  const page = (SITE_DATA.pages || []).find(p => p.url === 'news');
  const link = page && internalLink('news-link', `${page.url}#entry=${newsEntryId(entry)}`, [
    el('span', { text: 'View full update' }),
    newsArrow()
  ]);

  const close = el('button', { class: 'announce-close', attrs: { type: 'button', 'aria-label': 'Dismiss announcement', 'data-tooltip': 'Dismiss' } });
  const card = el('aside', { class: 'announce' + (link ? ' is-linked' : ''), attrs: { role: 'region', 'aria-label': 'Latest news' } }, [
    el('div', { class: 'news-meta announce-meta' }, [
      ...pills,
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
