(function () {

  "use strict";


  /* =========================================
     PREVENT DUPLICATE
  ========================================= */

  if (document.getElementById("custom-explore-bar-root")) return;


  /* =========================================
     ICONS
  ========================================= */

  function getIconSvg(title) {

    const key = (title || "").toLowerCase();


    if (key.includes("map")) {

      return `
        <svg viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <polygon
            points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>

          <line x1="8" y1="2" x2="8" y2="18"/>

          <line x1="16" y1="6" x2="16" y2="22"/>

        </svg>
      `;

    }


    if (key.includes("inbox")) {

      return `
        <svg viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <polyline
            points="22 12 16 12 14 15 10 15 8 12 2 12"/>

          <path
            d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>

        </svg>
      `;

    }


    if (key.includes("media")) {

      return `
        <svg viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="10"/>

          <polygon
            points="10 8 16 12 10 16"/>

        </svg>
      `;

    }


    if (key.includes("explore")) {

      return `
        <svg viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2">

          <circle
            cx="12"
            cy="12"
            r="10"/>

          <polygon
            points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>

        </svg>
      `;

    }


    return `
      <svg viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2">

        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"/>

      </svg>
    `;

  }



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


      leftPlaceholder: {

        title: "Tab 1",

        url: "#",

        desc: "Placeholder"

      },


      media: {

        title: "Media",

        url: "https://gitoldor.github.io/67/index.html",

        desc: "Audio & Visuals"

      },


      inbox: {

        title: "Inbox",

        url: "nofeature.html",

        desc: "Messages & Alerts"

      },


      rightPlaceholder1: {

        title: "Tab 2",

        url: "#",

        desc: "Placeholder"

      },


      rightPlaceholder2: {

        title: "Tab 3",

        url: "#",

        desc: "Placeholder"

      }

    }

  };



  /* =========================================
     ROOT
  ========================================= */

  const container = document.createElement("div");


  container.id =
    "custom-explore-bar-root";


  Object.assign(
    container.style,
    {

      position: "fixed",

      bottom: config.bottom,

      right: config.right,

      zIndex: config.zIndex,

      display: "flex",

      alignItems: "center"

    }
  );



  /* =========================================
     HTML
  ========================================= */

  container.innerHTML = `


    <div class="explore-wrapper">


      <!-- TOGGLE -->


      <button
        class="toggle-arrow-btn"
        aria-label="Toggle navigation">

        <svg
          class="arrow-icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5">

          <polyline
            points="9 18 15 12 9 6">

          </polyline>

        </svg>

      </button>



      <!-- BAR -->


      <div class="explore-bar-container">


        <div class="explore-bar-inner">


          <svg
            class="search-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2">


            <circle
              cx="11"
              cy="11"
              r="8">

            </circle>


            <line
              x1="21"
              y1="21"
              x2="16.65"
              y2="16.65">

            </line>


          </svg>



          <input
            type="text"
            autocomplete="off"
            placeholder="${config.text}" />


        </div>



        <!-- DROPDOWN -->


        <div class="explore-dropdown">


          <div class="navigation-grid">


            <!-- MAP -->


            <a
              href="${config.tabs.map.url}"
              class="nav-tile tile-map">

              <span class="tile-icon">

                ${getIconSvg("map")}

              </span>


              <div class="tile-text">

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


            <a
              href="${config.tabs.explore.url}"
              class="nav-tile tile-explore">


              <span class="tile-icon">

                ${getIconSvg("explore")}

              </span>


              <div class="tile-text">


                <div class="tile-title hero-title">

                  ${config.tabs.explore.title}

                </div>


                <div class="tile-desc">

                  ${config.tabs.explore.desc}

                </div>


              </div>


            </a>



            <!-- TAB 1 -->


            <a
              href="${config.tabs.leftPlaceholder.url}"
              class="nav-tile tile-placeholder">


              <span class="tile-icon">

                ${getIconSvg("")}

              </span>


              <div class="tile-title">

                ${config.tabs.leftPlaceholder.title}

              </div>


            </a>



            <!-- MEDIA -->


            <a
              href="${config.tabs.media.url}"
              class="nav-tile tile-media">


              <span class="tile-icon">

                ${getIconSvg("media")}

              </span>


              <div class="tile-title">

                ${config.tabs.media.title}

              </div>


            </a>



            <!-- INBOX -->


            <a
              href="${config.tabs.inbox.url}"
              class="nav-tile tile-inbox">


              <span class="tile-icon">

                ${getIconSvg("inbox")}

              </span>


              <div class="tile-title">

                ${config.tabs.inbox.title}

              </div>


            </a>



            <!-- TAB 2 -->


            <a
              href="${config.tabs.rightPlaceholder1.url}"
              class="nav-tile tile-placeholder">


              <span class="tile-icon">

                ${getIconSvg("")}

              </span>


              <div class="tile-title">

                ${config.tabs.rightPlaceholder1.title}

              </div>


            </a>



            <!-- TAB 3 -->


            <a
              href="${config.tabs.rightPlaceholder2.url}"
              class="nav-tile tile-placeholder">


              <span class="tile-icon">

                ${getIconSvg("")}

              </span>


              <div class="tile-title">

                ${config.tabs.rightPlaceholder2.title}

              </div>


            </a>


          </div>


        </div>


      </div>


    </div>



    <style>


      /* =========================================
         ROOT ENTRANCE
      ========================================= */


      #custom-explore-bar-root {

        animation:

          rootEnter .8s
          cubic-bezier(.16,1,.3,1)
          both;

      }


      @keyframes rootEnter {

        0% {

          opacity: 0;

          transform:

            translateY(50px)
            scale(.85);

        }


        100% {

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

        display: flex;

        align-items: center;

        position: relative;

      }



      /* =========================================
         TOGGLE BUTTON
      ========================================= */


      #custom-explore-bar-root
      .toggle-arrow-btn {

        width: 28px;

        height: 28px;

        border-radius: 50%;

        border:

          1px solid
          rgba(0,0,0,.1);

        background:

          ${config.backgroundColor};

        box-shadow:

          0 4px 12px
          rgba(0,0,0,.12);

        display: flex;

        align-items: center;

        justify-content: center;

        position: absolute;

        left: -14px;

        z-index: 20;

        cursor: pointer;

        color: #555;

        transition:

          transform .45s
          cubic-bezier(.16,1,.3,1),

          box-shadow .3s ease,

          background .3s ease;

      }


      #custom-explore-bar-root
      .toggle-arrow-btn:hover {

        transform:

          scale(1.1);

        box-shadow:

          0 7px 18px
          rgba(0,0,0,.18);

      }


      #custom-explore-bar-root
      .toggle-arrow-btn:active {

        transform:

          scale(.85);

      }



      /* =========================================
         BAR CONTAINER
      ========================================= */


      #custom-explore-bar-root
      .explore-bar-container {

        position: relative;

      }



      /* =========================================
         SEARCH BAR
      ========================================= */


      #custom-explore-bar-root
      .explore-bar-inner {

        display: flex;

        align-items: center;

        gap: 12px;

        width: ${config.width};

        height: ${config.height};

        padding:

          0 18px
          0 22px;

        box-sizing:

          border-box;

        border-radius:

          999px;

        background:

          ${config.backgroundColor};

        border:

          1px solid
          rgba(0,0,0,.05);

        box-shadow:

          0 6px 20px
          rgba(0,0,0,.10);

        overflow: hidden;

        transform-origin:

          right center;

        transition:

          width .6s
          cubic-bezier(.16,1,.3,1),

          opacity .35s ease,

          padding .6s
          cubic-bezier(.16,1,.3,1),

          transform .35s ease,

          box-shadow .35s ease;

      }



      /* =========================================
         OPEN BAR
      ========================================= */


      #custom-explore-bar-root
      .explore-bar-container.is-open
      .explore-bar-inner {

        transform:

          translateY(-2px)
          scale(1.02);

        box-shadow:

          0 12px 30px
          rgba(0,0,0,.15);

      }



      /* =========================================
         SEARCH ICON
      ========================================= */


      #custom-explore-bar-root
      .search-icon {

        flex-shrink: 0;

        color: #555;

        transition:

          transform .5s
          cubic-bezier(.16,1,.3,1),

          color .3s ease;

      }


      #custom-explore-bar-root
      .explore-bar-container.is-open
      .search-icon {

        transform:

          rotate(-12deg)
          scale(1.12);

        color: #111;

      }



      /* =========================================
         INPUT
      ========================================= */


      #custom-explore-bar-root
      input {

        width: 100%;

        height: 100%;

        border: none;

        outline: none;

        background: transparent;

        font-size: 15px;

        font-weight: 600;

        color:

          ${config.textColor};

        min-width: 0;

      }


      #custom-explore-bar-root
      input::placeholder {

        color: #999;

        transition:

          opacity .3s ease;

      }


      #custom-explore-bar-root
      input:focus::placeholder {

        opacity: .45;

      }



      /* =========================================
         DROPDOWN
      ========================================= */


      #custom-explore-bar-root
      .explore-dropdown {

        position: absolute;

        bottom:

          calc(
            ${config.height}
            + 14px
          );

        left: 50%;

        width: 360px;

        padding: 14px;

        box-sizing:

          border-box;

        background:

          ${config.backgroundColor};

        border:

          1px solid #eee;

        border-radius:

          30px;

        box-shadow:

          0 25px 60px
          rgba(0,0,0,.16);

        z-index: 10;


        /* CLOSED STATE */


        opacity: 0;

        visibility: hidden;

        pointer-events: none;


        transform:

          translateX(-50%)
          translateY(30px)
          scale(.88);


        transform-origin:

          bottom center;


        transition:

          opacity .25s ease,

          transform .65s
          cubic-bezier(.16,1,.3,1),

          visibility .25s;

      }



      /* =========================================
         DROPDOWN OPEN
      ========================================= */


      #custom-explore-bar-root
      .explore-bar-container.is-open
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
         TILES
      ========================================= */


      #custom-explore-bar-root
      .nav-tile {

        display: flex;

        flex-direction: column;

        justify-content: center;

        padding: 12px;

        min-height: 70px;

        text-decoration: none;

        color: #111;

        background: #f8f9fa;

        border:

          2px solid #e9ecef;

        border-radius: 22px;

        position: relative;

        box-sizing:

          border-box;

        cursor: pointer;


        /* START HIDDEN */


        opacity: 0;


        transform:

          translateY(25px)
          scale(.85);


        transition:

          opacity .4s ease,

          transform .6s
          cubic-bezier(.16,1,.3,1),

          box-shadow .3s ease,

          background .3s ease,

          border-color .3s ease,

          filter .3s ease;

      }



      /* =========================================
         TILE ENTRANCE
      ========================================= */


      #custom-explore-bar-root
      .explore-bar-container.is-open
      .nav-tile {

        opacity: 1;

        transform:

          translateY(0)
          scale(1);

      }



      /* STAGGER */


      #custom-explore-bar-root
      .explore-bar-container.is-open
      .nav-tile:nth-child(1) {

        transition-delay: .05s;

      }


      #custom-explore-bar-root
      .explore-bar-container.is-open
      .nav-tile:nth-child(2) {

        transition-delay: .10s;

      }


      #custom-explore-bar-root
      .explore-bar-container.is-open
      .nav-tile:nth-child(3) {

        transition-delay: .15s;

      }


      #custom-explore-bar-root
      .explore-bar-container.is-open
      .nav-tile:nth-child(4) {

        transition-delay: .20s;

      }


      #custom-explore-bar-root
      .explore-bar-container.is-open
      .nav-tile:nth-child(5) {

        transition-delay: .25s;

      }


      #custom-explore-bar-root
      .explore-bar-container.is-open
      .nav-tile:nth-child(6) {

        transition-delay: .30s;

      }


      #custom-explore-bar-root
      .explore-bar-container.is-open
      .nav-tile:nth-child(7) {

        transition-delay: .35s;

      }



      /* =========================================
         TILE HOVER
      ========================================= */


      #custom-explore-bar-root
      .nav-tile:hover {

        transform:

          translateY(-6px)
          scale(1.04);

        z-index: 10;

        box-shadow:

          0 14px 25px
          rgba(0,0,0,.13);

      }


      #custom-explore-bar-root
      .nav-tile:active {

        transform:

          translateY(-2px)
          scale(.97);

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

        align-items: center;

        justify-content: center;

        color: #444;


        transition:

          transform .5s
          cubic-bezier(.16,1,.3,1);

      }


      #custom-explore-bar-root
      .tile-icon svg {

        width: 100%;

        height: 100%;

      }



      /* ICON HOVER */


      #custom-explore-bar-root
      .nav-tile:hover
      .tile-icon {

        transform:

          rotate(-10deg)
          scale(1.2);

      }



      /* =========================================
         MAP TILE
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
         EXPLORE TILE
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

        border-radius:

          999px;

        color: white;

        background:

          rgba(255,255,255,.15);

        backdrop-filter:

          blur(10px);

        transition:

          transform .3s
          cubic-bezier(.16,1,.3,1),

          background .3s ease;

      }


      #custom-explore-bar-root
      .tile-map:hover
      .badge-main {

        transform:

          scale(1.08);

        background:

          rgba(255,255,255,.25);

      }



      /* =========================================
         PLACEHOLDER
      ========================================= */


      #custom-explore-bar-root
      .tile-placeholder {

        background: #fafafa;

        border:

          1px dashed #ccc;

        align-items: center;

        text-align: center;

        color: #888;

      }



      /* =========================================
         TEXT
      ========================================= */


      #custom-explore-bar-root
      .tile-title {

        font-size: 12px;

        font-weight: 600;

        transition:

          transform .3s
          cubic-bezier(.16,1,.3,1);

      }


      #custom-explore-bar-root
      .hero-title {

        font-size: 15px;

        font-weight: 700;

      }


      #custom-explore-bar-root
      .tile-desc {

        font-size: 10px;

        color: #666;

        margin-top: 2px;

        transition:

          opacity .3s ease,

          transform .3s
          cubic-bezier(.16,1,.3,1);

      }


      #custom-explore-bar-root
      .nav-tile:hover
      .tile-title {

        transform:

          translateX(2px);

      }



      /* =========================================
         SEARCH DIM
      ========================================= */


      #custom-explore-bar-root
      .nav-tile.is-dimmed {

        opacity: .18 !important;

        filter:

          grayscale(1)
          blur(.3px);

        transform:

          scale(.92)
          !important;

        pointer-events:

          none;

      }



      /* =========================================
         BEST MATCH
      ========================================= */


      #custom-explore-bar-root
      .nav-tile.is-best-match {

        opacity: 1 !important;

        filter: none;

        border-color:

          #111 !important;

        background:

          #fff !important;

        transform:

          translateY(-4px)
          scale(1.04)
          !important;

        z-index: 20;

        box-shadow:

          0 15px 30px
          rgba(0,0,0,.15);

      }



      /* =========================================
         HIDE BAR
      ========================================= */


      #custom-explore-bar-root
      .explore-wrapper.is-hidden
      .explore-bar-inner {

        width: 0;

        padding:

          0;

        opacity: 0;

        transform:

          scale(.7);

        box-shadow:

          none;

        border-color:

          transparent;

        pointer-events:

          none;

      }



      /* =========================================
         ARROW ROTATION
      ========================================= */


      #custom-explore-bar-root
      .explore-wrapper.is-hidden
      .toggle-arrow-btn {

        transform:

          rotate(180deg);

      }


      #custom-explore-bar-root
      .explore-wrapper.is-hidden
      .toggle-arrow-btn:hover {

        transform:

          rotate(180deg)
          scale(1.1);

      }



      /* =========================================
         REDUCED MOTION
      ========================================= */


      @media
      (prefers-reduced-motion: reduce) {


        #custom-explore-bar-root,

        #custom-explore-bar-root * {

          animation:

            none !important;

          transition:

            none !important;

        }


      }



      /* =========================================
         MOBILE
      ========================================= */


      @media
      (max-width: 500px) {


        #custom-explore-bar-root {

          right:

            20px !important;

          bottom:

            20px !important;

        }


        #custom-explore-bar-root
        .explore-dropdown {

          width:

            min(
              360px,
              calc(100vw - 30px)
            );

        }


        #custom-explore-bar-root
        .explore-bar-inner {

          width:

            200px;

        }


      }


    </style>

  `;



  /* =========================================
     ELEMENTS
  ========================================= */


  const wrapper =
    container.querySelector(
      ".explore-wrapper"
    );


  const toggleBtn =
    container.querySelector(
      ".toggle-arrow-btn"
    );


  const barContainer =
    container.querySelector(
      ".explore-bar-container"
    );


  const inputEl =
    container.querySelector(
      "input"
    );


  const tiles =
    Array.from(

      container.querySelectorAll(
        ".nav-tile"
      )

    );



  /* =========================================
     OPEN NAVIGATION
  ========================================= */


  function openNavigation() {


    if (

      wrapper.classList.contains(
        "is-hidden"
      )

    ) {

      return;

    }


    if (

      !barContainer.classList.contains(
        "is-open"
      )

    ) {


      barContainer.classList.add(
        "is-open"
      );


    }


  }



  /* =========================================
     CLOSE NAVIGATION
  ========================================= */


  function closeNavigation() {


    barContainer.classList.remove(
      "is-open"
    );


  }



  /* =========================================
     TOGGLE BAR
  ========================================= */


  toggleBtn.addEventListener(

    "click",

    (event) => {


      event.preventDefault();

      event.stopPropagation();


      const isHidden =

        wrapper.classList.toggle(
          "is-hidden"
        );


      if (isHidden) {


        closeNavigation();


        inputEl.blur();


      }


    }

  );



  /* =========================================
     INPUT EVENTS
  ========================================= */


  inputEl.addEventListener(

    "focus",

    () => {


      openNavigation();


    }

  );


  inputEl.addEventListener(

    "click",

    () => {


      openNavigation();


    }

  );



  /* =========================================
     SEARCH SCORE
  ========================================= */


  function calculateMatchScore(

    text,

    query

  ) {


    if (!query) {


      return 0;


    }


    const lowerText =

      text.toLowerCase();


    const lowerQuery =

      query.toLowerCase();


    if (

      lowerText ===
      lowerQuery

    ) {


      return 1;


    }


    if (

      lowerText.startsWith(
        lowerQuery
      )

    ) {


      return .88;


    }


    if (

      lowerText.includes(
        lowerQuery
      )

    ) {


      return .7;


    }


    return 0;


  }



  /* =========================================
     NAVIGATION
  ========================================= */


  function triggerNavigation(tile) {


    if (!tile) return;


    const targetUrl =

      tile.getAttribute(
        "href"
      );


    if (

      targetUrl &&

      targetUrl !== "#"

    ) {


      /* SMALL EXIT FEEL */


      tile.style.transform =

        "translateY(-2px) scale(.97)";


      setTimeout(

        () => {


          window.location.href =
            targetUrl;


        },

        120

      );


    }


  }



  /* =========================================
     SEARCH STATE
  ========================================= */


  let bestMatchTile = null;



  /* =========================================
     SEARCH INPUT
  ========================================= */


  inputEl.addEventListener(

    "input",

    (event) => {


      const query =

        event.target.value
          .trim();


      let highestScore = 0;


      bestMatchTile = null;



      /* -------------------------
         RESET TILES
      ------------------------- */


      tiles.forEach(

        (tile) => {


          tile.classList.remove(

            "is-dimmed",

            "is-best-match"

          );


        }

      );



      /* -------------------------
         EMPTY SEARCH
      ------------------------- */


      if (!query) {


        return;


      }



      /* -------------------------
         FIND BEST MATCH
      ------------------------- */


      tiles.forEach(

        (tile) => {


          const title =

            tile.querySelector(
              ".tile-title"
            )?.textContent || "";


          const desc =

            tile.querySelector(
              ".tile-desc"
            )?.textContent || "";


          const score =

            Math.max(

              calculateMatchScore(
                title,
                query
              ),

              calculateMatchScore(
                desc,
                query
              )

            );


          if (

            score >

            highestScore

          ) {


            highestScore =

              score;


            bestMatchTile =

              tile;


          }


        }

      );



      /* -------------------------
         NO MATCH
      ------------------------- */


      if (

        !bestMatchTile ||

        highestScore <= 0

      ) {


        bestMatchTile = null;


        tiles.forEach(

          (tile) => {


            tile.classList.add(
              "is-dimmed"
            );


          }

        );


        return;


      }



      /* -------------------------
         DIM OTHER TILES
      ------------------------- */


      tiles.forEach(

        (tile) => {


          if (

            tile ===
            bestMatchTile

          ) {


            tile.classList.add(
              "is-best-match"
            );


          }

          else {


            tile.classList.add(
              "is-dimmed"
            );


          }


        }

      );


    }

  );



  /* =========================================
     KEYBOARD
  ========================================= */


  inputEl.addEventListener(

    "keydown",

    (event) => {


      /* -------------------------
         ENTER
      ------------------------- */


      if (

        event.key === "Enter" &&

        bestMatchTile

      ) {


        event.preventDefault();


        triggerNavigation(
          bestMatchTile
        );


        return;


      }



      /* -------------------------
         ESCAPE
      ------------------------- */


      if (

        event.key === "Escape"

      ) {


        event.preventDefault();


        closeNavigation();


        inputEl.blur();


      }


    }

  );



  /* =========================================
     TILE CLICK ANIMATION
  ========================================= */


  tiles.forEach(

    (tile) => {


      tile.addEventListener(

        "pointerdown",

        () => {


          tile.classList.add(
            "is-pressing"
          );


        }

      );


      tile.addEventListener(

        "pointerup",

        () => {


          tile.classList.remove(
            "is-pressing"
          );


        }

      );


      tile.addEventListener(

        "pointerleave",

        () => {


          tile.classList.remove(
            "is-pressing"
          );


        }

      );


    }

  );



  /* =========================================
     OUTSIDE CLICK
  ========================================= */


  document.addEventListener(

    "click",

    (event) => {


      if (

        !container.contains(
          event.target
        )

      ) {


        closeNavigation();


        inputEl.blur();


      }


    }

  );



  /* =========================================
     APPEND
  ========================================= */


  function mount() {


    if (

      document.body &&

      !document.body.contains(
        container
      )

    ) {


      document.body.appendChild(
        container
      );


    }


  }



  if (document.body) {


    mount();


  }

  else {


    document.addEventListener(

      "DOMContentLoaded",

      mount,

      {

        once: true

      }

    );


  }


})();