/* ============================================================
   SAWANTWADI DIGITAL
   RANDOM UI CARD ORDER
   + PLAN VISIBILITY
   + POST EXPIRY
   ============================================================ */


/* ============================================================
   PLAN SETTINGS
   ============================================================ */

window.Sho1re1Settings = {

  FREE: {
    enabled: true
  },

  PRO: {
    enabled: true,
    startHour: 14,
    endHour: 15
  },

  PREMIUM: {
    enabled: true
  }

};


/* ============================================================
   DATABASE
   plan2 = POST LIFETIME
   createdOn = AUTOMATIC POST CREATION TIME
   ============================================================ */

window.Sho1re1Places = [
  {
    "id": 1,
    "title": "Y0 chat",
    "topic": "Fuck",
    "type": "Fuck",
    "subtype": "Fuck",
    "plan": "PREMIUM",
    "lat": 15.894817,
    "lng": 73.819888,
    "image": "https://github.com/Gitoldor/LiquidGlassAPK",
    "link": "https://github.com/Gitoldor/LiquidGlassAPK",
    "plan2": "14D",
    "createdOn": "2026-10-23T13:20:04+05:30"
  }
];;;;;;


/* ============================================================
   SAVE ORIGINAL DATABASE
   ============================================================ */

window.Sho1re1OriginalPlaces =
  window.Sho1re1Places.slice();


/* ============================================================
   RANDOM SHUFFLE
   ============================================================ */

function Sho1re1RandomShuffle(array) {

  for (
    var i = array.length - 1;
    i > 0;
    i--
  ) {

    var random =
      Math.floor(
        Math.random() * (i + 1)
      );

    var temp =
      array[i];

    array[i] =
      array[random];

    array[random] =
      temp;

  }

  return array;

}


/* ============================================================
   SHUFFLE ACTUAL DATABASE
   ============================================================ */

Sho1re1RandomShuffle(
  window.Sho1re1Places
);


/* ============================================================
   GLOBAL STORAGE
   ============================================================ */

window.Sho1re1VisiblePlaces = [];


/* ============================================================
   PLAN CHECK
   ============================================================ */

function Sho1re1IsActive(plan) {

  plan =
    String(
      plan || "FREE"
    ).toUpperCase();

  var rule =
    window.Sho1re1Settings[plan];

  if (
    !rule ||
    rule.enabled !== true
  ) {

    return false;

  }


  if (
    plan === "FREE"
  ) {

    return true;

  }


  if (
    plan === "PREMIUM"
  ) {

    return true;

  }


  if (
    plan === "PRO"
  ) {

    var hour =
      new Date().getHours();

    var start =
      rule.startHour;

    var end =
      rule.endHour;


    if (
      start < end
    ) {

      return (
        hour >= start &&
        hour < end
      );

    }


    if (
      start > end
    ) {

      return (
        hour >= start ||
        hour < end
      );

    }


    return true;

  }


  return false;

}


/* ============================================================
   BUILD VISIBLE DATABASE
   ============================================================ */

function Sho1re1BuildDatabase() {

  var visible = [];


  for (
    var i = 0;
    i < window.Sho1re1Places.length;
    i++
  ) {

    var place =
      window.Sho1re1Places[i];


    if (
      Sho1re1IsActive(
        place.plan
      )
    ) {

      visible.push(
        place
      );

    }

  }


  window.Sho1re1VisiblePlaces =
    visible;

}


/* ============================================================
   INITIAL BUILD
   ============================================================ */

Sho1re1BuildDatabase();


/* ============================================================
   SAFE GETTER
   ============================================================ */

window.Sho1re1GetPlaces =
  function () {

    return (
      window.Sho1re1VisiblePlaces ||
      []
    );

  };


/* ============================================================
   REFRESH PLAN VISIBILITY
   ============================================================ */

setInterval(
  function () {

    var before =
      (window.Sho1re1VisiblePlaces || [])
        .map(function (p) {
          return p.id;
        })
        .sort()
        .join(",");


    Sho1re1BuildDatabase();


    var after =
      (window.Sho1re1VisiblePlaces || [])
        .map(function (p) {
          return p.id;
        })
        .sort()
        .join(",");


    if (
      before !== after
    ) {

      window.dispatchEvent(
        new Event(
          "Sho1re1VisibilityChanged"
        )
      );

    }

  },
  30000
);
