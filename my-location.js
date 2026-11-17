
/* ==========================================
   SHO1RE1 — AUTO USER LOCATION
   Independent map location controller
========================================== */

(function () {
  "use strict";

  // Access the existing Leaflet map
  let mapInstance;

  try {
    mapInstance = map;
  } catch (error) {
    console.error("[Location] Map not accessible.");
    return;
  }

  if (!mapInstance || !window.L) {
    console.error("[Location] Leaflet map unavailable.");
    return;
  }

  let userMarker = null;
  let accuracyCircle = null;

  /* ==========================================
     LOCATION MARKER STYLE
  ========================================== */

  const style = document.createElement("style");

  style.textContent = `
    .sho1re1-location-icon {
      background: transparent;
      border: none;
    }

    .sho1re1-location-dot {
      display: block;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #1685ff;
      border: 3px solid white;
      box-shadow:
        0 0 0 6px rgba(22,133,255,.18),
        0 2px 8px rgba(0,0,0,.3);
    }
  `;

  document.head.appendChild(style);


  /* ==========================================
     DISPLAY USER LOCATION
  ========================================== */

  function displayLocation(position) {

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const accuracy = position.coords.accuracy;

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) return;

    const location = [lat, lng];

    // Remove previous location layers
    if (userMarker) {
      mapInstance.removeLayer(userMarker);
    }

    if (accuracyCircle) {
      mapInstance.removeLayer(accuracyCircle);
    }

    // Accuracy radius
    accuracyCircle = L.circle(location, {

      radius: Math.max(accuracy || 25, 15),

      color: "#1685ff",
      weight: 1,

      fillColor: "#1685ff",
      fillOpacity: 0.12,

      interactive: false

    }).addTo(mapInstance);


    // Blue user location dot
    const locationIcon = L.divIcon({

      className: "sho1re1-location-icon",

      html: `
        <span class="sho1re1-location-dot"></span>
      `,

      iconSize: [24, 24],
      iconAnchor: [12, 12]

    });


    userMarker = L.marker(location, {

      icon: locationIcon,

      title: "Your location",

      zIndexOffset: 10000,

      keyboard: false

    }).addTo(mapInstance);


    // Move existing map to user
    const zoom = Math.max(
      mapInstance.getZoom(),
      16
    );

    mapInstance.flyTo(location, zoom, {
      animate: true,
      duration: 1.2
    });

    console.log(
      "[Location] Updated:",
      lat,
      lng,
      "Accuracy:",
      accuracy
    );
  }


  /* ==========================================
     REQUEST LOCATION
  ========================================== */

  function locateUser() {

    if (!navigator.geolocation) {

      console.error(
        "[Location] Geolocation unavailable."
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(

      displayLocation,

      function (error) {

        console.warn(
          "[Location] Could not get location:",
          error.message
        );

        // Existing Sawantwadi map remains unchanged.
      },

      {

        enableHighAccuracy: true,

        timeout: 20000,

        maximumAge: 30000

      }

    );
  }


  /* ==========================================
     PUBLIC CONTROLLER
  ========================================== */

  window.Sho1re1LocateMe = locateUser;

  // Automatically locate on startup
  locateUser();

})();
