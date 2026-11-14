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
    label: "v0.2.0",
    url: "/changelog"
  },

  home: {
    splash: {
      headline: [" ", "CLASSIC36"],
      subtitle: "some guy on da internet",
      actions: [
        { label: "Social Profiles", url: "#social-media-profiles", style: "primary" },
        { label: "Games I Play", url: "games", style: "ghost" }
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
      id: "social-media-profiles",
      heading: "Social Media Profiles",
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
      id: "other-profiles",
      heading: "Other profiles",
      items: [
        { badge: "MR", label: "Modrinth", text: "Classic", url: "https://modrinth.com/user/Classic" },
        { badge: "SP", label: "SpigotMC", text: "Classic", url: "https://www.spigotmc.org/members/classic.99929/" },
        { badge: "GH", label: "GitHub", text: "Classsic36", url: "https://github.com/Classsic36" },
        { badge: "NM", label: "NameMC", text: "Classic36", url: "https://namemc.com/profile/Classic36.1" },
        { badge: "WT", label: "World of Trucks", text: "Classic36", url: "https://www.worldoftrucks.com/en/profile/2073439" }
      ]
    }
  },

  // Minecraft skin history
  skins: {
    heading: "Minecraft Skin History",
    intro: "Every Minecraft skin I have used.",
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

  // Content pages (slug -> page). `type`: skins | image | gallery | games. Format: core/features/profile/pages.js.
  // Everything on these pages is sample content until the real skins, lists and images are added.
  content: {
    "fortnite-skin-history": {
      type: "skins",
      heading: "Fortnite Skin History",
      intro: "The skins I have used as my main in Fortnite.",
      items: [
        { name: "Hush", current: true, dates: "Current main (sample)", image: "images/fortnite/skin-01.webp", note: "Placeholder entry." },
        { name: "Skin 04", dates: "Sample dates", image: "images/fortnite/skin-04.png", note: "Placeholder entry." },
        { name: "Skin 03", dates: "Sample dates", image: "images/fortnite/skin-03.png", note: "Placeholder entry." },
        { name: "Skin 02", dates: "Sample dates", image: "images/fortnite/skin-02.png", note: "Placeholder entry." }
      ]
    },

    "fortnite-season-tier-list": {
      type: "image",
      heading: "Fortnite season tier list",
      intro: "Every season of Fortnite, ranked. Last updated for Chapter 7 Season 4.",
      image: "images/fortnite/season-tier-list.png",
      alt: "Tier list ranking for every Fortnite season.",
      caption: "Click the image to open in full size."
    },

    "fortnite-skin-tier-lists": {
      type: "gallery",
      heading: "Fortnite Skin Tier Lists",
      intro: "Every Fortnite skin, ranked by season. Last updated for Chapter 7 Season 4.",
      groups: [
        {
          heading: "Chapter 7",
          items: [
            { label: "Chapter 7 Season 4", image: "images/fortnite/skin-tier-c7s4.png", alt: "Skin tier list for Chapter 7 Season 4" },
            { label: "Chapter 7 Season 3", image: "images/fortnite/skin-tier-c7s3.png", alt: "Skin tier list for Chapter 7 Season 3" },
            { label: "Chapter 7 Season 2", image: "images/fortnite/skin-tier-c7s2.png", alt: "Skin tier list for Chapter 7 Season 2" },
            { label: "Chapter 7 Season 1", image: "images/fortnite/skin-tier-c7s1.png", alt: "Skin tier list for Chapter 7 Season 1" }
          ]
        },
        {
          heading: "Chapter 6",
          items: [
            { label: "Chapter 6 Mini Season 2", image: "images/fortnite/skin-tier-c6ms2.png", alt: "Skin tier list for Chapter 6 Mini Season 2" },
            { label: "Chapter 6 Season 4", image: "images/fortnite/skin-tier-c6s4.png", alt: "Skin tier list for Chapter 6 Season 4" },
            { label: "Chapter 6 Season 3", image: "images/fortnite/skin-tier-c6s3.png", alt: "Skin tier list for Chapter 6 Season 3" },
            { label: "Chapter 6 Mini Season 1", image: "images/fortnite/skin-tier-c6ms1.png", alt: "Skin tier list for Chapter 6 Mini Season 1" },
            { label: "Chapter 6 Season 2", image: "images/fortnite/skin-tier-c6s2.png", alt: "Skin tier list for Chapter 6 Season 2" },
            { label: "Chapter 6 Season 1", image: "images/fortnite/skin-tier-c6s1.png", alt: "Skin tier list for Chapter 6 Season 1" }
          ]
        },
        {
          heading: "Chapter 5",
          items: [
            { label: "Chapter 2 Remix", image: "images/fortnite/skin-tier-c5sRemix.png", alt: "Skin tier list for Chapter 2 Remix" },
            { label: "Chapter 5 Season 4", image: "images/fortnite/skin-tier-c5s4.png", alt: "Skin tier list for Chapter 5 Season 4" },
            { label: "Chapter 5 Season 3", image: "images/fortnite/skin-tier-c5s3.png", alt: "Skin tier list for Chapter 5 Season 3" },
            { label: "Chapter 5 Season 2", image: "images/fortnite/skin-tier-c5s2.png", alt: "Skin tier list for Chapter 5 Season 2" },
            { label: "Chapter 5 Season 1", image: "images/fortnite/skin-tier-c5s1.png", alt: "Skin tier list for Chapter 5 Season 1" }
          ]
        },
        {
          heading: "Chapter 4",
          items: [
            { label: "Chapter 4 Season OG", image: "images/fortnite/skin-tier-c4sOG.png", alt: "Skin tier list for Chapter 4 Season OG" },
            { label: "Chapter 4 Season 4", image: "images/fortnite/skin-tier-c4s4.png", alt: "Skin tier list for Chapter 4 Season 4" },
            { label: "Chapter 4 Season 3", image: "images/fortnite/skin-tier-c4s3.png", alt: "Skin tier list for Chapter 4 Season 3" },
            { label: "Chapter 4 Season 2", image: "images/fortnite/skin-tier-c4s2.png", alt: "Skin tier list for Chapter 4 Season 2" },
            { label: "Chapter 4 Season 1", image: "images/fortnite/skin-tier-c4s1.png", alt: "Skin tier list for Chapter 4 Season 1" }
          ]
        },
        {
          heading: "Chapter 3",
          items: [
            { label: "Chapter 3 Season 4", image: "images/fortnite/skin-tier-c3s4.png", alt: "Skin tier list for Chapter 3 Season 4" },
            { label: "Chapter 3 Season 3", image: "images/fortnite/skin-tier-c3s3.png", alt: "Skin tier list for Chapter 3 Season 3" },
            { label: "Chapter 3 Season 2", image: "images/fortnite/skin-tier-c3s2.png", alt: "Skin tier list for Chapter 3 Season 2" },
            { label: "Chapter 3 Season 1", image: "images/fortnite/skin-tier-c3s1.png", alt: "Skin tier list for Chapter 3 Season 1" }
          ]
        },
        {
          heading: "Chapter 2",
          items: [
            { label: "Chapter 2 Season 8", image: "images/fortnite/skin-tier-c2s8.png", alt: "Skin tier list for Chapter 2 Season 8" },
            { label: "Chapter 2 Season 7", image: "images/fortnite/skin-tier-c2s7.png", alt: "Skin tier list for Chapter 2 Season 7" },
            { label: "Chapter 2 Season 6", image: "images/fortnite/skin-tier-c2s6.png", alt: "Skin tier list for Chapter 2 Season 6" },
            { label: "Chapter 2 Season 5", image: "images/fortnite/skin-tier-c2s5.png", alt: "Skin tier list for Chapter 2 Season 5" },
            { label: "Chapter 2 Season 4", image: "images/fortnite/skin-tier-c2s4.png", alt: "Skin tier list for Chapter 2 Season 4" },
            { label: "Chapter 2 Season 3", image: "images/fortnite/skin-tier-c2s3.png", alt: "Skin tier list for Chapter 2 Season 3" },
            { label: "Chapter 2 Season 2", image: "images/fortnite/skin-tier-c2s2.png", alt: "Skin tier list for Chapter 2 Season 2" },
            { label: "Chapter 2 Season 1", image: "images/fortnite/skin-tier-c2s1.png", alt: "Skin tier list for Chapter 2 Season 1" }
          ]
        },
        {
          heading: "Chapter 1",
          items: [
            { label: "Season X", image: "images/fortnite/skin-tier-c1sx.png", alt: "Skin tier list for Chapter 1 Season X" },
            { label: "Season 9", image: "images/fortnite/skin-tier-c1s9.png", alt: "Skin tier list for Chapter 1 Season 9" },
            { label: "Season 8", image: "images/fortnite/skin-tier-c1s8.png", alt: "Skin tier list for Chapter 1 Season 8" },
            { label: "Season 7", image: "images/fortnite/skin-tier-c1s7.png", alt: "Skin tier list for Chapter 1 Season 7" },
            { label: "Season 6", image: "images/fortnite/skin-tier-c1s6.png", alt: "Skin tier list for Chapter 1 Season 6" },
            { label: "Season 5", image: "images/fortnite/skin-tier-c1s5.png", alt: "Skin tier list for Chapter 1 Season 5" },
            { label: "Season 4", image: "images/fortnite/skin-tier-c1s4.png", alt: "Skin tier list for Chapter 1 Season 4" },
            { label: "Season 3", image: "images/fortnite/skin-tier-c1s3.png", alt: "Skin tier list for Chapter 1 Season 3" },
            { label: "Season 2", image: "images/fortnite/skin-tier-c1s2.png", alt: "Skin tier list for Chapter 1 Season 2" },
            { label: "Season 1", image: "images/fortnite/skin-tier-c1s1.png", alt: "Skin tier list for Chapter 1 Season 1" }
          ]
        }
      ]
    },

    "games": {
      type: "games",
      heading: "Games",
      intro: "The other games I play or have played.",
      items: [
        { name: "Minecraft", years: "2013-Present", status: "Playing now", note: "Where most of this site started: Classic's Craftworks, CraftHorizon and the skin history.", image: "images/skins/skin-05.png", pixel: true },
        { name: "Fortnite", years: "2018-Present", status: "Playing now", note: "Skin history and tier lists are on their own pages.", image: "images/Classic36FN_Hush.webp" },
        { name: "Euro Truck Simulator 2", years: "Sample years", status: "Playing now", note: "Placeholder entry.", badge: "ETS2" },
        { name: "American Truck Simulator", years: "Sample years", status: "Playing now", note: "Placeholder entry.", badge: "ATS" },
        { name: "Forza Horizon 3", years: "Sample years", status: "Played", note: "Placeholder entry.", badge: "FH3" },
        { name: "Forza Horizon 4", years: "Sample years", status: "Played", note: "Placeholder entry.", badge: "FH4" },
        { name: "Forza Horizon 5", years: "Sample years", status: "Played", note: "Placeholder entry.", badge: "FH5" },
        { name: "Forza Horizon 6", years: "Sample years", status: "Playing now", note: "Placeholder entry.", badge: "FH6" },
        { name: "Burnout Paradise", years: "Sample years", status: "Played", note: "Placeholder entry.", badge: "BP" },
        { name: "Club Penguin", years: "2010-2015", status: "Played", note: "Placeholder entry.", badge: "CP" },
        { name: "Bin Weevils", years: "2009-2013", status: "Played", note: "Placeholder entry.", badge: "BW" },
      ]
    }
  },

  // Header pages, in this order. An entry with `children` is a dropdown; external links open in a new tab.
  pages: [
    { label: "Home", url: "/", icon: "home" },
    {
      label: "Minecraft",
      children: [
        { label: "Classic's Craftworks", url: "https://classicscraftworks.co.uk", icon: "box" },
        { label: "Skin History", url: "skin-history", icon: "history" }
      ]
    },
    {
      label: "Fortnite",
      children: [
        { label: "Skin History", url: "fortnite-skin-history", icon: "history" },
        { label: "Season Tier List", url: "fortnite-season-tier-list", icon: "document" },
        { label: "Skin Tier Lists", url: "fortnite-skin-tier-lists", icon: "document" }
      ]
    },
    {
      label: "Other Games",
      children: [
        { label: "Games List", url: "games", icon: "box" }
      ]
    },
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
