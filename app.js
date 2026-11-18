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
    "id": 4,
    "title": "B",
    "topic": "V",
    "type": "B",
    "subtype": "B",
    "plan": "PREMIUM",
    "lat": 15.897279,
    "lng": 73.820843,
    "image": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
    "link": "https://github.com/Gitoldor/LiquidGlassAPK",
    "plan2": "7D",
    "createdOn": "2026-11-17T23:08:38+05:30"
  },
  {
    "id": 3,
    "title": "Fouch",
    "topic": "Tovk",
    "type": "Uiib",
    "subtype": "Jkj",
    "plan": "PRO",
    "lat": 15.895677,
    "lng": 73.819299,
    "image": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
    "link": "https://github.com/Gitoldor/LiquidGlassAPK",
    "plan2": "30D",
    "createdOn": "2026-11-07T12:39:17+05:30"
  },
  {
    "id": 2,
    "title": "Fick",
    "topic": "Fuck",
    "type": "Tock",
    "subtype": "To k",
    "plan": "PRO",
    "lat": 15.960606,
    "lng": 73.758693,
    "image": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
    "link": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
    "createdOn": "2026-10-23T13:25:44+05:30"
  }

  ,
  {
    "id": 5,
    "title": "Sawantwadi Palace",
    "topic": "Heritage",
    "type": "Landmark",
    "subtype": "Royal Palace",
    "plan": "FREE",
    "lat": 15.90662,
    "lng": 73.82459,
    "image": "https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800",
    "link": "https://www.google.com/maps/search/?api=1&query=Sawantwadi+Palace+Sawantwadi"
  },
  {
    "id": 6,
    "title": "Moti Talao",
    "topic": "Nature",
    "type": "Nature",
    "subtype": "Lake",
    "plan": "FREE",
    "lat": 15.90521,
    "lng": 73.82247,
    "image": "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800",
    "link": "https://www.google.com/maps/search/?api=1&query=Moti+Talao+Sawantwadi"
  },
  {
    "id": 7,
    "title": "Aatmeshwar Mandir",
    "topic": "Worship",
    "type": "Temple",
    "subtype": "Shiva Temple",
    "plan": "FREE",
    "lat": 15.91061,
    "lng": 73.81666,
    "image": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
    "link": "https://www.google.com/maps/search/?api=1&query=Aatmeshwar+Mandir+Sawantwadi"
  },
  {
    "id": 8,
    "title": "Aapla Bazar",
    "topic": "Shopping",
    "type": "Shopping",
    "subtype": "Shopping Centre",
    "plan": "FREE",
    "lat": 15.91057,
    "lng": 73.82241,
    "image": "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800",
    "link": "https://www.google.com/maps/search/?api=1&query=Aapla+Bazar+Sawantwadi"
  }
  ,
  {
    "id": 9,
    "title": "Your AI coding buddy can now tinker with the backend too 🤖",
    "topic": "Tech Discovery",
    "type": "News",
    "subtype": "AI Tools",
    "plan": "FREE",
    "lat": 15.9062,
    "lng": 73.8213,
    "image": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
    "link": "https://supabase.com/blog/ship-changes-to-your-supabase-backend-with-grok-bot"
  }

];


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


/* ============================================================
   COMMUNITY STORY MARKERS
   Inspired by verified Google Maps contribution milestones.
   Separate from Sho1re1Places so these landmarks never enter the
   posting/plan/shuffle database.
   ============================================================ */

window.Sho1re1LocalMarkers = [
  {
    id: "maps-milestone-selfie-point",
    title: "Sawantwadi Selfie Point",
    category: "Community landmark",
    story: "This landmark name edit was made by a Sho1re1 creator and later reached 20,000+ Google Maps views.",
    lat: 15.90618,
    lng: 73.82129,
    coordinatesApproximate: true,
    source: "Google Maps contribution milestone email, September 2026",
    link: "https://www.google.com/maps/place/Sawantwadi+Selfie+Point/"
  }
];
