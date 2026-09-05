/* ============================================================
   SHO1RE1 UNIVERSAL SHARED-POST MODE
   ?post=ID  -> show ONLY that post on the existing map UI
   ============================================================ */

(function () {
  "use strict";

  const PARAM = "post";

  /* ----------------------------------------------------------
     STYLES
     ---------------------------------------------------------- */

  const style = document.createElement("style");

  style.textContent = `
    .universal-share-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 9999;
      width: 38px;
      height: 38px;
      border: 0;
      border-radius: 50%;
      background: rgba(0,0,0,.72);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 17px;
      box-shadow: 0 3px 12px rgba(0,0,0,.25);
    }

    .universal-share-btn:hover {
      transform: scale(1.06);
    }

    #universal-exit-shared {
      position: fixed;
      top: 15px;
      left: 15px;
      z-index: 999999;
      border: 0;
      border-radius: 999px;
      padding: 10px 16px;
      background: rgba(0,0,0,.82);
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(0,0,0,.3);
      backdrop-filter: blur(10px);
    }

    #universal-share-toast {
      position: fixed;
      left: 50%;
      bottom: 30px;
      transform: translateX(-50%);
      z-index: 1000000;
      padding: 10px 16px;
      border-radius: 999px;
      background: rgba(0,0,0,.85);
      color: white;
      font-size: 14px;
      pointer-events: none;
      opacity: 0;
      transition: opacity .2s ease;
    }

    #universal-share-toast.show {
      opacity: 1;
    }

    /*
      Shared mode:
      every non-shared card disappears.
    */
    body.universal-shared-mode
      #carousel .card.universal-hidden-card {
      display: none !important;
    }
  `;

  document.head.appendChild(style);


  /* ----------------------------------------------------------
     HELPERS
     ---------------------------------------------------------- */

  function getPostIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get(PARAM);
  }


  function getCards() {
    return Array.from(
      document.querySelectorAll("#carousel .card")
    );
  }


  function getPostForCard(card) {
    const cards = getCards();
    const index = cards.indexOf(card);

    if (index === -1) return null;

    /*
      activePlaces is created by your existing map code.
      We intentionally do NOT modify your card renderer.
    */

    try {
      if (
        typeof activePlaces !== "undefined" &&
        Array.isArray(activePlaces)
      ) {
        return activePlaces[index] || null;
      }
    } catch (e) {}

    return null;
  }


  function getPostId(post) {
    if (!post) return null;

    return (
      post.id ??
      post.postId ??
      post._id ??
      null
    );
  }


  /* ----------------------------------------------------------
     TOAST
     ---------------------------------------------------------- */

  function showToast(message) {
    let toast = document.getElementById(
      "universal-share-toast"
    );

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "universal-share-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 1800);
  }


  /* ----------------------------------------------------------
     SHARE
     ---------------------------------------------------------- */

  async function sharePost(post) {
    const id = getPostId(post);

    if (id === null || id === undefined) {
      showToast("Post ID not found");
      return;
    }

    const url =
      window.location.origin +
      window.location.pathname +
      "?post=" +
      encodeURIComponent(id);

    const title =
      post.title ||
      post.name ||
      "Shared post";

    try {
      if (navigator.share) {
        await navigator.share({
          title: title,
          text: "Check out this post",
          url: url
        });

        return;
      }
    } catch (error) {
      /*
        User cancelling native share is not an error
        that needs to be shown.
      */

      if (error && error.name === "AbortError") {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied!");
    } catch (error) {
      window.prompt(
        "Copy this post link:",
        url
      );
    }
  }


  /* ----------------------------------------------------------
     ADD SHARE BUTTONS
     ---------------------------------------------------------- */

  function addShareButtons() {
    const cards = getCards();

    cards.forEach(card => {

      if (
        card.querySelector(
          ".universal-share-btn"
        )
      ) {
        return;
      }

      const post = getPostForCard(card);

      if (!post) return;

      /*
        Make sure absolute positioning works.
      */

      const currentPosition =
        window.getComputedStyle(card).position;

      if (
        currentPosition === "static"
      ) {
        card.style.position = "relative";
      }

      const button =
        document.createElement("button");

      button.className =
        "universal-share-btn";

      button.type = "button";

      button.setAttribute(
        "aria-label",
        "Share post"
      );

      button.innerHTML = `
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
      `;

      button.addEventListener(
        "click",
        function (event) {

          event.preventDefault();
          event.stopPropagation();

          sharePost(
            getPostForCard(card)
          );
        }
      );

      card.appendChild(button);
    });
  }


  /* ----------------------------------------------------------
     FIND SHARED POST
     ---------------------------------------------------------- */

  function findSharedCard() {

    const sharedId =
      getPostIdFromURL();

    if (
      sharedId === null ||
      sharedId === ""
    ) {
      return null;
    }

    const cards = getCards();

    for (const card of cards) {

      const post =
        getPostForCard(card);

      if (!post) continue;

      const id =
        getPostId(post);

      if (
        String(id) ===
        String(sharedId)
      ) {
        return {
          card: card,
          post: post
        };
      }
    }

    return null;
  }


  /* ----------------------------------------------------------
     HIDE ALL OTHER POSTS
     ---------------------------------------------------------- */

  function hideAllExcept(sharedCard) {

    const cards = getCards();

    cards.forEach(card => {

      if (card === sharedCard) {

        card.classList.remove(
          "universal-hidden-card"
        );

        card.style.display = "";

      } else {

        card.classList.add(
          "universal-hidden-card"
        );
      }
    });


    /*
      IMPORTANT:
      Also hide every map marker except the marker
      belonging to the shared card.

      Your existing app uses markerMap with the
      same index as the cards.
    */

    try {

      if (
        typeof markerMap !== "undefined" &&
        markerMap instanceof Map
      ) {

        cards.forEach((card, index) => {

          const marker =
            markerMap.get(index);

          if (!marker) return;

          if (card === sharedCard) {

            try {
              marker.addTo(map);
            } catch (e) {}

          } else {

            try {
              marker.remove();
            } catch (e) {}
          }
        });
      }

    } catch (e) {}
  }


  /* ----------------------------------------------------------
     ACTIVATE SHARED POST
     ---------------------------------------------------------- */

  function activateSharedPost() {

    const shared =
      findSharedCard();

    if (!shared) {
      return false;
    }

    document.body.classList.add(
      "universal-shared-mode"
    );

    /*
      Hide every other card and marker.
    */

    hideAllExcept(
      shared.card
    );


    /*
      Use the EXISTING card click behavior.

      This means the post is selected exactly like
      a normal tap on the card.
    */

    try {
      shared.card.click();
    } catch (e) {}


    /*
      Force the correct map position as a backup.
    */

    try {

      const post =
        shared.post;

      if (
        typeof map !== "undefined" &&
        map &&
        post &&
        post.lat != null &&
        post.lng != null
      ) {

        map.flyTo(
          [
            Number(post.lat),
            Number(post.lng)
          ],
          17,
          {
            duration: 0.6
          }
        );
      }

    } catch (e) {}


    /*
      Scroll only the shared card into view.
    */

    try {

      shared.card.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });

    } catch (e) {}


    createExitButton();

    return true;
  }


  /* ----------------------------------------------------------
     EXIT SHARED MODE
     ---------------------------------------------------------- */

  function exitSharedPost() {

    const url =
      new URL(
        window.location.href
      );

    url.searchParams.delete(
      PARAM
    );

    /*
      Reload the normal page.

      This guarantees all cards and markers
      return exactly as they normally are.
    */

    window.location.href =
      url.pathname +
      (
        url.search
          ? url.search
          : ""
      ) +
      (
        url.hash
          ? url.hash
          : ""
      );
  }


  /* ----------------------------------------------------------
     EXIT BUTTON
     ---------------------------------------------------------- */

  function createExitButton() {

    if (
      document.getElementById(
        "universal-exit-shared"
      )
    ) {
      return;
    }

    const button =
      document.createElement("button");

    button.id =
      "universal-exit-shared";

    button.type = "button";

    button.textContent =
      "← View all posts";

    button.addEventListener(
      "click",
      exitSharedPost
    );

    document.body.appendChild(
      button
    );
  }


  /* ----------------------------------------------------------
     RESTORE NORMAL MODE
     ---------------------------------------------------------- */

  function restoreNormalMode() {

    document.body.classList.remove(
      "universal-shared-mode"
    );

    document
      .querySelectorAll(
        ".universal-hidden-card"
      )
      .forEach(card => {

        card.classList.remove(
          "universal-hidden-card"
        );

        card.style.display = "";
      });

    const exit =
      document.getElementById(
        "universal-exit-shared"
      );

    if (exit) {
      exit.remove();
    }
  }


  /* ----------------------------------------------------------
     MAIN SCAN
     ---------------------------------------------------------- */

  function runUniversal() {

    /*
      Always add share buttons.
    */

    addShareButtons();


    /*
      No ?post= means normal map.
    */

    if (!getPostIdFromURL()) {

      restoreNormalMode();

      return;
    }


    /*
      Try to activate shared post.
      The map is asynchronous, so this may fail
      until IndexedDB/cards have finished rendering.
    */

    activateSharedPost();
  }


  /* ----------------------------------------------------------
     WATCH FOR DYNAMIC CARD RENDERING
     ---------------------------------------------------------- */

  const observer =
    new MutationObserver(
      function () {

        addShareButtons();

        if (
          getPostIdFromURL()
        ) {
          activateSharedPost();
        }

      }
    );


  /* ----------------------------------------------------------
     START
     ---------------------------------------------------------- */

  function start() {

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );


    runUniversal();


    /*
      Backup attempts for IndexedDB/map rendering.
    */

    let attempts = 0;

    const timer =
      setInterval(
        function () {

          attempts++;

          runUniversal();

          if (
            !getPostIdFromURL() ||
            attempts >= 30
          ) {
            clearInterval(timer);
          }

        },
        500
      );
  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start
    );

  } else {

    start();
  }

})();
