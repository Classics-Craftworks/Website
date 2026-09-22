/* ============================================================
   SITE DATA
   This is the primary file for updating site text, links and project lists.
   The layout and rendering are managed automatically by script.js.

   QUICK GUIDE:
   - Text & Links: Update values inside quotes (e.g., label, url).
   - Images: Place files in /images and set the relative path (e.g., "images/logo.png").
   - Icons: Place PNG files in /images/icons/ and refer to them by filename without extension.
   - Projects: Copy an existing project object block {...} inside the "projects" array to add a new project.
   - Channels: Each project supports "stable", "beta", "alpha", or "unsupported" channels. Add "disabled: true"
     to a download label if a build is unavailable. Optionally add a "tooltip" string alongside it to explain
     why - it shows on hover (and on keyboard focus) over the greyed-out button. If "tooltip" is left off, the 
     button still shows as unavailable, just without the extra explanation.
   - "New"/"Updated" badge: add `badge: "new"` or `badge: "updated"` to any channel to show a small
     dismissible tag next to its name. Visitors can dismiss it (✕); it quietly comes back on its own the
     next time you bump that channel's "version" — no extra flag to remove/reset by hand, so it's safe to
     just leave `badge: "new"` sitting on a channel across releases.
   ============================================================ */

// This whole file is one big JavaScript object. script.js reads values
// out of it (e.g. SITE_DATA.brand.name) to build the page — nothing in
// here directly draws anything on screen by itself.
const SITE_DATA = {

  // Logo, name and one-line tagline shown at the top of the page.
  brand: {
    logo: "images/logo.png",
    name: "CLASSIC'S CRAFTWORKS",
    tagline: "Minecraft Java Edition data packs, mods & resource packs.<br>Sometimes useful. Always Minecraft."
  },

  // Website version shown at the very bottom of the page.
   version: {
    label: "v0.16.2.1",
    url: "https://github.com/Classics-Craftworks/Website/blob/main/CHANGELOG.md"
  },


  // Buttons shown next to the logo at the very top of the page.
  topLinks: [
    { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/organization/classics-craftworks" },
    { label: "GitHub", icon: "github", url: "https://github.com/Classics-Craftworks" }
  ],

  // The main content: each entry below is a section (a heading
  // plus a list of projects). Add, remove, or reorder sections
  // and projects freely — the layout will adjust automatically.
  sections: [
    // #region ▓▓▓▓▓▓▓▓▓▓▓▓  DATA PACKS & MODS  ▓▓▓▓▓▓▓▓▓▓▓▓
    {
      heading: "Data Packs & Mods",
      projects: [
        // Each object in this "projects" array becomes one project card
        // on the page. Copy an entire { ... } block like this one and
        // paste it here (with a trailing comma) to add a new project.

        // #region ──────── Better Craftables ────────
        {
          image: "images/better-craftables.png",
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
              version: "v8.0.0",
              mcVersion: "26.3",
              downloads: [
                { label: "Data Pack", icon: "brackets", url: "https://modrinth.com/datapack/better-craftables/version/v8.0.0" },
                { label: "Mod", icon: "box", url: "https://modrinth.com/datapack/better-craftables/version/v8.0.0+mod" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              version: "v8.1.0-beta.1",
              mcVersion: "26.3 – 26.4-snap-1",
              badge: "new",
              downloads: [
                { label: "Data Pack", icon: "brackets", url: "https://modrinth.com/datapack/better-craftables/version/v8.1.0-beta.1" },
                { label: "Mod", icon: "box", disabled: true, tooltip: "Beta mod versions are not published during Minecraft development cycles." }
              ]
            }
          ]
        },
        // #endregion Better Craftables

        // #region ──────── Better Unpackables ────────
        {
          image: "images/better-unpackables.png",
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
              version: "v5.0.0",
              mcVersion: "26.3",
              downloads: [
                { label: "Data Pack", icon: "brackets", url: "https://modrinth.com/datapack/better-unpackables/version/v5.0.0" },
                { label: "Mod", icon: "box", url: "https://modrinth.com/datapack/better-unpackables/version/v5.0.0+mod" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              version: "v5.1.0-beta.1",
              mcVersion: "26.3 – 26.4-snap-1",
              badge: "new",
              downloads: [
                { label: "Data Pack", icon: "brackets", url: "https://modrinth.com/datapack/better-unpackables/version/v5.1.0-beta.1" },
                { label: "Mod", icon: "box", disabled: true, tooltip: "Beta mod versions are not published during Minecraft development cycles." }
              ]
            }
          ]
        },
        // #endregion Better Unpackables

        // #region ──────── Silly Eatables ────────
        {
          image: "images/silly-eatables.png",
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
              version: "v5.0.0",
              mcVersion: "26.3",
              downloads: [
                { label: "Data Pack", icon: "brackets", url: "https://modrinth.com/datapack/silly-eatables/version/v5.0.0" },
                { label: "Mod", icon: "box", url: "https://modrinth.com/datapack/silly-eatables/version/v5.0.0+mod" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              version: "N/A",
              mcVersion: "26.3 – 26.4-snap-1",
              downloads: [
                { label: "Data Pack", icon: "brackets", disabled: true, tooltip: "This project usually gets betas later in the Minecraft development cycle, unless changes need testing." },
                { label: "Mod", icon: "box", disabled: true, tooltip: "Beta mod versions are not published during Minecraft development cycles." }
              ]
            }
          ]
        },
        // #endregion Silly Eatables

        // #region ──────── New Sword Blocking ────────
        {
          image: "images/new-sword-blocking.png",
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
              version: "v1.1.2",
              mcVersion: "1.21.5 – 1.21.8",
              downloads: [
                { label: "Data Pack", icon: "brackets", url: "https://modrinth.com/datapack/new-sword-blocking/version/v1.1.2" },
                { label: "Mod", icon: "box", url: "https://modrinth.com/datapack/new-sword-blocking/version/v1.1.2+mod" }
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
          image: "images/disc-tweaks.png",
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
              version: "v3.4.0",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", url: "https://modrinth.com/resourcepack/classics-disc-tweaks/version/v3.4.0" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              version: "N/A",
              mcVersion: "1.21.9 – 26.4-snap-1",
              downloads: [
                { label: "Resource Pack", icon: "brush", disabled: true, tooltip: "This project usually gets betas later in the Minecraft development cycle, unless changes need testing." },
              ]
            }
          ]
        },
        // #endregion Classic's Disc Tweaks

        // #region ──────── Classic's Dye Tweaks ────────
        {
          image: "images/dye-tweaks.png",
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
              version: "v1.4.0",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", url: "https://modrinth.com/resourcepack/classics-dye-tweaks/version/v1.4.0" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              version: "N/A",
              mcVersion: "1.21.9 – 26.4-snap-1",
              downloads: [
                { label: "Resource Pack", icon: "brush", disabled: true, tooltip: "This project usually gets betas later in the Minecraft development cycle, unless changes need testing." },
              ]
            }
          ]
        },
        // #endregion Classic's Dye Tweaks

        // #region ──────── Classic's Lantern Tweaks ────────
        {
          image: "images/lantern-tweaks.png",
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
              version: "v2.4.0",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks/version/v2.4.0" }
              ]
            },
            {
              channel: "beta",
              label: "Beta",
              version: "N/A",
              mcVersion: "1.21.9 – 26.4-snap-1",
              downloads: [
                { label: "Resource Pack", icon: "brush", disabled: true, tooltip: "This project usually gets betas later in the Minecraft development cycle, unless changes need testing." },
              ]
            }
          ]
        },
        // #endregion Classic's Lantern Tweaks

        // #region ──────── Zisteau Pigmen ────────
        {
          image: "images/zisteau-pigmen.png",
          title: "Zisteau Pigmen",
          description: "Zombified Piglins named 'Zisteau' become Zombie Pigmen.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/resourcepack/zisteau-pigmen" }
          ],
          channels: [
            {
              channel: "unsupported",
              label: "Limited Support",
              version: "v2.4.1",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", icon: "brush", url: "https://modrinth.com/resourcepack/zisteau-pigmen/version/v2.4.1" }
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
      defaultOpen: false,
      projects: [
        // #region ──────── CraftHorizon ────────
        {
          image: "images/crafthorizon.png",
          title: "CraftHorizon",
          description: "Whitelisted Minecraft server, with a focus on vanilla+ Survival and Creative gameplay.",
          links: [
            { label: "Modrinth", icon: "modrinth", url: "https://modrinth.com/server/crafthorizon" },
            { label: "Trello", icon: "document", url: "https://trello.com/b/TK7pofcG/crafthorizon" },
            { label: "Wiki", icon: "book", url: "https://classicscraftworks.gitbook.io/crafthorizon/" }
          ]
        }
        // #endregion CraftHorizon
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
    iconCredits: { prefix: "Link icons by ", label: "Icons8", url: "https://icons8.com" }
  }
};