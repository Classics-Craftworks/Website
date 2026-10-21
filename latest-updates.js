/* LATEST UPDATES - the news feed on the home page (newest few) and the News page
   (everything, with search and filters). Rendered by news.js.

   Entries (`entries`, any order; newest `date` shows first):
     date      "YYYY-MM-DD"
     title     headline
     text      one or two sentences (optional)
     tags      keys from `tags`, e.g. ["release", "beta"]
     projects  (optional) project ids (title in data.js, lower-cased with hyphens),
               or objects for a per-project row on the News page:
                 { id, version, channel, text, url, versionUrl }  (all but id optional)
                 channel     stable, beta, alpha or unsupported; colours the version
                             pill (defaults to the entry's release/beta/alpha tag)
                 text        that project's own description
                 url         where the row links
                 versionUrl  version page; defaults to <Modrinth page>/version/<version>
               A project the entry's `url` points at is picked up automatically.
     url       (optional) adds a link button: "https://..." (new tab) or a site page
               like "/data-packs-mods#better-unpackables"
     linkText  (optional) button text; defaults to "Read more"
     announce  (optional) true shows the entry as a dismissible corner card on every
               page except News. The newest announced entry is used, and it is pinned
               to the very top of the News page.
     pinned    (optional) true pins the entry under "Pinned" at the top of the News page.
               Any number of entries can be pinned; they follow the announced entry.
     image     (optional) icon tile for the entry and corner card, e.g. "images/x.webp".
               Defaults to the icon of the project `url` points at, else a news icon.

   tags: each key has a `label` and a `color` (#rrggbb). Filters use the tags entries
   actually use, in the order listed here; unlisted tags fall back to their key and blue.

   homeCount: how many entries the home page shows.

   sidebar: the News page's right-hand column, besides the always-present search and filters.
     searchPlaceholder, filterHeading  control text
     latestReleases  { heading, releases: [{ project, version, channel, date, url }] }
                     newest first; `url` (optional) makes the row a link; omit to hide
     cards           info cards: { heading, text, icon?, button?, button2?, secondary?, link? }
                     button/button2/link are { label, url, icon? }; `secondary` is a list of
                     them, shown as smaller buttons. Icons are file names in images/icons/
                     without ".svg". Leave the list empty to hide cards. */

const LATEST_UPDATES = {
  heading: "News",
  homeHeading: "Latest News",
  intro: "The latest news and updates from Classic's Craftworks.",
  homeCount: 3,

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
        text: "Join the community or follow along for new releases, betas and behind-the-scenes updates.",
        button: { label: "Join the Discord", url: "https://discord.gg/vZJSDjPcmu", icon: "discord" },
        button2: { label: "Follow on X/Twitter", url: "https://x.com/C36Craftworks", icon: "x" },
        secondary: [
          { label: "Modrinth", url: "https://modrinth.com/organization/classics-craftworks", icon: "modrinth" },
          { label: "GitHub", url: "https://github.com/Classics-Craftworks", icon: "github" },
        ],
      }
    ]
  },

  tags: {
    news: { label: "News", color: "#41A0C8" },
    release: { label: "Release", color: "#22C55E" },
    beta: { label: "Beta", color: "#FF9D47" },
    alpha: { label: "Alpha", color: "#F2607E" },
    unsupported: { label: "Unsupported", color: "#929292" },
    new: { label: "New Project", color: "#EFDD65" },
    snapshot: { label: "Snapshot", color: "#85C8E4" }
  },

  entries: [
    {
      date: "2026-10-20",
      title: "Better Unpackables v5.1.0-beta.6",
      text: "Packed Ice Bricks can now be turned back into blocks. This beta adds new \"back to block\" recipes for Packed Ice Brick blocks.",
      tags: ["beta"],
      image: "images/better-unpackables.webp",
      projects: ["better-unpackables"],
      url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.6",
      linkText: "View update on Modrinth"
    },
    {
      date: "2026-10-20",
      title: "Classic's Note Block Tweaks v0.5.0",
      text: "Classic's Note Block Tweaks gets a fresh pack icon and support for Java 26.4-snapshot-5 in this alpha release.",
      tags: ["alpha"],
      image: "images/note-block-tweaks.webp",
      projects: ["classics-note-block-tweaks"],
      url: "https://modrinth.com/resourcepack/classics-note-block-tweaks/version/v0.5.0",
      linkText: "View update on Modrinth"
    },
    {
      date: "2026-10-20",
      title: "26.4 Snapshot 5",
      text: "New betas have been released for Java 26.4-snapshot-5.",
      tags: ["snapshot", "beta"],
      image: "images/icons/snapshot.svg",
      projects: [
        { id: "better-craftables", version: "v8.1.0-beta.4", text: "Crafting Ice now costs 2 Ice Crystals instead of 4, and the recipe is shapeless." },
        { id: "better-unpackables", version: "v5.1.0-beta.5", text: "Converting Ice into Ice Crystals now gives 2 per Ice instead of 4." }
      ]
    },
    {
      announce: true,
      date: "2026-10-20",
      title: "Introducing Classic's Note Block Tweaks",
      text: "Our newest resource pack updates Note Blocks to match the new Jukebox textures, and backports them to Java 1.21.9 – 26.3.",
      tags: ["new"],
      image: "images/note-block-tweaks.webp",
      projects: ["classics-note-block-tweaks"],
      url: "/resource-packs#classics-note-block-tweaks",
      linkText: "View Classic's Note Block Tweaks"
    },
    {
      date: "2026-10-13",
      title: "Better Unpackables v5.1.0-beta.4",
      text: "This beta fixes Cut Sandstone unpacking recipes, which returned 4 Sandstone instead of 1.",
      tags: ["beta"],
      image: "images/better-unpackables.webp",
      projects: ["better-unpackables"],
      url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.4",
      linkText: "View update on Modrinth"
    },
    {
      date: "2026-10-13",
      title: "Better Unpackables v5.0.1",
      text: "This patch fixes Cut Sandstone unpacking recipes, which returned 4 Sandstone instead of 1.",
      tags: ["release"],
      image: "images/better-unpackables.webp",
      projects: [
        { id: "better-unpackables", version: "v5.0.1" },
        { id: "better-unpackables", version: "v5.0.1+mod" }
      ]
    },
    {
      date: "2026-10-13",
      title: "26.4 Snapshot 4",
      text: "Ice-related recipes get another pass. New betas are out for Java 26.4-snapshot-4.",
      tags: ["snapshot", "beta"],
      image: "images/icons/snapshot.svg",
      projects: [
        { id: "better-craftables", version: "v8.1.0-beta.3", text: "Adjusted the Icicle and Ice Crystal crafting recipes." },
        { id: "better-unpackables", version: "v5.1.0-beta.3", text: "Adjusted the Icicle and Ice Crystal crafting requirements, and made the Packed Ice to Ice Balls recipe shapeless." }
      ]
    },
    {
      date: "2026-10-06",
      title: "26.4 Snapshot 3",
      text: "Ice Balls, Ice Crystals and Icicles arrive in our packs. New betas are out for Java 26.4-snapshot-3.",
      tags: ["snapshot", "beta"],
      image: "images/icons/snapshot.svg",
      projects: [
        { id: "better-craftables", version: "v8.1.0-beta.2", text: "Added new 26.4 recipes to craft Ice Balls, Ice Crystals and Icicles into Packed Ice and Ice." },
        { id: "better-unpackables", version: "v5.1.0-beta.2", text: "Added new 26.4 recipes to unpack Packed Ice and Ice into Ice Balls, Ice Crystals and Icicles." }
      ]
    },
    {
      date: "2026-09-22",
      title: "26.4 Snapshot 1",
      text: "Our first betas for the 26.4 cycle are out, supporting Java 26.4-snapshot-1.",
      tags: ["snapshot", "beta"],
      image: "images/icons/snapshot.svg",
      projects: [
        { id: "better-craftables", version: "v8.1.0-beta.1" },
        { id: "better-unpackables", version: "v5.1.0-beta.1" }
      ]
    },
    {
      date: "2026-09-16",
      title: "Zisteau Pigmen v2.4.1",
      text: "A quick fix for v2.4.0, which accidentally shipped with the old pack icon.",
      tags: ["release"],
      image: "images/zisteau-pigmen.webp",
      projects: ["zisteau-pigmen"],
      url: "https://modrinth.com/resourcepack/zisteau-pigmen/version/v2.4.1",
      linkText: "View update on Modrinth"
    },
    {
      date: "2026-09-15",
      title: "Zisteau Pigmen v2.4.0",
      text: "Zisteau Pigmen is now updated for Java 26.3.",
      tags: ["release"],
      image: "images/zisteau-pigmen.webp",
      projects: ["zisteau-pigmen"],
      url: "https://modrinth.com/resourcepack/zisteau-pigmen/version/v2.4.0",
      linkText: "View update on Modrinth"
    },
    {
      date: "2026-09-15",
      title: "26.3 Mod Updates",
      text: "Our mods are now updated for Java 26.3, with new recipes in Better Craftables and Better Unpackables.",
      tags: ["release"],
      image: "images/icons/announcements.svg",
      projects: [
        { id: "better-craftables", version: "v8.0.0+mod", text: "Added redyeing recipes for Concrete Stairs and Slabs, plus a Shelf Mushroom → Brown Dye recipe." },
        { id: "better-unpackables", version: "v5.0.0+mod", text: "Added Straw Bed → Hay Bale and Cushion → Wool Slab recipes, plus \"back to block\" recipes for Concrete Stairs and Slabs." },
        { id: "silly-eatables", version: "v5.0.0+mod", text: "Updated for Java 26.3." }
      ]
    },
    {
      date: "2026-09-15",
      title: "26.3 Data Pack Updates",
      text: "Our data packs are now updated for Java 26.3, with new recipes in Better Craftables and Better Unpackables.",
      tags: ["release"],
      image: "images/icons/announcements.svg",
      projects: [
        { id: "better-craftables", version: "v8.0.0", text: "Added redyeing recipes for Concrete Stairs and Slabs, plus a Shelf Mushroom → Brown Dye recipe." },
        { id: "better-unpackables", version: "v5.0.0", text: "Added Straw Bed → Hay Bale and Cushion → Wool Slab recipes, plus \"back to block\" recipes for Concrete Stairs and Slabs." },
        { id: "silly-eatables", version: "v5.0.0", text: "Updated for Java 26.3." }
      ]
    },
    {
      date: "2026-09-14",
      title: "26.3 Resource Pack Updates",
      text: "Our resource packs are now updated for Java 26.3.",
      tags: ["release"],
      image: "images/icons/announcements.svg",
      projects: [
        { id: "classics-disc-tweaks", version: "v3.4.0", text: "Updated for Java 26.3." },
        { id: "classics-dye-tweaks", version: "v1.4.0", text: "Updated for Java 26.3." },
        { id: "classics-lantern-tweaks", version: "v2.4.0", text: "Updated for Java 26.3." }
      ]
    }
  ]
};
