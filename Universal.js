/* ============================================================
   UNIVERSAL.JS
   SAWANTWADI MAP POST SHARING
   ============================================================ */

(function () {

  const SHARE_CLASS = "universal-share-btn";

  /* ------------------------------------------------------------
     GET CURRENT POSTS
     ------------------------------------------------------------ */

  function getPosts() {

    try {
      if (
        typeof activePlaces !== "undefined" &&
        Array.isArray(activePlaces)
      ) {
        return activePlaces;
      }
    } catch (e) {}

    if (
      Array.isArray(window.Sho1re1VisiblePlaces)
    ) {
      return window.Sho1re1VisiblePlaces;
    }

    return [];
  }


  /* ------------------------------------------------------------
     SHARE BUTTON CSS
     ------------------------------------------------------------ */

  function addCSS() {

    if (document.getElementById("UniversalShareCSS")) {
      return;
    }

    const style = document.createElement("style");

    style.id = "UniversalShareCSS";

    style.textContent = `
      .universal-share-btn {
        position: absolute !important;
        top: 12px !important;
        right: 12px !important;

        width: 44px !important;
        height: 44px !important;

        min-width: 44px !important;
        min-height: 44px !important;

        padding: 0 !important;
        margin: 0 !important;

        display: flex !important;
        align-items: center !important;
        justify-content: center !important;

        border: 0 !important;
        border-radius: 50% !important;

        background: rgba(0,0,0,.72) !important;
        color: white !important;

        z-index: 9999 !important;

        cursor: pointer !important;

        box-shadow:
          0 4px 15px rgba(0,0,0,.35) !important;

        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);

        pointer-events: auto !important;
      }

      .universal-share-btn svg {
        width: 20px !important;
        height: 20px !important;

        display: block !important;

        pointer-events: none !important;
      }

      .universal-share-btn:active {
        transform: scale(.92);
      }
    `;

    document.head.appendChild(style);
  }


  /* ------------------------------------------------------------
     CREATE BUTTON
     ------------------------------------------------------------ */

  function makeShareButton(post) {

    const button =
      document.createElement("button");

    button.type = "button";

    button.className =
      SHARE_CLASS;

    button.setAttribute(
      "aria-label",
      "Share post"
    );

    button.title = "Share";

    button.innerHTML = `
      <svg
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

        <line
          x1="8.6"
          y1="13.5"
          x2="15.4"
          y2="17.5"
        ></line>

        <line
          x1="15.4"
          y1="6.5"
          x2="8.6"
          y2="10.5"
        ></line>
      </svg>
    `;


    button.addEventListener(
      "click",
      async function (event) {

        event.preventDefault();
        event.stopPropagation();

        const url =
          new URL(
            window.location.href
          );

        url.search = "";

        url.searchParams.set(
          "post",
          String(post.id)
        );

        const shareURL =
          url.toString();


        /* Native phone share */

        if (
          navigator.share
        ) {

          try {

            await navigator.share({

              title:
                post.title ||
                "Sawantwadi Post",

              text:
                post.title ||
                "Check out this post",

              url:
                shareURL

            });

            return;

          } catch (error) {

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

          await navigator.clipboard.writeText(
            shareURL
          );

          showToast(
            "Post link copied"
          );

        } catch (error) {

          window.prompt(
            "Copy this post link:",
            shareURL
          );

        }

      }
    );


    return button;
  }


  /* ------------------------------------------------------------
     ADD BUTTONS TO CARDS
     ------------------------------------------------------------ */

  function scanCards() {

    const carousel =
      document.getElementById(
        "carousel"
      );

    if (!carousel) {
      return;
    }


    const cards =
      carousel.querySelectorAll(
        ".card"
      );

    if (!cards.length) {
      return;
    }


    const posts =
      getPosts();

    if (!posts.length) {
      return;
    }


    cards.forEach(
      function (card, index) {

        const post =
          posts[index];

        if (!post) {
          return;
        }


        /* Already added */

        if (
          card.querySelector(
            "." + SHARE_CLASS
          )
        ) {
          return;
        }


        /*
         * Make card a positioning
         * container.
         */

        const position =
          getComputedStyle(
            card
          ).position;

        if (
          position === "static"
        ) {

          card.style.position =
            "relative";

        }


        const button =
          makeShareButton(
            post
          );


        card.appendChild(
          button
        );

      }
    );

  }


  /* ------------------------------------------------------------
     SHARED POST
     ------------------------------------------------------------ */

  function openSharedPost() {

    const params =
      new URLSearchParams(
        window.location.search
      );

    const id =
      params.get("post");

    if (!id) {
      return;
    }


    const posts =
      getPosts();


    let index = -1;
    let post = null;


    for (
      let i = 0;
      i < posts.length;
      i++
    ) {

      if (
        String(posts[i].id) ===
        String(id)
      ) {

        index = i;
        post = posts[i];

        break;

      }

    }


    /*
     * Post doesn't exist.
     */

    if (
      index === -1 ||
      !post
    ) {

      params.delete("post");

      const cleanURL =
        window.location.pathname +
        (
          params.toString()
            ? "?" + params.toString()
            : ""
        ) +
        window.location.hash;


      history.replaceState(
        {},
        "",
        cleanURL
      );


      showToast(
        "Post not found"
      );

      return;

    }


    const cards =
      document.querySelectorAll(
        "#carousel .card"
      );


    const card =
      cards[index];


    if (!card) {
      return;
    }


    /*
     * Use the EXISTING card click.
     *
     * Your original card click already does:
     *
     * setActive(index)
     * map.flyTo(...)
     */

    setTimeout(
      function () {

        card.click();

        card.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center"
        });

      },
      100
    );


    createExitButton();

  }


  /* ------------------------------------------------------------
     EXIT BUTTON
     ------------------------------------------------------------ */

  function createExitButton() {

    if (
      document.getElementById(
        "UniversalExitButton"
      )
    ) {
      return;
    }


    const button =
      document.createElement(
        "button"
      );


    button.id =
      "UniversalExitButton";


    button.type =
      "button";


    button.innerHTML =
      "← View all posts";


    Object.assign(
      button.style,
      {

        position: "fixed",

        top: "15px",

        left: "15px",

        zIndex: "999999",

        padding: "10px 16px",

        border: "none",

        borderRadius: "999px",

        background: "#111",

        color: "#fff",

        fontSize: "14px",

        fontWeight: "600",

        cursor: "pointer",

        boxShadow:
          "0 5px 20px rgba(0,0,0,.3)"

      }
    );


    button.onclick =
      function () {

        const url =
          new URL(
            window.location.href
          );


        url.searchParams.delete(
          "post"
        );


        history.pushState(
          {},
          "",
          url.pathname +
          url.search +
          url.hash
        );


        button.remove();


        showToast(
          "Showing all posts"
        );

      };


    document.body.appendChild(
      button
    );

  }


  /* ------------------------------------------------------------
     TOAST
     ------------------------------------------------------------ */

  function showToast(message) {

    const old =
      document.getElementById(
        "UniversalToast"
      );

    if (old) {
      old.remove();
    }


    const toast =
      document.createElement(
        "div"
      );


    toast.id =
      "UniversalToast";


    toast.textContent =
      message;


    Object.assign(
      toast.style,
      {

        position: "fixed",

        left: "50%",

        bottom: "25px",

        transform:
          "translateX(-50%)",

        zIndex: "999999",

        padding: "12px 18px",

        borderRadius: "999px",

        background: "#111",

        color: "#fff",

        fontSize: "14px",

        boxShadow:
          "0 8px 30px rgba(0,0,0,.35)"

      }
    );


    document.body.appendChild(
      toast
    );


    setTimeout(
      function () {

        toast.remove();

      },
      2200
    );

  }


  /* ------------------------------------------------------------
     WATCH FOR DYNAMIC CARDS
     ------------------------------------------------------------ */

  function start() {

    addCSS();

    scanCards();


    /*
     * MutationObserver catches
     * renderMapAndCarousel()
     */

    const observer =
      new MutationObserver(
        function () {

          scanCards();

        }
      );


    const carousel =
      document.getElementById(
        "carousel"
      );


    if (carousel) {

      observer.observe(
        carousel,
        {
          childList: true,
          subtree: true
        }
      );

    }


    /*
     * Extra safety for your
     * async IndexedDB startup.
     */

    let attempts = 0;

    const timer =
      setInterval(
        function () {

          scanCards();

          attempts++;

          if (
            attempts > 60
          ) {

            clearInterval(
              timer
            );

          }

        },
        250
      );


    /*
     * Try shared URL after
     * cards have definitely rendered.
     */

    setTimeout(
      function () {

        scanCards();

        openSharedPost();

      },
      1000
    );

  }


  /*
   * IMPORTANT:
   * Start after the entire
   * document has loaded.
   */

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
