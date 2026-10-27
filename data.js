/* SITE DATA - all site text, links and project lists.

   - Icons: SVGs in /images/icons/, referenced by filename without extension.
   - imageAlt: screen-reader text for the project icon; omit for decorative images.
   - Channels: "stable" | "beta" | "alpha" | "unsupported".
   - Downloads: each needs a "label" (its table column), a "version" and a "url"; add `disabled: true`
     (and optional "tooltip") if unavailable. Optional `date: "YYYY-MM-DD"` sets the release date shown
     in its cell; without it the date comes from latest-updates.js (matching project and version),
     else the cell shows a "Date TBC" placeholder.
   - Notes: optional `note: "text"` on a project adds an info panel under its release table.
   - Notifications: `notify: true` on a download puts a dot beside its version and in the navigation until
     the project's page has been opened (a new visitor sees every dot). The dot
     shows again when that download's version number changes.
   - New project: copy an existing project block. */

const SITE_DATA = {

  brand: {
    logo: "images/logo.png",
    name: "CLASSIC'S CRAFTWORKS"
  },

  version: {
    label: "v4.0.0.1",
    url: "https://github.com/Classics-Craftworks/Website/blob/main/CHANGELOG.md"
  },

  home: {
    splash: {
      headline: ["SOMETIMES USEFUL.", "ALWAYS MINECRAFT."],
      subtitle: "Quality-of-life recipes, texture tweaks and more for Minecraft Java Edition.",
      featured: [
        { title: "Classic's Tweaks", image: "images/featured-CT.webp" },
        { title: "Better Craftables", image: "images/featured-BC.webp" },
      ]
    },

    projectsHeading: "Projects",
    projectsSubtitle: ""
  },

  // Header pages. Entries with a "section" go in the Projects dropdown and
  // must match a section heading below; Home ("/") and About get their own links.
  pages: [
    { label: "Home", url: "/", icon: "home" },
    { label: "Data Packs & Mods", url: "data-packs-mods", section: "Data Packs & Mods", icon: "brackets" },
    { label: "Resource Packs", url: "resource-packs", section: "Resource Packs", icon: "brush" },
    { label: "Other Projects", url: "other-projects", section: "Other Projects", icon: "wrench" },
    { label: "News", url: "news", icon: "news" },
    { label: "About", url: "about", icon: "about" }
  ],

  sections: [
    // #region ▓▓▓▓▓▓▓▓▓▓▓▓  DATA PACKS & MODS  ▓▓▓▓▓▓▓▓▓▓▓▓
    {
      heading: "Data Packs & Mods",
      projects: [
        // #region ──────── Better Craftables ────────
        {
          image: "images/better-craftables.webp",
          imageAlt: "Better Craftables logo: the letters BC",
          title: "Better Craftables",
          description: "Adds some quality-of-life crafting and smelting recipes to the game.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/datapack/better-craftables" },
            { label: "SpigotMC", icon: "spigot", url: "https://www.spigotmc.org/resources/better-craftables.108728/" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Better-Craftables" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Better-Craftables/wiki" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Release",
              mcVersion: "26.3",
              downloads: [
                { label: "Data Pack", icon: "brackets", version: "v8.0.0", url: "https://modrinth.com/datapack/better-craftables/version/v8.0.0", date: "2026-09-15" },
                { label: "Mod", icon: "box", version: "v8.0.0+mod", url: "https://modrinth.com/datapack/better-craftables/version/v8.0.0+mod", date: "2026-09-15" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              mcVersion: "26.3 – 26.4-snap-5",
              downloads: [
                { label: "Data Pack", icon: "brackets", version: "v8.1.0-beta.4", url: "https://modrinth.com/datapack/better-craftables/version/v8.1.0-beta.4", date: "2026-10-20", notify: true },
                { label: "Mod", icon: "box", disabled: true, tooltip: "Beta mod versions are not published during Minecraft development cycles." }
              ]
            }
          ]
        },
        // #endregion Better Craftables

        // #region ──────── Better Unpackables ────────
        {
          image: "images/better-unpackables.webp",
          imageAlt: "Better Unpackables logo: the letters BU",
          title: "Better Unpackables",
          description: "Adds some quality-of-life unpacking recipes to the game.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/datapack/better-unpackables" },
            { label: "SpigotMC", icon: "spigot", url: "https://www.spigotmc.org/resources/better-unpackables.120335/" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Better-Unpackables" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Better-Unpackables/wiki" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Release",
              mcVersion: "26.3",
              downloads: [
                { label: "Data Pack", icon: "brackets", version: "v5.0.1", url: "https://modrinth.com/datapack/better-unpackables/version/v5.0.1", date: "2026-10-13" },
                { label: "Mod", icon: "box", version: "v5.0.1+mod", url: "https://modrinth.com/datapack/better-unpackables/version/v5.0.1+mod", date: "2026-10-13" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              mcVersion: "26.3 – 26.4-snap-5",
              downloads: [
                { label: "Data Pack", icon: "brackets", version: "v5.1.0-beta.6", url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.6", date: "2026-10-20", notify: true },
                { label: "Mod", icon: "box", disabled: true, tooltip: "Beta mod versions are not published during Minecraft development cycles." }
              ]
            }
          ]
        },
        // #endregion Better Unpackables

        // #region ──────── Silly Eatables ────────
        {
          image: "images/silly-eatables.webp",
          imageAlt: "Silly Eatables logo: the letters SE",
          title: "Silly Eatables",
          description: "Eat things you shouldn't with these silly food recipes!",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/datapack/silly-eatables" },
            { label: "SpigotMC", icon: "spigot", url: "https://www.spigotmc.org/resources/silly-eatables.116362/" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Silly-Eatables" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Silly-Eatables/wiki" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Release",
              mcVersion: "26.3",
              downloads: [
                { label: "Data Pack", icon: "brackets", version: "v5.0.0", url: "https://modrinth.com/datapack/silly-eatables/version/v5.0.0", date: "2026-09-15" },
                { label: "Mod", icon: "box", version: "v5.0.0+mod", url: "https://modrinth.com/datapack/silly-eatables/version/v5.0.0+mod", date: "2026-09-15" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              mcVersion: "26.3 – 26.4-snap-5",
              downloads: [
                { label: "Data Pack", icon: "brackets", disabled: true, tooltip: "Betas for this project usually release later in the Minecraft development cycle, unless changes need testing." },
                { label: "Mod", icon: "box", disabled: true, tooltip: "Beta mod versions are not published during Minecraft development cycles." }
              ]
            }
          ]
        },
        // #endregion Silly Eatables

        // #region ──────── New Sword Blocking ────────
        {
          image: "images/new-sword-blocking.webp",
          imageAlt: "New Sword Blocking logo: the letters NSB",
          title: "New Sword Blocking",
          description: "Restores and enhances sword blocking in Minecraft 1.21.5 – 1.21.8!",
          note: "This project is no longer supported and will not receive further updates. There are better alternatives available elsewhere.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/datapack/new-sword-blocking" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/New-Sword-Blocking" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/New-Sword-Blocking/wiki" }
          ],
          channels: [
            {
              channel: "unsupported",
              label: "Unsupported",
              mcVersion: "1.21.5 – 1.21.8",
              downloads: [
                { label: "Data Pack", icon: "brackets", version: "v1.1.2", url: "https://modrinth.com/datapack/new-sword-blocking/version/v1.1.2", date: "2025-07-17" },
                { label: "Mod", icon: "box", version: "v1.1.2+mod", url: "https://modrinth.com/datapack/new-sword-blocking/version/v1.1.2+mod", date: "2025-07-17" }
              ]
            }
          ]
        }
        // #endregion New Sword Blocking
      ]
    },
    // #endregion DATA PACKS & MODS

    // #region ▓▓▓▓▓▓▓▓▓▓▓▓  RESOURCE PACKS  ▓▓▓▓▓▓▓▓▓▓▓▓
    {
      heading: "Resource Packs",
      projects: [
        // #region ──────── Classic's Tweaks ────────
        {
          image: "images/classics-tweaks.webp",
          imageAlt: "Classic's Tweaks logo: the letters CT",
          title: "Classic's Tweaks",
          description: "Little details matter: subtle texture tweaks for Minecraft, each one toggleable in-game with Respackopts.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/classics-tweaks" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Classics-Tweaks" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Classics-Tweaks/wiki" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Release",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", version: "v3.0.0", url: "https://modrinth.com/resourcepack/classics-tweaks/version/v3.0.0", date: "2026-10-26", notify: true }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              mcVersion: "1.21.9 – 26.4-snap-5",
              downloads: [
                { label: "Resource Pack", icon: "brush", disabled: true, tooltip: "Betas for 26.4 are coming soon!" },
              ]
            }
          ]
        },
        // #endregion Classic's Disc Tweaks

        // #region ──────── Classic's Disc Tweaks ────────
        {
          image: "images/disc-tweaks.webp",
          imageAlt: "Classic's Disc Tweaks logo: the letters DT",
          title: "Classic's Disc Tweaks",
          description: "Subtly widens music discs and unifies their design for a more cohesive look.",
          note: "This resource pack has been merged into Classic's Tweaks and is no longer updated. Use Classic's Tweaks instead.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/classics-disc-tweaks" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Classics-Disc-Tweaks" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Classics-Disc-Tweaks/wiki" }
          ],
          channels: [
            {
              channel: "unsupported",
              label: "Archived",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", version: "v3.4.0", url: "https://modrinth.com/resourcepack/classics-disc-tweaks/version/v3.4.0", date: "2026-09-14" }
              ]
            }
          ]
        },
        // #endregion Classic's Disc Tweaks

        // #region ──────── Classic's Dye Tweaks ────────
        {
          image: "images/dye-tweaks.webp",
          imageAlt: "Classic's Dye Tweaks logo: the letters DT",
          title: "Classic's Dye Tweaks",
          description: "Tweaks Minecraft's new dye textures and brings them to older versions of the game!",
          note: "This resource pack has been merged into Classic's Tweaks and is no longer updated. Use Classic's Tweaks instead.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/classics-dye-tweaks" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Classics-Dye-Tweaks" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Classics-Dye-Tweaks/wiki" }
          ],
          channels: [
            {
              channel: "unsupported",
              label: "Archived",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", version: "v1.4.0", url: "https://modrinth.com/resourcepack/classics-dye-tweaks/version/v1.4.0", date: "2026-09-14" }
              ]
            }
          ]
        },
        // #endregion Classic's Dye Tweaks

        // #region ──────── Classic's Lantern Tweaks ────────
        {
          image: "images/lantern-tweaks.webp",
          imageAlt: "Classic's Lantern Tweaks logo: the letters LT",
          title: "Classic's Lantern Tweaks",
          description: "Adjusts the edges of Soul & Copper Lanterns so they better match the regular Lantern. Little details matter!",
          note: "This resource pack has been merged into Classic's Tweaks and is no longer updated. Use Classic's Tweaks instead.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Classics-Lantern-Tweaks" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Classics-Lantern-Tweaks/wiki" }
          ],
          channels: [
            {
              channel: "unsupported",
              label: "Archived",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", version: "v2.4.0", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks/version/v2.4.0", date: "2026-09-14" }
              ]
            }
          ]
        },
        // #endregion Classic's Lantern Tweaks

        // #region ──────── Classic's Note Block Tweaks ────────
        {
          image: "images/note-block-tweaks.webp",
          imageAlt: "Classic's Note Block Tweaks logo: the letters NT",
          title: "Classic's Note Block Tweaks",
          description: "Updates Note Blocks to better match new Jukebox textures, and backports them to 1.21.9 - 26.3.",
          note: "This resource pack has been merged into Classic's Tweaks. It will continue to receive updates throughout the 26.4 development cycle, but will be archived after v1.0.0.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/classics-note-block-tweaks" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Classics-Note-Block-Tweaks" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Classics-Note-Block-Tweaks/wiki" }
          ],
          channels: [
            {
              channel: "alpha",
              label: "Alpha",
              mcVersion: "1.21.9 – 26.4-snap-5",
              downloads: [
                { label: "Resource Pack", icon: "brush", version: "v0.5.0", url: "https://modrinth.com/resourcepack/classics-note-block-tweaks/version/v0.5.0", date: "2026-10-20", notify: true }
              ]
            }
          ]
        },
        // #endregion Classic's Note Block Tweaks

        // #region ──────── Zisteau Pigmen ────────
        {
          image: "images/zisteau-pigmen.webp",
          imageAlt: "Zisteau Pigmen logo: the letters ZP",
          title: "Zisteau Pigmen",
          description: "Zombified Piglins named 'Zisteau' become Zombie Pigmen.",
          note: "This resource pack has been merged into Classic's Tweaks and is no longer updated. Use Classic's Tweaks instead.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/zisteau-pigmen" }
          ],
          channels: [
            {
              channel: "unsupported",
              label: "Archived",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", version: "v2.4.1", url: "https://modrinth.com/resourcepack/zisteau-pigmen/version/v2.4.1", date: "2026-09-16" }
              ]
            }
          ]
        }
        // #endregion Zisteau Pigmen
      ]
    },
    // #endregion RESOURCE PACKS

    // #region ▓▓▓▓▓▓▓▓▓▓▓▓  OTHER PROJECTS  ▓▓▓▓▓▓▓▓▓▓▓▓
    {
      heading: "Other Projects",
      projects: [
        // #region ──────── CraftHorizon ────────
        {
          image: "images/crafthorizon.webp",
          imageAlt: "CraftHorizon logo over a starry galaxy",
          title: "CraftHorizon",
          description: "Whitelisted Minecraft server, with a focus on vanilla+ Survival and Creative gameplay.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/server/crafthorizon" },
            { label: "Trello", icon: "document", url: "https://trello.com/b/TK7pofcG/crafthorizon" },
            { label: "Wiki", icon: "book", url: "https://classicscraftworks.gitbook.io/crafthorizon" }
          ]
        },
        // #endregion CraftHorizon

        // #region ──────── Website ────────
        {
          image: "images/craftworks.webp",
          imageAlt: "Classic's Craftworks CCW emblem",
          title: "Classic's Craftworks Website",
          description: "The hub for all of our projects. You're already here!",
          links: [
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Website" }
          ]
        }
        // #endregion Website
      ]
    }
    // #endregion OTHER PROJECTS
  ],

  // About page blocks, in order: "paragraph" | { heading } | { list: [] } |
  // { quote } | { divider: true }. Text may use {projects} (number of downloadable projects) or
  // be an array mixing strings with { link, url } / { bold } / { italic } / { code }.
  about: {
    heading: "About",
    content: [
      "Started in 2017, Classic's Craftworks is a workshop for Minecraft ideas, focused on creating data packs, mods, resource packs and other projects for Minecraft: Java Edition. What began as a collection of small experiments and ideas has grown into a place for projects of all shapes and sizes... though, admittedly, mostly on the smaller side.",
      "The projects themselves vary quite a bit. Some are designed to improve existing features, add useful quality-of-life changes or solve problems that Minecraft doesn't quite solve on its own. Others simply exist because they seemed like a good idea at the time. Spoiler alert: they're not always good ideas... Ultimately, some are useful, some are experimental, and some are questionable. Sometimes useful. Always Minecraft.",
      "Classic's Craftworks aims to keep its projects accessible and straightforward. Releases, documentation and additional information are provided wherever possible, making it easy to find what you need and get a project running in your own Minecraft world.",
      "Since 2023, Classic's Craftworks has published {projects} projects. Every project has its own section on this website, containing a brief description, relevant links, release information and downloads.",
      "Of course, not every project has survived the years. Some were discontinued, some were removed, and some probably should never have existed in the first place. Classic's Craftworks (and Minecraft itself, for that matter) has changed quite a bit since 2017, and not everything has needed to stick around."
    ]
  },

  socials: [
    { label: "Modrinth", url: "https://modrinth.com/organization/classics-craftworks", icon: "modrinth" },
    { label: "GitHub", url: "https://github.com/Classics-Craftworks", icon: "github" },
    { label: "Discord", url: "https://discord.gg/vZJSDjPcmu", icon: "discord" },
    { label: "X / Twitter", url: "https://x.com/C36Craftworks", icon: "x" },
    { label: "Reddit", url: "https://www.reddit.com/r/ClassicsCraftworks", icon: "reddit" }
  ],

  footer: {
    copyright: "\u00A9 2023\u20132026 Classic36 / Classic's Craftworks",
    disclaimer: "NOT AN OFFICIAL MINECRAFT PRODUCT OR SERVICE. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.",
    iconCredits: { prefix: "Icons provided by ", label: "SVG Repo", url: "https://www.svgrepo.com" }
  },

  downloadNotice: "Any reuploads of these projects that are not linked on this website are unofficial, unaffiliated, and may have been modified or contain malicious content."
};

// TOOLTIP STORAGE
// NO BETAS: tooltip: "Betas for this project usually release later in the Minecraft development cycle, unless changes need testing."
// NO MOD BETAS: "Beta mod versions are not published during Minecraft development cycles."