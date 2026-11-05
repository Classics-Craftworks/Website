/* Visitor settings: storage, defaults and the helpers the rest of the site reads them through.

   Loaded synchronously in <head> (after js-flag.js) so the saved look is on <html> before first
   paint. The Settings page itself is settings-page.js.

   Everything lives in one localStorage key as JSON. Anything missing, unreadable or unknown falls
   back to its default, so a bad value can never break a page.

   Attributes set on <html> (styles.css keys off these):
     data-theme          dark | light | oled   ("auto" is resolved to light or dark here)
     data-accent         purple | pink | ...   (absent = blue)
     data-contrast       high                  (absent = normal)
     data-motion         reduce                (absent = full motion)
     data-heading-font   plain                 (absent = pixel font)
     data-text-size      small | large         (absent = default size)
     data-density        compact               (absent = comfortable spacing)
     data-newtab         off                   (absent = external links open in a new tab)

   High contrast and reduced motion follow the device setting until the visitor changes them
   (stored as null = "follow the device"). */

const SETTINGS_KEY = 'settings';
const SETTINGS_EVENT = 'ccw:settings'; // fired on document after every change; detail = settings

const SETTING_CHOICES = {
  theme: ['auto', 'dark', 'oled', 'light'],
  accent: ['red', 'orange', 'gold', 'green', 'teal', 'blue', 'purple', 'pink'],
  dateFormat: ['auto', 'text', 'us-text', 'dmy', 'mdy', 'iso'],
  headingFont: ['pixel', 'plain'],
  textSize: ['small', 'default', 'large'],
  density: ['compact', 'comfortable', 'spacious']
};

const SETTING_DEFAULTS = Object.freeze({
  theme: 'dark',
  accent: 'blue',
  highContrast: null,   // null = follow the device
  reduceMotion: null,   // null = follow the device
  dateFormat: 'auto',   // relative when recent, otherwise "3 Nov 2026"
  headingFont: 'pixel',
  textSize: 'default',
  density: 'comfortable',
  newDots: true,
  externalNewTab: true
});

// Browser chrome colour per theme; keep in step with --bg in styles.css.
const THEME_COLORS = { dark: '#0d111a', oled: '#000000', light: '#f4f7fc' };

const deviceQueries = {
  light: window.matchMedia('(prefers-color-scheme: light)'),
  contrast: window.matchMedia('(prefers-contrast: more)'),
  motion: window.matchMedia('(prefers-reduced-motion: reduce)')
};

function sanitizeSettings(raw) {
  const out = { ...SETTING_DEFAULTS };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const renamed = { violet: 'purple', fuchsia: 'pink' }; // earlier names
  if (renamed[raw.accent]) raw = { ...raw, accent: renamed[raw.accent] };

  for (const [key, choices] of Object.entries(SETTING_CHOICES)) {
    if (choices.includes(raw[key])) out[key] = raw[key];
  }
  for (const key of ['highContrast', 'reduceMotion', 'newDots', 'externalNewTab']) {
    if (typeof raw[key] === 'boolean') out[key] = raw[key];
  }
  return out;
}

let settingsCache = null;

function getSettings() {
  if (!settingsCache) {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(SETTINGS_KEY)); } catch { /* unavailable or corrupt */ }
    settingsCache = sanitizeSettings(raw);
  }
  return settingsCache;
}

/* ---------- What is actually in effect ---------- */

function effectiveTheme(s = getSettings()) {
  if (s.theme !== 'auto') return s.theme;
  return deviceQueries.light.matches ? 'light' : 'dark';
}
const effectiveHighContrast = (s = getSettings()) => s.highContrast === null ? deviceQueries.contrast.matches : s.highContrast;
const effectiveReducedMotion = (s = getSettings()) => s.reduceMotion === null ? deviceQueries.motion.matches : s.reduceMotion;

// Read by the rest of the site.
const prefersReducedMotion = () => effectiveReducedMotion();
const newDotsEnabled = () => getSettings().newDots;
const linksOpenInNewTab = () => getSettings().externalNewTab;
const datesAreRelative = () => getSettings().dateFormat === 'auto';

/* ---------- Applying ---------- */

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
  toggle('data-newtab', !s.externalNewTab, 'off');
  toggle('data-text-size', s.textSize !== 'default', s.textSize);
  toggle('data-density', s.density !== 'comfortable', s.density);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLORS[theme] || THEME_COLORS.dark;

  if (document.body) applyLinkTargets();
}

function announceSettings() {
  document.dispatchEvent(new CustomEvent(SETTINGS_EVENT, { detail: getSettings() }));
}

// Saves a partial update, applies it and returns the new settings.
function updateSettings(patch) {
  settingsCache = sanitizeSettings({ ...getSettings(), ...patch });
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsCache)); } catch { /* kept for this page view only */ }
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

// "2026-03-07" in the visitor's chosen format. length: "short" (no year), "medium" (7 Mar 2026)
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
  return date.toLocaleDateString(format === 'us-text' ? 'en-US' : 'en-GB', options);
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

document.addEventListener('DOMContentLoaded', () => {
  applySettings(); // the theme-color <meta> and links didn't exist when this script first ran
  new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => { if (node.nodeType === 1) applyLinkTargets(node); }));
  }).observe(document.body, { childList: true, subtree: true });
});
