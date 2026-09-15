/*
  Renders the page from SITE_DATA (see data.js).
  You shouldn't need to edit this file to update content —
  edit data.js instead. This file only needs changes if you
  want to change how things are laid out or behave.
*/

// Icons are plain SVG files in images/icons/ — this paints them
// using the calling element's current text color, so a link's
// icon and its label always match (including on hover).
function icon(name, cls) {
  const span = document.createElement('span');
  span.className = 'icon' + (cls ? ' ' + cls : '');
  span.setAttribute('aria-hidden', 'true');
  const url = `url('images/icons/${name || 'link'}.png')`;
  span.style.webkitMaskImage = url;
  span.style.maskImage = url;
  return span;
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

function renderRelease(release) {
  const isBeta = release.channel === 'beta';

  // Top Header: Status Dot + Label + Divider + MC Version
  const header = el('div', { class: 'release-header' }, [
    el('span', { class: 'status-dot' + (isBeta ? ' beta' : '') }),
    el('span', { class: 'release-label', text: release.label }),
    el('span', { class: 'release-sep', text: '|' }),
    el('span', { class: 'release-mc', text: release.mcVersion })
  ]);

  // Main download columns container
  const downloads = el('div', { class: 'release-downloads' });

  (release.downloads || []).forEach(d => {
    const isMod = d.label.toLowerCase().includes('mod');
    const typeIcon = d.icon || (isMod ? 'gear' : 'box');
    const isDisabled = d.disabled || !d.url;

    // Build Header Children (always includes icon for vertical alignment)
    const headerChildren = [
      icon(typeIcon, 'icon-sm'),
      el('span', { class: 'download-type-label', text: d.label }),
      el('span', { class: 'pill' + (isDisabled ? ' disabled-pill' : ''), text: isDisabled ? 'N/A' : release.version })
    ];

    const colHeader = el('div', { 
      class: 'download-col-header' + (isDisabled ? ' is-disabled' : '') 
    }, headerChildren);

    // Build Action Element (Download button or "Not available" text)
    let actionEl;
    if (isDisabled) {
      actionEl = el('div', { class: 'download-unavailable', text: 'Not available' });
    } else {
      actionEl = el('a', { 
        class: 'download-btn' + (isBeta ? ' beta' : ' release'), 
        href: d.url 
      }, [
        icon('download', 'icon-sm'),
        el('span', { text: 'Download' })
      ]);
    }

    // Individual Column Box
    downloads.appendChild(el('div', { 
      class: 'download-col' + (isDisabled ? ' is-disabled' : '') 
    }, [colHeader, actionEl]));
  });

  return el('div', { class: 'release-group' + (isBeta ? ' beta' : '') }, [header, downloads]);
}

function renderProject(p) {
  const linkRow = el('div', { class: 'project-links' });
  (p.links || []).forEach(l => {
    linkRow.appendChild(el('a', { class: 'text-link', href: l.url }, [
      icon(l.icon, 'icon-sm'),
      el('span', { text: l.label })
    ]));
  });

  const releaseRow = el('div', { class: 'release-row' },
    (p.releases || []).map(renderRelease)
  );

  return el('article', { class: 'project' }, [
    el('img', { class: 'project-image', src: p.image, alt: p.title, attrs: { loading: 'lazy' } }),
    el('div', { class: 'project-body' }, [
      el('h3', { text: p.title }),
      el('p', { class: 'project-description', text: p.description }),
      linkRow,
      releaseRow
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

function renderFooter(socials, footer, version) {
  const socialRow = document.getElementById('social-links');
  socials.forEach(s => {
    socialRow.appendChild(el('a', { class: 'social-link', href: s.url, attrs: { 'aria-label': s.label } }, [
      icon(s.icon, 'icon-md')
    ]));
  });
  document.getElementById('copyright').textContent = footer.copyright;
  document.getElementById('disclaimer').textContent = footer.disclaimer;

  if (version) {
    const versionEl = document.getElementById('site-version');
    versionEl.innerHTML = ''; // Clear existing content

    const versionLabel = typeof version === 'object' ? version.label : version;
    const versionUrl = typeof version === 'object' ? version.url : null;

    if (versionUrl) {
      versionEl.appendChild(el('a', { 
        href: versionUrl, 
        class: 'version-link',
        text: versionLabel 
      }));
    } else {
      versionEl.textContent = versionLabel;
    }
  }
}

(function init() {
  renderMeta(SITE_DATA.meta);
  renderBrand(SITE_DATA.brand, SITE_DATA.topLinks);
  renderSections(SITE_DATA.sections);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
})();
