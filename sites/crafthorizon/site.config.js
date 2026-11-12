/* Build settings for the CraftHorizon site; see sites/classics-craftworks/site.config.js for what each
   option does. Text is plain: the build escapes & < > " itself. */

module.exports = {
  id: 'crafthorizon',
  url: 'https://crafthorizon.classicscraftworks.co.uk',   // no trailing slash
  lang: 'en',

  name: 'CraftHorizon',
  shortName: 'CraftHorizon',
  description: 'Whitelisted Minecraft server, with a focus on vanilla+ Survival and Creative gameplay.',
  tagline: 'Whitelisted Minecraft server, with a focus on vanilla+ Survival and Creative gameplay.',

  themeColor: '#0b0716',        // keep equal to --bg in theme.css
  backgroundColor: '#0b0716',

  cachePrefix: 'crafthorizon',

  features: ['landing'],   // see sites/classics-craftworks/site.config.js for what each feature is

  ogImage: { path: 'images/share.jpg', type: 'image/jpeg', width: 1200, height: 630, alt: 'CraftHorizon logo over a starry galaxy' },

  noscriptLinks: [
    { label: 'Modrinth', url: 'https://modrinth.com/server/crafthorizon' },
    { label: 'the wiki', url: 'https://classicscraftworks.gitbook.io/crafthorizon' }
  ],

  pages: [
    {
      kind: 'home', slug: '',
      title: 'CraftHorizon | Minecraft Server',
      description: 'CraftHorizon is a whitelisted Minecraft server with a focus on vanilla+ Survival and Creative gameplay. See how to join, apply for the whitelist and check the supported Java and Bedrock versions.',
      ogDescription: 'A whitelisted Minecraft server with a focus on vanilla+ Survival and Creative gameplay. Apply to join today.',
      lastmod: '2026-11-12'
    },
    {
      kind: 'news', slug: 'news',
      title: 'News - CraftHorizon',
      description: 'News and updates from CraftHorizon.',
      lastmod: '2026-11-12'
    },
    {
      kind: 'settings', slug: 'settings',
      title: 'Settings - CraftHorizon',
      description: 'Theme, accent colour, accessibility and display settings for CraftHorizon. Saved in your browser only.',
      robots: 'noindex', social: false,
      lastmod: '2026-11-12'
    },
    {
      kind: 'about', slug: 'about',
      title: 'About - CraftHorizon',
      description: 'About CraftHorizon: a whitelisted Minecraft server with a focus on vanilla+ Survival and Creative gameplay.',
      lastmod: '2026-11-12'
    },
    {
      kind: 'notfound', slug: '404', sitemap: false,
      title: 'Page not found - CraftHorizon',
      description: "This page doesn't exist. Head back to CraftHorizon, a whitelisted Minecraft server.",
      robots: 'noindex, nofollow', social: false
    }
  ]
};
