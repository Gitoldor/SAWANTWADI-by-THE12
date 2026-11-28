/* Sho1re1 MAX road basemap — OpenFreeMap vector tiles rendered inside the existing Leaflet map.
   This does not replace Leaflet, move its markers, or touch the GPS marker. */
(function (root) {
  "use strict";
  if (root.Sho1re1RoadMap) return;
  const STYLE = "https://tiles.openfreemap.org/styles/liberty";
  const CSS = "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.css";
  const MAPLIBRE = "https://unpkg.com/maplibre-gl@5/dist/maplibre-gl.js";
  const BRIDGE = "https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.1.4/leaflet-maplibre-gl.js";
  let layer = null, loading = null, enabled = false, preloadPromise = null;

  function loadCss() {
    if (document.querySelector('link[data-sho-road-css]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = CSS; link.dataset.shoRoadCss = "1";
    document.head.appendChild(link);
  }
  function script(src, test) {
    if (test()) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let tag = document.querySelector('script[data-sho-road-src="' + src + '"]');
      if (tag) {
        if (tag.dataset.loaded === "1") return resolve();
        tag.addEventListener("load", resolve, { once: true });
        tag.addEventListener("error", () => reject(new Error("Could not load map library")), { once: true });
        return;
      }
      tag = document.createElement("script");
      tag.src = src; tag.async = true; tag.dataset.shoRoadSrc = src;
      tag.onload = () => { tag.dataset.loaded = "1"; resolve(); };
      tag.onerror = () => reject(new Error("Could not load map library"));
      document.head.appendChild(tag);
    });
  }
  function preload() {
    if (root.maplibregl && root.MaplibreGLLeaflet && root.MaplibreGLLeaflet.maplibreGL) return Promise.resolve(true);
    if (preloadPromise) return preloadPromise;
    loadCss();
    preloadPromise = (async () => {
      // Start both library downloads before MAX Drive is opened.
      await script(MAPLIBRE, () => !!root.maplibregl);
      await script(BRIDGE, () => !!(root.MaplibreGLLeaflet && (root.MaplibreGLLeaflet.maplibreGL || root.MaplibreGLLeaflet.default)));
      if (!root.L.maplibreGL && root.MaplibreGLLeaflet) {
        root.L.maplibreGL = root.MaplibreGLLeaflet.maplibreGL || root.MaplibreGLLeaflet.default;
      }
      if (typeof root.L.maplibreGL !== "function") throw new Error("Leaflet/MapLibre bridge factory missing");
      return true;
    })().catch(error => { preloadPromise = null; throw error; });
    return preloadPromise;
  }
  async function enable(map) {
    enabled = true;
    if (!map || !root.L) throw new Error("Leaflet map is not ready");
    if (layer) { if (!map.hasLayer(layer)) layer.addTo(map); return layer; }
    if (loading) return loading;
    loading = (async () => {
      await preload();
      if (!enabled) return null;
      layer = root.L.maplibreGL({ style: STYLE, interactive: false, attribution: "© OpenStreetMap contributors · OpenFreeMap" });
      layer.addTo(map);
      return layer;
    })().finally(() => { loading = null; });
    return loading;
  }
  function setCamera(bearing, pitch) {
    if (!layer || !layer.getMaplibreMap) return false;
    const gl = layer.getMaplibreMap();
    if (!gl) return false;
    gl.setBearing(((Number(bearing) % 360) + 360) % 360);
    gl.setPitch(Math.max(0, Math.min(60, Number(pitch) || 0)));
    return true;
  }
  function resetCamera() { return setCamera(0, 0); }
  function disable(map) {
    enabled = false;
    if (map && layer && map.hasLayer(layer)) map.removeLayer(layer);
  }
  root.Sho1re1RoadMap = { preload, enable, disable, setCamera, resetCamera, style: STYLE };
})(window);