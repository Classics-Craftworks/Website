/*
  ============================================================
   CLASSIC'S CRAFTWORKS — SITE CONTENT
  ============================================================
  This is the ONLY file you need to edit to change text, links,
  or images on the site. The page structure lives in index.html
  and reads everything from the SITE_DATA object below.

  HOW TO EDIT
  - Text: change the words inside the quotes "like this".
  - Links: change the URL inside the quotes after "url:".
  - Images: put your image file in the /images folder, then
    change the path after "image:" to match its filename,
    e.g. image: "images/my-screenshot.png"
  - Adding a project: copy an existing {...} block inside a
    section's "projects" array (including the commas) and edit it.
  - Removing a project: delete its whole {...} block.
  - Each project's "tag" is a small label badge (shown next to its
    title) — set to whatever text you like, e.g. a version number
    or category.
  - Adding a download/link button: copy a line inside "links"
    or "downloads" and edit it.
  - Don't delete commas between items or quote marks around text,
    or the page will stop working. When in doubt, copy an
    existing line and only change the words inside the quotes.
  ============================================================
*/

const SITE_DATA = {

  // Browser tab title, search-engine description, and the image
  // shown when this page is shared as a link (e.g. on Discord).
  meta: {
    title: "Classic's Craftworks",
    description: "Minecraft Java Edition data packs, mods & resource packs by Classic's Craftworks.",
    shareImage: "images/hero-banner.png",
    url: "https://modrinth.com/organization/classics-craftworks"
  },

  // Logo, name and one-line tagline shown at the top of the page.
  // heroImage is the wide banner shown above everything else — set to
  // "" (empty string) to hide it and show just the logo + name instead.
  brand: {
    heroImage: "",
    logo: "images/logo.png",
    name: "Classic's Craftworks",
    tagline: "Minecraft Java Edition data packs, mods & resource packs"
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
          tag: "26.1 - 26.2",
          description: "Adds some quality-of-life crafting and smelting recipes to the game.",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Better-Craftables", icon: "github" },
            { label: "SpigotMC", url: "https://www.spigotmc.org/resources/better-craftables.108728/", icon: "spigot" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Better-Craftables/wiki", icon: "document" }
          ],
          downloads: [
            { label: "Data Pack (v7.4.0)", url: "https://modrinth.com/datapack/better-craftables/version/v7.4.0" },
            { label: "Mod (v7.4.0)", url: "https://modrinth.com/datapack/better-craftables/version/v7.4.0+mod" },
            { label: "Data Pack Beta (v8.0.0-rc.1)", url: "https://modrinth.com/datapack/better-craftables/version/v8.0.0-rc.1" }
          ]
        },
        {
          image: "images/better-unpackables.png",
          title: "Better Unpackables",
          tag: "26.1 - 26.2",
          description: "Adds some quality-of-life unpacking recipes to the game.",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Better-Unpackables", icon: "github" },
            { label: "SpigotMC", url: "https://www.spigotmc.org/resources/better-unpackables.120335/", icon: "spigot" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Better-Unpackables/wiki", icon: "document" }
          ],
          downloads: [
            { label: "Data Pack (v4.2.0)", url: "https://modrinth.com/datapack/better-unpackables/version/v4.2.0" },
            { label: "Mod (v4.2.0)", url: "https://modrinth.com/datapack/better-unpackables/version/v4.2.0+mod" },
            { label: "Data Pack Beta (v5.0.0-rc.1)", url: "https://modrinth.com/datapack/better-unpackables/version/v5.0.0-rc.1" }
          ]
        },
        {
          image: "images/silly-eatables.png",
          title: "Silly Eatables",
          tag: "26.1 - 26.2",
          description: "Eat things you shouldn't with these silly food recipes!",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Silly-Eatables", icon: "github" },
            { label: "SpigotMC", url: "https://www.spigotmc.org/resources/silly-eatables.116362/", icon: "spigot" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Silly-Eatables/wiki", icon: "document" }
          ],
          downloads: [
            { label: "Data Pack (v4.3.0)", url: "https://modrinth.com/datapack/silly-eatables/version/v4.3.0" },
            { label: "Mod (v4.3.0)", url: "https://modrinth.com/datapack/silly-eatables/version/v4.3.0+mod" },
            { label: "Data Pack Beta (v5.0.0-rc.1)", url: "https://modrinth.com/datapack/silly-eatables/version/v5.0.0-rc.1" }
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
          tag: "1.21.9 - 26.3",
          description: "Subtly widens music discs and unifies their design for a more cohesive look.",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Classics-Disc-Tweaks", icon: "github" },
            { label: "Modrinth", url: "https://modrinth.com/resourcepack/classics-disc-tweaks", icon: "modrinth" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Classics-Disc-Tweaks/wiki", icon: "document" }
          ],
          downloads: [
            { label: "Latest Release (v3.4.0)", url: "https://modrinth.com/resourcepack/classics-disc-tweaks/version/v3.4.0" },
            { label: "Latest Beta (v3.4.0-pre.1)", url: "https://modrinth.com/resourcepack/classics-disc-tweaks/version/v3.4.0-pre.1" }
          ]
        },
        {
          image: "images/dye-tweaks.png",
          title: "Classic's Dye Tweaks",
          tag: "1.21.9 - 26.3",
          description: "Tweaks Minecraft's new dye textures and brings them to older versions of the game!",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Classics-Dye-Tweaks", icon: "github" },
            { label: "Modrinth", url: "https://modrinth.com/resourcepack/classics-dye-tweaks", icon: "modrinth" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Classics-Dye-Tweaks/wiki", icon: "document" }
          ],
          downloads: [
            { label: "Latest Release (v1.4.0)", url: "https://modrinth.com/resourcepack/classics-dye-tweaks/version/v1.4.0" },
            { label: "Latest Beta (v1.4.0-pre.1)", url: "https://modrinth.com/resourcepack/classics-dye-tweaks/version/v1.4.0-pre.1" }
          ]
        },
        {
          image: "images/lantern-tweaks.png",
          title: "Classic's Lantern Tweaks",
          tag: "1.21.9 - 26.3",
          description: "Adjusts the edges of Soul & Copper Lanterns so they better match the regular Lantern. Little details matter!",
          links: [
            { label: "GitHub", url: "https://github.com/Classics-Craftworks/Classics-Lantern-Tweaks", icon: "github" },
            { label: "Modrinth", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks", icon: "modrinth" },
            { label: "Wiki", url: "https://github.com/Classics-Craftworks/Classics-Lantern-Tweaks/wiki", icon: "document" }
          ],
          downloads: [
            { label: "Latest Release (v2.4.0)", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks/version/v2.4.0" },
            { label: "Latest Beta (v2.4.0-pre.1)", url: "https://modrinth.com/resourcepack/classics-lantern-tweaks/version/v2.4.0-pre.1" }
          ]
        }
      ]
    }
  ],

  // Social links shown at the bottom of the page.
  socials: [
    { label: "X", url: "https://x.com/C36Craftworks", icon: "x" },
    { label: "Discord", url: "https://discord.gg/vZJSDjPcmu", icon: "discord" },
    { label: "Reddit", url: "https://www.reddit.com/r/ClassicsCraftworks/", icon: "reddit" }
  ],

  footer: {
    copyright: "\u00A9 2023\u20132026 Classic36 / Classic's Craftworks",
    disclaimer: "Not an official Minecraft product or service. Not approved by or associated with Mojang or Microsoft."
  }
};
