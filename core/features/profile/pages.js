/* Profile feature, inner pages. One script draws every page of kind skins, extras and content, picking the data by
   the page's slug (<body data-page>):
     skins   (slug skin-history)  SITE_DATA.skins
     extras                       SITE_DATA.extras
     content                      SITE_DATA.content[slug], whose `type` is one of:
       skins    { heading, intro, pixel?, items: [{ number?, name?, dates, note, image, current }] }
       image    { heading, intro, image, alt, caption }                       one big picture
       gallery  { heading, intro, groups: [{ heading, items: [{ label, image, alt }] }] }   or a flat `items`
       games    { heading, intro, items: [{ name, years, status, note, image?, pixel?, badge?, url? }] }   (pixel: no smoothing)
   `pixel` draws the pictures without smoothing (Minecraft's 8x8 heads); it is on for the Skin history page. */

const p36Ext = url => /^https?:\/\//i.test(url);

function p36Heading(id, text, intro) {
  return [
    el('h1', { class: 'flat-section-heading', attrs: { id } }, [el('span', { text })]),
    intro ? el('p', { class: 'about-text p36-page-intro', text: intro }) : null
  ];
}

// A picture that opens full size in a new tab.
function p36Picture(item, className) {
  return el('a', { href: sitePath(item.image), class: className }, [
    el('img', { src: item.image, alt: item.alt || item.label || '', attrs: { loading: 'lazy', draggable: 'false' } })
  ]);
}

function renderSkinList(data, pixel) {
  return el('ol', { class: 'p36-skins' + (pixel ? ' is-pixel' : ''), attrs: { 'aria-labelledby': 'page-heading' } }, (data.items || []).map(s =>
    el('li', { class: 'p36-skin' + (s.current ? ' is-current' : '') }, [
      el('span', { class: 'p36-skin-thumb' }, [
        el('img', { class: 'p36-skin-img', src: s.image, alt: s.alt || `Picture of ${s.name || 'skin ' + s.number}`, attrs: { width: '96', height: '96', loading: 'lazy', draggable: 'false' } })
      ]),
      el('span', { class: 'p36-skin-body' }, [
        el('span', { class: 'p36-skin-row' }, [
          el('h2', { class: 'p36-skin-title', text: s.name || `Skin ${String(s.number).padStart(2, '0')}` }),
          s.current ? el('span', { class: 'join-card-badge', text: 'Current' }) : null
        ]),
        s.dates ? el('span', { class: 'p36-skin-dates', text: s.dates }) : null,
        s.note ? el('p', { class: 'p36-skin-text', text: s.note }) : null
      ])
    ])
  ));
}

function renderImagePage(data) {
  return el('figure', { class: 'p36-figure' }, [
    p36Picture(data, 'p36-figure-link'),
    el('figcaption', { class: 'p36-figure-caption' }, [
      data.caption ? el('span', { text: data.caption }) : null,
      el('a', { href: sitePath(data.image), class: 'inline-link', text: 'Open full size' })
    ])
  ]);
}

function renderGallery(data) {
  const groups = data.groups || [{ items: data.items || [] }];
  return el('div', { class: 'p36-gallery-groups' }, groups.map(group =>
    el('section', { class: 'p36-gallery-group' }, [
      group.heading ? el('h2', { class: 'p36-gallery-heading', text: group.heading }) : null,
      el('ul', { class: 'p36-gallery' }, (group.items || []).map(item =>
        el('li', { class: 'p36-gallery-item' }, [
          p36Picture(item, 'p36-gallery-link'),
          el('span', { class: 'p36-gallery-caption', text: item.label })
        ])
      ))
    ])
  ));
}

function renderGames(data) {
  return el('ol', { class: 'p36-skins p36-games' }, (data.items || []).map(g => {
    const thumb = g.image
      ? el('img', { class: 'p36-skin-img' + (g.pixel ? ' is-pixel-img' : ''), src: g.image, alt: '', attrs: { width: '96', height: '96', loading: 'lazy', draggable: 'false' } })
      : el('span', { class: 'p36-badge p36-badge-lg', text: g.badge || g.name.slice(0, 2), attrs: { 'aria-hidden': 'true' } });
    const title = g.url
      ? el('h2', { class: 'p36-skin-title' }, [el('a', { href: g.url, class: 'p36-title-link', text: g.name })])
      : el('h2', { class: 'p36-skin-title', text: g.name });
    return el('li', { class: 'p36-skin' + (g.status === 'Playing now' ? ' is-current' : '') }, [
      el('span', { class: 'p36-skin-thumb' }, [thumb]),
      el('span', { class: 'p36-skin-body' }, [
        el('span', { class: 'p36-skin-row' }, [title, g.status ? el('span', { class: 'join-card-badge', text: g.status }) : null]),
        g.years ? el('span', { class: 'p36-skin-dates', text: g.years }) : null,
        g.note ? el('p', { class: 'p36-skin-text', text: g.note }) : null
      ])
    ]);
  }));
}

function renderExtrasList(data) {
  return el('div', { class: 'p36-explore-grid' }, (data.items || []).map(x => {
    const kids = [
      el('span', { class: 'p36-explore-title', text: x.label }),
      el('span', { class: 'p36-explore-text', text: x.text }),
      x.status ? el('span', { class: 'p36-status', text: x.status }) : null
    ];
    if (!x.url) return el('div', { class: 'p36-explore' }, kids);
    return p36Ext(x.url) ? el('a', { href: x.url, class: 'p36-explore is-featured' }, kids)
                         : internalLink('p36-explore is-featured', x.url, kids);
  }));
}

function renderProfilePage() {
  const main = document.querySelector('main');
  const slug = document.body.dataset.page || '';
  if (!main) return;

  let data, body;
  if (slug === 'extras') { data = SITE_DATA.extras; body = data && renderExtrasList(data); }
  else if (slug === 'skin-history') { data = SITE_DATA.skins; body = data && renderSkinList(data, data.pixel !== false); }
  else {
    data = (SITE_DATA.content || {})[slug];
    const render = { skins: d => renderSkinList(d, !!d.pixel), image: renderImagePage, gallery: renderGallery, games: renderGames }[data && data.type];
    body = render && render(data);
  }
  if (!data || !body) return;

  p36Heading('page-heading', data.heading, data.intro).forEach(n => n && main.appendChild(n));
  main.appendChild(body);
}

renderBrand(SITE_DATA.brand);
renderSiteHeader(SITE_DATA.pages || [], document.body.dataset.page || null);
renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
renderProfilePage();
clearSkeletons();
initBackToTop();
