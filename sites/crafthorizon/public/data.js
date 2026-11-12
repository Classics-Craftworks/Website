/* SITE DATA - all site text, links and project lists. The format is documented at the top of
   sites/classics-craftworks/public/data.js (icons, channels, downloads, notes and so on).

   - Icons: SVGs in core/static/images/icons/, referenced by filename without extension.
   - New project: copy an existing project block. */

const SITE_DATA = {

  brand: {
    logo: "images/crafthorizon.webp",
    name: "CRAFTHORIZON"
  },

  version: {
    label: "v0.1.0",
    url: "https://github.com/Classics-Craftworks/Website/blob/main/sites/crafthorizon/CHANGELOG.md"
  },

  home: {
    splash: {
      headline: ["CRAFT YOUR", "OWN HORIZON."],
      subtitle: "A whitelisted Minecraft server with a focus on vanilla+ Survival and Creative gameplay.",
      featured: [
        { title: "CraftHorizon", image: "images/featured-CH.webp" }
      ]
    },

    projectsHeading: "Server Details",
    projectsSubtitle: ""
  },

  // Header pages. Entries with a "section" go in the Projects dropdown and
  // must match a section heading below; Home ("/"), News, About and Settings get their own links.
  pages: [
    { label: "Home", url: "/", icon: "home" },
    { label: "Server", url: "server", section: "Server", icon: "compass" },
    { label: "News", url: "news", icon: "news" },
    { label: "About", url: "about", icon: "about" },
    { label: "Settings", url: "settings", icon: "settings" }
  ],

  sections: [
    {
      heading: "Server",
      projects: [
        // #region ──────── CraftHorizon ────────
        {
          image: "images/crafthorizon.webp",
          imageAlt: "CraftHorizon logo over a starry galaxy",
          title: "CraftHorizon",
          description: "Whitelisted Minecraft server, with a focus on vanilla+ Survival and Creative gameplay.",
          created: "2025-01-15",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/server/crafthorizon" },
            { label: "Trello", icon: "document", url: "https://trello.com/b/TK7pofcG/crafthorizon" },
            { label: "Wiki", icon: "book", url: "https://classicscraftworks.gitbook.io/crafthorizon" }
          ]
        }
        // #endregion CraftHorizon
      ]
    }
  ],

  // About page blocks, in order: "paragraph" | { heading } | { list: [] } |
  // { quote } | { divider: true }. Text may be an array mixing strings with
  // { link, url } / { bold } / { italic } / { code } pieces.
  about: {
    heading: "About",
    content: [
      "CraftHorizon is a whitelisted Minecraft server, with a focus on vanilla+ Survival and Creative gameplay.",
      [
        "Everything about the server is kept in a few places: the ",
        { link: "wiki", url: "https://classicscraftworks.gitbook.io/crafthorizon" },
        ", the ",
        { link: "Trello board", url: "https://trello.com/b/TK7pofcG/crafthorizon" },
        " and the server's ",
        { link: "Modrinth page", url: "https://modrinth.com/server/crafthorizon" },
        "."
      ],
      [
        "CraftHorizon is a project of ",
        { link: "Classic's Craftworks", url: "https://classicscraftworks.co.uk" },
        ", a workshop for Minecraft ideas."
      ]
    ]
  },

  socials: [
    { label: "Modrinth", url: "https://modrinth.com/server/crafthorizon", icon: "modrinth" },
    { label: "Wiki", url: "https://classicscraftworks.gitbook.io/crafthorizon", icon: "book" },
    { label: "Trello", url: "https://trello.com/b/TK7pofcG/crafthorizon", icon: "document" },
    { label: "Classic's Craftworks", url: "https://classicscraftworks.co.uk", icon: "link" }
  ],

  footer: {
    copyright: "© 2025–2026 CraftHorizon",
    disclaimer: "NOT AN OFFICIAL MINECRAFT PRODUCT OR SERVICE. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.",
    iconCredits: { prefix: "Icons provided by ", label: "SVG Repo", url: "https://www.svgrepo.com" }
  }
};
