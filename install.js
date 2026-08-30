(() => {
  let deferredPrompt = null;

  const style = document.createElement("style");

  style.textContent = `
    #pwa-install-notice {
      position: fixed;
      top: 16px;
      left: 50%;
      transform: translate(-50%, -140%);
      width: min(460px, calc(100% - 24px));

      z-index: 999999;

      display: flex;
      align-items: center;
      gap: 13px;

      padding: 12px 13px 12px 12px;

      background: rgba(255,255,255,.96);
      color: #111;

      border: 1px solid rgba(0,0,0,.08);
      border-radius: 17px;

      box-shadow:
        0 12px 35px rgba(0,0,0,.13),
        0 2px 8px rgba(0,0,0,.06);

      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);

      font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      opacity: 0;

      transition:
        transform .45s cubic-bezier(.2,.8,.2,1),
        opacity .35s ease;
    }

    #pwa-install-notice.show {
      transform: translate(-50%, 0);
      opacity: 1;
    }

    #pwa-install-icon {
      width: 43px;
      height: 43px;

      flex-shrink: 0;

      display: grid;
      place-items: center;

      border-radius: 12px;

      background: #111;
      color: white;

      font-size: 21px;
    }

    #pwa-install-content {
      min-width: 0;
      flex: 1;
    }

    #pwa-install-title {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: -.15px;
      margin-bottom: 2px;
    }

    #pwa-install-description {
      font-size: 11.5px;
      color: #707070;
      line-height: 1.35;
    }

    #pwa-install-action {
      border: 0;
      outline: 0;

      padding: 9px 13px;

      border-radius: 11px;

      background: #111;
      color: white;

      font-size: 12px;
      font-weight: 700;

      cursor: pointer;

      transition:
        transform .15s ease,
        opacity .15s ease;
    }

    #pwa-install-action:active {
      transform: scale(.94);
    }

    #pwa-install-action:hover {
      opacity: .85;
    }

    #pwa-install-close {
      width: 27px;
      height: 27px;

      flex-shrink: 0;

      border: 0;
      border-radius: 50%;

      background: #f1f1f1;
      color: #666;

      font-size: 17px;
      line-height: 1;

      cursor: pointer;
    }

    @media (max-width: 380px) {

      #pwa-install-notice {
        gap: 9px;
        padding: 10px;
      }

      #pwa-install-icon {
        width: 39px;
        height: 39px;
      }

      #pwa-install-description {
        display: none;
      }

      #pwa-install-action {
        padding: 8px 11px;
      }
    }
  `;

  document.head.appendChild(style);


  function createNotice() {

    if (document.getElementById("pwa-install-notice")) {
      return;
    }

    const notice = document.createElement("div");

    notice.id = "pwa-install-notice";

    notice.innerHTML = `
      <div id="pwa-install-icon">
        ↓
      </div>

      <div id="pwa-install-content">
        <div id="pwa-install-title">
          Install this app
        </div>

        <div id="pwa-install-description">
          Add it to your home screen for faster access.
        </div>
      </div>

      <button id="pwa-install-action">
        Install
      </button>

      <button
        id="pwa-install-close"
        aria-label="Close"
      >
        ×
      </button>
    `;

    document.body.appendChild(notice);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        notice.classList.add("show");
      });
    });


    document.getElementById("pwa-install-action")
      .addEventListener("click", async () => {

        if (!deferredPrompt) {
          return;
        }

        deferredPrompt.prompt();

        const result =
          await deferredPrompt.userChoice;

        console.log(
          "PWA install:",
          result.outcome
        );

        deferredPrompt = null;

        hideNotice();
      });


    document.getElementById("pwa-install-close")
      .addEventListener("click", () => {

        hideNotice();

        // Don't show it again during this session
        sessionStorage.setItem(
          "pwa-install-dismissed",
          "true"
        );
      });
  }


  function hideNotice() {

    const notice =
      document.getElementById("pwa-install-notice");

    if (!notice) return;

    notice.classList.remove("show");

    setTimeout(() => {
      notice.remove();
    }, 450);
  }


  window.addEventListener(
    "beforeinstallprompt",
    event => {

      event.preventDefault();

      deferredPrompt = event;

      if (
        sessionStorage.getItem(
          "pwa-install-dismissed"
        )
      ) {
        return;
      }

      createNotice();
    }
  );


  window.addEventListener(
    "appinstalled",
    () => {

      deferredPrompt = null;

      hideNotice();

      console.log(
        "PWA successfully installed"
      );
    }
  );

})();