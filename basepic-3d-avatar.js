/* Sho1re1 3D map character — Basepic GLB
 * Loads one hosted GLB into a lightweight Leaflet marker.
 * The marker follows the closest valid place to the current GPS/tap origin.
 */
(function () {
  'use strict';
  if (window.__sho1re1BasepicAvatarInstalled) return;
  window.__sho1re1BasepicAvatarInstalled = true;

  var MODEL_URL = 'https://basepic.com/evZ8iy4S/Business_Female_01.glb';
  var THREE_VERSION = '0.160.0';
  var WIDTH = 112;
  var HEIGHT = 132;
  var lastPlaceKey = '';
  var marker = null;
  var renderer = null;
  var mixer = null;
  var modelRoot = null;
  var scene = null;
  var camera = null;
  var clock = null;
  var raf = 0;
  var lastFrame = 0;
  var failed = false;

  function validPlace(p) {
    if (!p || p.lat == null || p.lng == null || p.lat === '' || p.lng === '') return false;
    var lat = Number(p.lat), lng = Number(p.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) &&
      Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  }

  function getOrigin() {
    try {
      if (window.Sho1re1NearbySort && window.Sho1re1NearbySort.getOrigin) {
        var o = window.Sho1re1NearbySort.getOrigin();
        if (o && Number.isFinite(Number(o.latitude)) && Number.isFinite(Number(o.longitude))) {
          return { lat: Number(o.latitude), lng: Number(o.longitude) };
        }
      }
    } catch (_) {}
    return null;
  }

  function distanceKm(a, b) {
    var rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad;
    var dLng = (b.lng - a.lng) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function nearestPlace() {
    if (typeof activePlaces === 'undefined' || !Array.isArray(activePlaces)) return null;
    var origin = getOrigin();
    if (!origin) {
      try {
        if (typeof map !== 'undefined' && map) {
          var c = map.getCenter();
          origin = { lat: c.lat, lng: c.lng };
        }
      } catch (_) {}
    }
    if (!origin) return null;
    var best = null, bestDistance = Infinity;
    activePlaces.forEach(function (p) {
      if (!validPlace(p)) return;
      var d = distanceKm(origin, { lat: Number(p.lat), lng: Number(p.lng) });
      if (d < bestDistance) { bestDistance = d; best = p; }
    });
    return best;
  }

  function moveToNearest() {
    if (!marker) return;
    var p = nearestPlace();
    if (!p) {
      // Keep a visible fallback marker while places/GPS are still loading.
      try {
        if (typeof map !== 'undefined' && map && marker.getOpacity() === 0) {
          marker.setLatLng(map.getCenter());
          marker.setOpacity(1);
        }
      } catch (_) {}
      return;
    }
    var key = String(p.id != null ? p.id : p.link || p.title || p.lat + ',' + p.lng);
    if (key === lastPlaceKey) {
      if (marker.getOpacity() !== 1) marker.setOpacity(1);
      return;
    }
    lastPlaceKey = key;
    marker.setLatLng([Number(p.lat), Number(p.lng)]);
    marker.setOpacity(1);
  }

  function makeMarker() {
    if (marker || typeof map === 'undefined' || !map || !window.L) return;
    var holder = document.createElement('div');
    holder.className = 'sho1re1-3d-avatar';
    holder.style.cssText = 'position:relative;width:' + WIDTH + 'px;height:' + HEIGHT +
      'px;pointer-events:none;overflow:visible;filter:drop-shadow(0 7px 8px rgba(0,0,0,.28));';
    var fallback = document.createElement('div');
    fallback.style.cssText = 'position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;';
    fallback.innerHTML = '<svg viewBox="0 0 112 132" width="112" height="132" aria-hidden="true"><ellipse cx="56" cy="119" rx="22" ry="6" fill="#000" opacity=".22"/><circle cx="56" cy="29" r="15" fill="#f0c6a4" stroke="#fff" stroke-width="2"/><path d="M41 28c0-14 8-21 17-21 12 0 18 9 16 22-5-5-9-11-11-16-4 8-11 13-22 15z" fill="#30221e"/><path d="M35 60c4-10 12-15 21-15s18 5 22 15l8 42H27z" fill="#222" stroke="#fff" stroke-width="2"/><path d="M43 99l-3 20h12l4-18 4 18h12l-3-20" fill="#f0c6a4" stroke="#fff" stroke-width="2"/><path d="M35 64l-12 30 8 4 16-25M77 64l12 30-8 4-16-25" fill="none" stroke="#f0c6a4" stroke-width="9" stroke-linecap="round"/></svg>';
    holder.appendChild(fallback);
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(WIDTH * Math.min(window.devicePixelRatio || 1, 1.5));
    canvas.height = Math.round(HEIGHT * Math.min(window.devicePixelRatio || 1, 1.5));
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:none;background:transparent;';
    holder.appendChild(canvas);
    var icon = L.divIcon({
      className: 'sho1re1-3d-avatar-icon',
      html: holder,
      iconSize: [WIDTH, HEIGHT],
      iconAnchor: [WIDTH / 2, HEIGHT - 8]
    });
    marker = L.marker([15.9041, 73.8219], {
      icon: icon, interactive: false, keyboard: false,
      zIndexOffset: 1800, opacity: 1
    }).addTo(map);
    window.__sho1re1AvatarCanvas = canvas;
  }

  function startRenderLoop(THREE) {
    if (raf) cancelAnimationFrame(raf);
    clock = new THREE.Clock();
    function render(now) {
      raf = requestAnimationFrame(render);
      if (document.hidden || !renderer || !scene || !camera) return;
      if (now - lastFrame < 33) return; // cap at ~30fps for mobile
      lastFrame = now;
      var delta = Math.min(clock.getDelta(), 0.05);
      if (mixer) mixer.update(delta);
      else if (modelRoot) {
        modelRoot.position.y = Math.sin(now * 0.0022) * 0.018;
        modelRoot.rotation.y = Math.sin(now * 0.0007) * 0.045;
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(render);
  }

  async function loadModel() {
    try {
      makeMarker();
      if (!marker || !window.__sho1re1AvatarCanvas) return;
      var THREE = await import('https://esm.sh/three@' + THREE_VERSION);
      var GLTFLoaderModule = await import('https://esm.sh/three@' + THREE_VERSION + '/examples/jsm/loaders/GLTFLoader.js');
      var canvas = window.__sho1re1AvatarCanvas;
      canvas.style.display = 'block';
      var fallback = canvas.parentNode.querySelector('div');
      if (fallback) fallback.style.display = 'none';

      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: false,
        powerPreference: 'low-power', premultipliedAlpha: true
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(WIDTH, HEIGHT, false);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(30, WIDTH / HEIGHT, 0.01, 100);
      camera.position.set(0, 1.15, 3.4);
      camera.lookAt(0, 0.95, 0);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x777777, 2.0));
      var keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(2, 4, 3);
      scene.add(keyLight);

      var loader = new GLTFLoaderModule.GLTFLoader();
      var gltf = await loader.loadAsync(MODEL_URL);
      modelRoot = gltf.scene;
      var bounds = new THREE.Box3().setFromObject(modelRoot);
      var size = bounds.getSize(new THREE.Vector3());
      var center = bounds.getCenter(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z) || 1;
      modelRoot.scale.setScalar(1.75 / maxDim);
      modelRoot.position.x = -center.x * modelRoot.scale.x;
      modelRoot.position.y = -bounds.min.y * modelRoot.scale.y;
      modelRoot.position.z = -center.z * modelRoot.scale.z;
      modelRoot.rotation.y = Math.PI;
      scene.add(modelRoot);

      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(modelRoot);
        var clip = THREE.AnimationClip.findByName(gltf.animations, 'walk') ||
          gltf.animations.find(function (a) { return /walk|idle/i.test(a.name); }) ||
          gltf.animations[0];
        mixer.clipAction(clip).play();
      }
      moveToNearest();
      startRenderLoop(THREE);
      console.info('[Sho1re1 3D Avatar] Basepic model loaded; animations:', gltf.animations.length);
    } catch (error) {
      failed = true;
      console.warn('[Sho1re1 3D Avatar] GLB could not load; keeping the visible fallback character. Check URL access/CORS and model validity:', error);
    }
  }

  function boot() {
    if (failed) return;
    try {
      if (typeof map === 'undefined' || !map || !window.L) {
        setTimeout(boot, 500);
        return;
      }
      makeMarker();
      moveToNearest();
      loadModel();
      window.addEventListener('sho1re1:originchange', moveToNearest);
      map.on('moveend', moveToNearest);
      // Handles filter/search re-renders that replace activePlaces without an origin change.
      setInterval(moveToNearest, 2500);
    } catch (e) {
      console.warn('[Sho1re1 3D Avatar] Setup failed:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) moveToNearest();
  });
})();
