/* Home page statistics, rendered by renderStats() in index.js.
   "{projects}" fills in the number of downloadable projects. */

const STATS_DATA = {

  stats: [
    { icon: "box", label: "Servers", value: "3",
      tooltip: "Servers on the network: Hub, Survival, Creative" },
    { icon: "heart", label: "Unique Players", value: "10+",
      tooltip: "Number of unique accounts that have logged into the server at least once." },
    { icon: "clock", label: "Hours Played", value: "135+",
      tooltip: "Playtime stats are tracked since Oct 15, 2026 via the EssentialsX plugin for the Survival S2 server only." },
    { icon: "modrinth", label: "Modrinth Followers", value: "2",
      tooltip: "Number of users who follow our Modrinth page. Updated manually." }
  ],

  lastUpdated: "2026-11-12"
};