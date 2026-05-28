// == EBP Browser Bookmark Bar Extension Configuration ==
//
// This file defines the CONFIG object, which controls the behavior and appearance
// of the bookmark bar extension. The options below can be customized as needed.
//
// CONFIG options:
//
// allowedHostPatterns: Array of RegExp
//   - List of regular expressions. The bar will only appear on hostnames matching these patterns.
//   - Example: [/.*/] (all hosts), [/^example\\.com$/] (only example.com)
//
// bookmarksUrl: String
//   - URL to fetch the bookmarks JSON data from.
//   - Example: 'https://URL/EBP-Browser-Bookmark-Bar/bookmarks.json'
//
// logoPath: String
//   - Path to the logo icon used for the bar and home button (relative to extension root).
//   - Example: 'icons/logo16.png'
//
// bgPath: String
//   - Path to the background image for the bar (relative to extension root).
//   - Example: 'icons/bluefish-aquarium_background-25px.jpg'
//
// homeUrl: String
//   - URL to open when the home button is clicked (top left of the bar).
//   - Example: 'https://URL/'
// ========================================================

window.CONFIG = {
    // List of regular expressions. The bar will NOT appear on hostnames matching these patterns.
    excludedHostPatterns: [
        /^laser\.applebaum\.treehouse$/
    ],

    bookmarksUrl: 'https://bookmarks.applebaum.treehouse/EBP-Browser-Bookmark-Bar/bookmarks.json',
    logoPath: 'icons/logo32.png',
    bgPath: 'icons/bluefish-aquarium_background-25px.jpg',
    homeUrl: 'https://ourfishbowl.avalonbloom.com/' // Home button URL
};
