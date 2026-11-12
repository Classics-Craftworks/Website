/* Catalogue feature: project pages (cards, release tables, sort, jump list, download notice), the "new
   download" dots, header search over projects, and the project data other pages use (news links, JSON-LD).
   A site opts in with `features: ['catalog']` in site.config.js and describes its projects in
   SITE_DATA.sections. Section pages opt in via <body data-page="...">.

   Loads after shell.js and plugs into it through SITE_HOOKS (see the registrations at the end). */

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

function stableChannel(project) {
  const channels = project.channels || [];
  return channels.find(c => (c.channel || '').toLowerCase() === 'stable') || channels[0];
}

// Projects with downloads; link-only projects like "Other Projects" aren't counted.
function countDownloadableProjects() {
  return (SITE_DATA.sections || []).reduce(
    (n, s) => n + (s.projects || []).filter(p => (p.channels || []).length > 0).length, 0);
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

/* ---------- Project notifications ----------
   A download with `notify: true` in data.js gets a dot until its page is opened after its version changes.
   On a first visit everything counts as seen. The previous visit's state is held for the session so reloads
   don't clear the dots. */

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
    if (!map) {
      // First visit: everything currently published counts as seen, so only later releases get a dot.
      map = {};
      allNotifyDownloads().forEach(c => { map[c.key] = c.fingerprint; });
      storageSet(PROJECTS_SEEN_KEY, JSON.stringify(map));
    }
    if (map) { try { sessionStorage.setItem(PROJECTS_BASELINE_KEY, JSON.stringify(map)); } catch { /* ignore */ } }
  }
  projectsBaselineCache = map || {};
  return projectsBaselineCache;
}

// Dot on a download: new since this visit began (survives reloads in the session).
// Dots can be switched off in Settings; what has been seen is still tracked, so switching them
// back on shows only what is really unread.
function isNotifyDownload(projectId, ch, d) {
  if (!newDotsEnabled()) return false;
  const seen = projectsBaseline();
  return !!(d.notify && downloadAvailable(d) && seen[notifyKey(projectId, ch, d)] !== notifyFingerprint(d));
}

// Navigation counts: one per channel with an unseen download, cleared on the next page load
// once the project page has been opened.
function channelHasUnseen(projectId, ch) {
  projectsBaseline(); // seeds the saved map on a first visit
  const seen = parseSeenMap(storageGet(PROJECTS_SEEN_KEY)) || projectsBaseline();
  return !!((ch.downloads || []).some(d =>
    d.notify && downloadAvailable(d) && seen[notifyKey(projectId, ch, d)] !== notifyFingerprint(d)));
}
const isUnseenChannel = (projectId, ch) => newDotsEnabled() && channelHasUnseen(projectId, ch);

// Opening a project page counts as seeing everything on it.
function markProjectsSeen(section) {
  projectsBaseline(); // fix this visit's baseline before the saved map changes
  const seen = parseSeenMap(storageGet(PROJECTS_SEEN_KEY)) || {};
  allNotifyDownloads().filter(c => c.section === section.heading).forEach(c => { seen[c.key] = c.fingerprint; });
  storageSet(PROJECTS_SEEN_KEY, JSON.stringify(seen));
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

// Releases under a month old show a relative date with the full date as a tooltip
// (older ones use the visitor's date format from Settings).
function releaseDateNode(iso) {
  const full = displayDate(iso, 'medium');
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
    icon('newtab', 'icon-sm newtab-icon')
  ]);

  return el('div', { class: 'rt-cell', attrs: { role: 'cell', 'data-channel': channel } }, [
    label,
    el('div', { class: 'rt-meta' }, [
      el('span', { class: 'rt-version' }, [
        el('span', { class: 'pill', text: d.version || 'N/A' }),
        notifiedSet.has(d) ? newDot() : null
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
  initProjectSort(section, ids.projects, list, jump);
  main.appendChild(el('div', { class: 'catalog-layout' }, [jump, list]));
}

/* ---------- Project sorting ----------
   A Sort menu (and, where archived projects exist, a "Hide archived" switch) above the cards. Both choices are
   remembered per page; sort options that couldn't change the order on a page are left out. */

const PROJECT_SORT_KEY = 'project-sort:'; // + page slug
const PROJECT_HIDE_KEY = 'project-hide-archived:'; // + page slug

// Newest release date (ISO) across a project's available downloads; '' if it has none.
function projectUpdated(p) {
  let latest = '';
  (p.channels || []).forEach(ch => (ch.downloads || []).forEach(d => {
    const iso = downloadAvailable(d) ? releaseDate(p, d) : '';
    if (iso > latest) latest = iso;
  }));
  return latest;
}

// A project's optional `created` date ("YYYY-MM-DD"); '' if missing or invalid.
function projectCreated(p) {
  if (p.created === undefined) return '';
  if (typeof p.created === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.created)) return p.created;
  console.warn(`data.js: ignoring created ${JSON.stringify(p.created)} on ${p.title}; use a quoted "YYYY-MM-DD" string.`);
  return '';
}

// Every release channel is "unsupported".
function projectArchived(p) {
  const channels = p.channels || [];
  return channels.length > 0 && channels.every(ch => (ch.channel || '').toLowerCase() === 'unsupported');
}

// Sort options that apply to these projects: [{ key, label, compare }]. Ties keep the default order.
function projectSortOptions(projects) {
  const meta = new Map(projects.map(({ project }) => [project, {
    updated: projectUpdated(project), created: projectCreated(project), archived: projectArchived(project)
  }]));
  const count = field => projects.filter(({ project }) => meta.get(project)[field]).length;
  const get = (e, field) => meta.get(e.project)[field];

  const byTitle = sign => (a, b) => sign * a.project.title.localeCompare(b.project.title, 'en-GB', { numeric: true, sensitivity: 'base' });
  // Undated projects always last.
  const byDate = (field, newestFirst) => (a, b) => {
    const x = get(a, field), y = get(b, field);
    if (x === y) return 0;
    if (!x) return 1;
    if (!y) return -1;
    return (x < y) === newestFirst ? 1 : -1;
  };
  const archivedCount = projects.filter(({ project }) => meta.get(project).archived).length;

  return [
    { key: 'default', label: 'Default', compare: () => 0 },
    { key: 'az', label: 'Alphabetical (A–Z)', compare: byTitle(1) },
    { key: 'za', label: 'Alphabetical (Z–A)', compare: byTitle(-1) },
    count('updated') > 1 && { key: 'updated', label: 'Latest update', compare: byDate('updated', true) },
    count('created') > 1 && { key: 'newest', label: 'Newest first', compare: byDate('created', true) },
    count('created') > 1 && { key: 'oldest', label: 'Oldest first', compare: byDate('created', false) },
    archivedCount > 0 && archivedCount < projects.length && {
      key: 'active', label: 'Active first',
      compare: (a, b) => Number(get(a, 'archived')) - Number(get(b, 'archived'))
    }
  ].filter(Boolean);
}

// Adds the sort control and "Hide archived" switch to a project list; `jump` is the jump aside (or null).
function initProjectSort(section, entries, list, jump) {
  if (entries.length < 2) return;
  const options = projectSortOptions(entries);
  const pageSlug = slugify(section.heading);
  const sortKey = PROJECT_SORT_KEY + pageSlug;
  const hideKey = PROJECT_HIDE_KEY + pageSlug;
  const saved = storageGet(sortKey);
  let current = options.some(o => o.key === saved) ? saved : 'default';

  const archivedIds = new Set(entries.filter(e => projectArchived(e.project)).map(e => e.id));
  const canHide = archivedIds.size > 0 && archivedIds.size < entries.length;
  let hidden = canHide && storageGet(hideKey) === '1';

  const cards = new Map(entries.map(e => [e.id, list.querySelector(':scope > .project[id="' + CSS.escape(e.id) + '"]')]));
  const jumpList = jump && jump.querySelector('.jump-list');
  const jumpItems = new Map(jumpList ? [...jumpList.children].map(li => [li.querySelector('a').getAttribute('href').slice(1), li]) : []);
  const status = el('p', { class: 'visually-hidden', attrs: { role: 'status' } });
  const count = el('p', { class: 'news-count project-count', attrs: { 'aria-hidden': 'true' } });

  function apply() {
    const option = options.find(o => o.key === current) || options[0];
    const ordered = entries.map((e, index) => ({ ...e, index }))
      .sort((a, b) => option.compare(a, b) || a.index - b.index);
    ordered.forEach(({ id }) => {
      if (cards.get(id)) list.appendChild(cards.get(id));
      if (jumpItems.get(id)) jumpList.appendChild(jumpItems.get(id));
    });
    entries.forEach(({ id }) => {
      const hide = hidden && archivedIds.has(id);
      if (cards.get(id)) cards.get(id).hidden = hide;
      if (jumpItems.get(id)) jumpItems.get(id).hidden = hide;
    });
    const shown = entries.length - (hidden ? archivedIds.size : 0);
    count.replaceChildren('Showing ', el('strong', { text: `${shown} of ${entries.length}` }), ` ${entries.length === 1 ? 'project' : 'projects'}`);
    status.textContent = `Sorted by ${option.label}` + (hidden ? `. ${archivedIds.size} archived hidden` : '');
  }

  const controls = [];
  let hideInput = null;
  if (canHide) {
    hideInput = el('input', { attrs: { type: 'checkbox', role: 'switch', id: 'project-hide-archived' } });
    hideInput.checked = hidden;
    hideInput.addEventListener('change', () => {
      hidden = hideInput.checked;
      storageSet(hideKey, hidden ? '1' : '0');
      apply();
    });
    controls.push(el('label', { class: 'project-hide-toggle', attrs: { for: 'project-hide-archived' } }, [
      el('span', { class: 'news-sort-label', text: 'Hide archived' }),
      el('span', { class: 'switch' }, [hideInput, el('span', { class: 'switch-track', attrs: { 'aria-hidden': 'true' } })])
    ]));
  }
  const sorter = buildSortDropdown({
    options, current, label: 'Sort projects', menuId: 'project-sort-menu',
    onChange: key => { current = key; storageSet(sortKey, key); apply(); }
  });
  controls.push(sorter.node);

  list.prepend(el('div', { class: 'news-toolbar project-toolbar' }, [count, ...controls, status]));

  // A link to a hidden project shows it.
  const revealLinked = () => {
    const id = decodeURIComponent(location.hash.slice(1));
    if (hidden && archivedIds.has(id)) { hidden = false; hideInput.checked = false; apply(); }
  };
  revealLinked();
  window.addEventListener('hashchange', revealLinked);
  apply();
}

// Side panel with a link to each project on the page. Reuses the news page's collapsible panel.
function renderProjectJump(projects) {
  if (projects.length < 2) return null;

  const KEY = 'catalog-jump-collapsed';
  // Desktop (side panel): open unless the visitor collapsed it. Mobile (stacked above the list): always starts collapsed.
  const desktop = window.matchMedia('(min-width: 1100px)').matches;
  const stored = storageGet(KEY);
  let open = desktop && stored !== '1';

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
    if (desktop) storageSet(KEY, open ? '0' : '1');
  });
  apply();

  return el('aside', { class: 'catalog-aside', attrs: { 'aria-label': 'Projects on this page' } }, [box]);
}

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

/* ---------- Plugging into the shell ---------- */

// Unseen `notify` channels on a nav page's projects.
function catalogUnseenForPage(page) {
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

// Unseen channels across the whole site, whether or not dots are switched on.
function catalogUnseenTotal() {
  let downloads = 0;
  (SITE_DATA.sections || []).forEach(section => {
    sectionIds(section).projects.forEach(({ project, id }) => {
      (project.channels || []).forEach(ch => { if (channelHasUnseen(id, ch)) downloads++; });
    });
  });
  return downloads;
}

// Everything published so far counts as seen, now and for the rest of this browser session.
function catalogMarkAllSeen() {
  const projects = parseSeenMap(storageGet(PROJECTS_SEEN_KEY)) || {};
  allNotifyDownloads().forEach(c => { projects[c.key] = c.fingerprint; });
  storageSet(PROJECTS_SEEN_KEY, JSON.stringify(projects));
  try { sessionStorage.setItem(PROJECTS_BASELINE_KEY, JSON.stringify(projects)); } catch { /* ignore */ }
  projectsBaselineCache = projects;
}

// The icon of the project a news entry's same-site `url` points at (/page#project-id).
function catalogAnnounceImage(path, id) {
  const page = (SITE_DATA.pages || []).find(p => p.url === path && p.section);
  const section = page && (SITE_DATA.sections || []).find(s => s.heading === page.section);
  const match = section && sectionIds(section).projects.find(p => p.id === id);
  return match ? match.project.image || null : null;
}

// Every project on the site, in site order (news filters and release rows).
function catalogProjects() {
  return (SITE_DATA.sections || []).flatMap(section =>
    sectionIds(section).projects.map(({ id, project }) => ({
      id,
      title: project.title,
      image: project.image || null,
      modrinth: ((project.links || []).find(l => l.label === 'Modrinth') || {}).url || null
    })));
}

// JSON-LD: the downloadable projects (link-only entries are skipped), for one section or all of them.
function catalogStructuredData(section, { toAbsolute, siteUrl, publisherId }) {
  const pages = SITE_DATA.pages || [];
  const sections = section ? [section] : (SITE_DATA.sections || []);
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
        publisher: { '@id': publisherId }
      };
      const external = (project.links || []).map(l => l.url).filter(Boolean);
      if (external.length) item.sameAs = external;
      if (firstDownload && firstDownload.version) item.softwareVersion = firstDownload.version;
      if (firstDownload) item.downloadUrl = firstDownload.url;
      items.push(item);
    });
  });

  return { items, label: section ? section.heading : 'Projects' };
}

SITE_HOOKS.placeholders.projects = countDownloadableProjects;
SITE_HOOKS.deepLinkHighlight.push('.project');
SITE_HOOKS.unread.push({ pageCount: catalogUnseenForPage, total: catalogUnseenTotal, markAllSeen: catalogMarkAllSeen });
SITE_HOOKS.announceImage.push(catalogAnnounceImage);
SITE_HOOKS.projects = catalogProjects;
SITE_HOOKS.structuredData = catalogStructuredData;

if (document.body.dataset.page) initSectionPage(document.body.dataset.page);
