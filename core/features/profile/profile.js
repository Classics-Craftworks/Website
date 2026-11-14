/* Profile feature: the home page of a personal "find me" site. Loads before home.js and registers with SITE_HOOKS.
   - splash card: SITE_DATA.home.splash.skinCard  ("Current skin" picture, badge, text and a button)
   - blocks: SITE_DATA.home.socials / related / explore, in that order (each { id, heading, intro, items }) */

const p36External = url => /^https?:\/\//i.test(url);

// A link to this site or elsewhere; external ones open in a new tab.
function p36Link(className, url, children, label) {
  if (p36External(url)) {
    const a = el('a', { href: url, class: className }, children);
    if (label) a.setAttribute('aria-label', label);
    return a;
  }
  return internalLink(className, url, children, label);
}

function p36Block(block, className, content) {
  const head = el('div', { class: 'home-block-head' }, [
    el('h2', { class: 'projects-heading', text: block.heading, attrs: block.id ? { id: block.id + '-heading' } : {} }),
    block.intro ? el('p', { class: 'projects-subtitle', text: block.intro }) : null
  ]);
  return el('section', { class: 'home-block ' + className, attrs: block.id ? { id: block.id, 'aria-labelledby': block.id + '-heading' } : {} }, [head, ...content]);
}

const p36Arrow = () => el('span', { class: 'p36-arrow', attrs: { 'aria-hidden': 'true' } });
const p36Badge = text => el('span', { class: 'p36-badge', attrs: { 'aria-hidden': 'true' } }, [document.createTextNode(text)]);

// "Social Media Profiles" and "Other profiles": the same tile grid. A tile's second line is its `handle` or its `text`.
function renderTiles(block, className) {
  const tiles = (block.items || []).map(s => {
    const sub = s.handle || s.text;
    return p36Link('p36-tile', s.url, [
      p36Badge(s.badge),
      el('span', { class: 'p36-tile-text' }, [
        el('span', { class: 'p36-tile-title', text: s.label }),
        sub ? el('span', { class: 'p36-tile-sub', text: sub }) : null
      ]),
      p36Arrow()
    ], `${s.label}${sub ? ': ' + sub : ''}${p36External(s.url) ? ' (opens in a new tab)' : ''}`);
  });
  return p36Block(block, className, [el('div', { class: 'p36-tiles' }, tiles)]);
}

// "More to explore": cards for the site's other pages; the heading has an "All extras" button.
function renderExplore(block) {
  const cards = (block.items || []).map(x => {
    const kids = [el('span', { class: 'p36-explore-title', text: x.label }), el('span', { class: 'p36-explore-text', text: x.text })];
    const cls = 'p36-explore' + (x.featured ? ' is-featured' : '');
    return x.url ? p36Link(cls, x.url, kids) : el('div', { class: cls }, kids);
  });
  const section = p36Block(block, 'p36-explore-block', [el('div', { class: 'p36-explore-grid' }, cards)]);
  if (block.button) {
    const head = section.querySelector('.home-block-head');
    head.classList.add('has-action');
    head.appendChild(p36Link('splash-btn splash-btn-ghost', block.button.url, [el('span', { text: block.button.label })]));
  }
  return section;
}

SITE_HOOKS.home.blocks.push(() => {
  const eyebrow = SITE_DATA.home && SITE_DATA.home.splash && SITE_DATA.home.splash.eyebrow;
  const headline = document.getElementById('splash-headline');
  if (eyebrow && headline) headline.parentNode.insertBefore(el('p', { class: 'p36-eyebrow', text: eyebrow }), headline);
  const main = document.getElementById('catalog');
  const home = SITE_DATA.home;
  if (!main || !home) return;
  if (home.socials) main.appendChild(renderTiles(home.socials, 'p36-socials'));
  if (home.related) main.appendChild(renderTiles(home.related, 'p36-related'));
  if (home.explore) main.appendChild(renderExplore(home.explore));
});

// The splash card: "Current skin".
SITE_HOOKS.home.featured = (splash, card) => {
  const cfg = splash.skinCard;
  if (!card || !cfg) return false;
  card.classList.add('p36-skin-card');
  card.setAttribute('aria-label', cfg.heading);
  const top = el('div', { class: 'splash-featured-top' }, [
    el('p', { class: 'splash-featured-label', text: cfg.heading }),
    cfg.badge ? el('span', { class: 'join-card-badge', text: cfg.badge }) : null
  ]);
  const media = el('div', { class: 'splash-featured-media p36-skin-media' }, [
    el('img', { class: 'p36-skin-img', src: cfg.image, alt: cfg.imageAlt || '', attrs: { draggable: 'false', width: '112', height: '112' } })
  ]);
  const foot = el('div', { class: 'splash-featured-foot' }, [
    el('p', { class: 'p36-skin-note', text: cfg.text }),
    cfg.button ? renderAction({ ...cfg.button, style: 'ghost' }) : null
  ]);
  [top, media, foot].forEach(n => card.appendChild(n));
  return true;
};
