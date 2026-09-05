/* ============================================================
   SHO1RE1 UNIVERSAL POST SHARING
   Works with the existing map/card system.
   Does NOT replace the existing UI.
   ============================================================ */

(function () {
  "use strict";

  const SHARE_CLASS = "universal-share-btn";
  const EXIT_ID = "universal-exit-shared";

  /* ------------------------------------------------------------
     STYLES
     ------------------------------------------------------------ */

  function addStyles() {
    if (document.getElementById("universal-share-styles")) return;

    const style = document.createElement("style");
    style.id = "universal-share-styles";

    style.textContent = `
      .${SHARE_CLASS} {
        position: absolute !important;
        top: 10px !important;
        right: 10px !important;

        width: 38px !important;
        height: 38px !important;

        border: 0 !important;
        border-radius: 50% !important;

        background: rgba(0,0,0,.72) !important;
        color: #fff !important;

        display: flex !important;
        align-items: center !important;
        justify-content: center !important;

        padding: 0 !important;
        margin: 0 !important;

        z-index: 99999 !important;

        cursor: pointer !important;
        pointer-events: auto !important;

        box-shadow: 0 4px 14px rgba(0,0,0,.35) !important;

        -webkit-backdrop-filter: blur(8px);
        backdrop-filter: blur(8px);
      }

      .${SHARE_CLASS} svg {
        width: 19px !important;
        height: 19px !important;
        fill: none !important;
        stroke: currentColor !important;
        stroke-width: 2 !important;
        stroke-linecap: round !important;
        stroke-linejoin: round !important;
        pointer-events: none !important;
      }

      #${EXIT_ID} {
        position: fixed !important;
        left: 14px !important;
        top: 14px !important;

        z-index: 999999 !important;

        border: 0 !important;
        border-radius: 999px !important;

        padding: 11px 16px !important;

        background: rgba(0,0,0,.82) !important;
        color: #fff !important;

        font-family: Inter, sans-serif !important;
        font-size: 13px !important;
        font-weight: 700 !important;

        box-shadow: 0 5px 20px rgba(0,0,0,.35) !important;

        cursor: pointer !important;

        -webkit-backdrop-filter: blur(10px);
        backdrop-filter: blur(10px);
      }

      #universal-share-toast {
        position: fixed;
        left: 50%;
        bottom: 28px;
        transform: translateX(-50%) translateY(20px);

        z-index: 1000000;

        background: rgba(0,0,0,.88);
        color: #fff;

        padding: 10px 16px;
        border-radius: 999px;

        font-family: Inter, sans-serif;
        font-size: 13px;
        font-weight: 600;

        opacity: 0;
        pointer-events: none;

        transition:
          opacity .2s ease,
          transform .2s ease;
      }

      #universal-share-toast.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    `;

    document.head.appendChild(style);
  }


  /* ------------------------------------------------------------
     TOAST
     ------------------------------------------------------------ */

  function toast(message) {
    let el = document.getElementById("universal-share-toast");

    if (!el) {
      el = document.createElement("div");
      el.id = "universal-share-toast";
      document.body.appendChild(el);
    }

    el.textContent = message;

    requestAnimationFrame(() => {
      el.classList.add("show");
    });

    clearTimeout(el._timer);

    el._timer = setTimeout(() => {
      el.classList.remove("show");
    }, 1800);
  }


  /* ------------------------------------------------------------
     SHARE ICON
     ------------------------------------------------------------ */

  function shareIcon() {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line>
        <line x1="15.4" y1="6.5" x2="8.6" y2="10.5"></line>
      </svg>
    `;
  }


  /* ------------------------------------------------------------
     FIND POST DATA FOR A CARD
     ------------------------------------------------------------ */

  function getPostForCard(card) {

    if (!card) return null;

    const cards = Array.from(
      document.querySelectorAll("#carousel .card")
    );

    const index = cards.indexOf(card);

    if (index < 0) return null;

    try {
      if (
        typeof activePlaces !== "undefined" &&
        Array.isArray(activePlaces) &&
        activePlaces[index]
      ) {
        return activePlaces[index];
      }
    } catch (e) {}

    return null;
  }


  /* ------------------------------------------------------------
     SHARE ONE POST
     ------------------------------------------------------------ */

  async function sharePost(post) {

    if (!post || post.id === undefined || post.id === null) {
      toast("Post ID not found");
      return;
    }

    const url =
      window.location.origin +
      window.location.pathname +
      "?post=" +
      encodeURIComponent(String(post.id));

    const title =
      post.title ||
      "Sawantwadi Post";

    const text =
      post.title
        ? `Check out "${post.title}"`
        : "Check out this post";

    try {

      if (navigator.share) {

        await navigator.share({
          title: title,
          text: text,
          url: url
        });

        return;
      }

    } catch (error) {

      if (error && error.name === "AbortError") {
        return;
      }
    }


    try {

      await navigator.clipboard.writeText(url);

      toast("Share link copied");

      return;

    } catch (error) {}


    /* Final fallback */

    const input = document.createElement("input");

    input.value = url;

    input.style.position = "fixed";
    input.style.opacity = "0";

    document.body.appendChild(input);

    input.select();

    try {
      document.execCommand("copy");
      toast("Share link copied");
    } catch (error) {
      toast(url);
    }

    input.remove();
  }


  /* ------------------------------------------------------------
     ADD SHARE BUTTONS TO EXISTING CARDS
     ------------------------------------------------------------ */

  function addShareButtons() {

    const cards =
      document.querySelectorAll("#carousel .card");

    if (!cards.length) return;

    cards.forEach(card => {

      if (card.querySelector("." + SHARE_CLASS)) {
        return;
      }

      const post = getPostForCard(card);

      if (!post) return;

      /*
       * Make sure the card can contain an absolute-positioned button.
       * We don't change its visual design.
       */

      const computed =
        window.getComputedStyle(card);

      if (computed.position === "static") {
        card.style.position = "relative";
      }


      const button =
        document.createElement("button");

      button.type = "button";
      button.className = SHARE_CLASS;

      button.setAttribute(
        "aria-label",
        "Share post"
      );

      button.setAttribute(
        "title",
        "Share post"
      );

      button.innerHTML = shareIcon();


      button.addEventListener(
        "click",
        function (event) {

          event.preventDefault();
          event.stopPropagation();

          /*
           * Re-read the post when clicked so that
           * filtering/re-rendering doesn't create stale data.
           */

          const currentPost =
            getPostForCard(card);

          sharePost(currentPost || post);
        },
        true
      );


      card.appendChild(button);
    });
  }


  /* ------------------------------------------------------------
     EXIT SHARED POST MODE
     ------------------------------------------------------------ */

  function exitSharedPost() {

    const url =
      new URL(window.location.href);

    url.searchParams.delete("post");

    /*
     * Reload the exact same normal map page.
     * No alternate screen.
     */

    window.location.href = url.pathname + url.search + url.hash;
  }


  /* ------------------------------------------------------------
     EXIT BUTTON
     ------------------------------------------------------------ */

  function createExitButton() {

    if (
      document.getElementById(EXIT_ID)
    ) {
      return;
    }

    const button =
      document.createElement("button");

    button.id = EXIT_ID;

    button.type = "button";

    button.textContent =
      "← View all posts";

    button.addEventListener(
      "click",
      exitSharedPost
    );

    document.body.appendChild(button);
  }


  /* ------------------------------------------------------------
     REMOVE EXIT BUTTON
     ------------------------------------------------------------ */

  function removeExitButton() {

    const button =
      document.getElementById(EXIT_ID);

    if (button) {
      button.remove();
    }
  }


  /* ------------------------------------------------------------
     OPEN POST FROM ?post=ID
     ------------------------------------------------------------ */

  function openSharedPost() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const requestedId =
      params.get("post");

    if (!requestedId) {
      removeExitButton();
      return;
    }


    /*
     * Wait until IndexedDB has rendered
     * the cards onto the map.
     */

    let attempts = 0;

    const timer =
      setInterval(() => {

        attempts++;

        let places = [];

        try {
          if (
            typeof activePlaces !== "undefined" &&
            Array.isArray(activePlaces)
          ) {
            places = activePlaces;
          }
        } catch (e) {}


        const cards =
          Array.from(
            document.querySelectorAll(
              "#carousel .card"
            )
          );


        if (!places.length || !cards.length) {

          if (attempts > 80) {
            clearInterval(timer);

            /*
             * Post does not exist anymore.
             */

            const cleanURL =
              new URL(window.location.href);

            cleanURL.searchParams.delete("post");

            window.history.replaceState(
              {},
              "",
              cleanURL.pathname +
              cleanURL.search +
              cleanURL.hash
            );

            toast("Post not found");

          }

          return;
        }


        const index =
          places.findIndex(
            post =>
              String(post.id) ===
              String(requestedId)
          );


        if (index === -1) {

          clearInterval(timer);

          const cleanURL =
            new URL(window.location.href);

          cleanURL.searchParams.delete("post");

          window.history.replaceState(
            {},
            "",
            cleanURL.pathname +
            cleanURL.search +
            cleanURL.hash
          );

          toast("Post not found");

          return;
        }


        const card = cards[index];

        if (!card) return;


        clearInterval(timer);

        createExitButton();


        /*
         * THIS IS THE IMPORTANT PART:
         *
         * We trigger the EXISTING card click.
         *
         * Your existing code already does:
         * setActive(index)
         * map.flyTo(...)
         *
         * So the shared URL behaves exactly
         * like tapping the normal card.
         */

        card.click();


        /*
         * Make sure the selected card is visible
         * in the existing carousel.
         */

        setTimeout(() => {

          try {

            card.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center"
            });

          } catch (e) {}

        }, 100);

      }, 250);
  }


  /* ------------------------------------------------------------
     WATCH FOR DYNAMICALLY CREATED CARDS
     ------------------------------------------------------------ */

  function startObserver() {

    const observer =
      new MutationObserver(() => {

        addShareButtons();

      });


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );


    /*
     * Backup scanner.
     * Handles IndexedDB rendering and
     * complete carousel replacement.
     */

    setInterval(() => {

      addShareButtons();

    }, 500);
  }


  /* ------------------------------------------------------------
     INITIALIZE
     ------------------------------------------------------------ */

  function init() {

    addStyles();

    addShareButtons();

    startObserver();

    /*
     * Give the existing app time to initialize
     * IndexedDB and render the map.
     */

    setTimeout(() => {

      addShareButtons();
      openSharedPost();

    }, 300);

    setTimeout(() => {

      addShareButtons();

      if (
        new URLSearchParams(
          window.location.search
        ).has("post")
      ) {
        openSharedPost();
      }

    }, 1500);
  }


  if (document.readyState === "loading") {

    document.addEventListener(
      "DOMContentLoaded",
      init
    );

  } else {

    init();

  }

})();
