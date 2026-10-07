/* SITE DATA - all site text, links and project lists.

   - Icons: SVGs in /images/icons/, referenced by filename without extension.
   - Channels: "stable" | "beta" | "alpha" | "unsupported".
   - Downloads: each needs its own "version". Add `disabled: true` (and an
     optional "tooltip") if unavailable.
   - Badges: `badge: "new"` or `"updated"` on a channel. Visitors can dismiss
     it; it returns when that channel's download versions change.
   - New project: copy an existing project block. */

const SITE_DATA = {

  brand: {
    logo: "images/logo.png",
    name: "CLASSIC'S CRAFTWORKS"
  },

  version: {
    label: "v3.1.0",
    url: "https://github.com/Classics-Craftworks/Website/blob/main/CHANGELOG.md"
  },

  home: {
    splash: {
      headline: ["SOMETIMES USEFUL.", "ALWAYS MINECRAFT."],
      subtitle: "Minecraft Java Edition data packs, mods & resource packs by Classic's Craftworks",
      featured: "Better Craftables",
      featuredImage: "images/featured-banner.webp"
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
    { label: "About", url: "about", icon: "book" }
  ],

  sections: [
    // #region ▓▓▓▓▓▓▓▓▓▓▓▓  DATA PACKS & MODS  ▓▓▓▓▓▓▓▓▓▓▓▓
    {
      heading: "Data Packs & Mods",
      projects: [
        // #region ──────── Better Craftables ────────
        {
          image: "images/better-craftables.webp",
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
                { label: "Data Pack", icon: "brackets", version: "v8.0.0", url: "https://modrinth.com/datapack/better-craftables/version/v8.0.0" },
                { label: "Mod", icon: "box", version: "v8.0.0+mod", url: "https://modrinth.com/datapack/better-craftables/version/v8.0.0+mod" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              mcVersion: "26.3 – 26.4-snap-3",
              badge: "updated",
              downloads: [
                { label: "Data Pack", icon: "brackets", version: "v8.1.0-beta.2", url: "https://modrinth.com/datapack/better-craftables/version/v8.1.0-beta.2" },
                { label: "Mod", icon: "box", disabled: true, tooltip: "Beta mod versions are not published during Minecraft development cycles." }
              ]
            }
          ]
        },
        // #endregion Better Craftables

        // #region ──────── Better Unpackables ────────
        {
          image: "images/better-unpackables.webp",
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
                { label: "Data Pack", icon: "brackets", version: "v5.0.0", url: "https://modrinth.com/datapack/better-unpackables/version/v5.0.0" },
                { label: "Mod", icon: "box", version: "v5.0.0+mod", url: "https://modrinth.com/datapack/better-unpackables/version/v5.0.0+mod" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              mcVersion: "26.3 – 26.4-snap-3",
              badge: "updated",
              downloads: [
                { label: "Data Pack", icon: "brackets", version: "v5.1.0-beta.2", url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.2" },
                { label: "Mod", icon: "box", disabled: true, tooltip: "Beta mod versions are not published during Minecraft development cycles." }
              ]
            }
          ]
        },
        // #endregion Better Unpackables

        // #region ──────── Silly Eatables ────────
        {
          image: "images/silly-eatables.webp",
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
                { label: "Data Pack", icon: "brackets", version: "v5.0.0", url: "https://modrinth.com/datapack/silly-eatables/version/v5.0.0" },
                { label: "Mod", icon: "box", version: "v5.0.0+mod", url: "https://modrinth.com/datapack/silly-eatables/version/v5.0.0+mod" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              mcVersion: "26.3 – 26.4-snap-3",
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
          title: "New Sword Blocking",
          description: "Restores and enhances sword blocking in Minecraft 1.21.5 – 1.21.8!",
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
                { label: "Data Pack", icon: "brackets", version: "v1.1.2", url: "https://modrinth.com/datapack/new-sword-blocking/version/v1.1.2" },
                { label: "Mod", icon: "box", version: "v1.1.2+mod", url: "https://modrinth.com/datapack/new-sword-blocking/version/v1.1.2+mod" }
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
        // #region ──────── Classic's Disc Tweaks ────────
        {
          image: "images/disc-tweaks.webp",
          title: "Classic's Disc Tweaks",
          description: "Subtly widens music discs and unifies their design for a more cohesive look.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/classics-disc-tweaks" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Classics-Disc-Tweaks" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Classics-Disc-Tweaks/wiki" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Release",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", version: "v3.4.0", url: "https://modrinth.com/resourcepack/classics-disc-tweaks/version/v3.4.0" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              mcVersion: "1.21.9 – 26.4-snap-3",
              downloads: [
                { label: "Resource Pack", icon: "brush", disabled: true, tooltip: "Betas for this project usually release later in the Minecraft development cycle, unless changes need testing." },
              ]
            }
          ]
        },
        // #endregion Classic's Disc Tweaks

        // #region ──────── Classic's Dye Tweaks ────────
        {
          image: "images/dye-tweaks.webp",
          title: "Classic's Dye Tweaks",
          description: "Tweaks Minecraft's new dye textures and brings them to older versions of the game!",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/classics-dye-tweaks" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Classics-Dye-Tweaks" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Classics-Dye-Tweaks/wiki" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Release",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", version: "v1.4.0", url: "https://modrinth.com/resourcepack/classics-dye-tweaks/version/v1.4.0" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              mcVersion: "1.21.9 – 26.4-snap-3",
              downloads: [
                { label: "Resource Pack", icon: "brush", disabled: true, tooltip: "Betas for this project usually release later in the Minecraft development cycle, unless changes need testing." },
              ]
            }
          ]
        },
        // #endregion Classic's Dye Tweaks

        // #region ──────── Classic's Lantern Tweaks ────────
        {
          image: "images/lantern-tweaks.webp",
          title: "Classic's Lantern Tweaks",
          description: "Adjusts the edges of Soul & Copper Lanterns so they better match the regular Lantern. Little details matter!",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks" },
            { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks/Classics-Lantern-Tweaks" },
            { label: "Wiki", icon: "book", url: "https://github.com/Classics-Craftworks/Classics-Lantern-Tweaks/wiki" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Release",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", version: "v2.4.0", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks/version/v2.4.0" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              mcVersion: "1.21.9 – 26.4-snap-3",
              downloads: [
                { label: "Resource Pack", icon: "brush", disabled: true, tooltip: "Betas for this project usually release later in the Minecraft development cycle, unless changes need testing." },
              ]
            }
          ]
        },
        // #endregion Classic's Lantern Tweaks

        // #region ──────── Zisteau Pigmen ────────
        {
          image: "images/zisteau-pigmen.webp",
          title: "Zisteau Pigmen",
          description: "Zombified Piglins named 'Zisteau' become Zombie Pigmen.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/zisteau-pigmen" }
          ],
          channels: [
            {
              channel: "unsupported",
              label: "Limited Support",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", version: "v2.4.1", url: "https://modrinth.com/resourcepack/zisteau-pigmen/version/v2.4.1" }
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
    established: "Est. 2017",
    disclaimer: "NOT AN OFFICIAL MINECRAFT PRODUCT OR SERVICE. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.",
    iconCredits: { prefix: "Icons provided by ", label: "SVG Repo", url: "https://www.svgrepo.com" }
  },

  downloadNotice: "Any reuploads of these projects that are not linked on this website are unofficial, unaffiliated, and may have been modified or contain malicious content."
};

// TOOLTIP STORAGE
// NO BETAS: tooltip: "Betas for this project usually release later in the Minecraft development cycle, unless changes need testing."
// NO MOD BETAS: "Beta mod versions are not published during Minecraft development cycles."