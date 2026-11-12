# Sites

Shared code in `core/`, one folder per site in `sites/`. Fix something in `core/` once and every site gets it the next time it is built and deployed.

```
core/
  static/            shared scripts, styles.css, fonts, icon set (copied into every site)
  templates/         page.html + main/*.html, manifest.json (turned into each site's pages)
  sw.template.js     the service worker (cache name and file list filled in per site)
  core.json          cacheVersion: bump it when the service worker strategy changes
sites/
  classics-craftworks/
    site.config.js   name, domain, colours, page titles and descriptions
    public/          data.js, stats.js, latest-updates.js, images/ (and optional theme.css)
scripts/             build.js, dev.js, new-site.js
dist/                build output, one folder per site (not committed)
```

A site is built in layers, later ones winning: `core/static/`, then the site's `public/` (a file with the same path replaces the core one), then the generated files (HTML, `manifest.json`, `sitemap.xml`, `robots.txt`, `sw.js`).

## Sites

| Folder | Domain | Hosting |
| --- | --- | --- |
| `classics-craftworks` | classicscraftworks.co.uk | GitHub Pages (this repo's workflow) |
| `crafthorizon` | crafthorizon.classicscraftworks.co.uk (assumed; change `url` in its `site.config.js`) | not set up yet; see Hosting |

## Commands (Node 18+, no dependencies)

```
npm run build                        build every site into dist/
npm run build -- classic36           build one
npm run dev -- classics-craftworks   preview at http://localhost:8080, rebuilds on save
npm run new-site -- classic36 --url https://classic36.classicscraftworks.co.uk
```

## Where changes go

| Change | Edit |
| --- | --- |
| Bug fix or feature for all sites | `core/static/*`, `core/templates/*` |
| One site's projects, news, about text, links | `sites/<id>/public/data.js`, `latest-updates.js`, `stats.js` |
| One site's page titles, descriptions, domain | `sites/<id>/site.config.js` |
| One site's look | `sites/<id>/public/theme.css` (loaded after `styles.css` when it exists) |
| One site needing a different version of a core file | put a file at the same path in `sites/<id>/public/` |

`theme.css` can override the `:root` variables in `styles.css` (`--accent`, `--accent-rgb`, `--on-accent`, `--bg`, `--surface` and so on). The browser's `theme-color` follows `--bg` automatically, including the light and OLED themes. Note that `styles.css` sets the light and OLED palettes with more specific selectors (`:root[data-theme="light"]`, `:root[data-theme="oled"]`), so to change those, override them with the same selectors in `theme.css`. `themeColor` in `site.config.js` is only the starting value before the stylesheet loads; keep it equal to the site's dark `--bg`.

The build checks that `site.config.js` pages and the nav in `data.js` (`SITE_DATA.pages`) list the same pages, and that the brand logo exists, so a mismatch fails the build instead of shipping a broken menu.

## Adding a site

1. `npm run new-site -- <id> --url https://<its-domain>` copies an existing site as a working starting point.
2. In `sites/<id>/site.config.js`: set `name`, `shortName`, `description`, `tagline`, colours, `noscriptLinks`, and every page's title and description.
3. In `sites/<id>/public/data.js`: replace `brand`, `pages`, `sections` (projects), `socials`, `footer` and `about`. Replace `latest-updates.js` and `stats.js` with the new site's.
4. Replace the images in `public/images/`: `logo.png`, `favicon.png`, `apple-touch-icon.png`, `icon-*.png`, `share.jpg` and the project images.
5. Optionally add `public/theme.css`.
6. `npm run dev -- <id>` to check it, then hosting (below).

## Hosting

GitHub Pages serves one site per repository, so this repo's workflow (`.github/workflows/deploy.yml`) publishes `classics-craftworks` only. In the repo settings, set Pages > Source to **GitHub Actions**; the custom domain `classicscraftworks.co.uk` stays as it is.

Every push and pull request builds all sites, so a change to `core/` that breaks any site is caught before it merges.

For the other sites, use a host that takes several projects from one repository, such as Cloudflare Pages or Netlify. Create one project per site with:

- Build command: `npm run build -- <id>`
- Output directory: `dist/<id>`
- Custom domain: the site's domain (for a subdomain such as `classic36.classicscraftworks.co.uk`, add a CNAME record pointing at the host).

Each domain is its own origin, so visitor settings and the service worker cache are separate per site.
