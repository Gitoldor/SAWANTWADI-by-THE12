(function () {
  "use strict";

  if (document.getElementById("custom-explore-bar-root")) return;

  /* =========================================
     CONFIG
  ========================================= */

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
      map: {
        title: "Map View",
        url: "map.html",
        desc: "Live Tracking"
      },
      explore: {
        title: "Explore",
        url: "nofeature.html",
        desc: "Discover Content"
      },
      tab1: {
        title: "Tab 1",
        url: "#"
      },
      media: {
        title: "Media",
        url: "https://gitoldor.github.io/67/index.html"
      },
      inbox: {
        title: "Inbox",
        url: "nofeature.html"
      },
      tab2: {
        title: "Tab 2",
        url: "#"
      },
      tab3: {
        title: "Tab 3",
        url: "#"
      }
    }
  };


  /* =========================================
     ICONS
  ========================================= */

  function icon(type) {

    const icons = {

      map: `
        <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
          <line x1="8" y1="2" x2="8" y2="18"/>
          <line x1="16" y1="6" x2="16" y2="22"/>
        </svg>
      `,

      explore: `
        <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
      `,

      media: `
        <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
          <rect x="2" y="2" width="20" height="20" rx="10"/>
          <polygon points="10 8 16 12 10 16"/>
        </svg>
      `,

      inbox: `
        <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
          <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
        </svg>
      `,

      square: `
        <svg viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
          <rect x="4" y="4" width="16" height="16" rx="3"/>
        </svg>
      `
    };

    return icons[type] || icons.square;
  }


  /* =========================================
     CREATE ROOT
  ========================================= */

  const root = document.createElement("div");

  root.id = "custom-explore-bar-root";


  root.innerHTML = `

    <div class="explore-wrapper">

      <button class="toggle-arrow-btn"
      aria-label="Toggle navigation">

        <svg viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5">

          <polyline points="9 18 15 12 9 6"/>

        </svg>

      </button>


      <div class="explore-bar-container">


        <div class="explore-bar-inner">

          <svg class="search-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

            <circle cx="11" cy="11" r="7"/>

            <line
            x1="16"
            y1="16"
            x2="21"
            y2="21"/>

          </svg>


          <input
          type="text"
          autocomplete="off"
          placeholder="${config.text}">

        </div>



        <div class="explore-dropdown">


          <div class="navigation-grid">


            <!-- MAP -->

            <a href="${config.tabs.map.url}"
            class="nav-tile tile-map">

              <div class="tile-icon">

                ${icon("map")}

              </div>

              <div>

                <div class="tile-title hero-title">

                  ${config.tabs.map.title}

                </div>

                <div class="tile-desc">

                  ${config.tabs.map.desc}

                </div>

              </div>

              <span class="badge-main">

                Main

              </span>

            </a>



            <!-- EXPLORE -->

            <a href="${config.tabs.explore.url}"
            class="nav-tile tile-explore">

              <div class="tile-icon">

                ${icon("explore")}

              </div>

              <div>

                <div class="tile-title hero-title">

                  ${config.tabs.explore.title}

                </div>

                <div class="tile-desc">

                  ${config.tabs.explore.desc}

                </div>

              </div>

            </a>



            <!-- TAB 1 -->

            <a href="${config.tabs.tab1.url}"
            class="nav-tile tile-placeholder">

              <div class="tile-icon">

                ${icon("square")}

              </div>

              <div class="tile-title">

                ${config.tabs.tab1.title}

              </div>

            </a>



            <!-- MEDIA -->

            <a href="${config.tabs.media.url}"
            class="nav-tile">

              <div class="tile-icon">

                ${icon("media")}

              </div>

              <div class="tile-title">

                ${config.tabs.media.title}

              </div>

            </a>



            <!-- INBOX -->

            <a href="${config.tabs.inbox.url}"
            class="nav-tile">

              <div class="tile-icon">

                ${icon("inbox")}

              </div>

              <div class="tile-title">

                ${config.tabs.inbox.title}

              </div>

            </a>



            <!-- TAB 2 -->

            <a href="${config.tabs.tab2.url}"
            class="nav-tile tile-placeholder">

              <div class="tile-icon">

                ${icon("square")}

              </div>

              <div class="tile-title">

                ${config.tabs.tab2.title}

              </div>

            </a>



            <!-- TAB 3 -->

            <a href="${config.tabs.tab3.url}"
            class="nav-tile tile-placeholder">

              <div class="tile-icon">

                ${icon("square")}

              </div>

              <div class="tile-title">

                ${config.tabs.tab3.title}

              </div>

            </a>


          </div>

        </div>

      </div>

    </div>



    <style>


      /* =========================================
         ROOT
      ========================================= */

      #custom-explore-bar-root {

        position: fixed;

        right: ${config.right};

        bottom: ${config.bottom};

        z-index: ${config.zIndex};

        font-family:
          -apple-system,
          BlinkMacSystemFont,
          "Segoe UI",
          sans-serif;

        animation:
          exploreEnter .7s
          cubic-bezier(.16,1,.3,1)
          both;

      }


      @keyframes exploreEnter {

        from {

          opacity: 0;

          transform:
            translateY(50px)
            scale(.85);

        }

        to {

          opacity: 1;

          transform:
            translateY(0)
            scale(1);

        }

      }



      /* =========================================
         WRAPPER
      ========================================= */

      #custom-explore-bar-root
      .explore-wrapper {

        position: relative;

        display: flex;

        align-items: center;

      }



      /* =========================================
         TOGGLE
      ========================================= */

      #custom-explore-bar-root
      .toggle-arrow-btn {

        position: absolute;

        left: -14px;

        z-index: 10;

        width: 28px;

        height: 28px;

        border: 1px solid #e5e5e5;

        border-radius: 50%;

        background: white;

        color: #555;

        cursor: pointer;

        display: flex;

        align-items: center;

        justify-content: center;

        box-shadow:
          0 4px 12px
          rgba(0,0,0,.12);

        transition:
          transform .45s cubic-bezier(.16,1,.3,1),
          box-shadow .3s ease;

      }


      #custom-explore-bar-root
      .toggle-arrow-btn svg {

        width: 14px;

        height: 14px;

      }


      #custom-explore-bar-root
      .toggle-arrow-btn:hover {

        transform:
          scale(1.1);

        box-shadow:
          0 7px 18px
          rgba(0,0,0,.16);

      }



      /* =========================================
         BAR
      ========================================= */

      #custom-explore-bar-root
      .explore-bar-container {

        position: relative;

      }


      #custom-explore-bar-root
      .explore-bar-inner {

        width: ${config.width};

        height: ${config.height};

        display: flex;

        align-items: center;

        gap: 12px;

        padding:
          0 18px
          0 22px;

        box-sizing: border-box;

        overflow: hidden;

        border-radius: 999px;

        background:
          ${config.backgroundColor};

        border:
          1px solid #eee;

        box-shadow:
          0 6px 20px
          rgba(0,0,0,.10);

        transition:
          width .55s cubic-bezier(.16,1,.3,1),
          padding .55s cubic-bezier(.16,1,.3,1),
          opacity .35s ease,
          transform .35s ease,
          box-shadow .35s ease;

      }



      /* =========================================
         BAR OPEN
      ========================================= */

      #custom-explore-bar-root
      .explore-bar-container.is-open
      .explore-bar-inner {

        transform:
          translateY(-2px)
          scale(1.02);

        box-shadow:
          0 12px 30px
          rgba(0,0,0,.14);

      }



      /* =========================================
         SEARCH ICON
      ========================================= */

      #custom-explore-bar-root
      .search-icon {

        width: 20px;

        height: 20px;

        flex-shrink: 0;

        color: #555;

        transition:
          transform .5s cubic-bezier(.16,1,.3,1);

      }


      #custom-explore-bar-root
      .is-open
      .search-icon {

        transform:
          rotate(-10deg)
          scale(1.12);

      }



      /* =========================================
         INPUT
      ========================================= */

      #custom-explore-bar-root
      input {

        width: 100%;

        height: 100%;

        min-width: 0;

        border: none;

        outline: none;

        background: transparent;

        color:
          ${config.textColor};

        font-size: 15px;

        font-weight: 600;

      }


      #custom-explore-bar-root
      input::placeholder {

        color: #999;

      }



      /* =========================================
         DROPDOWN
      ========================================= */

      #custom-explore-bar-root
      .explore-dropdown {

        position: absolute;

        left: 50%;

        bottom:
          calc(${config.height} + 14px);

        width: 360px;

        padding: 14px;

        box-sizing: border-box;

        border-radius: 30px;

        background: white;

        border:
          1px solid #eee;

        box-shadow:
          0 25px 60px
          rgba(0,0,0,.16);

        opacity: 0;

        visibility: hidden;

        pointer-events: none;

        transform:
          translateX(-50%)
          translateY(25px)
          scale(.92);

        transform-origin:
          bottom center;

        transition:
          opacity .25s ease,
          transform .55s cubic-bezier(.16,1,.3,1),
          visibility .25s;

      }



      /* =========================================
         DROPDOWN OPEN
      ========================================= */

      #custom-explore-bar-root
      .is-open
      .explore-dropdown {

        opacity: 1;

        visibility: visible;

        pointer-events: auto;

        transform:
          translateX(-50%)
          translateY(0)
          scale(1);

      }



      /* =========================================
         GRID
      ========================================= */

      #custom-explore-bar-root
      .navigation-grid {

        display: grid;

        grid-template-columns:
          repeat(4,1fr);

        gap: 10px;

      }



      /* =========================================
         TILE
      ========================================= */

      #custom-explore-bar-root
      .nav-tile {

        position: relative;

        min-height: 70px;

        padding: 12px;

        box-sizing: border-box;

        display: flex;

        flex-direction: column;

        justify-content: center;

        text-decoration: none;

        color: #111;

        background: #f8f9fa;

        border:
          2px solid #e9ecef;

        border-radius: 22px;

        opacity: 0;

        transform:
          translateY(20px)
          scale(.9);

        transition:
          opacity .35s ease,
          transform .55s cubic-bezier(.16,1,.3,1),
          box-shadow .25s ease,
          border-color .25s ease;

      }



      /* =========================================
         TILE OPEN
      ========================================= */

      #custom-explore-bar-root
      .is-open
      .nav-tile {

        opacity: 1;

        transform:
          translateY(0)
          scale(1);

      }


      #custom-explore-bar-root
      .is-open
      .nav-tile:nth-child(1) {

        transition-delay: .03s;

      }


      #custom-explore-bar-root
      .is-open
      .nav-tile:nth-child(2) {

        transition-delay: .08s;

      }


      #custom-explore-bar-root
      .is-open
      .nav-tile:nth-child(3) {

        transition-delay: .13s;

      }


      #custom-explore-bar-root
      .is-open
      .nav-tile:nth-child(4) {

        transition-delay: .18s;

      }


      #custom-explore-bar-root
      .is-open
      .nav-tile:nth-child(5) {

        transition-delay: .23s;

      }


      #custom-explore-bar-root
      .is-open
      .nav-tile:nth-child(6) {

        transition-delay: .28s;

      }


      #custom-explore-bar-root
      .is-open
      .nav-tile:nth-child(7) {

        transition-delay: .33s;

      }



      /* =========================================
         TILE HOVER
      ========================================= */

      #custom-explore-bar-root
      .nav-tile:hover {

        transform:
          translateY(-5px)
          scale(1.03);

        z-index: 5;

        box-shadow:
          0 12px 25px
          rgba(0,0,0,.12);

      }



      /* =========================================
         ICON
      ========================================= */

      #custom-explore-bar-root
      .tile-icon {

        width: 22px;

        height: 22px;

        margin-bottom: 6px;

        display: flex;

        color: #444;

        transition:
          transform .4s cubic-bezier(.16,1,.3,1);

      }


      #custom-explore-bar-root
      .tile-icon svg {

        width: 100%;

        height: 100%;

      }


      #custom-explore-bar-root
      .nav-tile:hover
      .tile-icon {

        transform:
          rotate(-8deg)
          scale(1.15);

      }



      /* =========================================
         MAP
      ========================================= */

      #custom-explore-bar-root
      .tile-map {

        grid-column: span 2;

        grid-row: span 2;

        min-height: 110px;

        background: #111;

        color: white;

        border-color: #111;

        border-radius: 26px;

        justify-content:
          space-between;

      }


      #custom-explore-bar-root
      .tile-map
      .tile-icon {

        color: white;

      }


      #custom-explore-bar-root
      .tile-map
      .tile-desc {

        color: #aaa;

      }



      /* =========================================
         EXPLORE
      ========================================= */

      #custom-explore-bar-root
      .tile-explore {

        grid-column: span 2;

        grid-row: span 2;

        min-height: 110px;

        background: #f0f4ff;

        border-color: #d0e0ff;

        border-radius: 26px;

        justify-content:
          space-between;

      }


      #custom-explore-bar-root
      .tile-explore
      .tile-icon {

        color: #2563eb;

      }


      #custom-explore-bar-root
      .tile-explore
      .tile-desc {

        color: #4b5563;

      }



      /* =========================================
         BADGE
      ========================================= */

      #custom-explore-bar-root
      .badge-main {

        position: absolute;

        top: 10px;

        right: 10px;

        padding:
          3px 8px;

        font-size: 9px;

        font-weight: 700;

        text-transform:
          uppercase;

        border-radius: 999px;

        color: white;

        background:
          rgba(255,255,255,.15);

      }



      /* =========================================
         PLACEHOLDER
      ========================================= */

      #custom-explore-bar-root
      .tile-placeholder {

        align-items: center;

        text-align: center;

        color: #888;

        background: #fafafa;

        border:
          1px dashed #ccc;

      }



      /* =========================================
         TEXT
      ========================================= */

      #custom-explore-bar-root
      .tile-title {

        font-size: 12px;

        font-weight: 600;

      }


      #custom-explore-bar-root
      .hero-title {

        font-size: 15px;

        font-weight: 700;

      }


      #custom-explore-bar-root
      .tile-desc {

        margin-top: 2px;

        font-size: 10px;

        color: #666;

      }



      /* =========================================
         SEARCH FILTER
      ========================================= */

      #custom-explore-bar-root
      .nav-tile.is-dimmed {

        opacity: .2 !important;

        transform:
          scale(.94) !important;

        filter:
          grayscale(1);

      }


      #custom-explore-bar-root
      .nav-tile.is-best-match {

        opacity: 1 !important;

        border-color:
          #111 !important;

        transform:
          translateY(-4px)
          scale(1.04) !important;

        z-index: 10;

        box-shadow:
          0 15px 30px
          rgba(0,0,0,.14);

      }



      /* =========================================
         HIDDEN BAR
      ========================================= */

      #custom-explore-bar-root
      .explore-wrapper.is-hidden
      .explore-bar-inner {

        width: 0;

        padding-left: 0;

        padding-right: 0;

        opacity: 0;

        transform:
          scale(.8);

        pointer-events: none;

        border-color:
          transparent;

        box-shadow: none;

      }


      #custom-explore-bar-root
      .explore-wrapper.is-hidden
      .toggle-arrow-btn {

        transform:
          rotate(180deg);

      }



      /* =========================================
         MOBILE
      ========================================= */

      @media (max-width: 500px) {

        #custom-explore-bar-root {

          right: 20px;

        }

        #custom-explore-bar-root
        .explore-dropdown {

          width:
            calc(100vw - 30px);

        }

      }

    </style>

  `;


/* =========================================
     MOUNT
  ========================================= */

  function mount() {

    document.body.appendChild(root);

  }


  if (document.body) {

    mount();

  } else {

    document.addEventListener(
      "DOMContentLoaded",
      mount,
      { once: true }
    );

  }


  /* =========================================
     ELEMENTS
  ========================================= */

  const wrapper =
    root.querySelector(".explore-wrapper");

  const toggle =
    root.querySelector(".toggle-arrow-btn");

  const bar =
    root.querySelector(".explore-bar-container");

  const input =
    root.querySelector("input");

  const tiles =
    Array.from(
      root.querySelectorAll(".nav-tile")
    );


  /* =========================================
     OPEN / CLOSE
  ========================================= */

  function openMenu() {

    if (
      !wrapper.classList.contains("is-hidden")
    ) {

      bar.classList.add("is-open");

    }

  }


  function closeMenu() {

    bar.classList.remove("is-open");

  }


  /* =========================================
     TOGGLE
  ========================================= */

  toggle.addEventListener("click", function (e) {

    e.stopPropagation();

    wrapper.classList.toggle("is-hidden");

    if (
      wrapper.classList.contains("is-hidden")
    ) {

      closeMenu();

      input.blur();

    }

  });


  /* =========================================
     INPUT
  ========================================= */

  input.addEventListener(
    "focus",
    openMenu
  );

  input.addEventListener(
    "click",
    openMenu
  );


  /* =========================================
     SEARCH
  ========================================= */

  let bestMatch = null;


  function score(text, query) {

    text = text.toLowerCase();

    query = query.toLowerCase();

    if (text === query) return 1;

    if (text.startsWith(query)) return 0.8;

    if (text.includes(query)) return 0.6;

    return 0;

  }


  input.addEventListener("input", function () {

    const query =
      input.value.trim();

    bestMatch = null;

    let highest = 0;


    tiles.forEach(function (tile) {

      tile.classList.remove(
        "is-dimmed",
        "is-best-match"
      );

    });


    if (!query) return;


    tiles.forEach(function (tile) {

      const title =
        tile.querySelector(".tile-title")
        ?.textContent || "";

      const desc =
        tile.querySelector(".tile-desc")
        ?.textContent || "";

      const currentScore =
        Math.max(
          score(title, query),
          score(desc, query)
        );

      if (currentScore > highest) {

        highest = currentScore;

        bestMatch = tile;

      }

    });


    if (!bestMatch) {

      tiles.forEach(function (tile) {

        tile.classList.add("is-dimmed");

      });

      return;

    }


    tiles.forEach(function (tile) {

      if (tile === bestMatch) {

        tile.classList.add(
          "is-best-match"
        );

      } else {

        tile.classList.add(
          "is-dimmed"
        );

      }

    });

  });


  /* =========================================
     ENTER
  ========================================= */

  input.addEventListener(
    "keydown",
    function (e) {

      if (
        e.key === "Enter" &&
        bestMatch
      ) {

        e.preventDefault();

        const url =
          bestMatch.getAttribute("href");

        if (url && url !== "#") {

          window.location.href = url;

        }

      }


      if (e.key === "Escape") {

        closeMenu();

        input.blur();

      }

    }
  );


  /* =========================================
     OUTSIDE CLICK
  ========================================= */

  document.addEventListener(
    "click",
    function (e) {

      if (!root.contains(e.target)) {

        closeMenu();

      }

    }
  );

})();