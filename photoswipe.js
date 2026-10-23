/* ============================================================
   FULL-BLEED AUTO PHOTO SWIPE
   File: photoSwipe.js
   ============================================================ */

(function () {

  const CONFIG = {

    // Add as many images as you want
    images: [
      "https://i.ibb.co/WN8t0hQc/1000001402-removebg-preview.png",
      "https://i.ibb.co/WN8t0hQc/1000001402-removebg-preview.png",
      "https://i.ibb.co/WN8t0hQc/1000001402-removebg-preview.png",
      "https://i.ibb.co/WN8t0hQc/1000001402-removebg-preview.png"
    ],

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
     START
     ========================================================== */

  let current = 0;


  function showNext() {

    if (current >= imageElements.length - 1) {

      /*
        Final image reached.

        STOP EVERYTHING.

        Final image remains visible indefinitely.
      */

      return;

    }


    current++;


    /*
      Move exactly ONE image height upward.

      Because every image has the same height,
      each swipe reveals only the next image.
    */

    const offset =
      current * imageElements[0].offsetHeight;


    track.style.transition =
      `transform ${CONFIG.swipeDuration}ms cubic-bezier(.22,1,.36,1)`;


    track.style.transform =
      `translate3d(0, -${offset}px, 0)`;


    /*
      Wait 1 second on this image,
      then bring the next one from below.
    */

    setTimeout(showNext, CONFIG.displayTime);

  }


  /* ==========================================================
     FIRST IMAGE

     Image 1 is already visible immediately.

     Wait 1 second before first swipe.
     ========================================================== */

  setTimeout(showNext, CONFIG.displayTime);


})();