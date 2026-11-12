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
    news: { label: "News", color: "#B78CF5" }
  },

  entries: [
    {
      date: "2026-11-12",
      title: "CraftHorizon has a website",
      text: "News and updates about the server will be posted here.",
      tags: ["news"],
      image: "images/crafthorizon.webp"
    }
  ]
};
