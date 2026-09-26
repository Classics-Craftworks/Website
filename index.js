/* ============================================================
   HOME PAGE

   One big button per section, showing each section's first four
   project icons. Loaded after data.js/section-page.js (SITE_DATA,
   shared helpers) and stats.js (STATS_DATA for the stats section
   below). Edit data.js for section/project content, stats.js for
   the stat numbers.
   ============================================================ */

// Icon slots per button. Extra projects collapse the last slot into a
// "+X" tile; fewer projects leave empty placeholders.
const HOME_SLOTS = 4;

// Builds one big section button. `page` is the matching entry from
// SITE_DATA.pages (its url is where the button goes).
function renderHomeButton(section, page) {
  const allProjects = section.projects || [];
  const overflow = allProjects.length > HOME_SLOTS;
  const shownCount = overflow ? HOME_SLOTS - 1 : HOME_SLOTS;
  const projects = allProjects.slice(0, shownCount);

  // Not interactive itself, so icons are decorative and the "+X"/empty
  // placeholders are hidden from screen readers.
  const slots = [];
  for (let i = 0; i < HOME_SLOTS; i++) {
    const p = projects[i];
    if (p) {
      slots.push(el('img', {
        class: 'home-slot',
        src: p.image,
        alt: '',
        attrs: { draggable: 'false' }
      }));
    } else if (overflow) {
      // The "+" is drawn in CSS (.home-slot-more-plus) because the site's
      // pixel font has no plus glyph; only the number is real text.
      slots.push(el('span', {
        class: 'home-slot home-slot-more',
        attrs: { 'aria-hidden': 'true' }
      }, [
        el('span', { class: 'home-slot-more-plus' }),
        document.createTextNode(String(allProjects.length - shownCount))
      ]));
    } else {
      slots.push(el('span', { class: 'home-slot home-slot-empty', attrs: { 'aria-hidden': 'true' } }));
    }
  }

  // Screen readers get every project's name as the button's description,
  // since the icons themselves carry no text. The span is `hidden`
  // (so it isn't part of the button's name, which stays just the
  // section title) but aria-describedby can still point at it.
  const names = allProjects.map(p => p.title);
  const descId = 'home-desc-' + slugify(section.heading);
  const description = names.length
    ? el('span', { text: 'Includes ' + names.join(', '), attrs: { id: descId, hidden: '' } })
    : null;

  // Built by hand rather than via el()'s href shortcut — that always
  // opens links in a new tab (right for external links), but moving
  // between pages of this site should stay in the same tab.
  const a = document.createElement('a');
  a.className = 'home-card';
  a.href = page.url;
  if (names.length) a.setAttribute('aria-describedby', descId);

  // "N PROJECTS" label with the section's icon (data.js's per-section
  // "icon" field), falling back to "box" if it's missing one.
  const badge = el('span', { class: 'home-card-badge' }, [
    icon(section.icon || 'box', 'icon-sm'),
    document.createTextNode(allProjects.length + ' PROJECT' + (allProjects.length === 1 ? '' : 'S'))
  ]);

  // Longer headings (e.g. "Data Packs & Mods") get a size-down
  // modifier so they still fit on one line (see .home-card-title--tight).
  const isLong = section.heading.length > 15;
  const titleClass = isLong ? 'home-card-title home-card-title--tight' : 'home-card-title';
  const rowClass = isLong ? 'home-card-title-row home-card-title-row--tight' : 'home-card-title-row';
  const titleRow = el('span', { class: rowClass }, [
    el('span', { class: titleClass, text: section.heading }),
    el('span', { class: 'home-card-arrow', attrs: { 'aria-hidden': 'true' } })
  ]);

  a.appendChild(el('span', { class: 'home-card-inner' }, [
    badge,
    titleRow,
    el('span', { class: 'home-slots' }, slots),
    description
  ]));

  return a;
}

// One button per section, in the same order as data.js. A section is
// skipped if it has no matching entry in SITE_DATA.pages (nowhere to
// link to).
function renderHomeButtons(sections, pages) {
  const main = document.getElementById('catalog');
  if (!main) return;

  const grid = el('div', { class: 'home-grid' });
  sections.forEach(section => {
    const page = pages.find(p => p.section === section.heading);
    if (page) grid.appendChild(renderHomeButton(section, page));
  });
  main.appendChild(grid);
}

// Builds one box of the stats section ({ icon, label, value } — see
// stats.js). "icon" is optional; the box just skips it if left off.
function renderStatBox(stat) {
  return el('div', { class: 'stat-box' }, [
    stat.icon ? icon(stat.icon, 'icon-md') : null,
    el('span', { class: 'stat-value', text: stat.value }),
    el('span', { class: 'stat-label', text: stat.label })
  ]);
}

// Fills in the Statistics section from STATS_DATA (stats.js). Does
// nothing if stats.js hasn't loaded or a field is blank, so it can't
// break the rest of the home page.
function renderStats(stats) {
  if (!stats) return;

  const grid = document.getElementById('stats-grid');
  if (grid) (stats.stats || []).forEach(s => grid.appendChild(renderStatBox(s)));

  const note = document.getElementById('stats-note');
  if (note && stats.note) note.textContent = stats.note;

  const updated = document.getElementById('stats-updated');
  if (updated && stats.lastUpdated) updated.textContent = 'As of ' + stats.lastUpdated;
}

// Old "copy link" URLs (e.g. index.html#better-craftables) now belong
// on the section pages, which build the same #ids — forward them
// there instead of leaving the visitor with nothing to scroll to.
// Returns true if it redirected.
function forwardOldDeepLink(sections, pages) {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return false;

  for (const section of sections) {
    const page = pages.find(p => p.section === section.heading);
    if (!page) continue;

    const isSection = slugify(section.heading) === id;
    const isProject = (section.projects || []).some(p => slugify(p.title) === id);
    if (isSection || isProject) {
      location.replace(page.url + '#' + encodeURIComponent(id));
      return true;
    }
  }
  return false;
}

(function init() {
  const sections = SITE_DATA.sections || [];
  const pages = SITE_DATA.pages || [];

  if (forwardOldDeepLink(sections, pages)) return;

  renderBrand(SITE_DATA.brand, SITE_DATA.topLinks);
  renderPageNav(pages, 'index.html');
  renderHomeButtons(sections, pages);
  renderStats(typeof STATS_DATA !== 'undefined' ? STATS_DATA : null);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderStructuredData(SITE_DATA, null); // null = describe every project, not just one section
  initBackToTop();
})();
