/* Home page shell: splash banner, news preview and stats. What fills the main area (the catalogue's project
   cards, the landing blocks) and the splash's featured card come from the features the site enabled, through
   SITE_HOOKS.home (shell.js). */

// A trailing "+" is drawn by CSS (.stat-plus) since the pixel font lacks it; the real one stays for screen readers.
function statValue(value) {
  const text = String(value);
  const hasPlus = text.endsWith('+');
  const kids = [document.createTextNode(hasPlus ? text.slice(0, -1) : text)];
  if (hasPlus) kids.push(el('span', { class: 'stat-plus', attrs: { 'aria-hidden': 'true' } }), el('span', { class: 'visually-hidden', text: '+' }));
  return el('span', { class: 'stat-value' }, kids);
}

// One figure with its label. A `tooltip` explains how the figure is measured: it opens on hover or
// keyboard focus, toggles on tap, and is also in the page text for screen readers.
function renderStat(s) {
  const hasTip = !!s.tooltip;
  const box = el('div', {
    class: 'stat-box' + (hasTip ? ' has-tooltip' : ''),
    attrs: hasTip ? { 'data-tooltip': s.tooltip, tabindex: '0' } : {}
  }, [
    statValue(fillPlaceholders(s.value)),
    el('span', { class: 'stat-label-row' }, [
      s.icon ? icon(s.icon, 'icon-sm') : null,
      el('span', { class: 'stat-label', text: s.label })
    ]),
    hasTip ? el('span', { class: 'visually-hidden', text: '. ' + s.tooltip }) : null
  ]);

  if (hasTip) {
    box.addEventListener('click', () => {
      box.classList.toggle('tooltip-open');
      window.clearTimeout(box._tooltipTimer);
      box._tooltipTimer = window.setTimeout(() => box.classList.remove('tooltip-open'), 5000);
    });
  }
  return box;
}

function renderStats(stats) {
  if (!stats) return;

  const grid = document.getElementById('stats-grid');
  if (grid) {
    (stats.stats || []).forEach(s => grid.appendChild(renderStat(s)));
  }

  const updated = document.getElementById('stats-updated');
  if (updated && stats.lastUpdated) updated.textContent = 'As of ' + displayDate(stats.lastUpdated, 'long');
}

const isExternalUrl = url => /^https?:\/\//i.test(url);

// A button: absolute urls open in a new tab, everything else is a link within the site.
function renderAction({ label, url, icon: iconName, style }) {
  const cls = 'splash-btn ' + (style === 'primary' ? 'splash-btn-primary' : 'splash-btn-ghost');
  const kids = [
    iconName ? icon(iconName, 'icon-sm') : null,
    el('span', { text: label }),
    el('span', { class: 'splash-btn-arrow', attrs: { 'aria-hidden': 'true' } })
  ];
  if (isExternalUrl(url)) return el('a', { href: url, class: cls }, kids);
  return internalLink(cls, url, kids);
}

// Fills the splash from SITE_DATA.home.splash (hidden without one).
function renderSplash(home) {
  const wrap = document.getElementById('splash');
  const splash = home && home.splash;
  if (!wrap || !splash) return;

  const headline = document.getElementById('splash-headline');
  (splash.headline || []).forEach((text, i) => {
    headline.appendChild(el('span', { class: 'splash-line' + (i > 0 ? ' splash-line-accent' : ''), text }));
  });
  document.getElementById('splash-subtitle').textContent = splash.subtitle || '';

  const actions = document.getElementById('splash-actions');
  if (Array.isArray(splash.actions)) {
    // The site lists its own buttons (a site without a project catalogue has no "Browse projects").
    splash.actions.forEach(a => actions.appendChild(renderAction(a)));
  } else {
    actions.appendChild(internalLink('splash-btn splash-btn-primary', '#projects', [
      icon('compass', 'icon-sm'),
      el('span', { text: 'Browse projects' }),
      el('span', { class: 'splash-btn-arrow', attrs: { 'aria-hidden': 'true' } })
    ]));
  }
  // About is already in the nav; the second button jumps to the latest news further down.
  // It is removed again after the news section renders if there is no news to show.
  if (document.getElementById('latest-news')) {
    const newsBtn = internalLink('splash-btn splash-btn-ghost', '#latest-news', [
      icon('news', 'icon-sm'),
      el('span', { text: 'Latest news' })
    ]);
    newsBtn.id = 'splash-news-btn';
    actions.appendChild(newsBtn);
  }

  // The featured card belongs to the catalogue; without it (or without anything to feature) the splash has no card.
  const card = document.getElementById('splash-featured');
  if (!(SITE_HOOKS.home.featured && SITE_HOOKS.home.featured(splash, card))) {
    if (card) card.remove();
    wrap.classList.add('splash-no-card');
  }

  wrap.hidden = false;
}

(function init() {
  const pages = SITE_DATA.pages || [];

  if (SITE_HOOKS.home.redirect.some(redirect => redirect())) return;

  renderBrand(SITE_DATA.brand);
  renderSiteHeader(pages, '/');
  renderSplash(SITE_DATA.home);
  SITE_HOOKS.home.blocks.forEach(block => block());
  renderNewsPreview();
  { const nb = document.getElementById('splash-news-btn'), ns = document.getElementById('latest-news'); if (nb && ns && ns.hidden) nb.remove(); }
  renderStats(typeof STATS_DATA !== 'undefined' ? STATS_DATA : null);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderStructuredData(SITE_DATA, null);
  clearSkeletons();
  initBackToTop();
})();
