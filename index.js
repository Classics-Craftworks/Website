/* Home page: splash banner with a featured project, one card per section,
   and the stats block. Needs data.js, section-page.js and stats.js. */

// Project rows per card; beyond this the last row becomes a "+X more" link.
const HOME_SLOTS = 4;

const pluralProjects = n => `${n} project${n === 1 ? '' : 's'}`;

function projectUrl(page, project) {
  return page.url + '#' + encodeURIComponent(slugify(project.title));
}

// "v8.0.0 - 26.3": first enabled download's version plus the stable channel's
// Minecraft version. Empty string if there's neither.
function projectMeta(project) {
  const ch = stableChannel(project);
  if (!ch) return '';

  const first = (ch.downloads || []).find(d => !d.disabled && d.version);
  return [first && first.version, ch.mcVersion].filter(Boolean).join(' - ');
}

function homeArrow(className) {
  return el('span', { class: className, attrs: { 'aria-hidden': 'true' } });
}

function renderHomeProject(project, page) {
  const meta = projectMeta(project);
  return el('li', { class: 'home-project-item' }, [
    internalLink('home-project', projectUrl(page, project), [
      el('img', { class: 'home-project-img', src: project.image, alt: '', attrs: { draggable: 'false' } }),
      el('span', { class: 'home-project-text' }, [
        el('span', { class: 'home-project-title', text: project.title }),
        meta ? el('span', { class: 'home-project-meta', text: meta }) : null
      ]),
      homeArrow('home-project-arrow')
    ])
  ]);
}

function renderHomeMore(count, page) {
  return el('li', { class: 'home-project-item' }, [
    internalLink('home-project home-project-more', page.url, [
      el('span', { class: 'home-project-img home-project-more-tile', attrs: { 'aria-hidden': 'true' } }, [
        // The pixel font has no plus glyph, so CSS draws it.
        el('span', { class: 'home-slot-more-plus' }),
        document.createTextNode(String(count))
      ]),
      el('span', { class: 'home-project-text' }, [
        el('span', { class: 'home-project-title', text: 'See all projects' })
      ]),
      homeArrow('home-project-arrow')
    ], `${count} more ${count === 1 ? 'project' : 'projects'} - see all`)
  ]);
}

// The card isn't itself a link: its header goes to the section page and each
// row goes to that project.
function renderHomeButton(section, page) {
  const projects = section.projects || [];
  const count = projects.length;
  const overflow = count > HOME_SLOTS;
  const shown = overflow ? HOME_SLOTS - 1 : HOME_SLOTS;

  const rows = projects.slice(0, shown).map(p => renderHomeProject(p, page));
  if (overflow) rows.push(renderHomeMore(count - shown, page));

  const header = internalLink('home-card-header', page.url, [
    el('span', { class: 'home-card-badge', attrs: { 'aria-hidden': 'true' } }, [
      icon(page.icon || 'box', 'home-card-icon')
    ]),
    el('span', { class: 'home-card-headtext' }, [
      el('span', { class: 'home-card-title', text: section.heading }),
      el('span', { class: 'home-card-count', text: pluralProjects(count) })
    ]),
    homeArrow('home-card-arrow')
  ], `${section.heading} - ${pluralProjects(count)}`);

  return el('section', { class: 'home-card', attrs: { 'aria-label': section.heading } }, [
    header,
    rows.length ? el('ul', { class: 'home-projects' }, rows) : null
  ]);
}

// Sections without a matching entry in SITE_DATA.pages are skipped.
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

function renderStats(stats) {
  if (!stats) return;

  const grid = document.getElementById('stats-grid');
  if (grid) {
    (stats.stats || []).forEach(s => grid.appendChild(el('div', { class: 'stat-box' }, [
      s.icon ? icon(s.icon, 'icon-md') : null,
      el('span', { class: 'stat-value', text: s.value }),
      el('span', { class: 'stat-label', text: s.label })
    ])));
  }

  const note = document.getElementById('stats-note');
  if (note && stats.note) note.textContent = stats.note;

  const updated = document.getElementById('stats-updated');
  if (updated && stats.lastUpdated) updated.textContent = 'As of ' + stats.lastUpdated;
}

// Old copy-link URLs (index.html#better-craftables) now live on the section
// pages; forward them there. Returns true if it redirected.
function forwardOldDeepLink(sections, pages) {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return false;

  for (const section of sections) {
    const page = pages.find(p => p.section === section.heading);
    if (!page) continue;

    const matches = slugify(section.heading) === id || (section.projects || []).some(p => slugify(p.title) === id);
    if (matches) {
      location.replace(page.url + '#' + encodeURIComponent(id));
      return true;
    }
  }
  return false;
}

function findProject(title, sections, pages) {
  for (const section of sections) {
    const project = (section.projects || []).find(p => p.title === title);
    const page = pages.find(pg => pg.section === section.heading);
    if (project && page) return { project, url: projectUrl(page, project) };
  }
  return null;
}

// Right-hand card of the splash. `imageSrc` is its own banner picture, not
// the project's icon.
function renderFeaturedCard({ project, url }, imageSrc) {
  const stable = stableChannel(project);
  const downloads = ((stable && stable.downloads) || []).filter(d => !d.disabled);

  // One pill per kind of download ("Data Pack", "Mod").
  const kinds = new Map();
  downloads.forEach(d => { if (!kinds.has(d.label)) kinds.set(d.label, d); });
  const pills = [...kinds.values()].map(d =>
    el('li', { class: 'splash-chip' }, [icon(d.icon, 'icon-sm'), el('span', { text: d.label })])
  );

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

// Fills the splash from SITE_DATA.home.splash; stays hidden without one.
function renderSplash(home, sections, pages) {
  const wrap = document.getElementById('splash');
  const splash = home && home.splash;
  if (!wrap || !splash) return;

  const headline = document.getElementById('splash-headline');
  (splash.headline || []).forEach((text, i) => {
    headline.appendChild(el('span', { class: 'splash-line' + (i > 0 ? ' splash-line-accent' : ''), text }));
  });
  document.getElementById('splash-subtitle').textContent = splash.subtitle || '';

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

  // Without a featured project the text takes the full width.
  const found = splash.featured && findProject(splash.featured, sections, pages);
  const card = document.getElementById('splash-featured');
  if (found) {
    renderFeaturedCard(found, splash.featuredImage).forEach(n => n && card.appendChild(n));
  } else {
    card.remove();
    wrap.classList.add('splash-no-card');
  }

  wrap.hidden = false;
}

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
  renderStructuredData(SITE_DATA, null);
  initBackToTop();
})();
