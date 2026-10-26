/* Shared by every page: helpers plus the header, footer and project-card
   builders, driven by SITE_DATA (data.js). Section pages opt in via <body data-page="...">. */

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

// Slug for `text` that isn't in `used` yet ("-2", "-3"... if needed); records it.
function uniqueSlug(text, fallback, used) {
  const base = slugify(text) || fallback;
  let slug = base;
  let n = 2;
  while (used.has(slug)) slug = `${base}-${n++}`;
  used.add(slug);
  return slug;
}

// The one place that decides element IDs for a section (heading first, then each
// project), so links, search, notification keys and structured data can't drift apart.
// Returns { headingId, projects: [{ project, id }], byProject }.
const sectionIdCache = new WeakMap();
function sectionIds(section) {
  let ids = sectionIdCache.get(section);
  if (!ids) {
    const used = new Set();
    const headingId = uniqueSlug(section.heading, 'section', used);
    const projects = (section.projects || []).map(project => ({ project, id: uniqueSlug(project.title, 'project', used) }));
    ids = { headingId, projects, byProject: new Map(projects.map(p => [p.project, p.id])) };
    sectionIdCache.set(section, ids);
  }
  return ids;
}

function projectId(section, project) {
  return sectionIds(section).byProject.get(project);
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

function stableChannel(project) {
  const channels = project.channels || [];
  return channels.find(c => (c.channel || '').toLowerCase() === 'stable') || channels[0];
}

// Projects with downloads; link-only projects like "Other Projects" aren't counted.
function countDownloadableProjects() {
  return (SITE_DATA.sections || []).reduce(
    (n, s) => n + (s.projects || []).filter(p => (p.channels || []).length > 0).length, 0);
}

// Fills {projects} in text from data.js / stats.js.
function fillPlaceholders(text) {
  return String(text).replace(/\{projects\}/g, countDownloadableProjects());
}

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const prefersReducedMotion = () => reducedMotionQuery.matches;

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

// Full URL for a project's deep link. Copying it leaves the address bar alone.
function deepLinkUrl(id) {
  return `${location.origin}${location.pathname}#${id}`;
}

/* ---------- Channel row layout ----------
   Channel boxes and download columns stack rather than wrap mid-line. */

/* ---------- Project cards ---------- */

// The project title is itself the button (click copies a direct link). It sits inside
// the <h2>; the hidden text tells screen readers what it does.
function copyLinkButton(id, label) {
  const linkIcon = icon('link', 'icon-sm');
  const btn = el('button', {
    class: 'copy-link-btn',
    attrs: { type: 'button', 'data-tooltip': 'Copy link' }
  }, [
    el('span', { text: label }),
    el('span', { class: 'visually-hidden', text: ' (copy link)' }),
    linkIcon
  ]);

  const setIcon = name => setMask(linkIcon, iconUrl(name));

  const showCopied = () => {
    btn.classList.add('is-copied');
    setIcon('tick');
    btn.setAttribute('data-tooltip', 'Copied!');
    window.clearTimeout(btn._copiedTimer);
    btn._copiedTimer = window.setTimeout(() => {
      btn.classList.remove('is-copied');
      setIcon('link');
      btn.setAttribute('data-tooltip', 'Copy link');
    }, 1500);
  };

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const url = deepLinkUrl(id);

    // Used when the async Clipboard API is missing or rejects.
    const fallbackCopy = () => {
      const temp = document.createElement('textarea');
      temp.value = url;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* copy unsupported */ }
      document.body.removeChild(temp);
      if (ok) showCopied();
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(showCopied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  });

  return btn;
}

function renderBrand(brand) {
  const logo = document.getElementById('brand-logo');
  const src = sitePath(brand.logo);
  if (logo.getAttribute('src') !== src) logo.src = src; // an identical src can restart the request
  logo.alt = '';
  document.getElementById('brand-name').textContent = brand.name;
}

/* ---------- Project notifications ----------
   A download with `notify: true` in data.js gets a dot until its page has been opened since its
   version last changed. Nothing counts as seen on a first visit, so the dots show. The previous
   visit's state is held for the browser session so reloads don't clear them. */

const PROJECTS_SEEN_KEY = 'downloads-seen';
const PROJECTS_BASELINE_KEY = 'downloads-seen-baseline';

// A download counts as new again when its version changes.
const downloadAvailable = d => !!(d && !d.disabled && d.url);
const notifyKey = (projectId, ch, d) => `${projectId}:${(ch.channel || 'stable').toLowerCase()}:${d.label}`;
const notifyFingerprint = d => d.version || 'N/A';

function parseSeenMap(text) {
  try {
    const map = JSON.parse(text);
    return map && typeof map === 'object' && !Array.isArray(map) ? map : null;
  } catch { return null; }
}

// Every available download in a notify channel: { key, fingerprint, section }.
function allNotifyDownloads() {
  const out = [];
  (SITE_DATA.sections || []).forEach(section => {
    sectionIds(section).projects.forEach(({ project, id }) => {
      (project.channels || []).forEach(ch => {
        (ch.downloads || []).filter(d => d.notify && downloadAvailable(d)).forEach(d =>
          out.push({ key: notifyKey(id, ch, d), fingerprint: notifyFingerprint(d), section: section.heading }));
      });
    });
  });
  return out;
}

let projectsBaselineCache; // map of seen fingerprints as of this visit (empty if nothing seen yet)

function projectsBaseline() {
  if (projectsBaselineCache !== undefined) return projectsBaselineCache;
  let map = null;
  try { map = parseSeenMap(sessionStorage.getItem(PROJECTS_BASELINE_KEY)); } catch { /* session storage unavailable */ }
  if (!map) {
    map = parseSeenMap(storageGet(PROJECTS_SEEN_KEY));
    if (map) { try { sessionStorage.setItem(PROJECTS_BASELINE_KEY, JSON.stringify(map)); } catch { /* ignore */ } }
  }
  projectsBaselineCache = map || {};
  return projectsBaselineCache;
}

// Dot on a download: new since this visit began (survives reloads in the session).
function isNotifyDownload(projectId, ch, d) {
  const seen = projectsBaseline();
  return !!(d.notify && downloadAvailable(d) && seen[notifyKey(projectId, ch, d)] !== notifyFingerprint(d));
}

// Navigation counts: one per channel with an unseen download, cleared on the next page load
// once the project page has been opened.
function isUnseenChannel(projectId, ch) {
  const seen = parseSeenMap(storageGet(PROJECTS_SEEN_KEY)) || {};
  return !!((ch.downloads || []).some(d =>
    d.notify && downloadAvailable(d) && seen[notifyKey(projectId, ch, d)] !== notifyFingerprint(d)));
}

// Opening a project page counts as seeing everything on it.
function markProjectsSeen(section) {
  projectsBaseline(); // fix this visit's baseline before the saved map changes
  const seen = parseSeenMap(storageGet(PROJECTS_SEEN_KEY)) || {};
  allNotifyDownloads().filter(c => c.section === section.heading).forEach(c => { seen[c.key] = c.fingerprint; });
  storageSet(PROJECTS_SEEN_KEY, JSON.stringify(seen));
}

function projectDot() {
  const text = 'New since your last visit';
  return el('span', { class: 'news-new-dot', attrs: { 'data-tooltip': text, role: 'img', 'aria-label': text } });
}

const HOST_LABELS = { 'modrinth.com': 'Modrinth', 'www.spigotmc.org': 'SpigotMC', 'spigotmc.org': 'SpigotMC', 'github.com': 'GitHub' };

function hostLabel(url) {
  try { return HOST_LABELS[new URL(url).hostname] || ''; } catch { return ''; }
}

// A download's release date: its own `date` (ISO), else the matching entry in
// latest-updates.js. Returns '' when neither has one, and the cell shows a placeholder.
function releaseDate(project, d) {
  // Must be a quoted "YYYY-MM-DD" string. An unquoted 2026-09-15 is arithmetic (= 2002) in JavaScript,
  // so anything else is ignored with a console warning instead of showing a wrong year.
  if (d.date !== undefined && !(typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date))) {
    console.warn(`data.js: ignoring date ${JSON.stringify(d.date)} on ${project.title} ${d.version || ''}; use a quoted "YYYY-MM-DD" string.`);
  } else if (d.date) {
    return d.date;
  }
  const list = typeof LATEST_UPDATES !== 'undefined' && LATEST_UPDATES.sidebar
    && LATEST_UPDATES.sidebar.latestReleases && LATEST_UPDATES.sidebar.latestReleases.releases;
  const hit = (list || []).find(r => r.project === project.title && r.version === d.version);
  return hit ? hit.date : '';
}

function formatDate(iso) {
  const date = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// Table columns: every download type used by any channel, in first-seen order.
function tableColumns(channels) {
  const columns = [];
  channels.forEach(ch => (ch.downloads || []).forEach(d => {
    if (!columns.some(c => c.label === d.label)) columns.push({ label: d.label, icon: d.icon || 'box' });
  }));
  return columns;
}

function unavailableCell(d) {
  const tip = d && d.tooltip;
  const attrs = tip ? { 'data-tooltip': tip, tabindex: '0', 'aria-label': `Not available: ${tip}` } : {};
  const box = el('div', { class: 'download-unavailable' + (tip ? ' has-tooltip' : ''), attrs }, [
    icon('unavailable', 'icon-sm'),
    el('span', { text: 'Not available' })
  ]);

  // Touch has no hover, so a tap shows the tooltip briefly.
  if (tip) {
    box.addEventListener('click', () => {
      box.classList.add('tooltip-open');
      window.clearTimeout(box._tooltipTimer);
      box._tooltipTimer = window.setTimeout(() => box.classList.remove('tooltip-open'), 3000);
    });
  }
  return box;
}

// Channel title shared by the column header and the narrow layout's cell label.
function channelTitle(ch, cls) {
  return el('span', { class: cls }, [
    el('span', { class: 'rt-channel' }, [
      el('span', { class: 'status-dot' }),
      el('span', { class: 'channel-label', text: ch.label })
    ]),
    ch.mcVersion ? el('span', { class: 'rt-java', text: 'Java ' + ch.mcVersion }) : null
  ]);
}

// Releases under a month old show a relative date with the full date as a tooltip.
function releaseDateNode(iso) {
  const full = formatDate(iso);
  const relative = relativeNewsDate(iso);
  return el('span', { class: 'rt-date' + (relative ? ' has-tooltip' : ''), attrs: relative ? { 'data-tooltip': full } : {} }, [
    icon('calendar', 'icon-sm'),
    el('time', { text: relative || full, attrs: { datetime: iso } })
  ]);
}

function renderCell(project, ch, column, d, notifiedSet) {
  const channel = (ch.channel || 'stable').toLowerCase();
  const label = channelTitle(ch, 'rt-cell-label');

  const available = d && !d.disabled && d.url;
  if (!available) {
    return el('div', { class: 'rt-cell is-unavailable', attrs: { role: 'cell', 'data-channel': channel } }, [label, unavailableCell(d)]);
  }

  const iso = releaseDate(project, d);
  const date = iso
    ? releaseDateNode(iso)
    // PLACEHOLDER: no release date in the data yet. Add `date: "YYYY-MM-DD"` to the download in data.js.
    : el('span', { class: 'rt-date is-placeholder', attrs: { 'data-placeholder': 'release-date' } }, [
        icon('calendar', 'icon-sm'),
        el('span', { text: 'Date TBC' })
      ]);

  const host = hostLabel(d.url);
  const action = host ? `View on ${host}` : 'View';
  const button = el('a', {
    class: 'download-btn',
    href: d.url,
    attrs: { 'aria-label': `${action}: ${project.title} ${column.label} ${d.version || ''}, ${ch.label}`.replace(/\s+/g, ' ') }
  }, [
    el('span', { text: action }),
    icon('newtab', 'icon-sm')
  ]);

  return el('div', { class: 'rt-cell', attrs: { role: 'cell', 'data-channel': channel } }, [
    label,
    el('div', { class: 'rt-meta' }, [
      el('span', { class: 'rt-version' }, [
        el('span', { class: 'pill', text: d.version || 'N/A' }),
        notifiedSet.has(d) ? projectDot() : null
      ]),
      date
    ]),
    button
  ]);
}

// One row per download type; one cell per channel.
function renderTypeRow(project, column, channels, notifiedSet) {
  const head = el('div', { class: 'rt-rowhead', attrs: { role: 'rowheader' } }, [
    icon(column.icon, 'icon-sm'),
    el('span', { text: column.label })
  ]);
  const cells = channels.map(ch => renderCell(project, ch, column, (ch.downloads || []).find(d => d.label === column.label), notifiedSet));
  return el('div', { class: 'rt-row', attrs: { role: 'row' } }, [head, ...cells]);
}

function renderReleaseTable(project, columns, sideNote, notifiedSet) {
  const channels = project.channels || [];

  const headRow = el('div', { class: 'rt-row rt-head', attrs: { role: 'row' } }, [
    el('span', { class: 'rt-colhead', attrs: { role: 'columnheader' } }, [el('span', { class: 'visually-hidden', text: 'Download' })]),
    ...channels.map(ch => {
      const colhead = channelTitle(ch, 'rt-colhead');
      colhead.setAttribute('role', 'columnheader');
      colhead.setAttribute('data-channel', (ch.channel || 'stable').toLowerCase());
      return colhead;
    })
  ]);

  const table = el('div', {
    class: 'release-table',
    attrs: { role: 'table', 'aria-label': `${project.title} releases`, 'data-cols': String(channels.length) }
  }, [headRow, ...columns.map(column => renderTypeRow(project, column, channels, notifiedSet))]);

  // A one-channel table is narrow, so its note sits beside it (and wraps below when there is no room).
  return el('div', { class: 'rt' + (sideNote ? ' rt-with-note' : '') }, [table, sideNote]);
}

function renderProjectNote(p) {
  if (!p.note) return null;
  return el('div', { class: 'project-note', attrs: { role: 'note' } }, [
    icon('info', 'icon-sm'),
    el('p', { text: p.note })
  ]);
}

// Footer strip: icon links to the project's pages, then "Older versions" on the right.
function renderProjectFooter(p) {
  const findLink = name => (p.links || []).find(l => (l.label || '').toLowerCase() === name);
  const modrinth = findLink('modrinth');
  const github = findLink('github');
  const older = (p.channels || []).length
    ? (modrinth ? `${modrinth.url}/versions` : github ? `${github.url}/wiki/Versions` : '')
    : '';
  if (!(p.links || []).length && !older) return null;

  return el('footer', { class: 'project-footer' }, [
    el('ul', { class: 'project-links' }, (p.links || []).map(l =>
      el('li', {}, [el('a', { class: 'project-link', href: l.url }, [icon(l.icon, 'icon-sm'), el('span', { text: l.label })])])
    )),
    older ? el('a', { class: 'project-older', href: older }, [icon('history', 'icon-sm'), el('span', { text: 'Older versions' })]) : null
  ]);
}

function renderProject(p, id) {
  const channels = p.channels || [];
  const columns = tableColumns(channels);

  const notified = new Set();
  channels.forEach(ch => (ch.downloads || []).forEach(d => { if (isNotifyDownload(id, ch, d)) notified.add(d); }));

  const body = [];
  const note = renderProjectNote(p);
  const noteBeside = channels.length === 1 && note;
  if (channels.length) body.push(renderReleaseTable(p, columns, noteBeside ? note : null, notified));
  if (note && !noteBeside) body.push(note);

  return el('article', { class: 'project', attrs: { id } }, [
    el('header', { class: 'project-header' }, [
      el('img', { class: 'project-image', src: p.image, alt: p.imageAlt || '', attrs: { loading: 'lazy', width: '320', height: '320' } }),
      el('div', { class: 'project-info' }, [
        el('h2', {}, [copyLinkButton(id, p.title)]),
        el('p', { class: 'project-description', text: p.description })
      ])
    ]),
    body.length ? el('div', { class: 'project-body' }, body) : null,
    renderProjectFooter(p)
  ]);
}

/* ---------- Header ---------- */

// Unseen `notify` channels on a page's projects.
function countUnseenNotifications(page) {
  const section = (SITE_DATA.sections || []).find(s => s.heading === page.section);
  if (!section) return 0;

  let count = 0;
  sectionIds(section).projects.forEach(({ project, id }) => {
    (project.channels || []).forEach(ch => {
      if (isUnseenChannel(id, ch)) count++;
    });
  });
  return count;
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
  const seen = newsBaseline();
  return !!seen && !seen.has(newsEntryId(entry));
}

// Everything listed on the News page counts as seen from the next visit on.
function markNewsSeen(entries) {
  newsBaseline(); // fix this visit's baseline before the saved list changes
  storageSet(NEWS_SEEN_KEY, JSON.stringify(entries.map(newsEntryId)));
}

// Entries not yet listed on the News page by this browser; 0 until it has opened News once.
function countUnseenNews() {
  const seen = parseIdList(storageGet(NEWS_SEEN_KEY));
  if (!seen) return 0;
  const known = new Set(seen);
  return newsEntries().filter(e => !known.has(newsEntryId(e))).length;
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
  const projectPages = pages.filter(p => p.section);

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

/* ---------- Section page & footer ---------- */

const NOTICE_KEY = 'notice-dismissed';
const NOTICE_RETURN_DAYS = 45;

// True while this exact notice was dismissed less than NOTICE_RETURN_DAYS ago;
// anything unreadable counts as not dismissed.
function noticeDismissed(text) {
  try {
    const saved = JSON.parse(storageGet(NOTICE_KEY));
    const age = Date.now() - saved.at;
    return saved.text === text && age >= 0 && age < NOTICE_RETURN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// Sections like "Other Projects" only link out, so they get no download notice.
function sectionHasDownloads(section) {
  return (section.projects || []).some(p => (p.channels || []).length > 0);
}

function renderFlatSection(section) {
  const main = document.getElementById('catalog');
  if (!main || !section) return;

  const ids = sectionIds(section);
  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: ids.headingId } }, [
    el('span', { text: section.heading }),
    el('span', { class: 'section-count', text: String((section.projects || []).length) })
  ]));

  const noticeText = SITE_DATA.downloadNotice;
  if (noticeText && sectionHasDownloads(section) && !noticeDismissed(noticeText)) {
    const close = el('button', { class: 'notice-close', attrs: { type: 'button', 'aria-label': 'Dismiss notice', 'data-tooltip': 'Dismiss' } }, [el('span', { class: 'close-glyph', attrs: { 'aria-hidden': 'true' } })]);
    const notice = el('div', { class: 'download-notice', attrs: { role: 'note' } }, [
      icon('info', 'icon-sm'),
      el('p', { text: noticeText }),
      close
    ]);
    close.addEventListener('click', () => {
      storageSet(NOTICE_KEY, JSON.stringify({ text: noticeText, at: Date.now() }));
      notice.remove();
    });
    main.appendChild(notice);
  }

  const list = el('div', { class: 'project-list' }, ids.projects.map(({ project, id }) => renderProject(project, id)));
  const jump = renderProjectJump(ids.projects);
  main.appendChild(el('div', { class: 'catalog-layout' }, [jump, list]));
}

// Side panel with a link to each project on the page. Reuses the news page's collapsible panel.
function renderProjectJump(projects) {
  if (projects.length < 2) return null;

  const KEY = 'catalog-jump-collapsed';
  const stored = storageGet(KEY);
  let open = stored === null ? window.matchMedia('(min-width: 1100px)').matches : stored !== '1';

  const listId = 'project-jump-list';
  const items = projects.map(({ project, id }) => el('li', {}, [
    (() => {
      const link = internalLink('jump-link', '#' + id, [
        el('img', { src: project.image, alt: '', attrs: { loading: 'lazy', width: '48', height: '48' } }),
        el('span', { text: project.title })
      ]);
      return link;
    })()
  ]));
  const body = el('div', { class: 'news-filter-panel', attrs: { id: listId } }, [el('ul', { class: 'jump-list' }, items)]);
  const toggle = el('button', { class: 'news-filter-toggle', attrs: { type: 'button', 'aria-controls': listId } }, [
    el('span', { class: 'news-filter-toggle-label', text: 'Jump to project' }),
    el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
  ]);
  const box = el('section', { class: 'news-filter-box' }, [toggle, body]);

  const apply = () => {
    toggle.setAttribute('aria-expanded', String(open));
    body.hidden = !open;
    box.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => {
    open = !open;
    apply();
    storageSet(KEY, open ? '0' : '1');
  });
  apply();

  return el('aside', { class: 'catalog-aside', attrs: { 'aria-label': 'Projects on this page' } }, [box]);
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

// Scrolls to the #id in the URL and briefly highlights it if it's a project.
function handleDeepLink() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target) return;

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'auto', block: 'start' });

    if (target.classList.contains('project')) {
      target.classList.add('is-linked-target');
      target.addEventListener('animationend', () => target.classList.remove('is-linked-target'), { once: true });
    }
  });
}

// Adds JSON-LD: Organization, WebSite and the downloadable projects (link-only
// entries are skipped). Pass a section for just its projects, or null for all.
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

  const pages = data.pages || [];
  const sections = section ? [section] : (data.sections || []);
  const items = [];

  sections.forEach(sec => {
    const page = pages.find(p => p.section === sec.heading);

    sectionIds(sec).projects.forEach(({ project, id }) => {
      if (!(project.channels || []).length) return;

      const stable = stableChannel(project);
      const firstDownload = stable && (stable.downloads || []).find(d => d.url && !d.disabled);

      const item = {
        '@type': 'SoftwareApplication',
        name: project.title,
        description: project.description,
        image: toAbsolute(project.image),
        url: page ? toAbsolute(`${sitePath(page.url)}#${id}`) : siteUrl,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Minecraft: Java Edition',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
        publisher: { '@id': organization['@id'] }
      };
      const external = (project.links || []).map(l => l.url).filter(Boolean);
      if (external.length) item.sameAs = external;
      if (firstDownload && firstDownload.version) item.softwareVersion = firstDownload.version;
      if (firstDownload) item.downloadUrl = firstDownload.url;
      items.push(item);
    });
  });

  const graph = [organization, website];
  if (items.length) {
    graph.push({
      '@type': 'ItemList',
      name: `${siteName} ${section ? section.heading : 'Projects'}`,
      itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, item }))
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

/* ---------- Entry point ---------- */

function initSectionPage(pageUrl) {
  renderBrand(SITE_DATA.brand);

  const pages = SITE_DATA.pages || [];
  renderSiteHeader(pages, pageUrl);

  const pageEntry = pages.find(p => p.url === pageUrl);
  const section = (SITE_DATA.sections || []).find(s => s.heading === (pageEntry && pageEntry.section)) || SITE_DATA.sections[0];

  renderFlatSection(section);
  markProjectsSeen(section);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderStructuredData(SITE_DATA, section);
  clearSkeletons();
  initBackToTop();
  handleDeepLink();
  window.addEventListener('hashchange', handleDeepLink);
}

if (document.body.dataset.page) initSectionPage(document.body.dataset.page);

// Service worker (sw.js): installable site, offline page shell.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
