# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com).

## v3.1.2 — 2026/10/08

### Fixed
- Notification dot hover tooltip position

## v3.1.1 — 2026/10/08

### Changed
- Made separators between projects on project pages thicker and more visible
- Swapped version separator in project buttons on the home page for better readability
- Improvements to image loading on the home page

### Fixed
- Screen readers announcing each project's name twice on the Data Packs & Mods, Resource Packs and Other Projects pages

## v3.1.0 — 2026/10/07

### Changed
- The "#projects-intro" deep link has been renamed to "#projects"
  - Bookmarks or links still using "#projects-intro" will direct to the top of home page instead of the Projects section
- The notification dot is now hidden from the header when the dropdown is open
- Reduced the notification tooltip hover area
- Moved the "data pack" and "mod" labels to the bottom of the Featured Project box
- Increased padding above and below the Featured Project heading

### Fixed
- Notification counter not using the right font
- Notification counter being slightly misaligned in dropdowns on mobile

### Removed
- Removed version numbers from the Featured Project box

## v3.0.1 — 2026/10/06

### Changed
- Changed the "Explore Projects" button to "Explore" on the splash screen
- Changed project card headers to "Browse all X projects" to make it clearer that they are buttons
- Reduced height of the splash screen
- Reduced width of statistics boxes on mobile

### Fixed
- Featured Project image being cut-off on mobile
- Inconsistent copyright text wrapping on mobile

## v3.0.0.1 — 2026/10/06

### Changed
- Updated for Java 26.4-snapshot-3 & new data pack betas

## v3.0.0 — 2026/10/06

### Added
- New home page splash screen featuring a featured project
- New About page
- Project count placeholder for the Home page's Stats section and About page
- `/` and `Ctrl+K` / `Cmd+K` keyboard shortcuts for Search
- Icons for unavailable download buttons
- Icons for redistribution notices
- Warning when a page fails to load

### Changed
- Redesigned and consolidated the header and navigation bar
- Redesigned home page project buttons to display more information and link directly to projects
- Redesigned footer
- Widened pages
- Updated page headings for improved screen-reader accessibility
- Improved support for installing the website as an app across more browsers
- Updated hover colours, button radii, font weights, and other visual inconsistencies
- Improved layout and spacing throughout the site
- Various clean-ups and optimisations
- Updated statistics
- Updated sitemap

### Fixed
- Various layout issues on mobile
- Inconsistent hover colours and other visual styling inconsistencies
- Incorrect font weights

## v2.3.1 — 2026/10/04

### Changed
- The logo and site name now appear immediately when a page opens, instead of popping in a moment later
- Improvements for fonts & font loading
- Project icons now reserve their space as the page loads, so the layout no longer shifts slightly when images arrive
- Swapped spigot icon again to a more simplified version
- Updated sitemap

### Fixed
- 404 page breaking on nested URLs

## v2.3.0.1 — 2026/10/03

### Changed
- Updated statistics

## v2.3.0 — 2026/09/30

### Added
- Projects heading above home page buttons

### Changed
- Moved GitHub & Modrinth links from the header to the footer
- Centred the logo and text in the header
- Reduced header size & increased its text size
- Reduced home button header size & padding on mobile

### Removed
- Header tagline

## v2.2.0.1 — 2026/09/29

### Changed
- Updated statistics
- Updated for Java 26.4-snapshot-2

## v2.2.0 — 2026/09/29

### Added
- Pixelated background

## v2.1.4 — 2026/09/28

### Changed
- Reduced amount of padding at the very bottom of all pages
- Mobile browser toolbar and the installed-app splash screen now match the site's dark blue background
- The site now has proper 192px and 512px icons for "Install app" or "Add to Home Screen" in some browsers
- 404 page now fills the whole screen on mobile, matching the rest of the site
- Link previews now include a site name and image description

## v2.1.3 — 2026/09/27

### Changed
- Updated footer layout:
  - Increased font weight of copyright line
  - Grouped legal disclaimer & link icon credits together
  - Slightly reduced size of version number
  - More padding between elements
  - Swapped positions X/Twitter & Discord buttons

## v2.1.2 — 2026/09/27

### Changed
- Updated playtime statistic
- Updated document icon

### Fixed
- Unaffiliated reupload notice appearing on Other Projects page
- Home card arrow being misaligned

## v2.1.1 — 2026/09/27

### Changed
- Updated download, link & bracket icons again

## v2.1.0 — 2026/09/27

### Added
- Unaffiliated reupload notice to data pack/mod & resource pack pages
- "Est. 2017" to the footer

### Changed
- Increased the size of the notification dot on mobile
- Updated download, link, spigot, reddit, wrench & bracket icons

### Fixed
- Notification dot tooltip being cut off by the edge of the screen

## v2.0.1 — 2026/09/26

### Fixed
- Nav bar icons using generic link icon instead of page-specific ones
- Nav bar buttons directing to .html pages

## v2.0.0 — 2026/09/26

### Added
- New home page, with big buttons to each project-type page and a stats section
- New project-type pages
- Website to Other Projects page
- New search system with a results dropdown and direct navigation to matching pages
- Navigation bar icons
- Notification indicator on the navigation bar for undismissed New and Updated badges

### Changed
- Visual refresh with a new blue theme

### Fixed
- Navigation bar and page alignment
- Some mobile layout inconsistencies
- Incorrect apostrophes in deep links

### Removed
- Old navigation systems, including collapsible sections and project-type deep links

## v1.0.1 — 2026/09/24

### Changed
- The header now centres at smaller page sizes

## v1.0.0 — 2026/09/23

Declared the site stable and ready for its first major release. Development will slow down significantly from here on.

### Fixed
- Nav bar and channel wrapping issues on mobile

## v0.19.0 — 2026/09/23

### Changed
- Switched project icons to WebPs
- Switched link icons to SVGs

## v0.18.1 — 2026/09/23

### Changed
- Improved mobile layouts, including wrapping and alignment

### Fixed
- Navigation bar button alignment on mobile

## v0.18.0 — 2026/09/22

### Added
- Projects now show a link to older versions and snapshots on Modrinth and GitHub, right under the download options

### Changed
- Reworked the nav bar's colour scheme for better contrast and readability
- Slightly tightened padding between projects
- Section headers can now be deep-linked and shared directly - expanding a section updates the URL without jumping to the section
- Made buttons and icons (copy link, clear search, channel badges, download buttons) easier to tap accurately on touch screens
- Clicking or tapping on a "Not available" download button now shows why it's unavailable, instead of only working on hover
- Improved wording of unavailable data/resource pack download tooltip

### Fixed
- Potentially fixed the search box zooming in unexpectedly when tapped on iPhone/Safari (don't have an iPhone to test this)

## v0.17.1 — 2026/09/22

### Changed
- Improved search bar behaviour when collapsing and expanding sections - section states are now remembered when the search bar is cleared
- Improved how navigation buttons, deep links and section header buttons interact
- Completely removed old code for project version handling

### Fixed
- Section headers being hidden beneath the navigation bar when navigating to them via a deep link or nav bar buttons

## v0.17.0 — 2026/09/22

### Changed
- Revamped the navigation bar styling to stand out a bit more from the rest of the content (colours to be finalised)
- Reworked how project versions are handled
  - Each data pack & mod release can now have its own version number

## v0.16.2.1 — 2026/09/22

### Changed
- Updated for new Better Craftables & Better Unpackables betas
- Updated for Java 26.4 development cycle

## v0.16.2 — 2026/09/22

### Fixed
- Deep links not being properly cleared when collapsing a section

## v0.16.1 — 2026/09/22

### Added
- The site now shows a fallback message with direct links to Modrinth and GitHub pages if JavaScript is disabled or blocked in a browser, instead of a blank page
- "Skip to projects" link for keyboard users to jump past the header and navigation to the project list without having to tab through everything first
- Structured data describing the site and its projects, to help search engines understand and surface them more accurately

### Changed
- Mobile PWA improvements, including proper icon and matching browser theme colour.

## v0.16.0 — 2026/09/22

### Added
- Tooltips when hovering over Unavailable download buttons to inform users why the download is not available

## v0.15.0 — 2026/09/21

### Added
- "New" & "Updated" badges that can be dismissed by visitors
  - When dismissed, it will re-appear when a new version is added to the site

## v0.14.2 — 2026/09/21

### Changed
- Optimisations and improvements
  - Search should now be faster
  - Page should load quicker

### Fixed
- Navigation bar buttons not being highlighted when a section is accessed via a deep link
- Sections jumped to via a deep link not showing as expanded in the navigation bar
- Clicking a section in the nav bar right after landing on it via a link now collapses it properly, instead of appearing to do nothing

## v0.14.1 — 2026/09/21

### Changed
- Moved "copy link" icons slightly closer to their text
- Navigation bar now uses deep links for easier navigation and sharing via browser's address bar

## v0.14.0 — 2026/09/21

### Added
- Deep links for each section and each project (e.g. `classicscraftworks.co.uk/#better-craftables` to jump to the Better Craftables section)
  - Additionally, there is now a copy link icon next to each section & project for easier sharing
- An 'x' icon to clear text from the search bar

### Changed
- Search now also looks for Minecraft versions & project versions
- Removed the separator between the header and navigation bar, and reduced the padding between them
- Changed "Back to home" button on 404 page to "Go Back"

### Fixed
- 404 page footer not matching with the main page

## v0.13.2 — 2026/09/21

### Changed
- Improved colours across the site for better readability and accessibility
- Reduced the size of social link icons in the footer
- Slightly reduced section header padding
- Updated wording of link icons credit in the footer
- Moved logo down by 2px

### Fixed
- Incorrect colours for the Unsupported channel

## v0.13.1 — 2026/09/20

### Changed
- Slightly brightened soft text to pass contrast tests, most noticable in the footer
- Changed round navigation bar buttons to rounded squares to fit the rest of the site
- More animations now respect `prefers-reduced-motion` settings
- Moved the Expand/Collapse All button away from the other nav bar buttons, and make the separator more visible

### Fixed
- Search bar having an ugly outline when active
- Keyboard focus highlights being cut off at the edges of the page
- Social link tooltips being cut off in the footer

## v0.13.0 — 2026/09/20

### Added
- Various improvements for mobile, including button alignment and text wrapping improvements

## v0.12.0 — 2026/09/20

### Added
- Navigation bar to the top of the page
  - Buttons to jump to sections
  - Button to expand/collapse all sections
  - Search bar

### Fixed
- Missing exclamation mark from New Sword Blocking's description

## v0.11.1 — 2026/09/19

### Changed
- Decreased size of section headers slightly
- Decreased the overlap of peek icons
- Slightly increased the size of peek icons

## v0.11.0 — 2026/09/19

### Added
- "Back to top" button, appears when the user has scrolled 400px down the page

## v0.10.1 — 2026/09/19

### Changed
- Made "Unsupported" channel download buttons match Alpha/Beta instead of Stable

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