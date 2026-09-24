/* ============================================================
   HOME PAGE

   One big button per section (Data Packs & Mods, Resource Packs,
   Other Projects). Each button links to that section's own page and shows the section's
   first four project icons in slots 1–4 (left to right, top to
   bottom). The icons are decoration only — the whole button is the
   one link.

   Loaded after data.js and section-page.js, which supply
   SITE_DATA and the shared brand / nav / footer helpers used below.
   Edit data.js to change what's shown (section order, project order
   and images all come from there).
   ============================================================ */

// How many icon slots each button has. A section with more projects
// than this shows the first HOME_SLOTS - 1 icons and turns the last slot
// into a "+X" tile counting the rest (they're all still on the section's
// own page); fewer leaves the remaining slots as empty placeholders so
// the buttons stay the same shape.
const HOME_SLOTS = 4;

// Builds one big section button. `page` is the matching entry from
// SITE_DATA.pages (its url is where the button goes).
function renderHomeButton(section, page) {
  const allProjects = section.projects || [];
  const overflow = allProjects.length > HOME_SLOTS;
  const shownCount = overflow ? HOME_SLOTS - 1 : HOME_SLOTS;
  const projects = allProjects.slice(0, shownCount);

  // The icon grid. Not interactive itself — the whole button is the
  // link — so every image is decorative (alt="") and the "+X" tile and
  // empty placeholders are hidden from screen readers.
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

  a.appendChild(el('span', { class: 'home-card-inner' }, [
    el('span', { class: 'home-slots' }, slots),
    el('span', { class: 'home-card-title', text: section.heading }),
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

// Before the home page became a set of buttons, index.html held every
// project, and the "copy link" buttons produced links like
// index.html#better-craftables (or #resource-packs for a whole
// section). Those links now belong on the section pages, which build
// the same #ids — so if one arrives here, forward it to the right
// page instead of leaving the visitor on a home page with nothing to
// scroll to. Returns true if it redirected.
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
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderStructuredData(SITE_DATA, null); // null = describe every project, not just one section
  initBackToTop();
})();
