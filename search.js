/* ============================================================
   SITE SEARCH

   Adds a search box to the nav bar on the home page and every
   section page. It searches every project on the whole site (title,
   description, section name and version strings) using SITE_DATA from
   data.js, and shows matches in a dropdown that links straight to the
   project on its own page (e.g. resource-packs.html#classics-disc-tweaks).

   Must load after the page's own script, so the nav bar already exists
   (see the <script> tags at the bottom of each HTML page).
   ============================================================ */

// Turns SITE_DATA into a flat list of searchable projects. Each entry's
// url uses the same #id the project gets on its own page (see uniqueSlug()
// in section-page.js), so the link lands on the right card.
function buildSearchIndex(data) {
  const pages = data.pages || [];
  const entries = [];

  (data.sections || []).forEach(section => {
    const page = pages.find(p => p.section === section.heading);
    if (!page) return; // a section with no page has nowhere to link to

    // Same order as renderFlatSection(): the heading claims its id first.
    const used = new Set();
    uniqueSlug(section.heading, 'section', used);

    (section.projects || []).forEach(project => {
      const id = uniqueSlug(project.title, 'project', used);

      // Minecraft versions and each download's own version, e.g.
      // "1.21.9 – 26.3" and "v3.4.0". `label` is how it's shown in results.
      const versions = [];
      (project.channels || []).forEach(ch => {
        if (ch.mcVersion) versions.push({ text: ch.mcVersion, label: 'Java ' + ch.mcVersion });
        (ch.downloads || []).forEach(d => {
          // Unavailable downloads show "N/A" on the page, so skip their versions too.
          if (d.version && d.url && !d.disabled) versions.push({ text: d.version, label: d.version });
        });
      });

      const titleLower = project.title.toLowerCase();
      entries.push({
        title: project.title,
        image: project.image,
        section: section.heading,
        url: `${page.url}#${id}`,
        titleLower,
        titleWords: titleLower.split(/[^a-z0-9]+/).filter(Boolean),
        sectionLower: section.heading.toLowerCase(),
        descriptionLower: (project.description || '').toLowerCase(),
        versions: versions.filter((v, i) => versions.findIndex(x => x.label === v.label) === i)
      });
    });
  });

  return entries;
}

// How well one search word matches a project (0 = no match). Title
// matches rank highest, then versions, section name and description.
function scoreSearchWord(entry, word) {
  if (entry.titleLower.startsWith(word)) return 100;
  if (entry.titleWords.some(w => w.startsWith(word))) return 80;
  if (entry.titleLower.includes(word)) return 60;
  if (entry.versions.some(v => v.text.toLowerCase().includes(word))) return 40;
  if (entry.sectionLower.includes(word)) return 30;
  if (entry.descriptionLower.includes(word)) return 20;
  return 0;
}

// Every word in the query has to match something (so "disc 3.4" only
// finds Disc Tweaks). Best matches first; ties keep data.js order.
function searchProjects(entries, query) {
  const words = [...new Set(query.toLowerCase().split(/\s+/).filter(Boolean))];
  const results = [];

  entries.forEach((entry, order) => {
    let score = 0;
    for (const word of words) {
      const s = scoreSearchWord(entry, word);
      if (!s) { score = 0; break; }
      score += s;
    }
    if (score) results.push({ entry, score, order });
  });

  results.sort((a, b) => b.score - a.score || a.order - b.order);
  return { words, results: results.map(r => r.entry) };
}

// Returns `text` with each matched word wrapped in <mark>, as DOM nodes
// (never innerHTML, so project text can't inject markup).
function highlightMatches(text, words) {
  const frag = document.createDocumentFragment();
  const pattern = words
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length)
    .join('|');

  if (!pattern) {
    frag.appendChild(document.createTextNode(text));
    return frag;
  }

  // Splitting on a capture group puts the matches at the odd indexes.
  text.split(new RegExp(`(${pattern})`, 'gi')).forEach((part, i) => {
    if (!part) return;
    frag.appendChild(i % 2
      ? el('mark', { text: part })
      : document.createTextNode(part));
  });
  return frag;
}

// "resource-packs.html" and "/resource-packs" (hosts that hide .html) are the same page.
function normalizePath(path) {
  return path.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
}

function initSearch() {
  const nav = document.getElementById('page-nav');
  if (!nav || typeof SITE_DATA === 'undefined') return; // e.g. the home page redirected an old deep link

  const entries = buildSearchIndex(SITE_DATA);
  if (!entries.length) return;

  /* ---------- Markup ---------- */
  const listboxId = 'search-results';

  const input = el('input', {
    class: 'nav-search-input',
    attrs: {
      type: 'search',
      placeholder: 'Search projects…',
      'aria-label': 'Search all projects',
      autocomplete: 'off',
      spellcheck: 'false',
      enterkeyhint: 'go',
      role: 'combobox',
      'aria-expanded': 'false',
      'aria-controls': listboxId,
      'aria-autocomplete': 'list'
    }
  });
  const clearBtn = el('button', {
    class: 'nav-search-clear',
    attrs: { type: 'button', 'aria-label': 'Clear search', hidden: '' }
  });
  const list = el('div', { class: 'search-results', attrs: { id: listboxId, role: 'listbox', 'aria-label': 'Search results' } });
  const empty = el('p', { class: 'search-empty', attrs: { hidden: '' } });
  const panel = el('div', { class: 'search-panel', attrs: { hidden: '' } }, [list, empty]);
  // Screen readers hear the result count here as you type.
  const status = el('p', { class: 'visually-hidden', attrs: { role: 'status', 'aria-live': 'polite' } });

  const wrap = el('div', { class: 'nav-search', attrs: { role: 'search' } }, [
    icon('search', 'icon-sm nav-search-icon'),
    input,
    clearBtn,
    panel,
    status
  ]);
  nav.appendChild(wrap);

  /* ---------- Behaviour ---------- */
  let options = [];  // the result <a> elements currently shown
  let active = -1;   // index of the highlighted one

  function setActive(index) {
    options.forEach((o, i) => {
      const on = i === index;
      o.classList.toggle('is-active', on);
      o.setAttribute('aria-selected', String(on));
    });
    active = index;
    if (options[index]) {
      input.setAttribute('aria-activedescendant', options[index].id);
      options[index].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function close() {
    panel.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    setActive(-1);
  }

  function open() {
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  // Picks a result. On a different page this is a normal link; on the
  // current page it scrolls to the project directly, since the hash
  // may not change (or may already match) and the browser wouldn't.
  function onResultClick(e) {
    const url = new URL(e.currentTarget.href);
    const samePage = normalizePath(url.pathname) === normalizePath(location.pathname);
    close();
    input.blur();
    if (!samePage || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    e.preventDefault();
    if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    handleDeepLink();
  }

  function renderResult(entry, index, words) {
    const matchedVersions = entry.versions
      .filter(v => words.some(w => v.text.toLowerCase().includes(w)))
      .slice(0, 1); // one is enough to show why it matched

    const meta = el('span', { class: 'search-result-meta' });
    meta.appendChild(document.createTextNode(entry.section));
    matchedVersions.forEach(v => {
      meta.appendChild(document.createTextNode(' · '));
      meta.appendChild(highlightMatches(v.label, words));
    });

    const title = el('span', { class: 'search-result-title' });
    title.appendChild(highlightMatches(entry.title, words));

    const a = el('a', {
      class: 'search-result',
      attrs: { href: entry.url, id: `search-option-${index}`, role: 'option', 'aria-selected': 'false', tabindex: '-1' }
    }, [
      el('img', { class: 'search-result-thumb', src: entry.image, alt: '', attrs: { loading: 'lazy', draggable: 'false' } }),
      el('span', { class: 'search-result-text' }, [title, meta])
    ]);
    a.addEventListener('click', onResultClick);
    a.addEventListener('mousemove', () => { if (active !== index) setActive(index); });
    return a;
  }

  function update() {
    const query = input.value.trim();
    clearBtn.hidden = !input.value;

    if (!query) {
      close();
      list.textContent = '';
      options = [];
      status.textContent = '';
      return;
    }

    const { words, results } = searchProjects(entries, query);
    list.textContent = '';
    options = results.map((entry, i) => renderResult(entry, i, words));
    options.forEach(o => list.appendChild(o));

    list.hidden = !results.length;
    empty.hidden = !!results.length;
    if (!results.length) {
      empty.textContent = `No projects match “${query}”. Try a name or a version number.`;
    }
    status.textContent = results.length
      ? `${results.length} result${results.length === 1 ? '' : 's'}`
      : 'No results';

    open();
    setActive(results.length ? 0 : -1);
  }

  input.addEventListener('input', update);
  input.addEventListener('focus', () => { if (input.value.trim()) update(); });

  input.addEventListener('keydown', e => {
    const panelOpen = !panel.hidden;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!panelOpen) { if (input.value.trim()) update(); break; }
        if (!options.length) break;
        const step = e.key === 'ArrowDown' ? 1 : -1;
        setActive((active + step + options.length) % options.length);
        break;
      }
      case 'Enter':
        if (panelOpen && options.length) options[Math.max(active, 0)].click();
        break;
      case 'Escape':
        if (panelOpen) close();
        else if (input.value) { input.value = ''; update(); }
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    update();
    input.focus();
  });

  // Keeps focus in the input while a result is pressed. Otherwise Safari
  // (which doesn't focus links on click) would close the panel on
  // mousedown, before the click could land.
  panel.addEventListener('mousedown', e => e.preventDefault());

  // Close when focus or a click moves outside the search box.
  wrap.addEventListener('focusout', e => {
    if (!wrap.contains(e.relatedTarget)) close();
  });
  document.addEventListener('pointerdown', e => {
    if (!wrap.contains(e.target)) close();
  });
}

initSearch();
