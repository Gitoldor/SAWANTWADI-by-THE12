/* =========================================================
   SHO1RE1 — PWA ONLY GATE
   ---------------------------------------------------------
   Blocks normal browser usage.
   Allows usage only when opened as an installed PWA.

   IMPORTANT:
   Include this script as early as possible:

   <script src="pwa-gate.js"></script>
========================================================= */


(() => {

  "use strict";


  /* =======================================================
     CONFIG
  ======================================================= */

  const CONFIG = {

    appName: "Sho1re1",

    installButtonText: "Install App",

    browserMessage:
      "Install the app to continue.",

    manualMessage:
      "Use your browser menu and choose Install app or Add to Home screen."

  };


  /* =======================================================
     PWA DETECTION
  ======================================================= */

  function isRunningAsPWA() {

    const standalone =

      window.matchMedia(
        "(display-mode: standalone)"
      ).matches;


    const fullscreen =

      window.matchMedia(
        "(display-mode: fullscreen)"
      ).matches;


    const minimalUI =

      window.matchMedia(
        "(display-mode: minimal-ui)"
      ).matches;


    const iosStandalone =

      window.navigator.standalone === true;


    return (

      standalone ||

      fullscreen ||

      minimalUI ||

      iosStandalone

    );

  }


  /* =======================================================
     IF PWA → ALLOW APP
  ======================================================= */

  if (isRunningAsPWA()) {

    document.documentElement.classList.add(
      "pwa-mode"
    );

    return;

  }


  /* =======================================================
     BROWSER MODE → BLOCK APP
  ======================================================= */

  document.documentElement.classList.add(
    "browser-blocked"
  );


  let deferredPrompt = null;


  /* =======================================================
     CAPTURE INSTALL EVENT
  ======================================================= */

  window.addEventListener(

    "beforeinstallprompt",

    (event) => {

      event.preventDefault();

      deferredPrompt = event;

      updateInstallButton();

    }

  );


  /* =======================================================
     WAIT FOR BODY
  ======================================================= */

  function whenBodyReady(callback) {

    if (document.body) {

      callback();

      return;

    }


    document.addEventListener(

      "DOMContentLoaded",

      callback,

      { once: true }

    );

  }


  /* =======================================================
     CREATE BLOCK SCREEN
  ======================================================= */

  whenBodyReady(() => {

    blockPage();

  });


  function blockPage() {


    /* =========================================
       REMOVE EXISTING PAGE CONTENT
    ========================================= */

    document.body.replaceChildren();


    /* =========================================
       CREATE STYLE
    ========================================= */

    const style =

      document.createElement("style");


    style.textContent = `

      html.browser-blocked,
      body{

        width:100%;
        min-height:100%;

      }


      body{

        margin:0;

        background:#fcfcfc;

        color:#0a0a0a;

        font-family:

          -apple-system,
          BlinkMacSystemFont,
          "Inter",
          "Segoe UI",
          sans-serif;

      }


      .pwa-gate{

        position:fixed;

        inset:0;

        z-index:2147483647;

        display:flex;

        flex-direction:column;

        align-items:center;

        justify-content:center;

        padding:

          30px
          24px
          calc(
            30px +
            env(safe-area-inset-bottom)
          );

        text-align:center;

        background:#fcfcfc;

      }


      .pwa-gate-content{

        width:100%;

        max-width:360px;

        animation:

          pwaGateEnter

          .55s

          cubic-bezier(
            .16,
            1.25,
            .3,
            1
          )

          both;

      }


      .pwa-gate-logo{

        width:72px;

        height:72px;

        margin:

          0
          auto
          28px;

        border-radius:24px;

        background:#111;

        display:flex;

        align-items:center;

        justify-content:center;

        color:#fff;

        font-size:22px;

        font-weight:800;

        letter-spacing:-1px;

      }


      .pwa-gate-title{

        margin:0;

        font-size:32px;

        font-weight:800;

        line-height:1.08;

        letter-spacing:-1.4px;

      }


      .pwa-gate-text{

        margin:

          12px
          auto
          28px;

        max-width:290px;

        color:#777;

        font-size:15px;

        font-weight:500;

        line-height:1.5;

      }


      .pwa-gate-button{

        width:100%;

        height:54px;

        border:0;

        border-radius:18px;

        background:#111;

        color:#fff;

        font-size:16px;

        font-weight:700;

        cursor:pointer;

        transition:

          transform
          .2s
          cubic-bezier(
            .2,
            1.4,
            .3,
            1
          ),

          opacity
          .2s;

      }


      .pwa-gate-button:active{

        transform:scale(.96);

        opacity:.8;

      }


      .pwa-gate-help{

        margin-top:18px;

        color:#999;

        font-size:13px;

        line-height:1.45;

      }


      @keyframes pwaGateEnter{

        from{

          opacity:0;

          transform:

            translateY(18px)

            scale(.96);

        }


        to{

          opacity:1;

          transform:

            translateY(0)

            scale(1);

        }

      }


      @media(
        prefers-reduced-motion:reduce
      ){

        *{

          animation:none !important;

          transition:none !important;

        }

      }

    `;


    document.head.appendChild(
      style
    );


    /* =========================================
       SCREEN
    ========================================= */

    const gate =

      document.createElement("main");


    gate.className =
      "pwa-gate";


    gate.innerHTML = `

      <div class="pwa-gate-content">


        <div class="pwa-gate-logo">

          S

        </div>


        <h1 class="pwa-gate-title">

          ${escapeHTML(CONFIG.appName)}

        </h1>


        <p class="pwa-gate-text">

          ${escapeHTML(CONFIG.browserMessage)}

        </p>


        <button
          class="pwa-gate-button"
          id="pwaGateInstallButton"
          type="button"
        >

          ${escapeHTML(
            CONFIG.installButtonText
          )}

        </button>


        <div
          class="pwa-gate-help"
          id="pwaGateHelp"
        >

          ${escapeHTML(
            CONFIG.manualMessage
          )}

        </div>


      </div>

    `;


    document.body.appendChild(
      gate
    );


    /* =========================================
       INSTALL BUTTON
    ========================================= */

    const installButton =

      document.getElementById(
        "pwaGateInstallButton"
      );


    const help =

      document.getElementById(
        "pwaGateHelp"
      );


    function updateInstallButton() {


      if (!installButton) return;


      if (deferredPrompt) {


        installButton.disabled = false;


        help.textContent =

          "Tap Install to add " +

          CONFIG.appName +

          " to your device.";


      }

    }


    /* =========================================
       BUTTON CLICK
    ========================================= */

    installButton.addEventListener(

      "click",

      async () => {


        /* -------------------------------
           NATIVE INSTALL PROMPT
        ------------------------------- */

        if (deferredPrompt) {


          deferredPrompt.prompt();


          const result =

            await deferredPrompt.userChoice;


          /* Reset prompt */

          deferredPrompt = null;


          /* -----------------------------
             USER ACCEPTED
          ----------------------------- */

          if (

            result.outcome === "accepted"

          ) {


            installButton.textContent =

              "Installed";


            help.textContent =

              "Opening the app...";


          }


          /* -----------------------------
             USER DISMISSED
          ----------------------------- */

          else {


            help.textContent =

              "Installation was cancelled.";


          }


          return;

        }


        /* -------------------------------
           MANUAL INSTALL INSTRUCTIONS
        ------------------------------- */

        showManualInstructions();

      }

    );


    /* =========================================
       CHECK IF INSTALL EVENT
       ALREADY HAPPENED
    ========================================= */

    updateInstallButton();


  }


  /* =======================================================
     MANUAL INSTALL INSTRUCTIONS
  ======================================================= */

  function showManualInstructions() {


    const help =

      document.getElementById(
        "pwaGateHelp"
      );


    if (!help) return;


    const isIOS =

      /iphone|ipad|ipod/i.test(

        navigator.userAgent

      );


    if (isIOS) {


      help.textContent =

        "In Safari, tap Share and choose " +

        "Add to Home Screen.";


    }


    else {


      help.textContent =

        "Open your browser menu and choose " +

        "Install app or Add to Home screen.";


    }

  }


  /* =======================================================
     ESCAPE HTML
  ======================================================= */

  function escapeHTML(value) {


    const div =

      document.createElement("div");


    div.textContent =

      String(value);


    return div.innerHTML;

  }


  /* =======================================================
     APP INSTALLED EVENT
  ======================================================= */

  window.addEventListener(

    "appinstalled",

    () => {


      deferredPrompt = null;


      const button =

        document.getElementById(
          "pwaGateInstallButton"
        );


      const help =

        document.getElementById(
          "pwaGateHelp"
        );


      if (button) {


        button.textContent =

          "Installed";

      }


      if (help) {


        help.textContent =

          "Open the installed app " +

          "from your home screen.";

      }

    }

  );


})();