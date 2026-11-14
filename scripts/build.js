#!/usr/bin/env node
/* Builds one or more sites into dist/<site-id>/.

     node scripts/build.js                 build every site in sites/
     node scripts/build.js classic36       build just that one

   A site is made from four layers, later ones winning:
     1. core/shell/            shared code, styles, fonts and icons (what every site needs)
     2. core/features/<name>/  the features the site lists in `features` in its site.config.js: scripts,
                               and styles spliced into styles.css (see "Feature styles" below)
     3. sites/<id>/public/     the site's own data, images and (optional) theme.css; a file with the
                               same path as a core file replaces it
     4. generated              HTML pages, manifest.json, sitemap.xml, robots.txt and sw.js, made from
                               core/templates/ and sites/<id>/site.config.js

   No dependencies: plain Node 18+. */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const CORE = path.join(ROOT, 'core');
const SHELL = path.join(CORE, 'shell');
const FEATURES = path.join(CORE, 'features');
const SITES = path.join(ROOT, 'sites');
const DIST = path.join(ROOT, 'dist');

// ---------- helpers ----------

const read = file => fs.readFileSync(file, 'utf8');
const write = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
const fail = msg => { throw new Error(msg); };

// Escapes what HTML needs and nothing more (apostrophes stay as they are).
const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const jsonEsc = text => JSON.stringify(String(text)).slice(1, -1);

/* Tiny template engine: {{name}} inserts a value as given (callers escape it), and
   {{#if name}} ... {{/if}} keeps its lines only when the value is truthy. The tag lines
   of an #if block are removed entirely, so they leave no blank line behind. */
function render(template, vars, file = 'template') {
  let out = template;
  out = out.replace(/^[ \t]*\{\{#if (\w+)\}\}\n([\s\S]*?)^[ \t]*\{\{\/if\}\}\n/gm, (_, key, body) => vars[key] ? body : '');
  out = out.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in vars)) fail(`${file}: no value for {{${key}}}`);
    return vars[key];
  });
  return out;
}

function copyDir(from, to) {
  if (fs.existsSync(from)) fs.cpSync(from, to, { recursive: true });
}

// Every file under dir, as paths relative to it with forward slashes.
function listFiles(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full, base) : [path.relative(base, full).split(path.sep).join('/')];
  });
}

// data.js is a browser script (`const SITE_DATA = {...}`); evaluate it in a sandbox to read the nav and brand.
function loadSiteData(file) {
  try { return vm.runInNewContext(read(file) + '\n;SITE_DATA', {}, { filename: file, timeout: 2000 }); }
  catch (err) { return fail(`could not read SITE_DATA from ${file}: ${err.message}`); }
}

// Reads a Keep a Changelog file (sites/<id>/CHANGELOG.md) into data the Changelog page renders:
//   [{ version, date, note?, groups: [{ title, items: [{ text, items: [...] }] }] }]   newest first, as written.
// "## v1.2.3 — 2026-01-31" starts a release, "### Added" a group and "- text" an item; lines indented by
// two more spaces are sub-items. Text keeps its `code`, **bold** and [link](url) marks for the page to draw.
function parseChangelog(text, file) {
  const releases = [];
  let release = null, group = null;
  const stack = [];   // the open items, by depth
  text.split(/\r?\n/).forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    let m;
    if ((m = line.match(/^## (.+?)\s*$/))) {
      const head = m[1].match(/^\[?(v?\d[^\]\s]*)\]?\s*(?:[—–-]+\s*(\d{4}-\d{2}-\d{2}))?$/i);
      if (!head) fail(`${where}: expected "## v1.2.3 — YYYY-MM-DD", got "${line}"`);
      release = { version: head[1], date: head[2] || '', groups: [] };
      releases.push(release);
      group = null; stack.length = 0;
    } else if ((m = line.match(/^### (.+?)\s*$/))) {
      if (!release) fail(`${where}: a "###" group before any "##" release`);
      group = { title: m[1], items: [] };
      release.groups.push(group);
      stack.length = 0;
    } else if ((m = line.match(/^( *)- (.+?)\s*$/))) {
      if (!group) fail(`${where}: a list item outside a "###" group`);
      // An item indented more than one step past its parent still nests directly under it, as Markdown shows it.
      const depth = Math.min(Math.floor(m[1].length / 2), stack.length);
      stack.length = depth;
      const item = { text: m[2] };
      const siblings = depth === 0 ? group.items : (stack[depth - 1].items = stack[depth - 1].items || []);
      siblings.push(item);
      stack.push(item);
    } else if (release && !group && line.trim() && !/^#/.test(line)) {
      // A sentence under the release heading, before any group ("No user-facing changes."): the release's note.
      release.note = release.note ? `${release.note} ${line.trim()}` : line.trim();
    } else if (release && line.trim() && !/^#\s/.test(line)) {
      fail(`${where}: unrecognised line "${line}"`);
    }
  });
  const seen = new Set();
  for (const r of releases) {
    if (seen.has(r.version)) fail(`${file}: version ${r.version} appears twice`);
    seen.add(r.version);
  }
  return releases;
}

// ---------- page kinds ----------

// What each kind of page loads besides the shell. `extras` are the page's own scripts (after the shell's start-up
// and the features' scripts, so hooks are registered by then); `stats` adds the home page figures.
const PAGE_KINDS = {
  home:     { skip: ['#catalog', 'Skip to projects'],  action: 'build its project catalog', backToTop: true,  extras: ['news', 'home'], stats: true },
  section:  { skip: ['#catalog', 'Skip to projects'],  action: 'build its project catalog', backToTop: true,  extras: [], dataPage: true },
  about:    { skip: ['#about', 'Skip to content'],     action: 'build its pages',           backToTop: false, extras: ['about'] },
  news:     { skip: ['#news-page', 'Skip to content'], action: 'build its pages',           backToTop: true,  extras: ['news'] },
  settings: { skip: ['#settings', 'Skip to settings'], action: 'build its pages',           backToTop: true,  extras: ['settings-page'] },
  changelog: { skip: ['#changelog-page', 'Skip to content'], action: 'show its changelog', backToTop: true,  extras: ['changelog-data', 'changelog'] },
  skins:    { skip: ['#skins-page', 'Skip to content'], action: 'show its skin history',     backToTop: true,  extras: [] },
  extras:   { skip: ['#extras-page', 'Skip to content'], action: 'show its extra pages',     backToTop: true,  extras: [] },
  notfound: { skip: null,                              action: null,                        backToTop: false, extras: ['404'] }
};

// Feature manifests (core/features/<name>/feature.json). A script runs on `pages` (page kinds; default all) in
// `phase` "base" (right after the shell, before the page's own scripts: it registers hooks) or "late" (after them).
function loadFeatures(config) {
  const names = config.features || [];
  return names.map(name => {
    const dir = path.join(FEATURES, name);
    if (!fs.existsSync(path.join(dir, 'feature.json'))) {
      const known = fs.existsSync(FEATURES) ? fs.readdirSync(FEATURES).filter(f => fs.existsSync(path.join(FEATURES, f, 'feature.json'))) : [];
      fail(`site.config.js: unknown feature "${name}". Features: ${known.join(', ') || '(none)'}`);
    }
    return { name, dir, ...JSON.parse(read(path.join(dir, 'feature.json'))) };
  });
}

// Scripts every page loads, in order: site-error, seasonal, data, [home only: stats], latest-updates, shell,
// the features' "base" scripts, shell-init, the page's own scripts, the features' "late" scripts.
function scriptTags(kind, features) {
  const k = PAGE_KINDS[kind];
  const forPage = phase => features.flatMap(f => (f.scripts || [])
    .filter(sc => (sc.phase || 'base') === phase && (!sc.pages || sc.pages.includes(kind)))
    .map(sc => sc.file.replace(/\.js$/, '')));
  const names = ['site-error', 'seasonal', 'data', ...(k.stats ? ['stats'] : []), 'latest-updates', 'shell',
    ...forPage('base'), 'shell-init', ...k.extras, ...forPage('late')];
  return names.map(n => `<script src="/${n}.js" defer></script>`).join('\n');
}

// Feature styles: core/shell/styles.css has marker lines like /*@include catalog/release-table*/ where a feature's
// rules (core/features/catalog/css/release-table.css) belong in the cascade. The marker is replaced by the file
// when the site has that feature and by nothing when it doesn't, so a rule keeps exactly the position it had when
// everything lived in one stylesheet.
function buildStyles(features) {
  const enabled = new Map(features.map(f => [f.name, f]));
  const used = new Set();
  const css = read(path.join(SHELL, 'styles.css')).replace(/^([ \t]*)\/\*@include ([\w-]+)\/([\w-]+)\*\/[ \t]*\n/gm, (_, indent, feature, part) => {
    const file = path.join(FEATURES, feature, 'css', `${part}.css`);
    if (!fs.existsSync(file)) fail(`core/shell/styles.css: no stylesheet for "@include ${feature}/${part}"`);
    if (!enabled.has(feature)) return '';
    used.add(`${feature}/${part}`);
    return read(file).trimEnd().split('\n').map(line => line ? indent + line : line).join('\n') + '\n';
  });
  for (const f of features) {
    const dir = path.join(f.dir, 'css');
    for (const file of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
      if (!used.has(`${f.name}/${file.replace(/\.css$/, '')}`)) fail(`core/features/${f.name}/css/${file} is not included by any marker in core/shell/styles.css`);
    }
  }
  return css;
}

// ---------- build ----------

function buildSite(id) {
  const siteDir = path.join(SITES, id);
  const configFile = path.join(siteDir, 'site.config.js');
  if (!fs.existsSync(configFile)) fail(`sites/${id}/site.config.js not found`);
  const config = require(configFile);
  if (config.id !== id) fail(`sites/${id}/site.config.js: id is "${config.id}" but the folder is "${id}"`);

  const out = path.join(DIST, id);
  fs.rmSync(out, { recursive: true, force: true });

  const features = loadFeatures(config);
  const has = name => features.some(f => f.name === name);

  // Layers 1 to 3.
  copyDir(SHELL, out);
  for (const f of features) {
    for (const sc of f.scripts || []) fs.copyFileSync(path.join(f.dir, sc.file), path.join(out, sc.file));
  }
  write(path.join(out, 'styles.css'), buildStyles(features));
  copyDir(path.join(siteDir, 'public'), out);

  // The nav, brand name and logo come from the site's data.js.
  const dataFile = path.join(out, 'data.js');
  if (!fs.existsSync(dataFile)) fail(`sites/${id}/public/data.js not found`);
  const data = loadSiteData(dataFile);
  if (!data.brand || !data.brand.name || !data.brand.logo) fail('SITE_DATA.brand needs a name and a logo');
  if (!fs.existsSync(path.join(out, data.brand.logo))) fail(`brand logo "${data.brand.logo}" is not in the site's files`);

  // The page list here and the nav in data.js must describe the same pages.
  const bySlug = new Map(config.pages.map(p => [p.slug, p]));
  for (const nav of data.pages || []) {
    if (/^https?:\/\//i.test(nav.url)) continue;   // an external link (the wiki, say) has no page here
    const slug = nav.url === '/' ? '' : nav.url;
    if (!bySlug.has(slug)) fail(`SITE_DATA.pages has "${nav.url}" but site.config.js has no page with slug "${slug}"`);
  }
  for (const page of config.pages) {
    if (!PAGE_KINDS[page.kind]) fail(`page "${page.slug}": unknown kind "${page.kind}"`);
    if (page.kind !== 'notfound' && page.nav !== false && !(data.pages || []).some(n => (n.url === '/' ? '' : n.url) === page.slug)) {
      fail(`site.config.js has page "${page.slug}" but SITE_DATA.pages does not link to it`);
    }
  }

  // The data and the features must agree: content for a feature the site didn't enable would silently not show.
  if (!has('catalog') && (data.sections || []).length) fail(`SITE_DATA.sections is set but site.config.js doesn't list the "catalog" feature`);
  if (has('catalog') && !(data.sections || []).length) fail(`site.config.js lists the "catalog" feature but SITE_DATA has no sections`);
  const home = data.home || {};
  if (!has('landing') && (home.features || home.join || home.versions)) fail(`SITE_DATA.home has features/join/versions blocks but site.config.js doesn't list the "landing" feature`);

  // The splash card: the catalogue's featured projects, or the landing "Join the server" card.
  const joinCard = has('landing') && home.splash && home.splash.joinCard;
  if (joinCard && !home.join) fail(`SITE_DATA.home.splash.joinCard needs a home.join block to fill it`);
  if (joinCard && joinCard.image && !fs.existsSync(path.join(out, joinCard.image))) fail(`SITE_DATA.home.splash.joinCard.image "${joinCard.image}" is not in the site's files`);

  // A site without the catalogue gets no "Projects" footer column and no project wording.
  const hasProjects = has('catalog');
  // The profile feature's "Current skin" card fills the splash's card slot for a personal site.
  const skinCard = has('profile') && home.splash && home.splash.skinCard;
  if (skinCard && skinCard.image && !fs.existsSync(path.join(out, skinCard.image))) fail(`SITE_DATA.home.splash.skinCard.image "${skinCard.image}" is not in the site's files`);
  if (!has('profile') && (home.socials || home.related || home.explore || data.skins || data.extras)) fail(`SITE_DATA has profile content (home.socials/related/explore, skins, extras) but site.config.js doesn't list the "profile" feature`);
  const hasFeaturedCard = hasProjects || !!joinCard || !!skinCard;
  const hasProfileCredit = !!(data.footer && data.footer.profileCredit);
  const hasTheme = fs.existsSync(path.join(out, 'theme.css'));
  const og = config.ogImage;
  const noscriptLinks = config.noscriptLinks
    .map(l => `<a href="${esc(l.url)}">${esc(l.label)}</a>`)
    .join('\n      or ');
  const pageTemplate = read(path.join(CORE, 'templates', 'page.html'));
  const mainTemplate = kind => {
    const name = kind === 'notfound' ? '404' : kind;
    return read(path.join(CORE, 'templates', 'main', `${name}.html`)).trimEnd();
  };

  // Layer 3: pages.
  for (const page of config.pages) {
    const k = PAGE_KINDS[page.kind];
    const url = page.slug ? `${config.url}/${page.slug}` : `${config.url}/`;
    const file = page.slug ? `${page.slug}.html` : 'index.html';
    const social = page.social !== false;
    const kindSkip = page.kind === 'home' && !hasProjects ? ['#catalog', 'Skip to content'] : k.skip;
    const kindAction = page.kind === 'home' && !hasProjects ? 'show its content' : k.action;
    const html = render(pageTemplate, {
      lang: esc(config.lang),
      canonical: page.kind === 'notfound' ? '' : esc(url),
      themeColor: esc(config.themeColor),
      hasTheme,
      title: esc(page.title),
      description: esc(page.description),
      robots: page.robots ? esc(page.robots) : '',
      social,
      siteName: esc(config.name),
      ogDescription: esc(page.ogDescription || page.description),
      ogImage: esc(`${config.url}/${og.path}`),
      ogImageType: esc(og.type),
      ogImageWidth: esc(og.width),
      ogImageHeight: esc(og.height),
      ogImageAlt: esc(og.alt),
      bodyAttrs: k.dataPage ? ` data-page="${esc(page.slug)}"` : '',
      skipHref: kindSkip ? kindSkip[0] : '',
      skipLabel: kindSkip ? kindSkip[1] : '',
      hasProjects,
      hasProfileCredit,
      brandName: esc(data.brand.name),
      tagline: esc(page.tagline || config.tagline),
      noscriptAction: kindAction || '',
      noscriptLinks,
      noscriptFind: hasProjects ? 'find our projects on' : 'find us on',
      logo: esc('/' + data.brand.logo),
      main: render(mainTemplate(page.kind), { hasProjects, hasFeaturedCard }, `main/${page.kind}`),
      backToTop: k.backToTop,
      scripts: scriptTags(page.kind, features)
    }, `page ${file}`);
    write(path.join(out, file), html);
  }

  // The Changelog page reads its releases from the site's CHANGELOG.md, so the file stays the one place they are written.
  if (config.pages.some(p => p.kind === 'changelog')) {
    const file = path.join(siteDir, 'CHANGELOG.md');
    if (!fs.existsSync(file)) fail(`sites/${id}/CHANGELOG.md not found (the "changelog" page needs it)`);
    const releases = parseChangelog(read(file), `sites/${id}/CHANGELOG.md`);
    if (!releases.length) fail(`sites/${id}/CHANGELOG.md has no "## vX.Y.Z — date" releases`);
    write(path.join(out, 'changelog-data.js'),
      `/* Generated from CHANGELOG.md by scripts/build.js; edit that file instead. */\nconst CHANGELOG_DATA = ${JSON.stringify(releases)};\n`);
  }

  // manifest.json
  write(path.join(out, 'manifest.json'), render(read(path.join(CORE, 'templates', 'manifest.json')), {
    name: jsonEsc(config.name),
    shortName: jsonEsc(config.shortName),
    description: jsonEsc(config.description),
    lang: jsonEsc(config.lang),
    backgroundColor: jsonEsc(config.backgroundColor),
    themeColor: jsonEsc(config.themeColor)
  }, 'manifest.json'));

  // sitemap.xml and robots.txt
  const urls = config.pages.filter(p => p.sitemap !== false).map(p => {
    const loc = p.slug ? `${config.url}/${p.slug}` : `${config.url}/`;
    return `  <url>\n    <loc>${esc(loc)}</loc>\n${p.lastmod ? `    <lastmod>${esc(p.lastmod)}</lastmod>\n` : ''}  </url>`;
  });
  write(path.join(out, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  write(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${config.url}/sitemap.xml\n`);

  // sw.js: the shell list is every page plus the scripts, styles, manifest, fonts and logo this site ships.
  const files = listFiles(out);
  const shell = [
    '/',
    ...config.pages.filter(p => p.slug && p.kind !== 'notfound').map(p => `/${p.slug}`),
    ...files.filter(f => !f.includes('/') && /\.(css|js)$/.test(f) && f !== 'sw.js' && f !== '404.js').sort().map(f => `/${f}`),
    '/manifest.json',
    ...files.filter(f => /^fonts\/.*\.woff2$/.test(f)).sort().map(f => `/${f}`),
    '/' + data.brand.logo
  ];
  // Cache name = <prefix>-cache-v<core version>.<site version>. The core version (core/core.json) changes
  // every site's cache; the site version (cacheVersion in site.config.js) changes only this site's.
  const { cacheVersion: coreCacheVersion } = JSON.parse(read(path.join(CORE, 'core.json')));
  const siteCacheVersion = config.cacheVersion === undefined ? 1 : config.cacheVersion;
  if (!Number.isInteger(siteCacheVersion) || siteCacheVersion < 1) {
    throw new Error(`${config.id}: cacheVersion in site.config.js must be a whole number, 1 or more`);
  }
  write(path.join(out, 'sw.js'), render(read(path.join(CORE, 'sw.template.js')), {
    cache: `${config.cachePrefix}-cache-v${coreCacheVersion}.${siteCacheVersion}`,
    shell: shell.map((f, i) => `  '${f}'${i < shell.length - 1 ? ',' : ''}`).join('\n')
  }, 'sw.js'));

  return { out, pages: config.pages.length, files: listFiles(out).length };
}

// ---------- main ----------

const all = fs.readdirSync(SITES, { withFileTypes: true }).filter(e => e.isDirectory() && !e.name.startsWith('_')).map(e => e.name);
const wanted = process.argv.slice(2);
const targets = wanted.length ? wanted : all;
for (const id of targets) if (!all.includes(id)) { console.error(`No site "${id}". Sites: ${all.join(', ')}`); process.exit(1); }

let failed = false;
for (const id of targets) {
  try {
    const r = buildSite(id);
    console.log(`built ${id}: ${r.pages} pages, ${r.files} files -> ${path.relative(ROOT, r.out)}/`);
  } catch (err) {
    failed = true;
    console.error(`FAILED ${id}: ${err.message}`);
  }
}
process.exit(failed ? 1 : 0);
