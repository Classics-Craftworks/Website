/* Changelog page: renders CHANGELOG_DATA, which the build generates from the site's CHANGELOG.md
   (changelog-data.js; edit the markdown, not the data). Newest release first, ten at a time.
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

function renderChangelogPage() {
  const main = document.getElementById('changelog-page');
  if (!main || typeof CHANGELOG_DATA === 'undefined') return;
  const cfg = SITE_DATA.changelog || {};
  const releases = CHANGELOG_DATA;

  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: 'changelog-heading' } }, [
    el('span', { text: cfg.heading || 'Changelog' })
  ]));
  main.appendChild(el('p', { class: 'news-intro', text: cfg.intro || 'Every change to this website, newest first.' }));

  if (!releases.length) {
    main.appendChild(el('p', { class: 'news-empty', text: 'Nothing here yet. Check back soon!' }));
    return;
  }

  const list = el('div', { class: 'changelog-releases' });
  const more = el('button', { class: 'news-show-more', text: 'Show more', attrs: { type: 'button' } });
  main.append(list, more);

  let shown = 0;
  function showUpTo(count) {
    const target = Math.min(count, releases.length);
    for (; shown < target; shown++) list.appendChild(changelogRelease(releases[shown], shown === 0));
    more.hidden = shown >= releases.length;
    more.textContent = `Show more (${releases.length - shown} older)`;
  }
  more.addEventListener('click', () => showUpTo(shown + CHANGELOG_PAGE_SIZE));

  // A link to an older release shows enough of the list to include it, then scrolls there.
  function focusHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const index = releases.findIndex(r => changelogId(r.version) === id);
    if (index < 0) return false;
    if (index >= shown) showUpTo(index + 1);
    const target = document.getElementById(id);
    if (!target) return false;
    target.classList.add('is-targeted');
    target.scrollIntoView({ block: 'start' });
    setTimeout(() => target.classList.remove('is-targeted'), 2500);
    return true;
  }

  showUpTo(CHANGELOG_PAGE_SIZE);
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
