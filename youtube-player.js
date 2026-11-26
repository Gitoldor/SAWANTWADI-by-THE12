/* Sho1re1 YouTube player
 * Loads the official YouTube IFrame Player API only when a video is opened.
 */
(function () {
  "use strict";

  var apiPromise = null;
  var player = null;
  var overlay = null;
  var previewPlayer = null;
  var previewHost = null;

  function getVideoId(value) {
    var raw = String(value || "").trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
    try {
      var url = new URL(raw, window.location.href);
      var host = url.hostname.replace(/^www\\./, "").toLowerCase();
      if (host === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] || "";
      if (host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
        if (url.searchParams.get("v")) return url.searchParams.get("v");
        var parts = url.pathname.split("/").filter(Boolean);
        var marker = parts.findIndex(function (part) {
          return part === "shorts" || part === "embed" || part === "live";
        });
        if (marker >= 0) return parts[marker + 1] || "";
      }
    } catch (_) {}
    return "";
  }

  function loadApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (apiPromise) return apiPromise;
    apiPromise = new Promise(function (resolve, reject) {
      var previous = window.onYouTubeIframeAPIReady;
      var timeout = setTimeout(function () {
        reject(new Error("YouTube player API timed out"));
      }, 15000);
      window.onYouTubeIframeAPIReady = function () {
        clearTimeout(timeout);
        if (typeof previous === "function") {
          try { previous(); } catch (_) {}
        }
        resolve();
      };
      if (!document.querySelector('script[data-sho1re1-youtube-api]')) {
        var script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.async = true;
        script.dataset.sho1re1YoutubeApi = "true";
        script.onerror = function () {
          clearTimeout(timeout);
          reject(new Error("Could not load YouTube player API"));
        };
        document.head.appendChild(script);
      }
    }).catch(function (error) {
      apiPromise = null;
      throw error;
    });
    return apiPromise;
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    var style = document.createElement("style");
    style.textContent = [
      "#sho1re1-youtube-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.92);display:none;align-items:center;justify-content:center;padding:18px;}",
      "#sho1re1-youtube-overlay.is-open{display:flex;}",
      "#sho1re1-youtube-shell{position:relative;width:min(100%,900px);aspect-ratio:16/9;background:#000;border-radius:18px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.55);}",
      "#sho1re1-youtube-shell.is-vertical{width:min(100%,420px);height:min(78vh,740px);aspect-ratio:9/16;}",
      "#sho1re1-youtube-player{width:100%;height:100%;}",
      ".card .sho1re1-card-preview{position:absolute;inset:0;z-index:2;background:#000;overflow:hidden;border-radius:inherit;}",
      ".card .sho1re1-card-preview .sho1re1-inline-youtube{width:100%;height:100%;pointer-events:none;}",
      ".card .sho1re1-card-preview iframe{width:100%;height:100%;object-fit:cover;}",
      "#sho1re1-youtube-close{position:absolute;right:10px;top:10px;z-index:3;width:42px;height:42px;border:0;border-radius:50%;background:rgba(20,20,20,.8);color:#fff;font-size:27px;line-height:1;cursor:pointer;}",
      "@media(max-width:600px){#sho1re1-youtube-overlay{padding:10px;}#sho1re1-youtube-shell{width:100%;}#sho1re1-youtube-shell.is-vertical{width:min(88vw,420px);height:min(82vh,740px);}}"
    ].join("");
    document.head.appendChild(style);
    overlay = document.createElement("div");
    overlay.id = "sho1re1-youtube-overlay";
    overlay.innerHTML = '<div id="sho1re1-youtube-shell"><button id="sho1re1-youtube-close" type="button" aria-label="Close video">×</button><div id="sho1re1-youtube-player"></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay || event.target.id === "sho1re1-youtube-close") close();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") close();
    });
    return overlay;
  }

  function close() {
    if (player && typeof player.destroy === "function") {
      try { player.destroy(); } catch (_) {}
    }
    player = null;
    if (overlay) {
      overlay.classList.remove("is-open");
      var shell = overlay.querySelector("#sho1re1-youtube-shell");
      if (shell) shell.classList.remove("is-vertical");
      var target = overlay.querySelector("#sho1re1-youtube-player");
      if (target) target.innerHTML = "";
    }
  }


  function stopPreview() {
    if (previewPlayer && typeof previewPlayer.destroy === "function") {
      try { previewPlayer.destroy(); } catch (_) {}
    }
    previewPlayer = null;
    if (previewHost) {
      previewHost.innerHTML = "";
      previewHost.classList.remove("is-playing");
    }
    previewHost = null;
  }

  window.Sho1re1StopYouTubePreview = stopPreview;

  window.Sho1re1PreviewYouTube = function (url, host) {
    var videoId = getVideoId(url);
    if (!videoId || !host) return false;
    if (previewHost === host && previewPlayer) return true;
    stopPreview();
    previewHost = host;
    host.innerHTML = '<div class="sho1re1-inline-youtube"></div>';
    host.classList.add("is-playing");
    var target = host.firstElementChild;
    loadApi().then(function () {
      if (previewHost !== host || !host.isConnected) return;
      previewPlayer = new window.YT.Player(target, {
        videoId: videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          mute: 1
        },
        events: {
          onReady: function (event) {
            event.target.mute();
            event.target.playVideo();
          }
        }
      });
    }).catch(function (error) {
      console.warn("[Sho1re1 YouTube] Muted preview could not start:", error);
    });
    return true;
  };

  window.Sho1re1PlayYouTube = function (url, title, contentKind) {
    stopPreview();
    var videoId = getVideoId(url);
    if (!videoId) {
      console.warn("[Sho1re1 YouTube] Invalid video URL:", url);
      return false;
    }
    var root = ensureOverlay();
    var shell = root.querySelector("#sho1re1-youtube-shell");
    var target = root.querySelector("#sho1re1-youtube-player");
    shell.classList.toggle("is-vertical", contentKind === "reel");
    root.classList.add("is-open");
    target.innerHTML = "";
    loadApi().then(function () {
      if (!root.classList.contains("is-open")) return;
      player = new window.YT.Player(target, {
        videoId: videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: function (event) { event.target.playVideo(); },
          onError: function (event) {
            console.warn("[Sho1re1 YouTube] Playback error:", event.data);
          }
        }
      });
    }).catch(function (error) {
      console.error("[Sho1re1 YouTube] Player could not start:", error);
    });
    return true;
  };

  // Stop background playback when the app is hidden to save CPU, battery and data.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopPreview();
      if (player && typeof player.pauseVideo === "function") {
        try { player.pauseVideo(); } catch (_) {}
      }
    }
  });

  window.Sho1re1CloseYouTube = close;
})();