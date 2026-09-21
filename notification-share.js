
/* =========================================================
   SAWANTWADI — NOTIFICATION SHARE SYSTEM
   Works with the actual notification.js drawer

   URL:
   index.html?notification=n11

   Behaviour:
   • Opens the REAL notification drawer automatically
   • Finds the exact notification by ID
   • Moves that card to the TOP
   • Highlights it
   • Scrolls drawer to top
   • Keeps d.link untouched
   • Share button stays inside its own card
   • Works with dynamically created cards
========================================================= */

(function () {

  "use strict";


  /* =======================================================
     CONFIG
  ======================================================= */

  const PARAM =
    "notification";

  const SHARE_BUTTON =
    "s1ShareButton";

  const HIGHLIGHT =
    "s1SharedNotification";


  let sharedID = null;

  let finished = false;


  /* =======================================================
     READ SHARED ID
  ======================================================= */

  function getSharedID() {

    try {

      const params =
        new URLSearchParams(
          window.location.search
        );

      const id =
        params.get(PARAM);

      if (!id) return null;

      return String(id).trim();

    }

    catch (error) {

      return null;

    }

  }


  /* =======================================================
     CREATE SHARE URL
     
     IMPORTANT:
     d.link is NEVER modified.
  ======================================================= */

  function getShareURL(id) {

    const url =
      new URL(
        window.location.href
      );


    /*
      Remove everything except
      the notification parameter.
    */

    url.search = "";

    url.hash = "";


    url.searchParams.set(
      PARAM,
      id
    );


    return url.toString();

  }


  /* =======================================================
     SHARE ICON
  ======================================================= */

  function shareIcon() {

    return `

      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >

        <circle
          cx="18"
          cy="5"
          r="2.5"
        ></circle>

        <circle
          cx="6"
          cy="12"
          r="2.5"
        ></circle>

        <circle
          cx="18"
          cy="19"
          r="2.5"
        ></circle>

        <path
          d="M8.2 10.8L15.8 6.2"
        ></path>

        <path
          d="M8.2 13.2L15.8 17.8"
        ></path>

      </svg>

    `;

  }


  /* =======================================================
     CHECK ICON
  ======================================================= */

  function checkIcon() {

    return `

      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >

        <path
          d="M5 12l4 4L19 6"
        ></path>

      </svg>

    `;

  }


  /* =======================================================
     COPY FEEDBACK
  ======================================================= */

  function copied(button) {

    if (!button) return;


    const original =
      button.innerHTML;


    button.innerHTML =
      checkIcon();


    button.classList.add(
      "s1ShareCopied"
    );


    setTimeout(function () {

      button.innerHTML =
        original;

      button.classList.remove(
        "s1ShareCopied"
      );

    }, 1200);

  }


  /* =======================================================
     SHARE
  ======================================================= */

  async function shareNotification(
    id,
    button
  ) {

    const shareURL =
      getShareURL(id);


    /* =====================================
       NATIVE SHARE
    ===================================== */

    if (
      navigator.share &&
      typeof navigator.share ===
      "function"
    ) {

      try {

        await navigator.share({

          title:
            "Sawantwadi",

          text:
            "Check this notification",

          url:
            shareURL

        });


        copied(button);

        return;

      }

      catch (error) {

        /*
          User pressed cancel.
          Do not fall through to clipboard.
        */

        if (
          error &&
          error.name ===
          "AbortError"
        ) {

          return;

        }

      }

    }


    /* =====================================
       CLIPBOARD
    ===================================== */

    try {

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {

        await navigator.clipboard.writeText(
          shareURL
        );

        copied(button);

        return;

      }

    }

    catch (error) {}


    /* =====================================
       OLD BROWSER FALLBACK
    ===================================== */

    try {

      const input =
        document.createElement(
          "input"
        );


      input.value =
        shareURL;


      input.style.position =
        "fixed";

      input.style.left =
        "-9999px";


      document.body.appendChild(
        input
      );


      input.select();


      document.execCommand(
        "copy"
      );


      input.remove();


      copied(button);

    }

    catch (error) {}

  }


  /* =======================================================
     INSTALL SHARE BUTTON
  ======================================================= */

  function installShareButton(
    card
  ) {

    if (!card) return;


    /*
      Already installed?
    */

    if (
      card.querySelector(
        "." + SHARE_BUTTON
      )
    ) {

      return;

    }


    /*
      IMPORTANT:
      The ID comes directly from
      data-notification-id which
      notification.js creates.
    */

    const id =
      card.dataset.notificationId;


    if (!id) {

      return;

    }


    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.className =
      SHARE_BUTTON;


    button.dataset.notificationId =
      id;


    button.setAttribute(
      "aria-label",
      "Share notification"
    );


    button.innerHTML =
      shareIcon();


    button.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        event.stopPropagation();

        shareNotification(
          id,
          button
        );

      },
      {
        passive:false
      }
    );


    card.appendChild(
      button
    );

  }


  /* =======================================================
     INSTALL CSS
  ======================================================= */

  function installStyles() {

    if (
      document.getElementById(
        "s1NotificationShareStyles"
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        "style"
      );


    style.id =
      "s1NotificationShareStyles";


    style.textContent = `

      /* =========================================
         SHARE BUTTON
      ========================================= */

      .s1item {

        position:relative;

      }


      .s1ShareButton {

        position:absolute;

        right:12px;

        bottom:12px;

        width:38px;

        height:38px;

        padding:0;

        border:0;

        border-radius:50%;

        display:flex;

        align-items:center;

        justify-content:center;

        background:
          rgba(255,255,255,.78);

        color:#111;

        backdrop-filter:
          blur(18px)
          saturate(150%);

        -webkit-backdrop-filter:
          blur(18px)
          saturate(150%);

        box-shadow:
          0 5px 18px
          rgba(0,0,0,.12),

          inset 0 1px 0
          rgba(255,255,255,.9);

        z-index:100;

        cursor:pointer;

        -webkit-tap-highlight-color:
          transparent;

        transition:
          transform .2s
          cubic-bezier(.2,.8,.2,1),

          box-shadow .2s ease;

      }


      .s1ShareButton:active {

        transform:
          scale(.86);

      }


      .s1ShareButton svg {

        pointer-events:none;

        display:block;

      }


      .s1ShareCopied {

        transform:
          scale(1.08);

      }


      /* =========================================
         SHARED CARD HIGHLIGHT
      ========================================= */

      .s1SharedNotification {

        z-index:30 !important;

        box-shadow:

          0 0 0 2px
          rgba(255,255,255,.98),

          0 0 25px
          rgba(255,255,255,.65),

          0 15px 45px
          rgba(0,0,0,.16);

        animation:
          s1SharedGlow
          1.6s
          ease-in-out
          infinite;

      }


      .s1SharedNotification::after {

        content:"";

        position:absolute;

        inset:0;

        pointer-events:none;

        border-radius:inherit;

        box-shadow:
          inset
          0 0 0 1px
          rgba(255,255,255,.9);

      }


      @keyframes s1SharedGlow {

        0% {

          box-shadow:

            0 0 0 2px
            rgba(255,255,255,.95),

            0 0 22px
            rgba(255,255,255,.42),

            0 15px 45px
            rgba(0,0,0,.14);

        }


        50% {

          box-shadow:

            0 0 0 2px
            rgba(255,255,255,1),

            0 0 42px
            rgba(255,255,255,.8),

            0 18px 50px
            rgba(0,0,0,.18);

        }


        100% {

          box-shadow:

            0 0 0 2px
            rgba(255,255,255,.95),

            0 0 22px
            rgba(255,255,255,.42),

            0 15px 45px
            rgba(0,0,0,.14);

        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =======================================================
     GET EXACT CARD
  ======================================================= */

  function findCard() {

    if (!sharedID) {

      return null;

    }


    const cards =
      document.querySelectorAll(
        ".s1item"
      );


    for (
      let i = 0;
      i < cards.length;
      i++
    ) {

      const id =
        cards[i]
          .dataset
          .notificationId;


      if (
        String(id) ===
        String(sharedID)
      ) {

        return cards[i];

      }

    }


    return null;

  }


  /* =======================================================
     INSTALL BUTTONS ON ALL CARDS
  ======================================================= */

  function processCards() {

    const cards =
      document.querySelectorAll(
        ".s1item"
      );


    cards.forEach(
      installShareButton
    );

  }


  /* =======================================================
     OPEN REAL DRAWER
  ======================================================= */

  function openRealDrawer() {

    /*
      THIS IS THE IMPORTANT PART.

      notification.js exposes its REAL
      private open() function through:

      window.Sho1re1OpenNotifications
    */

    if (
      typeof
      window.Sho1re1OpenNotifications ===
      "function"
    ) {

      window.Sho1re1OpenNotifications();

      return true;

    }


    return false;

  }


  /* =======================================================
     MOVE CARD TO TOP
  ======================================================= */

  function moveCardToTop(
    card
  ) {

    const drawer =
      document.querySelector(
        ".s1drawer"
      );


    if (
      !drawer ||
      !card
    ) {

      return false;

    }


    /*
      Remove previous highlight.
    */

    drawer
      .querySelectorAll(
        "." + HIGHLIGHT
      )
      .forEach(
        function (item) {

          item.classList.remove(
            HIGHLIGHT
          );

        }
      );


    /*
      Header is:

      .s1handle
      .s1header
      .s1item
      .s1item
      ...

      Put shared card directly
      after the header.

      Therefore it becomes the
      FIRST notification.
    */

    const header =
      drawer.querySelector(
        ".s1header"
      );


    if (header) {

      header.after(card);

    }

    else {

      drawer.prepend(card);

    }


    /*
      Highlight it.
    */

    card.classList.add(
      HIGHLIGHT
    );


    /*
      Your actual notification.js
      drawer itself is overflow-y:auto.
    */

    drawer.scrollTo({

      top:0,

      behavior:"smooth"

    });


    return true;

  }


  /* =======================================================
     HANDLE SHARED NOTIFICATION
  ======================================================= */

  function handleSharedNotification() {

    if (
      !sharedID ||
      finished
    ) {

      return;

    }


    processCards();


    const card =
      findCard();


    if (!card) {

      return false;

    }


    /*
      Exact card found.
    */

    const moved =
      moveCardToTop(
        card
      );


    if (!moved) {

      return false;

    }


    finished = true;


    return true;

  }


  /* =======================================================
     START SHARED LINK
  ======================================================= */

  function startSharedLink() {

    sharedID =
      getSharedID();


    /*
      Normal URL:
      don't touch anything.
    */

    if (!sharedID) {

      return;

    }


    installStyles();


    /*
      Wait for notification.js
      to expose its real drawer opener.
    */

    let openAttempts = 0;


    const opener =
      setInterval(
        function () {

          openAttempts++;


          if (
            openRealDrawer()
          ) {

            clearInterval(
              opener
            );


            /*
              Drawer is now built.

              Find the exact card.
            */

            let cardAttempts = 0;


            const finder =
              setInterval(
                function () {

                  cardAttempts++;


                  processCards();


                  if (
                    handleSharedNotification()
                  ) {

                    clearInterval(
                      finder
                    );


                    /*
                      Run again after
                      browser layout settles.
                    */

                    setTimeout(
                      function () {

                        handleSharedNotification();

                      },
                      250
                    );


                    return;

                  }


                  /*
                    Keep waiting for
                    dynamically generated
                    drawer cards.
                  */

                  if (
                    cardAttempts >= 120
                  ) {

                    clearInterval(
                      finder
                    );

                  }

                },
                50
              );

          }


          /*
            notification.js not loaded yet.
          */

          if (
            openAttempts >= 200
          ) {

            clearInterval(
              opener
            );

          }

        },
        50
      );

  }


  /* =======================================================
     WATCH FOR DYNAMIC CARDS
  ======================================================= */

  function watchCards() {

    if (
      !window.MutationObserver
    ) {

      return;

    }


    const observer =
      new MutationObserver(
        function () {

          processCards();


          if (
            sharedID &&
            !finished
          ) {

            handleSharedNotification();

          }

        }
      );


    observer.observe(
      document.body,
      {
        childList:true,
        subtree:true
      }
    );

  }


  /* =======================================================
     INITIALIZE
  ======================================================= */

  function init() {

    installStyles();

    processCards();

    watchCards();

    startSharedLink();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once:true
      }
    );

  }

  else {

    init();

  }

})();
