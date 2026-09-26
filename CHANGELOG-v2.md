# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com).

## v2.0.0-dev.10 — 2026/09/26

### Added
- Added a tooltip to the yellow nav bar notification dot

### Changed
- Updated yellow nav bar notification dot to include the number of undismissed badges
- Improved padding around statistic note

## v2.0.0-dev.9 — 2026/09/26

### Added
- Yellow notification dot to nav bar when there's an undismissed New or Updated badge

### Changed
- Arrow on home page buttons now moves more on hover
- Tweaked the layout of the home page's Stats section and updated the notice below it
- Expanded border size around project icons on home buttons
- Small clean up of code & comments

### Fixed
- Font loading issue
- No results search message using curly quotation marks

### Removed
- Highlighted border from project icons on home buttons on hover

## v2.0.0-dev.8 — 2026/09/26

### Added
- Stats section to home page

### Changed
- Updated Classic's Craftworks project icon

## v2.0.0-dev.7 — 2026/09/25

### Added
- Redesigned home page buttons with a project counter (not sure if final yet)

### Changed
- Tweaked new design colours slightly
- Updated "back to top" button colours to match the rest of the site

### Fixed
- Apostrophes in deep links (e.g. "#classics-disc-tweaks" was "#classic-s-disc-tweaks")

## v2.0.0-dev.6 — 2026/09/25

### Visual Refresh (V2)
- New blue theme
- Switched Unsupported channel colour from blue to grey
- Icons added to nav bar buttons
- Less rounded nav bar
- More rounded search box
- Moved the nav bar down slightly when stuck to the top of the page

## v2.0.0-dev.5 — 2026/09/25

### Added
- The word "provided" to the link icon credits in the footer

### Changed
- "Go Back" button on 404 page to "Go Home"
- Forced browser to use dark colour scheme
- Title font is now pre-loaded
- Updated sitemap
- Reduced the size of the X icon
- Increased the size of the Download icon

### Fixed
- Highlighted border overlapping with content when selecting a search result

### Removed
- Per-page scripts

## v2.0.0-dev.4 — 2026/09/24

### Added
- Re-added search bar - now shows a dropdown of results and takes the user to the correct page when a result is clicked
- Added a project counter to the home page buttons when there are more than 4 projects in a section

## v2.0.0-dev.3 — 2026/09/24

### Added
- Re-added project counters from the old home page to the header of each project page

### Changed
- Reduced text and icon sizes on home page buttons
- Reduced padding around icons on home page buttons
- Increased padding between icons and text on home page buttons
- 404 page now has it's own `404.js` and uses `section-page.js` like other pages
- Updated various comments

### Fixed
- Nav bar & page alignment
- Page elements collapsing into their mobile state at different sizes
- Classic's Craftworks Website GitHub link having a Modrinth icon

### Removed
- Code for:
    - Old collapsible sections, including the peek icons, Expand/Collapse All button and option to have sections open by default
    - Old navigation system, including search and jump buttons
    - Anything else that was unused or redundant

## v2.0.0-dev.2 — 2026/09/24

### Added
- New home page
- Website to Other Projects page

## v2.0.0-dev.1 — 2026/09/24

### Added
- New pages for each project type, with reworked nav bar