/* Visitor settings: storage, defaults and the helpers the rest of the site reads them through.

   Loaded synchronously in <head> (after js-flag.js) so the saved look is on <html> before first paint. The
   Settings page itself is settings-page.js. Everything lives in one localStorage key as JSON; anything missing,
   unreadable or unknown falls back to its default.

   Attributes set on <html> (styles.css keys off these):
     data-theme          dark | light | oled   ("auto" is resolved to light or dark here)
     data-accent         purple | magenta | pink | ... | auto   (absent = blue; auto = the seasonal theme's colour)
     data-contrast       high                  (absent = normal)
     data-motion         reduce                (absent = full motion)
     data-heading-font   plain                 (absent = pixel font)
     data-text-size      small | large         (absent = default size)
     data-density        compact               (absent = comfortable spacing)
     data-sidebar        left                  (absent = side panels on the right)
     data-newtab         off                   (absent = external links open in a new tab)
     data-season         a key of SEASONS below (absent = no seasonal theme; drawn by seasonal.js)

   High contrast and reduced motion follow the device setting until the visitor changes them
   (stored as null = "follow the device"). */

const SETTINGS_KEY = 'settings';
const SETTINGS_EVENT = 'ccw:settings'; // fired on document after every change; detail = settings

const SETTING_CHOICES = {
  theme: ['auto', 'dark', 'oled', 'light'],
  // auto = a colour made to suit the active seasonal theme (styles.css), blue when none is active.
  accent: ['auto', 'red', 'orange', 'gold', 'green', 'teal', 'blue', 'purple', 'magenta', 'pink'],
  dateFormat: ['system', 'text', 'us-text', 'dmy', 'mdy', 'iso'],
  headingFont: ['pixel', 'plain'],
  textSize: ['small', 'default', 'large'],
  density: ['compact', 'comfortable', 'spacious'],
  // auto = follow the calendar (see automaticSeason), off = never set one automatically.
  // A theme chosen here stays on all year and overrides the automatic one.
  seasonal: ['auto', 'fireworks', 'aprilfools', 'aurora', 'anniversary', 'blossom', 'easter', 'fireflies', 'snowfall', 'christmas', 'halloween', 'leaves', 'friday13', 'off']
};

const SETTING_DEFAULTS = Object.freeze({
  theme: 'dark',
  accent: 'auto',
  highContrast: null,   // null = follow the device
  reduceMotion: null,   // null = follow the device
  dateFormat: 'system',
  relativeDates: true,
  headingFont: 'pixel',
  textSize: 'default',
  density: 'comfortable',
  seasonal: 'auto',
  showAnnouncements: true,
  leftSidebars: false,
  newDots: true,
  externalNewTab: true
});


const deviceQueries = {
  light: window.matchMedia('(prefers-color-scheme: light)'),
  contrast: window.matchMedia('(prefers-contrast: more)'),
  motion: window.matchMedia('(prefers-reduced-motion: reduce)')
};

function sanitizeSettings(raw) {
  const out = { ...SETTING_DEFAULTS };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const renamed = { violet: 'purple', fuchsia: 'magenta' }; // earlier names
  if (renamed[raw.accent]) raw = { ...raw, accent: renamed[raw.accent] };
  // Earlier versions stored "relative dates" as a date format called "auto".
  if (raw.dateFormat === 'auto') raw = { ...raw, dateFormat: 'system', relativeDates: true };

  for (const [key, choices] of Object.entries(SETTING_CHOICES)) {
    if (choices.includes(raw[key])) out[key] = raw[key];
  }
  for (const key of ['highContrast', 'reduceMotion', 'relativeDates', 'showAnnouncements', 'leftSidebars', 'newDots', 'externalNewTab']) {
    if (typeof raw[key] === 'boolean') out[key] = raw[key];
  }
  return out;
}

let settingsCache = null;

function getSettings() {
  if (!settingsCache) {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(SETTINGS_KEY)); } catch { /* unavailable or corrupt */ }
    // "Pink" used to be the purple-leaning pink, which is now "Magenta" ("Pink" is the new rose-leaning one). Settings saved
    // before the rename have no accentNames marker (updateSettings adds it), so their "pink" is moved to "magenta" once.
    if (raw && typeof raw === 'object' && raw.accentNames !== 2 && raw.accent === 'pink') raw = { ...raw, accent: 'magenta' };
    settingsCache = sanitizeSettings(raw);
  }
  return settingsCache;
}

/* ---------- What is actually in effect ---------- */

function effectiveTheme(s = getSettings()) {
  if (s.theme !== 'auto') return s.theme;
  return deviceQueries.light.matches ? 'light' : 'dark';
}
/* ---------- Seasonal themes ---------- */

/* Every seasonal theme lives here; the Settings page builds its cards from this list. To add one: add an entry,
   draw it in seasonal.js's EFFECTS, add its name to SETTING_CHOICES.seasonal, and (optionally) give it an accent
   colour in styles.css under "Automatic accent" (otherwise blue is used).
     name, blurb  shown on the theme's card
     dates        shown on its card, one line each with a calendar icon: { from: [month, day], to: [month, day]
                  (omit for one day), note: "US" (optional) }, a plain string ("Every Friday 13th"), or a function
                  returning either (for dates that move, like Easter)
     on(month, day, region, weekday, year)  true on a date it is set automatically (visitor's local date; region
                  "US", "GB" or ""; weekday 0 = Sunday). The first match wins, so order is priority: a theme that
                  should give way to the others (Friday 13th) goes last. */
/* Western (Gregorian) Easter Sunday as [month, day] for a year (the anonymous Gregorian algorithm).
   Orthodox churches use a different date and are not covered. */
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return [month, day];
}

// Good Friday (two days before Easter Sunday) to Easter Monday (the day after), as { from, to } in [month, day].
function easterWeekend(year) {
  const [month, day] = easterSunday(year);
  const at = offset => { const date = new Date(year, month - 1, day + offset); return [date.getMonth() + 1, date.getDate()]; };
  return { from: at(-2), to: at(1) };
}

// The Easter weekend still to come, this year's until it has finished (the visitor's local date), then next year's.
function nextEasterWeekend(now = new Date()) {
  const thisYear = easterWeekend(now.getFullYear());
  const [month, day] = thisYear.to;
  const finished = now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() > day);
  return finished ? easterWeekend(now.getFullYear() + 1) : thisYear;
}

const SEASONS = {
  fireworks: {
    name: 'Fireworks', blurb: 'Firework explosions, with an occasional Creeper face.',
    dates: [{ from: [12, 31], to: [1, 1] }, { from: [7, 4], note: 'US' }, { from: [11, 5], note: 'UK' }],
    on: (month, day, region) =>
      (month === 12 && day === 31) || (month === 1 && day === 1) ||
      (month === 7 && day === 4 && region === 'US') || (month === 11 && day === 5 && region === 'GB')
  },
  aurora: {
    name: 'Aurora', blurb: 'Northern lights.',
    dates: [{ from: [1, 28], to: [2, 4] }],
    on: (month, day) => (month === 1 && day >= 28) || (month === 2 && day <= 4)
  },
  // April Fools comes before Easter (the Easter weekend can include 1 April), and Easter before Cherry
  // Blossom (whose last week it can overlap), so each takes the days it shares with the ones after it.
  aprilfools: {
    name: 'April Fools', blurb: 'The site becomes "Classic\'s Mudworks", in mud brown.',
    dates: [{ from: [4, 1] }],
    on: (month, day) => month === 4 && day === 1
  },
  easter: {
    name: 'Easter', blurb: 'Pastel eggs and drifting daisies.',
    dates: [() => nextEasterWeekend()],
    on: (month, day, region, weekday, year) => {
      const { from, to } = easterWeekend(year);
      const at = (m, d) => m * 100 + d;
      return at(month, day) >= at(...from) && at(month, day) <= at(...to);
    }
  },
  blossom: {
    name: 'Cherry Blossom', blurb: 'Drifting cherry leaves.',
    dates: [{ from: [3, 24], to: [3, 31] }],
    on: (month, day) => month === 3 && day >= 24
  },
  anniversary: {
    name: 'Anniversary', blurb: 'Confetti falls and party balloons float up for Minecraft\'s anniversary.',
    dates: [{ from: [5, 17] }],
    on: (month, day) => month === 5 && day === 17
  },
  fireflies: {
    name: 'Fireflies', blurb: 'Fireflies blinking under a twilight sky.',
    dates: [{ from: [6, 18], to: [6, 24] }],
    on: (month, day) => month === 6 && day >= 18 && day <= 24
  },
  leaves: {
    name: 'Falling Leaves', blurb: 'Brown autumn leaves drifting down.',
    dates: [{ from: [11, 22], to: [11, 30] }],
    on: (month, day) => month === 11 && day >= 22 && day <= 30
  },
  snowfall: {
    name: 'Snowfall', blurb: 'Falling snow.',
    dates: [{ from: [12, 1], to: [12, 12] }, { from: [12, 28], to: [12, 30] }, { from: [1, 2], to: [1, 5] }],
    on: (month, day) => (month === 12 && (day <= 12 || (day >= 28 && day <= 30))) || (month === 1 && day >= 2 && day <= 5)
  },
  christmas: {
    name: 'Christmas', blurb: 'Twinkling fairy lights, spruce trees and drifting sparkles.',
    dates: [{ from: [12, 13], to: [12, 27] }],
    on: (month, day) => month === 12 && day >= 13 && day <= 27
  },
  halloween: {
    name: 'Halloween', blurb: 'Bats, a hazy moon and rising embers.',
    dates: [{ from: [10, 16], to: [11, 1] }],
    on: (month, day) => (month === 10 && day >= 16) || (month === 11 && day === 1)
  },
  friday13: {
    name: 'Friday 13th', blurb: 'Drifting mist, floating 13s and lightning bolts.',
    dates: ['Every Friday 13th'],
    on: (month, day, region, weekday) => day === 13 && weekday === 5
  }
};
const SEASON_NAMES = Object.fromEntries(Object.entries(SEASONS).map(([key, season]) => [key, season.name]));

// Time zones used to tell which of the two countries with their own fireworks night a visitor is in.
// The zone is a better guide than the browser language (an American in London still sees 5 November).
const US_TIME_ZONES = new Set([
  'America/New_York', 'America/Detroit', 'America/Kentucky/Louisville', 'America/Kentucky/Monticello',
  'America/Indiana/Indianapolis', 'America/Indiana/Vincennes', 'America/Indiana/Winamac', 'America/Indiana/Marengo',
  'America/Indiana/Petersburg', 'America/Indiana/Vevay', 'America/Indiana/Tell_City', 'America/Indiana/Knox',
  'America/Chicago', 'America/Menominee', 'America/North_Dakota/Center', 'America/North_Dakota/New_Salem',
  'America/North_Dakota/Beulah', 'America/Denver', 'America/Boise', 'America/Phoenix', 'America/Los_Angeles',
  'America/Anchorage', 'America/Juneau', 'America/Sitka', 'America/Metlakatla', 'America/Yakutat', 'America/Nome',
  'America/Adak', 'Pacific/Honolulu',
  // older names some browsers still report
  'America/Indianapolis', 'America/Fort_Wayne', 'America/Louisville', 'America/Knox_IN', 'America/Shiprock',
  'America/Atka', 'Pacific/Johnston', 'EST5EDT', 'CST6CDT', 'MST7MDT', 'PST8PDT'
]);
const UK_TIME_ZONES = new Set(['Europe/London', 'Europe/Belfast', 'GB', 'GB-Eire']);

// "US", "GB" or "" (anywhere else or unknown). Falls back to the browser language only when the
// browser doesn't report a time zone at all.
function visitorRegion() {
  let zone = '';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* unavailable */ }
  if (zone) {
    if (US_TIME_ZONES.has(zone) || zone.startsWith('US/')) return 'US';
    if (UK_TIME_ZONES.has(zone)) return 'GB';
    return '';
  }
  try {
    const region = new Intl.Locale(navigator.language).region;
    return region === 'US' || region === 'GB' ? region : '';
  } catch { return ''; }
}

// The theme the calendar picks for a date (the visitor's own local date), or "" for none.
function automaticSeason(date = new Date(), region = visitorRegion()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();
  const year = date.getFullYear();
  return Object.keys(SEASONS).find(key => SEASONS[key].on(month, day, region, weekday, year)) || '';
}

function effectiveSeason(s = getSettings()) {
  if (s.seasonal === 'off') return '';
  if (s.seasonal === 'auto') return automaticSeason();
  return s.seasonal;
}

const effectiveHighContrast = (s = getSettings()) => s.highContrast === null ? deviceQueries.contrast.matches : s.highContrast;
const effectiveReducedMotion = (s = getSettings()) => s.reduceMotion === null ? deviceQueries.motion.matches : s.reduceMotion;

// Read by the rest of the site.
const prefersReducedMotion = () => effectiveReducedMotion();
const newDotsEnabled = () => getSettings().newDots;
const linksOpenInNewTab = () => getSettings().externalNewTab;
const datesAreRelative = () => getSettings().relativeDates;

/* ---------- Applying ---------- */

// The browser chrome colour follows the page background: it is read from --bg as the current theme
// defines it (styles.css, plus a site's theme.css), so no colours are listed here. If the stylesheet
// hasn't loaded yet, the <meta> keeps the value the build wrote from the site's themeColor.
function applyThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (meta && bg) meta.content = bg;
}

function applySettings() {
  const s = getSettings();
  const root = document.documentElement;
  const toggle = (name, on, value) => { if (on) root.setAttribute(name, value); else root.removeAttribute(name); };

  const theme = effectiveTheme(s);
  root.setAttribute('data-theme', theme);
  toggle('data-accent', s.accent !== 'blue', s.accent);
  toggle('data-contrast', effectiveHighContrast(s), 'high');
  toggle('data-motion', effectiveReducedMotion(s), 'reduce');
  toggle('data-heading-font', s.headingFont !== 'pixel', s.headingFont);
  toggle('data-sidebar', s.leftSidebars, 'left');
  toggle('data-newtab', !s.externalNewTab, 'off');
  toggle('data-text-size', s.textSize !== 'default', s.textSize);
  toggle('data-density', s.density !== 'comfortable', s.density);
  toggle('data-season', effectiveSeason(s), effectiveSeason(s));

  applyThemeColor();

  if (document.body) applyLinkTargets();
}

function announceSettings() {
  document.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: getSettings() }));
}

// Saves a partial update, applies it and returns the new settings.
function updateSettings(patch) {
  settingsCache = sanitizeSettings({ ...getSettings(), ...patch });
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...settingsCache, accentNames: 2 })); } catch { /* kept for this page view only */ }
  applySettings();
  announceSettings();
  return settingsCache;
}

function resetSettings() {
  try { localStorage.removeItem(SETTINGS_KEY); } catch { /* ignore */ }
  settingsCache = null;
  applySettings();
  announceSettings();
  return getSettings();
}

/* ---------- Dates ---------- */

// "2026-03-07" in the visitor's chosen format ("system" = the device's regional format). length: "short" (no year), "medium" (7 Mar 2026)
// or "long" (7 March 2026). Anything that isn't YYYY-MM-DD is returned as it came.
function displayDate(iso, length = 'medium', format = getSettings().dateFormat) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const date = m && new Date(iso + 'T00:00:00Z');
  if (!m || Number.isNaN(date.getTime())) return iso;
  const [, y, mo, d] = m;

  if (format === 'dmy') return length === 'short' ? `${d}/${mo}` : `${d}/${mo}/${y}`;
  if (format === 'mdy') return length === 'short' ? `${mo}/${d}` : `${mo}/${d}/${y}`;
  if (format === 'iso') return length === 'short' ? `${mo}-${d}` : iso;

  const options = { day: 'numeric', month: length === 'long' ? 'long' : 'short', timeZone: 'UTC' };
  if (length !== 'short') options.year = 'numeric';
  // "system" uses the device's own language and region (undefined = the browser default).
  const locale = format === 'system' ? undefined : format === 'us-text' ? 'en-US' : 'en-GB';
  return date.toLocaleDateString(locale, options);
}

/* ---------- External links ---------- */

function isExternalLink(a) {
  if (!a.getAttribute('href')) return false;
  try {
    const url = new URL(a.href, location.href);
    return /^https?:$/.test(url.protocol) && url.origin !== location.origin;
  } catch { return false; }
}

function applyLinkTarget(a) {
  if (!isExternalLink(a)) return;
  if (linksOpenInNewTab()) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  } else if (a.target === '_blank') {
    a.removeAttribute('target');
  }
}

// Pages build most of their links with script, so new nodes are handled as they appear.
function applyLinkTargets(root = document) {
  if (root.nodeType === 1 && root.matches('a[href]')) applyLinkTarget(root);
  root.querySelectorAll('a[href]').forEach(applyLinkTarget);
}

/* ---------- Start-up ---------- */

applySettings();

// An "auto" theme, or a setting still following the device, changes with the device.
Object.values(deviceQueries).forEach(query => query.addEventListener('change', () => { applySettings(); announceSettings(); }));

// Another tab changed a setting.
window.addEventListener('storage', e => {
  if (e.key !== null && e.key !== SETTINGS_KEY) return;
  settingsCache = null;
  applySettings();
  announceSettings();
});

// The date can change while a page stays open (midnight, or a laptop waking up), which can start or
// end an automatic theme.
function refreshSeason() {
  if (document.documentElement.getAttribute('data-season') === (effectiveSeason() || null)) return;
  applySettings();
  announceSettings();
}
function scheduleSeasonRefresh() {
  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  setTimeout(() => { refreshSeason(); scheduleSeasonRefresh(); }, Math.max(1000, nextMidnight - now));
}
scheduleSeasonRefresh();
document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshSeason(); });

document.addEventListener('DOMContentLoaded', () => {
  applySettings(); // the theme-color <meta> and links didn't exist when this script first ran
  new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => { if (node.nodeType === 1) applyLinkTargets(node); }));
  }).observe(document.body, { childList: true, subtree: true });
});

window.addEventListener('load', applyThemeColor); // in case the stylesheet finished after DOMContentLoaded
