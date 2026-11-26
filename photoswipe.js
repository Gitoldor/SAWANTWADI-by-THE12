/* ============================================================
   FULL-BLEED AUTO PHOTO SWIPE
   File: photoSwipe.js
   ============================================================ */

(function () {

  const CONFIG = {

    // First four slides are available to everyone.
    images: [
      "https://i.ibb.co/WN8t0hQc/1000001402-removebg-preview.png",
      "https://i.ibb.co/WN8t0hQc/1000001402-removebg-preview.png",
      "https://i.ibb.co/WN8t0hQc/1000001402-removebg-preview.png",
      "https://i.ibb.co/WN8t0hQc/1000001402-removebg-preview.png"
    ],

    // Fifth slide is appended only after the same verified PRO access check
    // used by the location-customization feature succeeds.
    proImage: "https://i.ibb.co/Zp8VjjXV/1000014335-removebg-preview.png",
    proAccessAPI: "https://sawantwadi-read-api.onrender.com/pro-status",

    // 9:16 portrait
    width: "100%",
    height: "56.25vw",

    // Keep at top of page
    top: "0px",

    // Each image stays visible for 1 second
    displayTime: 1000,

    // Swipe speed
    swipeDuration: 600
  };


  /* ==========================================================
     CLEAN OLD INSTANCE
     ========================================================== */

  document.getElementById("photoSwipePlugin")?.remove();
  document.getElementById("photoSwipePluginStyle")?.remove();


  /* ==========================================================
     STYLE
     ========================================================== */

  const style = document.createElement("style");

  style.id = "photoSwipePluginStyle";

  style.textContent = `

    #photoSwipePlugin {
      position: fixed;
      left: 0;
      top: ${CONFIG.top};

      width: ${CONFIG.width};
      height: ${CONFIG.height};

      overflow: hidden;

      margin: 0;
      padding: 0;

      background: transparent;

      z-index: 999999;

      pointer-events: none;
    }


    #photoSwipeTrack {

      position: absolute;

      left: 0;
      top: 0;

      width: 100%;

      height: auto;

      margin: 0;
      padding: 0;

      will-change: transform;
    }


    .photoSwipeImage {

      display: block;

      position: relative;

      width: 100%;
      height: ${CONFIG.height};

      margin: 0;
      padding: 0;

      border: 0;

      object-fit: cover;
      object-position: center;

      user-select: none;
      -webkit-user-select: none;

      -webkit-user-drag: none;

      pointer-events: none;
    }

    .photoSwipeImage.proShareSlide {
      pointer-events: auto;
      cursor: pointer;
    }


  `;

  document.head.appendChild(style);


  /* ==========================================================
     CONTAINER
     ========================================================== */

  const container = document.createElement("div");

  container.id = "photoSwipePlugin";


  const track = document.createElement("div");

  track.id = "photoSwipeTrack";


  container.appendChild(track);

  document.body.appendChild(container);


  /* ==========================================================
     CREATE IMAGES
     ========================================================== */

  const imageElements = [];

  CONFIG.images.forEach((src, index) => {

    const img = document.createElement("img");

    img.className = "photoSwipeImage";

    img.src = src;

    img.alt = "";

    img.draggable = false;

    img.decoding = "async";

    /*
      Every image is stacked vertically.

      Image 1 = visible
      Image 2 = completely below
      Image 3 = below image 2
      etc.
    */

    track.appendChild(img);

    imageElements.push(img);

  });


  /* ==========================================================
     PRO ACCESS
     ========================================================== */

  async function hasProAccess() {
    const auth = window.Sho1re1Auth || null;
    let user = null;
    try {
      user = auth && typeof auth.getUser === "function" ? auth.getUser() : null;
    } catch (_) {}
    if (!user) {
      try { user = JSON.parse(localStorage.getItem("sho1re1_google_profile_v1") || "null"); } catch (_) {}
    }
    const email = String(user && user.email || "").trim().toLowerCase();
    if (!email) return false;
    try {
      const response = await fetch(CONFIG.proAccessAPI, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
        cache: "no-store"
      });
      if (!response.ok) return false;
      const result = await response.json();
      return result.success === true && result.active === true;
    } catch (_) {
      return false;
    }
  }


  /* ==========================================================
     START
     ========================================================== */

  let current = 0;

  function showNext() {
    if (current >= imageElements.length - 1) {
      // Final available slide remains visible indefinitely.
      return;
    }

    current++;

    const offset = current * imageElements[0].offsetHeight;

    track.style.transition =
      `transform ${CONFIG.swipeDuration}ms cubic-bezier(.22,1,.36,1)`;

    track.style.transform =
      `translate3d(0, -${offset}px, 0)`;

    setTimeout(showNext, CONFIG.displayTime);
  }


  /* ==========================================================
     FIRST FOUR SLIDES ARE SHOWN TO EVERYONE.
     THE FIFTH SLIDE IS ADDED ONLY FOR VERIFIED PRO ACCOUNTS.
     ========================================================== */

  hasProAccess().then(function (allowed) {
    if (allowed) {
      const img = document.createElement("img");
      img.className = "photoSwipeImage";
      img.src = CONFIG.proImage;
      img.alt = "Share your Sho1re1 PRO profile";
      img.draggable = false;
      img.decoding = "async";
      img.classList.add("proShareSlide");
      img.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = new URL("pro-share.html", window.location.href).href;
      });
      track.appendChild(img);
      imageElements.push(img);
    }

    // Image 1 is already visible. Start the first swipe after its display time.
    setTimeout(showNext, CONFIG.displayTime);
  });


})();