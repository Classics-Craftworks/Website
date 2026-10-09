/* Shared by every page: helpers plus the header, footer and project-card
   builders, all driven by SITE_DATA (data.js). A section page opts in via
   <body data-page="..."> (see initSectionPage at the bottom). */

/* ---------- Helpers ---------- */

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

// Slug for `text` that isn't in `used` yet ("-2", "-3"... if needed); records it.
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

// Note: the `href` option opens a new tab; use internalLink() for same-site links.
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

function internalLink(className, href, children, label) {
  const a = document.createElement('a');
  a.className = className;
  a.href = href;
  if (label) a.setAttribute('aria-label', label);
  children.forEach(c => c && a.appendChild(c));
  return a;
}

function stableChannel(project) {
  const channels = project.channels || [];
  return channels.find(c => (c.channel || '').toLowerCase() === 'stable') || channels[0];
}

// Projects with downloads (data packs, mods, resource packs); link-only
// projects like "Other Projects" aren't counted.
function countDownloadableProjects() {
  return (SITE_DATA.sections || []).reduce(
    (n, s) => n + (s.projects || []).filter(p => (p.channels || []).length > 0).length, 0);
}

// Fills {projects} in text from data.js / stats.js.
function fillPlaceholders(text) {
  return String(text).replace(/\{projects\}/g, countDownloadableProjects());
}

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

function setHashSilently(id) {
  const url = `${location.origin}${location.pathname}#${id}`;
  try { history.pushState(null, '', url); } catch { /* not fatal */ }
  return url;
}

/* ---------- Channel row layout ----------
   Channel boxes and download columns stack rather than wrap mid-line;
   layoutChannelRow() picks the arrangement that fits on every resize. */

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
  if (groups.some(g => headerWraps(g.querySelector('.channel-header')))) rowEl.classList.add('stacked');

  groups.forEach(g => {
    const header = g.querySelector('.channel-header');
    header.classList.remove('header-force-wrap');
    if (headerWraps(header)) header.classList.add('header-force-wrap');
  });

  const downloadLists = groups.map(g => g.querySelector('.channel-downloads')).filter(Boolean);
  downloadLists.forEach(dl => dl.classList.remove('downloads-stacked'));
  const pillNeedsRoom = downloadLists.some(dl => {
    const headers = Array.from(dl.querySelectorAll('.download-col-header'));
    return headers.length > 1 && headers.some(pillWraps);
  });
  if (pillNeedsRoom) downloadLists.forEach(dl => dl.classList.add('downloads-stacked'));
}

/* ---------- Project cards ---------- */

// The project title itself is the button (clicking it copies a direct link),
// with a link icon after it. It sits inside the <h2>, so the heading is still
// the title; the visually hidden text tells screen readers what it does.
function copyLinkButton(id, label) {
  const linkIcon = icon('link', 'icon-sm');
  const btn = el('button', {
    class: 'copy-link-btn',
    attrs: { type: 'button', 'data-tooltip': 'Copy link' }
  }, [
    el('span', { text: label }),
    el('span', { class: 'visually-hidden', text: ' (copy link)' }),
    linkIcon
  ]);

  const setIcon = name => {
    const url = `url('images/icons/${name}.svg')`;
    linkIcon.style.webkitMaskImage = url;
    linkIcon.style.maskImage = url;
  };

  const showCopied = () => {
    btn.classList.add('is-copied');
    setIcon('tick');
    btn.setAttribute('data-tooltip', 'Copied!');
    window.clearTimeout(btn._copiedTimer);
    btn._copiedTimer = window.setTimeout(() => {
      btn.classList.remove('is-copied');
      setIcon('link');
      btn.setAttribute('data-tooltip', 'Copy link');
    }, 1500);
  };

  btn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const url = setHashSilently(id);

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(showCopied).catch(() => {});
      return;
    }
    const temp = document.createElement('textarea');
    temp.value = url;
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    try { if (document.execCommand('copy')) showCopied(); } catch { /* copy unsupported */ }
    document.body.removeChild(temp);
  });

  return btn;
}

function renderBrand(brand) {
  const logo = document.getElementById('brand-logo');
  // Re-assigning an identical src can restart the request in some browsers.
  if (logo.getAttribute('src') !== brand.logo) logo.src = brand.logo;
  logo.alt = '';
  document.getElementById('brand-name').textContent = brand.name;
}

// A badge reappears when the versions it was dismissed against change.
const badgeFingerprint = ch => (ch.downloads || []).map(d => d.version || 'N/A').join('|');
const badgeKey = (projectId, ch) => `badge-dismissed:${projectId}:${(ch.channel || 'stable').toLowerCase()}`;

function renderChannelBadge(ch, key) {
  const fingerprint = badgeFingerprint(ch);
  if (storageGet(key) === fingerprint) return null;

  const text = String(ch.badge).toLowerCase() === 'updated' ? 'Updated' : 'New';
  const badge = el('button', {
    class: 'channel-badge',
    attrs: { type: 'button', 'data-badge': text.toLowerCase(), 'aria-label': `Dismiss "${text}" label` }
  }, [
    el('span', { class: 'channel-badge-text', text }),
    el('span', { class: 'channel-badge-dismiss' })
  ]);

  badge.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    storageSet(key, fingerprint);
    badge.classList.add('is-dismissed');
    badge.addEventListener('transitionend', () => badge.remove(), { once: true });
    window.setTimeout(() => badge.remove(), 250);
  });

  return badge;
}

function renderDownload(d) {
  const disabled = d.disabled || !d.url;

  const colHeader = el('div', { class: 'download-col-header' + (disabled ? ' is-disabled' : '') }, [
    icon(d.icon || 'box', 'icon-sm'),
    el('span', { class: 'download-type-label', text: d.label }),
    el('span', { class: 'pill' + (disabled ? ' disabled-pill' : ''), text: disabled ? 'N/A' : (d.version || 'N/A') })
  ]);

  let action;
  if (disabled) {
    const attrs = d.tooltip
      ? { 'data-tooltip': d.tooltip, tabindex: '0', 'aria-label': `Not available: ${d.tooltip}` }
      : {};
    action = el('div', { class: 'download-unavailable' + (d.tooltip ? ' has-tooltip' : ''), attrs }, [
      icon('unavailable', 'icon-sm'),
      el('span', { text: 'Not available' })
    ]);

    // Touch devices have no hover, so a tap shows the tooltip briefly.
    if (d.tooltip) {
      action.addEventListener('click', () => {
        action.classList.add('tooltip-open');
        window.clearTimeout(action._tooltipTimer);
        action._tooltipTimer = window.setTimeout(() => action.classList.remove('tooltip-open'), 3000);
      });
    }
  } else {
    action = el('a', { class: 'download-btn', href: d.url }, [
      icon('download', 'icon-sm'),
      el('span', { text: 'Download' })
    ]);
  }

  return el('div', { class: 'download-col' + (disabled ? ' is-disabled' : '') }, [colHeader, action]);
}

function renderChannel(ch, projectId) {
  const header = el('div', { class: 'channel-header' }, [
    el('span', { class: 'status-dot' }),
    el('span', { class: 'channel-label', text: ch.label }),
    el('span', { class: 'channel-mc-group' }, [
      el('span', { class: 'channel-sep', text: '|' }),
      el('span', { class: 'channel-mc', text: 'Java ' + ch.mcVersion })
    ])
  ]);

  const badge = ch.badge ? renderChannelBadge(ch, badgeKey(projectId, ch)) : null;
  const downloads = el('div', { class: 'channel-downloads' }, (ch.downloads || []).map(renderDownload));

  return el('div', {
    class: 'channel-group',
    attrs: { 'data-channel': (ch.channel || 'stable').toLowerCase() }
  }, [badge, header, downloads]);
}

function renderVersionsNote(p) {
  if (!(p.channels || []).length) return null;

  const findLink = name => (p.links || []).find(l => (l.label || '').toLowerCase() === name);
  const modrinth = findLink('modrinth');
  const github = findLink('github');
  if (!modrinth && !github) return null;

  const note = el('p', { class: 'versions-note' });
  note.appendChild(document.createTextNode('Older versions: '));
  if (modrinth) note.appendChild(el('a', { class: 'versions-note-link', href: `${modrinth.url}/versions`, text: 'Modrinth' }));
  if (modrinth && github) note.appendChild(document.createTextNode(' | '));
  if (github) note.appendChild(el('a', { class: 'versions-note-link', href: `${github.url}/wiki/Versions`, text: 'GitHub' }));
  return note;
}

function renderProject(p) {
  const id = assignSlug(p.title, 'project');

  const linkRow = el('div', { class: 'project-links' }, (p.links || []).map(l =>
    el('a', { class: 'text-link', href: l.url }, [icon(l.icon, 'icon-sm'), el('span', { text: l.label })])
  ));

  const channelRow = el('div', { class: 'channel-row' }, (p.channels || []).map(ch => renderChannel(ch, id)));
  if (window.ResizeObserver) {
    new ResizeObserver(() => layoutChannelRow(channelRow)).observe(channelRow);
  }

  // On wide screens the info block (title, description, links) and the channel
  // boxes sit side by side and share a height; narrower screens stack them
  // (see "Project layout" in styles.css). Link-only projects have no channels.
  const hasChannels = (p.channels || []).length > 0;

  return el('article', { class: 'project' + (hasChannels ? ' has-channels' : ''), attrs: { id } }, [
    el('img', { class: 'project-image', src: p.image, alt: '', attrs: { loading: 'lazy', width: '320', height: '320' } }),
    el('div', { class: 'project-body' }, [
      el('div', { class: 'project-info' }, [
        el('h2', {}, [copyLinkButton(id, p.title)]),
        el('p', { class: 'project-description', text: p.description }),
        linkRow
      ]),
      channelRow,
      renderVersionsNote(p)
    ])
  ]);
}

/* ---------- Header ---------- */

// Undismissed "New"/"Updated" badges on a page's projects. Slugs use a fresh
// Set so they match that page's own ids, whichever page is showing.
function countUndismissedBadges(page) {
  const section = (SITE_DATA.sections || []).find(s => s.heading === page.section);
  if (!section) return 0;

  const slugs = new Set();
  let count = 0;
  (section.projects || []).forEach(p => {
    const projectId = uniqueSlug(p.title, 'project', slugs);
    (p.channels || []).forEach(ch => {
      if (ch.badge && storageGet(badgeKey(projectId, ch)) !== badgeFingerprint(ch)) count++;
    });
  });
  return count;
}

// Count pill for nav items; shows "9+" above nine.
function navBadgeDot(count) {
  const text = `${count} new ${count === 1 ? 'update' : 'updates'}`;
  return el('span', {
    class: 'nav-jump-dot',
    attrs: { 'data-tooltip': text, 'aria-label': text }
  }, [
    el('span', { attrs: { 'aria-hidden': 'true' }, text: count > 9 ? '9+' : String(count) })
  ]);
}

// Keep in sync with the 900px breakpoint in styles.css.
const MOBILE_NAV_QUERY = '(max-width: 900px)';

// Builds the nav: Home, a Projects dropdown (pages with a "section"), About.
// search.js adds the search box to the same menu. On small screens the whole
// menu folds behind a button and the dropdown becomes an accordion.
function renderSiteHeader(pages, currentUrl) {
  const header = document.getElementById('site-header');
  const inner = document.getElementById('site-header-inner');
  const menuWrap = document.getElementById('site-menu');
  const nav = document.getElementById('site-nav');
  if (!header || !inner || !menuWrap || !nav || !pages || !pages.length) return;

  const mobile = window.matchMedia(MOBILE_NAV_QUERY);
  const home = pages.find(p => p.url === '/');
  const about = pages.find(p => p.url === 'about');
  const projectPages = pages.filter(p => p.section);

  // Elements that carry a count pill, each with a function giving its count.
  // syncDots() redraws them all, at load and after a back/forward restore.
  const dotTargets = [];
  const trackDots = (target, getCount) => dotTargets.push({ target, getCount });
  const totalProjectBadges = () => projectPages.reduce((sum, p) => sum + countUndismissedBadges(p), 0);

  function syncDots() {
    dotTargets.forEach(({ target, getCount }) => {
      const existing = target.querySelector(':scope > .nav-jump-dot');
      const count = getCount();
      if (count > 0) {
        const fresh = navBadgeDot(count);
        if (existing) existing.replaceWith(fresh);
        else target.appendChild(fresh);
      } else if (existing) {
        existing.remove();
      }
    });
  }

  function pageLink(page, className) {
    const a = internalLink(className, page.url, [icon(page.icon, 'icon-sm'), el('span', { text: page.label })]);
    if (page.url === currentUrl) {
      a.classList.add('is-current');
      a.setAttribute('aria-current', 'page');
    }
    return a;
  }

  if (home) nav.appendChild(pageLink(home, 'nav-link'));

  let setDropdown = () => {};
  if (projectPages.length) {
    const menuId = 'projects-menu';
    const onProjectPage = projectPages.some(p => p.url === currentUrl);
    const label = (SITE_DATA.home && SITE_DATA.home.projectsHeading) || 'Projects';

    const trigger = el('button', {
      class: 'nav-link nav-dropdown-toggle' + (onProjectPage ? ' is-current' : ''),
      attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': menuId }
    }, [
      icon('compass', 'icon-sm'),
      el('span', { text: label }),
      el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
    ]);
    trackDots(trigger, totalProjectBadges);

    const items = projectPages.map(page => {
      const a = pageLink(page, 'nav-dropdown-item');
      trackDots(a, () => countUndismissedBadges(page));
      return a;
    });
    const menu = el('div', { class: 'nav-dropdown-menu', attrs: { id: menuId, hidden: '' } }, items);
    const dropdown = el('div', { class: 'nav-dropdown' }, [trigger, menu]);
    nav.appendChild(dropdown);

    setDropdown = (open, opts = {}) => {
      menu.hidden = !open;
      trigger.setAttribute('aria-expanded', String(open));
      dropdown.classList.toggle('is-open', open);
      if (!open && opts.refocus) trigger.focus();
    };

    trigger.addEventListener('click', () => setDropdown(menu.hidden));
    trigger.addEventListener('keydown', e => {
      if (e.key !== 'ArrowDown') return;
      e.preventDefault();
      setDropdown(true);
      items[0].focus();
    });

    menu.addEventListener('keydown', e => {
      const i = items.indexOf(document.activeElement);
      let next = -1;
      if (e.key === 'ArrowDown') next = (i + 1) % items.length;
      else if (e.key === 'ArrowUp') next = (i - 1 + items.length) % items.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = items.length - 1;
      else if (e.key === 'Escape') {
        e.preventDefault();
        setDropdown(false, { refocus: true });
        return;
      }
      if (next < 0) return;
      e.preventDefault();
      items[next].focus();
    });

    // A popover on desktop (closes on outside focus/click); an accordion on
    // mobile (stays open until its button is pressed again).
    dropdown.addEventListener('focusout', e => {
      if (!mobile.matches && !dropdown.contains(e.relatedTarget)) setDropdown(false);
    });
    document.addEventListener('pointerdown', e => {
      if (!mobile.matches && !dropdown.contains(e.target)) setDropdown(false);
    });
  }

  if (about) nav.appendChild(pageLink(about, 'nav-link'));

  // Mobile menu button; its pill totals every project page.
  const toggle = el('button', {
    class: 'nav-toggle',
    attrs: { type: 'button', 'aria-expanded': 'false', 'aria-controls': menuWrap.id, 'aria-label': 'Open menu' }
  }, [
    el('span', { class: 'nav-toggle-bars', attrs: { 'aria-hidden': 'true' } })
  ]);
  trackDots(toggle, totalProjectBadges);
  inner.insertBefore(toggle, menuWrap);

  const setMenu = open => {
    header.classList.toggle('is-menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(!header.classList.contains('is-menu-open')));

  // Escape folds the mobile menu unless the dropdown or search already used it.
  header.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (!mobile.matches || !header.classList.contains('is-menu-open')) return;
    setMenu(false);
    toggle.focus();
  });

  // Crossing the breakpoint resets both menus.
  mobile.addEventListener('change', () => {
    setMenu(false);
    setDropdown(false);
  });

  syncDots();
  window.addEventListener('pageshow', event => {
    if (event.persisted) syncDots();
  });

  // Keeps linked headings clear of the sticky header. Skipped while the
  // mobile menu is open, since it overlays the page rather than pushing it.
  const syncScrollOffset = () => {
    if (header.classList.contains('is-menu-open')) return;
    const offset = header.getBoundingClientRect().height + 16;
    document.documentElement.style.setProperty('--sticky-nav-offset', `${Math.round(offset)}px`);
  };
  syncScrollOffset();
  if (window.ResizeObserver) new ResizeObserver(syncScrollOffset).observe(header);
  else window.addEventListener('resize', syncScrollOffset);
}

/* ---------- Section page & footer ---------- */

// Sections like "Other Projects" only link out, so they get no download notice.
function sectionHasDownloads(section) {
  return (section.projects || []).some(p => (p.channels || []).length > 0);
}

function renderFlatSection(section) {
  const main = document.getElementById('catalog');
  if (!main || !section) return;

  const id = assignSlug(section.heading, 'section');
  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id } }, [
    el('span', { text: section.heading }),
    el('span', { class: 'section-count', text: String((section.projects || []).length) })
  ]));

  if (SITE_DATA.downloadNotice && sectionHasDownloads(section)) {
    main.appendChild(el('p', { class: 'download-notice' }, [
      icon('info', 'icon-sm'),
      el('span', { text: SITE_DATA.downloadNotice })
    ]));
  }

  main.appendChild(el('div', { class: 'project-list' }, section.projects.map(renderProject)));
}

function footerLink(href, iconName, label) {
  const a = internalLink('footer-link footer-social', href, [icon(iconName, 'icon-sm'), el('span', { text: label })]);
  const li = document.createElement('li');
  li.appendChild(a);
  return li;
}

function renderFooter(socials, footer, version) {
  const projectsList = document.getElementById('footer-projects');
  if (projectsList) {
    SITE_DATA.pages.filter(p => p.section).forEach(p => projectsList.appendChild(footerLink(p.url, p.icon, p.label)));
  }

  const socialList = document.getElementById('social-links');
  socials.forEach(s => {
    const li = footerLink(s.url, s.icon, s.label);
    const a = li.firstChild;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    socialList.appendChild(li);
  });

  document.getElementById('copyright').textContent = footer.copyright;
  const established = document.getElementById('established');
  if (established && footer.established) established.textContent = footer.established;
  document.getElementById('disclaimer').textContent = footer.disclaimer;

  const credits = footer.iconCredits;
  if (credits) {
    const creditsEl = document.getElementById('icon-credits');
    if (credits.prefix) creditsEl.appendChild(document.createTextNode(credits.prefix));
    creditsEl.appendChild(el('a', { href: credits.url, class: 'credits-link', text: credits.label }));
  }

  if (version) {
    const versionEl = document.getElementById('site-version');
    const { label, url } = typeof version === 'object' ? version : { label: version };
    if (url) versionEl.appendChild(el('a', { href: url, class: 'version-link', text: label }));
    else versionEl.textContent = label;
  }
}

/* ---------- Page behaviour ---------- */

function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  const update = () => btn.classList.toggle('is-visible', window.scrollY > 180);
  update();
  window.addEventListener('scroll', update, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  });
}

// Scrolls to the #id in the URL and briefly highlights it if it's a project.
function handleDeepLink() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id && document.getElementById(id);
  if (!target) return;

  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'auto', block: 'start' });

    if (target.classList.contains('project')) {
      target.classList.add('is-linked-target');
      target.addEventListener('animationend', () => target.classList.remove('is-linked-target'), { once: true });
    }
  });
}

// Adds JSON-LD (Organization + project list). Pass a section for just its
// projects, or null for every project.
function renderStructuredData(data, section) {
  const canonical = document.querySelector('link[rel="canonical"]');
  const siteUrl = canonical ? canonical.href : location.origin + '/';
  const toAbsolute = path => path ? new URL(path, siteUrl).href : undefined;

  const organization = {
    '@type': 'Organization',
    name: data.brand.name,
    url: siteUrl,
    logo: toAbsolute(data.brand.logo),
    description: (data.home && data.home.projectsSubtitle) || '',
    sameAs: (data.socials || []).map(l => l.url)
  };

  const projects = section
    ? (section.projects || [])
    : (data.sections || []).flatMap(s => s.projects || []);

  const items = projects.map(project => {
    const stable = stableChannel(project);
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
    if (firstDownload && firstDownload.version) item.softwareVersion = firstDownload.version;
    if (firstDownload) item.downloadUrl = firstDownload.url;
    return item;
  });

  const itemList = {
    '@type': 'ItemList',
    name: `${data.brand.name} ${section ? section.heading : 'Projects'}`,
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, item }))
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': [organization, itemList] });
  document.head.appendChild(script);
}

/* ---------- Entry point ----------
   Section pages set data-page to their "url" in SITE_DATA.pages. */

function initSectionPage(pageUrl) {
  renderBrand(SITE_DATA.brand);

  const pages = SITE_DATA.pages || [];
  renderSiteHeader(pages, pageUrl);

  const pageEntry = pages.find(p => p.url === pageUrl);
  const section = (SITE_DATA.sections || []).find(s => s.heading === (pageEntry && pageEntry.section)) || SITE_DATA.sections[0];

  renderFlatSection(section);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderStructuredData(SITE_DATA, section);
  initBackToTop();
  handleDeepLink();
  window.addEventListener('hashchange', handleDeepLink);
}

if (document.body.dataset.page) initSectionPage(document.body.dataset.page);

// Cache-free service worker (sw.js) so Chrome/Edge offer to install the site.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* not fatal */ });
  });
}
