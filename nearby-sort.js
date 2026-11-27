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

  function renderSorted() {
    if (typeof window.renderMapAndCarousel === 'function' &&
        Array.isArray(activePlaces)) {
      window.renderMapAndCarousel();
    }
  }

  window.renderMapAndCarousel = function () {
    sortActivePlaces();
    return originalRender.apply(this, arguments);
  };

  // Called by my-location.js. A late GPS response must never replace a
  // manually selected map point.
  function updateGps(latitude, longitude) {
    var point = { latitude: Number(latitude), longitude: Number(longitude) };
    if (!validPoint(point)) return;
    gpsPosition = point;
    if (originMode !== 'manual') {
      activeOrigin = point;
      originMode = 'gps';
      renderSorted();
    }
  }

  function setManualOrigin(latitude, longitude) {
    var point = { latitude: Number(latitude), longitude: Number(longitude) };
    if (!validPoint(point)) return;
    activeOrigin = point;
    originMode = 'manual';
    renderSorted();
  }

  function resetToGps() {
    if (!gpsPosition) return false;
    activeOrigin = gpsPosition;
    originMode = 'gps';
    renderSorted();
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
