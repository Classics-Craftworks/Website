/* ============================================================
   SITE DATA
   The main file for site text, links and project lists. Layout and
   rendering are handled by section-page.js and index.js.

   QUICK GUIDE:
   - Text & Links: edit values inside quotes (label, url, etc).
   - Images: place in /images, set the relative path.
   - Icons: place SVGs in /images/icons/, refer to by filename (no extension).
   - Projects: copy an existing project {...} block to add a new one.
   - Channels: "stable"/"beta"/"alpha"/"unsupported". Add "disabled: true"
     to a download if unavailable, with an optional "tooltip" explaining why.
   - Download versions: each download shows its own "version" pill
     (no channel-wide fallback — give every enabled download one).
   - "New"/"Updated" badge: add `badge: "new"` or `"updated"` to a channel.
     Dismissible by visitors; reappears automatically next time that
     channel's download versions are bumped.
   ============================================================ */

// One big object — the page scripts read values out of it (e.g.
// SITE_DATA.brand.name) to build each page.
const SITE_DATA = {

  // Logo, name and one-line tagline shown at the top of the page.
  brand: {
    logo: "images/logo.png",
    name: "CLASSIC'S CRAFTWORKS",
    tagline: "Minecraft Java Edition data packs, mods & resource packs.<br>Sometimes useful. Always Minecraft."
  },

  // Website version shown at the very bottom of the page.
   version: {
    label: "v2.0.0-dev.8",
    url: "https://github.com/Classics-Craftworks/Website/blob/main/CHANGELOG.md"
  },


  // Buttons shown next to the logo at the very top of the page.
  topLinks: [
    { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/organization/classics-craftworks" },
    { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks" }
  ],

  // Every page in the sticky page-nav bar: the home page plus one page
  // per section. Add an entry here (with the matching section heading
  // below) whenever a new section gets its own page, and it shows up
  // in every page's nav automatically. "Home" has no "section" since
  // it isn't tied to one.
  pages: [
    { label: "Home", url: "index.html" },
    { label: "Data Packs & Mods", url: "data-packs-mods.html", section: "Data Packs & Mods" },
    { label: "Resource Packs", url: "resource-packs.html", section: "Resource Packs" },
    { label: "Other Projects", url: "other-projects.html", section: "Other Projects" }
  ],

  // The main content: each entry below is a section (a heading
  // plus a list of projects). Add, remove, or reorder sections
  // and projects freely — the layout will adjust automatically.
  sections: [
    // #region ▓▓▓▓▓▓▓▓▓▓▓▓  DATA PACKS & MODS  ▓▓▓▓▓▓▓▓▓▓▓▓
    {
      heading: "Data Packs & Mods",
      icon: "brackets",
      projects: [
        // Each object in this "projects" array becomes one project card
        // on the page. Copy an entire { ... } block like this one and
        // paste it here (with a trailing comma) to add a new project.

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
              mcVersion: "26.3 – 26.4-snap-1",
              badge: "new",
              downloads: [
                { label: "Data Pack", icon: "brackets", version: "v8.1.0-beta.1", url: "https://modrinth.com/datapack/better-craftables/version/v8.1.0-beta.1" },
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
              mcVersion: "26.3 – 26.4-snap-1",
              badge: "new",
              downloads: [
                { label: "Data Pack", icon: "brackets", version: "v5.1.0-beta.1", url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.1" },
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
              mcVersion: "26.3 – 26.4-snap-1",
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
      icon: "brush",
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
              mcVersion: "1.21.9 – 26.4-snap-1",
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
              mcVersion: "1.21.9 – 26.4-snap-1",
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
              mcVersion: "1.21.9 – 26.4-snap-1",
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
      icon: "wrench",
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

  // Social links shown at the bottom of the page.
  socials: [
    { label: "X / Twitter", url: "https://x.com/C36Craftworks", icon: "x" },
    { label: "Discord", url: "https://discord.gg/vZJSDjPcmu", icon: "discord" },
    { label: "Reddit", url: "https://www.reddit.com/r/ClassicsCraftworks", icon: "reddit" }
  ],

  footer: {
    copyright: "\u00A9 2023\u20132026 Classic36 / Classic's Craftworks",
    disclaimer: "NOT AN OFFICIAL MINECRAFT PRODUCT OR SERVICE. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.",
    iconCredits: { prefix: "Link icons provided by ", label: "SVG Repo", url: "https://www.svgrepo.com" }
  }
};

// TOOLTIP STORAGE
// NO BETAS: tooltip: "Betas for this project usually release later in the Minecraft development cycle, unless changes need testing."
// NO MOD BETAS: "Beta mod versions are not published during Minecraft development cycles."