# Classic's Craftworks Websites

The source for the Classic's Craftworks family of websites. They are plain static sites (HTML, CSS and JavaScript, no framework) that share one codebase.

## Sites

| Site | Address | What it is |
| --- | --- | --- |
| [Classic's Craftworks](sites/classics-craftworks) | [classicscraftworks.co.uk](https://classicscraftworks.co.uk) | Minecraft Java Edition data packs, mods and resource packs |
| [CraftHorizon](sites/crafthorizon) | crafthorizon.classicscraftworks.co.uk (not yet live) | Whitelisted Minecraft server with a focus on vanilla+ Survival and Creative gameplay |

## How the repository is laid out

- `core/` is the shared code: scripts, styles, fonts, icons and page templates.
- `sites/` has one folder per website, holding its content, images, theme and settings.
- `scripts/` builds the sites into `dist/`.
