/* SITE DATA - all site text and links for the CraftHorizon site. This site is a single server, so it has no
   project catalogue (no "sections"); the home page is built from the blocks below instead.

   - Icons: SVGs in core/static/images/icons/, referenced by filename without extension.
   - home.splash.actions: the hero buttons ("primary" or "ghost"; an absolute url opens in a new tab).
   - home.join / home.versions / home.features: the home page blocks, in that order. Text may be a string or an
     array mixing strings with { link, url } / { bold } / { code } pieces. A block left out is not shown.
   - Header pages: an absolute url (https://...) is an external link and opens in a new tab. */

const SITE_DATA = {

  brand: {
    logo: "images/crafthorizon.webp",
    name: "CRAFTHORIZON"
  },

  version: {
    label: "v0.2.0",
    url: "https://github.com/Classics-Craftworks/Website/blob/main/sites/crafthorizon/CHANGELOG.md"
  },

  home: {
    splash: {
      headline: ["CRAFT YOUR", "OWN HORIZON."],
      subtitle: "A whitelisted Minecraft server with a focus on vanilla+ Survival and Creative gameplay.",
      actions: [
        { label: "How to join", url: "#how-to-join", icon: "compass", style: "primary" }
      ]
    },

    features: {
      id: "features",
      heading: "What to expect",
      intro: "Vanilla Minecraft at its core, with some extra content that fits right in.",
      items: [
        { icon: "compass", title: "Enhanced worlds", text: "New biomes and structures to explore, from Stardust Labs and the Dungeons & Taverns creators." },
        { icon: "box", title: "Player shops & economy", text: "Build your wealth by trading, or set up a chest shop." },
        { icon: "wrench", title: "Mechanics & recipes", text: "Quests, duels, Life Grace and extra crafting options that add depth without overwhelming the vanilla feel." },
        { icon: "calendar", title: "Seasons & events", text: "A full calendar of seasonal changes, plus limited-time events with special content and rewards." },
        { icon: "brush", title: "Creative tools", text: "Miniature blocks, player heads, custom paintings and WorldEdit for bigger builds." },
        { icon: "heart", title: "Player-friendly systems", text: "Land claims, homes and teleports, with clear rules and active moderation." }
      ]
    },

    join: {
      id: "how-to-join",
      heading: "How to join",
      intro: "CraftHorizon is whitelisted, so you need to apply before you can play.",
      apply: {
        heading: "Ready to play?",
        text: "The application is short. You can also open a ticket in our Discord server instead.",
        button: { label: "Apply to join", url: "https://dyno.gg/form/7270a72e", icon: "heart" },
        secondary: { label: "Open a ticket on Discord", url: "https://discord.gg/bGsBKqBJXe", icon: "discord" }
      },
      steps: [
        {
          title: "Apply",
          text: [
            "Submit the short application, or open a ticket in our Discord. We only accept people who are part of our creators' communities: ",
            { link: "DanNPDog", url: "https://www.twitch.tv/dannpdog" },
            " and ",
            { link: "MinecraftArchitect90", url: "https://www.twitch.tv/minecraftarchitect90" },
            "."
          ]
        },
        {
          title: "Wait for the whitelist",
          text: "If you haven't been whitelisted within 24 hours, assume your application was rejected. You are welcome to re-apply after 7 days."
        },
        {
          title: "Add the server",
          text: "In Minecraft, go to Multiplayer, then Add Server, and enter the server address below. Bedrock players also enter the port; console players add CraftHorizonMC as an Xbox friend."
        },
        {
          title: "Join and play",
          text: "Select CraftHorizon in your server list and press Join Server."
        }
      ],
      addresses: [
        { label: "Java Edition", value: "mc.classicscraftworks.co.uk" },
        { label: "Bedrock Edition", value: "mc.classicscraftworks.co.uk", port: "19132" }
      ],
      footnote: [
        "mc.dannpdog.co.uk works as an alternative address. Step-by-step guides for Java, Bedrock and consoles are on the ",
        { link: "wiki", url: "https://classicscraftworks.gitbook.io/crafthorizon/getting-started/how-to-join-the-server" },
        "."
      ]
    },

    versions: {
      id: "versions",
      heading: "Supported versions",
      intro: "Join with any of these versions. The recommended ones give the best experience.",
      asOf: "2026-11-09",
      editions: [
        {
          name: "Java Edition",
          icon: "box",
          versions: [
            { label: "26.1 – 26.1.2" },
            { label: "26.2" },
            { label: "26.3", recommended: true }
          ]
        },
        {
          name: "Bedrock Edition",
          icon: "box",
          versions: [
            { label: "26.40 – 26.45" },
            { label: "26.50 – 26.52" },
            { label: "26.60 – 26.63", recommended: true, note: "26.60+" }
          ]
        }
      ],
      footnote: [
        "Bedrock Edition has some ",
        { link: "limitations", url: "https://classicscraftworks.gitbook.io/crafthorizon/extra-documentation/bedrock-edition-limitations" },
        " compared with Java."
      ]
    },
  },

  // Header pages. Home ("/"), News, About and Settings are pages of this site; an entry with an absolute
  // url (the wiki) links out.
  pages: [
    { label: "Home", url: "/", icon: "home" },
    { label: "News", url: "news", icon: "news" },
    { label: "Rules", url: "https://classicscraftworks.gitbook.io/crafthorizon/getting-started/server-rules", icon: "document" },
    { label: "Wiki", url: "https://classicscraftworks.gitbook.io/crafthorizon", icon: "book" },
    { label: "About", url: "about", icon: "about" },
    { label: "Settings", url: "settings", icon: "settings" }
  ],

  // About page blocks, in order: "paragraph" | { heading } | { list: [] } |
  // { quote } | { divider: true }. Text may be an array mixing strings with
  // { link, url } / { bold } / { italic } / { code } pieces.
  about: {
    heading: "About",
    content: [
      "CraftHorizon is a whitelisted Minecraft server, with a focus on vanilla+ Survival and Creative gameplay.",
      [
        "Everything about the server is kept in a few places: the ",
        { link: "wiki", url: "https://classicscraftworks.gitbook.io/crafthorizon" },
        ", the ",
        { link: "Trello board", url: "https://trello.com/b/TK7pofcG/crafthorizon" },
        " and the server's ",
        { link: "Modrinth page", url: "https://modrinth.com/server/crafthorizon" },
        "."
      ],
      [
        "CraftHorizon is a project of ",
        { link: "Classic's Craftworks", url: "https://classicscraftworks.co.uk" },
        ", a workshop for Minecraft ideas."
      ]
    ]
  },

  socials: [
    { label: "X / Twitter", url: "https://x.com/CraftHorizonMC", icon: "x" },
    { label: "YouTube", url: "https://youtube.com/@CraftHorizonMC", icon: "newtab" },
    { label: "Twitch", url: "https://twitch.tv/CraftHorizonMC", icon: "newtab" },
    { label: "Instagram", url: "https://instagram.com/CraftHorizonMC", icon: "newtab" },
    { label: "Modrinth", url: "https://modrinth.com/server/crafthorizon", icon: "modrinth" },
    { label: "Trello", url: "https://trello.com/b/TK7pofcG/crafthorizon", icon: "document" },
    { label: "Classic's Craftworks", url: "https://classicscraftworks.co.uk", icon: "newtab" },
    { label: "DanNPDog Studios", url: "https://dannpdog.co.uk", icon: "newtab" }
  ],

  footer: {
    copyright: "© 2025–2026 CraftHorizon",
    disclaimer: "NOT AN OFFICIAL MINECRAFT PRODUCT OR SERVICE. NOT APPROVED BY OR ASSOCIATED WITH MOJANG OR MICROSOFT.",
    iconCredits: { prefix: "Icons provided by ", label: "SVG Repo", url: "https://www.svgrepo.com" }
  }
};
