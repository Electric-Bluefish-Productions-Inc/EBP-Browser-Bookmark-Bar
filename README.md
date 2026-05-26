# Centralized Bookmark Bar Chrome Extension

This browser extension injects a customizable bookmark bar into web pages, displaying bookmarks fetched from a central server (http://bookmarks.applebaum.treehouse/bookmarks.json). The bar is only
visible on specified local networks or domains (e.g., 192.168.100.*, 10.0.100.*, or *.applebaum.treehouse). Bookmarks and their icons are managed centrally, making updates seamless for all users on
the network.
![samplebar.jpg](images/samplebar.jpg)
## Browser Extention - Installation Instructions

Follow these steps to install the extension in Chrome:

1. **Clone or Download the Extension**
    - Download or clone this repository to your local machine.

2. **Open Chrome Extensions Page**
    - Go to `chrome://extensions/` in your Chrome browser.

3. **Enable Developer Mode**
    - Toggle the "Developer mode" switch in the top right corner.

4. **Load Unpacked Extension**
    - Click the "Load unpacked" button.
    - Select the folder containing the extension files (the folder with `manifest.json`).

5. **Verify Installation**
    - The extension should now appear in your list of extensions.
    - Visit a site on an allowed network/domain (e.g., 192.168.100.*, 10.0.100.*, or *.applebaum.treehouse) to see the bookmark bar.

6. **Central Bookmarks Server**
    - Ensure your bookmarks server is running and accessible **_(you must be local or connected to our VPN)_** at `http://bookmarks.applebaum.treehouse/bookmarks.json`.
    - The JSON file must be valid and follow the format described below.

## **Central Bookmarks Server Setup**

### bookmarks.json Format

The `bookmarks.json` file should be hosted at `http://bookmarks.applebaum.treehouse/bookmarks.json` and must be a valid JSON array. Each element in the array represents a bookmark and should be an
object with the following properties:

- `label` (string, required): The display name of the bookmark.
- `iconUrl` (string, optional): The URL of the icon to display for this bookmark. If omitted, the extension's default icon will be used.
- `url` (string, optional): The URL to open when the bookmark is clicked. (Note: You may want to add click handling in the extension if you want this feature.)

### Example

```json
[
  {
    "label": "james",
    "iconUrl": "http://bookmarks.applebaum.treehouse/icons/james.png",
    "url": "https://intranet.applebaum.treehouse/profile/james"
  },
  {
    "label": "YouTube",
    "iconUrl": "https://www.youtube.com/s/desktop/6e8e6e8e/img/favicon_32x32.png",
    "url": "https://youtube.com"
  },
  {
    "label": "GitHub",
    "iconUrl": "https://github.githubassets.com/favicons/favicon.svg",
    "url": "https://github.com"
  }
]
```

- The `iconUrl` can be any valid image URL (local or remote). If omitted, the extension will use its bundled icon.
- The `url` property is optional, but recommended if you want bookmarks to be clickable (requires click handler in the extension).

## Notes

- The extension will only display the bookmark bar on allowed networks/domains:
    - IPs starting with `192.168.100.*` or `10.0.100.*`
    - Hostnames ending with `applebaum.treehouse`
- Make sure your server at `bookmarks.applebaum.treehouse` is accessible from your local network.
- The JSON file must be valid and served with the correct MIME type (`application/json`).
