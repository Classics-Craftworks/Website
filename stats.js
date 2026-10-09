/* Home page statistics, rendered by renderStats() in index.js.
   "{projects}" fills in the number of downloadable projects. */

const STATS_DATA = {

  stats: [
    { icon: "box", label: "Downloadable Projects", value: "{projects}" },
    { icon: "download", label: "Downloads", value: "121,000+" },
    { icon: "clock", label: "Hours of Playtime", value: "470+" }
  ],

  lastUpdated: "October 9, 2026",

  note: "Download stats combine totals from Modrinth and SpigotMC. Playtime stats are tracked by Modrinth via the Modrinth App only."
};
