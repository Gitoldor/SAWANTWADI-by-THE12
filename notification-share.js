
/* =========================================================
   SAWANTWADI NOTIFICATION SHARED-LINK SYSTEM
   ?notification=n11

   SHARED LINK BEHAVIOUR:
   1. Drawer FORCE OPENS automatically
   2. Exact notification is found
   3. Card moves physically to TOP
   4. Card stays highlighted
   5. Drawer scrolls to TOP
   6. Normal notifications stay normal
   7. d.link is NEVER changed
========================================================= */

(function () {

  "use strict";

  /* =======================================================
     CONFIG
  ======================================================= */

  const SHARE_PARAM = "notification";

  const SHARE_BUTTON_CLASS = "s1ShareButton";

  const SHARED_CLASS = "s1SharedNotification";

  let sharedID = null;
  let sharedHandled = false;


  /* =======================================================
     GET SHARED NOTIFICATION ID
  ======================================================= */

  function getSharedID() {

    try {

      const params = new URLSearchParams(
        window.location.search
      );

      const id = params.get(SHARE_PARAM);

      if (!id) return null;

      return id.trim();

    } catch (e) {

      return null;

    }

  }


  /* =======================================================
     SHARE URL
  ======================================================= */

  function getShareURL(id) {

    const url =
      new URL(window.location.href);

    url.search = "";

    url.hash = "";

    url.searchParams.set(
      SHARE_PARAM,
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
        width="19"
        height="19"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="2.5"></circle>
        <circle cx="6" cy="12" r="2.5"></circle>
        <circle cx="18" cy="19" r="2.5"></circle>

        <path d="M8.2 10.8 15.8 6.2"></path>
        <path d="M8.2 13.2 15.8 17.8"></path>
      </svg>
    `;

  }


  /* =======================================================
     COPY FEEDBACK
  ======================================================= */

  function showCopied(button) {

    if (!button) return;

    const oldHTML = button.innerHTML;

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
      >
        <path d="m5 12 4 4L19 6"></path>
      </svg>
    `;

    button.classList.add("s1ShareCopied");

    setTimeout(function () {

      button.innerHTML = oldHTML;

      button.classList.remove(
        "s1ShareCopied"
      );

    }, 1200);

  }


  /* =======================================================
     SHARE NOTIFICATION
  ======================================================= */

  async function shareNotification(id, button) {

    const shareURL =
      getShareURL(id);

    try {

      if (
        navigator.share &&
        typeof navigator.share === "function"
      ) {

        await navigator.share({

          title: "Sawantwadi",

          text: "Check this notification",

          url: shareURL

        });

        showCopied(button);

        return;

      }

    } catch (e) {

      /*
        User cancelled native share.
        Don't copy in that case.
      */

      if (
        e &&
        e.name === "AbortError"
      ) {

        return;

      }

    }


    /* =====================================================
       CLIPBOARD FALLBACK
    ===================================================== */

    try {

      if (
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {

        await navigator.clipboard.writeText(
          shareURL
        );

        showCopied(button);

        return;

      }

    } catch (e) {}


    /* =====================================================
       OLD BROWSER FALLBACK
    ===================================================== */

    try {

      const input =
        document.createElement("input");

      input.value = shareURL;

      input.style.position = "fixed";

      input.style.left = "-9999px";

      document.body.appendChild(input);

      input.select();

      document.execCommand("copy");

      input.remove();

      showCopied(button);

    } catch (e) {}

  }


  /* =======================================================
     INSTALL SHARE BUTTON
  ======================================================= */

  function installShareButton(card, id) {

    if (!card || !id) return;

    let button =
      card.querySelector(
        "." + SHARE_BUTTON_CLASS
      );

    if (button) {

      button.dataset.notificationId =
        id;

      return;

    }


    button =
      document.createElement("button");

    button.type = "button";

    button.className =
      SHARE_BUTTON_CLASS;

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
        passive: false
      }
    );


    card.appendChild(button);

  }


  /* =======================================================
     STYLES
  ======================================================= */

  function installStyles() {

    if (
      document.getElementById(
        "s1SharedNotificationStyles"
      )
    ) {

      return;

    }


    const style =
      document.createElement("style");

    style.id =
      "s1SharedNotificationStyles";


    style.textContent = `

      /* ===============================================
         CARD
      =============================================== */

      .s1item {

        position: relative;

      }


      /* ===============================================
         SHARE BUTTON
      =============================================== */

      .s1ShareButton {

        position: absolute;

        right: 12px;

        bottom: 12px;

        width: 38px;

        height: 38px;

        border: 0;

        border-radius: 50%;

        display: flex;

        align-items: center;

        justify-content: center;

        padding: 0;

        background:
          rgba(255,255,255,.72);

        color:
          rgba(20,20,20,.86);

        backdrop-filter:
          blur(18px)
          saturate(150%);

        -webkit-backdrop-filter:
          blur(18px)
          saturate(150%);

        box-shadow:
          0 4px 18px
          rgba(0,0,0,.10),

          inset 0 1px 0
          rgba(255,255,255,.8);

        cursor: pointer;

        z-index: 50;

        transition:
          transform .22s cubic-bezier(.2,.8,.2,1),
          background .22s ease,
          box-shadow .22s ease;

        -webkit-tap-highlight-color:
          transparent;

      }


      .s1ShareButton:active {

        transform:
          scale(.88);

      }


      .s1ShareButton svg {

        display: block;

        pointer-events: none;

      }


      .s1ShareCopied {

        transform:
          scale(1.08);

      }


      /* ===============================================
         SHARED CARD
      =============================================== */

      .s1SharedNotification {

        position: relative;

        z-index: 20;

        animation:
          s1SharedPulse 1.8s ease-in-out infinite;

        box-shadow:
          0 0 0 2px
          rgba(255,255,255,.95),

          0 0 35px
          rgba(255,255,255,.65),

          0 15px 45px
          rgba(0,0,0,.14);

      }


      .s1SharedNotification::after {

        content: "";

        position: absolute;

        inset: 0;

        pointer-events: none;

        border-radius: inherit;

        box-shadow:
          inset 0 0 0 1px
          rgba(255,255,255,.85);

      }


      @keyframes s1SharedPulse {

        0% {

          transform:
            scale(1);

          box-shadow:
            0 0 0 2px
            rgba(255,255,255,.92),

            0 0 24px
            rgba(255,255,255,.42),

            0 15px 45px
            rgba(0,0,0,.12);

        }

        50% {

          transform:
            scale(1.012);

          box-shadow:
            0 0 0 2px
            rgba(255,255,255,1),

            0 0 42px
            rgba(255,255,255,.78),

            0 18px 50px
            rgba(0,0,0,.16);

        }

        100% {

          transform:
            scale(1);

          box-shadow:
            0 0 0 2px
            rgba(255,255,255,.92),

            0 0 24px
            rgba(255,255,255,.42),

            0 15px 45px
            rgba(0,0,0,.12);

        }

      }

    `;


    document.head.appendChild(style);

  }


  /* =======================================================
     GET NOTIFICATION DATA
  ======================================================= */

  function getNotificationData() {

    if (
      Array.isArray(
        window.Sho1re1Notifications
      )
    ) {

      return window.Sho1re1Notifications;

    }

    return [];

  }


  /* =======================================================
     PROCESS DYNAMIC CARDS
  ======================================================= */

  function processCards() {

    const cards =
      Array.from(
        document.querySelectorAll(
          ".s1item"
        )
      );


    if (!cards.length) {

      return;

    }


    const data =
      getNotificationData();


    /*
      If cards already have IDs,
      NEVER overwrite them.
    */

    cards.forEach(function (card, index) {

      let id =
        card.dataset.notificationId;


      /*
        If renderer already supplied
        data-notification-id, use it.
      */

      if (!id) {

        /*
          Fallback mapping.

          This keeps compatibility with
          the existing notification renderer.
        */

        const item =
          data[index];

        if (item && item.id) {

          id =
            String(item.id);

          card.dataset.notificationId =
            id;

        }

      }


      if (id) {

        installShareButton(
          card,
          id
        );

      }

    });

  }


  /* =======================================================
     FIND EXACT SHARED CARD
  ======================================================= */

  function findSharedCard() {

    if (!sharedID) {

      return null;

    }


    const exact =
      document.querySelector(
        '.s1item[data-notification-id="' +
        CSS.escape(sharedID) +
        '"]'
      );


    if (exact) {

      return exact;

    }


    /*
      Extra fallback for browsers where
      CSS.escape is unavailable.
    */

    const cards =
      Array.from(
        document.querySelectorAll(
          ".s1item"
        )
      );


    for (
      let i = 0;
      i < cards.length;
      i++
    ) {

      if (
        String(
          cards[i].dataset.notificationId
        ) === String(sharedID)
      ) {

        return cards[i];

      }

    }


    return null;

  }


  /* =======================================================
     FORCE OPEN DRAWER
  ======================================================= */

  function forceOpenDrawer() {

    const openButton =
      document.querySelector(
        ".s1now"
      );


    if (!openButton) {

      return false;

    }


    /*
      IMPORTANT:

      On a shared link we DO NOT try to
      guess whether the drawer is open.

      We simply activate the same button
      the user normally presses.

      This fixes transform/display based
      drawer implementations.
    */

    try {

      openButton.click();

      return true;

    } catch (e) {

      /*
        Fallback for unusual button handlers.
      */

      try {

        openButton.dispatchEvent(
          new MouseEvent(
            "click",
            {
              bubbles: true,
              cancelable: true,
              view: window
            }
          )
        );

        return true;

      } catch (err) {

        return false;

      }

    }

  }


  /* =======================================================
     FIND ACTUAL SCROLL CONTAINER
  ======================================================= */

  function findScrollContainer(card) {

    let current =
      card;

    while (
      current &&
      current !== document.body &&
      current !== document.documentElement
    ) {

      const style =
        window.getComputedStyle(
          current
        );

      const overflowY =
        style.overflowY;


      if (
        (
          overflowY === "auto" ||
          overflowY === "scroll" ||
          overflowY === "overlay"
        ) &&
        current.scrollHeight >
        current.clientHeight
      ) {

        return current;

      }


      current =
        current.parentElement;

    }


    /*
      Try drawer itself.
    */

    const drawer =
      document.querySelector(
        ".s1drawer"
      );


    if (drawer) {

      return drawer;

    }


    return null;

  }


  /* =======================================================
     MOVE SHARED CARD TO TOP
  ======================================================= */

  function moveSharedCardToTop() {

    const card =
      findSharedCard();


    if (!card) {

      return false;

    }


    const drawer =
      document.querySelector(
        ".s1drawer"
      );


    if (!drawer) {

      return false;

    }


    /*
      Remove old highlight first.
    */

    document
      .querySelectorAll(
        ".s1SharedNotification"
      )
      .forEach(function (item) {

        item.classList.remove(
          SHARED_CLASS
        );

      });


    /*
      Find the notification list.

      Prefer the element that contains
      the shared card.
    */

    let list =
      card.parentElement;


    /*
      If the parent is a wrapper that
      contains the header, that's fine.

      We physically prepend the card to
      its current list.

      This guarantees the shared card
      becomes the FIRST notification.
    */

    if (list) {

      list.insertBefore(
        card,
        list.firstElementChild
      );

    }


    /*
      Highlight AFTER moving.
    */

    card.classList.add(
      SHARED_CLASS
    );


    /*
      Scroll the drawer/list to the top.
    */

    const scrollContainer =
      findScrollContainer(card);


    if (scrollContainer) {

      scrollContainer.scrollTo({

        top: 0,

        behavior: "smooth"

      });

    }


    /*
      Also make sure the card itself
      is at the visible top.

      This is a fallback for drawers
      where scrolling happens on a
      nested container.
    */

    requestAnimationFrame(
      function () {

        try {

          card.scrollIntoView({

            behavior: "smooth",

            block: "start"

          });

        } catch (e) {}

      }
    );


    sharedHandled = true;


    return true;

  }


  /* =======================================================
     SHARED LINK BOOT
  ======================================================= */

  function startSharedLink() {

    sharedID =
      getSharedID();


    /*
      Normal page:
      do absolutely nothing.
    */

    if (!sharedID) {

      return;

    }


    installStyles();


    /*
      FORCE OPEN ONCE.

      We intentionally don't check
      display / opacity / transform.
    */

    let opened = false;


    const tryOpen =
      setInterval(function () {

        const button =
          document.querySelector(
            ".s1now"
          );


        if (!button) {

          return;

        }


        if (!opened) {

          opened = true;

          forceOpenDrawer();

        }


      }, 100);


    /*
      Stop the opening poll.
    */

    setTimeout(function () {

      clearInterval(
        tryOpen
      );

    }, 5000);


    /*
      Look for dynamically generated
      notification cards.
    */

    let attempts = 0;


    const finder =
      setInterval(function () {

        attempts++;


        /*
          Cards may have just been created.
        */

        processCards();


        const card =
          findSharedCard();


        if (card) {

          clearInterval(
            finder
          );


          /*
            Move immediately.
          */

          moveSharedCardToTop();


          /*
            Re-run once after layout settles.
          */

          setTimeout(function () {

            processCards();

            moveSharedCardToTop();

          }, 250);


          setTimeout(function () {

            moveSharedCardToTop();

          }, 700);


          return;

        }


        /*
          Keep trying because notification
          cards are dynamically created.
        */

        if (attempts >= 200) {

          clearInterval(
            finder
          );

        }

      }, 50);

  }


  /* =======================================================
     WATCH DYNAMIC NOTIFICATION CREATION
  ======================================================= */

  function watchNotifications() {

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
            !sharedHandled
          ) {

            const card =
              findSharedCard();


            if (card) {

              moveSharedCardToTop();

            }

          }

        }
      );


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

  }


  /* =======================================================
     START
  ======================================================= */

  function start() {

    installStyles();

    processCards();

    watchNotifications();

    startSharedLink();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once: true
      }
    );

  } else {

    start();

  }


})();
