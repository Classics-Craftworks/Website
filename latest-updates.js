/* LATEST UPDATES - the news feed shown on the home page (newest few) and on
   the Updates page (everything, with tag filters). Rendered by news.js.

   - Adding an entry: copy a block in `entries`. Order doesn't matter; the
     newest `date` is always shown first.
       date   "YYYY-MM-DD"
       title  headline
       text   one or two sentences (optional)
       tags   one or more keys from `tags` below, e.g. ["release"] or
              ["release", "beta"]
       url      (optional) adds a link button. Use a full address
                ("https://...", opens in a new tab) or a page on this site
                ("/data-packs-mods#better-unpackables")
       linkText (optional) the button's text; defaults to "Read more"
       announce (optional) true shows this entry as a card in the bottom-right
                corner of every page except Updates. If several are marked, the
                newest is used. Visitors can dismiss it; it comes back for them
                when a different entry is announced. Remove the flag (or set it
                to false) to stop announcing.
       image    (optional) picture for the entry's icon tile on the Updates page
                and for the corner card, e.g. "images/x.webp". By default it's
                the icon of the project the `url` points at; with neither, a
                generic news icon is shown.
   - Tags: each key has a `label` (shown on the pill and filter button) and a
     `color` (any #rrggbb hex). Add, rename or recolour freely; the filters on
     the Updates page are built from the tags that entries actually use, in the
     order listed here. A tag used by an entry but missing from `tags` still
     works: it gets its key as a label and the default blue.
   - homeCount: how many entries the home page shows.
   - sidebar: the right-hand column of the Updates page (below the entries on
     narrow screens). Search and the tag filters are always there; you set their
     text, plus what follows. Icons are names of files in images/icons/ without
     ".svg" (e.g. "discord"). Links work like an entry's `url`.
       searchPlaceholder, filterHeading   text for those two controls
       quickLinks   { heading, links: [{ label, url, icon }] }; leave out to hide
       cards        info cards, in order; each is { heading, text, icon } plus an
                    optional `button` and/or `link` of { label, url, icon? }.
                    Leave the list empty to hide them. */

const LATEST_UPDATES = {
  heading: "Latest Updates",
  homeHeading: "Latest Updates",
  intro: "The latest news and updates from Classic's Craftworks.",
  homeCount: 3,

  tags: {
    release:     { label: "Release",      color: "#22C55E" },
    beta:        { label: "Beta",         color: "#FF9D47" },
    alpha:       { label: "Alpha",        color: "#F2607E" },
    new:         { label: "New Project",  color: "#EFDD65" },
    unsupported: { label: "Unsupported",  color: "#929292" },
    news:        { label: "News",         color: "#41A0C8" },
    snapshot:    { label: "Snapshot",     color: "#41A0C8" }
  },

  entries: [
    {
      date: "2026-10-13",
      tags: ["beta"],
      title: "Better Unpackables v5.1.0-beta.4",
      text: "Better Unpackables v5.1.0-beta.4 has been released with an important fix for Cut Sandstone recipes.",
      url: "/data-packs-mods#better-unpackables",
      linkText: "View Better Unpackables"
    },
    {
      date: "2026-10-13",
      tags: ["release"],
      announce: true,
      title: "Better Unpackables v5.0.1",
      text: "Better Unpackables v5.0.1 has been released with an important fix for Cut Sandstone recipes.",
      url: "/data-packs-mods#better-unpackables",
      linkText: "View Better Unpackables"
    },
    {
      date: "2026-10-13",
      tags: ["beta", "snapshot"],
      title: "26.4 Snapshot 4",
      text: "New betas for Better Craftables & Better Unpackables have been released for Java 26.4-snapshot-4.",
      url: "/data-packs-mods",
      linkText: "View Data Packs"
    },
    {
      date: "2026-10-06",
      tags: ["beta", "snapshot"],
      title: "26.4 Snapshot 3",
      text: "New betas for Better Craftables & Better Unpackables have been released for Java 26.4-snapshot-3.",
      url: "/data-packs-mods",
      linkText: "View Data Packs"
    },
    {
      date: "2026-09-22",
      tags: ["beta", "snapshot"],
      title: "26.4 Snapshot 1",
      text: "New betas for Better Craftables & Better Unpackables have been released for Java 26.4-snapshot-1.",
      url: "/data-packs-mods",
      linkText: "View Data Packs"
    },
    {
      date: "2026-09-15",
      tags: ["release"],
      title: "26.3 Data Pack & Mod Updates",
      text: "New updates for Better Craftables, Better Unpackables and Silly Eatables have been released for Java 26.3.",
      url: "/data-packs-mods",
      linkText: "View Data Packs & Mods"
    },
    {
      date: "2026-09-14",
      tags: ["release"],
      title: "26.3 Resource Pack Updates",
      text: "New updates for Classic's Disc, Dye and Lantern Tweaks have been released for Java 26.3.",
      url: "/resource-packs",
      linkText: "View Resource Packs"
    }
  ],

  sidebar: {
    searchPlaceholder: "Search updates…",
    filterHeading: "Filter by type",

    quickLinks: {
      heading: "Quick links",
      links: [
        { label: "Data Packs & Mods", url: "/data-packs-mods", icon: "brackets" },
        { label: "Resource Packs",    url: "/resource-packs",  icon: "brush" },
        { label: "Other Projects",    url: "/other-projects",  icon: "wrench" },
        { label: "Modrinth",          url: "https://modrinth.com/organization/classics-craftworks", icon: "modrinth" }
      ]
    },

    cards: [
      {
        heading: "Stay in the loop",
        text: "Follow along for new releases, betas and snapshots.",
        icon: "announcements",
        button: { label: "Join the Discord", url: "https://discord.gg/vZJSDjPcmu", icon: "discord" }
      },
      {
        heading: "About our updates",
        text: "This page covers stable releases, betas and snapshots for every project, plus new and retired projects.",
        icon: "info",
        link: { label: "Learn more", url: "/about" }
      }
    ]
  }
};
