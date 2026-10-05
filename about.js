/* ============================================================
   ABOUT PAGE

   The page's text lives in data.js under SITE_DATA.about - edit it
   there (the format is explained in the comment above it). This
   script just turns that data into elements. No Markdown parsing,
   no extra file to fetch, so the page builds instantly and the
   text is searchable/editable alongside the rest of the site data.
   The header, footer and brand come from section-page.js.
   ============================================================ */

// Total number of projects listed on the site, for the {projects} placeholder.
function countProjects() {
  return (SITE_DATA.sections || []).reduce((n, s) => n + (s.projects || []).length, 0);
}

// Fills in {placeholders} inside a piece of text.
function fillPlaceholders(text) {
  const values = { projects: countProjects() };
  return String(text).replace(/\{(\w+)\}/g, (whole, key) => (key in values ? values[key] : whole));
}

// Only these kinds of link are made clickable.
function isSafeUrl(url) {
  return /^(https?:|mailto:|#|\/|\.\.?\/|[^:]*$)/i.test(url);
}

function aboutLink(label, url) {
  if (!isSafeUrl(url)) return document.createTextNode(label);
  const a = el('a', { class: 'about-link', text: fillPlaceholders(label) });
  a.href = url;
  // Links off this site open in a new tab, same as the project links.
  if (/^https?:/i.test(a.href) && new URL(a.href).origin !== location.origin) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

// Text is a string, or an array of strings and {link,url} / {bold} / {italic} / {code} pieces.
function inline(content) {
  const frag = document.createDocumentFragment();
  [].concat(content).forEach(part => {
    if (typeof part === 'string') frag.appendChild(document.createTextNode(fillPlaceholders(part)));
    else if (part.link !== undefined) frag.appendChild(aboutLink(part.link, part.url || ''));
    else if (part.bold !== undefined) frag.appendChild(el('strong', {}, [inline(part.bold)]));
    else if (part.italic !== undefined) frag.appendChild(el('em', {}, [inline(part.italic)]));
    else if (part.code !== undefined) frag.appendChild(el('code', { class: 'about-code', text: part.code }));
  });
  return frag;
}

function renderBlock(block) {
  if (typeof block === 'string' || Array.isArray(block)) {
    return el('p', { class: 'about-text' }, [inline(block)]);
  }
  if (block.heading) return el('h2', { class: 'about-h' }, [inline(block.heading)]);
  if (block.list) return el('ul', { class: 'about-list' }, block.list.map(item => el('li', {}, [inline(item)])));
  if (block.quote) return el('blockquote', { class: 'about-quote' }, [inline(block.quote)]);
  if (block.divider) return el('hr', { class: 'about-rule' });
  return null;
}

function renderAbout() {
  const main = document.getElementById('about');
  const about = SITE_DATA.about;
  if (!main || !about) return;

  // Same heading element and class as the project pages (renderFlatSection
  // in section-page.js), so size and position match exactly.
  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: 'about-heading' } }, [
    el('span', { text: about.heading || 'About' })
  ]));
  (about.content || []).forEach(b => {
    const node = renderBlock(b);
    if (node) main.appendChild(node);
  });
}

renderBrand(SITE_DATA.brand);
renderSiteHeader(SITE_DATA.pages || [], 'about');
renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
renderAbout();
