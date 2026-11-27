/* Sho1re1 3D Market Avatar v3
 * Explicitly sizes the Leaflet icon before initializing WebGL.
 * The renderer starts only after Leaflet has attached the marker to its pane.
 */
(function () {
  'use strict';
  if (window.__sho1re1MarketAvatarV3) return;
  window.__sho1re1MarketAvatarV3 = true;

  var marker = null, renderer = null, mixer = null, actions = {};
  var currentAction = null, lastKey = '', loading = false, ready = false;
  var frame = 0, lastFrame = 0;
  var MODEL_URL = 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb';

  function valid(p) {
    if (!p || p.lat == null || p.lng == null || p.lat === '' || p.lng === '') return false;
    var lat = Number(p.lat), lng = Number(p.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  }
  function nearest() {
    if (typeof activePlaces === 'undefined' || !Array.isArray(activePlaces)) return null;
    for (var i = 0; i < activePlaces.length; i++) if (valid(activePlaces[i])) return activePlaces[i];
    return null;
  }
  function keyOf(p) { return String(p.id != null ? p.id : p.link || p.title || p.lat + ',' + p.lng); }

  function sizeMarker() {
    if (!marker) return null;
    var el = marker.getElement();
    if (!el) return null;
    el.style.setProperty('width', '88px', 'important');
    el.style.setProperty('height', '112px', 'important');
    el.style.setProperty('margin-left', '-44px', 'important');
    el.style.setProperty('margin-top', '-101px', 'important');
    el.style.setProperty('background', 'transparent', 'important');
    el.style.setProperty('border', '0', 'important');
    el.style.setProperty('overflow', 'visible', 'important');
    el.style.setProperty('z-index', '1200', 'important');
    var shell = el.querySelector('.sho1re1-market-avatar-shell');
    var canvas = el.querySelector('.sho1re1-market-avatar-canvas');
    if (shell) {
      shell.style.cssText = 'position:relative!important;display:block!important;width:88px!important;height:112px!important;min-width:88px!important;min-height:112px!important;overflow:visible!important;pointer-events:none!important;filter:drop-shadow(0 5px 7px rgba(0,0,0,.28))';
    }
    if (canvas) {
      canvas.width = 176;
      canvas.height = 208;
      canvas.style.cssText = 'position:absolute!important;display:block!important;left:0!important;top:0!important;width:88px!important;height:104px!important;min-width:88px!important;min-height:104px!important;z-index:2!important';
    }
    return canvas;
  }

  function ensureMarker(p) {
    if (!marker) {
      var icon = L.divIcon({
        className: 'sho1re1-market-avatar-icon',
        html: '<div class="sho1re1-market-avatar-shell" style="width:88px;height:112px;display:block;position:relative"><canvas class="sho1re1-market-avatar-canvas" width="176" height="208" aria-label="3D market character" style="display:block;width:88px;height:104px"></canvas><span class="sho1re1-market-avatar-shadow" style="position:absolute;left:20px;bottom:5px;width:48px;height:12px;border-radius:50%;background:rgba(0,0,0,.28);filter:blur(5px)"></span></div>',
        iconSize: [88, 112],
        iconAnchor: [44, 101]
      });
      marker = L.marker([Number(p.lat), Number(p.lng)], {
        icon: icon, interactive: false, keyboard: false, zIndexOffset: 1200
      }).addTo(map);
      marker.on('add', function () {
        sizeMarker();
        window.setTimeout(startThree, 60);
      });
      sizeMarker();
      window.setTimeout(startThree, 100);
    } else {
      marker.setLatLng([Number(p.lat), Number(p.lng)]);
      sizeMarker();
    }
  }

  function play(name, fade) {
    var next = actions[name];
    if (!next || currentAction === next) return;
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(fade || 0.15).play();
    if (currentAction) currentAction.fadeOut(fade || 0.15);
    currentAction = next;
  }

  function startThree() {
    if (loading || ready || !marker || typeof map === 'undefined' || !map) return;
    var canvas = sizeMarker();
    if (!canvas || !canvas.isConnected) return;
    loading = true;

    Promise.all([
      import('https://esm.sh/three@0.160.0?bundle'),
      import('https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js?external=three')
    ]).then(function (mods) {
      var THREE = mods[0], GLTFLoader = mods[1].GLTFLoader;
      // Leaflet may recreate the icon during a zoom; always reacquire its canvas.
      canvas = sizeMarker();
      if (!canvas || !canvas.isConnected) throw new Error('Avatar canvas is not attached to the map');
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(88, 104, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(29, 88 / 104, 0.1, 30);
      camera.position.set(0, 1.35, 4.6);
      camera.lookAt(0, 0.95, 0);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x526070, 2));
      var key = new THREE.DirectionalLight(0xffffff, 2.2);
      key.position.set(2.5, 4, 3);
      scene.add(key);
      var fill = new THREE.DirectionalLight(0x9fc8ff, .7);
      fill.position.set(-3, 2, -2);
      scene.add(fill);

      new GLTFLoader().load(MODEL_URL, function (gltf) {
        var root = gltf.scene;
        var bounds = new THREE.Box3().setFromObject(root);
        var size = bounds.getSize(new THREE.Vector3());
        var center = bounds.getCenter(new THREE.Vector3());
        var scale = 1.75 / (Math.max(size.x, size.y, size.z) || 1);
        root.scale.setScalar(scale);
        root.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
        scene.add(root);
        mixer = new THREE.AnimationMixer(root);
        gltf.animations.forEach(function (clip) { actions[clip.name] = mixer.clipAction(clip); });
        play(actions.Idle ? 'Idle' : Object.keys(actions)[0], 0);
        ready = true;
        loading = false;
        function animate(now) {
          if (!renderer) return;
          frame = requestAnimationFrame(animate);
          var delta = lastFrame ? Math.min((now - lastFrame) / 1000, .05) : 0;
          lastFrame = now;
          if (mixer) mixer.update(delta);
          renderer.render(scene, camera);
        }
        if (!frame) frame = requestAnimationFrame(animate);
      }, undefined, function (err) {
        console.warn('[Sho1re1 Avatar] Robot GLB load failed:', err);
        loading = false;
      });
    }).catch(function (err) {
      console.warn('[Sho1re1 Avatar] Three.js/WebGL initialization failed:', err);
      loading = false;
    });
  }

  function refresh() {
    var p = nearest();
    if (!p || typeof map === 'undefined' || !map || typeof L === 'undefined') return;
    var key = keyOf(p), changed = key !== lastKey;
    ensureMarker(p);
    if (changed && ready) {
      play(actions.Walking ? 'Walking' : 'Idle', .12);
      window.setTimeout(function () { if (ready) play('Idle', .2); }, 700);
    }
    lastKey = key;
  }

  window.Sho1re1MarketAvatar = { refresh: refresh, getPlaceKey: function () { return lastKey; }, isReady: function () { return ready; } };
  window.addEventListener('sho1re1:originchange', function () { requestAnimationFrame(refresh); });

  // Hook both the global renderer and delayed data refreshes.
  var original = window.renderMapAndCarousel;
  if (typeof original === 'function') {
    window.renderMapAndCarousel = function () {
      var result = original.apply(this, arguments);
      requestAnimationFrame(refresh);
      return result;
    };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refresh, { once: true });
  else requestAnimationFrame(refresh);
  window.setInterval(function () {
    if (!marker && typeof activePlaces !== 'undefined' && Array.isArray(activePlaces) && activePlaces.length) refresh();
    if (marker && !ready && !loading) startThree();
    if (marker) sizeMarker();
  }, 1800);
})();