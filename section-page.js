/* ============================================================
   SHARED RENDER SCRIPT

   Loaded by every page. Reads SITE_DATA (data.js) and builds the
   brand header, page nav, project cards and footer. A section page
   marks itself with a data-page attribute on <body>, read at the
   bottom of this file — see initSectionPage(). The home page's
   section buttons live in index.js, search in search.js.

   Edit data.js for content, this file for how pages are built.
   ============================================================ */

/* ---------- Small helper functions ---------- */

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
    .replace(/['\u2019]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Returns a slug for `text` that isn't already in the `used` set (adding
// "-2", "-3"... if it is), and records it there.
function uniqueSlug(text, fallback, used) {
  const base = slugify(text) || fallback;
  let slug = base;
  let n = 2;
  while (used.has(slug)) slug = `${base}-${n++}`;
  used.add(slug);
  return slug;
}

const usedSlugs = new Set();
function assignSlug(text, fallback) {
  return uniqueSlug(text, fallback, usedSlugs);
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

// ---------- Layout: transform instead of wrap ----------
// Channel boxes and their download columns stack instead of letting
// text wrap mid-line; layoutChannelRow() picks the arrangement that
// fits and is re-run whenever the row resizes.
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

// Small "copy link" button used on project titles.
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

/* ---------- Page pieces ---------- */

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

  const titleRow = el('div', { class: 'project-title-row' }, [
    el('h3', { text: p.title }),
    copyLinkButton(id, p.title)
  ]);

  return el('article', { class: 'project', attrs: { id } }, [
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

// Returns the number of undismissed "New"/"Updated" badges across all
// projects on `page` (matched via its "section" field to
// SITE_DATA.sections). Mirrors the dismissal check renderChannelBadge()
// does when actually building a badge, without rendering anything -
// SITE_DATA has every section's data on every page, so this can be
// computed for other pages, not just the current one. Slugs are
// recomputed with a fresh, page-local Set (rather than the shared
// usedSlugs) so they match what that page's own titles would slugify
// to when it's the one being rendered.
function countUndismissedBadges(page) {
  const section = (SITE_DATA.sections || []).find(s => s.heading === page.section);
  if (!section) return 0;

  const slugs = new Set();
  let count = 0;
  (section.projects || []).forEach(p => {
    const projectId = uniqueSlug(p.title, 'project', slugs);
    (p.channels || []).forEach(ch => {
      if (!ch.badge) return;
      const channelKey = (ch.channel || 'stable').toLowerCase();
      const versionFingerprint = (ch.downloads || [])
        .map(d => d.version || 'N/A')
        .join('|');
      const dismissedVersion = storageGet(`badge-dismissed:${projectId}:${channelKey}`);
      if (dismissedVersion !== versionFingerprint) count++;
    });
  });
  return count;
}

// Small yellow count pill appended to a nav button for a page that
// still has undismissed "New"/"Updated" badges somewhere on it - a
// hint to visit even when that page isn't the one currently open.
// Caps the displayed number at 9 ("9+") so the pill doesn't have to
// grow to fit wider text. `title` gives sighted mouse users a hover
// tooltip; `aria-label` gives the same "X new updates" wording to
// screen readers instead of the bare number (which is hidden from
// them via aria-hidden, since it'd otherwise be read twice).
function navBadgeDot(count) {
  const label = count > 9 ? '9+' : String(count);
  const words = count === 1 ? 'update' : 'updates';
  const text = `${count} new ${words}`;
  return el('span', {
    class: 'nav-jump-dot',
    attrs: { title: text, 'aria-label': text }
  }, [
    el('span', { attrs: { 'aria-hidden': 'true' }, text: label })
  ]);
}

// Builds the sticky page-switcher bar: one link per page in
// SITE_DATA.pages, with whichever one matches currentUrl shown as a
// filled, non-clickable pill.
function renderPageNav(pages, currentUrl) {
  const nav = document.getElementById('page-nav');
  if (!nav || !pages || !pages.length) return;

  // One entry per nav button, kept around so the pageshow handler
  // (below) can re-check and update them later without rebuilding the
  // bar.
  const badgeTargets = [];

  const row = el('div', { class: 'nav-jump-row' });
  pages.forEach(p => {
    const count = countUndismissedBadges(p);
    const dot = count > 0 ? navBadgeDot(count) : null;

    if (p.url === currentUrl) {
      // Not a link — you're already here. aria-current tells screen
      // readers this is the active page, same as a normal site nav.
      const btn = el('span', {
        class: 'nav-jump-btn is-open',
        attrs: { 'aria-current': 'page' }
      }, [
        icon(p.icon, 'icon-sm'),
        el('span', { text: p.label }),
        dot
      ]);
      row.appendChild(btn);
      badgeTargets.push({ page: p, target: btn });
      return;
    }
    // Built by hand rather than via el()'s href shortcut — that
    // shortcut always opens links in a new tab (right for the
    // external Modrinth/GitHub links elsewhere on the page), but page
    // navigation should stay in the same tab.
    const a = document.createElement('a');
    a.className = 'nav-jump-btn';
    a.href = p.url;
    a.appendChild(icon(p.icon, 'icon-sm'));
    a.appendChild(el('span', { text: p.label }));
    if (dot) a.appendChild(dot);
    row.appendChild(a);
    badgeTargets.push({ page: p, target: a });
  });
  nav.appendChild(row);

  // A dot is only computed once, at load. If the page is later restored
  // from the browser's back/forward cache (e.g. after pressing Back)
  // rather than freshly loaded.
  window.addEventListener('pageshow', event => {
    if (!event.persisted) return;
    badgeTargets.forEach(({ page, target }) => {
      const existing = target.querySelector('.nav-jump-dot');
      const count = countUndismissedBadges(page);
      if (count > 0) {
        const fresh = navBadgeDot(count);
        if (existing) existing.replaceWith(fresh);
        else target.appendChild(fresh);
      } else if (existing) {
        existing.remove();
      }
    });
  });

  // Keeps a linked/scrolled-to heading or project clear of this bar
  // while it's sticky.
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

// Builds this page's one section: a heading with a project count,
// followed by its project cards.
function renderFlatSection(section) {
  const main = document.getElementById('catalog');
  if (!main || !section) return;

  const id = assignSlug(section.heading, 'section');
  const count = el('span', {
    class: 'section-count',
    text: String((section.projects || []).length)
  });
  const heading = el('h2', { class: 'flat-section-heading', attrs: { id } }, [
    el('span', { text: section.heading }),
    count
  ]);

  const list = el('div', { class: 'project-list' }, section.projects.map(renderProject));

  main.appendChild(heading);
  main.appendChild(list);
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

// Scrolls to a #project-id or #section-id link and briefly highlights
// the project it points to.
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

// Adds a JSON-LD <script> (Organization + SoftwareApplication list)
// built from SITE_DATA. Pass a section to describe just its projects,
// or null for every project (index.js does this on the home page).
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

  // One section's projects on a section page, or every section's on the
  // home page (which passes no section).
  const projects = section
    ? (section.projects || [])
    : (data.sections || []).flatMap(s => s.projects || []);

  const items = projects.map(project => {
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
   A section page marks itself with data-page, matching its "url" in
   SITE_DATA.pages (see data.js): <body data-page="data-packs-mods.html">.
   The home and 404 pages have no data-page, so this only runs where needed. */
if (document.body.dataset.page) {
  initSectionPage(document.body.dataset.page);
}

function initSectionPage(pageUrl) {
  renderBrand(SITE_DATA.brand, SITE_DATA.topLinks);

  const pages = SITE_DATA.pages || [];
  renderPageNav(pages, pageUrl);

  // Looks up this page's section via SITE_DATA.pages, falling back to
  // the first section if data.js is missing that entry.
  const pageEntry = pages.find(p => p.url === pageUrl);
  const section = (SITE_DATA.sections || []).find(s => s.heading === (pageEntry && pageEntry.section)) || SITE_DATA.sections[0];

  renderFlatSection(section);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderStructuredData(SITE_DATA, section);
  initBackToTop();
  handleDeepLink();
  window.addEventListener('hashchange', handleDeepLink);
}
