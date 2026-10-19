/* Home page statistics, rendered by renderStats() in index.js.
   "{projects}" fills in the number of downloadable projects. */

const STATS_DATA = {

  stats: [
    { icon: "box", label: "Downloadable Projects", value: "{projects}" },
    { icon: "download", label: "Downloads", value: "129,000+" },
    { icon: "clock", label: "Hours of Playtime", value: "500+" }
  ],

  lastUpdated: "October 19, 2026",

  note: "Download stats combine totals from Modrinth and SpigotMC, fetched daily via the Modrinth API and Spiget and rounded down to the nearest thousand. Playtime stats are tracked by Modrinth through the Modrinth App only, and are updated manually."
};
