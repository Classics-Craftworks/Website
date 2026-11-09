/* Settings page: builds the controls for the settings kept by settings.js.
   Every change applies and saves straight away; there is no Save button.

   Each control registers a small function in `syncers`; they all run again whenever a setting
   changes (here, in another tab, or on the device) so what is shown never drifts from what is stored. */

const syncers = [];
const syncControls = () => syncers.forEach(sync => sync());

let controlCount = 0;
const controlId = prefix => `${prefix}-${++controlCount}`;

/* ---------- Building blocks ---------- */

// Title and description (and anything extra beneath them) for one setting.
function settingText(titleNode, desc, extra) {
  return el('div', { class: 'setting-text' }, [titleNode, desc, extra]);
}

function settingDescription(id, text) {
  return el('p', { class: 'setting-desc', text, attrs: { id } });
}

// A row with a switch on the right.
function switchRow({ key, title, description, extra, system }) {
  const id = controlId('switch');
  const descId = id + '-desc';
  const input = el('input', { attrs: { type: 'checkbox', role: 'switch', id, 'aria-describedby': descId } });
  const control = el('span', { class: 'switch' }, [input, el('span', { class: 'switch-track', attrs: { 'aria-hidden': 'true' } })]);

  input.addEventListener('change', () => updateSettings({ [key]: input.checked }));

  // Contrast and motion show what is in effect (which may come from the device).
  const effective = { highContrast: effectiveHighContrast, reduceMotion: effectiveReducedMotion };
  syncers.push(() => { input.checked = key in effective ? effective[key]() : getSettings()[key]; });

  if (system) extra = systemSwitch(key, system, input, effective[key]);

  return el('div', { class: 'setting', attrs: { id: 'setting-' + key } }, [
    settingText(el('label', { class: 'setting-title', text: title, attrs: { for: id } }), settingDescription(descId, description), extra),
    control
  ]);
}

// A row with a group of radio options beneath its text.
function choiceRow({ key, title, description, groupClass, options, fallback, extra, footer, onBuilt }) {
  const id = controlId('group');
  const group = el('div', {
    class: 'choices ' + groupClass,
    attrs: { role: 'radiogroup', 'aria-labelledby': id + '-title', 'aria-describedby': id + '-desc' }
  });
  const inputs = [];

  options.forEach(option => {
    const input = el('input', { class: 'visually-hidden', attrs: { type: 'radio', name: key, value: option.value } });
    input.addEventListener('change', () => { if (input.checked) updateSettings({ [key]: option.value }); });
    inputs.push(input);
    group.appendChild(option.render(input));
  });

  // A saved value that matches no option (e.g. an old one) shows the default as selected instead of nothing.
  syncers.push(() => {
    const current = getSettings()[key];
    const shown = inputs.some(input => input.value === current) ? current : (fallback ?? SETTING_DEFAULTS[key]);
    inputs.forEach(input => { input.checked = input.value === shown; });
  });

  const row = el('div', { class: 'setting setting-wide', attrs: { id: 'setting-' + key } }, [
    settingText(
      el('div', { class: 'setting-title', text: title, attrs: { id: id + '-title' } }),
      settingDescription(id + '-desc', description),
      extra
    ),
    group,
    footer
  ]);
  if (onBuilt) onBuilt(group, options.map((option, i) => ({ value: option.value, card: group.children[i] })));
  return row;
}

const radioMark = () => el('span', { class: 'choice-mark', attrs: { 'aria-hidden': 'true' } });

// "Use system setting": while on, the setting follows the device and its own switch is locked to
// what the device says; turning it off keeps the current value and makes it the visitor's own.
function systemSwitch(key, query, mainInput, effectiveValue) {
  const id = controlId('system');
  const input = el('input', { attrs: { type: 'checkbox', role: 'switch', id } });
  const control = el('span', { class: 'switch' }, [input, el('span', { class: 'switch-track', attrs: { 'aria-hidden': 'true' } })]);

  input.addEventListener('change', () => updateSettings({ [key]: input.checked ? null : effectiveValue() }));

  syncers.push(() => {
    const following = getSettings()[key] === null;
    input.checked = following;
    mainInput.disabled = following;
  });
  return el('div', { class: 'setting-extra' }, [el('label', { class: 'setting-system-label', text: 'Use system setting', attrs: { for: id } }), control]);
}

/* ---------- Appearance ---------- */

/* Seasonal theme: Automatic follows the calendar (dates are in settings.js: automaticSeason); the
   others are always on and override it; Off never sets one. */
// The picture on each card: Automatic shows every theme side by side (like the System colour theme),
// each theme runs its own effect, and Off is a plain page. The effects are seasonal.js's own.
// Automatic's picture: four little months (last, this and the next two), each with its themes' dates in their own colours, and this
// month outlined. Built from SEASONS' own rules (so it can never disagree with them): every day is tested,
// in both fireworks regions, and runs of days become bars. Friday 13th depends on the weekday, so it is
// checked against the current year's calendar.
const SEASON_COLORS = { fireworks: '#4ade80', snowfall: '#7dd3fc', christmas: '#f87171', halloween: '#fb923c', friday13: '#a78bfa', aurora: '#2dd4bf', blossom: '#f9a8d4', easter: '#c4b5fd', anniversary: '#e879f9', fireflies: '#facc15', leaves: '#c08a52' };
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // a plain year: 29 Feb has no theme

// The theme a day gets in this picture ("" for none): the same first-match order as automaticSeason.
function previewSeason(month, day, weekday, year) {
  return Object.keys(SEASONS).find(key => ['US', 'GB'].some(region => SEASONS[key].on(month, day, region, weekday, year))) || '';
}

// Shows four months: last month, this month and the next two (across the year end, so December
// is followed by January and February). Redrawn if the month changes while the page is open.
function calendarPreview(tile) {
  tile.classList.add('season-preview-calendar');
  const grid = el('span', { class: 'sp-grid' });
  tile.appendChild(grid);

  function monthCell(year, m, isNow) {
    const track = el('span', { class: 'sp-mt' });
    let from = 0;
    let current = '';
    for (let d = 1; d <= MONTH_LENGTHS[m] + 1; d++) {
      const key = d <= MONTH_LENGTHS[m] ? previewSeason(m + 1, d, new Date(year, m, d).getDay(), year) : '';
      if (key === current) continue;
      if (current) {
        const bar = el('span', { class: 'sp-run' });
        const left = (from - 1) / MONTH_LENGTHS[m] * 100;
        // Pinned inside the month, so a one-day bar at the very end isn't clipped by its rounded corner.
        bar.style.cssText = `left:min(${left}%,calc(100% - 2px));width:${(d - from) / MONTH_LENGTHS[m] * 100}%;--c:${SEASON_COLORS[current] || 'var(--accent)'}`;
        track.appendChild(bar);
      }
      current = key;
      from = d;
    }
    return el('span', { class: 'sp-cell' + (isNow ? ' is-now' : '') }, [el('span', { class: 'sp-label', text: MONTH_ABBR[m] }), track]);
  }

  let shown = '';
  const draw = () => {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${now.getMonth()}`;
    if (stamp === shown) return;
    shown = stamp;
    grid.textContent = '';
    for (let offset = -1; offset <= 2; offset++) {
      const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      grid.appendChild(monthCell(date.getFullYear(), date.getMonth(), offset === 0));
    }
  };
  draw();
  syncers.push(draw);
}

function seasonPreview(value) {
  const tile = el('span', { class: 'season-preview', attrs: { 'aria-hidden': 'true' } });
  if (value === 'auto') { calendarPreview(tile); return tile; }
  if (value === 'off') {
    tile.classList.add('season-preview-off');
    tile.append(el('span', { class: 'sp-bar' }), el('span', { class: 'sp-card' }));
    return tile;
  }
  (value === 'auto' ? Object.keys(SEASONS) : [value]).forEach(season => {
    const canvas = document.createElement('canvas');
    tile.appendChild(canvas);
    if (window.mountSeasonPreview) window.mountSeasonPreview(canvas, season);
  });
  return tile;
}

// "When it's automatic", on its own line under the blurb: a clock icon and short date labels. The text
// is read out in full ("Automatic on: ...") rather than as an unlabelled icon.
const CLOCK_ICON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="6.25"/><path d="M8 4.5V8l2.25 1.5"/></svg>';
// A season's date entry (see SEASONS in settings.js) as a label in the visitor's date format. Plain strings
// pass through. Ranges within one month are shortened where the format allows ("1 – 17 Dec", "Dec 1 – 17").
const LABEL_YEAR = 2001; // any non-leap year: only the day and month are shown
function seasonDateLabel(entry, format = getSettings().dateFormat) {
  if (typeof entry === 'function') entry = entry(); // dates that move (Easter) are worked out when shown
  if (typeof entry === 'string') return entry;
  const iso = ([m, d]) => `${LABEL_YEAR}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const note = entry.note ? ` (${entry.note})` : '';
  const start = displayDate(iso(entry.from), 'short', format);
  if (!entry.to) return start + note;
  let end = displayDate(iso(entry.to), 'short', format);
  let first = start;

  // Textual formats name the month: say it once when both days are in the same month.
  if (entry.from[0] === entry.to[0] && !['dmy', 'mdy', 'iso'].includes(format)) {
    const locale = format === 'system' ? undefined : format === 'us-text' ? 'en-US' : 'en-GB';
    const parts = date => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
      .formatToParts(new Date(iso(date) + 'T00:00:00Z'));
    const withoutMonth = list => list.filter(p => p.type === 'day').map(p => p.value).join('');
    const monthFirst = parts(entry.from)[0].type === 'month';
    if (withoutMonth(parts(entry.from)) && withoutMonth(parts(entry.to))) {
      if (monthFirst) end = withoutMonth(parts(entry.to));
      else first = withoutMonth(parts(entry.from));
    }
  }
  return `${first} – ${end}${note}`;
}

function seasonDates(dates, live) {
  const icon = el('span', { class: 'choice-when-icon', attrs: { 'aria-hidden': 'true' } });
  icon.innerHTML = CLOCK_ICON; // fixed markup above, nothing from outside
  const lines = dates.map(d => el('span', { class: 'choice-when-date', text: seasonDateLabel(d) }));
  // Redrawn when the date format changes.
  if (!live) syncers.push(() => lines.forEach((line, i) => { line.textContent = seasonDateLabel(dates[i]); }));
  return el('span', { class: 'choice-when' }, [
    icon,
    live ? null : el('span', { class: 'visually-hidden', text: 'Automatic on: ' }),
    ...lines
  ]);
}

// The next theme the calendar will set, and how many days away its first day is: the first later day
// whose theme is not today's. { name, days } or null (Easter can be over a year away: its dates move).
function nextSeason() {
  const now = new Date();
  const today = automaticSeason(now);
  for (let i = 1; i <= 400; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const key = automaticSeason(date);
    if (key && key !== today) return { name: SEASON_NAMES[key], days: i };
  }
  return null;
}

// The Automatic card's lines: today's theme from the calendar and the next one coming ("Today: None",
// "Next: Friday 13th – 6 days"). They follow the calendar whichever card is selected, and are re-read
// whenever the settings are synced.
function seasonToday() {
  const line = seasonDates(['Today: None', 'Next: None'], true);
  const [today, next] = line.querySelectorAll('.choice-when-date');
  line.setAttribute('role', 'status');
  syncers.push(() => {
    today.textContent = `Today: ${SEASON_NAMES[automaticSeason()] || 'None'}`;
    const upcoming = nextSeason();
    next.textContent = upcoming ? `Next: ${upcoming.name}, ${upcoming.days} ${upcoming.days === 1 ? 'day' : 'days'}` : 'Next: None';
  });
  return line;
}

const SEASON_OPTIONS = [
  { value: 'auto', name: 'Automatic', note: 'Each theme is set automatically on specific dates.' },
  // Calendar order. Names that aren't in SEASONS are placeholders for themes still to come: shown greyed
  // out, not selectable and not saved as a setting.
  ...['fireworks', 'aurora', 'blossom', 'April Fools', 'easter', 'anniversary', 'fireflies', 'friday13', 'halloween', 'leaves', 'snowfall', 'christmas'].map(key => {
    const season = SEASONS[key];
    return season
      ? { value: key, name: season.name, note: season.blurb, dates: season.dates }
      : { value: 'soon-' + key, name: key, soon: true, note: 'Not available yet.' };
  }),
  { value: 'off', name: 'Off', note: 'No seasonal theme, and none set automatically.' }
].map(o => ({
  value: o.value,
  render: input => {
    if (o.soon) {
      return el('div', { class: 'choice is-soon', attrs: { 'aria-disabled': 'true' } }, [
        el('span', { class: 'season-preview season-preview-soon', attrs: { 'aria-hidden': 'true' } }),
        el('span', { class: 'choice-head' }, [
          el('span', { class: 'choice-name-group' }, [el('span', { class: 'choice-name', text: o.name }), el('span', { class: 'soon-pill', text: 'Coming Soon' })])
        ]),
        el('span', { class: 'choice-note', text: o.note })
      ]);
    }
    return el('label', { class: 'choice' }, [
      input,
      seasonPreview(o.value),
      // Over the bottom right corner of the preview (the preview itself is hidden from screen readers; the tag is not).
      el('span', { class: 'choice-tag', attrs: { hidden: '' } }),
      el('span', { class: 'choice-head' }, [el('span', { class: 'choice-name', text: o.name }), radioMark()]),
      el('span', { class: 'choice-note', text: o.note }),
      (o.value === 'auto' ? seasonToday() : o.dates && seasonDates(o.dates))
    ]);
  }
}));

// The themes the calendar will set, soonest first: [{ key, days }], days = 0 for the one on today. Each
// theme appears once (its next run).
function upcomingSeasons() {
  const now = new Date();
  const list = [];
  let previous = '';
  for (let i = 0; i <= 400; i++) {
    const key = automaticSeason(new Date(now.getFullYear(), now.getMonth(), now.getDate() + i));
    if (key && key !== previous && !list.some(item => item.key === key)) list.push({ key, days: i });
    previous = key;
  }
  return list;
}

// Collapsed, the setting shows four cards: Automatic, the theme chosen (or today's, or the next one coming),
// the next one after that, and Off. "Show all themes" opens the full grid. The four are picked when the row
// is built and again each time it is collapsed, so choosing a card never makes the cards move under the pointer.
function seasonalRow() {
  const toggleLabel = el('span');
  const toggle = el('button', { class: 'settings-btn season-toggle', attrs: { type: 'button', 'aria-expanded': 'false' } }, [
    toggleLabel,
    el('span', { class: 'nav-chevron season-chevron', attrs: { 'aria-hidden': 'true' } })
  ]);
  const total = Object.keys(SEASONS).length;
  let expanded = false;
  let visible = new Set();
  let cards = [];
  let group = null;

  function layout() {
    const chosen = SEASONS[getSettings().seasonal] ? getSettings().seasonal : '';
    const upcoming = upcomingSeasons();
    const second = chosen || (upcoming[0] ? upcoming[0].key : '');
    const third = (upcoming.find(item => item.key !== second) || {}).key || '';
    const order = ['auto', second, third, 'off'].filter(Boolean);
    visible = new Set(order);
    cards.forEach(({ value, card }) => {
      card.hidden = !expanded && !visible.has(value);
      card.style.order = expanded ? '' : String(order.indexOf(value));
    });
    group.classList.toggle('is-collapsed', !expanded);
    toggleLabel.textContent = expanded ? 'Show fewer themes' : `Show all themes (${total})`;
    toggle.setAttribute('aria-expanded', String(expanded));
  }

  // "Today", "Next · in 5 days" and "After · in 15 days" (the one following the next) on the cards, wherever they are in the list.
  function tags() {
    const automatic = getSettings().seasonal === 'auto'; // the tags describe the calendar, so only show them while it is in charge
    const today = automaticSeason();
    const [next, after] = upcomingSeasons().filter(item => item.days > 0);
    cards.forEach(({ value, card }) => {
      const tag = card.querySelector('.choice-tag');
      if (!tag || !SEASONS[value]) return;
      let text = '';
      if (!automatic) text = '';
      else if (value === today) text = 'Today';
      else if (next && value === next.key) text = `Next · in ${next.days} ${next.days === 1 ? 'day' : 'days'}`;
      else if (after && value === after.key) text = `After · in ${after.days} ${after.days === 1 ? 'day' : 'days'}`;
      tag.textContent = text;
      tag.hidden = !text;
    });
  }

  toggle.addEventListener('click', () => { expanded = !expanded; layout(); });

  return choiceRow({
    key: 'seasonal', title: 'Seasonal theme', groupClass: 'choices-season', options: SEASON_OPTIONS,
    description: 'Festive looks for certain times of the year. Choosing one yourself overrides Automatic, and works at any time of year. With reduced motion on, they show as a still picture.',
    footer: el('div', { class: 'season-more' }, [toggle]),
    onBuilt(groupNode, built) {
      group = groupNode;
      group.id = 'season-choices';
      toggle.setAttribute('aria-controls', groupNode.id);
      cards = built;
      layout();
      tags();
      syncers.push(() => {
        tags();
        // Changed elsewhere (another tab, the header menu) to a theme that is not among the four shown.
        if (!expanded && !visible.has(getSettings().seasonal)) layout();
      });
    }
  });
}

const THEME_OPTIONS = [
  { value: 'auto',  name: 'Automatic',  note: 'Matches your system', halves: ['light', 'dark'] },
  { value: 'dark',  name: 'Dark',  note: 'Sleek and modern', halves: ['dark'] },
  { value: 'oled',  name: 'OLED',  note: 'True black', halves: ['oled'] },
  { value: 'light', name: 'Light', note: 'Bright and clear', halves: ['light'] }
].map(o => ({
  value: o.value,
  render: input => el('label', { class: 'choice' }, [
    input,
    el('span', { class: 'theme-preview', attrs: { 'aria-hidden': 'true' } }, o.halves.map(half =>
      el('span', { class: 'pv', attrs: { 'data-pv': half } }, [el('span', { class: 'pv-bar' }), el('span', { class: 'pv-card' })])
    )),
    el('span', { class: 'choice-head' }, [el('span', { class: 'choice-name', text: o.name }), radioMark()]),
    el('span', { class: 'choice-note', text: o.note })
  ])
}));

const ACCENT_OPTIONS = SETTING_CHOICES.accent.map(accent => ({
  value: accent,
  render: input => el('label', { class: 'swatch', attrs: { 'data-accent': accent } }, [
    input,
    el('span', { class: 'swatch-dot', attrs: { 'aria-hidden': 'true' } }),
    el('span', { text: capitalise(accent) })
  ])
}));

const FONT_OPTIONS = [
  { value: 'pixel', name: 'Pixel', face: 'pixel', note: 'Minercraftory, the usual look' },
  { value: 'plain', name: 'Plain', face: 'plain', note: 'Inter, the same as body text' }
].map(o => ({
  value: o.value,
  render: input => el('label', { class: 'choice' }, [
    input,
    el('span', { class: `font-sample font-sample-${o.face}`, text: 'Heading', attrs: { 'aria-hidden': 'true' } }),
    el('span', { class: 'choice-head' }, [el('span', { class: 'choice-name', text: o.name }), radioMark()]),
    el('span', { class: 'choice-note', text: o.note })
  ])
}));

const SIZE_OPTIONS = [
  { value: 'small',   name: 'Small', note: 'Fits more on screen' },
  { value: 'default', name: 'Medium', note: 'The usual size' },
  { value: 'large',   name: 'Large', note: 'Easier to read' }
].map(o => ({
  value: o.value,
  render: input => el('label', { class: 'choice' }, [
    input,
    el('span', { class: `size-sample size-sample-${o.value}`, text: 'Aa', attrs: { 'aria-hidden': 'true' } }),
    el('span', { class: 'choice-head' }, [el('span', { class: 'choice-name', text: o.name }), radioMark()]),
    el('span', { class: 'choice-note', text: o.note })
  ])
}));

const DENSITY_OPTIONS = [
  { value: 'compact', name: 'Compact', note: 'Tighter, fits more on screen' },
  { value: 'comfortable', name: 'Comfortable', note: 'The usual spacing' },
  { value: 'spacious', name: 'Spacious', note: 'Roomier, easier to scan' }
].map(o => ({
  value: o.value,
  render: input => el('label', { class: 'choice' }, [
    input,
    el('span', { class: `density-preview density-preview-${o.value}`, attrs: { 'aria-hidden': 'true' } },
      [el('span'), el('span'), el('span')]),
    el('span', { class: 'choice-head' }, [el('span', { class: 'choice-name', text: o.name }), radioMark()]),
    el('span', { class: 'choice-note', text: o.note })
  ])
}));

/* ---------- Content and links ---------- */

const SAMPLE_DATE = '2026-11-03'; // day and month both under 13, so DD/MM and MM/DD visibly differ

const DATE_OPTIONS = [
  { value: 'system', name: 'System' },
  { value: 'text', name: 'Day Month Year' },
  { value: 'us-text', name: 'Month Day, Year' },
  { value: 'dmy', name: 'DD/MM/YYYY' },
  { value: 'mdy', name: 'MM/DD/YYYY' },
  { value: 'iso', name: 'YYYY-MM-DD' }
].map(o => ({
  value: o.value,
  render: input => {
    const example = displayDate(SAMPLE_DATE, 'medium', o.value);
    return el('label', { class: 'choice choice-row' }, [
      input,
      el('span', { class: 'choice-head' }, [radioMark(), el('span', { class: 'choice-name', text: o.name })]),
      el('span', { class: 'choice-example', text: example })
    ]);
  }
}));

// "Mark all as read" and how much is waiting (counted whether or not dots are shown).
function unreadControls() {
  const status = el('span', { class: 'setting-status', attrs: { role: 'status' } });
  const button = el('button', { class: 'settings-btn', text: 'Mark all as read', attrs: { type: 'button' } });

  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') === 'true') return;
    markAllSeen(); // fires DOTS_EVENT, which refreshes this and the header
  });

  syncers.push(() => {
    const { downloads, news } = unreadSummary();
    const total = downloads + news;
    button.setAttribute('aria-disabled', String(total === 0));
    status.textContent = total === 0
      ? "You're all caught up."
      : `${total} unread ${total === 1 ? 'update' : 'updates'}${newDotsEnabled() ? '.' : ', hidden while dots are off.'}`;
  });
  return el('div', { class: 'setting-extra' }, [button, status]);
}

/* ---------- Page ---------- */

function settingsGroup(title, rows, id) {
  return el('section', { attrs: { id, 'aria-label': title } }, [
    el('h2', { class: 'settings-group-title' }, [
      icon((JUMP_LINKS.find(section => section.id === id) || {}).icon || 'link', 'icon-md'),
      el('span', { text: title })
    ]),
    el('div', { class: 'settings-list' }, rows)
  ]);
}

// Side panel linking to each setting; the same collapsible panel as the project pages' "Jump to project".
const JUMP_LINKS = [
  { id: 'group-appearance', label: 'Appearance', icon: 'appearance', items: [
    ['theme', 'Colour theme', 'moon'], ['seasonal', 'Seasonal theme', 'snowflake'], ['accent', 'Accent colour', 'drop'],
    ['headingFont', 'Heading font', 'font'], ['textSize', 'Text size', 'text-size'], ['density', 'Spacing', 'spacing'], ['leftSidebars', 'Left-aligned sidebars', 'pin']
  ] },
  { id: 'group-accessibility', label: 'Accessibility', icon: 'accessibility', items: [
    ['highContrast', 'High contrast', 'contrast'], ['reduceMotion', 'Reduce motion', 'motion']
  ] },
  { id: 'group-content', label: 'Content and links', icon: 'link', items: [
    ['dateFormat', 'Date format', 'calendar'], ['relativeDates', 'Relative dates', 'clock'], ['showAnnouncements', 'Announcement pop-ups', 'announcements'], ['newDots', 'New content dots', 'bell'], ['externalNewTab', 'External links', 'newtab']
  ] }
];

function renderSettingsJump() {
  const KEY = 'settings-jump-collapsed';
  const desktop = window.matchMedia('(min-width: 1100px)').matches;
  let open = desktop && storageGet(KEY) !== '1'; // stacked on narrow screens: starts collapsed

  const listId = 'settings-jump-list';
  const items = JUMP_LINKS.map(section => el('li', {}, [
    internalLink('jump-link jump-link-group', '#' + section.id, [icon(section.icon, 'icon-md'), el('span', { text: section.label })]),
    el('ul', { class: 'jump-sub' }, section.items.map(([key, label, iconName]) =>
      el('li', {}, [internalLink('jump-link', '#setting-' + key, [icon(iconName, 'icon-sm'), el('span', { text: label })])])))
  ]));
  const body = el('div', { class: 'news-filter-panel', attrs: { id: listId } }, [el('ul', { class: 'jump-list' }, items)]);
  const toggle = el('button', { class: 'news-filter-toggle', attrs: { type: 'button', 'aria-controls': listId } }, [
    el('span', { class: 'news-filter-toggle-label', text: 'Jump to setting' }),
    el('span', { class: 'nav-chevron', attrs: { 'aria-hidden': 'true' } })
  ]);
  const box = el('section', { class: 'news-filter-box' }, [toggle, body]);

  const apply = () => {
    toggle.setAttribute('aria-expanded', String(open));
    body.hidden = !open;
    box.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => {
    open = !open;
    apply();
    if (desktop) storageSet(KEY, open ? '0' : '1');
  });
  apply();

  return el('aside', { class: 'catalog-aside', attrs: { 'aria-label': 'Jump to a setting' } }, [box]);
}

function renderSettings() {
  const main = document.getElementById('settings');
  if (!main) return;

  main.appendChild(el('h1', { class: 'flat-section-heading', attrs: { id: 'settings-heading' } }, [el('span', { text: 'Settings' })]));
  main.appendChild(el('p', { class: 'settings-intro' }));

  const content = el('div', { class: 'settings-content' });
  main.appendChild(el('div', { class: 'catalog-layout settings-layout' }, [renderSettingsJump(), content]));

  content.appendChild(settingsGroup('Appearance', [
    choiceRow({
      key: 'theme', title: 'Colour theme', groupClass: 'choices-theme', options: THEME_OPTIONS,
      description: 'Your preferred colour theme for the whole site.'
    }),
    seasonalRow(),
    choiceRow({
      key: 'accent', title: 'Accent colour', groupClass: 'choices-accent', options: ACCENT_OPTIONS,
      description: 'Used for links, highlights and buttons. Project release channels (stable, beta, alpha) always keep their own colours.'
    }),
    choiceRow({
      key: 'headingFont', title: 'Heading font', groupClass: 'choices-font', options: FONT_OPTIONS,
      description: 'The font for page titles, headings and the site name.'
    }),
    choiceRow({
      key: 'textSize', title: 'Text size', groupClass: 'choices-size', options: SIZE_OPTIONS,
      description: 'Makes all text on the site smaller or larger.'
    }),
    choiceRow({
      key: 'density', title: 'Spacing', groupClass: 'choices-density', options: DENSITY_OPTIONS,
      description: 'Adjusts the density of elements across the site.'
    }),
    switchRow({
      key: 'leftSidebars', title: 'Left-aligned sidebars',
      description: 'Show side panels on the left instead of the right (project pages, News and Settings). On narrow screens they stay above the content either way.'
    })
  ], 'group-appearance'));

  content.appendChild(settingsGroup('Accessibility', [
    switchRow({
      key: 'highContrast', title: 'High contrast',
      description: 'Stronger text, borders and focus outlines.',
      system: deviceQueries.contrast
    }),
    switchRow({
      key: 'reduceMotion', title: 'Reduce motion',
      description: 'Turns off animations and the automatic rotation of featured projects.',
      system: deviceQueries.motion
    })
  ], 'group-accessibility'));

  content.appendChild(settingsGroup('Content and links', [
    choiceRow({
      key: 'dateFormat', title: 'Date format', groupClass: 'choices-date', options: DATE_OPTIONS, fallback: 'text',
      description: 'How release, news and statistics dates are written. "System" follows your device\'s language and region.'
    }),
    switchRow({
      key: 'relativeDates', title: 'Relative dates',
      description: 'Show recent dates as "3 days ago" or "Yesterday" until one month has passed, with the full date on hover. Turn off to always show the full date.'
    }),
    switchRow({
      key: 'showAnnouncements', title: 'Announcement pop-ups',
      description: 'Show the announcement card in the corner of the page. Turn off to never see it; announcements stay on the News page.'
    }),
    switchRow({
      key: 'newDots', title: 'New content dots',
      description: "Show a dot on news entries and downloads you haven't seen yet, and their counters in the header.",
      extra: unreadControls()
    }),
    switchRow({
      key: 'externalNewTab', title: 'Open external links in new tab',
      description: 'Links to other sites open in a new tab. Turn off to open them in the current tab.'
    })
  ], 'group-content'));

  const resetStatus = el('span', { class: 'setting-status', attrs: { role: 'status' } });
  const reset = el('button', { class: 'settings-btn', text: 'Reset all settings', attrs: { type: 'button' } });
  reset.addEventListener('click', () => {
    resetSettings();
    resetStatus.textContent = 'Settings reset to their defaults.';
  });
  content.appendChild(el('div', { class: 'settings-actions' }, [reset, resetStatus]));

  syncControls();
  handleDeepLink();
}

renderBrand(SITE_DATA.brand);
renderSiteHeader(SITE_DATA.pages || [], 'settings');
renderFooter(SITE_DATA.socials, SITE_DATA.footer, SITE_DATA.version);
renderSettings();
clearSkeletons();
initBackToTop();
window.addEventListener('hashchange', handleDeepLink);

document.addEventListener(SETTINGS_EVENT, syncControls);
document.addEventListener(DOTS_EVENT, syncControls);
