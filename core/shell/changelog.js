/* Changelog page: renders CHANGELOG_DATA, which the build generates from the site's CHANGELOG.md
   (changelog-data.js; edit the markdown, not the data). Newest release first (or oldest, from the sort menu), ten at
   a time, filterable by month and release type with the same filter box as the News page.
   Each release has an address (/changelog#v1.2.3) that opens the page at that release. */

const CHANGELOG_PAGE_SIZE = 10; // releases shown first and added per "Show more" click

// `code`, **bold** and [label](url) marks in an item's text. Anything else is plain text.
const CHANGELOG_INLINE = /`([^`]+)`|\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

function changelogInline(text) {
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const m of text.matchAll(CHANGELOG_INLINE)) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    if (m[1] !== undefined) frag.appendChild(el('code', { class: 'about-code', text: m[1] }));
    else if (m[2] !== undefined) frag.appendChild(el('strong', { text: m[2] }));
    else frag.appendChild(isSafeUrl(m[4]) ? aboutLink(m[3], m[4]) : document.createTextNode(m[3]));
    last = m.index + m[0].length;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  return frag;
}

function changelogList(items) {
  return el('ul', { class: 'about-list changelog-list' }, items.map(item => {
    const li = el('li', {}, [changelogInline(item.text)]);
    if (item.items && item.items.length) li.appendChild(changelogList(item.items));
    return li;
  }));
}

function changelogGroup(group) {
  return el('section', { class: 'changelog-group' }, [
    el('h3', { class: 'changelog-group-head', text: group.title }),
    changelogList(group.items)
  ]);
}

// "v4.13.1" -> "v4.13.1", usable as an element id and in the address bar.
const changelogId = version => version;

function changelogDate(iso) {
  const node = newsDate({ date: iso });
  node.dataset.date = iso;
  return node;
}

function changelogRelease(release, isLatest) {
  const id = changelogId(release.version);
  const meta = el('div', { class: 'news-meta changelog-meta' }, [
    el('h2', { class: 'changelog-version' }, [
      el('a', { class: 'changelog-anchor', attrs: { href: '#' + id, 'aria-label': `Link to ${release.version}` }, text: release.version })
    ])
  ]);
  if (isLatest) {
    const latest = el('span', { class: 'news-tag', text: 'Latest' });
    meta.appendChild(latest);
  }
  // The same date as the News page: the visitor's chosen format, or "3 days ago" when relative dates are on.
  if (release.date) meta.appendChild(changelogDate(release.date));
  const note = release.note ? el('p', { class: 'about-text changelog-note' }, [changelogInline(release.note)]) : null;
  return el('article', { class: 'changelog-release', attrs: { id } }, [meta, note, ...release.groups.map(changelogGroup)]);
}

// What kind of release a version is, from its number:
//   hotfix  v1.0.0.X  (a fourth number)      patch  v1.0.X
//   minor update  v1.X.0                      major update  vX.0.0
const CHANGELOG_TYPES = [
  { key: 'hotfix', label: 'Hotfix', hint: 'v1.0.0.X' },
  { key: 'patch', label: 'Patch', hint: 'v1.0.X' },
  { key: 'minor', label: 'Minor update', hint: 'v1.X.0' },
  { key: 'major', label: 'Major update', hint: 'vX.0.0' }
];

function changelogType(version) {
  const [, minor, patch, hotfix] = version.replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
  if (hotfix > 0) return 'hotfix';
  if (patch > 0) return 'patch';
  if (minor > 0) return 'minor';
  return 'major';
}

// "2026-11-13" -> "2026-11": the key releases are filtered by.
const changelogMonth = release => (release.date || '').slice(0, 7);

// Filters and sort live in the URL hash so a view can be linked to, as on the News page:
//   #months=2026-10&types=hotfix,patch&sort=oldest
// A hash without an "=" is a link to one release (#v4.13.1) and is read by focusHash() instead.
function readChangelogHash(validMonths, validTypes) {
  const raw = location.hash.slice(1);
  const params = new URLSearchParams(raw.includes('=') ? raw : '');
  const pick = (name, valid) => new Set((params.get(name) || '').split(',').filter(k => valid.includes(k)));
  return {
    months: pick('months', validMonths),
    types: pick('types', validTypes),
    sort: params.get('sort') === 'oldest' ? 'oldest' : 'newest'
  };
}

function writeChangelogHash(activeMonths, activeTypes, sort) {
  const params = new URLSearchParams();
  if (activeMonths.size) params.set('months', [...activeMonths].join(','));
  if (activeTypes.size) params.set('types', [...activeTypes].join(','));
  if (sort === 'oldest') params.set('sort', 'oldest');
  const text = params.toString();
  // With nothing selected, leave a link to a release (#v4.13.1) alone.
  if (!text && !location.hash.includes('=')) return;
  history.replaceState(null, '', location.pathname + location.search + (text ? '#' + text : ''));
}

function renderChangelogPage() {
  const main = document.getElementById('changelog-page');
  if (!main || typeof CHANGELOG_DATA === 'undefined') return;
  const cfg = SITE_DATA.changelog || {};
  const releases = CHANGELOG_DATA; // newest first, as written in CHANGELOG.md

  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: 'changelog-heading' } }, [
    el('span', { text: cfg.heading || 'Changelog' })
  ]));
  main.appendChild(el('p', { class: 'news-intro', text: cfg.intro || 'Every change to this website.' }));

  if (!releases.length) {
    main.appendChild(el('p', { class: 'news-empty', text: 'Nothing here yet. Check back soon!' }));
    return;
  }

  const typeOf = new Map(releases.map(r => [r, changelogType(r.version)]));
  const monthKeys = [...new Set(releases.map(changelogMonth).filter(Boolean))].sort().reverse(); // newest first
  const types = CHANGELOG_TYPES.filter(t => releases.some(r => typeOf.get(r) === t.key));
  const initial = readChangelogHash(monthKeys, types.map(t => t.key));
  // Active filter sets; an empty set means "all".
  const activeMonths = initial.months;
  const activeTypes = initial.types;
  let sort = initial.sort; // 'newest' | 'oldest'

  const list = el('div', { class: 'changelog-releases' });
  const status = el('p', { class: 'news-status', attrs: { 'aria-live': 'polite' } });
  const more = el('button', { class: 'news-show-more', attrs: { type: 'button' } });
  const countText = el('p', { class: 'news-count', attrs: { 'aria-live': 'polite' } });

  let ordered = []; // the releases that pass the filters, in the chosen order
  let shown = 0;    // how many of `ordered` are on the page

  function showUpTo(count) {
    const target = Math.min(count, ordered.length);
    for (; shown < target; shown++) list.appendChild(changelogRelease(ordered[shown], ordered[shown] === releases[0]));
    const remaining = ordered.length - shown;
    more.hidden = remaining === 0;
    more.textContent = `Show more (${remaining} ${sort === 'oldest' ? 'newer' : 'older'})`;
    countText.replaceChildren('Showing ', el('strong', { text: `${shown} of ${releases.length}` }), ` ${releases.length === 1 ? 'release' : 'releases'}`);
  }
  more.addEventListener('click', () => showUpTo(shown + CHANGELOG_PAGE_SIZE));

  // Any change to the filters or the sort starts again at the first page.
  function refresh() {
    ordered = releases.filter(r =>
      (!activeMonths.size || activeMonths.has(changelogMonth(r))) &&
      (!activeTypes.size || activeTypes.has(typeOf.get(r))));
    if (sort === 'oldest') ordered.reverse();
    list.replaceChildren();
    shown = 0;
    showUpTo(CHANGELOG_PAGE_SIZE);
    if (filterPanel) filterPanel.sync();
    sortControl.set(sort);
    status.textContent = ordered.length ? '' : 'Nothing matches those filters.';
    writeChangelogHash(activeMonths, activeTypes, sort);
  }

  // Filter box: the same one as the News page (shell.js).
  let filterPanel = null;
  if (monthKeys.length > 1 || types.length > 1) {
    filterPanel = buildFilterPanel({ idPrefix: 'changelog', subject: 'releases', onChange: refresh });
    if (monthKeys.length > 1) {
      filterPanel.addGroup({
        title: 'Month', noun: 'months', startOpen: true, set: activeMonths,
        allLabel: 'All months', total: releases.length,
        options: monthKeys.map(k => ({ key: k, label: formatMonth(k), count: releases.filter(r => changelogMonth(r) === k).length }))
      });
    }
    if (types.length > 1) {
      filterPanel.addGroup({
        title: 'Release type', noun: 'types', startOpen: true, set: activeTypes,
        allLabel: 'All types', total: releases.length,
        options: types.map(t => ({ key: t.key, label: t.label, hint: `Versions like ${t.hint}`, count: releases.filter(r => typeOf.get(r) === t.key).length }))
      });
    }
  }

  const sortControl = buildSortDropdown({
    options: [{ key: 'newest', label: 'Newest first' }, { key: 'oldest', label: 'Oldest first' }],
    current: sort, label: 'Sort changelog', menuId: 'changelog-sort-menu',
    onChange: key => { sort = key; refresh(); }
  });

  // The News page's layout without its search box or side cards: the toolbar and list, with the filters beside them.
  main.appendChild(el('div', { class: 'news-layout no-search' + (filterPanel ? '' : ' no-filters') }, [
    el('div', { class: 'news-toolbar' }, [countText, sortControl.node]),
    filterPanel ? el('div', { class: 'news-filter-area' }, [filterPanel.node]) : null,
    el('div', { class: 'news-feed' }, [status, list, more])
  ]));

  // A link to a release shows it: filters that hide it are cleared, and enough of the list is shown to include it.
  function focusHash() {
    const raw = location.hash.slice(1);
    if (!raw || raw.includes('=')) return false;
    const id = decodeURIComponent(raw);
    const release = releases.find(r => changelogId(r.version) === id);
    if (!release) return false;
    if (!ordered.includes(release)) {
      activeMonths.clear();
      activeTypes.clear();
      refresh();
    }
    const index = ordered.indexOf(release);
    if (index >= shown) showUpTo(index + 1);
    const target = document.getElementById(id);
    if (!target) return false;
    target.classList.add('is-targeted');
    target.scrollIntoView({ block: 'start' });
    setTimeout(() => target.classList.remove('is-targeted'), 2500);
    return true;
  }

  refresh();
  focusHash();
  window.addEventListener('hashchange', focusHash);

  // Dates follow the Settings page, including a change made in another tab.
  document.addEventListener(SETTINGS_EVENT, () => {
    list.querySelectorAll('.news-when[data-date]').forEach(node => node.replaceWith(changelogDate(node.dataset.date)));
  });
}

if (document.getElementById('changelog-page')) {
  renderBrand(SITE_DATA.brand);
  renderSiteHeader(SITE_DATA.pages || [], 'changelog');
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderChangelogPage();
  clearSkeletons();
  initBackToTop();
}
