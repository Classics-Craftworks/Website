/* ============================================================
   SITE DATA
   This is the primary file for updating site text, links and project lists.
   The layout and rendering are managed automatically by script.js.

   QUICK GUIDE:
   - Text & Links: Update values inside quotes (e.g., label, url).
   - Images: Place files in /images and set the relative path (e.g., "images/logo.png").
   - Icons: Place PNG files in /images/icons/ and refer to them by filename without extension.
   - Projects: Copy an existing project object block {...} inside the "projects" array to add a new project.
   - Channels: Each project supports "stable", "beta", or "alpha" channels. Add "disabled: true" to a download
     label if a build is unavailable.
   ============================================================ */

const SITE_DATA = {

  // Browser tab title, search-engine description, and the image
  // shown when this page is shared as a link (e.g. on Discord).
  meta: {
    title: "Classic's Craftworks",
    description: "Minecraft Java Edition data packs, mods & resource packs. Sometimes useful. Always Minecraft.",
    shareImage: "https://classicscraftworks.co.uk/images/banner.png",
    url: "https://classicscraftworks.co.uk/"
  },

  // Logo, name and one-line tagline shown at the top of the page.
  brand: {
    logo: "images/logo.png",
    name: "Classic's Craftworks",
    tagline: "Minecraft Java Edition data packs, mods & resource packs.<br>Sometimes useful. Always Minecraft."
  },

  // Website version shown at the very bottom of the page.
   version: {
    label: "v0.4.3",
    url: "https://github.com/Classics-Craftworks/Website/blob/main/CHANGELOG.md"
  },


  // Buttons shown next to the logo at the very top of the page.
  topLinks: [
    { label: "Modrinth", url: "https://modrinth.com/organization/classics-craftworks", icon: "modrinth" },
    { label: "GitHub", url: "https://github.com/Classics-Craftworks", icon: "github" }
  ],

  // The main content: each entry below is a section (a heading
  // plus a list of projects). Add, remove, or reorder sections
  // and projects freely — the layout will adjust automatically.
  sections: [
    {
      heading: "Data Packs & Mods",
      projects: [
        {
          image: "images/better-craftables.png",
          title: "Better Craftables",
          description: "Adds some quality-of-life crafting and smelting recipes to the game.",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Better-Craftables", icon: "github" },
            { label: "Modrinth", url: "https://modrinth.com/datapack/better-craftables", icon: "modrinth" },
            { label: "SpigotMC", url: "https://www.spigotmc.org/resources/better-craftables.108728/", icon: "spigot" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Better-Craftables/wiki", icon: "document" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Stable",
              version: "v8.0.0",
              mcVersion: "26.3",
              downloads: [
                { label: "Data Pack", url: "https://modrinth.com/datapack/better-craftables/version/v8.0.0" },
                { label: "Mod", url: "https://modrinth.com/datapack/better-craftables/version/v8.0.0+mod" }
              ]
            },
            {
              channel: "beta",
              label: "Release Candidate",
              version: "v8.0.0-rc.1",
              mcVersion: "26.3-pre-3 – 26.3-rc-3",
              downloads: [
                { label: "Data Pack", url: "https://modrinth.com/datapack/better-craftables/version/v8.0.0-rc.1" },
                { label: "Mod", disabled: true }
              ]
            }
          ]
        },
        {
          image: "images/better-unpackables.png",
          title: "Better Unpackables",
          description: "Adds some quality-of-life unpacking recipes to the game.",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Better-Unpackables", icon: "github" },
            { label: "Modrinth", url: "https://modrinth.com/datapack/better-unpackables", icon: "modrinth" },
            { label: "SpigotMC", url: "https://www.spigotmc.org/resources/better-unpackables.120335/", icon: "spigot" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Better-Unpackables/wiki", icon: "document" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Stable",
              version: "v5.0.0",
              mcVersion: "26.3",
              downloads: [
                { label: "Data Pack", url: "https://modrinth.com/datapack/better-unpackables/version/v5.0.0" },
                { label: "Mod", url: "https://modrinth.com/datapack/better-unpackables/version/v5.0.0+mod" }
              ]
            },
            {
              channel: "beta",
              label: "Release Candidate",
              version: "v5.0.0-rc.1",
              mcVersion: "26.3-pre-3 – 26.3-rc-3",
              downloads: [
                { label: "Data Pack", url: "https://modrinth.com/datapack/better-unpackables/version/v5.0.0-rc.1" },
                { label: "Mod", disabled: true }
              ]
            }
          ]
        },
        {
          image: "images/silly-eatables.png",
          title: "Silly Eatables",
          description: "Eat things you shouldn't with these silly food recipes!",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Silly-Eatables", icon: "github" },
            { label: "Modrinth", url: "https://modrinth.com/datapack/silly-eatables", icon: "modrinth" },
            { label: "SpigotMC", url: "https://www.spigotmc.org/resources/silly-eatables.116362/", icon: "spigot" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Silly-Eatables/wiki", icon: "document" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Stable",
              version: "v5.0.0",
              mcVersion: "26.3",
              downloads: [
                { label: "Data Pack", url: "https://modrinth.com/datapack/silly-eatables/version/v5.0.0" },
                { label: "Mod", url: "https://modrinth.com/datapack/silly-eatables/version/v5.0.0+mod" }
              ]
            },
            {
              channel: "beta",
              label: "Release Candidate",
              version: "v5.0.0-rc.1",
              mcVersion: "26.3-pre-3 – 26.3-rc-3",
              downloads: [
                { label: "Data Pack", url: "https://modrinth.com/datapack/silly-eatables/version/v5.0.0-rc.1" },
                { label: "Mod", disabled: true }
              ]
            }
          ]
        }
      ]
    },
    {
      heading: "Resource Packs",
      projects: [
        {
          image: "images/disc-tweaks.png",
          title: "Classic's Disc Tweaks",
          description: "Subtly widens music discs and unifies their design for a more cohesive look.",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Classics-Disc-Tweaks", icon: "github" },
            { label: "Modrinth", url: "https://modrinth.com/resourcepack/classics-disc-tweaks", icon: "modrinth" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Classics-Disc-Tweaks/wiki", icon: "document" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Stable",
              version: "v3.4.0",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", url: "https://modrinth.com/resourcepack/classics-disc-tweaks/version/v3.4.0" }
              ]
            },
            {
              channel: "beta",
              label: "Pre-Release",
              version: "v3.4.0-pre.1",
              mcVersion: "1.21.9 – 26.3-rc-3",
              downloads: [
                { label: "Resource Pack", url: "https://modrinth.com/resourcepack/classics-disc-tweaks/version/v3.4.0-pre.1" }
              ]
            }
          ]
        },
        {
          image: "images/dye-tweaks.png",
          title: "Classic's Dye Tweaks",
          description: "Tweaks Minecraft's new dye textures and brings them to older versions of the game!",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Classics-Dye-Tweaks", icon: "github" },
            { label: "Modrinth", url: "https://modrinth.com/resourcepack/classics-dye-tweaks", icon: "modrinth" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Classics-Dye-Tweaks/wiki", icon: "document" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Stable",
              version: "v1.4.0",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", url: "https://modrinth.com/resourcepack/classics-dye-tweaks/version/v1.4.0" }
              ]
            },
            {
              channel: "beta",
              label: "Pre-Release",
              version: "v1.4.0-pre.1",
              mcVersion: "1.21.9 – 26.3-rc-3",
              downloads: [
                { label: "Resource Pack", url: "https://modrinth.com/resourcepack/classics-dye-tweaks/version/v1.4.0-pre.1" }
              ]
            }
          ]
        },
        {
          image: "images/lantern-tweaks.png",
          title: "Classic's Lantern Tweaks",
          description: "Adjusts the edges of Soul & Copper Lanterns so they better match the regular Lantern. Little details matter!",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Classics-Lantern-Tweaks", icon: "github" },
            { label: "Modrinth", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks", icon: "modrinth" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Classics-Lantern-Tweaks/wiki", icon: "document" }
          ],
          channels: [
            {
              channel: "stable",
              label: "Stable",
              version: "v2.4.0",
              mcVersion: "1.21.9 – 26.3",
              downloads: [
                { label: "Resource Pack", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks/version/v2.4.0" }
              ]
            },
            {
              channel: "beta",
              label: "Pre-Release",
              version: "v2.4.0-pre.1",
              mcVersion: "1.21.9 – 26.3-rc-3",
              downloads: [
                { label: "Resource Pack", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks/version/v2.4.0-pre.1" }
              ]
            }
          ]
        }
      ]
    }
  ],

  // Social links shown at the bottom of the page.
  socials: [
    { label: "X", url: "https://x.com/C36Craftworks", icon: "x" },
    { label: "Discord", url: "https://discord.gg/vZJSDjPcmu", icon: "discord" },
    { label: "Reddit", url: "https://www.reddit.com/r/ClassicsCraftworks", icon: "reddit" }
  ],

  footer: {
    copyright: "\u00A9 2023\u20132026 Classic36 / Classic's Craftworks",
    disclaimer: "Not an official Minecraft product or service. Not approved by or associated with Mojang or Microsoft."
  }
};
