#!/usr/bin/env node
/* Local preview: builds a site, serves dist/<site>/ and rebuilds whenever core/ or the site changes.

     node scripts/dev.js classics-craftworks [port]

   Clean URLs (/about -> about.html) and the 404 page work as they do on GitHub Pages. */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const [id, portArg] = process.argv.slice(2);
if (!id) { console.error('Usage: node scripts/dev.js <site-id> [port]'); process.exit(1); }
const port = Number(portArg) || 8080;
const dist = path.join(ROOT, 'dist', id);

const build = () => spawnSync(process.execPath, [path.join(__dirname, 'build.js'), id], { stdio: 'inherit' }).status === 0;
if (!build()) process.exit(1);

let timer;
for (const dir of [path.join(ROOT, 'core'), path.join(ROOT, 'sites', id)]) {
  fs.watch(dir, { recursive: true }, () => { clearTimeout(timer); timer = setTimeout(build, 150); });
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2'
};

http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const candidates = [pathname, pathname + '.html', path.join(pathname, 'index.html')];
  let file = null;
  for (const c of candidates) {
    const full = path.join(dist, c);
    if (full.startsWith(dist) && fs.existsSync(full) && fs.statSync(full).isFile()) { file = full; break; }
  }
  const status = file ? 200 : 404;
  if (!file) file = path.join(dist, '404.html');
  res.writeHead(status, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, () => console.log(`serving ${id} at http://localhost:${port}`));
