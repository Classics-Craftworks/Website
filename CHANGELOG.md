# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com).

## v4.1.2.1 — 2026-10-28

### Changed
- Updated site statistics [automated]

## v4.1.2 — 2026-10-28

### Changed
- Swapped the exclamation mark for a period in New Sword Blocking's description

### Fixed
- Fixed pages not shows "&" correctly in its browser tab title and in link previews when the page is shared

## v4.1.1.1 — 2026-10-27

### Changed
- Updated for Java 26.4-snapshot-6 and new betas

## v4.1.1 — 2026-10-27

### Fixed
- Fixed automated stats updates not using the new unified date format

## v4.1.0.1 — 2026-10-27

### Changed
- Updated site statistics [automated]

## v4.1.0 — 2026-10-27

### Added
- Pause button for home page carousel
- Tags to archived/unsupported projects on the home page
- Followers stat on the home page, showing the total Modrinth followers across all projects.
- Icons beside each home page stat

### Changed
- Unified the date formats across the site (Oct 27, 2026 -> 27 Oct 2026)
- Made the "jump to projects" sidebar on project pages sticky

### Fixed
- Fixed first-time visitors seeing notification dots on every project
- Fixed pointers on tooltips sometimes being broken on mobile, depending on their position on the page

## v4.0.0.1 — 2026-10-27

### Changed
- Updated download statistics [automated]

## v4.0.0 — 2026-10-26

### Project pages redesign
- Redesigned the project cards. Each project is now a single card with a release table (download types as rows, release channels as columns) in place of the separate channel boxes
- Moved project links and "Older versions" into a footer strip at the bottom of each card
- Added release dates to every download. Releases under a month old show a relative date ("3 days ago") with the full date on hover
- Download buttons now say where they go, e.g. "View on Modrinth"
- Added a "Jump to project" panel linking to each project on the page. It can be collapsed and remembers your choice
- Replaced the "New" and "Updated" badges and their dismiss buttons with notification dots beside version numbers and on the navigation bar. The dots show until you open that project page, and reappear when a version changes

### Home page redesign
- Moved the statistics into the splash section
- Removed the splash banner image and the pixel background
- Updated the splash subtitle
- Renamed the "Explore" button to "Browse projects"
- Replaced the "About" button with "Latest news", which jumps to the news section
- Added a project counter (e.g. 1/2) to the Featured Project card
- Renamed the "Downloadable Projects" statistic to "Projects" and "Hours of Playtime" to "Hours Played", and removed the statistic icons
- Replaced the statistics footnote with a tooltip on each statistic explaining how it is measured

### Added
- Notification dot on the News tab on the nav bar for entries added since your last visit

### Changed
- Refreshed the site's visual design with consistent spacing, corner radii, type sizes and colours. Headings now use the Minercraftory display font throughout
- Changed the news page's News, Archived and Snapshot tag colours to a neutral grey-blue, and the New Project tag from yellow to the site accent blue
- Added a note to Classic's Note Block Tweaks explaining it has been merged into Classic's Tweaks and will be archived after v1.0.0
- Updated the home page title, description and link preview text
- Updated the calendar icon

### Fixed
- Fixed the Classic's Tweaks v3.0.0 news entry using an undefined "stable" tag instead of "Release"

## v3.17.0.2 — 2026-10-26

### Changed
- Updated latest releases on news page

### Fixed
- Fixed beta tag on Classic's Tweaks v3.0.0 release news entry

## v3.17.0.1 — 2026-10-26

### Changed
- Updated for Classic's Tweaks v3.0.0

## v3.17.0 — 2026-10-25

### Added
- Notes to archived/unsupported projects, explaining what happened to them
- Swipe animation for Featured Project carousel on the home age

## v3.16.1 — 2026-10-25

### Added
- Icons to news entries on the home page

### Changed
- Increased time between featured project rotations from 6 seconds to 8 seconds
- Changed "Unsupported" tag to "Archived"

## v3.16.0.2 — 2026-10-24

### Changed
- Updated download statistics [automated]

## v3.16.0.1 — 2026-10-23

### Changed
- Updated playtime stats

## v3.16.0 — 2026-10-23

### Added
- Support for multiple featured projects on the home page, cycles through them on a 6-second interval

## v3.15.1 — 2026-10-23

### Changed
- Reduced Minecraft versions visible in the filters card by default from 6 to 4
- Updated news entry text for Classic's Tweaks v3.0.0-beta.2
- Unpinned "Introducing Classic's Note Block Tweaks" announcement

### Fixed
- Fixed the history icon showing through tooltips
- Fixed the "Older versions" links sitting far to the right of projects with a single download box. They now sit directly under the box.

## v3.15.0.1 — 2026-10-23

### Changed
- Updated for Classic's Tweaks v3.0.0-beta.2

## v3.15.0 — 2026-10-22

### Added
- Minecraft version filters on the news page
- Notification dots to entries added since the user's last visit

### Changed
- Moved news entry tags back to the top row, and expanded the width for text
- Dates on news entries that are in the future now show as "Tomorrow" or "In 3 days" instead of the full date

### Fixed
- Fixed "View" button overflowing its box when a version string is too long - it now narrows slightly to make room

## v3.14.0.1 — 2026-10-21

### Added
- New Resource Pack: Classic's Tweaks

### Changed
- Marked Classic's Disc/Dye/Lantern Tweaks & Zisteau's Pigmen as archived

## v3.14.0 — 2026-10-21

### Added
- Multiple news entries can now be pinned at the same time

### Changed
- Moved the "sort by oldest/newest" button to the left of the search bar and turned it into a dropdown
- Made filter categories collapsible - tags & months are now collapsed by default
- Reduced the amount of project filters visible by default from 5 to 4
- Increased the amount of tag and month filters visibile by default from 3 to 4
- Rewrote some news page entries
- Brightened the Snapshot news tag colour

## v3.13.0.1 — 2026-10-21

### Changed
- Updated download statistics [automated]

## v3.13.0 — 2026-10-21

### Changed
- Redesigned the "stay in the loop" card on the news page, removing the icon & adding the GitHub and Modrinth links that were part of the Quick links
- The "latest releases" card on the news page can now be collapsed
- Moved news tags from the bottom to the top of each entry on mobile

### Fixed
- Fixed inconsistent news page sidebar card sizing
- Fixed back to top button not appearing on the news page

## v3.12.0 — 2026-10-21

### Added
- Project filters on the news page
- Month filters & headings on the news page
- Option to sort news page by newest first or oldest first
- Latest releases card on the news page, replacing Quick links
- "Show more" button on the news page - the News page now loads the 10 newest entries, with the button revealing 10 more at a time

### Changed
- Home page news entries & the announcement card now link to their respective entries on the news page
- News page entries can now have links to multiple projects/versions
- Dates on the news page are now relative (e.g. "2 days ago", "3 weeks ago") up to 1 month, then they turn back into full dates. The full date can still be seen when hovering over these new relative dates
- Tightened filters card on the news page
- Standalone updates in news entries now link directly to their Modrinth page
- Changed calendar icon

## v3.11.0.4 — 2026-10-20

### Changed
- Updated for Better Unpackables v5.1.0-beta.6

## v3.11.0.3 — 2026-10-20

### Changed
- Updated for Classic's Note Block Tweaks v0.5.0 (for real this time)

### Fixed
- Fixed incorrect links for Classic's Note Block Tweaks on the news page

## v3.11.0.2 — 2026-10-20

### Changed
- Updated for Classic's Note Block Tweaks v0.5.0

## v3.11.0.1 — 2026-10-20

### Changed
- Updated for Java 26.4-snapshot-5 and new data pack betas

## v3.11.0 — 2026-10-20

### Added
- Pinned news entry - moves to the top of the page, has a pin icon and a lighter border. The same entry is used for the announcement card.
- X/Twitter link to news page's "Stay in the loop" panel

### Changed
- Redesigned the News page tag filter on the sidebar
- Tightened padding on the News page
- Moved tags to the right side of news entries
- Updated Classic's Note Block Tweaks news entry with the pack icon
- Swapped news page entry "beta" & "snapshot" tags around

### Fixed
- Fixed the announcement card appearing on the 404 page

## v3.10.0.2 — 2026-10-20

### Changed
- Swapped announcement message

### Fixed
- Outdated version number in the footer

## v3.10.0.1 — 2026-10-20

### Added
- New Resource Pack: Classic's Note Block Tweaks

## v3.10.0 — 2026-10-20

### Added
- New announcement card, replacing the announcement banner

### Changed
- Redesigned the Latest Updates section on the Home page
- Renamed the Updates page to "News"
- Redesigned the News page to include a new sidebar with a search bar, filters and some additional information

## v3.9.0 — 2026-10-19

### Added
- Updates page
- Latest updates section to the home page, pulling the most recent 3 entries from the new Updates page

### Changed
- Changed announcements icon
- Updated Better Unpackables v5.0.1 announcement wording

## v3.8.0 — 2026-10-19

### Added
- Announcements banner on the bottom of every page

### Changed
- Slightly reworded the note below the stats section

## v3.7.6.4 — 2026-10-19

### Changed
- Updated download statistics [automated]

## v3.7.6.3 — 2026-10-18

### Changed
- Updated playtime statistics

## v3.7.6.2 — 2026-10-18

### Changed
- Updated download statistics [automated]

## v3.7.6.1 — 2026-10-17

### Changed
- Updated download statistics [automated]

## v3.7.6 — 2026-10-15

### Changed
- The version number and changelog are now updated when download stats are automatically updated
- Updated the note below the stats section
- Updated icon used by About page

## v3.7.5.1 — 2026-10-15

### Changed
- Updated download statistics [automated]

## v3.7.5 — 2026-10-14

### Changed
- Hid the no-JavaScript notice from Google search snippets and reworded its text
- Expanded the home page meta description

## v3.7.4 — 2026-10-14

### Changed
- Download stats on the home page now update automatically from Modrinth and SpigotMC (via Spiget)

## v3.7.3.3 — 2026-10-14

### Changed
- Updated statistics

## v3.7.3.2 — 2026-10-13

### Changed
- Updated for new Better Unpackables releases & beta

## v3.7.3.1 — 2026-10-13

### Changed
- Updated for Java 26.4-snapshot-4 and new data pack betas

## v3.7.3 — 2026-10-11

### Removed
- The "Sometimes useful. Always Minecraft." tagline from link previews

### Fixed
- Home page link preview title & description
- X/Twitter link preview having a different description

## v3.7.2 — 2026-10-11

### Changed
- Improved link previews again with a better image, and a title and description that no longer repeat each other

## v3.7.1 — 2026-10-11

### Added
- Descriptive alt text to project icons on the project pages, for screen reader users

### Changed
- Improved link previews with a new share image, and a clearer home page title
- Updated the home page to "Classic's Craftworks - Minecraft Java Data Packs, Mods & Resource Packs"
- Reduced repeat downloads for returning visitors - fonts and images are no longer re-fetched on every page view

## v3.7.0 — 2026-10-11

### Changed
- Changed Download button labels to "View" on project pages and swapped the download icon out for a new "new tab" one
- Improved the site working offline after a visit - it now loads from a saved copy when your connection is slow or drops
- Omitted Minecraft versions when one isn't specified, instead of showing "Java undefined"
- Updated statistics

### Fixed
- Fixed pages not loading when opened with a trailing slash in the address (e.g. `/about/` or `/data-packs-mods/`)
- Fixed copying a project link not working sometimes. If your browser blocks the usual copy method, the site falls back to another one instead of silently doing nothing
- Fixed copying a project link changing the address bar and adding it to the browser history

## v3.6.0 — 2026-10-10

### Changed
- Restyled the mobile Featured Project panel from a boxed card into a borderless panel to better match the desktop version from v3.4.0
- Made the Explore and About buttons span the full width on mobile
- Made the "Data Pack" and "Mod" pills smaller and borderless, and also slightly darkened their text
- Improved text wrapping in the Featured Project description on mobile
- Updated the mobile project page layout so the icon sits beside the title only, and the description, links and download boxes use the full width
- Increased the size of project titles on mobile
- Increased the spacing between the project description and link buttons on mobile to a little more

### Fixed
- Fixed the Featured Project image being narrower than its panel on mobile
- Fixed the "Data Pack" & "Mod" pills and the View Project button wrapping onto two lines on narrow screens

## v3.5.0 — 2026-10-09

### Added
- Made the reupload notice dismissible. Its dismissed state persists across visits and both project pages, but the notice reappears after 45 days or when its wording changes
- Tooltips to the "New" and "Updated" badges

### Changed
- Made the "Older versions" links right-aligned and added a history icon
- Restyled the reupload notice on project pages to make it more noticeable without being overwhelming
- Moved the "New" and "Updated" badges slightly to the left
- Brightened the link button text on project pages
- Made the download boxes slightly smaller
- Increased space between projects on the project pages
- Made the dividers on the project pages slightly brighter

## v3.4.0 — 2026-10-09

### Changed
- Restyled the home page splash banner with a full-height Featured Project panel
- Evened out the spacing between home page sections
- Increased the size of the icons in the Stats section and made them slightly darker
- Reduced the size of the stats numbers in the Stats section

### Fixed
- Fixed the "+" in the stats numbers being too thin and too low

## v3.3.1 — 2026-10-09

### Fixed
- Fixed tooltips getting cut off by the header; they now appear below their element instead

## v3.3.0 — 2026-10-09

### Changed
- Made the site load faster on repeat visits, and pages you've already opened now still show their layout and images if you lose your connection
- Made Copy Link buttons briefly switch to a tick icon when clicked
- Centred the Classic's Craftworks logo, text and copyright information in the mobile footer
- Shrank the logo and copyright information in the desktop footer
- Centred the desktop footer and moved its sections closer to the logo
- Updated statistics

### Fixed
- Fixed the Back to Top button ignoring the reduced-motion setting
- Fixed the "Copied!" tooltip appearing even when the link failed to copy

### Removed
- Established date from the footer
- Second separator from the footer

## v3.2.0 — 2026-10-08

### Changed
- Redesigned project pages to be more compact on desktop and wider screens
  - On mobile and narrower screens, the layout should remain as it was before this update
- Updated Copy Link buttons on project pages to include the project name
- Moved notification labels to the right side of channel boxes so the left side feels less cluttered
- Made the Back to Top button appear sooner

### Fixed
- Fixed the Copy Link button icon sitting too low

## v3.1.2 — 2026-10-08

### Fixed
- Fixed the position of the notification dot's hover tooltip

## v3.1.1 — 2026-10-08

### Changed
- Made separators between projects on project pages thicker and more visible
- Swapped the version separator in home page project buttons for better readability
- Improved image loading on the home page

### Fixed
- Fixed screen readers announcing each project's name twice on the Data Packs & Mods, Resource Packs and Other Projects pages

## v3.1.0 — 2026-10-07

### Changed
- Renamed the `#projects-intro` deep link to `#projects`
  - Bookmarks or links still using `#projects-intro` will now take you to the top of the home page instead of the Projects section
- Hid the notification dot in the header while its dropdown is open
- Reduced the notification tooltip hover area
- Moved the "data pack" and "mod" labels to the bottom of the Featured Project box
- Increased the padding above and below the Featured Project heading

### Fixed
- Fixed the notification counter not using the correct font
- Fixed the notification counter being slightly misaligned in dropdowns on mobile

### Removed
- Version numbers from the Featured Project box

## v3.0.1 — 2026-10-06

### Changed
- Renamed the "Explore Projects" button to "Explore" on the splash screen
- Changed project card headers to "Browse all X projects" to make it clearer that they are buttons
- Reduced the height of the splash screen
- Reduced the width of statistics boxes on mobile

### Fixed
- Fixed the Featured Project image being cut off on mobile
- Fixed inconsistent copyright text wrapping on mobile

## v3.0.0.1 — 2026-10-06

### Changed
- Updated for Java 26.4-snapshot-3 and new data pack betas

## v3.0.0 — 2026-10-06

### Added
- New home page splash screen featuring a Featured Project
- New About page
- Project count placeholder in the home page's Stats section and on the About page
- Keyboard shortcuts for Search: `/` and `Ctrl+K` / `Cmd+K`
- Icons for unavailable download buttons
- Icons for redistribution notices
- Warning when a page fails to load

### Changed
- Redesigned and consolidated the header and navigation bar
- Redesigned home page project buttons to display more information and link directly to projects
- Redesigned the footer
- Widened pages
- Updated page headings for improved screen-reader accessibility
- Improved support for installing the website as an app across more browsers
- Updated hover colours, button corner radii, font weights and other visual details for consistency
- Improved layout and spacing throughout the site
- Updated statistics

### Fixed
- Fixed various layout issues on mobile

## v2.3.1 — 2026-10-04

### Changed
- Made the logo and site name appear immediately when a page opens, instead of popping in a moment later
- Improved fonts and font loading
- Made project icons reserve their space while the page loads, so the layout no longer shifts slightly when images arrive
- Swapped the SpigotMC icon again for a more simplified version

### Fixed
- Fixed the 404 page breaking on nested URLs

## v2.3.0.1 — 2026-10-03

### Changed
- Updated statistics

## v2.3.0 — 2026-09-30

### Added
- Projects heading above the home page buttons

### Changed
- Moved GitHub and Modrinth links from the header to the footer
- Centred the logo and text in the header
- Reduced the header's size and increased its text size
- Reduced the size and padding of home page button headers on mobile

### Removed
- Header tagline

## v2.2.0.1 — 2026-09-29

### Changed
- Updated statistics
- Updated for Java 26.4-snapshot-2

## v2.2.0 — 2026-09-29

### Added
- Pixelated background

## v2.1.4 — 2026-09-28

### Changed
- Reduced the padding at the very bottom of all pages
- Made the mobile browser toolbar and the installed-app splash screen match the site's dark blue background
- Added proper 192px and 512px icons for "Install app" or "Add to Home Screen" in some browsers
- Made the 404 page fill the whole screen on mobile, matching the rest of the site
- Added a site name and image description to link previews

## v2.1.3 — 2026-09-27

### Changed
- Updated the footer layout:
  - Increased the font weight of the copyright line
  - Grouped the legal disclaimer and link icon credits together
  - Slightly reduced the size of the version number
  - Added more padding between elements
  - Swapped the positions of the X / Twitter and Discord buttons

## v2.1.2 — 2026-09-27

### Changed
- Updated the playtime statistic
- Updated the document icon

### Fixed
- Fixed the unaffiliated reupload notice appearing on the Other Projects page
- Fixed the home page card arrow being misaligned

## v2.1.1 — 2026-09-27

### Changed
- Updated the download, link and bracket icons again

## v2.1.0 — 2026-09-27

### Added
- Unaffiliated reupload notice on the Data Packs & Mods and Resource Packs pages
- "Est. 2017" in the footer

### Changed
- Increased the size of the notification dot on mobile
- Updated the download, link, SpigotMC, Reddit, wrench and bracket icons

### Fixed
- Fixed the notification dot tooltip being cut off by the edge of the screen

## v2.0.1 — 2026-09-26

### Fixed
- Fixed navigation bar icons using a generic link icon instead of page-specific ones
- Fixed navigation bar buttons linking to .html pages

## v2.0.0 — 2026-09-26

### Added
- New home page, with big buttons to each project-type page and a stats section
- New project-type pages
- Website listing on the Other Projects page
- New search system with a results dropdown and direct navigation to matching pages
- Navigation bar icons
- Notification indicator on the navigation bar for undismissed New and Updated badges

### Changed
- Refreshed the visual design with a new blue theme

### Fixed
- Fixed navigation bar and page alignment
- Fixed some mobile layout inconsistencies
- Fixed incorrect apostrophes in deep links

### Removed
- Old navigation systems, including collapsible sections and project-type deep links

## v1.0.1 — 2026-09-24

### Changed
- Centred the header at smaller page sizes

## v1.0.0 — 2026-09-23

Declared the site stable and ready for its first major release. Development will slow down significantly from here on.

### Fixed
- Fixed navigation bar and channel wrapping issues on mobile

## v0.19.0 — 2026-09-23

### Changed
- Switched project icons to WebP images
- Switched link icons to SVGs

## v0.18.1 — 2026-09-23

### Changed
- Improved mobile layouts, including wrapping and alignment

### Fixed
- Fixed navigation bar button alignment on mobile

## v0.18.0 — 2026-09-22

### Added
- Link to older versions and snapshots on Modrinth and GitHub, shown under each project's download options

### Changed
- Reworked the navigation bar's colour scheme for better contrast and readability
- Slightly tightened the padding between projects
- Made section headers deep-linkable and shareable; expanding a section now updates the URL without jumping to the section
- Made buttons and icons (Copy Link, clear search, channel badges, download buttons) easier to tap accurately on touch screens
- Made "Not available" download buttons show why they're unavailable when clicked or tapped, instead of only on hover
- Improved the wording of the tooltip on unavailable data pack and resource pack downloads

### Fixed
- Possibly fixed the search box zooming in unexpectedly when tapped on iPhone/Safari (untested on iPhone)

## v0.17.1 — 2026-09-22

### Changed
- Improved how the search bar works with collapsing and expanding sections; section states are now remembered when the search bar is cleared
- Improved how navigation buttons, deep links and section header buttons interact

### Fixed
- Fixed section headers being hidden beneath the navigation bar when navigating to them via a deep link or navigation bar buttons

## v0.17.0 — 2026-09-22

### Changed
- Revamped the navigation bar styling so it stands out more from the rest of the content (colours to be finalised)
- Reworked how project versions are handled, so each data pack and mod release can now have its own version number

## v0.16.2.1 — 2026-09-22

### Changed
- Updated for new Better Craftables and Better Unpackables betas
- Updated for the Java 26.4 development cycle

## v0.16.2 — 2026-09-22

### Fixed
- Fixed deep links not being properly cleared when collapsing a section

## v0.16.1 — 2026-09-22

### Added
- Fallback message with direct links to the Modrinth and GitHub pages, shown instead of a blank page if JavaScript is disabled or blocked in the browser
- "Skip to projects" link for keyboard users to jump past the header and navigation to the project list without having to tab through everything first

### Changed
- Improved the installed-app experience on mobile, including a proper icon and a matching browser theme colour

## v0.16.0 — 2026-09-22

### Added
- Tooltips on Unavailable download buttons explaining why the download is not available

## v0.15.0 — 2026-09-21

### Added
- Dismissible "New" and "Updated" badges
  - A dismissed badge will reappear when a new version is added to the site

## v0.14.2 — 2026-09-21

### Changed
- Improved performance: search should now be faster and the page should load quicker

### Fixed
- Fixed navigation bar buttons not being highlighted when a section is accessed via a deep link
- Fixed sections jumped to via a deep link not showing as expanded in the navigation bar
- Fixed clicking a section in the navigation bar right after landing on it via a link appearing to do nothing; it now collapses properly

## v0.14.1 — 2026-09-21

### Changed
- Moved Copy Link icons slightly closer to their text
- Made the navigation bar use deep links, for easier navigation and sharing via the browser's address bar

## v0.14.0 — 2026-09-21

### Added
- Deep links for each section and each project (e.g. `classicscraftworks.co.uk/#better-craftables` to jump to the Better Craftables section)
  - A Copy Link icon next to each section and project for easier sharing
- An "x" icon to clear text from the search bar

### Changed
- Made search also look for Minecraft versions and project versions
- Removed the separator between the header and navigation bar, and reduced the padding between them
- Renamed the "Back to home" button on the 404 page to "Go Back"

### Fixed
- Fixed the 404 page footer not matching the main page

## v0.13.2 — 2026-09-21

### Changed
- Improved colours across the site for better readability and accessibility
- Reduced the size of social link icons in the footer
- Slightly reduced section header padding
- Updated the wording of the link icons credit in the footer
- Moved the logo down by 2px

### Fixed
- Fixed incorrect colours for the Unsupported channel

## v0.13.1 — 2026-09-20

### Changed
- Slightly brightened soft text to pass accessibility contrast tests, most noticeable in the footer
- Changed round navigation bar buttons to rounded squares to fit the rest of the site
- Made more animations respect the reduced-motion setting
- Moved the Expand/Collapse All button away from the other navigation bar buttons, and made the separator more visible

### Fixed
- Fixed the search bar having an unsightly outline when active
- Fixed keyboard focus highlights being cut off at the edges of the page
- Fixed social link tooltips being cut off in the footer

## v0.13.0 — 2026-09-20

### Changed
- Improved mobile layouts, including button alignment and text wrapping

## v0.12.0 — 2026-09-20

### Added
- Navigation bar at the top of the page
  - Buttons to jump to sections
  - Button to expand/collapse all sections
  - Search bar

### Fixed
- Fixed a missing exclamation mark in New Sword Blocking's description

## v0.11.1 — 2026-09-19

### Changed
- Slightly decreased the size of section headers
- Decreased the overlap of preview icons
- Slightly increased the size of preview icons

## v0.11.0 — 2026-09-19

### Added
- Back to Top button, which appears after scrolling 400px down the page

## v0.10.1 — 2026-09-19

### Changed
- Made Unsupported channel download buttons match Alpha and Beta instead of Stable

## v0.10.0 — 2026-09-19

### Added
- New Other Projects section (collapsed by default)
- New Unsupported channel (blue)
- The following projects have been added to their respective sections:
  - Zisteau Pigmen
  - New Sword Blocking (Unsupported)
  - CraftHorizon

### Changed
- Reduced the number of preview icons from 5 to 4

## v0.9.0 — 2026-09-19

### Added
- Custom 404 page for invalid or unavailable URLs

## v0.8.0 — 2026-09-19

### Added
- Project count on each section header
- Small preview of project icons that peeks out on the right side of a collapsed section and fades away once you expand it

### Changed
- Reworked section headers so the whole bar is clickable (instead of just the text) and looks more like a button

## v0.7.1 — 2026-09-19

### Added
- Shrink animation when clicking section collapse/expand buttons

### Changed
- Improved the section collapse/expand animation and sped it up again
- Slightly tweaked the shrink animation on all buttons

## v0.7.0 — 2026-09-19

### Added
- Collapsed sections are now remembered when the page is refreshed

### Changed
- Sped up the animation when collapsing or expanding sections
- Disabled section toggling while the collapse/expand animation is playing

### Fixed
- Fixed accidental section toggling when clicking empty header space; toggling now only works from section titles and chevrons

## v0.6.1 — 2026-09-18

### Added
- More fallback fonts for different and older operating systems and browsers

### Changed
- Reverted the status dot size change from v0.6.0

## v0.6.0 — 2026-09-18

### Added
- Collapsible sections, which can be expanded or collapsed using a new chevron icon next to section headers

### Changed
- Changed the download icon
- Slightly increased the size of status dots and reduced the spacing around them

## v0.5.5 — 2026-09-18

No user-facing changes.

## v0.5.4 — 2026-09-18

### Changed
- Colour-matched separators in channel headers
- Reduced the padding at the top and bottom of the page
- Darkened separators between projects
- Brightened accent colours

## v0.5.3 — 2026-09-18

### Changed
- Moved the logo down by 1px

## v0.5.2 — 2026-09-17

### Added
- Tooltips on social links in the footer
- Proper icon credits in the footer

### Changed
- Changed footer social link icons from circles to rounded squares
- Renamed the X label to "X / Twitter"
- Increased the width of the footer
- Capitalised the footer disclaimer
- Moved the site version number to the bottom of the footer
- Increased the version number's size, opacity and margin

## v0.5.1 — 2026-09-17

### Fixed
- Fixed project link icons flashing on hover

## v0.5.0 — 2026-09-17

### Added
- Subtle shrink animation when clicking buttons

### Changed
- Updated the overall colour scheme from a warm brown-orange to a dark grey
- Updated channel colours:
  - Stable: changed from bright orange to vibrant green
  - Beta: changed from purple to warm amber, keeping it distinct without overpowering the page
  - Alpha: softened the red to a slightly more pink tone
- Increased the rounding on project icons
- Updated the header font
- Updated the body text fonts
- Made project links less visually prominent
- Reduced the font weight of version pills and slightly increased their letter spacing
- Increased the logo size and raised it slightly
- Slightly increased project icon sizes
- Changed the cursor to "not-allowed" when hovering over unavailable buttons
- Reorganised project links to place the most important links first

## v0.4.4 — 2026-09-17

### Changed
- Added a line break in the tagline
- Slightly increased the size of the logo

## v0.4.3 — 2026-09-16

### Changed
- Switched link preview cards to use the logo instead

### Removed
- Banner image previously used for link preview cards

## v0.4.2 — 2026-09-16

### Changed
- Slightly increased the hover brightness of Stable channel buttons again, based on user feedback
- Updated the tagline in the site header to match its wording across Classic's Craftworks' other online presences

## v0.4.1 — 2026-09-16

### Changed
- Increased the hover brightness of Stable channel buttons while keeping Beta and Alpha buttons at their existing brightness

## v0.4.0 — 2026-09-16

### Added
- Alpha channel (red) for experimental builds

## v0.3.7 — 2026-09-16

### Changed
- Switched X / Twitter link previews to the summary card format
- Changed link preview descriptions to include the tagline

## v0.3.6 — 2026-09-16

### Fixed
- Fixed link preview cards

## v0.3.5 — 2026-09-16

### Added
- Link preview cards, so site links look good when shared on Discord, X / Twitter and other platforms

## v0.3.4 — 2026-09-16

### Added
- Modrinth links to data pack and mod projects
- "Java" prefix to Minecraft version numbers

### Changed
- Made the website version link go to the changelog
- Reverted the "Release" channel back to "Stable"
- Labelled the Beta channel "Pre-Release" or "Release Candidate" when applicable

## v0.3.3 — 2026-09-15

### Changed
- Widened site content again

### Fixed
- Fixed version pills wrapping onto their own line; they now stay inline
- Fixed long version numbers (e.g. betas) overflowing their pill; they now truncate with an ellipsis

## v0.3.2 — 2026-09-15

### Changed
- Filled in the Resource Pack brush icon
- Shrank the Data Pack brackets icon
- Enlarged the Mod box icon

## v0.3.1 — 2026-09-15

### Changed
- Swapped the Release colour from green to orange

### Fixed
- Fixed missing Resource Pack, Data Pack and Mod icons

## v0.3.0 — 2026-09-15

### Changed
- Redesigned release sections to support separate mod versions and "unavailable" releases
- Widened site content
- Improved version pill styling to match each release channel's colour
- Removed the "MC" prefix before Minecraft versions
- Slightly increased the size of the header and logo
- Slightly increased the size of section headings

### Fixed
- Fixed wrong Minecraft versions being listed for all betas

## v0.2.6.2 — 2026-09-15

### Fixed
- Fixed an incorrect Silly Eatables Minecraft version

## v0.2.6.1 — 2026-09-15

### Changed
- Updated data pack and mod downloads for Minecraft 26.3

## v0.2.6 — 2026-09-15

### Fixed
- Fixed Classic's Disc Tweaks betas being incorrectly listed under the Release channel

## v0.2.5 — 2026-09-15

### Changed
- Renamed the Stable channel to Release

### Fixed
- Fixed the alignment of project icons and content

### Removed
- Page header animation

## v0.2.4 — 2026-09-15

### Fixed
- Fixed an incorrect Silly Eatables version

## v0.2.3 — 2026-09-15

### Changed
- Renamed "Resource Pack" to "Download" on resource pack download buttons

## v0.2.2 — 2026-09-15

### Changed
- Improved the Download and Modrinth link icons
- Improved the Classic's Craftworks logo and favicon

## v0.2.1 — 2026-09-15

### Fixed
- Fixed the page failing to load correctly
- Fixed missing link icons

## v0.2.0 — 2026-09-15

### Added
- Better link icons, including for GitHub, SpigotMC and Modrinth
- Website version link in the footer
- Version pills beside Stable and Beta release labels
- Green Stable and contrasting Beta status indicators
- Subtle accent colour for Beta releases

### Changed
- Separated Stable and Beta downloads
- Made Stable downloads use filled orange buttons
- Made Beta downloads use outlined buttons
- Lightened download panels
- Reduced the use of orange for borders and decorative elements
- Reduced project icon sizes
- Increased project title prominence
- Standardised download button widths and increased their padding
- Tightened header spacing
- Made separators and borders more subtle

## v0.1.1 — 2026-09-14

### Changed
- Changed the tagline to "Sometimes useful. Always Minecraft."

## v0.1.0 — 2026-09-14

### Added
- Initial Classic's Craftworks website
- Data Packs & Mods project listings
- Project descriptions and Minecraft version badges
- GitHub, SpigotMC and Wiki links
- Data pack, mod and Beta download links
- Initial visual design, using placeholder graphics