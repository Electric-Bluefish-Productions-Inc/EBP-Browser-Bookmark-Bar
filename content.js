/*
============================================================
 EBP Browser Bookmark Bar Extension Content Script

 This script injects a customizable bookmark bar into allowed web pages.
 - Fetches bookmarks from a central server (bookmarks.json)
 - Renders bookmarks as clickable links and dropdowns (with icons)
 - Hides/shows the bar on scroll
 - Only activates on allowed domains/networks
 - Fully encapsulated in the BookmarkBar class for maintainability
============================================================
*/

class BookmarkBar {
  constructor() {
    this.allowedHostPatterns = [
      /^192\.168\.100\./, // local network
      /^10\.0\.100\./,    // VPN
      /applebaum\.treehouse$/, // domain
      /avalonbloom\.com$/, // domain
      /electricbluefish\.com$/ // domain
    ];
    this.ext = (typeof browser !== 'undefined') ? browser : chrome;
    this.logoUrl = this.ext.runtime.getURL('icons/logo16.png');
    this.bgUrl = this.ext.runtime.getURL('icons/bluefish-aquarium_background-25px.jpg');
    this.bar = null;
    this.init();
  }

  isAllowedHost() {
    const hostname = window.location.hostname;
    return this.allowedHostPatterns.some(pattern => pattern.test(hostname));
  }

  async init() {
    if (!this.isAllowedHost()) return;
    if (document.getElementById('ext-bookmark-bar')) return;
    this.bar = document.createElement('div');
    this.bar.id = 'ext-bookmark-bar';
    try {
      const bookmarks = await this.fetchBookmarks();
      this.renderBar(bookmarks);
      document.body.prepend(this.bar);
      this.bar.style.backgroundImage = `url('${this.bgUrl}')`;
      this.addDropdownListeners();
      this.addScrollListeners();
      this.injectCSS();
    } catch (e) {
      console.error('Could not load bookmarks:', e);
    }
  }

  async fetchBookmarks() {
    const r = await fetch('https://bookmarks.applebaum.treehouse/EBP-Browser-Bookmark-Bar/bookmarks.json');
    if (!r.ok) throw new Error('Failed to fetch bookmarks');
    return r.json();
  }

  renderBar(bookmarks) {
    this.bar.innerHTML = bookmarks.map(item => {
      let iconSrc = this.logoUrl;
      if (item.iconUrl && typeof item.iconUrl === 'string' && item.iconUrl.trim() !== '') {
        iconSrc = item.iconUrl;
      }
      if (item.type === 'dropdown' && Array.isArray(item.options)) {
        const optionsHtml = item.options.map(opt => {
          let optIcon = this.logoUrl;
          if (opt.iconUrl && typeof opt.iconUrl === 'string' && opt.iconUrl.trim() !== '') {
            optIcon = opt.iconUrl;
          }
          return `
            <div class="custom-dropdown-option" data-value="${opt.value}" tabindex="0">
              <img src="${optIcon}" class="dropdown-option-icon" alt="Icon">
              <span class="dropdown-option-label">${opt.label}</span>
            </div>
          `;
        }).join('');
        return `
          <div class="bookmark-item custom-dropdown-container">
            <img src="${iconSrc}" class="bookmark-icon" alt="Icon">
            <div class="custom-dropdown">
              <div class="custom-dropdown-selected">${item.label}</div>
              <div class="custom-dropdown-options" style="display:none;">
                ${optionsHtml}
              </div>
            </div>
          </div>
        `;
      } else if (item.url && typeof item.url === 'string' && item.url.trim() !== '') {
        return `
        <div class="bookmark-item">
          <img src="${iconSrc}" class="bookmark-icon" alt="Icon">
          <a class="bookmark-label" href="${item.url}" target="_blank" rel="noopener noreferrer">${item.label}</a>
        </div>
      `;
      } else {
        return `
        <div class="bookmark-item">
          <img src="${iconSrc}" class="bookmark-icon" alt="Icon">
          <span class="bookmark-label">${item.label}</span>
        </div>
      `;
      }
    }).join('');
  }

  addDropdownListeners() {
    // Add event listeners for custom dropdowns
    this.bar.querySelectorAll('.custom-dropdown').forEach(dropdown => {
      const selected = dropdown.querySelector('.custom-dropdown-selected');
      const options = dropdown.querySelector('.custom-dropdown-options');
      // Toggle dropdown
      selected.addEventListener('click', function (e) {
        e.stopPropagation();
        // Close other dropdowns
        document.querySelectorAll('.custom-dropdown-options').forEach(optList => {
          if (optList !== options) optList.style.display = 'none';
        });
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
      });
      // Option click
      options.querySelectorAll('.custom-dropdown-option').forEach(optEl => {
        optEl.addEventListener('click', function () {
          const url = optEl.getAttribute('data-value');
          if (url && typeof url === 'string') {
            window.open(url, '_blank', 'noopener');
            options.style.display = 'none';
          }
        });
      });
    });
    // Close dropdowns when clicking outside
    document.addEventListener('click', function () {
      document.querySelectorAll('.custom-dropdown-options').forEach(optList => {
        optList.style.display = 'none';
      });
    });
  }

  addScrollListeners() {
    const bar = this.bar;

    function handleScrollEvent() {
      if (window.scrollY > 0 || document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
        bar.style.display = 'none';
      } else {
        bar.style.display = '';
      }
    }

    window.addEventListener('scroll', handleScrollEvent);
    document.addEventListener('scroll', handleScrollEvent);
    document.body.addEventListener('scroll', handleScrollEvent);
  }

  injectCSS() {
    const style = document.createElement('style');
    style.textContent = `
#ext-bookmark-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #e3e3e3;
  background-image: url("https://bookmarks.applebaum.treehouse/EBP-Browser-Bookmark-Bar/icons/bluefish-aquarium_background-25px.jpg");
  background-repeat: no-repeat;
  min-height: 20px;
  width: 100vw;
  box-sizing: border-box;
  padding: 3px 0px;
  z-index: 999999;
  position: relative;
}
.bookmark-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  transition: background 0.2s;
}
#ext-bookmark-bar .bookmark-item:first-child {
  margin-left: 145px;
}
.bookmark-item:last-child {
  margin-right: 0;
}
.bookmark-item:hover {
  background: #d0d0d0;
}
.bookmark-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}
.bookmark-label {
  font-size: 12px;
  font-family: "Arial", sans-serif;
  color: #222;
  white-space: nowrap;
}
/* Custom dropdown styles */
.custom-dropdown {
  position: relative;
  min-width: 120px;
  user-select: none;
}
.custom-dropdown-selected {
  background: #fff;
  border: 1px solid #bbb;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
  min-width: 80px;
  font-size: 12px;
  display: flex;
  align-items: center;
}
.custom-dropdown-options {
  position: absolute;
  left: 0;
  top: 100%;
  background: #fff;
  border: 1px solid #bbb;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  min-width: 120px;
  z-index: 1000000;
  margin-top: 2px;
}
.custom-dropdown-option {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}
.custom-dropdown-option:hover, .custom-dropdown-option:focus {
  background: #e3e3e3;
  outline: none;
}
.dropdown-option-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}
.dropdown-option-label {
  font-size: 12px;
  color: #222;
  white-space: nowrap;
}
`;
    document.head.appendChild(style);
  }
}

// Initialize the bookmark bar
(function () {
  new BookmarkBar();
})();
