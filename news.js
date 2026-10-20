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
  // Home page: no per-entry url; a "View full update" link goes to the entry on
  // the News page and stretches over the whole card. The News page uses the entry's own url.
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
  const pin = opts.pinned
    ? el('span', { class: 'news-pin', attrs: { role: 'img', 'aria-label': 'Pinned', 'data-tooltip': 'Pinned' } }, [icon('pin', 'icon-sm')])
    : null;
  return el('li', { attrs: { id: 'entry-' + newsEntryId(entry) }, class: 'news-item news-item-detailed' + (link ? ' is-clickable' : '') + (pin ? ' is-pinned' : '') }, [
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

// Active filters and the search text live in the URL
// (#projects=better-unpackables&tags=release,new&q=snapshot) so a filtered view can be linked to.
function readHash(validTags, validProjects) {
  const params = new URLSearchParams(location.hash.slice(1));
  const tags = (params.get('tags') || '').split(',').filter(k => validTags.includes(k));
  const projects = (params.get('projects') || '').split(',').filter(k => validProjects.includes(k));
  return { tags: new Set(tags), projects: new Set(projects), query: params.get('q') || '', entry: params.get('entry') || '' };
}

function writeHash(active, activeProjects, query, entry) {
  const params = new URLSearchParams();
  if (entry) params.set('entry', entry);
  if (activeProjects.size) params.set('projects', [...activeProjects].join(','));
  if (active.size) params.set('tags', [...active].join(','));
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

// Sidebar "Latest releases" panel: one row per release with the project name,
// (with its icon) then its version (a pill coloured by channel) and date. Rows with a `url` are links.
function renderLatestReleases(cfg) {
  const rows = ((cfg && cfg.releases) || []).filter(r => r && r.project).map(r => {
    const channel = RELEASE_CHANNELS[String(r.channel || '').toLowerCase()];
    // One pill: the version, coloured by its channel.
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

  return el('section', { class: 'news-panel' }, [
    el('h2', { class: 'news-panel-heading', text: cfg.heading || 'Latest releases' }),
    el('ul', { class: 'release-list' }, rows)
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

  const everyProject = allProjects();
  const entryProjects = new Map(entries.map(e => [e, entryProjectIds(e, everyProject.map(p => p.id))]));
  // Only projects with at least one entry get a filter.
  const projects = everyProject.filter(p => entries.some(e => entryProjects.get(e).includes(p.id)));
  const projectIds = projects.map(p => p.id);
  const projectTitle = new Map(projects.map(p => [p.id, p.title]));
  const haystacks = new Map(entries.map(e => [e, searchText(e, entryProjects.get(e).map(id => projectTitle.get(id)))]));
  const tagKeys = usedTagKeys(entries);
  const initial = readHash(tagKeys, projectIds);
  const active = initial.tags; // empty set = every tag
  const activeProjects = initial.projects; // empty set = every project
  let query = initial.query;
  let focused = initial.entry; // an entry linked to from elsewhere (#entry=...); cleared on the first filter or search change
  let rendered = false;

  const list = el('ul', { class: 'news-list' });
  const status = el('p', { class: 'news-status', attrs: { 'aria-live': 'polite' } });
  const buttons = new Map(); // tag key (or '') -> button
  const projectButtons = new Map(); // project id (or '') -> button

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
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const hay = haystacks.get(entry);
    return terms.every(t => hay.includes(t));
  }

  function refresh() {
    if (rendered) focused = '';
    rendered = true;
    const shown = entries.filter(matches);
    // The pinned entry goes first (if it matches the current filters).
    const pinned = pinnedEntry(entries);
    if (pinned && shown.includes(pinned)) shown.splice(0, 0, ...shown.splice(shown.indexOf(pinned), 1));
    list.replaceChildren(...shown.map(e => renderNewsItem(e, { detailed: true, pinned: e === pinned })));

    buttons.forEach((btn, key) => {
      const on = key === '' ? !active.size : active.has(key);
      btn.setAttribute('aria-pressed', String(on));
    });
    projectButtons.forEach((btn, id) => {
      const on = id === '' ? !activeProjects.size : activeProjects.has(id);
      btn.setAttribute('aria-pressed', String(on));
    });
    clearBtn.hidden = !query;

    const filtering = active.size > 0 || activeProjects.size > 0 || query.trim() !== '';
    status.textContent = !shown.length
      ? (query.trim() ? 'Nothing matches your search.' : 'Nothing matches those filters.')
      : (filtering ? `Showing ${shown.length} of ${entries.length}` : '');
    writeHash(active, activeProjects, query, focused);
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
  const PROJECTS_VISIBLE = 5;
  const TAGS_VISIBLE = 3;

  // A titled group of filter buttons: an "All" button, then the options. Only
  // the first `visible` options show until "Show more" is pressed (the
  // button only exists when there are more). `noun` is "projects" or "tags".
  function buildFilterGroup(title, noun, visible, allButton, optionButtons, keys, set, panelId) {
    const options = el('div', { class: 'news-filters', attrs: { role: 'group', 'aria-label': 'Filter news by ' + title.toLowerCase() } }, [
      allButton,
      ...optionButtons
    ]);
    const group = el('div', { class: 'news-filter-group' }, [
      el('h3', { class: 'news-filter-group-title', text: title }),
      options
    ]);

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
      group.appendChild(more);
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
        'Project', 'projects', PROJECTS_VISIBLE,
        makeButton('', 'All projects', null, activeProjects, projectButtons, entries.length),
        projects.map(p => makeButton(p.id, p.title, null, activeProjects, projectButtons, projectCount(p.id), p.image)),
        projectIds, activeProjects, panelId
      ));
    }
    if (tagKeys.length > 1) {
      groups.push(buildFilterGroup(
        'Tags', 'tags', TAGS_VISIBLE,
        makeButton('', 'All tags', null, active, buttons, entries.length),
        tagKeys.map(k => { const t = newsTag(k); return makeButton(k, t.label, t, active, buttons, entries.filter(e => (e.tags || []).includes(k)).length); }),
        tagKeys, active, panelId
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

  // Layout: the list, plus a sidebar. The sidebar is two blocks (search/filters,
  // then latest releases and cards) so that on narrow screens the search and filters
  // come first, then the list, then the extras.
  const tools = el('div', { class: 'news-tools' }, [searchBox]);
  if (projects.length || tagKeys.length > 1) {
    tools.appendChild(buildFilterDropdown());
  }

  const extras = [renderLatestReleases(side.latestReleases), ...(side.cards || []).map(renderSideCard)].filter(Boolean);
  const layout = el('div', { class: 'news-layout' + (extras.length ? '' : ' no-extras') }, [
    tools,
    el('div', { class: 'news-feed' }, [status, list]),
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

  // Like the home page cards: "View full update" goes to the entry on the News
  // page and stretches over the whole card (the close button stays above it).
  const page = (SITE_DATA.pages || []).find(p => p.url === 'news');
  const link = page && internalLink('news-link', `${page.url}#entry=${newsEntryId(entry)}`, [
    el('span', { text: 'View full update' }),
    newsArrow()
  ]);

  const close = el('button', { class: 'announce-close', attrs: { type: 'button', 'aria-label': 'Dismiss announcement', 'data-tooltip': 'Dismiss' } });
  // Tags and date run along the top; the icon sits below them beside the text.
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
