/* Sho1re1 Nearby Carousel Sort
 * Sorts map carousel + markers by distance from the visitor.
 * This plugin does not modify the map's inline JavaScript or UI.
 */
(function () {
  'use strict';

  if (window.__sho1re1NearbySortInstalled) return;
  window.__sho1re1NearbySortInstalled = true;

  var userPosition = null;
  var originalRender = window.renderMapAndCarousel;

  // The map renderer is declared in the preceding inline script.
  if (typeof originalRender !== 'function') {
    console.warn('[Sho1re1 Nearby] Map renderer was not found.');
    return;
  }

  function distanceInKm(place) {
    if (!userPosition || !place) return Infinity;

    var lat = Number(place.lat);
    var lng = Number(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return Infinity;
    if (place.lat === '' || place.lng === '' || place.lat == null || place.lng == null) {
      return Infinity;
    }

    var toRad = function (value) { return value * Math.PI / 180; };
    var dLat = toRad(lat - userPosition.latitude);
    var dLng = toRad(lng - userPosition.longitude);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(userPosition.latitude)) *
      Math.cos(toRad(lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function sortActivePlaces() {
    if (!userPosition || !Array.isArray(activePlaces)) return;

    // Stable tie-breaker keeps the original order when distances are equal.
    activePlaces = activePlaces
      .map(function (place, index) {
        return { place: place, index: index, distance: distanceInKm(place) };
      })
      .sort(function (a, b) {
        return (a.distance - b.distance) || (a.index - b.index);
      })
      .map(function (item) { return item.place; });
  }

  window.renderMapAndCarousel = function () {
    sortActivePlaces();
    return originalRender.apply(this, arguments);
  };

  if (!navigator.geolocation) {
    console.info('[Sho1re1 Nearby] Geolocation is not supported; keeping original order.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (position) {
      userPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      // Re-render once GPS arrives so the first visible cards are nearest-first.
      if (typeof window.renderMapAndCarousel === 'function' &&
          Array.isArray(activePlaces) && activePlaces.length) {
        window.renderMapAndCarousel();
      }
    },
    function (error) {
      console.info('[Sho1re1 Nearby] Location unavailable; keeping original order.', error);
    },
    {
      enableHighAccuracy: false,
      maximumAge: 60000,
      timeout: 12000
    }
  );
})();
