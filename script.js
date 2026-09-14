/*
  Renders the page from SITE_DATA (see data.js).
  You shouldn't need to edit this file to update content —
  edit data.js instead. This file only needs changes if you
  want to change how things are laid out or behave.
*/

const ICONS = {
  github: '<path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.5 0-.24-.01-1.04-.01-1.88-2.78.62-3.37-1.23-3.37-1.23-.46-1.2-1.11-1.52-1.11-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.34 1.12 2.91.86.09-.67.35-1.12.64-1.38-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.9-1.33 2.74-1.05 2.74-1.05.56 1.41.21 2.45.1 2.71.65.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.79-4.58 5.05.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .28.18.61.69.5A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/>',
  modrinth: '<path d="M9.5 14.5l5-5M8 12l-1.8 1.8a3 3 0 0 0 4.2 4.2L12.5 16M16 12l1.8-1.8a3 3 0 0 0-4.2-4.2L11.5 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  discord: '<path d="M9.5 14.5l5-5M8 12l-1.8 1.8a3 3 0 0 0 4.2 4.2L12.5 16M16 12l1.8-1.8a3 3 0 0 0-4.2-4.2L11.5 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  reddit: '<path d="M9.5 14.5l5-5M8 12l-1.8 1.8a3 3 0 0 0 4.2 4.2L12.5 16M16 12l1.8-1.8a3 3 0 0 0-4.2-4.2L11.5 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  x: '<path d="M9.5 14.5l5-5M8 12l-1.8 1.8a3 3 0 0 0 4.2 4.2L12.5 16M16 12l1.8-1.8a3 3 0 0 0-4.2-4.2L11.5 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  document: '<path d="M7 3h7l4 4v14H7z" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M14 3v4h4" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9.5 12h5M9.5 15h5M9.5 9h2" stroke="currentColor" stroke-width="1.3"/>',
  link: '<path d="M9.5 14.5l5-5M8 12l-1.8 1.8a3 3 0 0 0 4.2 4.2L12.5 16M16 12l1.8-1.8a3 3 0 0 0-4.2-4.2L11.5 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  spigot: '<path d="M9.5 14.5l5-5M8 12l-1.8 1.8a3 3 0 0 0 4.2 4.2L12.5 16M16 12l1.8-1.8a3 3 0 0 0-4.2-4.2L11.5 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  download: '<path d="M12 4v11M8 11l4 4 4-4M5 19h14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
};

function icon(name, cls) {
  const body = ICONS[name] || ICONS.link;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'icon' + (cls ? ' ' + cls : ''));
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = body;
  return svg;
}

function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text) node.textContent = opts.text;
  if (opts.href) { node.href = opts.href; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
  if (opts.src) node.src = opts.src;
  if (opts.alt !== undefined) node.alt = opts.alt;
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  children.forEach(c => c && node.appendChild(c));
  return node;
}

function renderMeta(meta) {
  if (meta.title) document.title = meta.title;
  const setMeta = (name, content, isProp) => {
    if (!content) return;
    const sel = isProp ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let tag = document.head.querySelector(sel);
    if (!tag) {
      tag = document.createElement('meta');
      if (isProp) tag.setAttribute('property', name); else tag.setAttribute('name', name);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };
  setMeta('description', meta.description);
  setMeta('og:title', meta.title, true);
  setMeta('og:description', meta.description, true);
  setMeta('og:image', meta.shareImage, true);
  setMeta('og:url', meta.url, true);
  setMeta('twitter:card', 'summary_large_image');
}

function renderBrand(brand, topLinks) {
  const hero = document.getElementById('hero-banner');
  if (brand.heroImage) {
    hero.src = brand.heroImage;
    hero.alt = '';
  } else {
    hero.remove();
  }

  const logo = document.getElementById('brand-logo');
  logo.src = brand.logo;
  logo.alt = brand.name + ' logo';

  document.getElementById('brand-name').textContent = brand.name;
  document.getElementById('brand-tagline').textContent = brand.tagline;

  const nav = document.getElementById('top-links');
  topLinks.forEach(l => {
    nav.appendChild(el('a', { class: 'top-link', href: l.url }, [
      icon(l.icon, 'icon-sm'),
      el('span', { text: l.label })
    ]));
  });
}

function renderProject(p) {
  const linkRow = el('div', { class: 'project-links' });
  (p.links || []).forEach(l => {
    linkRow.appendChild(el('a', { class: 'text-link', href: l.url }, [
      icon(l.icon, 'icon-sm'),
      el('span', { text: l.label })
    ]));
  });

  const dlRow = el('div', { class: 'project-downloads' });
  (p.downloads || []).forEach(d => {
    dlRow.appendChild(el('a', { class: 'download-pill', href: d.url }, [
      icon('download', 'icon-sm'),
      el('span', { text: d.label })
    ]));
  });

  return el('article', { class: 'project' }, [
    el('img', { class: 'project-image', src: p.image, alt: p.title, attrs: { loading: 'lazy' } }),
    el('div', { class: 'project-body' }, [
      el('div', { class: 'project-heading' }, [
        el('h3', { text: p.title }),
        p.tag ? el('span', { class: 'tag', text: p.tag }) : null
      ]),
      el('p', { class: 'project-description', text: p.description }),
      linkRow,
      dlRow
    ])
  ]);
}

function renderSections(sections) {
  const main = document.getElementById('catalog');
  sections.forEach(section => {
    const list = el('div', { class: 'project-list' },
      section.projects.map(renderProject)
    );
    main.appendChild(el('section', { class: 'catalog-section' }, [
      el('h2', { text: section.heading }),
      list
    ]));
  });
}

function renderFooter(socials, footer) {
  const socialRow = document.getElementById('social-links');
  socials.forEach(s => {
    socialRow.appendChild(el('a', { class: 'social-link', href: s.url, attrs: { 'aria-label': s.label } }, [
      icon(s.icon, 'icon-md')
    ]));
  });
  document.getElementById('copyright').textContent = footer.copyright;
  document.getElementById('disclaimer').textContent = footer.disclaimer;
}

(function init() {
  renderMeta(SITE_DATA.meta);
  renderBrand(SITE_DATA.brand, SITE_DATA.topLinks);
  renderSections(SITE_DATA.sections);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer);
})();
