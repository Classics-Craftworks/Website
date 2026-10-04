/* ============================================================
   HOME PAGE

   A splash banner with a featured project, then one big button per section, showing each section's first four
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

  // Built by hand rather than via el()'s href shortcut - that always
  // opens links in a new tab (right for external links), but moving
  // between pages of this site should stay in the same tab.
  const a = document.createElement('a');
  a.className = 'home-card';
  a.href = page.url;
  if (names.length) a.setAttribute('aria-describedby', descId);

  // Header: just the heading, centered. Longer headings (e.g. "Data
  // Packs & Mods") get a size-down modifier so they still fit on one
  // line (see .home-card-title--tight).
  const isLong = section.heading.length > 15;
  const titleClass = isLong ? 'home-card-title home-card-title--tight' : 'home-card-title';
  const header = el('span', { class: 'home-card-header' }, [
    el('span', { class: titleClass, text: section.heading })
  ]);

  // "Browse N projects" + the "go to this section" arrow, pinned to
  // the bottom of the card (see margin-top:auto on .home-card-footer).
  // The section's icon (from its matching SITE_DATA.pages entry's
  // "icon" field, falling back to "box") sits to the left of the label.
  const count = allProjects.length;
  const footerLabel = el('span', { class: 'home-card-footer-label' }, [
    icon(page.icon || 'box', 'home-card-icon'),
    document.createTextNode('Browse ' + count + ' project' + (count === 1 ? '' : 's'))
  ]);
  const footer = el('span', { class: 'home-card-footer' }, [
    footerLabel,
    el('span', { class: 'home-card-arrow', attrs: { 'aria-hidden': 'true' } })
  ]);

  a.appendChild(el('span', { class: 'home-card-inner' }, [
    header,
    el('span', { class: 'home-slots' }, slots),
    footer,
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

// Builds one box of the stats section ({ icon, label, value } - see
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
// on the section pages, which build the same #ids - forward them
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

// Finds a project by title across every section. Returns { project,
// url } where url is that project's own spot on its section page (the
// same #id the "copy link" buttons use), or null if there's no match.
function findProject(title, sections, pages) {
  for (const section of sections) {
    const project = (section.projects || []).find(p => p.title === title);
    const page = pages.find(pg => pg.section === section.heading);
    if (project && page) return { project, url: page.url + '#' + encodeURIComponent(slugify(project.title)) };
  }
  return null;
}

// Plain same-tab link (el()'s href shortcut always opens a new tab,
// which is right for external links but not for moving around this site).
function internalLink(className, href, children) {
  const a = document.createElement('a');
  a.className = className;
  a.href = href;
  children.forEach(c => c && a.appendChild(c));
  return a;
}

// The featured-project card on the right of the splash. The text comes
// from the project's own data.js entry: its title, description, kinds of
// download (pills beside the title) and the current stable data pack
// version + Minecraft version (plain text by the button). `imageSrc` is
// the card's own picture (SITE_DATA.home.splash.featuredImage) - it is
// not the project's icon.
function renderFeaturedCard(found, imageSrc) {
  const { project, url } = found;
  const stable = (project.channels || []).find(c => c.channel === 'stable') || (project.channels || [])[0];
  const downloads = ((stable && stable.downloads) || []).filter(d => !d.disabled);

  // One pill per kind of download ("Data Pack", "Mod"), beside the title.
  const seen = new Set();
  const pills = [];
  downloads.forEach(d => {
    if (seen.has(d.label)) return;
    seen.add(d.label);
    pills.push(el('li', { class: 'splash-chip' }, [icon(d.icon, 'icon-sm'), el('span', { text: d.label })]));
  });

  // "v8.0.0 | Java 26.3" - the first download's version (the data pack's)
  // and the Minecraft version, as plain text.
  const meta = [];
  const first = downloads.find(d => d.version);
  if (first) meta.push(el('span', { class: 'splash-meta-version', text: first.version }));
  if (stable && stable.mcVersion) meta.push(el('span', { text: 'Java ' + stable.mcVersion }));

  return [
    el('p', { class: 'splash-featured-label', text: 'Featured project' }),
    imageSrc ? el('div', { class: 'splash-featured-media' }, [
      el('img', { class: 'splash-featured-img', src: imageSrc, alt: '', attrs: { draggable: 'false' } })
    ]) : null,
    el('div', { class: 'splash-featured-head' }, [
      el('h3', { class: 'splash-featured-title', text: project.title }),
      pills.length ? el('ul', { class: 'splash-chips' }, pills) : null
    ]),
    el('p', { class: 'splash-featured-desc', text: project.description || '' }),
    el('div', { class: 'splash-featured-foot' }, [
      el('p', { class: 'splash-meta' }, meta),
      internalLink('splash-btn splash-btn-ghost', url, [
        el('span', { text: 'View Project' }),
        el('span', { class: 'splash-btn-arrow', attrs: { 'aria-hidden': 'true' } })
      ])
    ])
  ];
}

// Builds the banner at the top of the home page from SITE_DATA.home.splash.
// Leaves it hidden if there's no splash block.
function renderSplash(home, sections, pages) {
  const wrap = document.getElementById('splash');
  const splash = home && home.splash;
  if (!wrap || !splash) return;

  // Two-line headline; the second line takes the accent colour.
  const lines = splash.headline || [];
  const headline = document.getElementById('splash-headline');
  lines.forEach((text, i) => {
    headline.appendChild(el('span', { class: 'splash-line' + (i > 0 ? ' splash-line-accent' : ''), text }));
  });
  document.getElementById('splash-subtitle').textContent = splash.subtitle || '';

  // Buttons: jump down to the project buttons, or go to the About page.
  const actions = document.getElementById('splash-actions');
  actions.appendChild(internalLink('splash-btn splash-btn-primary', '#projects-intro', [
    icon('compass', 'icon-sm'),
    el('span', { text: 'Explore Projects' }),
    el('span', { class: 'splash-btn-arrow', attrs: { 'aria-hidden': 'true' } })
  ]));
  const about = pages.find(p => p.url === 'about');
  if (about) {
    actions.appendChild(internalLink('splash-btn splash-btn-ghost', about.url, [
      icon(about.icon, 'icon-sm'),
      el('span', { text: 'About' })
    ]));
  }

  // Featured project card (skipped, leaving the text full-width, if the
  // named project can't be found).
  const found = splash.featured && findProject(splash.featured, sections, pages);
  const card = document.getElementById('splash-featured');
  if (found) renderFeaturedCard(found, splash.featuredImage).forEach(n => n && card.appendChild(n));
  else { card.remove(); wrap.classList.add('splash-no-card'); }

  wrap.hidden = false;
}

// Fills the heading + subtitle above the section buttons from SITE_DATA.home.
// Hides the whole block if no heading text is set.
function renderProjectsIntro(home) {
  const wrap = document.getElementById('projects-intro');
  if (!wrap) return;
  if (!home || !home.projectsHeading) { wrap.hidden = true; return; }
  document.getElementById('projects-heading').textContent = home.projectsHeading;
  document.getElementById('projects-subtitle').textContent = home.projectsSubtitle || '';
}

(function init() {
  const sections = SITE_DATA.sections || [];
  const pages = SITE_DATA.pages || [];

  if (forwardOldDeepLink(sections, pages)) return;

  renderBrand(SITE_DATA.brand);
  renderSiteHeader(pages, '/');
  renderSplash(SITE_DATA.home, sections, pages);
  renderProjectsIntro(SITE_DATA.home);
  renderHomeButtons(sections, pages);
  renderStats(typeof STATS_DATA !== 'undefined' ? STATS_DATA : null);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderStructuredData(SITE_DATA, null); // null = describe every project, not just one section
  initBackToTop();
})();
