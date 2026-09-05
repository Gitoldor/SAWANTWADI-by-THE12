/* ============================================================
   SHO1RE1 UNIVERSAL POST SHARING
   ------------------------------------------------------------
   ?post=ID
   = opens the NORMAL MAP and selects that post.
   
   No fullscreen viewer.
   No replacement page.
   No black overlay.
   No duplicate post screen.
   ============================================================ */

(function () {

  "use strict";

  var SHARE_CLASS = "Sho1re1UniversalShare";
  var EXIT_ID = "Sho1re1UniversalExit";

  /* ============================================================
     GET POST ID FROM URL
     ============================================================ */

  function getSharedPostId() {

    var params = new URLSearchParams(
      window.location.search
    );

    return params.get("post");

  }


  /* ============================================================
     GET CURRENT POSTS
     
     activePlaces is the actual array used by your existing
     renderer.
     ============================================================ */

  function getPosts() {

    try {

      if (
        typeof activePlaces !== "undefined" &&
        Array.isArray(activePlaces)
      ) {
        return activePlaces;
      }

    } catch (e) {}

    try {

      if (
        typeof rawPlaces !== "undefined" &&
        Array.isArray(rawPlaces)
      ) {
        return rawPlaces;
      }

    } catch (e) {}

    if (
      Array.isArray(window.Sho1re1VisiblePlaces)
    ) {
      return window.Sho1re1VisiblePlaces;
    }

    return [];

  }


  /* ============================================================
     FIND POST
     ============================================================ */

  function findPost(id) {

    if (!id) return null;

    var posts = getPosts();

    for (
      var i = 0;
      i < posts.length;
      i++
    ) {

      if (
        posts[i] &&
        String(posts[i].id) === String(id)
      ) {
        return {
          post: posts[i],
          index: i
        };
      }

    }

    return null;

  }


  /* ============================================================
     SHARE URL
     ============================================================ */

  function getShareURL(post) {

    var url =
      new URL(
        window.location.href
      );

    url.search = "";
    url.hash = "";

    url.searchParams.set(
      "post",
      String(post.id)
    );

    return url.toString();

  }


  /* ============================================================
     SHARE BUTTON
     ============================================================ */

  function createShareButton(post) {

    var button =
      document.createElement("button");

    button.type = "button";

    button.className =
      SHARE_CLASS;

    button.setAttribute(
      "aria-label",
      "Share post"
    );

    button.title =
      "Share post";

    /* SVG SHARE ICON */

    button.innerHTML = `
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
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

        <line x1="8.59" y1="13.51"
              x2="15.42" y2="17.49"></line>

        <line x1="15.41" y1="6.51"
              x2="8.59" y2="10.49"></line>
      </svg>
    `;

    button.onclick =
      function (event) {

        event.preventDefault();
        event.stopPropagation();

        sharePost(post);

      };

    return button;

  }


  /* ============================================================
     SHARE POST
     ============================================================ */

  async function sharePost(post) {

    var url =
      getShareURL(post);

    var title =
      post.title ||
      "Sawantwadi";

    var text =
      post.title
        ? "Check out " + post.title
        : "Check out this post on Sawantwadi";


    /* MOBILE / NATIVE SHARE */

    if (
      navigator.share
    ) {

      try {

        await navigator.share({

          title: title,
          text: text,
          url: url

        });

        return;

      } catch (error) {

        /*
          User cancelled sharing.
          Do nothing.
        */

        if (
          error &&
          error.name === "AbortError"
        ) {
          return;
        }

      }

    }


    /* FALLBACK: COPY LINK */

    try {

      await navigator.clipboard.writeText(
        url
      );

      showToast(
        "Post link copied"
      );

    } catch (error) {

      /*
        Older browsers fallback
      */

      var input =
        document.createElement("input");

      input.value = url;

      document.body.appendChild(
        input
      );

      input.select();

      try {
        document.execCommand(
          "copy"
        );
      } catch (e) {}

      input.remove();

      showToast(
        "Post link copied"
      );

    }

  }


  /* ============================================================
     TOAST
     ============================================================ */

  function showToast(message) {

    var old =
      document.getElementById(
        "Sho1re1UniversalToast"
      );

    if (old) {
      old.remove();
    }

    var toast =
      document.createElement("div");

    toast.id =
      "Sho1re1UniversalToast";

    toast.textContent =
      message;

    toast.style.cssText = `
      position:fixed;
      left:50%;
      bottom:90px;
      transform:translateX(-50%);
      z-index:999999;
      padding:10px 16px;
      border-radius:999px;
      background:rgba(20,20,20,.94);
      color:#fff;
      font-size:13px;
      font-weight:600;
      white-space:nowrap;
      box-shadow:0 8px 30px rgba(0,0,0,.25);
      pointer-events:none;
    `;

    document.body.appendChild(
      toast
    );

    setTimeout(
      function () {

        if (toast) {
          toast.remove();
        }

      },
      1800
    );

  }


  /* ============================================================
     ADD SHARE BUTTONS TO EXISTING CARDS
     ============================================================ */

  function addShareButtons() {

    var carousel =
      document.getElementById(
        "carousel"
      );

    if (!carousel) {
      return;
    }

    var cards =
      carousel.querySelectorAll(
        ".card"
      );

    if (!cards.length) {
      return;
    }

    var posts =
      getPosts();

    for (
      var i = 0;
      i < cards.length;
      i++
    ) {

      var card =
        cards[i];

      /*
        Remove old Universal button
        if renderer recreated the card.
      */

      var old =
        card.querySelector(
          "." + SHARE_CLASS
        );

      if (old) {
        old.remove();
      }

      /*
        Card index corresponds to activePlaces
        index because your renderer uses:

        activePlaces.forEach((place, idx) => ...)
      */

      var post =
        posts[i];

      if (!post) {
        continue;
      }

      var button =
        createShareButton(
          post
        );

      /*
        Put button inside card.
        It is positioned independently so
        existing card HTML doesn't need editing.
      */

      card.style.position =
        card.style.position ||
        "relative";

      button.style.cssText = `
        position:absolute;
        top:12px;
        right:12px;
        width:42px;
        height:42px;
        border:0;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:0;
        margin:0;
        background:rgba(0,0,0,.55);
        color:#fff;
        backdrop-filter:blur(10px);
        -webkit-backdrop-filter:blur(10px);
        cursor:pointer;
        z-index:50;
        box-shadow:0 4px 14px rgba(0,0,0,.18);
      `;

      card.appendChild(
        button
      );

    }

  }


  /* ============================================================
     EXIT SHARED POST MODE
     
     IMPORTANT:
     We do NOT change the map.
     We simply remove ?post=ID.
     ============================================================ */

  function exitSharedPost() {

    var url =
      new URL(
        window.location.href
      );

    url.searchParams.delete(
      "post"
    );

    /*
      Restore anything the old sharing system
      may have hidden.
    */

    var hidden =
      document.querySelectorAll(
        "[data-sho1re1-hidden]"
      );

    for (
      var i = 0;
      i < hidden.length;
      i++
    ) {

      hidden[i].style.display =
        hidden[i].getAttribute(
          "data-sho1re1-original-display"
        ) || "";

      hidden[i].removeAttribute(
        "data-sho1re1-hidden"
      );

      hidden[i].removeAttribute(
        "data-sho1re1-original-display"
      );

    }

    /*
      Remove our exit button.
    */

    var exit =
      document.getElementById(
        EXIT_ID
      );

    if (exit) {
      exit.remove();
    }

    /*
      Go back to normal URL without
      reloading the entire page.
    */

    history.pushState(
      {},
      "",
      url.pathname +
      url.search +
      url.hash
    );

    /*
      Restore normal active state.
    */

    try {

      if (
        typeof activeIndex !== "undefined" &&
        typeof setActive === "function"
      ) {

        /*
          Don't force a different marker.
          Just allow normal UI to continue.
        */

      }

    } catch (e) {}

    document.title =
      "Sawantwadi";

  }


  /* ============================================================
     EXIT BUTTON
     ============================================================ */

  function createExitButton() {

    if (
      document.getElementById(
        EXIT_ID
      )
    ) {
      return;
    }

    var button =
      document.createElement("button");

    button.id =
      EXIT_ID;

    button.type =
      "button";

    button.innerHTML =
      "← View all posts";

    button.onclick =
      exitSharedPost;

    button.style.cssText = `
      position:fixed;
      top:16px;
      left:16px;
      z-index:999999;
      border:0;
      border-radius:999px;
      padding:11px 16px;
      background:rgba(0,0,0,.72);
      color:#fff;
      font-size:13px;
      font-weight:700;
      line-height:1;
      backdrop-filter:blur(12px);
      -webkit-backdrop-filter:blur(12px);
      box-shadow:0 5px 20px rgba(0,0,0,.2);
      cursor:pointer;
    `;

    document.body.appendChild(
      button
    );

  }


  /* ============================================================
     OPEN SHARED POST
     
     THIS IS THE IMPORTANT PART.
     
     We find the existing card and CLICK IT.
     
     Your existing card click already calls:
     
       setActive(idx)
       map.flyTo(...)
     
     So the post opens on the SAME MAP.
     ============================================================ */

  function openSharedPost() {

    var id =
      getSharedPostId();

    if (!id) {

      var oldExit =
        document.getElementById(
          EXIT_ID
        );

      if (oldExit) {
        oldExit.remove();
      }

      return;

    }

    var carousel =
      document.getElementById(
        "carousel"
      );

    if (!carousel) {
      return;
    }

    var cards =
      carousel.querySelectorAll(
        ".card"
      );

    if (!cards.length) {
      return;
    }

    var result =
      findPost(id);

    if (!result) {
      return;
    }

    var index =
      result.index;

    var card =
      cards[index];

    if (!card) {
      return;
    }

    createExitButton();

    /*
      IMPORTANT:
      Undo the OLD Universal/app shared mode
      so the map remains completely normal.
    */

    var hidden =
      document.querySelectorAll(
        "[data-sho1re1-hidden]"
      );

    for (
      var i = 0;
      i < hidden.length;
      i++
    ) {

      hidden[i].style.display =
        hidden[i].getAttribute(
          "data-sho1re1-original-display"
        ) || "";

      hidden[i].removeAttribute(
        "data-sho1re1-hidden"
      );

      hidden[i].removeAttribute(
        "data-sho1re1-original-display"
      );

    }


    /*
      SELECT THE EXISTING CARD.
      
      This triggers your existing onclick,
      which means the map moves to the post
      exactly like a normal user tap.
    */

    setTimeout(
      function () {

        /*
          Re-fetch because the renderer may
          have rebuilt the cards.
        */

        var currentCards =
          carousel.querySelectorAll(
            ".card"
          );

        var currentCard =
          currentCards[index];

        if (!currentCard) {
          return;
        }

        /*
          Click the actual card.
          
          Share button won't interfere because
          it stops propagation.
        */

        currentCard.click();

        /*
          Bring the selected card into view
          in the existing carousel.
        */

        setTimeout(
          function () {

            currentCard.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center"
            });

          },
          150
        );

        /*
          Change title only.
        */

        if (
          result.post &&
          result.post.title
        ) {

          document.title =
            result.post.title +
            " • Sawantwadi";

        }

      },
      100
    );

  }


  /* ============================================================
     INITIALIZE
     ============================================================ */

  function initialize() {

    /*
      Cards are generated dynamically,
      so give the main app time to render.
    */

    addShareButtons();

    openSharedPost();

    setTimeout(
      function () {

        addShareButtons();
        openSharedPost();

      },
      300
    );

    setTimeout(
      function () {

        addShareButtons();
        openSharedPost();

      },
      1000
    );

  }


  /* ============================================================
     WATCH DYNAMIC CARD RENDERING
     ============================================================ */

  var observer =
    new MutationObserver(
      function () {

        addShareButtons();

      }
    );


  function startObserver() {

    if (!document.body) {
      return;
    }

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

  }


  /* ============================================================
     URL BACK / FORWARD
     ============================================================ */

  window.addEventListener(
    "popstate",
    function () {

      /*
        Remove old exit button first.
      */

      var exit =
        document.getElementById(
          EXIT_ID
        );

      if (exit) {
        exit.remove();
      }

      /*
        Re-run shared URL logic.
      */

      setTimeout(
        function () {

          addShareButtons();
          openSharedPost();

        },
        100
      );

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

        startObserver();
        initialize();

      }
    );

  } else {

    startObserver();
    initialize();

  }


})();
