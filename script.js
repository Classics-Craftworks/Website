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
  const downloads = el('div', { class: 'channel-downloads' });

  (ch.downloads || []).forEach(d => {
    // Each download in data.js explicitly says which icon to use
    // (e.g. icon: "brackets" for a data pack). Falls back to a
    // box icon if one isn't specified.
    const typeIcon = d.icon || 'box';

    // A download counts as "disabled" if data.js marked it disabled,
    // OR if it simply has no URL to link to.
    const isDisabled = d.disabled || !d.url;

    // The small header inside each download column: icon + label + version pill
    const headerChildren = [
      icon(typeIcon, 'icon-sm'),
      el('span', { class: 'download-type-label', text: d.label }),
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

  return el('article', { class: 'project' }, [
    el('img', { class: 'project-image', src: p.image, alt: p.title, attrs: { loading: 'lazy' } }), // loading="lazy": don't download this image until it's about to scroll into view
    el('div', { class: 'project-body' }, [
      el('h3', { text: p.title }),
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
function renderSectionSummary(section) {
  const projects = section.projects || [];

  const heading = el('h2', {}, [
    el('span', { class: 'heading-label', text: section.heading })
  ]);

  const count = el('span', {
    class: 'section-count',
    text: String(projects.length)
  });

  const headingGroup = el('div', { class: 'section-heading-group' }, [heading, count]);

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
  if (!main) return; // this page (e.g. 404.html) doesn't have a catalog — nothing to render
  sections.forEach(section => {
    const list = el('div', { class: 'project-list' },
      section.projects.map(renderProject)
    );
    const sectionEl = el('details', { class: 'catalog-section' }, [
      renderSectionSummary(section),
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
    new Accordion(sectionEl, storageKey); // wires up the animated expand/collapse (see class below)
  });
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
  constructor(detailsEl, storageKey, { duration = 150, easing = 'ease-in-out' } = {}) {
    this.el = detailsEl;
    this.storageKey = storageKey;
    this.summary = detailsEl.querySelector('summary');
    this.duration = duration;
    this.easing = easing;
    this.animation = null;

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

/* ---------- Run everything ----------
   This is the only code that actually executes on page load — everything
   above is just function definitions sitting idle until called.
   Wrapping it in (function () { ... })() (an "IIFE") keeps these calls
   out of the global scope, so they don't clash with anything else. */
(function init() {
  renderBrand(SITE_DATA.brand, SITE_DATA.topLinks);
  renderSections(SITE_DATA.sections);
  renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
})();