/* ============================================================
   SECTION PAGE — SHARED RENDER SCRIPT

   Shared by every standalone single-section page (data-packs-mods.html,
   resource-packs.html, other-projects.html, and any future ones). It
   reads the same SITE_DATA (data.js) and reuses the exact same
   brand/footer/project/channel rendering as the main catalog
   (script.js), so these pages always look and behave identically to
   that part of it — only the section heading itself is different:
   plain text instead of the main page's collapsible <details>/
   <summary> accordion, and a page-switcher nav bar instead of a
   jump-to-section one.

   Edit data.js to change text/links/projects/pages (same as the main
   page). Edit this file to change how every section page is built.
   Each page then just has one tiny script of its own — see the
   bottom of this file for initSectionPage().
   ============================================================ */

/* ---------- Small helper functions (same as script.js) ---------- */

function icon(name, cls) {
  const span = document.createElement('span');
  span.className = 'icon' + (cls ? ' ' + cls : '');
  span.setAttribute('aria-hidden', 'true');
  const url = `url('images/icons/${name || 'link'}.svg')`;
  span.style.webkitMaskImage = url;
  span.style.maskImage = url;
  return span;
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const usedSlugs = new Set();
function assignSlug(text, fallback) {
  let base = slugify(text) || fallback;
  let slug = base;
  let n = 2;
  while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
  usedSlugs.add(slug);
  return slug;
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

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

// ---------- Layout: transform instead of wrap (same as script.js) ----------
function headerWraps(header) {
  const label = header && header.querySelector('.channel-label');
  const group = header && header.querySelector('.channel-mc-group');
  return !!(label && group && group.offsetTop > label.offsetTop + 1);
}

function pillWraps(header) {
  const label = header.querySelector('.download-type-label');
  const pill = header.querySelector('.pill');
  return !!(label && pill && pill.offsetTop > label.offsetTop + 1);
}

function layoutChannelRow(rowEl) {
  const groups = Array.from(rowEl.querySelectorAll(':scope > .channel-group'));
  if (!groups.length) return;

  rowEl.classList.remove('stacked');
  const anyHeaderNeedsRoom = groups.some(g => headerWraps(g.querySelector('.channel-header')));
  if (anyHeaderNeedsRoom) rowEl.classList.add('stacked');

  groups.forEach(g => {
    const header = g.querySelector('.channel-header');
    header.classList.remove('header-force-wrap');
    if (headerWraps(header)) header.classList.add('header-force-wrap');
  });

  const downloadLists = groups.map(g => g.querySelector('.channel-downloads')).filter(Boolean);
  downloadLists.forEach(dl => dl.classList.remove('downloads-stacked'));
  const anyPillNeedsRoom = downloadLists.some(dl => {
    const headers = Array.from(dl.querySelectorAll('.download-col-header'));
    return headers.length > 1 && headers.some(pillWraps);
  });
  if (anyPillNeedsRoom) downloadLists.forEach(dl => dl.classList.add('downloads-stacked'));
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* quota / privacy error — ignore */ }
}

function setHashSilently(id) {
  const url = `${location.origin}${location.pathname}#${id}`;
  try { history.pushState(null, '', url); } catch { /* not fatal */ }
  return url;
}

// Small "copy link" button used on project titles (same as script.js).
function copyLinkButton(id, label) {
  const btn = el('button', {
    class: 'copy-link-btn',
    attrs: {
      type: 'button',
      'aria-label': 'Copy link to ' + label,
      'data-tooltip': 'Copy link'
    }
  }, [icon('link', 'icon-sm')]);

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();

    const url = setHashSilently(id);

    const showCopied = () => {
      btn.classList.add('is-copied');
      btn.setAttribute('data-tooltip', 'Copied!');
      window.clearTimeout(btn._copiedTimer);
      btn._copiedTimer = window.setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.setAttribute('data-tooltip', 'Copy link');
      }, 1500);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(showCopied).catch(() => {});
    } else {
      const temp = document.createElement('textarea');
      temp.value = url;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try { document.execCommand('copy'); showCopied(); } catch { /* copy unsupported */ }
      document.body.removeChild(temp);
    }
  });

  return btn;
}

/* ---------- Page pieces (brand/footer identical to script.js) ---------- */

function renderBrand(brand, topLinks) {
  const logo = document.getElementById('brand-logo');
  logo.src = brand.logo;
  logo.alt = brand.name + ' logo';

  document.getElementById('brand-name').textContent = brand.name;
  document.getElementById('brand-tagline').innerHTML = brand.tagline;

  const nav = document.getElementById('top-links');
  topLinks.forEach(l => {
    nav.appendChild(el('a', { class: 'top-link', href: l.url }, [
      icon(l.icon, 'icon-sm'),
      el('span', { text: l.label })
    ]));
  });
}

function renderChannelBadge(ch, badgeKey) {
  const badgeText = String(ch.badge).toLowerCase() === 'updated' ? 'Updated' : 'New';

  const versionFingerprint = (ch.downloads || [])
    .map(d => d.version || 'N/A')
    .join('|');

  const dismissedVersion = storageGet(badgeKey);
  if (dismissedVersion === versionFingerprint) return null;

  const wrap = el('button', {
    class: 'channel-badge',
    attrs: {
      type: 'button',
      'data-badge': badgeText.toLowerCase(),
      'aria-label': 'Dismiss "' + badgeText + '" label'
    }
  }, [
    el('span', { class: 'channel-badge-text', text: badgeText }),
    el('span', { class: 'channel-badge-dismiss' })
  ]);

  wrap.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    storageSet(badgeKey, versionFingerprint);
    wrap.classList.add('is-dismissed');
    wrap.addEventListener('transitionend', () => wrap.remove(), { once: true });
    window.setTimeout(() => wrap.remove(), 250);
  });

  return wrap;
}

function renderChannel(ch, projectId) {
  const channelKey = (ch.channel || 'stable').toLowerCase();

  const header = el('div', { class: 'channel-header' }, [
    el('span', { class: 'status-dot' }),
    el('span', { class: 'channel-label', text: ch.label }),
    el('span', { class: 'channel-mc-group' }, [
      el('span', { class: 'channel-sep', text: '|' }),
      el('span', { class: 'channel-mc', text: 'Java ' + ch.mcVersion })
    ])
  ]);

  const badge = ch.badge ? renderChannelBadge(ch, `badge-dismissed:${projectId}:${channelKey}`) : null;

  const downloads = el('div', { class: 'channel-downloads' });

  (ch.downloads || []).forEach(d => {
    const typeIcon = d.icon || 'box';
    const isDisabled = d.disabled || !d.url;

    const headerChildren = [
      icon(typeIcon, 'icon-sm'),
      el('span', { class: 'download-type-label', text: d.label }),
      el('span', { class: 'pill' + (isDisabled ? ' disabled-pill' : ''), text: isDisabled ? 'N/A' : (d.version || 'N/A') })
    ];

    const colHeader = el('div', {
      class: 'download-col-header' + (isDisabled ? ' is-disabled' : '')
    }, headerChildren);

    let actionEl;
    if (isDisabled) {
      const unavailableAttrs = {};
      if (d.tooltip) {
        unavailableAttrs['data-tooltip'] = d.tooltip;
        unavailableAttrs['tabindex'] = '0';
        unavailableAttrs['aria-label'] = `Not available: ${d.tooltip}`;
      }
      actionEl = el('div', {
        class: 'download-unavailable' + (d.tooltip ? ' has-tooltip' : ''),
        text: 'Not available',
        attrs: unavailableAttrs
      });

      if (d.tooltip) {
        actionEl.addEventListener('click', () => {
          actionEl.classList.add('tooltip-open');
          window.clearTimeout(actionEl._tooltipTimer);
          actionEl._tooltipTimer = window.setTimeout(() => {
            actionEl.classList.remove('tooltip-open');
          }, 3000);
        });
      }
    } else {
      actionEl = el('a', {
        class: 'download-btn',
        href: d.url
      }, [
        icon('download', 'icon-sm'),
        el('span', { text: 'Download' })
      ]);
    }

    downloads.appendChild(el('div', {
      class: 'download-col' + (isDisabled ? ' is-disabled' : '')
    }, [colHeader, actionEl]));
  });

  return el('div', {
    class: 'channel-group',
    attrs: { 'data-channel': channelKey }
  }, [badge, header, downloads]);
}

function renderVersionsNote(p) {
  if (!p.channels || !p.channels.length) return null;

  const modrinthLink = (p.links || []).find(l => (l.label || '').toLowerCase() === 'modrinth');
  const githubLink = (p.links || []).find(l => (l.label || '').toLowerCase() === 'github');
  if (!modrinthLink && !githubLink) return null;

  const note = el('p', { class: 'versions-note' });
  note.appendChild(document.createTextNode('Older versions: '));
  if (modrinthLink) {
    note.appendChild(el('a', { class: 'versions-note-link', href: `${modrinthLink.url}/versions`, text: 'Modrinth' }));
  }
  if (modrinthLink && githubLink) {
    note.appendChild(document.createTextNode(' | '));
  }
  if (githubLink) {
    note.appendChild(el('a', { class: 'versions-note-link', href: `${githubLink.url}/wiki/Versions`, text: 'GitHub' }));
  }
  return note;
}

function renderProject(p) {
  const linkRow = el('div', { class: 'project-links' });
  (p.links || []).forEach(l => {
    linkRow.appendChild(el('a', { class: 'text-link', href: l.url }, [
      icon(l.icon, 'icon-sm'),
      el('span', { text: l.label })
    ]));
  });

  const id = assignSlug(p.title, 'project');

  const channelRow = el('div', { class: 'channel-row' },
    (p.channels || []).map(ch => renderChannel(ch, id))
  );

  if (window.ResizeObserver) {
    new ResizeObserver(() => layoutChannelRow(channelRow)).observe(channelRow);
  }

  const versionText = (p.channels || [])
    .flatMap(ch => [ch.mcVersion, ...(ch.downloads || []).map(d => d.version)])
    .filter(Boolean)
    .join(' ');
  const searchText = [p.title, p.description, versionText].filter(Boolean).join(' ').toLowerCase();

  const titleRow = el('div', { class: 'project-title-row' }, [
    el('h3', { text: p.title }),
    copyLinkButton(id, p.title)
  ]);

  return el('article', { class: 'project', attrs: { 'data-search': searchText, id } }, [
    el('img', { class: 'project-image', src: p.image, alt: p.title, attrs: { loading: 'lazy' } }),
    el('div', { class: 'project-body' }, [
      titleRow,
      el('p', { class: 'project-description', text: p.description }),
      linkRow,
      channelRow,
      renderVersionsNote(p)
    ])
  ]);
}

// Builds the sticky page-switcher bar: one link per page in
// SITE_DATA.pages, with whichever one matches currentUrl shown as a
// filled, non-clickable pill (reusing the main page's
// .nav-jump-btn/.is-open look for its jump buttons) — in place of the
// main page's same-page "jump to section" buttons, since each of
// these pages only has one section to jump to.
function renderPageNav(pages, currentUrl) {
  const nav = document.getElementById('page-nav');
  if (!nav || !pages || !pages.length) return;

  const row = el('div', { class: 'nav-jump-row' });
  pages.forEach(p => {
    if (p.url === currentUrl) {
      // Not a link — you're already here. aria-current tells screen
      // readers this is the active page, same as a normal site nav.
      row.appendChild(el('span', {
        class: 'nav-jump-btn is-open',
        text: p.label,
        attrs: { 'aria-current': 'page' }
      }));
      return;
    }
    // Built by hand rather than via el()'s href shortcut — that
    // shortcut always opens links in a new tab (right for the
    // external Modrinth/GitHub links elsewhere on the page), but page
    // navigation should stay in the same tab.
    const a = document.createElement('a');
    a.className = 'nav-jump-btn';
    a.textContent = p.label;
    a.href = p.url;
    row.appendChild(a);
  });
  nav.appendChild(row);

  // Keeps a linked/scrolled-to heading or project clear of this bar
  // while it's sticky, same idea as the main page's own section-nav.
  const syncScrollOffset = () => {
    const rect = nav.getBoundingClientRect();
    const navTop = parseFloat(getComputedStyle(nav).top) || 0;
    const offset = navTop + rect.height + 16;
    document.documentElement.style.setProperty('--sticky-nav-offset', `${Math.round(offset)}px`);
  };
  syncScrollOffset();
  if (window.ResizeObserver) {
    new ResizeObserver(syncScrollOffset).observe(nav);
  } else {
    window.addEventListener('resize', syncScrollOffset);
  }
}

// Builds this page's one section: a plain-text heading (no
// collapse/expand — see the main page's <details>/<summary> +
// Accordion class for the version this replaces) followed by its
// project cards, same markup as the main catalog's .project-list.
function renderFlatSection(section) {
  const main = document.getElementById('catalog');
  if (!main || !section) return [];

  const id = assignSlug(section.heading, 'section');
  const heading = el('h2', { class: 'flat-section-heading', text: section.heading, attrs: { id } });

  const projectEls = section.projects.map(renderProject);
  const list = el('div', { class: 'project-list' }, projectEls);

  main.appendChild(heading);
  main.appendChild(list);

  return projectEls;
}

function renderFooter(socials, footer, version) {
  const socialRow = document.getElementById('social-links');
  socials.forEach(s => {
    socialRow.appendChild(el('a', {
      class: 'social-link',
      href: s.url,
      attrs: {
        'aria-label': s.label,
        'data-tooltip': s.label
      }
    }, [
      icon(s.icon, 'icon-md')
    ]));
  });

  document.getElementById('copyright').textContent = footer.copyright;
  document.getElementById('disclaimer').textContent = footer.disclaimer;

  if (footer.iconCredits) {
    const creditsEl = document.getElementById('icon-credits');
    creditsEl.innerHTML = '';
    if (footer.iconCredits.prefix) {
      creditsEl.appendChild(document.createTextNode(footer.iconCredits.prefix));
    }
    creditsEl.appendChild(el('a', {
      href: footer.iconCredits.url,
      class: 'credits-link',
      text: footer.iconCredits.label
    }));
  }

  if (version) {
    const versionEl = document.getElementById('site-version');
    versionEl.innerHTML = '';

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

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  const SHOW_AFTER = 400;

  const updateVisibility = () => {
    btn.classList.toggle('is-visible', window.scrollY > SHOW_AFTER);
  };
  updateVisibility();
  window.addEventListener('scroll', updateVisibility, { passive: true });

  btn.addEventListener('click', () => {
    const reduceMotion = prefersReducedMotion();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

// Since nothing on these pages is collapsible, a #project-id or
// #section-id link just needs a scroll — no expanding required (unlike
// handleDeepLink() on the main page, which has to open an accordion
// section first).
function handleDeepLink() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;
  const target = document.getElementById(id);
  if (!target) return;

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'auto', block: 'start' });

    if (target.classList.contains('project')) {
      target.classList.add('is-linked-target');
      target.addEventListener('animationend', () => target.classList.remove('is-linked-target'), { once: true });
    }
  });
}

// Same idea as script.js's renderStructuredData(), scoped to just one
// page's one section so search engines get an accurate JSON-LD
// picture of what's actually on that page.
function renderStructuredData(data, section) {
  const canonical = document.querySelector('link[rel="canonical"]');
  const siteUrl = canonical ? canonical.href : location.origin + '/';
  const toAbsolute = path => path ? new URL(path, siteUrl).href : undefined;
  const tagline = (data.brand.tagline || '').replace(/<br\s*\/?>/gi, ' ').trim();

  const organization = {
    '@type': 'Organization',
    name: data.brand.name,
    url: siteUrl,
    logo: toAbsolute(data.brand.logo),
    description: tagline,
    sameAs: [...(data.topLinks || []), ...(data.socials || [])].map(l => l.url)
  };

  const items = (section?.projects || []).map(project => {
    const channels = project.channels || [];
    const stable = channels.find(c => (c.channel || '').toLowerCase() === 'stable') || channels[0];
    const firstDownload = stable && (stable.downloads || []).find(d => d.url && !d.disabled);
    const firstLink = (project.links || [])[0];

    const item = {
      '@type': 'SoftwareApplication',
      name: project.title,
      description: project.description,
      image: toAbsolute(project.image),
      url: (firstLink && firstLink.url) || siteUrl,
      applicationCategory: 'GameApplication',
      operatingSystem: 'Minecraft: Java Edition'
    };
    const softwareVersion = firstDownload && firstDownload.version;
    if (softwareVersion) item.softwareVersion = softwareVersion;
    if (firstDownload) item.downloadUrl = firstDownload.url;
    return item;
  });

  const itemList = {
    '@type': 'ItemList',
    name: `${data.brand.name} ${section ? section.heading : 'Projects'}`,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item
    }))
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [organization, itemList]
  });
  document.head.appendChild(script);
}

/* ---------- Entry point ----------
   Each section page's own tiny script calls this with its own
   filename (matching a "url" in SITE_DATA.pages, see data.js), e.g.:

     initSectionPage('data-packs-mods.html');

   That's the only thing that differs between these pages — everything
   above is shared. */
function initSectionPage(pageUrl) {
  renderBrand(SITE_DATA.brand, SITE_DATA.topLinks);

  const pages = SITE_DATA.pages || [];
  renderPageNav(pages, pageUrl);

  // Looks up which catalog section this page is for via its own entry
  // in SITE_DATA.pages, so the two can never drift apart. Falls back
  // to the first section if data.js is ever missing that entry.
  const pageEntry = pages.find(p => p.url === pageUrl);
  const section = (SITE_DATA.sections || []).find(s => s.heading === (pageEntry && pageEntry.section)) || SITE_DATA.sections[0];

  renderFlatSection(section);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderStructuredData(SITE_DATA, section);
  initBackToTop();
  handleDeepLink();
  window.addEventListener('hashchange', handleDeepLink);
}
