/* ============================================================
   SAWANTWADI DIGITAL - PLAN VISIBILITY DATABASE (FIXED)
   ============================================================ */

window.Sho1re1Settings = {
  FREE: {
    enabled: true
  },
  PRO: {
    enabled: true,
    startHour: 14, // 14:00 (2 PM)
    endHour: 15    // 17:00 (5 PM)
  },
  PREMIUM: {
    enabled: true
  }
};

window.Sho1re1Places = [
  {
    id: 1,
    title: "welcome",
    topic: "Scenic Drives",
    type: "",
    subtype: "",
    lat: 15.9041,
    lng: 73.8219,
    image: "https://i.ibb.co/chqGP3bQ/SAWANT-WADI-20260831-173946-0000.png",
    link: "welcome.html",
    plan: "FREE"
  },
  {
    id: 2,
    title: "welcome",
    topic: "Scenic Drives",
    type: "",
    subtype: "",
    lat: 15.9941,
    lng: 73.8219,
    image: "https://i.ibb.co/chqGP3bQ/SAWANT-WADI-20260831-173946-0000.png",
    link: "welcome.html",
    plan: "PRO"
  },
  {
    id: 3,
    title: "welcome",
    topic: "Scenic Drives",
    type: "",
    subtype: "",
    lat: 15.9541,
    lng: 73.8219,
    image: "https://i.ibb.co/chqGP3bQ/SAWANT-WADI-20260831-173946-0000.png",
    link: "welcome.html",
    plan: "PREMIUM"
  }
];

/* Global storage initialization */
window.Sho1re1VisiblePlaces = [];

function Sho1re1IsActive(plan) {
  plan = String(plan || "FREE").toUpperCase();
  var rule = window.Sho1re1Settings[plan];

  if (!rule || rule.enabled !== true) {
    return false;
  }

  if (plan === "FREE" || plan === "PREMIUM") {
    return true;
  }

  if (plan === "PRO") {
    var hour = new Date().getHours();
    var start = rule.startHour;
    var end = rule.endHour;

    if (start < end) {
      return hour >= start && hour < end;
    }
    if (start > end) {
      return hour >= start || hour < end;
    }
    return true;
  }

  return false;
}

function Sho1re1BuildDatabase() {
  var visible = [];

  for (var i = 0; i < window.Sho1re1Places.length; i++) {
    var place = window.Sho1re1Places[i];
    if (Sho1re1IsActive(place.plan)) {
      visible.push(place);
    }
  }

  window.Sho1re1VisiblePlaces = visible;
}

/* Initial Build */
Sho1re1BuildDatabase();

/* Safe Getter */
window.Sho1re1GetPlaces = function () {
  return window.Sho1re1VisiblePlaces || [];
};

/* Refresh Timer */
setInterval(function () {
  var beforeIds = window.Sho1re1VisiblePlaces.map(function(p) { return p.id; }).join(",");

  Sho1re1BuildDatabase();

  var afterIds = window.Sho1re1VisiblePlaces.map(function(p) { return p.id; }).join(",");

  if (beforeIds !== afterIds) {
    window.dispatchEvent(new Event("Sho1re1VisibilityChanged"));
  }
}, 30000);
