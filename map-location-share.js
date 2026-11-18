/* =========================================================
   SHO1RE1 MAP LOCATION SHARE — SEPARATE PLUGIN
   3-second press-and-hold copies a coordinate share link.
   Incoming links use ?loc=latitude,longitude
========================================================= */
(function () {
  'use strict';
  if (!window.L || !L.Map) return;

  // Mark valid shared-coordinate sessions before the live-location plugin loads.
  var sharedQuery = new URLSearchParams(location.search).get('loc');
  if (sharedQuery) {
    var sharedPair = sharedQuery.split(',');
    var sharedLat = Number(sharedPair[0]), sharedLng = Number(sharedPair[1]);
    window.Sho1re1SharedLocationActive =
      Number.isFinite(sharedLat) && Number.isFinite(sharedLng) &&
      Math.abs(sharedLat) <= 90 && Math.abs(sharedLng) <= 180;
  }

  var HOLD_MS = 3000, MOVE_LIMIT = 12, EXIT_DISTANCE_METERS = 300, SHARED_SETTLE_MS = 1600;
  var mapRef = null, timer = null, start = null, didShare = false, marker = null, toastTimer, sharedCenter = null, boundaryCheck = null, sharedOpenedAt = 0;

  // Hook Leaflet's map creation; no changes to map's original code.
  L.Map.addInitHook(function () {
    if (mapRef) return;
    mapRef = this;
    var map = this;
    map.whenReady(function () {
      openIncoming(map);
      bindHold(map);
    });
  });

  function injectSharedMarkerStyle() {
    if (document.getElementById('s1-shared-marker-style')) return;
    var style = document.createElement('style');
    style.id = 's1-shared-marker-style';
    style.textContent = `
      .s1-shared-marker-root { position:relative; width:56px; height:66px; display:flex; align-items:flex-start; justify-content:center; }
      .s1-shared-marker-pulse { position:absolute; top:12px; left:50%; width:34px; height:34px; margin-left:-17px; border-radius:50%; background:rgba(255,255,255,.32); border:1px solid rgba(0,0,0,.18); animation:s1SharedPulse 2.2s ease-out infinite; }
      .s1-shared-marker-pulse.pulse2 { animation-delay:1.1s; }
      .s1-shared-marker-core { position:absolute; top:12px; left:50%; width:34px; height:34px; margin-left:-17px; border-radius:50%; background:rgba(255,255,255,.96); border:2px solid #101010; box-shadow:0 5px 16px rgba(0,0,0,.32), inset 0 0 0 4px rgba(0,0,0,.06); display:flex; align-items:center; justify-content:center; }
      .s1-shared-marker-core:after { content:''; width:9px; height:9px; border-radius:50%; background:#111; box-shadow:0 0 0 3px rgba(0,0,0,.08); }
      .s1-shared-marker-label { position:absolute; top:48px; left:50%; transform:translateX(-50%); white-space:nowrap; padding:5px 9px; border-radius:999px; background:rgba(14,14,14,.92); color:#fff; font:700 9px/1 Inter,system-ui,sans-serif; letter-spacing:1.15px; box-shadow:0 4px 12px rgba(0,0,0,.18); border:1px solid rgba(255,255,255,.22); }
      @keyframes s1SharedPulse { 0% { transform:scale(.65); opacity:.65; } 100% { transform:scale(2.1); opacity:0; } }
      .s1-shared-popup .leaflet-popup-content-wrapper { border-radius:14px; padding:2px; background:#111; color:#fff; box-shadow:0 12px 28px rgba(0,0,0,.3); }
      .s1-shared-popup .leaflet-popup-content { margin:10px 13px; font:600 11px/1.45 Inter,system-ui,sans-serif; }
      .s1-shared-popup .leaflet-popup-tip { background:#111; }
      .s1-shared-popup .leaflet-popup-close-button { color:#fff !important; }
    `;
    document.head.appendChild(style);
  }

  function openIncoming(map) {
    var raw = new URLSearchParams(location.search).get('loc');
    if (!raw) return;
    var pair = raw.split(',');
    var lat = Number(pair[0]), lng = Number(pair[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
    sharedCenter = L.latLng(lat, lng);
    sharedOpenedAt = Date.now();
    map.flyTo([lat, lng], Math.max(map.getZoom(), 17), { animate: true, duration: 1 });
    // Only check after a user drag; initial flyTo/animation movements are ignored.
    boundaryCheck = function () {
      if (Date.now() - sharedOpenedAt < SHARED_SETTLE_MS) return;
      if (!sharedCenter || map.distance(map.getCenter(), sharedCenter) <= EXIT_DISTANCE_METERS) return;
      map.off('dragend', boundaryCheck);
      window.Sho1re1SharedLocationActive = false;
      sharedCenter = null;
      // Remove the shared-link marker and clean the URL so the page is back to normal.
      if (marker) { map.removeLayer(marker); marker = null; }
      var cleanUrl = new URL(location.href);
      cleanUrl.searchParams.delete('loc');
      history.replaceState(null, '', cleanUrl.toString());
      // The location plugin initially skipped itself while shared mode was active.
      var gpsScript = document.createElement('script');
      gpsScript.src = './my-location.js';
      document.body.appendChild(gpsScript);
    };
    map.on('dragend', boundaryCheck);
    injectSharedMarkerStyle();
    var sharedIcon = L.divIcon({
      className: 's1-shared-marker-icon',
      html: '<div class="s1-shared-marker-root"><span class="s1-shared-marker-pulse"></span><span class="s1-shared-marker-pulse pulse2"></span><span class="s1-shared-marker-core"></span><span class="s1-shared-marker-label">SHARED SPOT</span></div>',
      iconSize: [56, 66],
      iconAnchor: [28, 30]
    });
    marker = L.marker([lat, lng], { title: 'Shared location', icon: sharedIcon, zIndexOffset: 10000 }).addTo(map);
    marker.bindPopup('<strong>Shared spot</strong><br><small>' + lat.toFixed(6) + ', ' + lng.toFixed(6) + '</small>', { className: 's1-shared-popup', closeButton: true }).openPopup();
  }

  function bindHold(map) {
    var el = map.getContainer();
    el.addEventListener('pointerdown', down, { passive: true });
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerup', cancel, { passive: true });
    el.addEventListener('pointercancel', cancel, { passive: true });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  function down(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest('button,a,input,textarea,select,.leaflet-marker-icon,.leaflet-popup,.card,.carousel')) return;
    cancel();
    start = { x: e.clientX, y: e.clientY };
    didShare = false;
    timer = setTimeout(function () {
      if (!mapRef || !start) return;
      didShare = true;
      var rect = mapRef.getContainer().getBoundingClientRect();
      var p = L.point(start.x - rect.left, start.y - rect.top);
      var latlng = mapRef.containerPointToLatLng(p);
      var u = new URL(location.href);
      u.searchParams.set('loc', latlng.lat.toFixed(6) + ',' + latlng.lng.toFixed(6));
      u.hash = '';
      copy(u.toString()).then(function () { toast('Location link copied'); })
        .catch(function () { toast('Clipboard unavailable'); });
      mapRef.once('click', function (ev) {
        if (didShare && ev.originalEvent) L.DomEvent.stop(ev.originalEvent);
      });
      start = null;
    }, HOLD_MS);
  }

  function move(e) {
    if (start && timer && Math.hypot(e.clientX - start.x, e.clientY - start.y) > MOVE_LIMIT) cancel();
  }

  function cancel() {
    if (timer) { clearTimeout(timer); timer = null; }
    start = null;
  }

  function copy(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(value);
    return new Promise(function (resolve, reject) {
      var input = document.createElement('textarea');
      input.value = value; input.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(input); input.select();
      try { var ok = document.execCommand('copy'); input.remove(); ok ? resolve() : reject(); }
      catch (err) { input.remove(); reject(err); }
    });
  }

  function toast(msg) {
    var el = document.getElementById('s1-map-share-toast');
    if (!el) {
      el = document.createElement('div'); el.id = 's1-map-share-toast';
      el.style.cssText = 'position:fixed;z-index:2147483647;left:50%;bottom:24px;transform:translate(-50%,16px);opacity:0;pointer-events:none;background:rgba(18,18,18,.92);color:#fff;padding:12px 16px;border-radius:999px;font:600 13px Inter,system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.25);transition:opacity .22s,transform .22s;white-space:nowrap;';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(function () { el.style.opacity = '1'; el.style.transform = 'translate(-50%,0)'; });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.style.opacity = '0'; el.style.transform = 'translate(-50%,16px)'; }, 1800);
  }
})();