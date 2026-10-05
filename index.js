/* ============================================================
   HOME PAGE

   A splash banner with a featured project, then one card per section.
   Each card links to its section page and lists the section's first
   few projects, each of which links straight to that project. Loaded after data.js/section-page.js (SITE_DATA,
   shared helpers) and stats.js (STATS_DATA for the stats section
   below). Edit data.js for section/project content, stats.js for
   the stat numbers.
   ============================================================ */

// Project rows shown per card. If a section has more projects than
// this, the last row becomes a "+X more" link to the section page.
const HOME_SLOTS = 4;

// Where a project lives: its own spot on its section page (the same
// #id the "copy link" buttons use, which the page scrolls to and
// highlights on load).
function projectUrl(page, project) {
  return page.url + '#' + encodeURIComponent(slugify(project.title));
}

// Subtitle under a project's name: "v8.0.0 \u00b7 Java 26.3" - the current
// version (the first enabled download's, as in the featured card) and the
// Minecraft version it supports, taken from the stable channel (falling
// back to the first channel). Empty string if there's no version.
function projectMeta(project) {
  const channels = project.channels || [];
  const ch = channels.find(c => c.channel === 'stable') || channels[0];
  if (!ch) return '';

  const first = (ch.downloads || []).find(d => !d.disabled && d.version);
  const parts = [];
  if (first) parts.push(first.version);
  if (ch.mcVersion) parts.push('Java ' + ch.mcVersion);
  return parts.join(' \u00b7 ');
}

// Plain same-tab link. el()'s href shortcut always opens a new tab
// (right for external links), but moving around this site should stay
// in the same tab.
function homeLink(className, href, children, label) {
  const a = document.createElement('a');
  a.className = className;
  a.href = href;
  if (label) a.setAttribute('aria-label', label);
  children.forEach(c => c && a.appendChild(c));
  return a;
}

// The small "chevron" arrow drawn in CSS (no icon asset needed).
function homeArrow(className) {
  return el('span', { class: className, attrs: { 'aria-hidden': 'true' } });
}

// One clickable project row: icon, title, version info, chevron.
// Goes straight to that project on its section page.
function renderHomeProject(project, page) {
  const meta = projectMeta(project);
  return el('li', { class: 'home-project-item' }, [
    homeLink('home-project', projectUrl(page, project), [
      el('img', { class: 'home-project-img', src: project.image, alt: '', attrs: { draggable: 'false' } }),
      el('span', { class: 'home-project-text' }, [
        el('span', { class: 'home-project-title', text: project.title }),
        meta ? el('span', { class: 'home-project-meta', text: meta }) : null
      ]),
      homeArrow('home-project-arrow')
    ])
  ]);
}

// The "+X more" row that closes an overflowing list; goes to the section page.
function renderHomeMore(count, page) {
  return el('li', { class: 'home-project-item' }, [
    homeLink('home-project home-project-more', page.url, [
      el('span', { class: 'home-project-img home-project-more-tile', attrs: { 'aria-hidden': 'true' } }, [
        // The "+" is drawn in CSS because the pixel font has no plus glyph.
        el('span', { class: 'home-slot-more-plus' }),
        document.createTextNode(String(count))
      ]),
      el('span', { class: 'home-project-text' }, [
        el('span', { class: 'home-project-title', text: 'See all projects' })
      ]),
      homeArrow('home-project-arrow')
    ], count + ' more ' + (count === 1 ? 'project' : 'projects') + ' - see all')
  ]);
}

// Builds one section card. `page` is the matching entry from
// SITE_DATA.pages (its url is where the header and footer go).
// The card itself is not a link: the header and footer go to the
// section page, and every project row inside goes to that project.
function renderHomeButton(section, page) {
  const allProjects = section.projects || [];
  const count = allProjects.length;
  const overflow = count > HOME_SLOTS;
  const shownCount = overflow ? HOME_SLOTS - 1 : HOME_SLOTS;

  const rows = allProjects.slice(0, shownCount).map(p => renderHomeProject(p, page));
  if (overflow) rows.push(renderHomeMore(count - shownCount, page));

  // Header: section icon, title and project count, then an arrow.
  const header = homeLink('home-card-header', page.url, [
    el('span', { class: 'home-card-badge', attrs: { 'aria-hidden': 'true' } }, [
      icon(page.icon || 'box', 'home-card-icon')
    ]),
    el('span', { class: 'home-card-headtext' }, [
      el('span', { class: 'home-card-title', text: section.heading }),
      el('span', { class: 'home-card-count', text: count + ' project' + (count === 1 ? '' : 's') })
    ]),
    homeArrow('home-card-arrow')
  ], section.heading + ' - ' + count + ' project' + (count === 1 ? '' : 's'));

  const footer = homeLink('home-card-footer', page.url, [
    el('span', { text: 'Browse all ' + section.heading }),
    homeArrow('home-card-footer-arrow')
  ]);

  return el('section', { class: 'home-card', attrs: { 'aria-label': section.heading } }, [
    header,
    rows.length ? el('ul', { class: 'home-projects' }, rows) : null,
    footer
  ]);
}

// One card per section, in the same order as data.js. A section is
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
    if (project && page) return { project, url: projectUrl(page, project) };
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
      el('h2', { class: 'splash-featured-title', text: project.title }),
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
