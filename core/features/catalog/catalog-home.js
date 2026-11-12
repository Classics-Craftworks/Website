/* Catalogue feature, home page: the featured-project carousel in the splash, the "Projects" intro and one card
   per section. Registers with SITE_HOOKS.home (shell.js); loads before home.js. */

// Project rows per card; beyond this the last row becomes a "+X more" link.
const HOME_SLOTS = 4;

const pluralProjects = n => `${n} project${n === 1 ? '' : 's'}`;

function projectUrl(page, section, project) {
  return sitePath(page.url) + '#' + encodeURIComponent(projectId(section, project));
}

// "v8.0.0 · 26.3": first enabled download's version plus the stable channel's Minecraft version.
function projectMeta(project) {
  const ch = stableChannel(project);
  if (!ch) return '';

  const first = (ch.downloads || []).find(d => !d.disabled && d.version);
  return [first && first.version, ch.mcVersion].filter(Boolean).join(' · ');
}

// Tag text for a project with an "unsupported" channel in data.js: that channel's label ("Archived", "Unsupported"...).
function statusTag(project) {
  const ch = (project.channels || []).find(c => c.channel === 'unsupported');
  return ch ? (ch.label || 'Unsupported') : '';
}

function homeArrow(className) {
  return el('span', { class: className, attrs: { 'aria-hidden': 'true' } });
}

function renderHomeProject(project, section, page) {
  const meta = projectMeta(project);
  const tag = statusTag(project);
  return el('li', { class: 'home-project-item' }, [
    internalLink('home-project', projectUrl(page, section, project), [
      el('img', { class: 'home-project-img', src: project.image, alt: '', attrs: { draggable: 'false', width: '320', height: '320', loading: 'lazy', decoding: 'async' } }),
      el('span', { class: 'home-project-text' }, [
        el('span', { class: 'home-project-heading' }, [
          el('span', { class: 'home-project-title', text: project.title }),
          tag ? el('span', { class: 'home-project-tag', text: tag }) : null
        ]),
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
        // The pixel font has no plus glyph; CSS draws it.
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

function renderHomeButton(section, page) {
  const projects = section.projects || [];
  const count = projects.length;
  const overflow = count > HOME_SLOTS;
  const shown = overflow ? HOME_SLOTS - 1 : HOME_SLOTS;

  const rows = projects.slice(0, shown).map(p => renderHomeProject(p, section, page));
  if (overflow) rows.push(renderHomeMore(count - shown, page));

  const header = internalLink('home-card-header', page.url, [
    el('span', { class: 'home-card-badge', attrs: { 'aria-hidden': 'true' } }, [
      icon(page.icon || 'box', 'home-card-icon')
    ]),
    el('span', { class: 'home-card-headtext' }, [
      el('span', { class: 'home-card-title', text: section.heading }),
      el('span', { class: 'home-card-count', text: `Browse all ${pluralProjects(count)}` })
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
  if (grid.children.length) main.appendChild(grid);
}

// Forwards old home-page deep links (#better-craftables) to the section pages. Returns true if it redirected.
function forwardOldDeepLink(sections, pages) {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return false;

  for (const section of sections) {
    const page = pages.find(p => p.section === section.heading);
    if (!page) continue;

    const matches = slugify(section.heading) === id || (section.projects || []).some(p => slugify(p.title) === id);
    if (matches) {
      location.replace(sitePath(page.url) + '#' + encodeURIComponent(id));
      return true;
    }
  }
  return false;
}

function findProject(title, sections, pages) {
  for (const section of sections) {
    const project = (section.projects || []).find(p => p.title === title);
    const page = pages.find(pg => pg.section === section.heading);
    if (project && page) return { project, url: projectUrl(page, section, project) };
  }
  return null;
}

function renderFeaturedSlide({ project, url }, imageSrc) {
  const stable = stableChannel(project);
  const downloads = ((stable && stable.downloads) || []).filter(d => !d.disabled);

  // One pill per kind of download.
  const kinds = new Map();
  downloads.forEach(d => { if (!kinds.has(d.label)) kinds.set(d.label, d); });
  const pills = [...kinds.values()].map(d =>
    el('li', { class: 'splash-chip' }, [icon(d.icon, 'icon-sm'), el('span', { text: d.label })])
  );

  return el('div', { class: 'splash-featured-slide' }, [
    imageSrc ? el('div', { class: 'splash-featured-media' }, [
      el('img', { class: 'splash-featured-img', src: imageSrc, alt: '', attrs: { draggable: 'false', width: '1000', height: '400' } })
    ]) : null,
    el('div', { class: 'splash-featured-head' }, [
      el('h2', { class: 'splash-featured-title', text: project.title })
    ]),
    el('p', { class: 'splash-featured-desc', text: project.description || '' }),
    el('div', { class: 'splash-featured-foot' }, [
      pills.length ? el('ul', { class: 'splash-chips' }, pills) : el('span'),
      internalLink('splash-btn splash-btn-ghost', url, [
        el('span', { text: 'View Project' }),
        el('span', { class: 'splash-btn-arrow', attrs: { 'aria-hidden': 'true' } })
      ])
    ])
  ]);
}

// Normalises `featured` / `featuredImage` into [{ title, image }]: a single title (old format),
// or an array of titles or { title, image } objects.
function featuredEntries(splash) {
  const list = Array.isArray(splash.featured) ? splash.featured : (splash.featured ? [splash.featured] : []);
  return list
    .map((f, i) => typeof f === 'string'
      ? { title: f, image: i === 0 && !Array.isArray(splash.featured) ? splash.featuredImage : null }
      : { title: f.title, image: f.image })
    .filter(f => f.title);
}

const FEATURED_INTERVAL_MS = 8000;

// Auto-advancing slides (paused on hover/focus/hidden tab, never with reduced motion), plus dots, arrows and swipe.
function initFeaturedCarousel(card, slides, dotsWrap, prevBtn, nextBtn, counter, pauseBtn) {
  const dots = [...dotsWrap.children];
  let index = 0;
  let timer = null;
  let paused = false;     // temporary: hover / focus
  let userPaused = false; // explicit: pause button

  const slidesWrap = slides[0].parentElement;
  const SLIDE_MS = 380; // how long an outgoing slide keeps its "leaving" state

  // dir: 'next' slides content out to the left and the new slide in from the right; 'prev' mirrors it.
  function show(i, dir = 'next') {
    const prevIndex = index;
    index = (i + slides.length) % slides.length;
    slidesWrap.dataset.dir = dir;

    const incoming = slides[index];
    if (index !== prevIndex) {
      // Park the incoming slide on the correct side without animating, so it always enters from that side.
      incoming.style.transition = 'none';
      incoming.classList.remove('is-leaving');
      void incoming.offsetWidth;
      incoming.style.transition = '';

      const outgoing = slides[prevIndex];
      outgoing.classList.add('is-leaving');
      clearTimeout(outgoing._leaveTimer);
      outgoing._leaveTimer = setTimeout(() => outgoing.classList.remove('is-leaving'), SLIDE_MS);
    }

    slides.forEach((slide, n) => {
      const on = n === index;
      slide.classList.toggle('is-active', on);
      slide.inert = !on;
      slide.setAttribute('aria-hidden', on ? 'false' : 'true');
      dots[n].setAttribute('aria-current', on ? 'true' : 'false');
    });

    if (counter) {
      counter.textContent = `${index + 1}/${slides.length}`;
      counter.setAttribute('aria-label', `Project ${index + 1} of ${slides.length}`);
    }
  }

  function stop() { clearInterval(timer); timer = null; }
  function start() {
    stop();
    if (paused || userPaused || prefersReducedMotion() || document.hidden) return;
    timer = setInterval(() => show(index + 1, 'next'), FEATURED_INTERVAL_MS);
  }
  function go(i, dir) { show(i, dir || (i > index ? 'next' : 'prev')); start(); }

  function setUserPaused(on) {
    userPaused = on;
    pauseBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
    pauseBtn.setAttribute('aria-label', on ? 'Play automatic rotation' : 'Pause automatic rotation');
    pauseBtn.classList.toggle('is-paused', on);
    start();
  }
  pauseBtn.addEventListener('click', () => setUserPaused(!userPaused));

  dots.forEach((d, n) => d.addEventListener('click', () => go(n)));
  prevBtn.addEventListener('click', () => go(index - 1, 'prev'));
  nextBtn.addEventListener('click', () => go(index + 1, 'next'));

  card.addEventListener('mouseenter', () => { paused = true; stop(); });
  card.addEventListener('mouseleave', () => { paused = false; start(); });
  card.addEventListener('focusin', () => { paused = true; stop(); });
  card.addEventListener('focusout', () => { paused = false; start(); });
  document.addEventListener('visibilitychange', start);
  document.addEventListener(SETTINGS_EVENT, start); // reduced motion switched in Settings or on the device

  card.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { go(index - 1, 'prev'); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { go(index + 1, 'next'); e.preventDefault(); }
  });

  // Horizontal swipe: the slide follows the finger (with resistance), then either commits to the
  // next/previous slide or springs back. Vertical scrolling is left alone.
  let startX = null, startY = null, dragging = false;

  function setDrag(dx) {
    const slide = slides[index];
    if (dx === null) {
      slide.style.transition = '';
      slide.style.transform = '';
      slide.style.opacity = '';
      return;
    }
    slide.style.transition = 'none';
    slide.style.transform = `translateX(${dx * 0.45}px)`;
    slide.style.opacity = String(1 - Math.min(Math.abs(dx) / 260, 0.5));
  }

  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    dragging = false;
  }, { passive: true });

  card.addEventListener('touchmove', e => {
    if (startX === null || prefersReducedMotion()) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;
    if (!dragging && !(Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.5)) return;
    dragging = true;
    setDrag(dx);
  }, { passive: true });

  function endSwipe(e) {
    if (startX === null) return;
    const touch = e.changedTouches && e.changedTouches[0];
    const dx = touch ? touch.clientX - startX : 0;
    const dy = touch ? touch.clientY - startY : 0;
    startX = startY = null;
    if (dragging) setDrag(null); // release: the slide animates from where the finger left it
    dragging = false;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev');
  }
  card.addEventListener('touchend', endSwipe, { passive: true });
  card.addEventListener('touchcancel', endSwipe, { passive: true });

  show(0);
  start();
}

function renderFeatured(card, entries) {
  const multiple = entries.length > 1;
  const slidesWrap = el('div', { class: 'splash-featured-slides' }, entries.map(e => renderFeaturedSlide(e.found, e.image)));
  const slides = [...slidesWrap.children];

  const label = el('p', { class: 'splash-featured-label', text: multiple ? 'Featured projects' : 'Featured project' });
  if (!multiple) {
    card.append(label, slidesWrap);
    return;
  }

  const arrow = (dir, text) => el('button', {
    class: 'splash-featured-arrow splash-featured-arrow-' + dir,
    attrs: { type: 'button', 'aria-label': text }
  });
  const prev = arrow('prev', 'Previous featured project');
  const next = arrow('next', 'Next featured project');
  const dotsWrap = el('div', { class: 'splash-featured-dots' }, entries.map((e, n) => el('button', {
    class: 'splash-featured-dot',
    attrs: { type: 'button', 'aria-label': 'Show featured project ' + (n + 1) + ': ' + e.found.project.title }
  })));

  const pause = el('button', {
    class: 'splash-featured-arrow splash-featured-pause',
    attrs: { type: 'button', 'aria-label': 'Pause automatic rotation', 'aria-pressed': 'false' }
  });
  const counter = el('span', { class: 'splash-featured-count', attrs: { role: 'status' } });

  card.setAttribute('aria-roledescription', 'carousel');
  card.append(
    el('div', { class: 'splash-featured-top' }, [
      el('div', { class: 'splash-featured-heading' }, [label, counter]),
      el('div', { class: 'splash-featured-nav' }, [pause, prev, dotsWrap, next])
    ]),
    slidesWrap
  );
  initFeaturedCarousel(card, slides, dotsWrap, prev, next, counter, pause);
}

function renderProjectsIntro(home) {
  const wrap = document.getElementById('projects');
  if (!wrap) return;
  if (!home || !home.projectsHeading) { wrap.hidden = true; return; }
  document.getElementById('projects-heading').textContent = home.projectsHeading;
  document.getElementById('projects-subtitle').textContent = home.projectsSubtitle || '';
}

/* ---------- Plugging into the home page ---------- */

// Old home-page deep links (#better-craftables) go to the section pages.
SITE_HOOKS.home.redirect.push(() => forwardOldDeepLink(SITE_DATA.sections || [], SITE_DATA.pages || []));

// The splash's featured card: the projects named in SITE_DATA.home.splash.featured, if they exist.
SITE_HOOKS.home.featured = (splash, card) => {
  const sections = SITE_DATA.sections || [];
  const pages = SITE_DATA.pages || [];
  const entries = featuredEntries(splash)
    .map(f => ({ found: findProject(f.title, sections, pages), image: f.image }))
    .filter(f => f.found);
  if (!entries.length || !card) return false;
  renderFeatured(card, entries);
  return true;
};

SITE_HOOKS.home.blocks.push(() => {
  renderProjectsIntro(SITE_DATA.home);
  renderHomeButtons(SITE_DATA.sections || [], SITE_DATA.pages || []);
});
