/* Registers after the existing pages' legacy cache cleanup has completed. */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator) || window.__sawantwadiPwaStarted) return;
  window.__sawantwadiPwaStarted = true;

  function registerWorker() {
    navigator.serviceWorker.register("./service-worker.js", { scope: "./" })
      .then(function (registration) {
        console.info("[Sawantwadi PWA] Offline cache ready:", registration.scope);
      })
      .catch(function (error) {
        console.warn("[Sawantwadi PWA] Registration failed:", error);
      });
  }

  window.addEventListener("load", function () {
    window.setTimeout(registerWorker, 500);
  }, { once: true });
})();
