/* Shared by every page: helpers plus the header, footer and project-card
   builders, all driven by SITE_DATA (data.js). A section page opts in via
   <body data-page="..."> (see initSectionPage at the bottom). */

/* ---------- Helpers ---------- */

// Site-relative paths ("about", "images/x.webp") become root-absolute so they
// resolve the same from any URL depth (e.g. a trailing-slash "/about/").
// Absolute URLs, "/..." paths, "#hash" and "mailto:" are left alone.
function sitePath(path) {
  return /^([a-z][a-z0-9+.-]*:|\/|#)/i.test(path) ? path : '/' + path;
}

function iconUrl(name) {
  return `url('${sitePath(`images/icons/${name || 'link'}.svg`)}')`;
}

function icon(name, cls) {
  const span = document.createElement('span');
  span.className = 'icon' + (cls ? ' ' + cls : '');
  span.setAttribute('aria-hidden', 'true');
  const url = iconUrl(name);
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

// The one place that decides element IDs for a section: the heading claims its
// slug first, then each project in order. Section pages, the home page links,
// search results, badge keys and the structured data all read IDs from here, so
// they can't drift apart. Returns { headingId, projects: [{ project, id }] }.
const sectionIdCache = new WeakMap();
function sectionIds(section) {
  let ids = sectionIdCache.get(section);
  if (!ids) {
    const used = new Set();
    const headingId = uniqueSlug(section.heading, 'section', used);
    const projects = (section.projects || []).map(project => ({ project, id: uniqueSlug(project.title, 'project', used) }));
    ids = { headingId, projects, byProject: new Map(projects.map(p => [p.project, p.id])) };
    sectionIdCache.set(section, ids);
  }
  return ids;
}

function projectId(section, project) {
  return sectionIds(section).byProject.get(project);
}

// Note: the `href` option opens a new tab; use internalLink() for same-site links.
function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text) node.textContent = opts.text;
  if (opts.href) { node.href = opts.href; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
  if (opts.src) node.src = sitePath(opts.src);
  if (opts.alt !== undefined) node.alt = opts.alt;
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  children.forEach(c => c && node.appendChild(c));
  return node;
}

function internalLink(className, href, children, label) {
  const a = document.createElement('a');
  a.className = className;
  a.href = sitePath(href);
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

// Full URL for a project's deep link. Copying it leaves the address bar alone.
function deepLinkUrl(id) {
  return `${location.origin}${location.pathname}#${id}`;
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

// Re-runs layoutChannelRow() whenever the row's size changes. Deliberately not
// skipped when only the height changed: stacking changes the height, and those
// follow-up passes are what settle the layout after a resize (skipping them left
// rows stuck stacked after resizing from narrow to wide).
function watchChannelRow(rowEl) {
  if (window.ResizeObserver) {
    new ResizeObserver(() => layoutChannelRow(rowEl)).observe(rowEl);
  }
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
    const url = iconUrl(name);
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
    const url = deepLinkUrl(id);

    // execCommand path, also used when the async Clipboard API is missing or rejects.
    const fallbackCopy = () => {
      const temp = document.createElement('textarea');
      temp.value = url;
      temp.setAttribute('readonly', '');
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { /* copy unsupported */ }
      document.body.removeChild(temp);
      if (ok) showCopied();
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(showCopied).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
  });

  return btn;
}

function renderBrand(brand) {
  const logo = document.getElementById('brand-logo');
  // Re-assigning an identical src can restart the request in some browsers.
  if (logo.getAttribute('src') !== sitePath(brand.logo)) logo.src = sitePath(brand.logo);
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
    attrs: { type: 'button', 'data-badge': text.toLowerCase(), 'data-tooltip': 'Dismiss', 'aria-label': `Dismiss "${text}" label` }
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
      icon('newtab', 'icon-sm'),
      el('span', { text: 'View' })
    ]);
  }

  return el('div', { class: 'download-col' + (disabled ? ' is-disabled' : '') }, [colHeader, action]);
}

function renderChannel(ch, projectId) {
  const header = el('div', { class: 'channel-header' }, [
    el('span', { class: 'status-dot' }),
    el('span', { class: 'channel-label', text: ch.label }),
    ch.mcVersion ? el('span', { class: 'channel-mc-group' }, [
      el('span', { class: 'channel-sep', text: '|' }),
      el('span', { class: 'channel-mc', text: 'Java ' + ch.mcVersion })
    ]) : null
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
  note.appendChild(icon('history', 'icon-sm'));
  note.appendChild(document.createTextNode('Older versions: '));
  if (modrinth) note.appendChild(el('a', { class: 'versions-note-link', href: `${modrinth.url}/versions`, text: 'Modrinth' }));
  if (modrinth && github) note.appendChild(document.createTextNode(' | '));
  if (github) note.appendChild(el('a', { class: 'versions-note-link', href: `${github.url}/wiki/Versions`, text: 'GitHub' }));
  return note;
}

function renderProject(p, id) {
  const linkRow = el('div', { class: 'project-links' }, (p.links || []).map(l =>
    el('a', { class: 'text-link', href: l.url }, [icon(l.icon, 'icon-sm'), el('span', { text: l.label })])
  ));

  const channelRow = el('div', { class: 'channel-row' }, (p.channels || []).map(ch => renderChannel(ch, id)));
  watchChannelRow(channelRow);

  // On wide screens the info block (title, description, links) and the channel
  // boxes sit side by side and share a height; narrower screens stack them
  // (see "Project layout" in styles.css). Link-only projects have no channels.
  const hasChannels = (p.channels || []).length > 0;

  return el('article', { class: 'project' + (hasChannels ? ' has-channels' : ''), attrs: { id } }, [
    el('img', { class: 'project-image', src: p.image, alt: p.imageAlt || '', attrs: { loading: 'lazy', width: '320', height: '320' } }),
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

  let count = 0;
  sectionIds(section).projects.forEach(({ project, id }) => {
    (project.channels || []).forEach(ch => {
      if (ch.badge && storageGet(badgeKey(id, ch)) !== badgeFingerprint(ch)) count++;
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

// Builds the nav: Home, a Projects dropdown (pages with a "section"), News, About.
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
  const newsPage = pages.find(p => p.url === 'news');
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

  if (newsPage) nav.appendChild(pageLink(newsPage, 'nav-link'));
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

const NOTICE_KEY = 'notice-dismissed';
const NOTICE_RETURN_DAYS = 45;

// True while this exact notice was dismissed less than NOTICE_RETURN_DAYS ago.
// Anything unreadable (older format, bad data, a clock set backwards) counts as not dismissed.
function noticeDismissed(text) {
  try {
    const saved = JSON.parse(storageGet(NOTICE_KEY));
    const age = Date.now() - saved.at;
    return saved.text === text && age >= 0 && age < NOTICE_RETURN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

// Sections like "Other Projects" only link out, so they get no download notice.
function sectionHasDownloads(section) {
  return (section.projects || []).some(p => (p.channels || []).length > 0);
}

function renderFlatSection(section) {
  const main = document.getElementById('catalog');
  if (!main || !section) return;

  const ids = sectionIds(section);
  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: ids.headingId } }, [
    el('span', { text: section.heading }),
    el('span', { class: 'section-count', text: String((section.projects || []).length) })
  ]));

  // Dismissable. The choice is remembered, but the notice returns when its
  // wording changes or NOTICE_RETURN_DAYS have passed since it was dismissed.
  const noticeText = SITE_DATA.downloadNotice;
  if (noticeText && sectionHasDownloads(section) && !noticeDismissed(noticeText)) {
    const close = el('button', { class: 'notice-close', attrs: { type: 'button', 'aria-label': 'Dismiss notice', 'data-tooltip': 'Dismiss' } });
    const notice = el('div', { class: 'download-notice', attrs: { role: 'note' } }, [
      icon('info', 'icon-sm'),
      el('p', { text: noticeText }),
      close
    ]);
    close.addEventListener('click', () => {
      storageSet(NOTICE_KEY, JSON.stringify({ text: noticeText, at: Date.now() }));
      notice.remove();
    });
    main.appendChild(notice);
  }

  main.appendChild(el('div', { class: 'project-list' }, ids.projects.map(({ project, id }) => renderProject(project, id))));
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

  const SHOW_AFTER = 180; // px scrolled before the button appears

  if ('IntersectionObserver' in window) {
    // An invisible marker over the top SHOW_AFTER px of the page: the button shows
    // once it has scrolled out of view. No work happens per scroll event.
    const marker = document.createElement('div');
    marker.setAttribute('aria-hidden', 'true');
    Object.assign(marker.style, {
      position: 'absolute', top: '0', left: '0', width: '1px',
      height: SHOW_AFTER + 'px', pointerEvents: 'none', visibility: 'hidden'
    });
    document.body.appendChild(marker);
    new IntersectionObserver(entries => {
      btn.classList.toggle('is-visible', !entries[entries.length - 1].isIntersecting);
    }).observe(marker);
  } else {
    const update = () => btn.classList.toggle('is-visible', window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

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

// Adds JSON-LD: Organization, WebSite and a list of the downloadable projects.
// Pass a section for just its projects, or null for every project. Link-only
// entries (a server, this website) aren't software downloads, so they're left
// out of the list. Each project's url is its card on this site, using the same
// #id the page gives it.
function renderStructuredData(data, section) {
  const canonical = document.querySelector('link[rel="canonical"]');
  const siteUrl = canonical ? canonical.href : location.origin + '/';
  const root = new URL('/', siteUrl).href;
  const toAbsolute = path => path ? new URL(path, siteUrl).href : undefined;

  // Same name the page's social tags use ("Classic's Craftworks"); the brand
  // name is the all-caps display version.
  const siteMeta = document.querySelector('meta[property="og:site_name"]');
  const siteName = (siteMeta && siteMeta.content) || data.brand.name;
  const splash = data.home && data.home.splash;
  const description = (data.home && data.home.description) || (splash && splash.subtitle) || '';

  const organization = {
    '@type': 'Organization',
    '@id': root + '#organization',
    name: siteName,
    url: root,
    logo: toAbsolute(data.brand.logo),
    sameAs: (data.socials || []).map(l => l.url)
  };
  if (description) organization.description = description;

  const website = {
    '@type': 'WebSite',
    '@id': root + '#website',
    name: siteName,
    url: root,
    publisher: { '@id': organization['@id'] }
  };
  if (description) website.description = description;

  const pages = data.pages || [];
  const sections = section ? [section] : (data.sections || []);
  const items = [];

  sections.forEach(sec => {
    const page = pages.find(p => p.section === sec.heading);

    sectionIds(sec).projects.forEach(({ project, id }) => {
      if (!(project.channels || []).length) return;

      const stable = stableChannel(project);
      const firstDownload = stable && (stable.downloads || []).find(d => d.url && !d.disabled);

      const item = {
        '@type': 'SoftwareApplication',
        name: project.title,
        description: project.description,
        image: toAbsolute(project.image),
        url: page ? toAbsolute(`${sitePath(page.url)}#${id}`) : siteUrl,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Minecraft: Java Edition',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
        publisher: { '@id': organization['@id'] }
      };
      const external = (project.links || []).map(l => l.url).filter(Boolean);
      if (external.length) item.sameAs = external;
      if (firstDownload && firstDownload.version) item.softwareVersion = firstDownload.version;
      if (firstDownload) item.downloadUrl = firstDownload.url;
      items.push(item);
    });
  });

  const graph = [organization, website];
  if (items.length) {
    graph.push({
      '@type': 'ItemList',
      name: `${siteName} ${section ? section.heading : 'Projects'}`,
      itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, item }))
    });
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
  document.head.appendChild(script);
}

/* ---------- Tooltip placement ----------
   Tooltips open above their element. Near the top of the page the sticky
   header would cover them, so they open below instead (.tooltip-below). */

function placeTooltip(target) {
  const el = target instanceof Element ? target.closest('[data-tooltip]') : null;
  if (!el || el.closest('.site-header') || el.id === 'back-to-top') return;

  const header = document.querySelector('.site-header');
  const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
  const tipHeight = parseFloat(getComputedStyle(el, '::after').height) || 40;
  const needed = tipHeight + 14; // the tooltip plus its 10px offset and a little air
  el.classList.toggle('tooltip-below', el.getBoundingClientRect().top - headerBottom < needed);
}

['mouseover', 'focusin', 'pointerdown'].forEach(type =>
  document.addEventListener(type, e => placeTooltip(e.target)));

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


// Service worker (sw.js): lets Chrome/Edge offer to install the site, and keeps
// the page shell and visited pages available offline.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* not fatal */ });
  });
}
