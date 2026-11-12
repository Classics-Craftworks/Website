/* Home page statistics, rendered by renderStats() in index.js.
   "{projects}" fills in the number of downloadable projects. */

const STATS_DATA = {

  stats: [
    { icon: "box", label: "Servers", value: "3",
      tooltip: "Servers on the network: Hub, Survival, Creative" },
    { icon: "heart", label: "Unique Players", value: "15+",
      tooltip: "Number of unique accounts that have logged into the server at least once." },
    { icon: "clock", label: "Hours Played", value: "10+",
      tooltip: "Playtime stats are tracked via the EssentialsX plugin for the Survival server only." }
  ],

  lastUpdated: "2026-11-12"
};