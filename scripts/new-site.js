#!/usr/bin/env node
/* Creates a new site by copying an existing one as a starting point.

     node scripts/new-site.js <new-id> --url https://example.com [--from classics-craftworks]

   The copy builds and runs straight away; then replace its content (see the README checklist). */

const fs = require('fs');
const path = require('path');

const SITES = path.resolve(__dirname, '..', 'sites');
const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const id = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const url = (opt('--url') || '').replace(/\/+$/, '');
const from = opt('--from') || 'classics-craftworks';

if (!id || !/^[a-z0-9][a-z0-9-]*$/.test(id) || !url) {
  console.error('Usage: node scripts/new-site.js <new-id> --url https://example.com [--from <existing-id>]');
  process.exit(1);
}
if (fs.existsSync(path.join(SITES, id))) { console.error(`sites/${id} already exists`); process.exit(1); }
if (!fs.existsSync(path.join(SITES, from))) { console.error(`sites/${from} does not exist`); process.exit(1); }

fs.cpSync(path.join(SITES, from), path.join(SITES, id), { recursive: true });

const configFile = path.join(SITES, id, 'site.config.js');
let config = fs.readFileSync(configFile, 'utf8');
config = config
  .replace(/^(\s*id: )'[^']*'/m, `$1'${id}'`)
  .replace(/^(\s*url: )'[^']*'/m, `$1'${url}'`)
  .replace(/^(\s*cachePrefix: )'[^']*'/m, `$1'${id}'`)
  .replace(/^(\s*cacheVersion: )\d+/m, '$11');
fs.writeFileSync(configFile, config);

console.log(`Created sites/${id} from sites/${from}.

Next:
  npm run dev -- ${id}      preview it
  then see "Adding a site" in README.md for what to replace (name, links, projects, images, colours).`);
