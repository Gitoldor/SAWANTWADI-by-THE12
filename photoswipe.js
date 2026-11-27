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

    // MAX members see this image in place of the standard PRO fifth slide.
    maxImage: "https://i.ibb.co/S7XQstn1/1000014686-removebg-preview.png",

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

  function hasProAccess() {
    const pro = window.Sho1re1Pro;
    return pro ? pro.check() : Promise.resolve(false);
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

  let proSlideAdded = false;
  let swipeStarted = false;

  function addProSlide() {
    if (proSlideAdded || track.querySelector(".proShareSlide")) return;
    const wasAtEnd = current >= imageElements.length - 1;
    proSlideAdded = true;
    const img = document.createElement("img");
    img.className = "photoSwipeImage proShareSlide";
    const planId = window.Sho1re1Pro && window.Sho1re1Pro.getPlanId ? window.Sho1re1Pro.getPlanId() : null;
    const isMax = planId === "MAX_30D";
    img.src = isMax ? CONFIG.maxImage : CONFIG.proImage;
    img.alt = isMax ? "Sho1re1 MAX" : "Share your Sho1re1 PRO profile";
    img.draggable = false;
    img.decoding = "async";
    if (!isMax) {
      img.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.location.href = new URL("pro-share.html", window.location.href).href;
      });
    }
    track.appendChild(img);
    imageElements.push(img);
    if (swipeStarted && wasAtEnd) setTimeout(showNext, 40);
  }

  function refreshProSlide() {
    hasProAccess().then(function (allowed) {
      if (allowed) addProSlide();
      if (!swipeStarted) {
        swipeStarted = true;
        // Image 1 is already visible. Start the first swipe after its display time.
        setTimeout(showNext, CONFIG.displayTime);
      }
    });
  }

  // The Google ID token can expire while the local profile remains saved.
  // Re-check after the auth layer silently refreshes that token.
  if (window.Sho1re1Pro) window.Sho1re1Pro.onChange(function (allowed) { if (allowed) addProSlide(); });
  refreshProSlide();


})();