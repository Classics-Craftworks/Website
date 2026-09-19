# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com).

## v0.10.0 — 2026/09/19

### Added
- New "Other Projects" section (collapsed by default)
- New "unsupported" channel (blue)
- The following projects have been added to their respective sections:
  - Zisteau Pigmen
  - New Sword Blocking (unsupported)
  - CraftHorizon

### Changed
- Reduced the number of peek icons from 5 to 4

## v0.9.0 — 2026/09/19

### Added
- Custom 404 page for invalid or unavailable URLs

## v0.8.0 — 2026/09/19

### Added
- Reworked section headers
  - The whole bar is clickable now (instead of just the text) and made to look more like a button
  - Each section now shows how many projects are inside it
  - A small preview of project icons peeks out on the right side of a collapsed section and fades away once you expand it

## v0.7.1 — 2026/09/19

### Added
- Shrink animation when clicking on section collapse/expand buttons

### Changed
- Improvements to section collapse/expand animation & sped up the animation again
- Slight tweaks to shrink animation on all buttons

## v0.7.0 — 2026/09/19

### Added
- Persistence for collapsed sections, so their state is retained when the page is refreshed

### Changed
- Sped up animation when collapsing or expanding sections
- Disabled section toggling while the collapse/expand animation is playing

### Fixed
- Restricted section toggle interactions to section titles and chevrons, preventing accidental toggling when clicking empty header space

## v0.6.1 — 2026/09/18

### Added
- More fallback fonts for different and older operating systems and browsers

### Changed
- Reverted the status dot size change from v0.6.0

## v0.6.0 — 2026/09/18

### Added
- Collapsible sections, allowing sections to be expanded or collapsed using a new chevron icon next to section headers

### Changed
- Changed the download icon
- Slightly increased the size of status dots and reduced the spacing around them

## v0.5.5 — 2026/09/18

### Added
- Alpha transparency scale to `styles.css` for easier access to and adjustment of alpha values

### Changed
- Project type icons are now explicitly defined in `data.js` instead of being automatically inferred
- Merged fonts since there was no distinction between them

## v0.5.4 — 2026/09/18

### Changed
- Colour-matched separators in channel headers
- Reduced padding at the top and bottom of the page
- Darkened separators between projects
- Brightened accent colours

### Fixed
- Brand header still using `innerHTML`
- Missing logo size in `index.html`

## v0.5.3 — 2026/09/18

### Added
- Added a canonical link tag to `index.html`
- Added `sitemap.xml` & `robots.txt`

### Changed
- Moved logo down by 1px

### Removed
- `<h1>` tag from brand name in `data.js`
- Duplicate `title` tag in `index.html`
- Unused `meta` object from `data.js` - hardcoded in `index.html` as of v0.3.6

## v0.5.2 — 2026/09/17

### Added
- Added tooltips to social links in the footer
- Added proper icon credits to the footer

### Changed
- Changed footer social link icons from circles to rounded squares
- Renamed the X label to "X / Twitter"
- Increased the width of the footer
- Capitalised the footer disclaimer
- Moved the site version number to the bottom of the footer
- Increased the version number's size, opacity, and margin

## v0.5.1 — 2026/09/17

### Fixed
- Project link icons flashing on hover

## v0.5.0 — 2026/09/17

### Visual Refresh
- Updated the overall colour scheme from a warm brown-orange to a dark grey
- Updated channel colours:
  - Stable: Changed from bright orange to vibrant green
  - Beta: Changed from purple to warm amber, keeping it distinct without overpowering the page
  - Alpha: Softened the red to a slightly more pink tone
- Increased the rounding on project icons
- Updated the header font
- Updated the body text fonts
- Made project links less visually prominent
- Added a subtle shrink animation when clicking on buttons
- Reduced the font weight of version pills and slightly increased their letter spacing
- Increased the logo size and raised it slightly
- Slightly increased project icon sizes

### Changed
- Changed the cursor to `not-allowed` when hovering over unavailable buttons
- Reorganised project links to place the most important links first

## v0.4.4 - 2026/09/17

### Changed
- Added a line break in the tagline
- Increased the size of the logo slightly

## v0.4.3 - 2026/09/16

### Changed
- Switched preview cards to use the logo instead

### Removed
- Banner image used for preview cards

## v0.4.2 - 2026/09/16

### Changed
- Slightly increased the hover brightness of Stable channel buttons again, based on user feedback
- Updated the tagline in the site header to match its wording across Classic's Craftworks' other online presences

## v0.4.1 - 2026/09/16

### Changed
- Increased the hover brightness of Stable channel buttons while keeping Beta and Alpha buttons at their existing brightness

## v0.4.0 - 2026/09/16

### Added
- Alpha channel (red) for experimental builds

### Changed
- Renamed "releases" to "channels" throughout the codebase for clearer terminology
- Simplified channel configuration, making it easier to change each channel's colour

## v0.3.7 - 2026/09/16

### Changed
- Swapped X/Twitter preview cards to `summary` type
- Changed preview card descriptions to include tagline

## v0.3.6 - 2026/09/16

### Fixed
- Fixed preview cards

## v0.3.5 - 2026/09/16

### Added
- Preview cards so site links look good when shared on Discord, X/Twitter and other platforms

## v0.3.4 - 2026/09/16

### Added
- Modrinth links to data pack/mod projects
- "Java" prefix to Minecraft version numbers

### Changed
- Website version link now goes to changelog
- Reverted the "Release" channel back to "Stable"
- Beta channel is now labelled "Pre-Release" or "Release Candidate" when applicable

## v0.3.3 - 2026/09/15

### Changed
- Widened site content again

### Fixed
- Version pills no longer wrap to their own line - they now stay inline
- Long version numbers (e.g. betas) now truncate with an ellipsis instead of overflowing their pill

## v0.3.2 - 2026/09/15

### Changed
- Filled in the Resource Pack brush icon
- Shrunk the Data Pack brackets icon
- Enlarged the Mod box icon

## v0.3.1 - 2026/09/15

### Changed
- Swapped the Release colour from green to orange

### Fixed
- Missing Resource Pack, Data Pack and Mod icons (icon filenames had changed)

## v0.3.0 - 2026/09/15

### Added
- Redesigned release sections to support separate mod versions and "unavailable" releases

### Changed
- Widened site content
- Improved version pill styling to match each release channel's colour
- Removed the "MC" prefix before Minecraft versions
- Slightly increased the size of the header and logo
- Slightly increased the size of section headings

### Fixed
- Wrong Minecraft versions listed for all betas

## v0.2.6.2 - 2026/09/15

### Fixed
- Incorrect Silly Eatables Minecraft version

## v0.2.6.1 - 2026/09/15

### Changed
- Updated data pack and mod downloads for Minecraft 26.3

## v0.2.6 - 2026/09/15

### Fixed
- Classic's Disc Tweaks betas being incorrectly listed under the Release channel

## v0.2.5 - 2026/09/15

### Changed
- Renamed the "Stable" branch to "Release"
- Removed the page header animation

### Fixed
- Alignment of project icons and content

## v0.2.4 - 2026/09/15

### Fixed
- Incorrect Silly Eatables version

## v0.2.3 - 2026/09/15

### Changed
- Renamed "Resource Pack" to "Download" on resource pack download buttons

## v0.2.2 - 2026/09/15

### Changed
- Improved the Download and Modrinth link icons
- Improved the Classic's Craftworks logo and favicon

## v0.2.1 - 2026/09/15

### Fixed
- Page failing to load correctly
- Missing link icons

## v0.2.0 - 2026/09/15

### Added
- Better link icons
- Website version link in the footer
- Version pills beside Stable and Beta release labels
- Green Stable and contrasting Beta status indicators
- A subtle accent colour for Beta releases
- Better icons for GitHub, SpigotMC and Modrinth links

### Changed
- Separated Stable and Beta downloads
- Stable downloads now use filled orange buttons
- Beta downloads now use outlined buttons
- Lightened download panels
- Reduced the use of orange for borders and decorative elements
- Reduced project icon sizes
- Increased project title prominence
- Standardised download button widths and increased padding
- Tightened header spacing
- Made separators and borders more subtle

## v0.1.1 - 2026/09/14

### Changed
- Changed tagline to "Sometimes useful. Always Minecraft."

## v0.1.0 - 2026/09/14

### Added
- Initial Classic's Craftworks website
- Data Packs & Mods project listings
- Project descriptions and Minecraft version badges
- GitHub, SpigotMC and Wiki links
- Data Pack, Mod and Beta download links
- Initial visual design, using placeholder graphics