/* ============================================================
   404 PAGE — page config

   Only the brand header and footer are built from data.js here (both
   helpers come from section-page.js, loaded before this file); the
   404 message itself is plain HTML in 404.html.
   ============================================================ */
renderBrand(SITE_DATA.brand, SITE_DATA.topLinks);
renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
