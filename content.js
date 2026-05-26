console.log('Sample Browser Extension content.js loaded');

(function () {
    if (document.getElementById('ext-bookmark-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'ext-bookmark-bar';

    // Resolve image URLs
    const logoUrl = chrome.runtime.getURL('icons/logo16.png');
    const bgUrl = chrome.runtime.getURL('icons/bluefish-aquarium_background-25px.jpg');
    console.log('Resolved logo16.png URL:', logoUrl);
    console.log('Resolved background image URL:', bgUrl);

    // Test image access
    fetch(logoUrl)
        .then(r => {
            if (r.ok) {
                console.log('logo16.png loaded successfully');
            } else {
                console.error('logo16.png failed to load:', r.status, r.statusText);
            }
        })
        .catch(e => console.error('logo16.png fetch error:', e));

    fetch(bgUrl)
        .then(r => {
            if (r.ok) {
                console.log('background image loaded successfully');
            } else {
                console.error('background image failed to load:', r.status, r.statusText);
            }
        })
        .catch(e => console.error('background image fetch error:', e));

    // Use template literal for all items, with correct image URLs
    bar.innerHTML = `
    <div class="bookmark-item">
      <img src="${logoUrl}" class="bookmark-icon" alt="Icon">
      <span class="bookmark-label">james</span>
    </div>
    <div class="bookmark-item">
      <img src="${logoUrl}" class="bookmark-icon" alt="Icon">
      <span class="bookmark-label">YouTube</span>
    </div>
    <div class="bookmark-item">
      <img src="${logoUrl}" class="bookmark-icon" alt="Icon">
      <span class="bookmark-label">GitHub</span>
    </div>
  `;
    document.body.prepend(bar);

    // Inject CSS
    const style = document.createElement('style');
    style.textContent = `
#ext-bookmark-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  background: #e3e3e3;
  background-image: url("icons/bluefish-aquarium_background-25px.jpg");
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

    // Set background image after element is in DOM
    bar.style.backgroundImage = `url('${bgUrl}')`;
})();
