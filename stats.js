/* ============================================================
   HOME PAGE STATS

   Feeds the "Statistics" stats section on the home page (the
   three boxes above the footer, plus the "last updated" line and the
   note underneath them). Loaded before index.js, which reads
   STATS_DATA and builds the section — see renderStats() there.
   ============================================================ */

const STATS_DATA = {

  stats: [
    { icon: "box", label: "Projects", value: "8" },
    { icon: "download", label: "Downloads", value: "114,000+" },
    { icon: "clock", label: "Hours of Playtime", value: "427+" }
  ],

  lastUpdated: "Sept 26, 2026",

  note: "Download and playtime stats are tracked by Modrinth, and don't include downloads from SpigotMC or other sources."
};
