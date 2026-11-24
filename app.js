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
    D1 DATA SOURCE
    ============================================================ */
window.Sho1re1DataAPI = "https://sawantwadi-read-api.onrender.com";
window.Sho1re1Places = [];
window.Sho1re1OriginalPlaces = [];
window.Sho1re1VisiblePlaces = [];

function Sho1re1RandomShuffle(array) {
  for (var i=array.length-1;i>0;i--) {
    var random=Math.floor(Math.random()*(i+1));
    var temp=array[i]; array[i]=array[random]; array[random]=temp;
  }
  return array;
}

function Sho1re1IsActive(plan) {
  plan=String(plan||"FREE").toUpperCase();
  var rule=window.Sho1re1Settings[plan];
  if(!rule||rule.enabled!==true)return false;
  if(plan==="FREE"||plan==="PREMIUM")return true;
  if(plan==="PRO") {
    var hour=new Date().getHours(),start=rule.startHour,end=rule.endHour;
    if(start<end)return hour>=start&&hour<end;
    if(start>end)return hour>=start||hour<end;
    return true;
  }
  return false;
}

function Sho1re1BuildDatabase() {
  var visible=[];
  for(var i=0;i<window.Sho1re1Places.length;i++) {
    var place=window.Sho1re1Places[i];
    if(Sho1re1IsActive(place.plan))visible.push(place);
  }
  window.Sho1re1VisiblePlaces=visible;
}

window.Sho1re1GetPlaces=function(){return window.Sho1re1VisiblePlaces||[];};

window.Sho1re1DataReady=fetch(window.Sho1re1DataAPI+"/places",{
  method:"GET",headers:{"Accept":"application/json"},cache:"no-store"
}).then(function(response){
  if(!response.ok)throw new Error("D1 API returned HTTP "+response.status);
  return response.json();
}).then(function(payload){
  if(!payload||payload.success!==true||!Array.isArray(payload.places))throw new Error("Invalid D1 places response");
  window.Sho1re1OriginalPlaces=payload.places.slice();
  try{localStorage.setItem("sho1re1_d1_places_cache_v1",JSON.stringify(payload.places));}catch(_){}
  window.Sho1re1DataOffline=false;
  window.Sho1re1Places=Sho1re1RandomShuffle(payload.places.slice());
  Sho1re1BuildDatabase();
  window.dispatchEvent(new Event("Sho1re1DataLoaded"));
  return window.Sho1re1Places;
}).catch(function(error){
  console.warn("Sho1re1 D1 data request failed; checking the last offline snapshot.",error);
  try{
    var cached=JSON.parse(localStorage.getItem("sho1re1_d1_places_cache_v1")||"null");
    if(Array.isArray(cached)){
      window.Sho1re1OriginalPlaces=cached.slice();
      window.Sho1re1Places=Sho1re1RandomShuffle(cached.slice());
      Sho1re1BuildDatabase();
      window.Sho1re1DataOffline=true;
      window.dispatchEvent(new Event("Sho1re1DataLoaded"));
      return window.Sho1re1Places;
    }
  }catch(_){}
  console.error("Sho1re1 has no cached D1 data available:",error);
  window.Sho1re1Places=[];window.Sho1re1OriginalPlaces=[];window.Sho1re1VisiblePlaces=[];
  window.Sho1re1DataError=error;
  window.dispatchEvent(new Event("Sho1re1DataError"));
  return [];
});

setInterval(function(){
  var before=(window.Sho1re1VisiblePlaces||[]).map(function(p){return p.id;}).sort().join(",");
  Sho1re1BuildDatabase();
  var after=(window.Sho1re1VisiblePlaces||[]).map(function(p){return p.id;}).sort().join(",");
  if(before!==after)window.dispatchEvent(new Event("Sho1re1VisibilityChanged"));
},30000);

/* ============================================================
   COMMUNITY STORY MARKERS
   Separate from Sho1re1Places, exactly as before.
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
