/* News feed: renders LATEST_UPDATES (format documented in latest-updates.js) as the
   home page preview and the full News page. Needs latest-updates.js, data.js and shell.js (shared helpers, incl. news date/tag/link builders). */

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

// Every project on the site, in site order: none unless a feature (the catalogue) registered some.
let allProjectsCache;
function allProjects() {
  if (!allProjectsCache) allProjectsCache = SITE_HOOKS.projects();
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

// Link button for an entry's `url`.
function newsLink(entry) {
  return newsAnchor('news-link', entry.url, [
    el('span', { text: entry.linkText || 'Read more' }),
    newsArrow()
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

// Pinned entries in display order: the announced entry, then those with pinned: true
// (in `entries` order, reversed when `oldestFirst`).
function pinnedEntries(entries, oldestFirst) {
  const announced = announcedEntry(entries);
  const others = entries.filter(e => e !== announced && e.pinned === true);
  if (oldestFirst) others.reverse();
  return announced ? [announced, ...others] : others;
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
const formatShortDate = iso => displayDate(iso, 'short');

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
  let filterPanel = null; // the shared filter box (shell.js), built below when there is anything to filter by

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

    if (filterPanel) filterPanel.sync();
    sortControl.set(sort);
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

  // Filter dropdown: a toggle opening a panel of filter groups.
  function buildFilterDropdown() {
    filterPanel = buildFilterPanel({ idPrefix: 'news', subject: 'news', heading: side.filterHeading, onChange: () => refresh() });

    if (projects.length) {
      const projectCount = id => entries.filter(e => entryProjects.get(e).includes(id)).length;
      filterPanel.addGroup({
        title: 'Project', noun: 'projects', startOpen: true, set: activeProjects,
        allLabel: 'All projects', total: entries.length,
        options: projects.map(p => ({ key: p.id, label: p.title, count: projectCount(p.id), image: p.image }))
      });
    }
    if (mcKeys.length) {
      const mcCount = v => entries.filter(e => entryMcVersions(e).includes(v)).length;
      filterPanel.addGroup({
        title: 'Minecraft version', noun: 'versions', set: activeMc,
        allLabel: 'All versions', total: entries.length,
        options: mcKeys.map(v => ({ key: v, label: v, count: mcCount(v) }))
      });
    }
    if (tagKeys.length > 1) {
      filterPanel.addGroup({
        title: 'Tags', noun: 'tags', set: active,
        allLabel: 'All tags', total: entries.length,
        options: tagKeys.map(k => { const t = newsTag(k); return { key: k, label: t.label, tag: t, count: entries.filter(e => (e.tags || []).includes(k)).length }; })
      });
    }
    if (monthKeys.length > 1) {
      const monthCount = key => entries.filter(e => newsMonthKey(e) === key).length;
      filterPanel.addGroup({
        title: 'Month', noun: 'months', set: activeMonths,
        allLabel: 'All months', total: entries.length,
        options: monthKeys.map(k => ({ key: k, label: formatMonth(k), count: monthCount(k) }))
      });
    }
    return filterPanel.node;
  }

  // Toolbar: "Showing X of Y entries" on the left, sort dropdown on the right.
  const countText = el('p', { class: 'news-count', attrs: { 'aria-live': 'polite' } });
  const sortControl = buildSortDropdown({
    options: [{ key: 'newest', label: 'Newest first' }, { key: 'oldest', label: 'Oldest first' }],
    current: sort, label: 'Sort news', menuId: 'news-sort-menu',
    onChange: key => { sort = key; refresh(); }
  });
  const sortBox = sortControl.node;
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
