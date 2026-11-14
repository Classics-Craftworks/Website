/* Extras page: SITE_DATA.extras = { heading, intro, items: [{ label, text, url?, status? }] }. */

function renderExtras() {
  const main = document.getElementById('extras-page');
  const extras = SITE_DATA.extras;
  if (!main || !extras) return;

  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: 'extras-heading' } }, [el('span', { text: extras.heading || 'Extras' })]));
  if (extras.intro) main.appendChild(el('p', { class: 'about-text p36-page-intro', text: extras.intro }));

  const cards = (extras.items || []).map(x => {
    const kids = [
      el('span', { class: 'p36-explore-title', text: x.label }),
      el('span', { class: 'p36-explore-text', text: x.text }),
      x.status ? el('span', { class: 'p36-status', text: x.status }) : null
    ];
    return x.url ? p36ExtraLink(x.url, kids) : el('div', { class: 'p36-explore' }, kids);
  });
  main.appendChild(el('div', { class: 'p36-explore-grid' }, cards));
}

function p36ExtraLink(url, kids) {
  if (/^https?:\/\//i.test(url)) return el('a', { href: url, class: 'p36-explore is-featured' }, kids);
  return internalLink('p36-explore is-featured', url, kids);
}

renderBrand(SITE_DATA.brand);
renderSiteHeader(SITE_DATA.pages || [], 'extras');
renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
renderExtras();
clearSkeletons();
initBackToTop();
