/* LATEST UPDATES - the news feed shown on the home page (newest few) and on
   the News page (everything, with search, project and tag filters). Rendered by news.js.

   - Adding an entry: copy a block in `entries`. Order doesn't matter; the
     newest `date` is always shown first.
       date   "YYYY-MM-DD"
       title  headline
       text   one or two sentences (optional)
       projects (optional) the projects this entry is about. Each is a project id
              (its title in data.js, lower-cased with hyphens) or, to give the
              entry its own row for that project on the News page, an object:
                { id: "better-craftables",
                  version: "v8.0.0",     pill next to the name (optional)
                  channel: "beta",       colours the pill: stable, beta, alpha or
                                         unsupported (optional; defaults to the
                                         entry's release/beta/alpha tag)
                  text: "...",           that project's own description (optional)
                  url: "https://...",    where the row (icon, name and pill) links;
                                         overrides the default below (optional)
                  versionUrl: "https://..." }  the version's page; the row links to
                                         it, defaulting to <Modrinth page>/
                                         version/<version> for versions like
                                         "v8.0.0", else the project's page
              The entry's own `text` stays as the overall description. A project
              the `url` points at is picked up automatically for the filter.
       tags   one or more keys from `tags` below, e.g. ["release"] or
              ["release", "beta"]
       url      (optional) adds a link button. Use a full address
                ("https://...", opens in a new tab) or a page on this site
                ("/data-packs-mods#better-unpackables")
       linkText (optional) the button's text; defaults to "Read more"
       announce (optional) true shows this entry as a card in the bottom-right
                corner of every page except News. If several are marked, the
                newest is used. Visitors can dismiss it; it comes back for them
                when a different entry is announced. Remove the flag (or set it
                to false) to stop announcing.
       image    (optional) picture for the entry's icon tile on the News page
                and for the corner card, e.g. "images/x.webp". By default it's
                the icon of the project the `url` points at; with neither, a
                generic news icon is shown.
   - Tags: each key has a `label` (shown on the pill and filter button) and a
     `color` (any #rrggbb hex). Add, rename or recolour freely; the tag filters on
     the News page are built from the tags that entries actually use, in the
     order listed here. A tag used by an entry but missing from `tags` still
     works: it gets its key as a label and the default blue.
   - homeCount: how many entries the home page shows.
   - sidebar: the right-hand column of the News page (below the entries on
     narrow screens). Search and the project/tag filters are always there; you set their
     text, plus what follows. Icons are names of files in images/icons/ without
     ".svg" (e.g. "discord"). Links work like an entry's `url`.
       searchPlaceholder, filterHeading   text for those two controls
       latestReleases  { heading, releases: [{ project, version, channel, date, url }] };
                    shown in order, so list the newest first. channel is "stable",
                    "beta", "alpha" or "unsupported" (colours come from the matching
                    tags above); date is "YYYY-MM-DD"; url (optional) makes the row a link, like an
                    entry's `url`. Leave out to hide
       cards        info cards, in order; each is { heading, text, icon } plus an
                    optional `button` and/or `link` of { label, url, icon? }.
                    Leave the list empty to hide them. */

const LATEST_UPDATES = {
  heading: "Latest News",
  homeHeading: "Latest News",
  intro: "The latest news and updates from Classic's Craftworks.",
  homeCount: 3,

  tags: {
    news:        { label: "News",         color: "#41A0C8" },
    release:     { label: "Release",      color: "#22C55E" },
    beta:        { label: "Beta",         color: "#FF9D47" },
    alpha:       { label: "Alpha",        color: "#F2607E" },
    unsupported: { label: "Unsupported",  color: "#929292" },
    new:         { label: "New Project",  color: "#EFDD65" },
    snapshot:    { label: "Snapshot",     color: "#41A0C8" }
  },

  entries: [
    {
      date: "2026-10-20",
      tags: ["beta"],
      image: "images/better-unpackables.webp",
      title: "Better Unpackables v5.1.0-beta.6",
      text: "Better Unpackables v5.1.0-beta.6 has been released, adding new 'back to block' recipes for Packed Ice Brick blocks.",
      url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.6",
      linkText: "View update on Modrinth"
    },
    {
      date: "2026-10-20",
      tags: ["alpha"],
      image: "images/note-block-tweaks.webp",
      title: "Classic's Note Block Tweaks v0.5.0",
      text: "Classic's Note Block Tweaks v0.5.0 includes a new pack icon and support for Java 26.4-snapshot-5.",
      url: "https://modrinth.com/resourcepack/classics-note-block-tweaks/version/v0.5.0",
      linkText: "View update on Modrinth"
    },
    {
      date: "2026-10-20",
      tags: ["snapshot", "beta"],
      image: "images/icons/snapshot.svg",
      projects: [
        { id: "better-craftables", version: "v8.1.0-beta.4" },
        { id: "better-unpackables", version: "v5.1.0-beta.5" }
      ],
      title: "26.4 Snapshot 5",
      text: "New betas have been released for Java 26.4-snapshot-5."
    },
    {
      date: "2026-10-20",
      tags: ["new"],
      image: "images/note-block-tweaks.webp",
      announce: true,
      title: "Introducing Classic's Note Block Tweaks",
      text: "New resource pack that updates Note Blocks to better match new Jukebox textures, and backports them to 1.21.9 - 26.3.",
      url: "/resource-packs#classics-note-block-tweaks",
      linkText: "View Classic's Note Block Tweaks"
    },
    {
      date: "2026-10-13",
      tags: ["beta"],
      image: "images/better-unpackables.webp",
      title: "Better Unpackables v5.1.0-beta.4",
      text: "Better Unpackables v5.1.0-beta.4 has been released with an important fix for Cut Sandstone recipes.",
      url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.4",
      linkText: "View update on Modrinth"
    },
    {
      date: "2026-10-13",
      tags: ["release"],
      projects: [
        { id: "better-unpackables", version: "v5.0.1" },
        { id: "better-unpackables", version: "v5.0.1+mod" }
      ],
      title: "Better Unpackables v5.0.1",
      text: "Better Unpackables v5.0.1 has been released with an important fix for Cut Sandstone recipes.",
    },
    {
      date: "2026-10-13",
      tags: ["snapshot", "beta"],
      image: "images/icons/snapshot.svg",
      projects: [
        { id: "better-craftables", version: "v8.1.0-beta.3" },
        { id: "better-unpackables", version: "v5.1.0-beta.3" }
      ],
      title: "26.4 Snapshot 4",
      text: "New betas have been released for Java 26.4-snapshot-4.",
    },
    {
      date: "2026-10-06",
      tags: ["snapshot", "beta"],
      image: "images/icons/snapshot.svg",
      projects: [
        { id: "better-craftables", version: "v8.1.0-beta.2" },
        { id: "better-unpackables", version: "v5.1.0-beta.2" }
      ],
      title: "26.4 Snapshot 3",
      text: "New betas have been released for Java 26.4-snapshot-3.",
    },
    {
      date: "2026-09-22",
      tags: ["snapshot", "beta"],
      image: "images/icons/snapshot.svg",
      projects: [
        { id: "better-craftables", version: "v8.1.0-beta.1" },
        { id: "better-unpackables", version: "v5.1.0-beta.1" }
      ],
      title: "26.4 Snapshot 1",
      text: "New betas have been released for Java 26.4-snapshot-1.",
    },
    {
      date: "2026-09-15",
      tags: ["release"],
      image: "images/icons/announcements.svg",
      projects: [
        { id: "better-craftables", version: "v8.0.0+mod" },
        { id: "better-unpackables", version: "v5.0.0+mod" },
        { id: "silly-eatables", version: "v5.0.0+mod" }
      ],
      title: "26.3 Mod Updates",
      text: "New mod updates have been released for Java 26.3."
    },
    {
      date: "2026-09-15",
      tags: ["release"],
      image: "images/icons/announcements.svg",
      projects: [
        { id: "better-craftables", version: "v8.0.0" },
        { id: "better-unpackables", version: "v5.0.0" },
        { id: "silly-eatables", version: "v5.0.0" }
      ],
      title: "26.3 Data Pack Updates",
      text: "New data pack updates have been released for Java 26.3.",
    },
    {
      date: "2026-09-14",
      tags: ["release"],
      image: "images/icons/announcements.svg",
      projects: [
        { id: "classics-disc-tweaks", version: "v3.4.0" },
        { id: "classics-dye-tweaks", version: "v1.4.0" },
        { id: "classics-lantern-tweaks", version: "v2.4.0" }
      ],
      title: "26.3 Resource Pack Updates",
      text: "New resource pack updates have been released for Java 26.3.",
    }
  ],

  sidebar: {
    searchPlaceholder: "Search news…",
    filterHeading: "Filters",

    latestReleases: {
      heading: "Latest releases",
      releases: [
        { project: "Better Unpackables", url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.6", version: "v5.1.0-beta.6", channel: "beta", date: "2026-10-20" },
        { project: "Classic's Note Block Tweaks", url: "https://modrinth.com/resourcepack/classics-note-block-tweaks/version/v0.5.0", version: "v0.5.0", channel: "alpha", date: "2026-10-20" },
        { project: "Better Unpackables", url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.5", version: "v5.1.0-beta.5", channel: "beta", date: "2026-10-20" },
        { project: "Better Craftables", url: "https://modrinth.com/datapack/better-craftables/version/v8.1.0-beta.4", version: "v8.1.0-beta.4", channel: "beta", date: "2026-10-20" },
      ]
    },

    cards: [
      {
        heading: "Stay in the loop",
        text: "Follow along for new releases, betas and other updates.",
        icon: "announcements",
        button: { label: "Join the Discord", url: "https://discord.gg/vZJSDjPcmu", icon: "discord" },
        button2: { label: "Follow on X/Twitter", url: "https://x.com/C36Craftworks", icon: "x" },
      }
    ]
  }
};
