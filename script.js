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
function renderSections(sections) {
  const main = document.getElementById('catalog');
  sections.forEach(section => {
    const list = el('div', { class: 'project-list' },
      section.projects.map(renderProject)
    );
    const sectionEl = el('details', { class: 'catalog-section' }, [
      el('summary', {}, [
        el('h2', { text: section.heading })
      ]),
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

    sectionEl.open = saved === null ? true : saved === 'true';
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
  constructor(detailsEl, storageKey) {
    this.el = detailsEl;
    this.storageKey = storageKey; // used to persist open/closed state — see saveState() below
    this.summary = detailsEl.querySelector('summary');
    this.content = detailsEl.querySelector('.project-list');
    this.animation = null;
    this.isClosing = false;
    this.isExpanding = false;
    // Drives the chevron in styles.css. Kept separate from the `open`
    // attribute, which for a collapse is deliberately only flipped once
    // the animation finishes (see collapse() below) — if the chevron's
    // CSS keyed off `[open]` directly it would wait for that same moment
    // and visibly lag behind the box shrinking.
    this.el.dataset.state = this.el.open ? 'expanded' : 'collapsed';
    this.summary.addEventListener('click', e => this.onClick(e));
  }

  onClick(e) {
    e.preventDefault(); // stop the native instant toggle
    this.el.style.overflow = 'hidden'; // clip content while the height is mid-animation
    if (this.isClosing || !this.el.open) {
      this.expand();
    } else if (this.isExpanding || this.el.open) {
      this.collapse();
    }
  }

  collapse() {
    this.isClosing = true;
    this.el.dataset.state = 'collapsed'; // chevron turns immediately, not at animation end
    const startHeight = `${this.el.offsetHeight}px`;
    const endHeight = `${this.summary.offsetHeight}px`;
    this.runAnimation(startHeight, endHeight, false);
  }

  expand() {
    this.el.dataset.state = 'expanded'; // chevron turns immediately
    // open must be set before measuring, so the content is laid out and
    // has a real height to animate toward — but this jumps the box to
    // full height first, so lock it back to its current height first,
    // then let requestAnimationFrame animate from there on the next frame.
    this.el.style.height = `${this.el.offsetHeight}px`;
    this.el.open = true;
    window.requestAnimationFrame(() => {
      this.isExpanding = true;
      const startHeight = `${this.el.offsetHeight}px`;
      // scrollHeight, not a manual "summary + content" sum, is what the
      // browser itself will land on once the inline height is cleared at
      // the end — using anything else risks a 1-2px mismatch that "pops"
      // right as the animation finishes and can nudge the whole page's
      // height across the scrollbar threshold, shifting everything sideways.
      const endHeight = `${this.el.scrollHeight}px`;
      this.runAnimation(startHeight, endHeight, true);
    });
  }

  runAnimation(startHeight, endHeight, opening) {
    if (this.animation) this.animation.cancel();
    this.animation = this.el.animate(
      { height: [startHeight, endHeight] },
      {
        duration: 300,
        easing: 'ease-in-out',
        // Without this, the instant the animation's timeline ends the
        // browser reverts `height` to its underlying stylesheet value
        // (auto, since we never set one) — before the async `onfinish`
        // below runs and sets the inline height itself. That gap is a
        // one-frame flash to a different height: the "bounce". Holding
        // the animated end value with fill: 'forwards' closes the gap.
        fill: 'forwards'
      }
    );
    this.animation.onfinish = () => {
      this.el.open = opening;
      this.el.style.height = '';
      this.el.style.overflow = '';
      this.animation = null;
      this.isClosing = false;
      this.isExpanding = false;
      this.saveState(); // remember this section's new state for next visit
    };
    this.animation.oncancel = () => {
      this.isClosing = false;
      this.isExpanding = false;
    };
  }

  // Persists this section's open/closed state to localStorage, so
  // renderSections() can restore it on the next page load. Wrapped in
  // try/catch for the same reason as the read in renderSections — some
  // browsers/privacy modes throw rather than silently no-op.
  saveState() {
    if (!this.storageKey) return;
    try {
      localStorage.setItem(this.storageKey, this.el.open);
    } catch (e) { /* storage unavailable — the toggle still works, it just won't persist */ }
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