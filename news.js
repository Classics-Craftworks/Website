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

function renderNewsItem(entry) {
  const pills = (entry.tags || []).map(key => {
    const tag = newsTag(key);
    const pill = el('span', { class: 'news-tag', text: tag.label });
    setTagColor(pill, tag);
    return pill;
  });
  const head = el('div', { class: 'news-meta' }, [
    ...pills,
    el('time', { class: 'news-date', text: formatNewsDate(entry.date), attrs: { datetime: entry.date } })
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

// Active filters live in the URL (#tags=release,new) so a filtered view can be linked to.
function readHashTags(valid) {
  const m = /^#tags=([^&]*)/.exec(location.hash);
  if (!m) return new Set();
  return new Set(decodeURIComponent(m[1]).split(',').filter(k => valid.includes(k)));
}

function writeHashTags(active) {
  const hash = active.size ? '#tags=' + [...active].map(encodeURIComponent).join(',') : '';
  history.replaceState(null, '', location.pathname + location.search + hash);
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

  const tagKeys = usedTagKeys(entries);
  const active = readHashTags(tagKeys); // empty set = show everything

  const list = el('ul', { class: 'news-list' });
  const status = el('p', { class: 'news-status', attrs: { 'aria-live': 'polite' } });
  const buttons = new Map(); // tag key (or '') -> button

  function matches(entry) {
    return !active.size || (entry.tags || []).some(t => active.has(t));
  }

  function refresh() {
    const shown = entries.filter(matches);
    list.replaceChildren(...shown.map(renderNewsItem));

    buttons.forEach((btn, key) => {
      const on = key === '' ? !active.size : active.has(key);
      btn.setAttribute('aria-pressed', String(on));
    });

    status.textContent = shown.length
      ? (active.size ? `Showing ${shown.length} of ${entries.length} updates` : '')
      : 'No updates match those tags.';
    writeHashTags(active);
  }

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

  // One filter row, only when there's more than one tag to choose between.
  if (tagKeys.length > 1) {
    const row = el('div', { class: 'news-filters', attrs: { role: 'group', 'aria-label': 'Filter updates by tag' } }, [
      makeButton('', 'All', null),
      ...tagKeys.map(k => { const t = newsTag(k); return makeButton(k, t.label, t); })
    ]);
    main.appendChild(row);
  }
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
