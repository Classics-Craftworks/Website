/* ============================================================
   RENDER SCRIPT
   ============================================================
   This file reads the content from data.js and builds the actual
   HTML elements you see on the page (logo, project list, footer, etc).

   You usually don't need to touch this file unless you want to change
   HOW content is rendered (e.g. add a new element to every project card).
   To change WHAT is shown (text, links, images), edit data.js instead.
   ============================================================ */

/* ---------- Small helper functions ----------
   These two functions do the repetitive parts of building elements,
   so the "render" functions below them stay short and readable. */

// Creates one icon (a small colored square shaped like an icon,
// e.g. the Discord logo) using a PNG file as a "mask".
// A mask means the browser uses the PNG's shape as a stencil and
// fills that shape with whatever color CSS gives it (currentColor).
// This lets the same icon file automatically match site themes.
function icon(name, cls) {
  const span = document.createElement('span');
  span.className = 'icon' + (cls ? ' ' + cls : '');
  span.setAttribute('aria-hidden', 'true'); // hide from screen readers — the visible text label next to it is enough
  const url = `url('images/icons/${name || 'link'}.png')`; // falls back to "link.png" if no icon name is given
  span.style.webkitMaskImage = url; // needed for Safari
  span.style.maskImage = url; // needed for other browsers
  return span;
}

// Turns a heading/title into a URL-anchor-friendly slug, e.g.
// "Data Packs & Mods" -> "data-packs-mods". Used to give every section
// and project a stable #id so people can link straight to it (see
// assignSlug() below and the hash-handling code near the bottom of
// this file).
function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // any run of non-alphanumeric chars becomes one hyphen
    .replace(/^-+|-+$/g, '');    // trim leading/trailing hyphens
}

// slugify() alone can't guarantee uniqueness (two projects could share a
// name, or a title could slugify to nothing) — this wraps it with a
// running tally of slugs already handed out so ids stay unique and
// non-empty across the whole page.
const usedSlugs = new Set();
function assignSlug(text, fallback) {
  let base = slugify(text) || fallback;
  let slug = base;
  let n = 2;
  while (usedSlugs.has(slug)) slug = `${base}-${n++}`;
  usedSlugs.add(slug);
  return slug;
}

// A shortcut for building an HTML element without writing
// document.createElement / setAttribute / appendChild every time.
// Example: el('a', { class: 'btn', text: 'Click me', href: '#' })
// creates: <a class="btn" href="#">Click me</a>
//
// tag      - the HTML tag name, e.g. 'div', 'a', 'span'
// opts     - an object of optional settings (class, text, href, src, alt, attrs)
// children - an array of other elements to nest inside this one
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

// Small "copy link" icon-button used by both section headings and project
// titles (see renderSectionSummary()/renderProject() below) to let people
// grab a direct #anchor link to that section or project. label is used
// for the accessible name/tooltip, e.g. "Copy link to Better Craftables".
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

    const url = `${location.origin}${location.pathname}#${id}`;

    // history.pushState (not location.hash =) updates the address bar
    // and browser history the same way a real anchor link would, but
    // without also firing a native hashchange/scroll — this button
    // already does its own copying rather than navigating anywhere.
    try { history.pushState(null, '', url); } catch { /* not fatal — clipboard copy below still works */ }

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
   Each function below builds one part of the page.
   They're called once, in order, at the very bottom of this file. */

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

// Builds ONE download channel box (e.g. the green "Release" box or the
// orange "Release Candidate" box) for a single project. A project can
// have multiple channels — see renderProject() below, which calls this
// once per channel.
function renderChannel(ch) {
  // "stable" / "beta" / "alpha" controls the box's color via CSS.
  // Falls back to "stable" if data.js didn't set a channel.
  const channelKey = (ch.channel || 'stable').toLowerCase();

  // Top row of the box: colored dot + channel name + divider + MC version
  const header = el('div', { class: 'channel-header' }, [
    el('span', { class: 'status-dot' }),
    el('span', { class: 'channel-label', text: ch.label }),
    el('span', { class: 'channel-sep', text: '|' }),
    el('span', { class: 'channel-mc', text: 'Java ' + ch.mcVersion })
  ]);

  // Container that will hold one column per download (Data Pack, Mod, etc.)
  // "has-multiple" flags channels with two download types side by side —
  // that's the only layout tight enough on mobile to need the pill forced
  // onto its own line (see .download-col-break below). A single-column
  // channel (e.g. a resource-pack-only release) has the full row width to
  // itself, so its pill comfortably sits inline next to the label instead.
  const hasMultipleDownloads = (ch.downloads || []).length > 1;
  const downloads = el('div', {
    class: 'channel-downloads' + (hasMultipleDownloads ? ' has-multiple' : '')
  });

  (ch.downloads || []).forEach(d => {
    // Each download in data.js explicitly says which icon to use
    // (e.g. icon: "brackets" for a data pack). Falls back to a
    // box icon if one isn't specified.
    const typeIcon = d.icon || 'box';

    // A download counts as "disabled" if data.js marked it disabled,
    // OR if it simply has no URL to link to.
    const isDisabled = d.disabled || !d.url;

    // The small header inside each download column: icon + label + version pill.
    // The empty "break" span between the label and the pill does nothing on
    // desktop (display: none — see .download-col-break in styles.css), but
    // below the mobile breakpoint it becomes a zero-height, full-width flex
    // item that forces the pill onto its own line every time, instead of
    // only when it happens not to fit next to the label. That keeps every
    // download column consistent on mobile, rather than some pills sitting
    // inline and others wrapping depending on how long the label is.
    const headerChildren = [
      icon(typeIcon, 'icon-sm'),
      el('span', { class: 'download-type-label', text: d.label }),
      el('span', { class: 'download-col-break', attrs: { 'aria-hidden': 'true' } }),
      el('span', { class: 'pill' + (isDisabled ? ' disabled-pill' : ''), text: isDisabled ? 'N/A' : ch.version })
    ];

    const colHeader = el('div', {
      class: 'download-col-header' + (isDisabled ? ' is-disabled' : '')
    }, headerChildren);

    // Either a clickable "Download" button, or greyed-out "Not available" text
    let actionEl;
    if (isDisabled) {
      actionEl = el('div', { class: 'download-unavailable', text: 'Not available' });
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
  }, [header, downloads]);
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

  // .map() here works just like .forEach() above, but it collects the
  // results into a new array instead of throwing them away
  const channelRow = el('div', { class: 'channel-row' },
    (p.channels || []).map(renderChannel)
  );

  // Plain-text blob used by the nav bar's search box (see renderSectionNav)
  // to decide whether this card matches whatever someone typed. Includes
  // each channel's MC version ("Java 1.20.1") and release version (the
  // text shown on its pill, e.g. "v8.0.0") alongside the title/description,
  // so searching "1.20.1" or "v8.0.0" finds the right project too.
  const versionText = (p.channels || [])
    .flatMap(ch => [ch.mcVersion, ch.version])
    .filter(Boolean)
    .join(' ');
  const searchText = [p.title, p.description, versionText].filter(Boolean).join(' ').toLowerCase();

  // Gives this project a stable #anchor (e.g. #better-craftables) so it
  // can be linked to directly — see copyLinkButton() and the hash
  // handling near the bottom of this file.
  const id = assignSlug(p.title, 'project');
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

// Builds every section (e.g. "Data Packs & Mods", "Resource Packs")
// and all the project cards inside each one, then adds them to <main>.
//
// Each section is a <details> element with the heading as its <summary> —
// that makes the whole section collapsible (click the heading to fold
// away every project inside it) with no custom toggle logic needed.
//
// We also remember each section's open/closed state in the browser's
// localStorage, keyed by the section's heading text, so it's restored
// the way the visitor left it next time they load the page. If nothing
// has been saved yet (first visit), sections default to open.
// Builds the clickable header row for one section: the heading (with its
// chevron), a small badge showing how many projects are inside, and — on
// the right — a little stack of project thumbnails that peeks out while
// the section is collapsed. The peek strip fades away once the section
// opens (see .section-peek in styles.css), since the real project cards
// take over at that point.
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

  // Only peek at a handful of thumbnails so the stack doesn't get silly
  // on sections with lots of projects — anything past that becomes a
  // plain "+N" chip instead of another image.
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

  // Handles to every section/accordion we build below, keyed by the same
  // order as `sections` — renderSectionNav() uses these to jump to, expand,
  // or collapse a given section from the nav bar.
  const sectionEls = [];
  const accordions = [];

  sections.forEach(section => {
    const list = el('div', { class: 'project-list' },
      section.projects.map(renderProject)
    );
    // Gives this section a stable #anchor (e.g. #data-packs-mods) so it
    // can be linked to directly — see copyLinkButton() and the hash
    // handling near the bottom of this file.
    const id = assignSlug(section.heading, 'section');
    const sectionEl = el('details', { class: 'catalog-section', attrs: { id } }, [
      renderSectionSummary(section, id),
      list
    ]);

    const storageKey = 'section-open:' + section.heading;

    // localStorage can throw in some situations (e.g. Safari private
    // browsing, or a browser with storage disabled entirely), so every
    // read/write is wrapped in try/catch — if it fails, we just fall
    // back to the default open state instead of breaking the page.
    let saved = null;
    try {
      saved = localStorage.getItem(storageKey);
    } catch (e) { /* storage unavailable — ignore and use the default below */ }

    // A section can set defaultOpen: false in data.js to start collapsed
    // for first-time visitors. Once someone toggles it, their choice is
    // remembered (see the localStorage read above) and wins from then on.
    const defaultOpen = section.defaultOpen !== false;
    sectionEl.open = saved === null ? defaultOpen : saved === 'true';
    main.appendChild(sectionEl);
    const accordion = new Accordion(sectionEl, storageKey); // wires up the animated expand/collapse (see class below)

    sectionEls.push(sectionEl);
    accordions.push(accordion);
  });

  return { sectionEls, accordions };
}

// Makes a <details> element animate its open/close instead of snapping
// instantly, while keeping all the native <details>/<summary> behaviour
// (keyboard toggling, find-in-page auto-expand, screen reader semantics).
//
// The browser only animates properties like height/opacity, not the
// open/closed state itself, so this steps in on click: it stops the
// browser's own instant toggle, animates the element's height from its
// current value to its target value with the Web Animations API, and
// only flips `open` (or removes it) once that animation finishes.
class Accordion {
  constructor(detailsEl, storageKey, { duration = 150, easing = 'ease-in-out', onToggle = null } = {}) {
    this.el = detailsEl;
    this.storageKey = storageKey;
    this.summary = detailsEl.querySelector('summary');
    this.duration = duration;
    this.easing = easing;
    this.animation = null;
    // Called only once the accordion's state has genuinely settled (after
    // its animation finishes) — see runAnimation()/finish() below. This is
    // deliberately NOT wired to the native <details> "toggle" event: toggle()
    // briefly flips `open` false-then-true again when *closing* (to measure
    // the collapsed height while keeping content visible for the animation),
    // and that transient flip fires its own native toggle events which don't
    // reflect the real end state. Listening to those directly is what used
    // to make the Expand/Collapse All label flicker between states.
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
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved !== null) this.el.open = saved === 'true';
    } catch {
      /* localStorage unavailable (private mode, disabled, etc.) — ignore */
    }
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

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      this.onToggle?.(); // notify listeners now that the state has actually settled
    };

    this.animation.onfinish = finish;
  }

  saveState() {
    if (!this.storageKey) return;
    try {
      localStorage.setItem(this.storageKey, this.el.open);
    } catch {
      /* ignore quota / privacy errors */
    }
  }

  destroy() {
    this.animation?.cancel();
    this.summary.removeEventListener('click', this.onClick);
  }
}

// Builds the sticky sub-nav under the masthead: one button per section that
// jumps to (and expands, if needed) that section, an "Expand/Collapse All"
// button, and a live search box that filters project cards as you type.
//
// `sectionEls` and `accordions` are the arrays returned by renderSections()
// above, in the same order as `sections` — index i in one lines up with
// index i in the others.
function renderSectionNav(sections, sectionEls, accordions) {
  const nav = document.getElementById('section-nav');
  if (!nav || sectionEls.length === 0) return; // nothing to build a nav for (e.g. 404.html, or an empty catalog)

  /* ---------- Jump-to-section buttons + Expand/Collapse All ---------- */

  const jumpRow = el('div', { class: 'nav-jump-row' });

  // Tracks which section (by index) was most recently expanded-and-jumped-to
  // via one of these buttons. Clicking that same button again collapses the
  // section. Clicking any other section's button — even one that's already
  // open some other way (default-open, opened via its own heading, etc.) —
  // just jumps to it and doesn't collapse anything.
  let lastJumpedIndex = null;

  // Handles to every jump button, in the same order as sectionEls/accordions,
  // so syncJumpButtonStates() below can look up "is this button's section
  // open?" and fill it in accordingly.
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
      const jumpToSection = () => {
        // Same check as initBackToTop() below: an instant jump instead of
        // a smooth scroll for anyone with prefers-reduced-motion set.
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        sectionEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      };

      if (!sectionEl.open) {
        // Expand it first (if it's collapsed) so you're not scrolled to a
        // heading with nothing visible underneath it. Wait for the expand
        // animation to actually finish before scrolling — jumping mid
        // animation (while the section's layout is still growing) is what
        // used to make the first click "just expand" and need a second
        // click to actually land on the section.
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

  // Expand/Collapse All sits at the end of the jump row, set apart from
  // the section buttons by a divider (see nav-divider below) — it's a
  // navigation control like them, just acting on every section at once.
  const toggleAllBtn = el('button', {
    class: 'nav-toggle-all',
    text: 'Collapse All',
    attrs: { type: 'button' }
  });

  // Keep the "Expand All" / "Collapse All" label honest even when a section
  // is opened/closed some other way (its own heading, or a jump button).
  // Hooked up via each Accordion's onToggle callback (fires once its state
  // has actually settled) rather than the native <details> "toggle" event,
  // which used to fire spuriously mid-animation and flicker the label.
  const syncToggleAllLabel = () => {
    const allOpen = accordions.every(a => a.el.open);
    toggleAllBtn.textContent = allOpen ? 'Collapse All' : 'Expand All';
  };

  // Fills in each jump button while its section is open, and reverts it
  // to the plain ghost style once that section closes again — regardless
  // of *how* it was opened or closed (its own jump button, its own
  // heading, Expand/Collapse All, or the search box below).
  const syncJumpButtonStates = () => {
    jumpButtons.forEach((btn, i) => {
      btn.classList.toggle('is-open', sectionEls[i].open);
    });
  };

  // Both callbacks care about the same event (a section's state actually
  // settling), so run them together rather than fighting over which one
  // gets to be `onToggle`.
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

  // Set the correct label immediately based on each section's *restored*
  // state (localStorage / defaultOpen), instead of leaving the hardcoded
  // "Collapse All" text from creation above. Without this, a visitor whose
  // sections all loaded collapsed would see "Collapse All" sitting there
  // until they manually toggled something.
  syncToggleAllLabel();
  // Same idea as the label above, but for each jump button's filled/ghost
  // state — set it once up front from each section's restored open state,
  // rather than leaving every button in its default ghost styling until
  // something toggles.
  syncJumpButtonStates();

  // Append the divider + toggle-all button to the jump row itself, right
  // after the section buttons — they're both navigation controls, just
  // acting on one section vs. all of them, so they read as one group
  // instead of toggle-all being stranded over with the unrelated search box.
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

  // Clears the search box and defocuses it. Drawn as a plain CSS "×" (two
  // rotated bars, same technique as the chevron/back-to-top icons
  // elsewhere in this file) rather than an image icon, so it doesn't
  // depend on an icons8 asset existing. Only shown once there's actually
  // something to clear — see updateClearButton() below.
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

    sectionEls.forEach(sectionEl => {
      const projects = sectionEl.querySelectorAll('.project');
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
        // Force it open directly (no animation, no localStorage write) so
        // typing quickly doesn't fight the accordion's own transitions.
        // Left open once the search is cleared too, rather than snapping
        // shut again — someone may still be reading it.
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

  // The section jump buttons + Expand/Collapse All live in their own row,
  // separate from search (see .nav-controls below). This row wraps onto
  // as many lines as it needs on narrow screens rather than scrolling
  // horizontally (see the .nav-jump-row rules inside the mobile media
  // query in styles.css).
  nav.appendChild(jumpRow);

  searchWrap.appendChild(searchIcon);
  searchWrap.appendChild(searchInput);
  searchWrap.appendChild(clearBtn);

  // Search sits on its own on the other side of the bar (.section-nav's
  // space-between handles the split) — it acts on the whole catalog like
  // Expand/Collapse All does, but pairing it with a text input instead of
  // the jump buttons would make the jump row's purpose (navigation) less
  // clear at a glance.
  const controls = el('div', { class: 'nav-controls' }, [searchWrap]);
  nav.appendChild(controls);

  // Keep the search box the same width as the two link buttons in the
  // masthead above it (#top-links), rather than a fixed guess — those
  // buttons' combined width depends on their label text, which data.js
  // controls. Re-measures whenever that row's size changes (window
  // resize, or its own content/font reflowing) rather than just once.
  const topLinks = document.getElementById('top-links');
  const mobileQuery = window.matchMedia('(max-width: 620px)');
  if (topLinks) {
    const syncSearchWidth = () => {
      // Below the mobile breakpoint the search box fills whatever space
      // .nav-controls' flexbox gives it (see styles.css) instead of
      // matching the masthead links — those links sit in their own
      // stacked row on mobile and can be much narrower than the screen,
      // which would otherwise force the search box to be narrow too.
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
    // Crossing the mobile breakpoint doesn't always change #top-links'
    // own size (e.g. it was already on one line either side of it), so
    // the ResizeObserver above can miss it — listen for the breakpoint
    // itself too.
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', syncSearchWidth);
    } else {
      mobileQuery.addListener(syncSearchWidth); // Safari <14 fallback
    }
  }
}

// Fills in the footer: social icon links, copyright line, disclaimer,
// and the site version (shown as a plain label, or a clickable link
// to the changelog if data.js gave it a URL).
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

    // version can be given in data.js either as a plain string ("e.g. v0.1.1")
    // or as an object with a label + a url to link to. This handles both.
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

// Fades the "back to top" button in once the visitor has scrolled down a
// bit, and scrolls smoothly back to the top when it's clicked — instantly
// instead of smoothly for anyone with prefers-reduced-motion set.
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
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

// If the page was loaded (or navigated to, e.g. via browser back/forward)
// with a #section-id or #project-id hash — see assignSlug()/copyLinkButton()
// above — this expands that section if it was collapsed and scrolls to it,
// briefly highlighting the target if it's a specific project rather than
// a whole section. Doesn't touch each section's saved open/closed
// preference (see Accordion.saveState): following a link is a one-off
// visit, not a statement about how you want the page laid out next time.
function handleDeepLink() {
  const id = decodeURIComponent(location.hash.slice(1));
  if (!id) return;

  const target = document.getElementById(id);
  if (!target) return; // stale/unknown link — leave the page as-is rather than guessing

  const sectionEl = target.classList.contains('catalog-section')
    ? target
    : target.closest('.catalog-section');

  if (sectionEl && !sectionEl.open) {
    sectionEl.open = true;
    sectionEl.dataset.state = 'expanded';
  }

  // Wait a frame so the (possibly just-expanded) layout has settled
  // before measuring where to scroll to.
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'auto', block: 'start' }); // instant, not smooth — this is where the page should land, not a navigation to animate

    if (target !== sectionEl) {
      // A linked project can be one of several similar-looking cards in
      // a long list — this pulse makes it obvious which one the link
      // actually pointed at. Purely visual (color/shadow, nothing that
      // moves), and .is-linked-target's animation is itself removed
      // under prefers-reduced-motion in styles.css, so this is safe to
      // always add.
      target.classList.add('is-linked-target');
      target.addEventListener('animationend', () => target.classList.remove('is-linked-target'), { once: true });
    }
  });
}

/* ---------- Run everything ----------
   This is the only code that actually executes on page load — everything
   above is just function definitions sitting idle until called.
   Wrapping it in (function () { ... })() (an "IIFE") keeps these calls
   out of the global scope, so they don't clash with anything else. */
(function init() {
  renderBrand(SITE_DATA.brand, SITE_DATA.topLinks);
  const { sectionEls, accordions } = renderSections(SITE_DATA.sections);
  renderSectionNav(SITE_DATA.sections, sectionEls, accordions);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
  initBackToTop();
  handleDeepLink();
  // Also handles a hash arriving after the initial load — pasting a new
  // #anchor into the address bar, or using browser back/forward after
  // clicking a copy-link button (see copyLinkButton(), which uses
  // history.pushState so those are real history entries).
  window.addEventListener('hashchange', handleDeepLink);
})();