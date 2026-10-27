/* LATEST UPDATES - the news feed (home page preview and News page), rendered by news.js.

   Entries (`entries`, any order; newest `date` first):
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
     mc        (optional) Minecraft version(s) the entry is for, e.g. "26.4" or
               ["1.21.11", "26.1"]; adds them to the News page's "Minecraft version" filter
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
        { project: "Classic's Note Block Tweaks", url: "https://modrinth.com/resourcepack/classics-note-block-tweaks/version/v1.0.0-beta.1", version: "v1.0.0-beta.1", channel: "beta", date: "2026-10-27" },
        { project: "Better Unpackables", url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.7", version: "v5.1.0-beta.7", channel: "beta", date: "2026-10-27" },
        { project: "Classic's Tweaks", url: "https://modrinth.com/resourcepack/classics-tweaks/version/v3.0.0", version: "v3.0.0", channel: "stable", date: "2026-10-26" },
        { project: "Classic's Tweaks", url: "https://modrinth.com/resourcepack/classics-tweaks/version/v3.0.0-beta.2", version: "v3.0.0-beta.2", channel: "beta", date: "2026-10-23" },
        { project: "Classic's Tweaks", url: "https://modrinth.com/resourcepack/classics-tweaks/version/v3.0.0-beta.1", version: "v3.0.0-beta.1", channel: "beta", date: "2026-10-21" },
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
    news: { label: "News", color: "#9BA7BF" },
    release: { label: "Release", color: "#22C55E" },
    beta: { label: "Beta", color: "#FF9D47" },
    alpha: { label: "Alpha", color: "#F2607E" },
    archived: { label: "Archived", color: "#9BA7BF" },
    new: { label: "New Project", color: "#74C4E7" },
    snapshot: { label: "Snapshot", color: "#9BA7BF" }
  },

  entries: [
    {
      pinned: true,
      date: "2026-10-27",
      title: "26.4 Snapshot 6",
      text: "New betas have been released for Java 26.4-snapshot-6.",
      tags: ["snapshot", "beta"],
      image: "images/icons/snapshot.svg",
      mc: "26.4",
      projects: [
        { id: "better-unpackables", version: "v5.1.0-beta.7", text: "Snow Bricks can now be turned back into blocks with \"back to block\" recipes." },
        { id: "classics-note-block-tweaks", version: "v1.0.0-beta.1", text: "First beta with support for 26.4-snapshot-6." }
      ]
    },
    {
      announce: true,
      date: "2026-10-26",
      title: "Classic's Tweaks v3.0.0",
      text: "The first full release of Classic's Tweaks. No changes since v3.0.0-beta.2.",
      tags: ["release"],
      mc: ["1.21.9", "1.21.10", "1.21.11", "26.1.x", "26.2", "26.3"],
      image: "images/classics-tweaks.webp",
      projects: ["classics-tweaks"],
      url: "https://modrinth.com/resourcepack/classics-tweaks/version/v3.0.0",
      linkText: "View update on Modrinth"
    },
    {
      date: "2026-10-23",
      title: "Classic's Tweaks v3.0.0-beta.2",
      text: "This update adds a new Zombified Piglin Fix tweak and improves upon Zisteau Pigmen and Lantern Tweaks, while also fixing Respackopts config screen issues.",
      tags: ["beta"],
      mc: ["1.21.9", "1.21.10", "1.21.11", "26.1.x", "26.2", "26.3"],
      image: "images/classics-tweaks.webp",
      projects: ["classics-tweaks"],
      url: "https://modrinth.com/resourcepack/classics-tweaks/version/v3.0.0-beta.2",
      linkText: "View update on Modrinth"
    },
    {
      date: "2026-10-21",
      title: "Introducing Classic's Tweaks",
      text: "An all-in-one resource pack combining existing tweaks packs and Zisteau Pigmen, with individually toggleable tweaks thanks to Respackopts.",
      tags: ["new"],
      mc: ["1.21.9", "1.21.10", "1.21.11", "26.1.x", "26.2", "26.3"],
      image: "images/classics-tweaks.webp",
      projects: ["classics-tweaks"],
      url: "/resource-packs#classics-tweaks",
      linkText: "View Classic's Tweaks"
    },
    {
      date: "2026-10-21",
      title: "Standalone Tweaks Packs archived",
      text: "Classic's Disc, Dye & Lantern Tweaks and Zisteau Pigmen have merged into Classic's Tweaks and will no longer receive updates. Classic's Note Block Tweaks will be archived after v1.0.0.",
      tags: ["news", "archived"],
      projects: ["classics-disc-tweaks", "classics-dye-tweaks", "classics-lantern-tweaks", "zisteau-pigmen"],
    },
    {
      date: "2026-10-20",
      title: "Better Unpackables v5.1.0-beta.6",
      text: "In this beta, Packed Ice Bricks can now be turned back into blocks with \"back to block\" recipes.",
      tags: ["beta"],
      mc: ["26.3", "26.4"],
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
      mc: ["1.21.9", "1.21.10", "1.21.11", "26.1.x", "26.2", "26.3"],
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
      mc: "26.4",
      projects: [
        { id: "better-craftables", version: "v8.1.0-beta.4", text: "Crafting Ice now costs 2 Ice Crystals instead of 4, and the recipe is shapeless." },
        { id: "better-unpackables", version: "v5.1.0-beta.5", text: "Converting Ice into Ice Crystals now gives 2 per Ice instead of 4." }
      ]
    },
    {
      date: "2026-10-20",
      title: "Introducing Classic's Note Block Tweaks",
      text: "Our newest resource pack updates Note Blocks to match the new Jukebox textures, and backports them to Java 1.21.9 – 26.3.",
      tags: ["new"],
      mc: ["1.21.9", "1.21.10", "1.21.11", "26.1.x", "26.2", "26.3"],
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
      mc: ["26.3", "26.4"],
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
      mc: "26.3",
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
      mc: "26.4",
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
      mc: "26.4",
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
      mc: "26.4",
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
      mc: ["1.21.9", "1.21.10", "1.21.11", "26.1.x", "26.2", "26.3"],
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
      mc: ["1.21.9", "1.21.10", "1.21.11", "26.1.x", "26.2", "26.3"],
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
      mc: "26.3",
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
      mc: "26.3",
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
      mc: ["1.21.9", "1.21.10", "1.21.11", "26.1.x", "26.2", "26.3"],
      image: "images/icons/announcements.svg",
      projects: [
        { id: "classics-disc-tweaks", version: "v3.4.0", text: "Updated for Java 26.3." },
        { id: "classics-dye-tweaks", version: "v1.4.0", text: "Updated for Java 26.3." },
        { id: "classics-lantern-tweaks", version: "v2.4.0", text: "Updated for Java 26.3." }
      ]
    }
  ]
};
