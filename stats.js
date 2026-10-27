/* Home page statistics, rendered by renderStats() in index.js.
   "{projects}" fills in the number of downloadable projects. */

const STATS_DATA = {

  stats: [
    { icon: "box", label: "Projects", value: "{projects}",
      tooltip: "Downloadable projects only, so excludes CraftHorizon and the website." },
    { icon: "download", label: "Downloads", value: "132,000+",
      tooltip: "Download stats combine totals from Modrinth and SpigotMC, fetched daily from the Modrinth API and Spiget before being rounded down to the nearest 1000." },
    { icon: "clock", label: "Hours Played", value: "520+",
      tooltip: "Playtime stats are tracked by Modrinth via the Modrinth App only, and are updated manually." }
  ],

  lastUpdated: "October 27, 2026"
};
