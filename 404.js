/* ============================================================
   404 PAGE — page config

   Only the site header and footer are built from data.js here (all
   helpers come from section-page.js, loaded before this file); the
   404 message itself is plain HTML in 404.html.
   ============================================================ */
renderBrand(SITE_DATA.brand);
renderSiteHeader(SITE_DATA.pages || [], null);
renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
