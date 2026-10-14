// Updates the "Downloads" stat in stats.js from Modrinth + SpigotMC (via Spiget).
//
// Projects are read from data.js, so new projects are picked up automatically:
//   - Modrinth: every modrinth.com/<type>/<slug> link, except servers,
//     organizations and anything in EXCLUDE_SLUGS.
//   - SpigotMC: every spigotmc.org/resources/<name>.<id>/ link.
//
// Safety: if any request fails, a project is missing from the response, or the
// new total is lower than the one on the site, nothing is written.
//
// Usage: node .github/scripts/update-stats.mjs [--dry-run]

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const DATA_FILE = resolve(ROOT, 'data.js');
const STATS_FILE = resolve(ROOT, 'stats.js');

const EXCLUDE_SLUGS = new Set(['crafthorizon']);
const IGNORED_MODRINTH_TYPES = new Set(['server', 'organization', 'user', 'collection']);
const ROUND_DOWN_TO = 1000; // 1000 -> "125,000+"; set to 1 for exact numbers
const USER_AGENT = 'Classics-Craftworks/Website (stats updater; https://github.com/Classics-Craftworks/Website)';
const DRY_RUN = process.argv.includes('--dry-run');

// ---------- find projects in data.js ----------

function loadSiteData() {
  // data.js declares `const SITE_DATA = {...}`; evaluate it in a sandbox.
  return vm.runInNewContext(readFileSync(DATA_FILE, 'utf8') + '\n;SITE_DATA', {}, { filename: 'data.js' });
}

function collectProjects(siteData) {
  const modrinth = new Set();
  const spigot = new Map(); // id -> name

  for (const section of siteData.sections || []) {
    for (const project of section.projects || []) {
      const urls = [
        ...(project.links || []).map(l => l.url),
        ...(project.channels || []).flatMap(c => (c.downloads || []).map(d => d.url))
      ].filter(Boolean);

      for (const url of urls) {
        let m = url.match(/^https:\/\/modrinth\.com\/([a-z-]+)\/([^/?#]+)/i);
        if (m && !IGNORED_MODRINTH_TYPES.has(m[1].toLowerCase()) && !EXCLUDE_SLUGS.has(m[2].toLowerCase())) {
          modrinth.add(m[2]);
        }
        m = url.match(/^https:\/\/(?:www\.)?spigotmc\.org\/resources\/([^/.]+)\.(\d+)/i);
        if (m) spigot.set(m[2], m[1]);
      }
    }
  }
  return { modrinth: [...modrinth], spigot };
}

// ---------- fetching ----------

async function getJson(url, tries = 3) {
  let lastError;
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (i < tries) await new Promise(r => setTimeout(r, 2000 * i));
    }
  }
  throw new Error(`${url}: ${lastError.message}`);
}

async function modrinthDownloads(slugs) {
  const url = `https://api.modrinth.com/v2/projects?ids=${encodeURIComponent(JSON.stringify(slugs))}`;
  const projects = await getJson(url);
  const found = new Map();
  for (const p of projects) {
    found.set(p.slug.toLowerCase(), p.downloads);
    found.set(p.id, p.downloads);
  }
  let total = 0;
  for (const slug of slugs) {
    const n = found.get(slug.toLowerCase());
    if (!Number.isFinite(n)) throw new Error(`Modrinth did not return a download count for "${slug}"`);
    console.log(`  Modrinth  ${slug}: ${n}`);
    total += n;
  }
  return total;
}

async function spigotDownloads(resources) {
  let total = 0;
  for (const [id, name] of resources) {
    const data = await getJson(`https://api.spiget.org/v2/resources/${id}`);
    if (!Number.isFinite(data.downloads)) throw new Error(`Spiget did not return a download count for ${name} (${id})`);
    console.log(`  SpigotMC  ${name}: ${data.downloads}`);
    total += data.downloads;
  }
  return total;
}

// ---------- stats.js ----------

const DOWNLOADS_RE = /(label:\s*"Downloads",\s*value:\s*")([^"]*)(")/;
const UPDATED_RE = /(lastUpdated:\s*")([^"]*)(")/;

function formatTotal(total) {
  const rounded = Math.floor(total / ROUND_DOWN_TO) * ROUND_DOWN_TO;
  return rounded.toLocaleString('en-US') + (ROUND_DOWN_TO > 1 ? '+' : '');
}

function today() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

// ---------- main ----------

const { modrinth, spigot } = collectProjects(loadSiteData());
if (!modrinth.length) throw new Error('No Modrinth projects found in data.js');
console.log(`Found ${modrinth.length} Modrinth projects and ${spigot.size} SpigotMC resources.`);

const total = (await modrinthDownloads(modrinth)) + (await spigotDownloads(spigot));
console.log(`Combined total: ${total}`);

const source = readFileSync(STATS_FILE, 'utf8');
const current = source.match(DOWNLOADS_RE);
if (!current) throw new Error('Could not find the "Downloads" stat in stats.js');

const oldValue = current[2];
const newValue = formatTotal(total);
const oldNumber = Number(oldValue.replace(/\D/g, ''));
const newNumber = Number(newValue.replace(/\D/g, ''));

if (newNumber < oldNumber) {
  throw new Error(`New total (${newValue}) is lower than the current one (${oldValue}); not writing.`);
}
if (newValue === oldValue) {
  console.log(`Downloads already "${oldValue}"; nothing to do.`);
  process.exit(0);
}

console.log(`Downloads: "${oldValue}" -> "${newValue}"`);
if (DRY_RUN) {
  console.log('Dry run; stats.js not modified.');
  process.exit(0);
}

let updated = source.replace(DOWNLOADS_RE, `$1${newValue}$3`);
updated = updated.replace(UPDATED_RE, `$1${today()}$3`);
writeFileSync(STATS_FILE, updated);
console.log('stats.js updated.');
