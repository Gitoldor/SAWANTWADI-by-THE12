(function () {
  if (document.getElementById("custom-explore-bar-root")) return;

  function getIconSvg(title) {
    const key = (title || "").toLowerCase();
    
    if (key.includes("map")) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>`;
    }
    if (key.includes("inbox")) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`;
    }
    if (key.includes("media")) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="21" ry="21"/><polygon points="10 8 16 12 10 16 10 8"/></svg>`;
    }
    if (key.includes("explore")) {
      return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`;
  }

  const config = {
    text: "Type to navigate...",
    width: "210px",        
    height: "55px",        
    bottom: "20px",        
    right: "95px",         
    zIndex: "999999",      
    backgroundColor: "#ffffff",
    textColor: "#111111",
    
    tabs: {
      map: { title: "Map View", url: "map.html", desc: "Live Tracking" },
      explore: { title: "Explore", url: "nofeature.html", desc: "Discover Content" },
      leftPlaceholder: { title: "Tab 1", url: "#", desc: "Placeholder" },
      media: { title: "Media", url: "https://gitoldor.github.io/67/index.html", desc: "Audio & Visuals" },
      inbox: { title: "Inbox", url: "nofeature.html", desc: "Messages & Alerts" },
      rightPlaceholder1: { title: "Tab 2", url: "#", desc: "Placeholder" },
      rightPlaceholder2: { title: "Tab 3", url: "#", desc: "Placeholder" }
    }
  };

  const container = document.createElement("div");
  container.id = "custom-explore-bar-root";
  
  Object.assign(container.style, {
    position: "fixed",
    bottom: config.bottom,
    right: config.right,
    zIndex: config.zIndex,
    display: "flex",
    alignItems: "center"
  });

  container.innerHTML = `
    <div class="explore-wrapper">
      <button class="toggle-arrow-btn" aria-label="Toggle navigation">
        <svg class="arrow-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>

      <div class="explore-bar-container">
        <div class="explore-bar-inner">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="${config.text}" />
        </div>

        <div class="explore-dropdown">
          <div class="navigation-grid">
            
            <a href="${config.tabs.map.url}" class="nav-tile tile-map">
              <span class="tile-icon hero-icon">${getIconSvg('map')}</span>
              <div class="tile-text">
                <div class="tile-title hero-title">${config.tabs.map.title}</div>
                <div class="tile-desc">${config.tabs.map.desc}</div>
              </div>
              <span class="badge-main">Main</span>
            </a>

            <a href="${config.tabs.explore.url}" class="nav-tile tile-explore">
              <span class="tile-icon hero-icon">${getIconSvg('explore')}</span>
              <div class="tile-text">
                <div class="tile-title hero-title">${config.tabs.explore.title}</div>
                <div class="tile-desc">${config.tabs.explore.desc}</div>
              </div>
            </a>

            <a href="${config.tabs.leftPlaceholder.url}" class="nav-tile tile-placeholder">
              <span class="tile-icon">${getIconSvg('')}</span>
              <div class="tile-title">${config.tabs.leftPlaceholder.title}</div>
            </a>

            <a href="${config.tabs.media.url}" class="nav-tile tile-media">
              <span class="tile-icon">${getIconSvg('media')}</span>
              <div class="tile-title">${config.tabs.media.title}</div>
            </a>

            <a href="${config.tabs.inbox.url}" class="nav-tile tile-inbox">
              <span class="tile-icon">${getIconSvg('inbox')}</span>
              <div class="tile-title">${config.tabs.inbox.title}</div>
            </a>

            <a href="${config.tabs.rightPlaceholder1.url}" class="nav-tile tile-placeholder">
              <span class="tile-icon">${getIconSvg('')}</span>
              <div class="tile-title">${config.tabs.rightPlaceholder1.title}</div>
            </a>

            <a href="${config.tabs.rightPlaceholder2.url}" class="nav-tile tile-placeholder">
              <span class="tile-icon">${getIconSvg('')}</span>
              <div class="tile-title">${config.tabs.rightPlaceholder2.title}</div>
            </a>

          </div>
        </div>
      </div>
    </div>

    <style>
      #custom-explore-bar-root .explore-wrapper {
        display: flex;
        align-items: center;
        position: relative;
      }

      #custom-explore-bar-root .toggle-arrow-btn {
        width: 26px;
        height: 26px;
        border-radius: 9999px;
        background: ${config.backgroundColor};
        border: 1px solid #e0e0e0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        position: absolute;
        left: -13px;
        z-index: 3;
        color: #666;
        transition: transform 0.2s ease, color 0.2s ease;
      }

      #custom-explore-bar-root .toggle-arrow-btn:hover {
        color: #111;
      }

      #custom-explore-bar-root .explore-bar-container { position: relative; }

      #custom-explore-bar-root .explore-bar-inner {
        display: flex;
        align-items: center;
        gap: 12px;
        width: ${config.width};
        height: ${config.height};
        padding: 0 18px 0 22px;
        background-color: ${config.backgroundColor};
        border: 1px solid #ffffff;
        border-radius: 9999px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
      }

      #custom-explore-bar-root input {
        border: none; outline: none; background: transparent;
        width: 100%; height: 100%; font-size: 15px; font-weight: 600;
        color: ${config.textColor};
      }

      #custom-explore-bar-root .explore-dropdown {
        display: none;
        position: absolute;
        bottom: calc(${config.height} + 12px);
        left: 50%;
        transform: translateX(-50%);
        width: 360px;
        background-color: ${config.backgroundColor};
        border-radius: 30px;
        box-shadow: 0 20px 48px rgba(0, 0, 0, 0.16);
        border: 1px solid #eaeaea;
        padding: 14px;
        box-sizing: border-box;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        z-index: 2;
      }

      #custom-explore-bar-root .explore-bar-container.is-open .explore-dropdown {
        display: block;
      }

      #custom-explore-bar-root .navigation-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }

      #custom-explore-bar-root .nav-tile {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 12px;
        text-decoration: none;
        color: #111111;
        background: #f8f9fa;
        border: 2px solid #e9ecef;
        border-radius: 22px;
        position: relative;
        box-sizing: border-box;
        opacity: 1;
        transform-origin: center center;
        transition: transform 0.25s ease, border-color 0.2s ease, background-color 0.2s ease, opacity 0.2s ease;
      }

      #custom-explore-bar-root .nav-tile:hover {
        transform: rotate(0deg) scale(1.02) !important;
        z-index: 5;
      }

      #custom-explore-bar-root .tile-icon {
        color: #444444;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 4px;
        width: 22px;
        height: 22px;
      }

      #custom-explore-bar-root .tile-icon svg {
        width: 100%;
        height: 100%;
      }

      #custom-explore-bar-root .nav-tile.is-dimmed {
        opacity: 0.3;
      }

      #custom-explore-bar-root .nav-tile.is-best-match {
        border-color: #111111 !important;
        background: #ffffff !important;
        opacity: 1 !important;
        transform: rotate(0deg) !important;
        z-index: 10;
      }

      /* Map Tile (Top Left 2x2) */
      #custom-explore-bar-root .tile-map {
        grid-column: span 2;
        grid-row: span 2;
        background: #111111;
        color: #ffffff;
        border-color: #111111;
        border-radius: 26px;
        justify-content: space-between;
        min-height: 110px;
      }

      #custom-explore-bar-root .tile-map .tile-icon { color: #ffffff; }
      #custom-explore-bar-root .tile-map .tile-desc { color: #aaaaaa; font-size: 11px; }

      /* Explore Tile (Top Right 2x2) */
      #custom-explore-bar-root .tile-explore {
        grid-column: span 2;
        grid-row: span 2;
        background: #f0f4ff;
        border-color: #d0e0ff;
        border-radius: 26px;
        justify-content: space-between;
        min-height: 110px;
      }

      #custom-explore-bar-root .tile-explore .tile-icon { color: #2563eb; }
      #custom-explore-bar-root .tile-explore .tile-desc { color: #4b5563; font-size: 11px; }

      #custom-explore-bar-root .badge-main {
        position: absolute;
        top: 10px; right: 10px;
        background: rgba(255,255,255,0.2);
        color: #fff;
        font-size: 9px;
        padding: 3px 8px;
        border-radius: 9999px;
        text-transform: uppercase;
        font-weight: 700;
      }

      #custom-explore-bar-root .tile-placeholder {
        background: #fafafa;
        border: 1px dashed #cccccc;
        border-radius: 20px;
        align-items: center;
        text-align: center;
        color: #888888;
      }

      #custom-explore-bar-root .tile-title { font-size: 12px; font-weight: 600; }
      #custom-explore-bar-root .hero-title { font-size: 15px; font-weight: 700; }
      #custom-explore-bar-root .tile-desc { font-size: 10px; color: #666666; margin-top: 2px; }

      #custom-explore-bar-root .explore-wrapper.is-hidden .explore-bar-inner {
        width: 0px; padding: 0; opacity: 0; border: none;
      }

      #custom-explore-bar-root .explore-wrapper.is-hidden .toggle-arrow-btn {
        transform: rotate(180deg);
      }
    </style>
  `;

  const wrapper = container.querySelector(".explore-wrapper");
  const toggleBtn = container.querySelector(".toggle-arrow-btn");
  const barContainer = container.querySelector(".explore-bar-container");
  const inputEl = container.querySelector("input");
  const tiles = Array.from(container.querySelectorAll(".nav-tile"));

  tiles.forEach((tile) => {
    const randomTilt = (Math.random() * 2 - 1).toFixed(2);
    tile.dataset.tilt = randomTilt;
    tile.style.transform = `rotate(${randomTilt}deg)`;
  });

  toggleBtn.addEventListener("click", () => {
    wrapper.classList.toggle("is-hidden");
    if (wrapper.classList.contains("is-hidden")) barContainer.classList.remove("is-open");
  });

  inputEl.addEventListener("focus", () => barContainer.classList.add("is-open"));
  inputEl.addEventListener("click", () => barContainer.classList.add("is-open"));

  let bestMatchTile = null;

  function calculateMatchScore(text, query) {
    if (!query) return 0;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    if (lowerText === lowerQuery) return 1.0;
    if (lowerText.startsWith(lowerQuery)) return 0.88;
    if (lowerText.includes(lowerQuery)) return 0.7;
    return 0;
  }

  function triggerNavigation(tile) {
    const targetUrl = tile.getAttribute("href");
    if (targetUrl && targetUrl !== "#") {
      window.location.href = targetUrl;
    }
  }

  inputEl.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    let highestScore = -1;
    bestMatchTile = null;

    tiles.forEach((tile) => {
      const title = tile.querySelector(".tile-title")?.textContent || "";
      const desc = tile.querySelector(".tile-desc")?.textContent || "";
      const score = Math.max(
        calculateMatchScore(title, query),
        calculateMatchScore(desc, query)
      );

      tile.classList.remove("is-best-match", "is-dimmed");
      tile.style.transform = `rotate(${tile.dataset.tilt}deg)`;

      if (!query) return;

      if (score > highestScore && score > 0) {
        highestScore = score;
        bestMatchTile = tile;
      } else {
        tile.classList.add("is-dimmed");
      }
    });

    if (bestMatchTile && query) {
      bestMatchTile.classList.remove("is-dimmed");
      bestMatchTile.classList.add("is-best-match");

      if (highestScore === 1.0) {
        triggerNavigation(bestMatchTile);
      }
    }
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && bestMatchTile) {
      e.preventDefault();
      triggerNavigation(bestMatchTile);
    }
    if (e.key === "Escape") {
      barContainer.classList.remove("is-open");
    }
  });

  document.addEventListener("click", (event) => {
    if (!container.contains(event.target)) {
      barContainer.classList.remove("is-open");
    }
  });

  if (document.body) {
    document.body.appendChild(container);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(container));
  }
})();
