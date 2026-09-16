/* =========================================
   SHO1RE1 — ANIMATED AI ICON
   BUTTON → CENTER → WHITE → HREF

   • Icon stays visible
   • Button moves smoothly to center
   • White fills screen behind icon
   • Navigate after transition
========================================= */

(() => {

  "use strict";

  if (document.querySelector(".sho1re1-ai-button")) return;


  /* =========================================
     CONFIG
  ========================================= */

  const AI_LINK = "ai.html";

  const CENTER_DURATION = 550;

  const WHITE_DURATION = 420;


  /* =========================================
     STYLE
  ========================================= */

  const style = document.createElement("style");

  style.textContent = `

    /* AI BUTTON */

    .sho1re1-ai-button {

      position: fixed;

      left: 15px;
      bottom: 245px;

      width: 58px;
      height: 58px;

      display: flex;

      align-items: center;
      justify-content: center;

      background: #fff;

      border: 1px solid #eee;

      border-radius: 22px;

      color: #000;

      text-decoration: none;

      z-index: 99999;

      box-shadow:
        0 8px 30px rgba(0,0,0,.10);

      cursor: pointer;

      -webkit-tap-highlight-color: transparent;

      animation:
        sho1re1AIEnter .6s
        cubic-bezier(.2,1.4,.3,1)
        both;

    }


    /* ICON */

    .sho1re1-ai-icon {

      width: 28px;
      height: 28px;

      display: block;

      overflow: visible;

    }


    /* MAIN SPARKLE */

    .ai-main-sparkle {

      transform-origin: center;

      animation:
        sho1re1AIPulse
        2.4s
        cubic-bezier(.45,0,.55,1)
        infinite;

    }


    /* SMALL SPARKLE */

    .ai-small-sparkle {

      transform-origin: center;

      animation:
        sho1re1AISmallPulse
        2.4s
        cubic-bezier(.45,0,.55,1)
        infinite;

    }


    /* BUTTON ENTER */

    @keyframes sho1re1AIEnter {

      from {

        opacity: 0;

        transform:
          translateY(30px)
          scale(.7);

      }

      to {

        opacity: 1;

        transform:
          translateY(0)
          scale(1);

      }

    }


    /* MAIN PULSE */

    @keyframes sho1re1AIPulse {

      0% {

        transform: scale(1);

      }

      35% {

        transform: scale(1.18);

      }

      60% {

        transform: scale(.94);

      }

      100% {

        transform: scale(1);

      }

    }


    /* SMALL PULSE */

    @keyframes sho1re1AISmallPulse {

      0%, 20% {

        transform: scale(.7);

        opacity: .45;

      }

      50% {

        transform: scale(1.15);

        opacity: 1;

      }

      75% {

        transform: scale(.85);

        opacity: .7;

      }

      100% {

        transform: scale(.7);

        opacity: .45;

      }

    }


    /* TRANSITION */

    .sho1re1-ai-transition {

      position: fixed;

      inset: 0;

      z-index: 2147483647;

      pointer-events: none;

      overflow: hidden;

    }


    /* WHITE SCREEN */

    .sho1re1-ai-white-screen {

      position: absolute;

      inset: 0;

      background: #fff;

      opacity: 0;

    }


    /* MOVING BOX */

    .sho1re1-ai-moving-box {

      position: fixed;

      display: flex;

      align-items: center;
      justify-content: center;

      background: #fff;

      border: 1px solid #eee;

      border-radius: 18px;

      color: #000;

      box-shadow:
        0 8px 30px rgba(0,0,0,.10);

      pointer-events: none;

      will-change:
        left,
        top,
        width,
        height,
        transform;

    }


    /* BIG ICON */

    .sho1re1-ai-moving-box
    .sho1re1-ai-icon {

      width: 50%;
      height: 50%;

    }

  `;

  document.head.appendChild(style);


  /* =========================================
     CREATE BUTTON
  ========================================= */

  const aiButton = document.createElement("a");

  aiButton.className = "sho1re1-ai-button";

  aiButton.href = AI_LINK;

  aiButton.setAttribute(
    "aria-label",
    "Open AI"
  );


  /* =========================================
     SVG
  ========================================= */

  const aiSVG = `

    <svg
      class="sho1re1-ai-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >

      <path

        class="ai-main-sparkle"

        d="
          M11 2
          L13.3 8.7
          L20 11
          L13.3 13.3
          L11 20
          L8.7 13.3
          L2 11
          L8.7 8.7
          Z
        "

        stroke="currentColor"

        stroke-width="1.8"

        stroke-linejoin="round"

      />

      <path

        class="ai-small-sparkle"

        d="
          M18.5 3
          L19.3 5.2
          L21.5 6
          L19.3 6.8
          L18.5 9
          L17.7 6.8
          L15.5 6
          L17.7 5.2
          Z
        "

        stroke="currentColor"

        stroke-width="1.6"

        stroke-linejoin="round"

      />

    </svg>

  `;


  aiButton.innerHTML = aiSVG;


  /* =========================================
     STATE
  ========================================= */

  let isTransitioning = false;


  /* =========================================
     CLICK
  ========================================= */

  aiButton.addEventListener(

    "click",

    (event) => {

      event.preventDefault();

      if (isTransitioning) return;

      isTransitioning = true;


      /* GET ORIGINAL POSITION */

      const rect =
        aiButton.getBoundingClientRect();


      /* CREATE OVERLAY */

      const transition =
        document.createElement("div");

      transition.className =
        "sho1re1-ai-transition";


      /* CREATE WHITE SCREEN */

      const whiteScreen =
        document.createElement("div");

      whiteScreen.className =
        "sho1re1-ai-white-screen";


      /* CREATE MOVING ICON */

      const movingBox =
        document.createElement("div");

      movingBox.className =
        "sho1re1-ai-moving-box";

      movingBox.innerHTML = aiSVG;


      /* ORIGINAL POSITION */

      Object.assign(
        movingBox.style,
        {

          left: rect.left + "px",

          top: rect.top + "px",

          width: rect.width + "px",

          height: rect.height + "px"

        }
      );


      /* ADD WHITE FIRST */

      transition.appendChild(
        whiteScreen
      );

      transition.appendChild(
        movingBox
      );

      document.body.appendChild(
        transition
      );


      /* HIDE ORIGINAL */

      aiButton.style.visibility =
        "hidden";


      /* CENTER VALUES */

      const centerSize = 112;

      const targetLeft =
        window.innerWidth / 2
        - centerSize / 2;

      const targetTop =
        window.innerHeight / 2
        - centerSize / 2;


      /* =====================================
         PHASE 1

         MOVE TO CENTER
      ===================================== */

      const moveAnimation =
        movingBox.animate(

          [

            {

              left: rect.left + "px",

              top: rect.top + "px",

              width: rect.width + "px",

              height: rect.height + "px",

              borderRadius: "18px"

            },

            {

              left: targetLeft + "px",

              top: targetTop + "px",

              width: centerSize + "px",

              height: centerSize + "px",

              borderRadius: "32px"

            }

          ],

          {

            duration:
              CENTER_DURATION,

            easing:
              "cubic-bezier(.16,1,.3,1)",

            fill:
              "forwards"

          }

        );


      /* =====================================
         PHASE 2

         WHITE APPEARS

         ICON STAYS VISIBLE!
      ===================================== */

      moveAnimation.finished.then(

        () => {

          const whiteAnimation =
            whiteScreen.animate(

              [

                {

                  opacity: 0

                },

                {

                  opacity: 1

                }

              ],

              {

                duration:
                  WHITE_DURATION,

                easing:
                  "ease-out",

                fill:
                  "forwards"

              }

            );


          /* =================================
             AFTER WHITE IS FULL

             ICON HAS NEVER DISAPPEARED
             DURING THE ANIMATION.

             NOW NAVIGATE.
          ================================= */

          whiteAnimation.finished.then(

            () => {

              window.location.href =
                AI_LINK;

            }

          );

        }

      );

    }

  );


  /* =========================================
     ADD BUTTON
  ========================================= */

  function addAIButton() {

    if (
      document.querySelector(
        ".sho1re1-ai-button"
      )
    ) return;


    document.body.appendChild(
      aiButton
    );

  }


  /* =========================================
     START
  ========================================= */

  if (document.body) {

    addAIButton();

  }

  else {

    document.addEventListener(

      "DOMContentLoaded",

      addAIButton,

      { once: true }

    );

  }

})();