/* Landing feature: the home-page blocks for a site that is one thing rather than a catalogue of projects:
   "What to expect" (features), "How to join" and "Supported versions", described in SITE_DATA.home.
   A site opts in with `features: ['landing']` in site.config.js. Loads before home.js. */

// Text as a string or an array of strings and { link, url } / { bold } / { code } pieces.
function richText(parts) {
  const list = Array.isArray(parts) ? parts : [parts];
  return list.map(part => {
    if (typeof part === 'string') return document.createTextNode(part);
    if (part.link) return isExternalUrl(part.url) ? el('a', { href: part.url, class: 'inline-link', text: part.link }) : internalLink('inline-link', part.url, [document.createTextNode(part.link)]);
    if (part.bold) return el('strong', { text: part.bold });
    if (part.code) return el('code', { text: part.code });
    return document.createTextNode('');
  });
}

function richParagraph(className, parts) {
  const p = el('p', { class: className });
  richText(parts).forEach(node => p.appendChild(node));
  return p;
}

// Section wrapper for the home blocks: a heading, an optional intro, then the content.
function homeBlock(block, className, content) {
  const head = el('div', { class: 'home-block-head' }, [
    el('h2', { class: 'projects-heading', text: block.heading, attrs: block.id ? { id: block.id + '-heading' } : {} }),
    block.intro ? el('p', { class: 'projects-subtitle', text: block.intro }) : null
  ]);
  return el('section', { class: 'home-block ' + className, attrs: block.id ? { id: block.id, 'aria-labelledby': block.id + '-heading' } : {} }, [head, ...content]);
}

// Copies text to the clipboard; the label changes to "Copied" for a moment.
function copyButton(text, what) {
  const label = el('span', { text: 'Copy' });
  const btn = el('button', { class: 'copy-btn', attrs: { type: 'button', 'aria-label': `Copy ${what}` } }, [icon('link', 'icon-sm'), label]);
  btn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(text); label.textContent = 'Copied'; }
    catch { label.textContent = 'Press Ctrl+C'; }
    window.clearTimeout(btn._timer);
    btn._timer = window.setTimeout(() => { label.textContent = 'Copy'; }, 2000);
  });
  return btn;
}

// "How to join": numbered steps, the server address(es) and the apply card.
function renderJoin(join) {
  const steps = el('ol', { class: 'join-steps' }, (join.steps || []).map(step =>
    el('li', { class: 'join-step' }, [
      el('span', { class: 'join-step-body' }, [
        el('span', { class: 'join-step-title', text: step.title }),
        richParagraph('join-step-text', step.text)
      ])
    ])
  ));

  const addresses = (join.addresses || []).length ? el('div', { class: 'join-addresses' }, join.addresses.map(a =>
    el('div', { class: 'address-row' }, [
      el('span', { class: 'address-label', text: a.label }),
      el('span', { class: 'address-value' }, [
        el('code', { text: a.value }),
        a.port ? el('span', { class: 'address-port', text: 'Port ' + a.port }) : null
      ]),
      copyButton(a.value, `${a.label} address`)
    ])
  )) : null;

  const left = el('div', { class: 'join-main' }, [steps, addresses, join.footnote ? richParagraph('home-block-note', join.footnote) : null]);

  let aside = null;
  if (join.apply) {
    const a = join.apply;
    aside = el('aside', { class: 'join-apply', attrs: { 'aria-label': a.heading || 'Apply' } }, [
      el('h3', { class: 'join-apply-title', text: a.heading || 'Apply' }),
      a.text ? el('p', { class: 'join-apply-text', text: a.text }) : null,
      a.button ? renderAction({ ...a.button, style: 'primary' }) : null,
      a.secondary ? renderAction({ ...a.secondary, style: 'ghost' }) : null
    ]);
  }
  return homeBlock(join, 'join', [el('div', { class: 'join-layout' }, [left, aside])]);
}

// "Supported versions": one card per edition, the recommended version highlighted.
function renderVersions(versions) {
  const cards = (versions.editions || []).map(ed =>
    el('div', { class: 'version-card' }, [
      el('h3', { class: 'version-card-title' }, [ed.icon ? icon(ed.icon, 'icon-sm') : null, el('span', { text: ed.name })]),
      el('ul', { class: 'version-list' }, (ed.versions || []).map(v =>
        el('li', { class: 'version-chip' + (v.recommended ? ' is-recommended' : '') }, [
          el('span', { class: 'version-chip-label', text: v.label }),
          v.recommended ? el('span', { class: 'version-chip-tag', text: 'Recommended' }) : null,
          v.recommended && v.note ? el('span', { class: 'visually-hidden', text: ` (best on ${v.note})` }) : null
        ])
      ))
    ])
  );
  const notes = [];
  if (versions.asOf) notes.push(el('span', { text: 'As of ' + displayDate(versions.asOf, 'long') + '. ' }));
  if (versions.footnote) richText(versions.footnote).forEach(n => notes.push(n));
  return homeBlock(versions, 'versions', [
    el('div', { class: 'version-grid' }, cards),
    notes.length ? el('p', { class: 'home-block-note' }, notes) : null
  ]);
}

// "What to expect": a grid of short feature cards.
function renderFeatures(features) {
  const items = (features.items || []).map(f =>
    el('li', { class: 'feature-card' }, [
      el('span', { class: 'feature-badge', attrs: { 'aria-hidden': 'true' } }, [icon(f.icon || 'box', 'home-card-icon')]),
      el('h3', { class: 'feature-title', text: f.title }),
      el('p', { class: 'feature-text', text: f.text })
    ])
  );
  return homeBlock(features, 'features', [el('ul', { class: 'feature-grid' }, items)]);
}

// Fills #catalog with the site's own home blocks (a site with project sections shows its cards there instead).
function renderHomeBlocks(home) {
  const main = document.getElementById('catalog');
  if (!main || !home) return;
  if (home.features) main.appendChild(renderFeatures(home.features));
  if (home.join) main.appendChild(renderJoin(home.join));
  if (home.versions) main.appendChild(renderVersions(home.versions));
}

SITE_HOOKS.home.blocks.push(() => renderHomeBlocks(SITE_DATA.home));
