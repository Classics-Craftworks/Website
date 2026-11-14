/* Skin history page: SITE_DATA.skins = { heading, intro, items: [{ number, name, dates, note, image, current }] }, newest first. */

function renderSkins() {
  const main = document.getElementById('skins-page');
  const skins = SITE_DATA.skins;
  if (!main || !skins) return;

  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: 'skins-heading' } }, [el('span', { text: skins.heading || 'Skin history' })]));
  if (skins.intro) main.appendChild(el('p', { class: 'about-text p36-page-intro', text: skins.intro }));

  const list = el('ol', { class: 'p36-skins', attrs: { 'aria-labelledby': 'skins-heading' } }, (skins.items || []).map(s =>
    el('li', { class: 'p36-skin' + (s.current ? ' is-current' : '') }, [
      el('span', { class: 'p36-skin-thumb' }, [
        el('img', { class: 'p36-skin-img', src: s.image, alt: s.alt || `Head of ${s.name || 'skin ' + s.number}`, attrs: { width: '96', height: '96', loading: 'lazy', draggable: 'false' } })
      ]),
      el('span', { class: 'p36-skin-body' }, [
        el('span', { class: 'p36-skin-row' }, [
          el('h2', { class: 'p36-skin-title', text: s.name || `Skin ${String(s.number).padStart(2, '0')}` }),
          s.current ? el('span', { class: 'join-card-badge', text: 'Current' }) : null
        ]),
        el('span', { class: 'p36-skin-dates', text: s.dates }),
        s.note ? el('p', { class: 'p36-skin-text', text: s.note }) : null
      ])
    ])
  ));
  main.appendChild(list);
}

renderBrand(SITE_DATA.brand);
renderSiteHeader(SITE_DATA.pages || [], 'skin-history');
renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
renderSkins();
clearSkeletons();
initBackToTop();
