/* =========================================
   SHO1RE1 — ANIMATED AI ICON
   CENTER → WHITE TRANSITION → HREF
========================================= */

(() => {

  "use strict";


  /* =========================
     CONFIG
  ========================= */

  const AI_LINK = "ai.html";

  const CENTER_DURATION = 550;

  const WHITE_DURATION = 420;


  /* =========================
     ADD STYLE
  ========================= */

  const style = document.createElement("style");


  style.textContent = `

    /* =====================
       AI BUTTON
    ===================== */

    .sho1re1-ai-button{

      position:fixed;

      left:20px;

      bottom:240px;

      width:58px;
      height:58px;

      display:flex;

      align-items:center;
      justify-content:center;

      background:#fff;

      border:1px solid #eee;

      border-radius:18px;

      color:#000;

      text-decoration:none;

      z-index:99999;

      box-shadow:
        0 8px 30px
        rgba(0,0,0,.10);

      cursor:pointer;

      -webkit-tap-highlight-color:transparent;

      animation:
        aiButtonEnter
        .6s
        cubic-bezier(.2,1.4,.3,1)
        both;

    }


    /* =====================
       ICON WRAPPER
    ===================== */

    .sho1re1-ai-icon{

      width:28px;
      height:28px;

      position:relative;

      display:block;

    }


    /* =====================
       MAIN SPARKLE
    ===================== */

    .ai-main-sparkle{

      transform-origin:center;

      animation:

        aiPulse

        2.4s

        cubic-bezier(
          .45,
          0,
          .55,
          1
        )

        infinite;

    }


    /* =====================
       SMALL SPARKLE
    ===================== */

    .ai-small-sparkle{

      transform-origin:center;

      animation:

        aiSmallPulse

        2.4s

        cubic-bezier(
          .45,
          0,
          .55,
          1
        )

        infinite;

    }


    /* =====================
       MAIN ICON ANIMATION
    ===================== */

    @keyframes aiPulse{

      0%{

        transform:scale(1);

      }


      35%{

        transform:scale(1.18);

      }


      60%{

        transform:scale(.94);

      }


      100%{

        transform:scale(1);

      }

    }


    /* =====================
       SMALL SPARKLE
    ===================== */

    @keyframes aiSmallPulse{

      0%,
      20%{

        transform:scale(.7);

        opacity:.45;

      }


      50%{

        transform:scale(1.15);

        opacity:1;

      }


      75%{

        transform:scale(.85);

        opacity:.7;

      }


      100%{

        transform:scale(.7);

        opacity:.45;

      }

    }


    /* =====================
       BUTTON ENTRANCE
    ===================== */

    @keyframes aiButtonEnter{

      from{

        opacity:0;

        transform:
          translateY(30px)
          scale(.7);

      }


      to{

        opacity:1;

        transform:
          translateY(0)
          scale(1);

      }

    }


    /* =====================
       PRESS
    ===================== */

    .sho1re1-ai-button:active{

      transform:scale(.90);

    }


    /* =====================
       TRANSITION OVERLAY
    ===================== */

    .sho1re1-ai-transition{

      position:fixed;

      inset:0;

      z-index:2147483647;

      pointer-events:none;

      overflow:hidden;

    }


    /* =====================
       MOVING ICON BOX
    ===================== */

    .sho1re1-ai-moving-box{

      position:fixed;

      display:flex;

      align-items:center;
      justify-content:center;

      background:#fff;

      border:1px solid #eee;

      border-radius:18px;

      color:#000;

      box-shadow:
        0 8px 30px
        rgba(0,0,0,.10);

      pointer-events:none;

      will-change:
        transform,
        left,
        top,
        width,
        height;

    }


    /* =====================
       FULL WHITE SCREEN
    ===================== */

    .sho1re1-ai-white-screen{

      position:absolute;

      inset:0;

      background:#fff;

      opacity:0;

      pointer-events:none;

    }


    /* =====================
       ACCESSIBILITY
    ===================== */

    @media
    (prefers-reduced-motion:reduce){

      .sho1re1-ai-icon *,
      .sho1re1-ai-button{

        animation:none !important;

      }

    }

  `;


  document.head.appendChild(style);



  /* =========================
     CREATE BUTTON
  ========================= */

  const aiButton =
    document.createElement("a");


  aiButton.className =
    "sho1re1-ai-button";


  aiButton.href =
    AI_LINK;


  aiButton.target =
    "_top";


  aiButton.setAttribute(
    "aria-label",
    "Open AI"
  );


  /* =========================
     ANIMATED AI SVG
  ========================= */

  aiButton.innerHTML = `

    <svg
      class="sho1re1-ai-icon"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >


      <!-- MAIN SPARKLE -->

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


      <!-- SMALL SPARKLE -->

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



  /* =========================
     TRANSITION STATE
  ========================= */

  let isTransitioning = false;



  /* =========================
     CLICK TRANSITION
  ========================= */

  aiButton.addEventListener(

    "click",

    event => {


      event.preventDefault();


      if(isTransitioning){

        return;

      }


      isTransitioning = true;


      /* =====================
         GET ORIGINAL POSITION
      ===================== */

      const rect =
        aiButton.getBoundingClientRect();


      /* =====================
         CREATE OVERLAY
      ===================== */

      const transition =
        document.createElement("div");


      transition.className =
        "sho1re1-ai-transition";


      /* =====================
         CREATE WHITE SCREEN
      ===================== */

      const whiteScreen =
        document.createElement("div");


      whiteScreen.className =
        "sho1re1-ai-white-screen";


      /* =====================
         CREATE MOVING BOX

         IMPORTANT:
         Entire icon box is copied.
         Animated SVG remains inside.
      ===================== */

      const movingBox =
        document.createElement("div");


      movingBox.className =
        "sho1re1-ai-moving-box";


      movingBox.innerHTML =
        aiButton.innerHTML;


      /* =====================
         START AT ORIGINAL
         POSITION
      ===================== */

      movingBox.style.left =
        rect.left + "px";


      movingBox.style.top =
        rect.top + "px";


      movingBox.style.width =
        rect.width + "px";


      movingBox.style.height =
        rect.height + "px";


      /* =====================
         ADD ELEMENTS
      ===================== */

      transition.appendChild(
        whiteScreen
      );


      transition.appendChild(
        movingBox
      );


      document.body.appendChild(
        transition
      );


      /* =====================
         HIDE ORIGINAL
      ===================== */

      aiButton.style.visibility =
        "hidden";


      /* =====================
         EXACT SCREEN CENTER
      ===================== */

      const centerX =
        window.innerWidth / 2;


      const centerY =
        window.innerHeight / 2;


      const centerSize =
        112;


      const targetLeft =
        centerX -
        centerSize / 2;


      const targetTop =
        centerY -
        centerSize / 2;


      /* =====================
         PHASE 1

         WHOLE BOX MOVES
         TO CENTER

         AND GETS BIGGER
      ===================== */

      const moveAnimation =

        movingBox.animate(

          [

            {

              left:
                rect.left + "px",

              top:
                rect.top + "px",

              width:
                rect.width + "px",

              height:
                rect.height + "px",

              borderRadius:
                "18px",

              opacity:1,

              offset:0

            },


            {

              left:
                targetLeft + "px",

              top:
                targetTop + "px",

              width:
                centerSize + "px",

              height:
                centerSize + "px",

              borderRadius:
                "32px",

              opacity:1,

              offset:1

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


      /* =====================
         AFTER CENTER REACHED
      ===================== */

      moveAnimation.finished.then(

        () => {


          /* =================
             PHASE 2

             WHITE SCREEN
             FADES IN
          ================= */

          const fadeAnimation =

            whiteScreen.animate(

              [

                {

                  opacity:0

                },


                {

                  opacity:1

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


          /* =================
             MOVING BOX

             GENTLY EXPANDS
             AS WHITE COMES
          ================= */

          movingBox.animate(

            [

              {

                transform:
                  "scale(1)",

                opacity:1

              },


              {

                transform:
                  "scale(1.12)",

                opacity:.98

              }

            ],

            {

              duration:
                WHITE_DURATION,

              easing:
                "cubic-bezier(.2,1,.3,1)",

              fill:
                "forwards"

            }

          );


          /* =================
             OPEN AI PAGE
          ================= */

          fadeAnimation.finished.then(

            () => {


              window.location.href =
                AI_LINK;


            }

          );


        }

      );


    }

  );



  /* =========================
     ADD BUTTON
  ========================= */

  function addAIButton(){


    /* Prevent duplicates */

    if(

      document.querySelector(
        ".sho1re1-ai-button"
      )

    ){

      return;

    }


    document.body.appendChild(
      aiButton
    );

  }



  /* =========================
     PAGE READY
  ========================= */

  if(document.body){

    addAIButton();

  }

  else{

    document.addEventListener(

      "DOMContentLoaded",

      addAIButton,

      { once:true }

    );

  }


})();