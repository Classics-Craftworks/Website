/* 404 page: header and footer only; the message itself is in 404.html. */
renderBrand(SITE_DATA.brand);
renderSiteHeader(SITE_DATA.pages || [], null);
renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
