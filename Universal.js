/* ============================================================
   SHO1RE1 UNIVERSAL.JS
   UNIVERSAL POST SHARING + DEEP LINKS

   Works with the existing #carousel .card UI.
   No changes to existing card-rendering code required.
   ============================================================ */

(function () {

  "use strict";

  const CAROUSEL_SELECTOR = "#carousel";
  const CARD_SELECTOR = "#carousel .card";
  const SHARE_BUTTON_CLASS = "Sho1re1UniversalShare";
  const EXIT_BUTTON_ID = "Sho1re1UniversalExit";

  /* ============================================================
     GET CURRENT POSTS
     ============================================================ */

  function getPosts() {
    return window.Sho1re1VisiblePlaces || [];
  }


  /* ============================================================
     GET POST ID FROM URL
     ============================================================ */

  function getSharedPostID() {

    const params = new URLSearchParams(
      window.location.search
    );

    return params.get("post");
  }


  /* ============================================================
     CREATE SHARE URL
     ============================================================ */

  function getPostURL(post) {

    if (!post || post.id === undefined || post.id === null) {
      return window.location.href;
    }

    const url = new URL(window.location.href);

    url.search = "";

    url.searchParams.set(
      "post",
      String(post.id)
    );

    return url.toString();
  }


  /* ============================================================
     COPY FALLBACK
     ============================================================ */

  async function copyText(text) {

    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {

      await navigator.clipboard.writeText(text);

      return true;
    }


    const input = document.createElement("input");

    input.value = text;

    input.style.position = "fixed";
    input.style.left = "-9999px";
    input.style.opacity = "0";

    document.body.appendChild(input);

    input.focus();
    input.select();

    let success = false;

    try {
      success = document.execCommand("copy");
    } catch (e) {
      success = false;
    }

    input.remove();

    return success;
  }


  /* ============================================================
     TOAST
     ============================================================ */

  function toast(message) {

    const old =
      document.getElementById(
        "Sho1re1UniversalToast"
      );

    if (old) {
      old.remove();
    }


    const el = document.createElement("div");

    el.id = "Sho1re1UniversalToast";

    el.textContent = message;

    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "30px";
    el.style.transform = "translateX(-50%)";

    el.style.zIndex = "99999999";

    el.style.padding = "12px 18px";

    el.style.borderRadius = "999px";

    el.style.background = "#111";
    el.style.color = "#fff";

    el.style.fontFamily = "Inter, sans-serif";

    el.style.fontSize = "14px";
    el.style.fontWeight = "600";

    el.style.boxShadow =
      "0 10px 30px rgba(0,0,0,.35)";

    el.style.pointerEvents = "none";

    document.body.appendChild(el);

    setTimeout(function () {

      if (el.parentNode) {
        el.remove();
      }

    }, 2200);
  }


  /* ============================================================
     SHARE POST
     ============================================================ */

  async function sharePost(post) {

    if (!post) {
      return;
    }

    const url = getPostURL(post);

    const title =
      post.title ||
      post.topic ||
      "Sho1re1 Post";


    /* Native Android / iOS share sheet */

    if (
      navigator.share
    ) {

      try {

        await navigator.share({

          title: title,

          text: title,

          url: url

        });

        return;

      } catch (error) {

        /*
         User cancelled the share sheet.
        */

        if (
          error &&
          error.name === "AbortError"
        ) {

          return;
        }

      }
    }


    /* Clipboard fallback */

    try {

      const copied =
        await copyText(url);


      if (copied) {

        toast("Post link copied");

      } else {

        window.prompt(
          "Copy this post link:",
          url
        );

      }

    } catch (error) {

      window.prompt(
        "Copy this post link:",
        url
      );

    }

  }


  /* ============================================================
     CREATE SHARE ICON
     ============================================================ */

  function createShareButton(post) {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      SHARE_BUTTON_CLASS;

    button.setAttribute(
      "aria-label",
      "Share post"
    );

    button.title = "Share";


    /* Real SVG share icon */

    button.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>

        <line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line>
        <line x1="15.4" y1="6.5" x2="8.6" y2="10.5"></line>
      </svg>
    `;


    /* ========================================================
       BUTTON STYLE
       ======================================================== */

    button.style.position = "absolute";

    button.style.top = "14px";
    button.style.right = "14px";

    button.style.width = "38px";
    button.style.height = "38px";

    button.style.padding = "0";

    button.style.border = "none";

    button.style.borderRadius = "50%";

    button.style.background =
      "rgba(0,0,0,.68)";

    button.style.color = "#fff";

    button.style.backdropFilter =
      "blur(5px)";

    button.style.webkitBackdropFilter =
      "blur(5px)";

    button.style.display = "flex";

    button.style.alignItems = "center";
    button.style.justifyContent = "center";

    button.style.cursor = "pointer";

    button.style.zIndex = "999";

    button.style.boxShadow =
      "0 5px 15px rgba(0,0,0,.25)";

    button.style.transition =
      "transform .15s ease, background .15s ease";


    /* ========================================================
       CLICK
       ======================================================== */

    button.addEventListener(
      "pointerdown",
      function (event) {

        event.stopPropagation();

      },
      true
    );


    button.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        event.stopPropagation();

        sharePost(post);

      },
      true
    );


    return button;
  }


  /* ============================================================
     ADD SHARE BUTTONS
     ============================================================ */

  function addShareButtons() {

    const carousel =
      document.querySelector(
        CAROUSEL_SELECTOR
      );

    if (!carousel) {
      return;
    }


    const cards =
      carousel.querySelectorAll(
        ".card"
      );


    const posts = getPosts();


    cards.forEach(function (card, index) {

      /*
       The existing app renders cards in the same
       order as activePlaces / VisiblePlaces.
      */

      const post = posts[index];

      if (!post) {
        return;
      }


      /*
       Don't add the button twice.
      */

      if (
        card.querySelector(
          "." + SHARE_BUTTON_CLASS
        )
      ) {
        return;
      }


      /*
       Make sure the card can contain
       an absolutely positioned button.
      */

      if (
        getComputedStyle(card).position ===
        "static"
      ) {

        card.style.position = "relative";

      }


      /*
       Remember the post ID directly
       on the card.

       This is added by Universal.js,
       NOT by your existing UI code.
      */

      card.setAttribute(
        "data-sho1re1-post-id",
        String(post.id)
      );


      const button =
        createShareButton(post);


      card.appendChild(button);

    });

  }


  /* ============================================================
     FIND CARD FOR POST
     ============================================================ */

  function findCard(postID) {

    const cards =
      document.querySelectorAll(
        CARD_SELECTOR
      );


    /*
     First try our generated attribute.
    */

    for (let i = 0; i < cards.length; i++) {

      if (
        String(
          cards[i].getAttribute(
            "data-sho1re1-post-id"
          )
        ) === String(postID)
      ) {

        return cards[i];
      }

    }


    /*
     Fallback:
     match card position against visible posts.
    */

    const posts = getPosts();


    for (let i = 0; i < posts.length; i++) {

      if (
        String(posts[i].id) ===
        String(postID)
      ) {

        return cards[i] || null;
      }

    }


    return null;
  }


  /* ============================================================
     SHOW ONLY SHARED POST
     ============================================================ */

  function openSharedPost() {

    const postID =
      getSharedPostID();


    if (!postID) {
      return;
    }


    const cards =
      document.querySelectorAll(
        CARD_SELECTOR
      );


    if (!cards.length) {
      return;
    }


    const selectedCard =
      findCard(postID);


    if (!selectedCard) {

      console.warn(
        "Sho1re1 Universal.js: Post not found:",
        postID
      );

      return;
    }


    /*
     Hide every other card.
    */

    cards.forEach(function (card) {

      if (card !== selectedCard) {

        if (
          !card.hasAttribute(
            "data-sho1re1-original-display"
          )
        ) {

          card.setAttribute(
            "data-sho1re1-original-display",
            card.style.display || ""
          );

        }

        card.style.display = "none";

      }

    });


    /*
     Keep selected card visible.
    */

    selectedCard.style.display = "";


    /*
     Create exit button.
    */

    createExitButton();


    /*
     Scroll selected card into view.
    */

    setTimeout(function () {

      selectedCard.scrollIntoView({

        behavior: "smooth",

        block: "center",

        inline: "center"

      });

    }, 150);


    /*
     Change page title.
    */

    const posts = getPosts();

    const post =
      posts.find(function (p) {

        return String(p.id) ===
          String(postID);

      });


    if (
      post &&
      post.title
    ) {

      document.title =
        post.title;

    }

  }


  /* ============================================================
     EXIT SHARED MODE
     ============================================================ */

  function exitSharedPost() {

    const url =
      new URL(
        window.location.href
      );


    url.searchParams.delete(
      "post"
    );


    /*
     Remove ?post=ID without
     reloading the page.
    */

    history.pushState(
      {},
      "",
      url.pathname +
      url.search +
      url.hash
    );


    showAllPosts();

  }


  /* ============================================================
     SHOW ALL POSTS
     ============================================================ */

  function showAllPosts() {

    const hidden =
      document.querySelectorAll(
        "[data-sho1re1-original-display]"
      );


    hidden.forEach(function (element) {

      element.style.display =
        element.getAttribute(
          "data-sho1re1-original-display"
        ) || "";


      element.removeAttribute(
        "data-sho1re1-original-display"
      );

    });


    const exit =
      document.getElementById(
        EXIT_BUTTON_ID
      );


    if (exit) {
      exit.remove();
    }

  }


  /* ============================================================
     EXIT BUTTON
     ============================================================ */

  function createExitButton() {

    if (
      document.getElementById(
        EXIT_BUTTON_ID
      )
    ) {

      return;
    }


    const button =
      document.createElement("button");


    button.id =
      EXIT_BUTTON_ID;


    button.type = "button";


    button.innerHTML =
      "← View all posts";


    button.style.position = "fixed";

    button.style.top = "18px";
    button.style.left = "18px";

    button.style.zIndex =
      "99999999";


    button.style.padding =
      "11px 17px";


    button.style.border =
      "none";


    button.style.borderRadius =
      "999px";


    button.style.background =
      "#111";


    button.style.color =
      "#fff";


    button.style.fontFamily =
      "Inter, sans-serif";


    button.style.fontSize =
      "14px";


    button.style.fontWeight =
      "700";


    button.style.cursor =
      "pointer";


    button.style.boxShadow =
      "0 8px 25px rgba(0,0,0,.35)";


    button.addEventListener(
      "click",
      function () {

        exitSharedPost();

      }
    );


    document.body.appendChild(
      button
    );

  }


  /* ============================================================
     INITIALIZE
     ============================================================ */

  function initialize() {

    /*
     Your app renders the carousel dynamically,
     so scan repeatedly for a short period.
    */

    addShareButtons();

    openSharedPost();


    let attempts = 0;


    const scanner =
      setInterval(function () {

        addShareButtons();


        /*
         Re-apply shared mode because your
         existing app can re-render the cards.
        */

        if (getSharedPostID()) {
          openSharedPost();
        }


        attempts++;


        /*
         Keep scanning for 30 seconds.
        */

        if (attempts >= 30) {

          clearInterval(scanner);

        }

      }, 1000);

  }


  /* ============================================================
     BROWSER BACK / FORWARD
     ============================================================ */

  window.addEventListener(
    "popstate",
    function () {

      showAllPosts();

      setTimeout(function () {

        addShareButtons();

        openSharedPost();

      }, 100);

    }
  );


  /* ============================================================
     START
     ============================================================ */

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      function () {

        setTimeout(
          initialize,
          500
        );

      }
    );

  } else {

    setTimeout(
      initialize,
      500
    );

  }


  /* ============================================================
     PUBLIC API
     ============================================================ */

  window.Sho1re1Universal = {

    share: sharePost,

    getPostURL: getPostURL,

    showAll: showAllPosts,

    exitShared: exitSharedPost,

    scan: addShareButtons

  };

})();
