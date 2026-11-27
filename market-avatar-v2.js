/* Sho1re1 3D Market Avatar
 * One animated 3D character represents the nearest mapped market/post.
 * It follows the closest post for the active GPS or tap-to-explore origin.
 * Three.js + GLTF are loaded on demand from CDN; the model is not stored in this repo.
 */
(function () {
  'use strict';

  if (window.__sho1re1MarketAvatarInstalled) return;
  window.__sho1re1MarketAvatarInstalled = true;

  var avatarMarker = null;
  var renderer = null;
  var mixer = null;
  var modelRoot = null;
  var animationActions = {};
  var currentAction = null;
  var lastPlaceKey = '';
  var frameId = 0;
  var lastFrameTime = 0;
  var threeReady = false;
  var loadStarted = false;
  var disposed = false;

  var MODEL_URL = 'https://threejs.org/examples/models/gltf/RobotExpressive/RobotExpressive.glb';

  function validPlace(place) {
    if (!place || place.lat == null || place.lng == null ||
        place.lat === '' || place.lng === '') return false;
    var lat = Number(place.lat);
    var lng = Number(place.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) &&
      Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  }

  function nearestPlace() {
    if (!Array.isArray(activePlaces) || !activePlaces.length) return null;

    // nearby-sort.js keeps activePlaces ordered by distance from live GPS
    // or the temporary map-tap origin.
    for (var i = 0; i < activePlaces.length; i++) {
      if (validPlace(activePlaces[i])) return activePlaces[i];
    }
    return null;
  }

  function placeKey(place) {
    return String(place.id != null ? place.id :
      place.link || place.title || (place.lat + ',' + place.lng));
  }

  function createMarker(place) {
    if (!avatarMarker) {
      var icon = L.divIcon({
        className: 'sho1re1-market-avatar-icon',
        html: '<div class="sho1re1-market-avatar-shell"><canvas class="sho1re1-market-avatar-canvas" aria-label="3D market character"></canvas><span class="sho1re1-market-avatar-shadow"></span></div>',
        iconSize: [88, 112],
        iconAnchor: [44, 101]
      });
      avatarMarker = L.marker([Number(place.lat), Number(place.lng)], {
        icon: icon,
        interactive: false,
        keyboard: false,
        zIndexOffset: 1200
      }).addTo(map);
      avatarMarker.getElement()?.classList.add('sho1re1-market-avatar-marker');
      startThree();
    } else {
      avatarMarker.setLatLng([Number(place.lat), Number(place.lng)]);
    }
  }

  function playAction(name, fade) {
    if (!animationActions[name] || currentAction === animationActions[name]) return;
    var next = animationActions[name];
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(fade || 0.18).play();
    if (currentAction) currentAction.fadeOut(fade || 0.18);
    currentAction = next;
  }

  function startThree() {
    if (loadStarted || !avatarMarker) return;
    loadStarted = true;

    // Load renderer and GLTF loader only when the marker is actually needed.
    Promise.all([
      import('https://esm.sh/three@0.160.0'),
      import('https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js')
    ]).then(function (modules) {
      if (disposed || !avatarMarker) return;
      var THREE = modules[0];
      var GLTFLoader = modules[1].GLTFLoader;
      var canvas = avatarMarker.getElement()?.querySelector('.sho1re1-market-avatar-canvas');
      if (!canvas) {
        loadStarted = false;
        return;
      }

      renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power'
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(88, 104, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setClearColor(0x000000, 0);

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(29, 88 / 104, 0.1, 30);
      camera.position.set(0, 1.35, 4.6);
      camera.lookAt(0, 0.95, 0);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x526070, 2.0));
      var keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(2.5, 4, 3);
      scene.add(keyLight);
      var fillLight = new THREE.DirectionalLight(0x9fc8ff, 0.7);
      fillLight.position.set(-3, 2, -2);
      scene.add(fillLight);

      new GLTFLoader().load(MODEL_URL, function (gltf) {
        if (disposed) return;
        modelRoot = gltf.scene;
        var box = new THREE.Box3().setFromObject(modelRoot);
        var size = box.getSize(new THREE.Vector3());
        var center = box.getCenter(new THREE.Vector3());
        var maxDimension = Math.max(size.x, size.y, size.z) || 1;
        modelRoot.scale.setScalar(1.75 / maxDimension);
        modelRoot.position.x = -center.x * modelRoot.scale.x;
        modelRoot.position.y = -box.min.y * modelRoot.scale.y;
        modelRoot.position.z = -center.z * modelRoot.scale.z;
        scene.add(modelRoot);

        mixer = new THREE.AnimationMixer(modelRoot);
        gltf.animations.forEach(function (clip) {
          animationActions[clip.name] = mixer.clipAction(clip);
        });
        playAction(animationActions.Idle ? 'Idle' : Object.keys(animationActions)[0], 0);
        threeReady = true;

        function animate(now) {
          if (disposed || !renderer) return;
          frameId = requestAnimationFrame(animate);
          var delta = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 0;
          lastFrameTime = now;
          if (mixer) mixer.update(delta);
          renderer.render(scene, camera);
        }
        if (!frameId) frameId = requestAnimationFrame(animate);
      }, undefined, function (error) {
        console.warn('[Sho1re1 3D Market] Could not load the CDN character model:', error);
        loadStarted = false;
      });
    }).catch(function (error) {
      console.warn('[Sho1re1 3D Market] Three.js CDN could not load:', error);
      loadStarted = false;
    });
  }

  function refreshAvatar() {
    var place = nearestPlace();
    if (!place || typeof map === 'undefined' || !map || typeof L === 'undefined') return;

    var key = placeKey(place);
    var changed = key !== lastPlaceKey;
    createMarker(place);
    if (changed && threeReady) {
      // A short walk cycle gives the impression that the avatar moved to
      // the newly selected nearest market; return to idle afterwards.
      playAction(animationActions.Walking ? 'Walking' : 'Idle', 0.12);
      window.setTimeout(function () {
        if (threeReady) playAction('Idle', 0.2);
      }, 700);
    }
    lastPlaceKey = key;
  }

  if (!document.getElementById('sho1re1-market-avatar-style')) {
    var style = document.createElement('style');
    style.id = 'sho1re1-market-avatar-style';
    style.textContent = `
      .sho1re1-market-avatar-icon {
        background: transparent !important;
        border: 0 !important;
      }
      .sho1re1-market-avatar-shell {
        position: relative;
        width: 88px;
        height: 112px;
        pointer-events: none;
        filter: drop-shadow(0 5px 7px rgba(0,0,0,.28));
      }
      .sho1re1-market-avatar-canvas {
        position: absolute;
        z-index: 2;
        inset: 0;
        width: 88px;
        height: 104px;
        display: block;
      }
      .sho1re1-market-avatar-shadow {
        position: absolute;
        left: 20px;
        bottom: 5px;
        width: 48px;
        height: 12px;
        border-radius: 50%;
        background: rgba(0,0,0,.28);
        filter: blur(5px);
      }
      @media (prefers-reduced-motion: reduce) {
        .sho1re1-market-avatar-shell { filter: none; }
      }
    `;
    document.head.appendChild(style);
  }

  // Refresh after the app rebuilds/sorts its map and carousel.
  var originalRender = window.renderMapAndCarousel;
  if (typeof originalRender === 'function') {
    window.renderMapAndCarousel = function () {
      var result = originalRender.apply(this, arguments);
      requestAnimationFrame(refreshAvatar);
      return result;
    };
  }

  window.addEventListener('sho1re1:originchange', function () {
    requestAnimationFrame(refreshAvatar);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', refreshAvatar, { once: true });
  } else {
    requestAnimationFrame(refreshAvatar);
  }

  window.Sho1re1MarketAvatar = {
    refresh: refreshAvatar,
    getPlaceKey: function () { return lastPlaceKey; }
  };
})();