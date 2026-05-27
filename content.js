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
        this.allowedHostPatterns = CONFIG.allowedHostPatterns;
        this.ext = (typeof browser !== 'undefined') ? browser : chrome;
        this.logoUrl = this.ext.runtime.getURL(CONFIG.logoPath);
        this.bgUrl = this.ext.runtime.getURL(CONFIG.bgPath);
        this.bar = null;
        this.init();
    }

    isAllowedHost() {
        const hostname = window.location.hostname;
        // Exclude if any pattern matches
        return !CONFIG.excludedHostPatterns.some(pattern => pattern.test(hostname));
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
        const r = await fetch(CONFIG.bookmarksUrl);
        if (!r.ok) throw new Error('Failed to fetch bookmarks');
        return r.json();
    }

    renderBar(bookmarks) {
        // Home button HTML
        const homeButton = `
        <div class="bookmark-item home-button">
            <a href="${CONFIG.homeUrl}" target="_blank" rel="noopener noreferrer">
                <img src="${this.logoUrl}" class="bookmark-icon" alt="Home">
            </a>
        </div>
        `;
        // Render bookmarks as before
        this.bar.innerHTML =
            homeButton +
            bookmarks.map(item => {
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

        // Add the hide bar checkbox to the far right
        const hostname = window.location.hostname;
        const isHidden = this.hasHideBarCookie(hostname);
        const hideBarDiv = document.createElement('div');
        hideBarDiv.className = 'bookmark-item hide-bar-checkbox';
        hideBarDiv.style.marginLeft = 'auto';
        hideBarDiv.style.display = 'flex';
        hideBarDiv.style.alignItems = 'center';
        hideBarDiv.style.paddingRight = '16px';
        hideBarDiv.innerHTML = `
            <label style="display:flex;align-items:center;cursor:pointer;font-size:12px;">
                <input type="checkbox" id="hide-bar-checkbox" ${isHidden ? 'checked' : ''} style="margin-right:4px;">
                Hide for Site
            </label>
        `;
        this.bar.appendChild(hideBarDiv);
        // Hide the bar if the cookie is set
        if (isHidden) {
            this.bar.style.display = 'none';
        }
        // Add event listener to the checkbox
        const checkbox = hideBarDiv.querySelector('#hide-bar-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.setHideBarCookie(hostname);
                    this.bar.style.display = 'none';
                } else {
                    this.removeHideBarCookie(hostname);
                    this.bar.style.display = '';
                }
            });
        }
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
        let hideTimeout = null;
        let isHidden = false;

        function showBar() {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
            bar.classList.remove('ext-bookmark-bar-hidden');
            bar.classList.add('ext-bookmark-bar-visible');
            isHidden = false;
        }

        function hideBarDelayed() {
            if (hideTimeout) clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                bar.classList.remove('ext-bookmark-bar-visible');
                bar.classList.add('ext-bookmark-bar-hidden');
                isHidden = true;
            }, 2000);
        }

        function handleScrollEvent() {
            if (window.scrollY > 0 || document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
                hideBarDelayed();
            } else {
                showBar();
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
  font-size: 10px;
  font-family: "Arial", sans-serif;
  color: #000;
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #e3e3e3;
  background-repeat: no-repeat;
  min-height: 30px;
  width: 100vw;
  box-sizing: border-box;
  padding: 0px;
  z-index: 999999;
  position: relative;
  opacity: 1;
  visibility: visible;
  transition: opacity 0.5s ease, visibility 0.5s ease;
}
#ext-bookmark-bar.ext-bookmark-bar-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}
#ext-bookmark-bar.ext-bookmark-bar-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
.bookmark-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  cursor: pointer;
  transition: background 0.2s;
}
#ext-bookmark-bar > div > a{
  text-decoration: none;
  color: #000;
}
#ext-bookmark-bar > div.bookmark-item.home-button{
background-color: #FFF;
padding: 2px;
margin-left: 80px;
border: 1px solid #5046C8;
border-radius: 4px;
}
#ext-bookmark-bar > div.bookmark-item.home-button img.bookmark-icon {
  margin-right: 0;
  margin-bottom: 0;
  display: block;
}
#ext-bookmark-bar > div.bookmark-item.home-button > a{

}
#ext-bookmark-bar .bookmark-item:nth-child(2) {
  margin-left: 70px;
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
  display: flex;
  align-items: center;
  position: relative;
}
.custom-dropdown-selected::after {
  content: '▼'; /* ▼ and your text */
  color: #000;
  margin-left: 8px;
  display: inline-block;
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
  color: #000;
  white-space: nowrap;
}
.hide-bar-checkbox {
  margin-left: auto;
  display: flex;
  align-items: center;
  padding-right: 16px;
}
.hide-bar-checkbox label {
  font-size: 8px !important;
  padding-right: 2px;
  color:#FFF;
  cursor: pointer;
}
.hide-bar-checkbox input[type="checkbox"] {
  margin-right: 4px;
}
`;
        document.head.appendChild(style);
    }

    // Utility: Cookie helpers for bar visibility
    setHideBarCookie(hostname) {
        document.cookie = `hideBookmarkBar_${hostname}=1; path=/; max-age=2592000`;
    }

    removeHideBarCookie(hostname) {
        document.cookie = `hideBookmarkBar_${hostname}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    hasHideBarCookie(hostname) {
        return document.cookie.split(';').some(c => c.trim().startsWith(`hideBookmarkBar_${hostname}=`));
    }
}

// Initialize the bookmark bar
(function () {
    new BookmarkBar();
})();
