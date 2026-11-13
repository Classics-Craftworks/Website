/* Build settings for this site. Everything the page templates, manifest, sitemap, robots.txt and
   service worker need that isn't already in public/data.js (nav pages, brand name and logo are read
   from SITE_DATA there, and the build checks the two agree).

   Text is plain: the build escapes & < > " for HTML itself. */

module.exports = {
  id: 'classics-craftworks',
  url: 'https://classicscraftworks.co.uk',   // no trailing slash
  lang: 'en',

  name: "Classic's Craftworks",
  shortName: 'CCW',
  description: 'Minecraft Java Edition data packs, mods & resource packs.',   // web app manifest
  tagline: 'Minecraft Java Edition data packs, mods & resource packs.',        // shown when JavaScript is off

  themeColor: '#0d111a',
  backgroundColor: '#0d111a',

  cachePrefix: 'ccw',   // service worker cache name: <prefix>-cache-v<core cacheVersion>

  // Optional parts of the shared core this site uses (core/features/<name>/):
  //   catalog  project pages, release tables, project cards on the home page, header search, download dots
  //   landing  home-page blocks for a single-purpose site: features, how to join, supported versions
  // The build checks SITE_DATA matches: sections need "catalog", home.features/join/versions need "landing".
  features: ['catalog'],

  ogImage: { path: 'images/share.jpg', type: 'image/jpeg', width: 1200, height: 630, alt: "Classic's Craftworks logo" },

  // Links in the "JavaScript is off" notice.
  noscriptLinks: [
    { label: 'Modrinth', url: 'https://modrinth.com/organization/classics-craftworks' },
    { label: 'GitHub', url: 'https://github.com/Classics-Craftworks' }
  ],

  // Used by .github/scripts/update-stats.mjs (the daily download/follower count update).
  stats: {
    excludeSlugs: ['crafthorizon'],   // Modrinth projects left out of the totals
    userAgent: 'Classics-Craftworks/Website (stats updater; https://github.com/Classics-Craftworks/Website)'
  },

  // One entry per page. kind: home | section | about | news | changelog | settings | notfound.
  // slug: the URL path (and file name); sections' slugs must match their url in SITE_DATA.pages.
  // Optional: tagline (noscript text for this page), ogDescription, lastmod (sitemap), robots, social: false,
  // nav: false (a page the header doesn't link to; the "changelog" page is reached from the footer's version number).
  pages: [
    {
      kind: 'home', slug: '',
      title: "Classic's Craftworks | Minecraft Java Data Packs, Mods & Resource Packs",
      description: 'Data packs, mods and resource packs for Minecraft Java Edition. Every project lists its current release, beta and archive versions, with downloads on Modrinth and SpigotMC.',
      ogDescription: 'Data packs, mods and resource packs for Minecraft Java Edition, with versioned releases and downloads on Modrinth and SpigotMC.',
      lastmod: '2026-11-10'
    },
    {
      kind: 'section', slug: 'data-packs-mods',
      title: "Data Packs & Mods - Classic's Craftworks",
      description: "Minecraft Java Edition data packs & mods from Classic's Craftworks.",
      tagline: 'Minecraft Java Edition data packs & mods.',
      lastmod: '2026-11-11'
    },
    {
      kind: 'section', slug: 'resource-packs',
      title: "Resource Packs - Classic's Craftworks",
      description: "Minecraft Java Edition resource packs from Classic's Craftworks.",
      tagline: 'Minecraft Java Edition resource packs.',
      lastmod: '2026-11-11'
    },
    {
      kind: 'section', slug: 'other-projects',
      title: "Other Projects - Classic's Craftworks",
      description: "Other Minecraft projects from Classic's Craftworks. Includes the CraftHorizon server and this website.",
      ogDescription: "Other Minecraft projects from Classic's Craftworks.",
      tagline: 'Minecraft Java Edition servers & other projects.',
      lastmod: '2026-11-06'
    },
    {
      kind: 'news', slug: 'news',
      title: "News - Classic's Craftworks",
      description: "News from Classic's Craftworks: new releases, new projects and retired ones.",
      lastmod: '2026-11-10'
    },
    {
      kind: 'changelog', slug: 'changelog', nav: false,
      title: "Changelog - Classic's Craftworks",
      description: "Every change to the Classic's Craftworks website, newest first.",
      lastmod: '2026-11-13'
    },
    {
      kind: 'settings', slug: 'settings',
      title: "Settings - Classic's Craftworks",
      description: "Theme, accent colour, accessibility and display settings for Classic's Craftworks. Saved in your browser only.",
      robots: 'noindex', social: false,
      lastmod: '2026-11-11'
    },
    {
      kind: 'about', slug: 'about',
      title: "About - Classic's Craftworks",
      description: "About Classic's Craftworks: Minecraft Java Edition data packs, mods & resource packs.",
      lastmod: '2026-10-26'
    },
    {
      kind: 'notfound', slug: '404', sitemap: false,
      title: "Page not found - Classic's Craftworks",
      description: "This page doesn't exist. Head back to Classic's Craftworks for Minecraft data packs, mods & resource packs.",
      robots: 'noindex, nofollow', social: false
    }
  ]
};
