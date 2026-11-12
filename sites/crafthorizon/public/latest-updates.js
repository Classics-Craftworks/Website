/* LATEST UPDATES - the news feed (home page preview and News page), rendered by news.js.
   The format is documented at the top of sites/classics-craftworks/public/latest-updates.js. */

const LATEST_UPDATES = {
  heading: "News",
  homeHeading: "Latest News",
  intro: "The latest news and updates from CraftHorizon.",
  homeCount: 3,

  sidebar: {
    searchPlaceholder: "Search news…",
    filterHeading: "Filters",

    cards: [
      {
        heading: "Find out more",
        text: "The wiki and the Trello board have the details on the server.",
        button: { label: "Read the wiki", url: "https://classicscraftworks.gitbook.io/crafthorizon", icon: "book" },
        button2: { label: "Trello board", url: "https://trello.com/b/TK7pofcG/crafthorizon", icon: "document" },
        secondary: [
          { label: "Modrinth", url: "https://modrinth.com/server/crafthorizon", icon: "modrinth" }
        ]
      }
    ]
  },

  tags: {
    news: { label: "News", color: "#B78CF5" },
    content: { label: "Content Update", color: "#d88fdc" },
    event: { label: "Hotfix", color: "#d88fdc" },
    teaser: { label: "Teaser", color: "#d88fdc" },
    patch: { label: "Patch", color: "#c2b6d2" },
    hotfix: { label: "Hotfix", color: "#c2b6d2" },
    survival: { label: "Survival", color: "#b4b2b7" },
    creative: { label: "Creative", color: "#b4b2b7" },
    hub: { label: "Hub", color: "#b4b2b7" },
  },

  entries: [
    {
      pinned: true,
      date: "2026-11-10",
      title: "Survival S2: It's Getting Hotter",
      text: "It's almost time to step beyond the Overworld. The next chapter takes us somewhere... hotter.",
      tags: ["teaser", "survival"],
      url: "https://youtu.be/wzdSlwiWpFo",
      linkText: "View teaser trailer"
    },
    {
      date: "2026-11-03",
      title: "Survival S2: Things are heating up...",
      text: "You've explored the Overworld. You've built your homes. You've begun your journey. And the world border expanded for the first time. But something is stirring beneath it all. Can you feel it?",
      tags: ["teaser", "survival"],
    },
    {
      date: "2026-11-02",
      title: "Wilderness Bound - Out Now!",
      text: "The latest Minecraft update, Wilderness Bound, is finally available on CraftHorizon! It's time to take on the great outdoors!",
      tags: ["content", "survival", "creative"],
      url: "https://trello.com/c/QOOQuaTS/1043-v2130-patch-notes",
      linkText: "View patch notes"
    },
    {
      date: "2026-10-29",
      title: "The Harvester Hits Harder - Rebalancing Update",
      text: "The fields called, and you answered. Now they call again. The Harvester has been rebalanced! Check the patch notes for the full details.",
      tags: ["patch", "survival"],
      url: "https://trello.com/c/fwRpXE7F/1036-v2129-patch-notes",
      linkText: "View patch notes"
    },
    {
      date: "2026-10-28",
      title: "Wilderness Bound - Coming Soon",
      text: "Our expedition into the dappled forest is about to set off! Get ready to take on the great outdoors in Wilderness Bound, coming to CraftHorizon on 2 November 2026!",
      tags: ["teaser", "survival", "creative"],
    },
    {
      date: "2026-10-22",
      title: "Beware the Harvester - Out Now!",
      text: "The Harvester has arrived in CraftHorizon Survival! Are you ready to take on this terrifying new boss? There are plenty of new treasures to discover around the world too. The fields are calling...",
      tags: ["content", "survival"],
      url: "https://trello.com/c/2PKe7HYR/1020-v2120-patch-notes",
      linkText: "View patch notes"
    },
    {
      date: "2026-10-19",
      title: "Beware the Harvester - Coming Soon",
      text: "Last year, something sinister lurked in the shadows... and this Halloween, it's lurking in the wheat fields. The Harvester arrives in CraftHorizon Survival on 22 October 2026!",
      tags: ["teaser", "survival"],
    },
    {
      date: "2026-10-15",
      title: "Survival Season 2: Act I - Out Now!",
      text: "The old world is behind us, and a new one lies ahead. Grab your friends, find your place in a new world and build your horizon. A new chapter begins. Welcome to CraftHorizon Survival Season 2!",
      tags: ["content", "survival"],
    }
  ]
};
