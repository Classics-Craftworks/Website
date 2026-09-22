/* ============================================================
   RENDER SCRIPT

   Builds the page (logo, project list, footer, etc.) from data.js.
   Edit this file to change how things are built, edit data.js to
   change what is shown.
   ============================================================ */

/* ---------- Small helper functions ---------- */

// Creates one icon. Uses the PNG as a color "mask" so it automatically
// matches the site's theme colors.
function icon(name, cls) {
  const span = document.createElement('span');
  span.className = 'icon' + (cls ? ' ' + cls : '');
  span.setAttribute('aria-hidden', 'true'); // hide from screen readers — the visible text label next to it is enough
  const url = `url('images/icons/${name || 'link'}.png')`; // falls back to "link.png" if no icon name is given
  span.style.webkitMaskImage = url; // needed for Safari
  span.style.maskImage = url; // needed for other browsers
  return span;
}

// Turns a title into a URL-friendly slug, e.g. "Data Packs & Mods" ->
// "data-packs-mods". Used to give sections/projects a stable #id.
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // any run of non-alphanumeric chars becomes one hyphen
    .replace(/^-+|-+$/g, '');    // trim leading/trailing hyphens
}

// Wraps slugify() to make sure every id is unique, in case two
// projects share a name.
const usedSlugs = new Set();
function assignSlug(text, fallback) {
  let base = slugify(text) || fallback;
  let slug = base;
  let n = 2;
  while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
  usedSlugs.add(slug);
  return slug;
}

// Shortcut for building an HTML element.
// Example: el('a', { class: 'btn', text: 'Click me', href: '#' })
// creates: <a class="btn" href="#">Click me</a>
//
// tag      - the HTML tag name, e.g. 'div', 'a', 'span'
// opts     - optional settings (class, text, href, src, alt, attrs)
// children - other elements to nest inside this one
function el(tag, opts = {}, children = []) {
  const node = document.createElement(tag);
  if (opts.class) node.className = opts.class;
  if (opts.text) node.textContent = opts.text;
  if (opts.href) { node.href = opts.href; node.target = '_blank'; node.rel = 'noopener noreferrer'; } // all our links point off-site, so always open in a new tab
  if (opts.src) node.src = opts.src;
  if (opts.alt !== undefined) node.alt = opts.alt;
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v); // for any other attribute, e.g. data-* or loading="lazy"
  children.forEach(c => c && node.appendChild(c)); // the "c &&" skips any falsy/empty children safely
  return node;
}

// Whether the visitor has asked for reduced motion. Used by every
// animation in this file so they can skip animating when needed.
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

// Safe localStorage read/write — some browsers (e.g. Safari private
// mode) can throw here, so every call in this file goes through these.
function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* quota / privacy error — ignore */ }
}

// Updates the address bar to #id without actually navigating or
// scrolling — used when a click already handles that itself.
function setHashSilently(id) {
  const url = `${location.origin}${location.pathname}#${id}`;
  try { history.pushState(null, '', url); } catch { /* not fatal — whatever triggered this still works, just without the URL updating */ }
  return url;
}

// Removes any #hash from the address bar without navigating or
// scrolling. Uses replaceState (not pushState) since this is a side
// effect of collapsing a section, not something a visitor should be
// able to "undo" with the back button.
function clearHashSilently() {
  const url = `${location.origin}${location.pathname}`;
  try { history.replaceState(null, '', url); } catch { /* not fatal — the URL just won't update */ }
}

// True if the current #hash points at this element itself, or at
// something nested inside it (e.g. a project card within a section).
// Used to tell whether a section being collapsed should take the
// address bar's deep link down with it.
function hashPointsInto(el) {
  if (!location.hash) return false;
  const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  return !!target && (target === el || el.contains(target));
}

// Small "copy link" button used on section headings and project
// titles. label is used for the tooltip, e.g. "Copy link to X".
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
    // Stops the click from also toggling a parent <summary>/<details> —
    // this button can sit inside a section's clickable header row.
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
      navigator.clipboard.writeText(url).then(showCopied).catch(() => { /* clipboard permission denied — URL is still in the address bar above */ });
    } else {
      // Fallback for browsers without the async Clipboard API: a
      // temporary offscreen textarea + the older execCommand copy.
      const temp = document.createElement('textarea');
      temp.value = url;
      temp.style.position = 'fixed';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try { document.execCommand('copy'); showCopied(); } catch { /* copy unsupported — URL is still in the address bar above */ }
      document.body.removeChild(temp);
    }
  });

  return btn;
}

/* ---------- Page sections ----------
   Each function below builds one part of the page. Called once, in
   order, at the bottom of this file. */

// Fills in the logo, site name, tagline, and the top-right nav buttons
// (Modrinth / GitHub links) using the "brand" and "topLinks" data.
function renderBrand(brand, topLinks) {
  const logo = document.getElementById('brand-logo');
  logo.src = brand.logo;
  logo.alt = brand.name + ' logo'; // describes the image for screen readers

  document.getElementById('brand-name').textContent = brand.name;
  document.getElementById('brand-tagline').innerHTML = brand.tagline; // innerHTML here on purpose: the tagline text contains a <br> for a manual line break

  const nav = document.getElementById('top-links');
  topLinks.forEach(l => {
    nav.appendChild(el('a', { class: 'top-link', href: l.url }, [
      icon(l.icon, 'icon-sm'),
      el('span', { text: l.label })
    ]));
  });
}

// Builds the little "New"/"Updated" tag shown next to a channel's
// name. Set via `badge: "new"` or `badge: "updated"` on a channel in
// data.js. The visitor can dismiss it (✕), and it stays dismissed —
// until one of the channel's downloads' own "version" changes, at
// which point it comes back automatically, since the dismissal is
// remembered against a fingerprint of those versions.
function renderChannelBadge(ch, badgeKey) {
  const badgeText = String(ch.badge).toLowerCase() === 'updated' ? 'Updated' : 'New';

  // One string per download's version (missing ones count as "N/A",
  // matching what the pill itself shows), joined into a fingerprint.
  // If any download's version changes, this fingerprint changes too,
  // so a previously-dismissed badge reappears.
  const versionFingerprint = (ch.downloads || [])
    .map(d => d.version || 'N/A')
    .join('|');

  const dismissedVersion = storageGet(badgeKey);
  if (dismissedVersion === versionFingerprint) return null;

  // The whole badge is now the clickable/focusable element…
  const wrap = el('button', {
    class: 'channel-badge',
    attrs: {
      type: 'button',
      'data-badge': badgeText.toLowerCase(),
      'aria-label': 'Dismiss "' + badgeText + '" label'
    }
  }, [
    el('span', { class: 'channel-badge-text', text: badgeText }),
    el('span', { class: 'channel-badge-dismiss' }) // …so this is now just a decorative circle, not a nested button
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

// Builds one download channel box (e.g. "Release" or "Release
// Candidate") for a project. A project can have several channels.
// `projectId` is the project's #anchor slug — used together with the
// channel to make a stable localStorage key for the "new" badge above.
function renderChannel(ch, projectId) {
  // "stable" / "beta" / "alpha" controls the box's color via CSS.
  // Falls back to "stable" if data.js didn't set a channel.
  const channelKey = (ch.channel || 'stable').toLowerCase();

  // Top row of the box: colored dot + channel name + divider + MC
  // version. The badge (if any) isn't part of this row — it's
  // absolutely positioned against the channel box itself, hanging off
  // its top-left corner (see .channel-badge in styles.css).
  const header = el('div', { class: 'channel-header' }, [
    el('span', { class: 'status-dot' }),
    el('span', { class: 'channel-label', text: ch.label }),
    el('span', { class: 'channel-sep', text: '|' }),
    el('span', { class: 'channel-mc', text: 'Java ' + ch.mcVersion })
  ]);

  const badge = ch.badge ? renderChannelBadge(ch, `badge-dismissed:${projectId}:${channelKey}`) : null;

  // Holds one column per download (Data Pack, Mod, etc.). "has-multiple"
  // flags channels with two download types, which need extra mobile
  // styling (see .download-col-break below).
  const hasMultipleDownloads = (ch.downloads || []).length > 1;
  const downloads = el('div', {
    class: 'channel-downloads' + (hasMultipleDownloads ? ' has-multiple' : '')
  });

  (ch.downloads || []).forEach(d => {
    // Falls back to a box icon if data.js didn't specify one.
    const typeIcon = d.icon || 'box';

    // A download counts as "disabled" if data.js marked it disabled,
    // OR if it simply has no URL to link to.
    const isDisabled = d.disabled || !d.url;

    // Header for each download column: icon + label + version pill.
    // The empty "break" span forces the pill onto its own line on
    // mobile (see .download-col-break in styles.css); it does nothing
    // on desktop.
    const headerChildren = [
      icon(typeIcon, 'icon-sm'),
      el('span', { class: 'download-type-label', text: d.label }),
      el('span', { class: 'download-col-break', attrs: { 'aria-hidden': 'true' } }),
      el('span', { class: 'pill' + (isDisabled ? ' disabled-pill' : ''), text: isDisabled ? 'N/A' : (d.version || 'N/A') })
    ];

    const colHeader = el('div', {
      class: 'download-col-header' + (isDisabled ? ' is-disabled' : '')
    }, headerChildren);

    // Either a clickable "Download" button, or greyed-out "Not available" text
    let actionEl;
    if (isDisabled) {
      // Optional per-button hover tooltip explaining *why* it's unavailable
      // (set via "tooltip" on the download entry in data.js). Only added
      // when provided, and only then made keyboard-focusable, so it also
      // shows on focus for keyboard users.
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
    } else {
      actionEl = el('a', {
        class: 'download-btn',
        href: d.url
      }, [
        icon('download', 'icon-sm'),
        el('span', { text: 'Download' })
      ]);
    }

    // Put the header + action together as one column, then add it to the row
    downloads.appendChild(el('div', {
      class: 'download-col' + (isDisabled ? ' is-disabled' : '')
    }, [colHeader, actionEl]));
  });

  // data-channel="stable"/"beta"/"alpha" - read by styles.css to pick the right color theme
  return el('div', {
    class: 'channel-group',
    attrs: { 'data-channel': channelKey }
  }, [badge, header, downloads]);
}

// Builds one full project card: thumbnail image, title, description,
// row of links (Modrinth/GitHub/Wiki), and one channel box per channel.
function renderProject(p) {
  const linkRow = el('div', { class: 'project-links' });
  (p.links || []).forEach(l => {
    linkRow.appendChild(el('a', { class: 'text-link', href: l.url }, [
      icon(l.icon, 'icon-sm'),
      el('span', { text: l.label })
    ]));
  });

  // Gives this project a stable #anchor so it can be linked to
  // directly. Computed here (rather than down by titleRow, where it
  // used to live) because renderChannel also needs it, to key each
  // channel's "new" badge dismissal in localStorage.
  const id = assignSlug(p.title, 'project');

  // .map() here works just like .forEach() above, but it collects the
  // results into a new array instead of throwing them away
  const channelRow = el('div', { class: 'channel-row' },
    (p.channels || []).map(ch => renderChannel(ch, id))
  );

  // Text blob the search box matches against — includes the title,
  // Text blob the search box matches against — includes the title,
  // description, and each download's own version, so searching a
  // version number finds the right project too.
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
    el('img', { class: 'project-image', src: p.image, alt: p.title, attrs: { loading: 'lazy' } }), // loading="lazy": don't download this image until it's about to scroll into view
    el('div', { class: 'project-body' }, [
      titleRow,
      el('p', { class: 'project-description', text: p.description }),
      linkRow,
      channelRow
    ])
  ]);
}

// Builds every section and its project cards, then adds them to <main>.
// Each section is a collapsible <details> element, with its open/closed
// state remembered in localStorage.
//
// Builds the clickable header row for one section: the heading, a
// count badge, and a peek strip of thumbnails shown while collapsed.
function renderSectionSummary(section, id) {
  const projects = section.projects || [];

  const heading = el('h2', {}, [
    el('span', { class: 'heading-label', text: section.heading })
  ]);

  const count = el('span', {
    class: 'section-count',
    text: String(projects.length)
  });

  // Section's own #anchor link (see copyLinkButton()) — stopPropagation
  // inside the button keeps clicking it from also toggling the section.
  const headingGroup = el('div', { class: 'section-heading-group' }, [heading, count, copyLinkButton(id, section.heading)]);

  // Only shows a handful of thumbnails; the rest become a "+N" chip.
  const maxPeek = 4;
  const peekThumbs = projects.slice(0, maxPeek).map(p => el('img', {
    class: 'section-peek-thumb',
    src: p.image,
    alt: '', // decorative — the section already has a text heading, and the whole strip is aria-hidden below
    attrs: { loading: 'lazy' }
  }));

  const overflow = projects.length - maxPeek;
  if (overflow > 0) {
    peekThumbs.push(el('span', { class: 'section-peek-more', text: '+' + overflow }));
  }

  const peek = el('div', { class: 'section-peek', attrs: { 'aria-hidden': 'true' } }, peekThumbs);

  return el('summary', {}, [headingGroup, peek]);
}

function renderSections(sections) {
  const main = document.getElementById('catalog');
  // this page (e.g. 404.html) doesn't have a catalog — nothing to render,
  // and nothing for renderSectionNav() to hook into either
  if (!main) return { sectionEls: [], accordions: [] };

  // Built up as we go, in the same order as `sections`. projectsBySection
  // caches each section's project elements so the search box (in
  // renderSectionNav) can filter them without re-querying the DOM.
  const sectionEls = [];
  const accordions = [];
  const projectsBySection = [];

  sections.forEach(section => {
    const projectEls = section.projects.map(renderProject);
    const list = el('div', { class: 'project-list' }, projectEls);
    // Gives this section a stable #anchor so it can be linked to
    // directly.
    const id = assignSlug(section.heading, 'section');
    const sectionEl = el('details', { class: 'catalog-section', attrs: { id } }, [
      renderSectionSummary(section, id),
      list
    ]);

    const storageKey = 'section-open:' + section.heading;

    // See storageGet() above — falls back to the default open state below
    // if storage is unavailable rather than breaking the page.
    const saved = storageGet(storageKey);

    // A section can start collapsed via defaultOpen: false in data.js;
    // once someone toggles it, their choice is remembered instead.
    const defaultOpen = section.defaultOpen !== false;
    sectionEl.open = saved === null ? defaultOpen : saved === 'true';
    main.appendChild(sectionEl);
    const accordion = new Accordion(sectionEl, storageKey); // wires up the animated expand/collapse (see class below)

    sectionEls.push(sectionEl);
    accordions.push(accordion);
    projectsBySection.push(projectEls);
  });

  return { sectionEls, accordions, projectsBySection };
}

// Makes a <details> element animate open/close instead of snapping
// instantly, while keeping normal keyboard/screen-reader behavior.
// Animates the element's height, and only flips `open` once that
// animation finishes.
class Accordion {
  constructor(detailsEl, storageKey, { duration = 150, easing = 'ease-in-out', onToggle = null } = {}) {
    this.el = detailsEl;
    this.storageKey = storageKey;
    this.summary = detailsEl.querySelector('summary');
    this.duration = duration;
    this.easing = easing;
    this.animation = null;
    // Called once the accordion's state has actually settled (after its
    // animation finishes), not on the native "toggle" event — that
    // event fires too early and used to make labels flicker.
    this.onToggle = onToggle;

    if (!this.summary) {
      throw new Error('Accordion: no <summary> element found inside details element.');
    }

    this.restoreState();
    this.el.dataset.state = this.el.open ? 'expanded' : 'collapsed';

    this.onClick = this.onClick.bind(this);
    this.summary.addEventListener('click', this.onClick);
  }

  restoreState() {
    if (!this.storageKey) return;
    const saved = storageGet(this.storageKey);
    if (saved !== null) this.el.open = saved === 'true';
  }

  onClick(e) {
    e.preventDefault();
    if (this.animation) return; // ignore clicks until the current animation finishes
    this.toggle(!this.el.open);
  }

  toggle(shouldOpen) {
    const startHeight = `${this.el.getBoundingClientRect().height}px`;

    this.el.open = shouldOpen;
    this.el.style.height = '';
    const endHeight = `${this.el.getBoundingClientRect().height}px`;

    if (!shouldOpen) this.el.open = true; // keep content visible while collapsing

    this.runAnimation(startHeight, endHeight, shouldOpen);
  }

  runAnimation(startHeight, endHeight, opening) {
    this.el.style.overflow = 'hidden';
    this.el.dataset.state = opening ? 'expanded' : 'collapsed';

    const reduceMotion = prefersReducedMotion();

    this.animation = this.el.animate(
      { height: [startHeight, endHeight] },
      { duration: reduceMotion ? 0 : this.duration, easing: this.easing }
    );

    const finish = () => {
      this.el.open = opening;
      this.el.style.height = '';
      this.el.style.overflow = '';
      this.animation = null;
      this.saveState();
      // If this section (or a project card inside it) is what the
      // address bar's #hash is currently pointing at, collapsing it
      // makes that link stale — the linked content is no longer visible
      // on the page. Clear it so the URL doesn't keep advertising a
      // deep link to something that's now hidden.
      if (!opening && hashPointsInto(this.el)) clearHashSilently();
      this.onToggle?.(); // notify listeners now that the state has actually settled
    };

    this.animation.onfinish = finish;
  }

  saveState() {
    if (!this.storageKey) return;
    storageSet(this.storageKey, this.el.open);
  }

  destroy() {
    this.animation?.cancel();
    this.summary.removeEventListener('click', this.onClick);
  }
}

// Builds the sticky sub-nav: one jump button per section, an
// Expand/Collapse All button, and a live search box.
//
// `sectionEls`, `accordions` and `projectsBySection` are the arrays
// from renderSections() above, all in the same order as `sections`.
function renderSectionNav(sections, sectionEls, accordions, projectsBySection) {
  const nav = document.getElementById('section-nav');
  if (!nav || sectionEls.length === 0) return { syncNavState: () => {}, markJumped: () => {} }; // nothing to build a nav for (e.g. 404.html, or an empty catalog)

  /* ---------- Jump-to-section buttons + Expand/Collapse All ---------- */

  const jumpRow = el('div', { class: 'nav-jump-row' });

  // Tracks which section was last jumped to, so clicking its button
  // again collapses it — clicking a different section's button never
  // collapses anything.
  let lastJumpedIndex = null;

  // Handles to every jump button, same order as sectionEls/accordions.
  const jumpButtons = [];

  sections.forEach((section, i) => {
    const btn = el('button', {
      class: 'nav-jump-btn',
      text: section.heading,
      attrs: { type: 'button' }
    });
    jumpButtons.push(btn);
    btn.addEventListener('click', () => {
      const sectionEl = sectionEls[i];
      const accordion = accordions[i];

      // Updates the address bar so jump buttons behave like real
      // links, not just an in-page scroll.
      setHashSilently(sectionEl.id);

      const jumpToSection = () => {
        // Same check as initBackToTop() below: an instant jump instead of
        // a smooth scroll for anyone with prefers-reduced-motion set.
        const reduceMotion = prefersReducedMotion();
        sectionEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      };

      if (!sectionEl.open) {
        // Expands the section first if needed, and waits for that
        // animation to finish before scrolling to it.
        accordion.toggle(true);
        if (accordion.animation) {
          accordion.animation.finished.then(jumpToSection).catch(jumpToSection);
        } else {
          requestAnimationFrame(jumpToSection);
        }
        lastJumpedIndex = i;
      } else if (lastJumpedIndex === i) {
        // Already open, and this is the section we last jumped to — a
        // second click on the same button collapses it again.
        accordion.toggle(false);
        lastJumpedIndex = null;
      } else {
        // Already open, but we haven't just jumped here — just jump to it.
        jumpToSection();
        lastJumpedIndex = i;
      }
    });
    jumpRow.appendChild(btn);
  });

  // Lets handleDeepLink() record a section as "last jumped to" too, so
  // landing on it via a link and then clicking its own jump button
  // collapses it — the same as if you'd clicked the button to get
  // there — instead of the button treating you as arriving from
  // somewhere else and just re-scrolling to a spot you're already at.
  const markJumped = (sectionEl) => {
    const i = sectionEls.indexOf(sectionEl);
    if (i !== -1) lastJumpedIndex = i;
  };

  // Sits at the end of the jump row — a navigation control too, just
  // acting on every section at once.
  const toggleAllBtn = el('button', {
    class: 'nav-toggle-all',
    text: 'Collapse All',
    attrs: { type: 'button' }
  });

  // Keeps the "Expand/Collapse All" label accurate no matter how a
  // section was opened or closed.
  const syncToggleAllLabel = () => {
    const allOpen = accordions.every(a => a.el.open);
    toggleAllBtn.textContent = allOpen ? 'Collapse All' : 'Expand All';
  };

  // Fills in a jump button while its section is open, whatever caused
  // it to open or close.
  const syncJumpButtonStates = () => {
    jumpButtons.forEach((btn, i) => {
      btn.classList.toggle('is-open', sectionEls[i].open);
    });
  };

  // Both callbacks run on the same event, so combine them here.
  const onAccordionSettled = () => {
    syncToggleAllLabel();
    syncJumpButtonStates();
  };
  accordions.forEach(a => { a.onToggle = onAccordionSettled; });

  toggleAllBtn.addEventListener('click', () => {
    // If every section is already open, the button collapses all of them;
    // otherwise it opens whichever ones aren't open yet.
    const allOpen = accordions.every(a => a.el.open);
    accordions.forEach(a => {
      if (a.el.open === allOpen) a.toggle(!allOpen);
    });
    toggleAllBtn.textContent = allOpen ? 'Expand All' : 'Collapse All';
  });

  // Sets the correct label right away, based on each section's
  // restored open/closed state.
  syncToggleAllLabel();
  // Same idea as above, but for each jump button's filled/ghost state.
  syncJumpButtonStates();

  // Adds the divider + toggle-all button right after the section
  // buttons, so they read as one group.
  const toggleAllDivider = el('span', { class: 'nav-divider', attrs: { 'aria-hidden': 'true' } });
  jumpRow.appendChild(toggleAllDivider);
  jumpRow.appendChild(toggleAllBtn);

  /* ---------- Live search ---------- */

  const searchWrap = el('div', { class: 'nav-search-wrap' });
  const searchIcon = icon('search', 'nav-search-icon icon-sm');
  const searchInput = el('input', {
    class: 'nav-search-input',
    attrs: {
      type: 'search',
      id: 'site-search',
      placeholder: 'Search projects…',
      'aria-label': 'Search projects'
    }
  });

  // Clears the search box. Drawn as a plain CSS "×", same trick as the
  // chevron elsewhere in this file. Only shown when there's something
  // to clear.
  const clearBtn = el('button', {
    class: 'nav-search-clear',
    attrs: { type: 'button', 'aria-label': 'Clear search' }
  });
  clearBtn.hidden = true;

  const noResults = el('p', { class: 'nav-search-empty', text: 'No projects match your search.' });
  noResults.hidden = true;
  document.getElementById('catalog').appendChild(noResults);

  // Shows/hides the "×" button based on whether there's currently
  // anything in the search box to clear.
  const updateClearButton = () => {
    clearBtn.hidden = searchInput.value.length === 0;
  };

  // The actual filtering logic — pulled out into its own function so both
  // typing in the box (below) and clicking the "×" button can trigger it.
  const applySearchFilter = () => {
    const query = searchInput.value.trim().toLowerCase();
    let anyVisible = false;

    sectionEls.forEach((sectionEl, i) => {
      const projects = projectsBySection[i];
      let visibleInSection = 0;

      projects.forEach(project => {
        const matches = !query || (project.dataset.search || '').includes(query);
        project.style.display = matches ? '' : 'none';
        if (matches) visibleInSection++;
      });

      const sectionHasMatch = visibleInSection > 0;
      // Hide a section completely once nothing inside it matches; otherwise
      // make sure it's visible (a previous search may have hidden it).
      sectionEl.style.display = (query && !sectionHasMatch) ? 'none' : '';
      if (sectionHasMatch) anyVisible = true;

      if (query && sectionHasMatch && !sectionEl.open) {
        // Opens it directly, no animation, so fast typing doesn't
        // fight the accordion. Stays open once search is cleared.
        sectionEl.open = true;
        sectionEl.dataset.state = 'expanded';
      }
    });

    noResults.hidden = !(query && !anyVisible);
    // A search can open sections directly, bypassing the accordion's own
    // onToggle callback above, so both of these need re-syncing here too.
    syncToggleAllLabel();
    syncJumpButtonStates();
  };

  searchInput.addEventListener('input', () => {
    updateClearButton();
    applySearchFilter();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    updateClearButton();
    applySearchFilter();
    searchInput.blur(); // defocus, per the request — not just an empty box left with the cursor still in it
  });

  // The jump buttons + Expand/Collapse All live in their own row,
  // separate from search, and wrap onto more lines on narrow screens.
  nav.appendChild(jumpRow);

  searchWrap.appendChild(searchIcon);
  searchWrap.appendChild(searchInput);
  searchWrap.appendChild(clearBtn);

  // Search sits on its own on the other side of the bar, kept
  // separate from the jump buttons so their purpose stays clear.
  const controls = el('div', { class: 'nav-controls' }, [searchWrap]);
  nav.appendChild(controls);

  // Keeps the search box the same width as the link buttons above it,
  // re-measuring whenever that row's size changes.
  const topLinks = document.getElementById('top-links');
  const mobileQuery = window.matchMedia('(max-width: 620px)');
  if (topLinks) {
    const syncSearchWidth = () => {
      // On mobile the search box just fills its flexbox space instead
      // of matching the (now narrower) masthead links.
      if (mobileQuery.matches) {
        searchWrap.style.width = '';
        return;
      }
      const width = topLinks.getBoundingClientRect().width;
      if (width > 0) searchWrap.style.width = `${Math.round(width)}px`;
    };
    syncSearchWidth();
    if (window.ResizeObserver) {
      new ResizeObserver(syncSearchWidth).observe(topLinks);
    } else {
      window.addEventListener('resize', syncSearchWidth);
    }
    // Also listen for the breakpoint directly, since the
    // ResizeObserver above can miss it in some cases.
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', syncSearchWidth);
    } else {
      mobileQuery.addListener(syncSearchWidth); // Safari <14 fallback
    }
  }

  // Exposed so handleDeepLink() can keep the jump buttons and
  // Expand/Collapse All label in sync when it expands a section
  // directly, the same way search and the accordion's own toggle do.
  return { syncNavState: onAccordionSettled, markJumped };
}

// Fills in the footer: social links, copyright, disclaimer, and the
// site version (plain text, or a link if data.js gave it a URL).
function renderFooter(socials, footer, version) {
  const socialRow = document.getElementById('social-links');
  socials.forEach(s => {
    socialRow.appendChild(el('a', {
      class: 'social-link',
      href: s.url,
      attrs: {
        'aria-label': s.label, // read aloud by screen readers, since the icon alone has no text
        'data-tooltip': s.label // read by CSS to show the little hover tooltip (see .social-link::after in styles.css)
      }
    }, [
      icon(s.icon, 'icon-md')
    ]));
  });

  document.getElementById('copyright').textContent = footer.copyright;
  document.getElementById('disclaimer').textContent = footer.disclaimer;

  // "<prefix><link>" — text + link, so built with el() rather than set
  // via textContent (which can't mix in a nested <a>). Edit text in data.js.
  if (footer.iconCredits) {
    const creditsEl = document.getElementById('icon-credits');
    creditsEl.innerHTML = ''; // clear out anything already there before re-filling it
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
    versionEl.innerHTML = ''; // clear out anything that might already be there before re-filling it

    // version can be a plain string or an object with a label + url —
    // this handles both.
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

// Fades the "back to top" button in after scrolling down, and scrolls
// back to the top when clicked.
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return; // not every page has one (e.g. 404.html)

  const SHOW_AFTER = 400; // pixels scrolled down before the button appears

  const updateVisibility = () => {
    btn.classList.toggle('is-visible', window.scrollY > SHOW_AFTER);
  };
  updateVisibility(); // sets the correct state immediately, in case the page loads already scrolled down
  window.addEventListener('scroll', updateVisibility, { passive: true });

  btn.addEventListener('click', () => {
    const reduceMotion = prefersReducedMotion();
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

// If the page loaded with a #section-id or #project-id in the URL,
// expands that section and scrolls to it, briefly highlighting a
// linked project. Doesn't change any section's saved open/closed state.
// `nav` is the { syncNavState, markJumped } object from renderSectionNav().
function handleDeepLink(nav) {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;

  const target = document.getElementById(id);
  if (!target) return; // stale/unknown link — leave the page as-is rather than guessing

  const sectionEl = target.classList.contains('catalog-section')
    ? target
    : target.closest('.catalog-section');

  if (sectionEl) {
    if (!sectionEl.open) {
      sectionEl.open = true;
      sectionEl.dataset.state = 'expanded';
      // Expanding here bypasses the accordion's own toggle() (see the
      // search filter above for the same pattern), so the nav bar's jump
      // buttons and Expand/Collapse All label need a manual nudge —
      // otherwise a section opened via a deep link looks expanded on the
      // page but its jump button stays unfilled.
      nav?.syncNavState();
    }
    // Also record this as the section you "jumped to", same as clicking
    // its jump button would — otherwise clicking that same button right
    // after landing here via the link looks like it does nothing: the
    // button treats you as arriving from elsewhere and just re-scrolls
    // to where you already are, instead of collapsing the section.
    nav?.markJumped(sectionEl);
  }

  // Wait a frame so the (possibly just-expanded) layout has settled
  // before measuring where to scroll to.
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'auto', block: 'start' }); // instant, not smooth — this is where the page should land, not a navigation to animate

    if (target !== sectionEl) {
      // Makes it obvious which card the link pointed to. Purely visual,
      // and already disabled for reduced motion in styles.css.
      target.classList.add('is-linked-target');
      target.addEventListener('animationend', () => target.classList.remove('is-linked-target'), { once: true });
    }
  });
}

// Builds a JSON-LD <script> tag describing the org and its projects,
// straight from SITE_DATA, and drops it in <head>. This is what gives
// search engines an explicit, structured picture of the site (an
// Organization plus a list of SoftwareApplication entries) instead of
// having to infer one from the visible text — and since it's built
// from SITE_DATA at render time rather than hand-written in
// index.html, it can't drift out of sync with the actual catalog.
function renderStructuredData(data) {
  // Reuses the <link rel="canonical"> already in index.html as the
  // site's base URL, rather than hardcoding the domain a second time.
  const canonical = document.querySelector('link[rel="canonical"]');
  const siteUrl = canonical ? canonical.href : location.origin + '/';

  // Turns a path from data.js (e.g. "images/logo.png") into an
  // absolute URL, since structured data should use full URLs.
  const toAbsolute = path => path ? new URL(path, siteUrl).href : undefined;

  // Strips the tagline down to plain text (it contains a manual <br>
  // for the on-page line break — not meaningful in a JSON string).
  const tagline = (data.brand.tagline || '').replace(/<br\s*\/?>/gi, ' ').trim();

  const organization = {
    '@type': 'Organization',
    name: data.brand.name,
    url: siteUrl,
    logo: toAbsolute(data.brand.logo),
    description: tagline,
    // Combines the top nav links (Modrinth/GitHub orgs) and footer
    // socials into one "these are official profiles" list.
    sameAs: [...(data.topLinks || []), ...(data.socials || [])].map(l => l.url)
  };

  // One SoftwareApplication entry per project, across every section
  // (data packs/mods, resource packs, etc). Pulls version/download
  // info from the "stable" channel where a project has one.
  const items = [];
  (data.sections || []).forEach(section => {
    (section.projects || []).forEach(project => {
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
      // Uses the first available download's own version (e.g. the
      // Mod build might carry a different string than the Data Pack).
      const softwareVersion = firstDownload && firstDownload.version;
      if (softwareVersion) item.softwareVersion = softwareVersion;
      if (firstDownload) item.downloadUrl = firstDownload.url;
      items.push(item);
    });
  });

  const itemList = {
    '@type': 'ItemList',
    name: `${data.brand.name} Projects`,
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

/* ---------- Run everything ----------
   This is the only code that runs on page load — everything above is
   just function definitions until called here. */
(function init() {
  renderBrand(SITE_DATA.brand, SITE_DATA.topLinks);
  const { sectionEls, accordions, projectsBySection } = renderSections(SITE_DATA.sections);
  const nav = renderSectionNav(SITE_DATA.sections, sectionEls, accordions, projectsBySection);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  renderStructuredData(SITE_DATA);
  initBackToTop();
  handleDeepLink(nav);
  // Also handles a hash arriving after the initial load (pasted into
  // the address bar, or via browser back/forward).
  window.addEventListener('hashchange', () => handleDeepLink(nav));
})();