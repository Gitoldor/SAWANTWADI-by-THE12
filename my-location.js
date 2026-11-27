
(() => {
  'use strict';

  // Shared-coordinate links must not trigger GPS or recentering.
  if (window.Sho1re1SharedLocationActive) return;

  let mapInstance;

  try {
    mapInstance = map;
  } catch (e) {
    console.error('Sho1re1: Map not found');
    return;
  }

  if (!mapInstance || !window.L) return;

  let userLocation = null;
  let userMarker = null;
  let accuracyCircle = null;

  const THRESHOLD = 40;
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cameraMotion(duration) {
    return {
      animate: !reduceMotion,
      duration: duration,
      easeLinearity: 0.2
    };
  }

  // Create button
  const button = document.createElement('button');

  button.type = 'button';
  button.innerHTML = `
    <svg width="19" height="19" viewBox="0 0 24 24"
         fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round"
         stroke-linejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
    </svg>
    <span>Recenter</span>
  `;

  button.style.cssText = `
    position: absolute !important;
    right: 140px !important;
    bottom: 275px !important;
    z-index: 999999 !important;

    display: flex;
    align-items: center;
    justify-content: center;
    gap: 9px;

    padding: 12px 17px;
    border: 1px solid #ddd;
    border-radius: 30px;
    background: white;
    color: #171717;

    font: 600 13px Arial, sans-serif;
    box-shadow: 0 3px 15px rgba(0,0,0,.22);

    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(8px);
    transition: .2s ease;
    cursor: pointer;
  `;

  const mapContainer = mapInstance.getContainer();

  mapContainer.appendChild(button);

  // Show/hide button
  function updateButton() {
    if (!userLocation) return;

    const distance = mapInstance.distance(
      mapInstance.getCenter(),
      userLocation
    );

    const exploringSelectedPoint = !!(
      window.Sho1re1NearbySort &&
      window.Sho1re1NearbySort.getOriginMode() === 'manual'
    );
    const shouldShow = distance > THRESHOLD || exploringSelectedPoint;

    button.style.opacity = shouldShow ? '1' : '0';
    button.style.visibility = shouldShow ? 'visible' : 'hidden';
    button.style.pointerEvents = shouldShow ? 'auto' : 'none';
    button.style.transform = shouldShow
      ? 'translateY(0)'
      : 'translateY(8px)';
  }

  // Update location marker
  function setUserLocation(position) {
    userLocation = L.latLng(
      position.coords.latitude,
      position.coords.longitude
    );

    // Keep nearby sorting synced with the real GPS fix without changing a
    // manually selected map-search point.
    if (window.Sho1re1NearbySort) {
      window.Sho1re1NearbySort.updateGps(
        position.coords.latitude,
        position.coords.longitude
      );
    }

    const accuracy = position.coords.accuracy || 30;

    if (!userMarker) {
      userMarker = L.marker(userLocation, {
        icon: window.Sho1re1MarkerCustomizer ? window.Sho1re1MarkerCustomizer.createUserIcon() : L.divIcon({
          className: '',
          html: `
            <div style="
              width:18px;
              height:18px;
              background:#2588ff;
              border:3px solid white;
              border-radius:50%;
              box-shadow:0 0 0 7px #2588ff30, 0 2px 8px #0005;
            "></div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        }),
        zIndexOffset: 1000
      }).addTo(mapInstance);
      if (window.Sho1re1MarkerCustomizer) window.Sho1re1MarkerCustomizer.registerUserMarker(userMarker);
      userMarker.on('click', function (event) {
        if (L.DomEvent) L.DomEvent.stopPropagation(event);
        if (window.Sho1re1MarkerCustomizer) window.Sho1re1MarkerCustomizer.open('user');
      });

      accuracyCircle = L.circle(userLocation, {
        radius: accuracy,
        color: '#2588ff',
        weight: 1,
        fillColor: '#2588ff',
        fillOpacity: 0.10
      }).addTo(mapInstance);

    } else {
      userMarker.setLatLng(userLocation);
      accuracyCircle.setLatLng(userLocation);
      accuracyCircle.setRadius(accuracy);
    }

    updateButton();
  }

  // Recenter action
  function recenter() {
    if (!navigator.geolocation) return;

    button.disabled = true;
    button.querySelector('span').textContent = 'Locating...';

    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation(position);

        // Recenter always exits tap-to-explore mode and restores GPS sorting.
        if (window.Sho1re1NearbySort) window.Sho1re1NearbySort.resetToGps();

        mapInstance.flyTo(
          userLocation,
          Math.max(mapInstance.getZoom(), 16),
          cameraMotion(1.25)
        );

        button.disabled = false;
        button.querySelector('span').textContent = 'Recenter';

        setTimeout(updateButton, 1300);
      },

      error => {
        console.warn('Location error:', error.message);

        if (userLocation) {
          if (window.Sho1re1NearbySort) window.Sho1re1NearbySort.resetToGps();
          mapInstance.flyTo(
            userLocation,
            Math.max(mapInstance.getZoom(), 16),
            cameraMotion(1.25)
          );
        }

        button.disabled = false;
        button.querySelector('span').textContent = 'Recenter';
      },

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000
      }
    );
  }

  button.addEventListener('click', recenter);

  // Keep Recenter visible while a temporary map point is selected, even
  // when that point happens to be within 40m of the real GPS fix.
  window.addEventListener('sho1re1:originchange', updateButton);

  // Detect map movement
  mapInstance.on('move', updateButton);
  mapInstance.on('moveend', updateButton);
  mapInstance.on('dragend', updateButton);

  // Initial GPS location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation(position);

        mapInstance.flyTo(
          userLocation,
          Math.max(mapInstance.getZoom(), 16),
          {
            animate: true,
            duration: 1.2
          }
        );

        setTimeout(updateButton, 1300);
      },

      error => console.warn('GPS:', error.message),

      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 30000
      }
    );
  }

  window.Sho1re1LocateMe = recenter;

})();
