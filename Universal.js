/* ============================================================
   SHO1RE1 UNIVERSAL SHARED-POST MODE
   ?post=ID  -> show ONLY that post on the existing map UI
   ============================================================ */

(function () {
  "use strict";

  const PARAM = "post";

  /* ============================================================
     CONFIG
     ============================================================ */

  const EXIT_BUTTON = {

    /*
      IMAGE
    */

    image:
      "https://i.ibb.co/1Gd6dT74/1000001617-removebg-preview-1.png",

    /*
      POSITION
      Change these values to move the image.
    */

    top: "-70px",
    left: "5px",

    /*
      SIZE
      Change width/height here.
    */

    width: "320px",
    height: "320px",

    /*
      IMAGE FIT
    */

    objectFit: "contain"

  };


  /* ============================================================
     STYLES
     ============================================================ */

  const style =
    document.createElement("style");


  style.textContent = `

    /* ----------------------------------------------------------
       SHARE BUTTON
       ---------------------------------------------------------- */

    .universal-share-btn {

      position: absolute;

      top: 14px;
      right: 14px;

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

      box-shadow:
        0 3px 12px rgba(0,0,0,.25);

      -webkit-tap-highlight-color:
        transparent;

      transition:
        transform .18s ease,
        background .18s ease;
    }


    .universal-share-btn:hover {

      transform:
        scale(1.06);

      background:
        rgba(0,0,0,.82);
    }


    .universal-share-btn:active {

      transform:
        scale(.92);
    }



    /* ========================================================
       IMAGE EXIT BUTTON
       ======================================================== */

    #universal-exit-shared {

      position: fixed;

      top: ${EXIT_BUTTON.top};
      left: ${EXIT_BUTTON.left};

      z-index: 999999;

      width: ${EXIT_BUTTON.width};
      height: ${EXIT_BUTTON.height};

      padding: 0;

      margin: 0;

      border: 0;

      background:
        transparent;

      cursor: pointer;

      display: flex;

      align-items: center;
      justify-content: center;

      overflow: visible;

      -webkit-tap-highlight-color:
        transparent;

      touch-action:
        manipulation;

      transition:
        transform .18s cubic-bezier(.2,.8,.2,1);

      filter:
        drop-shadow(
          0 4px 10px
          rgba(0,0,0,.25)
        );
    }


    #universal-exit-shared img {

      width: 100%;
      height: 100%;

      display: block;

      object-fit:
        ${EXIT_BUTTON.objectFit};

      pointer-events:
        none;

      user-select:
        none;

      -webkit-user-drag:
        none;
    }


    /*
      Desktop / mouse interaction
    */

    #universal-exit-shared:hover {

      transform:
        scale(1.06);
    }


    /*
      Touch interaction
    */

    #universal-exit-shared:active {

      transform:
        scale(.90);
    }



    /* ========================================================
       SHARE TOAST
       ======================================================== */

    #universal-share-toast {

      position: fixed;

      left: 50%;
      bottom: 30px;

      transform:
        translate3d(-50%,0,0);

      z-index: 1000000;

      padding:
        10px 16px;

      border-radius:
        999px;

      background:
        rgba(0,0,0,.85);

      color:
        white;

      font-size:
        14px;

      pointer-events:
        none;

      opacity:
        0;

      transition:
        opacity .2s ease;

      backdrop-filter:
        blur(10px);

      -webkit-backdrop-filter:
        blur(10px);
    }


    #universal-share-toast.show {

      opacity:
        1;
    }



    /* ========================================================
       SHARED MODE
       ======================================================== */

    body.universal-shared-mode
      #carousel .card.universal-hidden-card {

      display:
        none !important;
    }



    /* ========================================================
       HIDE INDEX BRAND IMAGE
       ======================================================== */

    body.universal-shared-mode
      .brand-image-container {

      display:
        none !important;
    }

  `;


  document.head.appendChild(
    style
  );



  /* ============================================================
     HELPERS
     ============================================================ */


  function getPostIdFromURL() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    return params.get(
      PARAM
    );
  }



  function getCards() {

    return Array.from(
      document.querySelectorAll(
        "#carousel .card"
      )
    );
  }



  function getPostForCard(card) {

    const cards =
      getCards();

    const index =
      cards.indexOf(card);


    if (
      index === -1
    ) {

      return null;
    }


    try {

      if (
        typeof activePlaces !==
          "undefined" &&
        Array.isArray(
          activePlaces
        )
      ) {

        return (
          activePlaces[index] ||
          null
        );
      }

    } catch (e) {}


    return null;
  }



  function getPostId(post) {

    if (!post) {

      return null;
    }


    return (
      post.id ??
      post.postId ??
      post._id ??
      null
    );
  }



  /* ============================================================
     TOAST
     ============================================================ */


  function showToast(message) {

    let toast =
      document.getElementById(
        "universal-share-toast"
      );


    if (!toast) {

      toast =
        document.createElement(
          "div"
        );

      toast.id =
        "universal-share-toast";

      document.body.appendChild(
        toast
      );
    }


    toast.textContent =
      message;


    toast.classList.add(
      "show"
    );


    clearTimeout(
      toast._timer
    );


    toast._timer =
      setTimeout(
        function () {

          toast.classList.remove(
            "show"
          );

        },
        1800
      );
  }



  /* ============================================================
     SHARE POST
     ============================================================ */


  async function sharePost(post) {

    const id =
      getPostId(post);


    if (
      id === null ||
      id === undefined
    ) {

      showToast(
        "Post ID not found"
      );

      return;
    }


    const url =
      window.location.origin +
      window.location.pathname +
      "?post=" +
      encodeURIComponent(
        id
      );


    const title =
      post.title ||
      post.name ||
      "Shared post";


    try {

      if (
        navigator.share
      ) {

        await navigator.share({

          title:
            title,

          text:
            "Check out this post",

          url:
            url

        });

        return;
      }

    } catch (error) {

      if (
        error &&
        error.name ===
          "AbortError"
      ) {

        return;
      }
    }


    try {

      await navigator.clipboard.writeText(
        url
      );

      showToast(
        "Link copied!"
      );

    } catch (error) {

      window.prompt(
        "Copy this post link:",
        url
      );
    }
  }



  /* ============================================================
     ADD SHARE BUTTONS
     ============================================================ */


  function addShareButtons() {

    const cards =
      getCards();


    cards.forEach(
      function (card) {

        if (
          card.querySelector(
            ".universal-share-btn"
          )
        ) {

          return;
        }


        const post =
          getPostForCard(
            card
          );


        if (!post) {

          return;
        }


        const currentPosition =
          window.getComputedStyle(
            card
          ).position;


        if (
          currentPosition ===
            "static"
        ) {

          card.style.position =
            "relative";
        }


        const button =
          document.createElement(
            "button"
          );


        button.className =
          "universal-share-btn";


        button.type =
          "button";


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
            aria-hidden="true"
          >

            <circle
              cx="18"
              cy="5"
              r="3"
            ></circle>

            <circle
              cx="6"
              cy="12"
              r="3"
            ></circle>

            <circle
              cx="18"
              cy="19"
              r="3"
            ></circle>

            <line
              x1="8.59"
              y1="13.51"
              x2="15.42"
              y2="17.49"
            ></line>

            <line
              x1="15.41"
              y1="6.51"
              x2="8.59"
              y2="10.49"
            ></line>

          </svg>

        `;


        button.addEventListener(
          "click",
          function (event) {

            event.preventDefault();

            event.stopPropagation();

            sharePost(
              getPostForCard(
                card
              )
            );

          }
        );


        card.appendChild(
          button
        );

      }
    );
  }



  /* ============================================================
     FIND SHARED POST
     ============================================================ */


  function findSharedCard() {

    const sharedId =
      getPostIdFromURL();


    if (
      sharedId === null ||
      sharedId === ""
    ) {

      return null;
    }


    const cards =
      getCards();


    for (
      const card of cards
    ) {

      const post =
        getPostForCard(
          card
        );


      if (!post) {

        continue;
      }


      const id =
        getPostId(
          post
        );


      if (
        String(id) ===
        String(sharedId)
      ) {

        return {

          card:
            card,

          post:
            post

        };
      }
    }


    return null;
  }



  /* ============================================================
     HIDE ALL OTHER POSTS
     ============================================================ */


  function hideAllExcept(
    sharedCard
  ) {

    const cards =
      getCards();


    cards.forEach(
      function (card) {

        if (
          card ===
          sharedCard
        ) {

          card.classList.remove(
            "universal-hidden-card"
          );

          card.style.display =
            "";

        } else {

          card.classList.add(
            "universal-hidden-card"
          );
        }

      }
    );


    /* ----------------------------------------------------------
       MAP MARKERS
       ---------------------------------------------------------- */

    try {

      if (
        typeof markerMap !==
          "undefined" &&
        markerMap instanceof Map
      ) {

        cards.forEach(
          function (
            card,
            index
          ) {

            const marker =
              markerMap.get(
                index
              );


            if (!marker) {

              return;
            }


            if (
              card ===
              sharedCard
            ) {

              try {

                marker.addTo(
                  map
                );

              } catch (e) {}

            } else {

              try {

                marker.remove();

              } catch (e) {}

            }

          }
        );
      }

    } catch (e) {}

  }



  /* ============================================================
     ACTIVATE SHARED POST
     ============================================================ */


  function activateSharedPost() {

    const shared =
      findSharedCard();


    if (!shared) {

      return false;
    }


    document.body.classList.add(
      "universal-shared-mode"
    );


    hideAllExcept(
      shared.card
    );


    try {

      shared.card.click();

    } catch (e) {}


    try {

      const post =
        shared.post;


      if (
        typeof map !==
          "undefined" &&
        map &&
        post &&
        post.lat != null &&
        post.lng != null
      ) {

        map.flyTo(

          [
            Number(
              post.lat
            ),

            Number(
              post.lng
            )
          ],

          17,

          {
            duration:
              0.6
          }

        );
      }

    } catch (e) {}


    try {

      shared.card.scrollIntoView({

        behavior:
          "smooth",

        block:
          "nearest",

        inline:
          "center"

      });

    } catch (e) {}


    createExitButton();

    return true;
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
      PARAM
    );


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



  /* ============================================================
     CREATE IMAGE EXIT BUTTON
     ============================================================ */


  function createExitButton() {

    if (
      document.getElementById(
        "universal-exit-shared"
      )
    ) {

      return;
    }


    const button =
      document.createElement(
        "button"
      );


    button.id =
      "universal-exit-shared";


    button.type =
      "button";


    button.setAttribute(
      "aria-label",
      "View all posts"
    );


    button.setAttribute(
      "title",
      "View all posts"
    );


    /*
      The image itself.
    */

    const image =
      document.createElement(
        "img"
      );


    image.src =
      EXIT_BUTTON.image;


    image.alt =
      "View all posts";


    image.draggable =
      false;


    button.appendChild(
      image
    );


    /*
      EXACT SAME FUNCTIONALITY
      as the old text button.
    */

    button.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        event.stopPropagation();

        exitSharedPost();

      }
    );


    document.body.appendChild(
      button
    );
  }



  /* ============================================================
     RESTORE NORMAL MODE
     ============================================================ */


  function restoreNormalMode() {

    document.body.classList.remove(
      "universal-shared-mode"
    );


    document
      .querySelectorAll(
        ".universal-hidden-card"
      )
      .forEach(
        function (card) {

          card.classList.remove(
            "universal-hidden-card"
          );

          card.style.display =
            "";

        }
      );


    const exit =
      document.getElementById(
        "universal-exit-shared"
      );


    if (exit) {

      exit.remove();
    }
  }



  /* ============================================================
     MAIN SCAN
     ============================================================ */


  function runUniversal() {

    addShareButtons();


    if (
      !getPostIdFromURL()
    ) {

      restoreNormalMode();

      return;
    }


    activateSharedPost();
  }



  /* ============================================================
     DYNAMIC CARD OBSERVER
     ============================================================ */

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



  /* ============================================================
     START
     ============================================================ */


  function start() {

    observer.observe(
      document.body,
      {
        childList:
          true,

        subtree:
          true
      }
    );


    runUniversal();


    let attempts =
      0;


    const timer =
      setInterval(
        function () {

          attempts++;


          runUniversal();


          if (
            !getPostIdFromURL() ||
            attempts >= 30
          ) {

            clearInterval(
              timer
            );

          }

        },
        500
      );
  }



  /* ============================================================
     DOM READY
     ============================================================ */

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