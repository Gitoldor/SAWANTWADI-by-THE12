/* Sho1re1 Nearby Carousel Sort + Tap-to-Explore Location
 * Keeps the real GPS fix separate from a temporary map-selected search origin.
 * Map taps only change the nearby-post origin; Recenter restores real GPS.
 */
(function () {
  'use strict';

  if (window.__sho1re1NearbySortInstalled) return;
  window.__sho1re1NearbySortInstalled = true;

  var gpsPosition = null;
  var activeOrigin = null;
  var originMode = 'gps';
  var selectedPointMarker = null;
  var nearbyMotionTimer = null;
  var originalRender = window.renderMapAndCarousel;

  if (typeof originalRender !== 'function') {
    console.warn('[Sho1re1 Nearby] Map renderer was not found.');
    return;
  }

  function validPoint(point) {
    return point && Number.isFinite(Number(point.latitude)) &&
      Number.isFinite(Number(point.longitude)) &&
      Math.abs(Number(point.latitude)) <= 90 &&
      Math.abs(Number(point.longitude)) <= 180;
  }

  function distanceInKm(place) {
    if (!activeOrigin || !place) return Infinity;
    var lat = Number(place.lat);
    var lng = Number(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
        place.lat === '' || place.lng === '' ||
        place.lat == null || place.lng == null) return Infinity;

    var toRad = function (value) { return value * Math.PI / 180; };
    var dLat = toRad(lat - activeOrigin.latitude);
    var dLng = toRad(lng - activeOrigin.longitude);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(activeOrigin.latitude)) * Math.cos(toRad(lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function sortActivePlaces() {
    if (!activeOrigin || !Array.isArray(activePlaces)) return;
    var sourceOrder = new Map();
    if (Array.isArray(rawPlaces)) {
      rawPlaces.forEach(function (place, index) {
        if (place && !sourceOrder.has(place)) sourceOrder.set(place, index);
      });
    }

    activePlaces = activePlaces.map(function (place, index) {
      return {
        place: place,
        index: index,
        sourceIndex: sourceOrder.has(place) ? sourceOrder.get(place) : index,
        distance: distanceInKm(place)
      };
    }).sort(function (a, b) {
      return (a.distance - b.distance) ||
        (a.sourceIndex - b.sourceIndex) || (a.index - b.index);
    }).map(function (item) { return item.place; });
  }

  var lastAutoFocusedPlaceId = null;

  // Centre the map on the closest valid post for the current search origin.
  // Stop any previous camera animation first so rapid taps/GPS refreshes do not fight.
  function focusNearestPlace() {
    if (!activeOrigin || !Array.isArray(activePlaces) || !activePlaces.length ||
        typeof map === 'undefined' || !map || typeof map.flyTo !== 'function') return;

    var nearest = null;
    var nearestDistance = Infinity;
    activePlaces.forEach(function (place) {
      if (!place || place.lat == null || place.lng == null ||
          place.lat === '' || place.lng === '') return;
      var lat = Number(place.lat);
      var lng = Number(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) ||
          Math.abs(lat) > 90 || Math.abs(lng) > 180) return;
      var distance = distanceInKm(place);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = place;
      }
    });

    if (!nearest) return;
    var placeId = String(nearest.id != null ? nearest.id : nearest.link || nearest.title || '');
    if (placeId && placeId === lastAutoFocusedPlaceId) return;
    lastAutoFocusedPlaceId = placeId;

    try {
      map.stop();
      map.flyTo([Number(nearest.lat), Number(nearest.lng)],
        Math.max(map.getZoom(), 16), {
          animate: !(window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches),
          duration: 0.8,
          easeLinearity: 0.2
        });
    } catch (error) {
      console.warn('[Sho1re1 Nearby] Could not centre on nearest post:', error);
    }
  }

  function renderSorted() {
    if (typeof window.renderMapAndCarousel !== 'function' ||
        !Array.isArray(activePlaces)) return;

    var carousel = document.getElementById('carousel');
    if (nearbyMotionTimer) window.clearTimeout(nearbyMotionTimer);
    if (carousel) carousel.classList.add('sho1re1-nearby-refresh');

    window.renderMapAndCarousel();

    // Animate only composited properties on the newly ordered cards.
    // The active card keeps its existing spring highlight animation.
    if (carousel) {
      var cards = carousel.querySelectorAll('.card:not(.active)');
      cards.forEach(function (card, index) {
        card.style.setProperty('--nearby-enter-delay', Math.min(index, 8) * 18 + 'ms');
      });
      nearbyMotionTimer = window.setTimeout(function () {
        carousel.classList.remove('sho1re1-nearby-refresh');
        cards.forEach(function (card) {
          card.style.removeProperty('--nearby-enter-delay');
        });
        nearbyMotionTimer = null;
      }, 480);
    }
  }

  // Lightweight motion styling: opacity/transform only, with no animation
  // library and no permanent will-change layer promotion.
  if (!document.getElementById('sho1re1-nearby-motion-style')) {
    var style = document.createElement('style');
    style.id = 'sho1re1-nearby-motion-style';
    style.textContent = `
      @keyframes sho1re1NearbyCardIn {
        from { opacity: 0; transform: translate3d(0, 9px, 0) scale(.985); }
        to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
      }
      #carousel.sho1re1-nearby-refresh .card:not(.active) {
        animation: sho1re1NearbyCardIn 320ms cubic-bezier(.2,.7,.2,1) both;
        animation-delay: var(--nearby-enter-delay, 0ms);
      }
      .sho1re1-origin-marker {
        animation: sho1re1OriginPulse 1.8s ease-out infinite;
        transform-origin: center;
      }
      @keyframes sho1re1OriginPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: .72; }
      }
      @media (prefers-reduced-motion: reduce) {
        #carousel.sho1re1-nearby-refresh .card:not(.active),
        .sho1re1-origin-marker { animation: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  window.renderMapAndCarousel = function () {
    sortActivePlaces();
    return originalRender.apply(this, arguments);
  };

  // Called by my-location.js. A late GPS response must never replace a
  // manually selected map point.
  function notifyOriginChange() {
    try { window.dispatchEvent(new Event('sho1re1:originchange')); } catch (_) {}
  }

  function updateGps(latitude, longitude) {
    var point = { latitude: Number(latitude), longitude: Number(longitude) };
    if (!validPoint(point)) return;
    gpsPosition = point;
    if (originMode !== 'manual') {
      activeOrigin = point;
      originMode = 'gps';
      renderSorted();
      focusNearestPlace();
      notifyOriginChange();    }
  }

  function setManualOrigin(latitude, longitude) {
    var point = { latitude: Number(latitude), longitude: Number(longitude) };
    if (!validPoint(point)) return;
    activeOrigin = point;
    originMode = 'manual';

    // Separate visual marker for the temporary search origin; the real blue
    // GPS marker in my-location.js is never moved or replaced.
    if (selectedPointMarker && map.hasLayer(selectedPointMarker)) {
      map.removeLayer(selectedPointMarker);
    }
    if (typeof L !== 'undefined' && typeof map !== 'undefined') {
      selectedPointMarker = L.circleMarker([point.latitude, point.longitude], {
        radius: 8,
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillColor: '#171717',
        fillOpacity: 1,
        className: 'sho1re1-origin-marker',
        interactive: false,
        bubblingMouseEvents: false
      }).addTo(map);
    }

    renderSorted();
    focusNearestPlace();
    notifyOriginChange();
  }

  function resetToGps() {
    if (!gpsPosition) return false;
    activeOrigin = gpsPosition;
    originMode = 'gps';
    if (selectedPointMarker && typeof map !== 'undefined' &&
        map.hasLayer(selectedPointMarker)) {
      map.removeLayer(selectedPointMarker);
    }
    selectedPointMarker = null;
    renderSorted();
    notifyOriginChange();
    return true;
  }

  window.Sho1re1NearbySort = {
    updateGps: updateGps,
    setManualOrigin: setManualOrigin,
    resetToGps: resetToGps,
    getOriginMode: function () { return originMode; },
    getOrigin: function () {
      return activeOrigin ? {
        latitude: activeOrigin.latitude,
        longitude: activeOrigin.longitude
      } : null;
    }
  };

  // Only an actual map-surface tap selects a temporary search origin.
  // Marker clicks remain handled by the existing marker/card interactions.
  try {
    if (typeof map !== 'undefined' && map && typeof map.on === 'function') {
      map.on('click', function (event) {
        if (!event || !event.latlng || !event.originalEvent) return;
        setManualOrigin(event.latlng.lat, event.latlng.lng);
      });
    }
  } catch (error) {
    console.warn('[Sho1re1 Nearby] Could not bind map tap selection:', error);
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        updateGps(position.coords.latitude, position.coords.longitude);
      },
      function () {
        console.info('[Sho1re1 Nearby] GPS unavailable; keeping the original post order.');
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 12000 }
    );
  }
})();
