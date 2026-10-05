/* About page: renders SITE_DATA.about (data.js; format documented there). */

function fillPlaceholders(text) {
  const projects = (SITE_DATA.sections || []).reduce((n, s) => n + (s.projects || []).length, 0);
  return String(text).replace(/\{projects\}/g, projects);
}

// Only http(s), mailto and relative/anchor links become clickable.
function isSafeUrl(url) {
  return /^(https?:|mailto:|#|\/|\.\.?\/|[^:]*$)/i.test(url);
}

function aboutLink(label, url) {
  if (!isSafeUrl(url)) return document.createTextNode(label);

  const a = el('a', { class: 'about-link', text: fillPlaceholders(label) });
  a.href = url;
  if (/^https?:/i.test(a.href) && new URL(a.href).origin !== location.origin) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

// Text is a string, or an array mixing strings with { link, url } / { bold } /
// { italic } / { code } pieces.
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
  if (typeof block === 'string' || Array.isArray(block)) return el('p', { class: 'about-text' }, [inline(block)]);
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

  // Same heading markup as the project pages, so the two match exactly.
  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: 'about-heading' } }, [
    el('span', { text: about.heading || 'About' })
  ]));
  (about.content || []).forEach(block => {
    const node = renderBlock(block);
    if (node) main.appendChild(node);
  });
}

renderBrand(SITE_DATA.brand);
renderSiteHeader(SITE_DATA.pages || [], 'about');
renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
renderAbout();
