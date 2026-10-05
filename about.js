/* ============================================================
   ABOUT PAGE

   The page's text lives in about.md (next to this file) - edit that
   to change the page. This script fetches it and turns it into
   elements with a small built-in Markdown renderer, so no library or
   build step is needed. The header, footer and brand are built from
   data.js (helpers come from section-page.js, loaded before this file).

   Supported Markdown:
     # Heading      "#" becomes <h1> (the page title), "##" <h2>,
                    "###" <h3>
     paragraphs     separated by a blank line
     **bold**  *italic*  `code`  [link text](https://example.com)
     - bullets      (also * or +)       1. numbered lists
     > quote        --- divider         ``` fenced code block
     <!-- notes -->  ignored, handy for leaving yourself comments
     \* \_ \`        a backslash shows the next symbol literally
   Not supported: nested lists, tables, images, raw HTML (shown as text).

   Needs the page served over http(s), like the rest of the site -
   browsers block fetch() for pages opened straight from disk.
   ============================================================ */

// Only these kinds of link are turned into <a>; anything else
// (javascript:, data:, ...) is shown as plain text.
function isSafeUrl(url) {
  return /^(https?:|mailto:|#|\/|\.\.?\/|[^:]*$)/i.test(url);
}

function makeLink(label, url) {
  const a = document.createElement('a');
  a.className = 'about-link';
  a.href = url;
  // Links off this site open in a new tab, same as the project links.
  try {
    if (new URL(a.href).origin !== location.origin && /^https?:/i.test(a.href)) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
  } catch { /* leave as a normal link */ }
  a.appendChild(parseInline(label));
  return a;
}

// Inline formatting inside one line/paragraph. Built from DOM nodes, never
// innerHTML, so nothing in about.md can inject markup.
function parseInline(text) {
  const frag = document.createDocumentFragment();
  const pattern = new RegExp([
    '\\\\([\\\\`*_\\[\\]()#>+.!-])',        // 1: escaped symbol
    '`([^`]+)`',                           // 2: code
    '\\*\\*(.+?)\\*\\*',                   // 3: bold
    '\\*([^*\\s](?:[^*]*[^*\\s])?)\\*',    // 4: italic
    '\\[([^\\]]+)\\]\\(([^)\\s]+)\\)'      // 5, 6: link text, url
  ].join('|'), 'g');

  let last = 0, m;
  while ((m = pattern.exec(text))) {
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    if (m[1] !== undefined) frag.appendChild(document.createTextNode(m[1]));
    else if (m[2] !== undefined) frag.appendChild(el('code', { class: 'about-code', text: m[2] }));
    else if (m[3] !== undefined) frag.appendChild(el('strong', {}, [parseInline(m[3])]));
    else if (m[4] !== undefined) frag.appendChild(el('em', {}, [parseInline(m[4])]));
    else if (isSafeUrl(m[6])) frag.appendChild(makeLink(m[5], m[6]));
    else frag.appendChild(document.createTextNode(m[5]));
    last = pattern.lastIndex;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  return frag;
}

// Turns Markdown source into an array of block elements.
function parseMarkdown(source) {
  const lines = source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\r\n?/g, '\n')
    .split('\n');
  const blocks = [];
  let i = 0;

  const isBlank = l => !l.trim();
  const heading = l => l.match(/^(#{1,3})\s+(.*?)\s*#*\s*$/);
  const bullet = l => l.match(/^\s*[-*+]\s+(.*)$/);
  const numbered = l => l.match(/^\s*\d+[.)]\s+(.*)$/);
  const rule = l => /^\s*([-*_])(\s*\1){2,}\s*$/.test(l);
  const quote = l => l.match(/^\s*>\s?(.*)$/);
  const fence = l => /^\s*```/.test(l);
  const startsBlock = l => heading(l) || bullet(l) || numbered(l) || rule(l) || quote(l) || fence(l);

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }

    if (fence(line)) {
      const code = [];
      i++;
      while (i < lines.length && !fence(lines[i])) code.push(lines[i++]);
      i++; // closing fence
      blocks.push(el('pre', { class: 'about-pre' }, [el('code', { text: code.join('\n') })]));
      continue;
    }

    let m = heading(line);
    if (m) {
      // # -> h1, ## -> h2, ### -> h3
      blocks.push(el('h' + m[1].length, { class: 'about-h' }, [parseInline(m[2])]));
      i++;
      continue;
    }

    if (rule(line)) {
      blocks.push(el('hr', { class: 'about-rule' }));
      i++;
      continue;
    }

    if (quote(line)) {
      const parts = [];
      while (i < lines.length && quote(lines[i])) parts.push(quote(lines[i++])[1]);
      blocks.push(el('blockquote', { class: 'about-quote' }, [parseInline(parts.join(' '))]));
      continue;
    }

    const listMatch = bullet(line) ? bullet : numbered(line) ? numbered : null;
    if (listMatch) {
      const items = [];
      while (i < lines.length && listMatch(lines[i])) {
        let text = listMatch(lines[i++])[1];
        // Indented continuation lines belong to the same item.
        while (i < lines.length && /^\s+\S/.test(lines[i]) && !bullet(lines[i]) && !numbered(lines[i])) {
          text += ' ' + lines[i++].trim();
        }
        items.push(el('li', {}, [parseInline(text)]));
      }
      blocks.push(el(listMatch === bullet ? 'ul' : 'ol', { class: 'about-list' }, items));
      continue;
    }

    // Paragraph: runs until a blank line or the start of another block.
    const parts = [];
    while (i < lines.length && !isBlank(lines[i]) && !(parts.length && startsBlock(lines[i]))) {
      parts.push(lines[i++].trim());
    }
    blocks.push(el('p', { class: 'about-text' }, [parseInline(parts.join(' '))]));
  }

  return blocks;
}

async function renderAbout() {
  const main = document.getElementById('about');
  if (!main) return;

  try {
    const response = await fetch('about.md', { cache: 'no-cache' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const blocks = parseMarkdown(await response.text());
    if (!blocks.length) throw new Error('empty');
    blocks.forEach(b => main.appendChild(b));
  } catch {
    main.appendChild(el('h1', { class: 'about-h', text: 'About' }));
    main.appendChild(el('p', { class: 'about-text', text: "Sorry, this page's text couldn't be loaded. Try refreshing the page." }));
  }
}

renderBrand(SITE_DATA.brand);
renderSiteHeader(SITE_DATA.pages || [], 'about');
renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
renderAbout();
