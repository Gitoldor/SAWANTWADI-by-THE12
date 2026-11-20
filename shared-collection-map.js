(() => {
  'use strict';
  const encoded = new URLSearchParams(window.location.search).get('collection');
  if (!encoded) return;
  function decodePayload(value) {
    let base64 = value.replace(/-/g, '+').replace(/_/g, '/');
    base64 += '='.repeat((4 - base64.length % 4) % 4);
    return JSON.parse(decodeURIComponent(escape(atob(base64))));
  }
  let payload;
  try {
    payload = decodePayload(encoded);
    if (!payload || payload.v !== 1 || !Array.isArray(payload.ids)) throw new Error('Invalid collection');
  } catch (error) {
    console.warn('Sho1re1: invalid shared collection link', error);
    return;
  }
  const wanted = new Set(payload.ids.map(String));
  let attempts = 0;
  const waitForMainMap = setInterval(() => {
    attempts++;
    try {
      if (typeof map === 'undefined' || typeof rawPlaces === 'undefined' ||
          typeof renderMapAndCarousel !== 'function' || typeof clusterLayer === 'undefined' ||
          !Array.isArray(rawPlaces) || !rawPlaces.length) {
        if (attempts > 120) clearInterval(waitForMainMap);
        return;
      }
      clearInterval(waitForMainMap);
      const collectionPlaces = rawPlaces.filter(place =>
        wanted.has(String(place.id)) &&
        Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lng)) &&
        Number(place.lat) >= -90 && Number(place.lat) <= 90 &&
        Number(place.lng) >= -180 && Number(place.lng) <= 180
      );
      selectedFilter = 'All';
      searchQuery = '';
      showOnlySaved = false;
      // Use the existing map renderer, marker icons, clustering and carousel.
      rawPlaces = collectionPlaces;
      if (typeof title !== 'undefined' && title) title.textContent = payload.title || 'Shared Collection';
      if (typeof buildFilterChips === 'function') buildFilterChips();
      applyFilters();
      const points = collectionPlaces.map(place => [Number(place.lat), Number(place.lng)]);
      if (points.length === 1) map.flyTo(points[0], 16, { animate: true, duration: 1.1 });
      else if (points.length > 1) map.flyToBounds(points, { padding: [70, 100], maxZoom: 16, animate: true, duration: 1.1 });
      else map.setView([15.9041, 73.8219], 14);
      window.Sho1re1SharedCollectionActive = true;
      document.title = (payload.title || 'Shared Collection') + ' · Sho1re1';
    } catch (error) {
      console.error('Sho1re1: could not open shared collection on map', error);
      if (attempts > 120) clearInterval(waitForMainMap);
    }
  }, 100);
})();