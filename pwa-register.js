/* Registers full offline preload and displays its completion state. */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator) || window.__sawantwadiPwaStarted) return;
  window.__sawantwadiPwaStarted = true;

  let indicator;
  function showStatus(message, ready, detail) {
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "sawantwadi-offline-status";
      indicator.setAttribute("role", "status");
      indicator.style.cssText = [
        "position:fixed","z-index:2147483647","left:12px","bottom:12px",
        "max-width:calc(100vw - 24px)","padding:9px 13px","border-radius:999px",
        "font:600 12px/1.3 system-ui,-apple-system,sans-serif",
        "background:#171717","color:#fff","box-shadow:0 3px 18px rgba(0,0,0,.2)",
        "letter-spacing:.1px","opacity:0","transform:translateY(6px)",
        "transition:opacity .2s ease,transform .2s ease","pointer-events:none"
      ].join(";");
      document.body.appendChild(indicator);
      requestAnimationFrame(function () {
        indicator.style.opacity = "1";
        indicator.style.transform = "translateY(0)";
      });
    }
    indicator.textContent = message;
    indicator.style.background = ready ? "#176b42" : "#292929";
    indicator.title = detail || message;
  }

  function handleResult(result) {
    if (!result || result.type !== "OFFLINE_PRELOAD_RESULT") return;
    if (result.mode === "on-demand") {
      showStatus("Offline cache ready", true,
        "The main app shell is saved. Other app pages and assets are cached automatically as you visit them, without a large first-install download.");
      return;
    }
    if (result.total > 0 && result.failed === 0 && result.cached === result.total) {
      showStatus("✓ Everything loads offline", true,
        "All " + result.total + " app pages and repository files are cached on this device. External services and live data may still need internet.");
    } else {
      showStatus("Offline setup " + result.cached + "/" + result.total,
        false, (result.failures || []).map(function (x) {
          return x.path + ": " + x.error;
        }).join("\n"));
    }
  }

  navigator.serviceWorker.addEventListener("message", function (event) {
    handleResult(event.data);
  });

  function sendMessage(worker, type) {
    return new Promise(function (resolve) {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(function () {
        channel.port1.close();
        resolve(null);
      }, 10000);
      channel.port1.onmessage = function (event) {
        window.clearTimeout(timeout);
        channel.port1.close();
        resolve(event.data || null);
      };
      worker.postMessage({ type: type }, [channel.port2]);
    });
  }

  async function checkOfflineStatus(registration) {
    const worker = registration.active;
    if (!worker) return;
    showStatus("Checking offline files…", false);
    const result = await sendMessage(worker, "GET_OFFLINE_PRELOAD_STATUS");
    if (!result) {
      showStatus("Offline status unavailable", false,
        "Reload while online to check offline setup.");
      return;
    }
    handleResult(result);

    // Retry only missing files. The service worker skips files already cached,
    // so successful first-install downloads are never fetched a second time.
    if (result.total > 0 && result.failed > 0) {
      showStatus("Finishing offline setup…", false);
      const retryResult = await sendMessage(worker, "RUN_OFFLINE_PRELOAD");
      if (retryResult) handleResult(retryResult);
    }
  }

  function registerWorker() {
    navigator.serviceWorker.register("./service-worker.js?v=5", { scope: "./", updateViaCache: "none" })
      .then(function (registration) {
        return navigator.serviceWorker.ready.then(function () {
          checkOfflineStatus(registration);
        });
      })
      .catch(function (error) {
        showStatus("Offline setup could not start", false, String(error));
        console.warn("[Sawantwadi PWA] Registration failed:", error);
      });
  }

  window.addEventListener("load", function () {
    window.setTimeout(registerWorker, 500);
  }, { once: true });
})();
