/* Home page statistics, rendered by renderStats() in index.js.
   "{projects}" fills in the number of downloadable projects. */

const STATS_DATA = {

  stats: [
    { icon: "box", label: "Downloadable Projects", value: "{projects}" },
    { icon: "download", label: "Downloads", value: "130,000+" },
    { icon: "clock", label: "Hours of Playtime", value: "500+" }
  ],

  lastUpdated: "October 21, 2026",

  note: "Download stats combine totals from Modrinth and SpigotMC, fetched daily from Modrinth and Spiget and rounded down to the nearest 1000. Playtime stats are tracked by Modrinth via the Modrinth App, and are updated manually."
};
