console.log('Sample Browser Extension content.js loaded');


(function () {
  // console.log('[ext-bookmark-bar] content.js script running.');
  // Log page and viewport heights to debug scrollability
  const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  const winHeight = window.innerHeight;
  // console.log(`[ext-bookmark-bar] document height: ${docHeight}, window.innerHeight: ${winHeight}`);
  // Log overflow CSS properties
  const htmlOverflow = window.getComputedStyle(document.documentElement).overflow;
  const bodyOverflow = window.getComputedStyle(document.body).overflow;
  // console.log(`[ext-bookmark-bar] html overflow: ${htmlOverflow}, body overflow: ${bodyOverflow}`);
  // Removed dummy div for scroll testing
  // Only show bar if on allowed network/domain
  const allowedHostPatterns = [
    /^192\.168\.100\./, // local network
    /^10\.0\.100\./,    // VPN
    /applebaum\.treehouse$/, // domain
    /avalonbloom\.com$/, // domain
    /electricbluefish\.com$/ // domain
  ];
  const hostname = window.location.hostname;
  const isAllowed = allowedHostPatterns.some(pattern => pattern.test(hostname));
  if (!isAllowed) return;

  if (document.getElementById('ext-bookmark-bar')) return;
  const bar = document.createElement('div');
  bar.id = 'ext-bookmark-bar';

  // Resolve image URLs
  const logoUrl = chrome.runtime.getURL('icons/logo16.png');
  const bgUrl = chrome.runtime.getURL('icons/bluefish-aquarium_background-25px.jpg');

  // Fetch bookmarks from central server
  fetch('https://bookmarks.applebaum.treehouse/EBP-Browser-Bookmark-Bar/bookmarks.json')
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch bookmarks');
        return r.json();
      })
      .then(bookmarks => {
        // bookmarks can be normal or dropdown
        bar.innerHTML = bookmarks.map(item => {
          // Always use local logo16.png if no icon is specified or if iconUrl is empty/invalid
          let iconSrc = logoUrl;
          if (item.iconUrl && typeof item.iconUrl === 'string' && item.iconUrl.trim() !== '') {
            iconSrc = item.iconUrl;
          }
          if (item.type === 'dropdown' && Array.isArray(item.options)) {
            // Render dropdown
            const optionsHtml = item.options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');
            return `
            <div class="bookmark-item">
              <img src="${iconSrc}" class="bookmark-icon" alt="Icon">
              <select class="bookmark-dropdown">
                ${optionsHtml}
              </select>
            </div>
          `;
          } else {
            // Render normal bookmark
            return `
            <div class="bookmark-item">
              <img src="${iconSrc}" class="bookmark-icon" alt="Icon">
              <span class="bookmark-label">${item.label}</span>
            </div>
          `;
          }
        }).join('');
        document.body.prepend(bar);
        // Set background image after element is in DOM
        bar.style.backgroundImage = `url('${bgUrl}')`;

        console.log('[ext-bookmark-bar] Attaching scroll event listener to window.');

        // Hide bar on scroll down, show on scroll top
        function handleScrollEvent(source) {
          return function () {
            // console.log(`[ext-bookmark-bar] Scroll event triggered on ${source}. window.scrollY:`, window.scrollY, 'body.scrollTop:', document.body.scrollTop, 'docEl.scrollTop:', document.documentElement.scrollTop);
            if (window.scrollY > 0 || document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
              if (bar.style.display !== 'none') {
                // console.log('[ext-bookmark-bar] Hiding bar');
              }
              bar.style.display = 'none';
            } else {
              if (bar.style.display === 'none') {
                // console.log('[ext-bookmark-bar] Showing bar');
              }
              bar.style.display = '';
            }
          }
        }

        window.addEventListener('scroll', handleScrollEvent('window'));
        document.addEventListener('scroll', handleScrollEvent('document'));
        document.body.addEventListener('scroll', handleScrollEvent('body'));
      })
      .catch(e => {
        console.error('Could not load bookmarks:', e);
      });

  // Inject CSS
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

  `;
  document.head.appendChild(style);
})();
