/* Build settings for the Classic36 personal site; see sites/classics-craftworks/site.config.js for what each
   option does. Text is plain: the build escapes & < > " itself. */

module.exports = {
  id: 'classic36',
  url: 'https://classic36.example',   // no trailing slash. Placeholder: set the real address before launch
  lang: 'en',

  name: 'Classic36',
  shortName: 'Classic36',
  description: "Classic36's personal site: social links, related profiles and Minecraft skin history.",
  tagline: 'Minecraft player and tinkerer. Maker of Classic\'s Craftworks and CraftHorizon.',

  themeColor: '#0d0507',        // keep equal to --bg in theme.css
  backgroundColor: '#0d0507',

  cachePrefix: 'classic36',
  cacheVersion: 1,

  features: ['profile'],   // see core/features/README.md

  ogImage: { path: 'images/share.jpg', type: 'image/jpeg', width: 1200, height: 630, alt: 'Classic36 skin head beside the site name' },

  noscriptLinks: [
    { label: 'Classic\'s Craftworks', url: 'https://classicscraftworks.co.uk' },
    { label: 'GitHub', url: 'https://github.com' }
  ],

  pages: [
    {
      kind: 'home', slug: '',
      title: 'Classic36',
      description: "Classic36 is a Minecraft player and tinkerer, maker of Classic's Craftworks and CraftHorizon. Find social links, related profiles and skin history here.",
      ogDescription: "Minecraft player and tinkerer. Find Classic36 online and browse every Minecraft skin used.",
      lastmod: '2026-11-14'
    },
    {
      kind: 'skins', slug: 'skin-history',
      title: 'Minecraft Skin History - Classic36',
      description: 'Every Minecraft skin Classic36 has used.',
      lastmod: '2026-11-14'
    },
    {
      kind: 'content', slug: 'fortnite-skin-history',
      title: 'Fortnite Skin History - Classic36',
      description: 'Every skin used as a main in Fortnite.',
      lastmod: '2026-11-14'
    },
    {
      kind: 'content', slug: 'fortnite-season-tier-list',
      title: 'Fortnite Season Tier List - Classic36',
      description: 'A tier list ranking every season of Fortnite.',
      lastmod: '2026-11-14'
    },
    {
      kind: 'content', slug: 'fortnite-skin-tier-lists',
      title: 'Fortnite Skin Tier Lists - Classic36',
      description: 'Skin tier lists for each season of Fortnite.',
      lastmod: '2026-11-14'
    },
    {
      kind: 'content', slug: 'games',
      title: 'Games - Classic36',
      description: 'The games Classic36 plays and has played.',
      lastmod: '2026-11-14'
    },
    {
      kind: 'changelog', slug: 'changelog', nav: false,
      title: 'Changelog - Classic36',
      description: 'Every change to the Classic36 website, newest first.',
      lastmod: '2026-11-14'
    },
    {
      kind: 'settings', slug: 'settings',
      title: 'Settings - Classic36',
      description: 'Theme, accent colour, accessibility and display settings for Classic36. Saved in your browser only.',
      robots: 'noindex', social: false,
      lastmod: '2026-11-14'
    },
    {
      kind: 'notfound', slug: '404', sitemap: false,
      title: 'Page not found - Classic36',
      description: "This page doesn't exist. Head back to the Classic36 site.",
      robots: 'noindex, nofollow', social: false
    }
  ]
};
