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
function switchRow({ key, title, description, extra }) {
  const id = controlId('switch');
  const descId = id + '-desc';
  const input = el('input', { attrs: { type: 'checkbox', role: 'switch', id, 'aria-describedby': descId } });
  const control = el('span', { class: 'switch' }, [input, el('span', { class: 'switch-track', attrs: { 'aria-hidden': 'true' } })]);

  input.addEventListener('change', () => updateSettings({ [key]: input.checked }));

  // Contrast and motion show what is in effect (which may come from the device).
  const effective = { highContrast: effectiveHighContrast, reduceMotion: effectiveReducedMotion };
  syncers.push(() => { input.checked = key in effective ? effective[key]() : getSettings()[key]; });

  return el('div', { class: 'setting', attrs: { id: 'setting-' + key } }, [
    settingText(el('label', { class: 'setting-title', text: title, attrs: { for: id } }), settingDescription(descId, description), extra),
    control
  ]);
}

// A row with a group of radio options beneath its text.
function choiceRow({ key, title, description, groupClass, options }) {
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

  syncers.push(() => { inputs.forEach(input => { input.checked = input.value === getSettings()[key]; }); });

  return el('div', { class: 'setting setting-wide', attrs: { id: 'setting-' + key } }, [
    settingText(
      el('div', { class: 'setting-title', text: title, attrs: { id: id + '-title' } }),
      settingDescription(id + '-desc', description)
    ),
    group
  ]);
}

const radioMark = () => el('span', { class: 'choice-mark', attrs: { 'aria-hidden': 'true' } });

// "Following your device (currently on)" with a way back once the visitor has overridden it.
function deviceStatus(key, query) {
  const text = el('span', { class: 'setting-status' });
  const reset = el('button', { class: 'settings-textbtn', text: 'Follow device setting', attrs: { type: 'button' } });
  reset.addEventListener('click', () => updateSettings({ [key]: null }));

  syncers.push(() => {
    const following = getSettings()[key] === null;
    text.textContent = following
      ? `Following your device setting, which is currently ${query.matches ? 'on' : 'off'}.`
      : 'Set on this site.';
    reset.hidden = following;
  });
  return el('div', { class: 'setting-extra' }, [text, reset]);
}

/* ---------- Appearance ---------- */

// Placeholder for a feature that isn't built yet: no control, just a "Coming soon" tag.
function seasonalRow() {
  const descId = controlId('seasonal') + '-desc';
  return el('div', { class: 'setting', attrs: { id: 'setting-seasonal' } }, [
    settingText(
      el('div', { class: 'setting-title' }, [el('span', { text: 'Seasonal theme' }), el('span', { class: 'soon-tag', text: 'Coming soon' })]),
      settingDescription(descId, 'Festive looks that appear at certain times of the year. Choosing one overwrites any that are automatically set in the future.')
    )
  ]);
}

const THEME_OPTIONS = [
  { value: 'auto',  name: 'System',  note: 'Matches your system', halves: ['light', 'dark'] },
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
  { value: 'comfortable', name: 'Comfortable', note: 'The usual spacing' },
  { value: 'compact', name: 'Compact', note: 'Tighter, fits more' }
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

function isoDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const DATE_OPTIONS = [
  { value: 'auto', name: 'Automatic' },
  { value: 'text', name: 'Day Month Year' },
  { value: 'us-text', name: 'Month Day, Year' },
  { value: 'dmy', name: 'DD/MM/YYYY' },
  { value: 'mdy', name: 'MM/DD/YYYY' },
  { value: 'iso', name: 'YYYY-MM-DD' }
].map(o => ({
  value: o.value,
  render: input => {
    const example = o.value === 'auto'
      ? `${relativeNewsDate(isoDaysAgo(2)) || '2 days ago'}, then ${displayDate(SAMPLE_DATE, 'medium', 'auto')}`
      : displayDate(SAMPLE_DATE, 'medium', o.value);
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
  { id: 'group-appearance', label: 'Appearance', icon: 'brush', items: [
    ['theme', 'Colour theme', 'moon'], ['seasonal', 'Seasonal theme', 'snowflake'], ['accent', 'Accent colour', 'drop'],
    ['headingFont', 'Header font', 'font'], ['textSize', 'Text size', 'text-size'], ['density', 'Spacing', 'spacing']
  ] },
  { id: 'group-accessibility', label: 'Accessibility', icon: 'accessibility', items: [
    ['highContrast', 'High contrast', 'contrast'], ['reduceMotion', 'Reduce motion', 'motion']
  ] },
  { id: 'group-content', label: 'Content and links', icon: 'link', items: [
    ['dateFormat', 'Date format', 'calendar'], ['newDots', 'New content dots', 'bell'], ['externalNewTab', 'External links', 'newtab']
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
      key: 'headingFont', title: 'Header font', groupClass: 'choices-font', options: FONT_OPTIONS,
      description: 'The font for page titles, headings and the site name.'
    }),
    choiceRow({
      key: 'textSize', title: 'Text size', groupClass: 'choices-size', options: SIZE_OPTIONS,
      description: 'Makes all text on the site smaller or larger.'
    }),
    choiceRow({
      key: 'density', title: 'Spacing', groupClass: 'choices-density', options: DENSITY_OPTIONS,
      description: 'Adjusts the density of elements across the site.'
    })
  ], 'group-appearance'));

  content.appendChild(settingsGroup('Accessibility', [
    switchRow({
      key: 'highContrast', title: 'High contrast',
      description: 'Stronger text, borders and focus outlines.',
      extra: deviceStatus('highContrast', deviceQueries.contrast)
    }),
    switchRow({
      key: 'reduceMotion', title: 'Reduce motion',
      description: 'Turns off animations and the automatic rotation of featured projects.',
      extra: deviceStatus('reduceMotion', deviceQueries.motion)
    })
  ], 'group-accessibility'));

  content.appendChild(settingsGroup('Content and links', [
    choiceRow({
      key: 'dateFormat', title: 'Date format', groupClass: 'choices-date', options: DATE_OPTIONS,
      description: 'How release and news entry dates are written.'
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
