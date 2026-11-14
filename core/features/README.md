# Core features

`core/shell/` is what every site gets. A feature here is an optional part a site turns on with
`features: [...]` in its `site.config.js`; a site that doesn't list it doesn't ship its scripts or styles.

| Feature   | For                                   | Provides |
|-----------|---------------------------------------|----------|
| `catalog` | a site with a list of projects        | project pages, release tables, sort and jump list, project cards and the featured carousel on the home page, header search, "new download" dots, project JSON-LD |
| `landing` | a single-purpose site (a game server) | home-page blocks: features, how to join, supported versions |

The build checks the site's `data.js` agrees with its features (for example `sections` needs `catalog`).

## How a feature is made

- `feature.json` lists its scripts. `pages` limits a script to some page kinds; `phase: "late"` loads it after
  the page's own scripts (default: right after the shell, so it can register hooks first).
- Scripts never get called by the shell directly. They register in `SITE_HOOKS` (top of `shell/shell.js`):
  unread sources, placeholders such as `{projects}`, the project list for news, JSON-LD, and the home page's
  redirect / featured card / blocks. A new feature should add a hook there rather than an `if` in the shell.
- `css/*.css` are the feature's rules. `shell/styles.css` holds a one-line marker, `/*@include catalog/release-table*/`,
  at the exact place in the cascade where each file belongs; the build puts the file there, or nothing when the site
  doesn't have the feature. To add a rule, put it in the file; to move it earlier or later, move the marker.
- Rules whose selectors are shared with the shell (a button list that includes `.download-btn`, say) stay in the shell.

## Per-site differences

Wording and names a site wants to differ go in its `data.js` / `site.config.js`, not in the core
(for example `brand.aprilFoolsName`). Colours go in the site's `theme.css`.

## `profile` (personal sites)

| Feature   | For                          | Provides |
|-----------|------------------------------|----------|
| `profile` | a personal "find me" site    | the splash's "Current skin" card (`home.splash.skinCard`), `home.socials` / `home.related` / `home.explore` blocks, the `skins` and `extras` page kinds (`SITE_DATA.skins`, `SITE_DATA.extras`) and the footer's profile picture credit (`footer.profileCredit`) |
