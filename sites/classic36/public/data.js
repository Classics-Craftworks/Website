/* SITE DATA - all site text and links for the Classic36 personal site.

   !! Handles, badges and dates marked "sample" are placeholders until the real ones are filled in. !!

   - home.splash: the hero. skinCard is the "Current skin" card beside it (8x8 head picture in images/skins/).
   - home.socials / related / explore: the home blocks, in that order. Each item's `badge` is the short code
     shown in its square; absolute urls open in a new tab.
   - skins.items: Skin history, newest first. Mark the one in use with current: true, and keep it in step with
     home.splash.skinCard and footer.profileCredit.
   - Header pages are shown in the order listed. */

const SITE_DATA = {

  brand: {
    logo: "images/Classic36_Vader.webp",
    name: "CLASSIC36"
  },

  version: {
    label: "v0.1.0",
    url: "/changelog"
  },

  home: {
    splash: {
      eyebrow: "Personal site",
      headline: ["CLASSIC36", "ONLINE."],
      subtitle: "You used to call me on my cell phone",
      actions: [
        { label: "Find me online", url: "#find-me-online", style: "primary" },
        { label: "Skin history", url: "skin-history", style: "ghost" }
      ],
      skinCard: {
        heading: "Current skin",
        badge: "Skin 05",
        image: "images/skins/skin-05.png",
        imageAlt: "Head of the current Classic36 skin",
        text: "Placeholder render. Swap in the real skin.",
        button: { label: "View all", url: "skin-history", style: "ghost" }
      }
    },

    socials: {
      id: "find-me-online",
      heading: "Find me online",
      intro: "Social media. Handles are samples until the real ones are filled in.",
      items: [
        { badge: "X",  label: "Main Twitter", handle: "@Classsic36", url: "https://x.com/Classsic36" },
        { badge: "X",  label: "Games Twitter", handle: "@Classsic35", url: "https://x.com/Classsic35" },
        { badge: "X",  label: "Fortnite Twitter", handle: "@Classic36FN", url: "https://x.com/Classic36FN" },
        { badge: "X",  label: "Truck Sim Twitter", handle: "@Classsic37", url: "https://x.com/Classsic37" },
        { badge: "YT", label: "Main YouTube", handle: "@Classic36", url: "https://youtube.com/@Classic36" },
        { badge: "YT", label: "Gameplay YouTube", handle: "@Classic35", url: "https://youtube.com/@Classic35" },
        { badge: "TV", label: "Twitch", handle: "Classsic36",  url: "https://twitch.tv/Classsic36" },
        { badge: "RD", label: "Reddit", handle: "u/Classic36", url: "https://reddit.com/user/Classic36" }
      ]
    },

    related: {
      id: "related-profiles",
      heading: "Related profiles",
      intro: "Projects and profiles that belong with this site.",
      items: [
        { badge: "MR", label: "Modrinth", text: "Classic", url: "https://modrinth.com/user/Classic" },
        { badge: "SP", label: "SpigotMC", text: "Classic", url: "https://www.spigotmc.org/members/classic.99929/" },
        { badge: "GH", label: "GitHub", text: "Classsic36", url: "https://github.com/Classsic36" },
        { badge: "NM", label: "NameMC", text: "namemc.com", url: "https://namemc.com" },
      ]
    }
  },

  // Skin history, newest first. Dates are samples.
  skins: {
    heading: "Skin history",
    intro: "Every Minecraft skin I have used, newest first. The pictures and dates are placeholders until the real skins are added.",
    items: [
      { number: 5, current: true, dates: "Nov 2026 – present (sample)", image: "images/skins/skin-05.png", note: "The current skin: dark hair, red eyes." },
      { number: 4, dates: "2025 – 2026 (sample)", image: "images/skins/skin-04.png", note: "Placeholder entry." },
      { number: 3, dates: "2024 – 2025 (sample)", image: "images/skins/skin-03.png", note: "Placeholder entry." },
      { number: 2, dates: "2023 – 2024 (sample)", image: "images/skins/skin-02.png", note: "Placeholder entry." },
      { number: 1, dates: "Before 2023 (sample)", image: "images/skins/skin-01.png", note: "Placeholder entry. The first one." }
    ]
  },

  extras: {
    heading: "Extras",
    intro: "Smaller pages that get added over time.",
    items: [
      { label: "Skin history", text: "Every skin I have used, newest first.", url: "skin-history" },
    ]
  },

  // Header pages, in this order.
  pages: [
    { label: "Home", url: "/", icon: "home" },
    { label: "Skin history", url: "skin-history", icon: "history" },
    { label: "Extras", url: "extras", icon: "box" },
    { label: "Settings", url: "settings", icon: "settings" }
  ],

  socials: [
    { label: "X / Twitter", url: "https://x.com/Classsic36", icon: "x" },
    { label: "YouTube", url: "https://youtube.com/@Classic36", icon: "newtab" },
    { label: "Classic's Craftworks", url: "https://classicscraftworks.co.uk", icon: "newtab" },
  ],

  footer: {
    copyright: "© 2013-2026 Classic36",
    disclaimer: "NOT AN OFFICIAL MINECRAFT PRODUCT OR SERVICE. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT. NOT AFFILIATED WITH OR ENDORSED BY ANY OTHER GAME OR GAME PUBLISHER MENTIONED.",
    trademarks: [
      "Minecraft is a trademark of Mojang AB.",
      "Fortnite is a trademark of Epic Games, Inc."
    ],
    profileCredit: { prefix: "Profile pictures by ", label: "onslaughtiscool", url: "https://x.com/onslaughtiscool" },
    iconCredits: { prefix: "Icons provided by ", label: "SVG Repo", url: "https://www.svgrepo.com" }
  }
};
