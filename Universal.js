/* ============================================================
   SAWANTWADI UNIVERSAL POST SHARING
   Works directly with #carousel .card
   ============================================================ */

(function () {

  const SHARE_CLASS = "UniversalShareButton";

  function getPosts() {
    try {
      if (typeof activePlaces !== "undefined" && Array.isArray(activePlaces)) {
        return activePlaces;
      }
    } catch (e) {}

    if (Array.isArray(window.Sho1re1VisiblePlaces)) {
      return window.Sho1re1VisiblePlaces;
    }

    if (Array.isArray(window.Sho1re1Places)) {
      return window.Sho1re1Places;
    }

    return [];
  }


  /* ============================================================
     CREATE SHARE BUTTON
     ============================================================ */

  function createShareButton(post) {

    const button = document.createElement("button");

    button.type = "button";
    button.className = SHARE_CLASS;

    button.setAttribute("aria-label", "Share post");
    button.title = "Share post";

    button.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        width="19"
        height="19"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.6" y1="13.5" x2="15.4" y2="17.5"></line>
        <line x1="15.4" y1="6.5" x2="8.6" y2="10.5"></line>
      </svg>
    `;

    Object.assign(button.style, {
      position: "absolute",
      top: "12px",
      right: "12px",
      width: "42px",
      height: "42px",
      padding: "0",
      border: "none",
      borderRadius: "50%",
      background: "rgba(0,0,0,.72)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      zIndex: "50",
      boxShadow: "0 4px 14px rgba(0,0,0,.3)",
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)"
    });

    button.addEventListener("click", async function (event) {

      event.preventDefault();
      event.stopPropagation();

      const url = new URL(window.location.href);

      url.search = "";
      url.searchParams.set("post", String(post.id));

      const shareURL = url.toString();

      /* Native phone share */
      if (navigator.share) {
        try {
          await navigator.share({
            title: post.title || "Post",
            text: post.title || "",
            url: shareURL
          });

          return;

        } catch (error) {

          if (error && error.name === "AbortError") {
            return;
          }
        }
      }

      /* Clipboard fallback */
      try {

        await navigator.clipboard.writeText(shareURL);

        showToast("Post link copied");

      } catch (error) {

        window.prompt(
          "Copy this post link:",
          shareURL
        );

      }

    });

    return button;
  }


  /* ============================================================
     ADD SHARE BUTTONS TO MAP CARDS
     ============================================================ */

  function addShareButtons() {

    const carousel = document.getElementById("carousel");

    if (!carousel) return;

    const cards = carousel.querySelectorAll(".card");

    const posts = getPosts();

    if (!posts.length) return;

    cards.forEach(function (card, index) {

      const post = posts[index];

      if (!post) return;

      /* Make sure card can contain absolute button */
      if (getComputedStyle(card).position === "static") {
        card.style.position = "relative";
      }

      /* Prevent duplicate button */
      if (card.querySelector("." + SHARE_CLASS)) {
        return;
      }

      const button = createShareButton(post);

      card.appendChild(button);

    });

  }


  /* ============================================================
     FIND SHARED POST
     ============================================================ */

  function findSharedPost() {

    const params = new URLSearchParams(
      window.location.search
    );

    const id = params.get("post");

    if (!id) return null;

    const posts = getPosts();

    for (let i = 0; i < posts.length; i++) {

      if (String(posts[i].id) === String(id)) {

        return {
          post: posts[i],
          index: i
        };

      }

    }

    return null;

  }


  /* ============================================================
     OPEN SHARED POST
     ============================================================ */

  function openSharedPost() {

    const shared = findSharedPost();

    if (!shared) {

      /* Invalid/deleted post */
      const params = new URLSearchParams(
        window.location.search
      );

      if (params.has("post")) {

        params.delete("post");

        const cleanURL =
          window.location.pathname +
          (params.toString()
            ? "?" + params.toString()
            : "") +
          window.location.hash;

        history.replaceState(
          {},
          "",
          cleanURL
        );

        showToast("Post not found");

      }

      return;

    }

    const cards =
      document.querySelectorAll(
        "#carousel .card"
      );

    const card =
      cards[shared.index];

    if (!card) return;


    /* Use the EXISTING card click */
    /* This activates the existing map behavior */
    setTimeout(function () {

      card.click();

      card.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center"
      });

    }, 150);


    document.title =
      shared.post.title ||
      document.title;


    createExitButton();

  }


  /* ============================================================
     EXIT SHARED POST
     ============================================================ */

  function exitSharedPost() {

    const url =
      new URL(window.location.href);

    url.searchParams.delete("post");

    history.pushState(
      {},
      "",
      url.pathname +
      url.search +
      url.hash
    );

    const exit =
      document.getElementById(
        "UniversalExitButton"
      );

    if (exit) {
      exit.remove();
    }

    document.title =
      "Sawantwadi Digital";

  }


  /* ============================================================
     EXIT BUTTON
     ============================================================ */

  function createExitButton() {

    if (
      document.getElementById(
        "UniversalExitButton"
      )
    ) {
      return;
    }

    const button =
      document.createElement("button");

    button.id =
      "UniversalExitButton";

    button.type =
      "button";

    button.textContent =
      "← View all posts";

    Object.assign(button.style, {
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
      boxShadow: "0 5px 20px rgba(0,0,0,.25)"
    });

    button.addEventListener(
      "click",
      exitSharedPost
    );

    document.body.appendChild(button);

  }


  /* ============================================================
     TOAST
     ============================================================ */

  function showToast(message) {

    const old =
      document.getElementById(
        "UniversalToast"
      );

    if (old) {
      old.remove();
    }

    const toast =
      document.createElement("div");

    toast.id =
      "UniversalToast";

    toast.textContent =
      message;

    Object.assign(toast.style, {
      position: "fixed",
      left: "50%",
      bottom: "25px",
      transform: "translateX(-50%)",
      zIndex: "999999",
      padding: "12px 18px",
      borderRadius: "999px",
      background: "#111",
      color: "#fff",
      fontSize: "14px",
      boxShadow: "0 8px 30px rgba(0,0,0,.35)"
    });

    document.body.appendChild(toast);

    setTimeout(function () {

      toast.remove();

    }, 2200);

  }


  /* ============================================================
     INITIALIZATION
     ============================================================ */

  function init() {

    addShareButtons();

    openSharedPost();

  }


  /* Wait for map/cards to render */
  window.addEventListener(
    "load",
    function () {

      setTimeout(init, 300);

      /* Keep watching because filters/search can rerender cards */
      setInterval(function () {

        addShareButtons();

      }, 500);

    }
  );


})();
