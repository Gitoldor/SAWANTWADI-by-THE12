/* ============================================================
   SAWANTWADI DIGITAL
   RANDOM UI CARD ORDER
   + PLAN VISIBILITY
   + UNIVERSAL POST SHARING / DEEP LINK
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
   ============================================================ */

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
    lat: 15.9041,
    lng: 73.8219,
    image: "https://i.ibb.co/chqGP3bQ/SAWANT-WADI-20260831-173946-0000.png",
    link: "welcome.html",
    plan: "FREE"
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
  },

  {
    id: 4,
    title: "K",
    topic: "K",
    type: "M",
    subtype: "N",
    lat: 90,
    lng: 90,
    image: "",
    link: "",
    plan: "PRO"
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
   IMPORTANT
   SHUFFLE THE ACTUAL DATABASE
   ============================================================ */

/*
   Your UI may directly use:

   Sho1re1Places

   Therefore we shuffle THAT array itself.
*/

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


  /* FREE */

  if (
    plan === "FREE"
  ) {

    return true;

  }


  /* PREMIUM */

  if (
    plan === "PREMIUM"
  ) {

    return true;

  }


  /* PRO */

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


  /*
     IMPORTANT:

     We iterate through Sho1re1Places,
     which has ALREADY been shuffled.
  */

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


  /*
     Keep the SAME shuffled order.
  */

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
   UNIVERSAL POST URL
   ============================================================ */

window.Sho1re1GetPostURL =
  function (post) {

    var url =
      new URL(
        window.location.href
      );


    url.search = "";


    url.searchParams.set(
      "post",
      String(post.id)
    );


    return url.toString();

  };


/* ============================================================
   GET SHARED POST ID
   ============================================================ */

function Sho1re1GetSharedPostID() {

  var params =
    new URLSearchParams(
      window.location.search
    );


  return params.get(
    "post"
  );

}


/* ============================================================
   FIND POST
   ============================================================ */

function Sho1re1FindPost(id) {

  if (!id) {
    return null;
  }


  /*
     Search ORIGINAL database.

     This does NOT depend on card order.
  */

  var places =
    window.Sho1re1OriginalPlaces ||
    [];


  for (
    var i = 0;
    i < places.length;
    i++
  ) {

    if (
      String(
        places[i].id
      ) ===
      String(id)
    ) {

      if (
        Sho1re1IsActive(
          places[i].plan
        )
      ) {

        return places[i];

      }


      return null;

    }

  }


  return null;

}


/* ============================================================
   COPY
   ============================================================ */

function Sho1re1Copy(text) {

  if (
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {

    return navigator.clipboard.writeText(
      text
    );

  }


  return new Promise(
    function (resolve) {

      var input =
        document.createElement(
          "input"
        );


      input.value =
        text;


      input.style.position =
        "fixed";


      input.style.opacity =
        "0";


      document.body.appendChild(
        input
      );


      input.select();


      document.execCommand(
        "copy"
      );


      input.remove();


      resolve();

    }
  );

}


/* ============================================================
   SHARE POST
   ============================================================ */

window.Sho1re1SharePost =
  async function (post) {

    if (!post) {
      return;
    }


    var url =
      window.Sho1re1GetPostURL(
        post
      );


    if (
      navigator.share
    ) {

      try {

        await navigator.share({

          title:
            post.title || "Post",

          text:
            post.title || "",

          url:
            url

        });


        return;

      }

      catch (error) {

        if (
          error &&
          error.name ===
          "AbortError"
        ) {

          return;

        }

      }

    }


    try {

      await Sho1re1Copy(
        url
      );


      Sho1re1ShowToast(
        "Post link copied"
      );

    }

    catch (error) {

      window.prompt(
        "Copy this post link:",
        url
      );

    }

  };


/* ============================================================
   TOAST
   ============================================================ */

function Sho1re1ShowToast(message) {

  var old =
    document.getElementById(
      "Sho1re1ShareToast"
    );


  if (old) {
    old.remove();
  }


  var toast =
    document.createElement(
      "div"
    );


  toast.id =
    "Sho1re1ShareToast";


  toast.textContent =
    message;


  toast.style.position =
    "fixed";


  toast.style.left =
    "50%";


  toast.style.bottom =
    "25px";


  toast.style.transform =
    "translateX(-50%)";


  toast.style.zIndex =
    "999999";


  toast.style.padding =
    "12px 18px";


  toast.style.borderRadius =
    "999px";


  toast.style.background =
    "#111";


  toast.style.color =
    "#fff";


  toast.style.fontSize =
    "14px";


  toast.style.boxShadow =
    "0 8px 30px rgba(0,0,0,.35)";


  document.body.appendChild(
    toast
  );


  setTimeout(
    function () {

      toast.remove();

    },
    2200
  );

}


/* ============================================================
   EXIT SHARED POST
   ============================================================ */

window.Sho1re1ExitSharedPost =
  function () {

    var url =
      new URL(
        window.location.href
      );


    url.searchParams.delete(
      "post"
    );


    history.pushState(
      {},
      "",
      url.pathname +
      url.search +
      url.hash
    );


    Sho1re1ShowAllPosts();

  };


/* ============================================================
   SHOW ALL POSTS
   ============================================================ */

function Sho1re1ShowAllPosts() {

  var elements =
    document.querySelectorAll(
      "[data-sho1re1-hidden]"
    );


  for (
    var i = 0;
    i < elements.length;
    i++
  ) {

    elements[i].style.display =
      elements[i].getAttribute(
        "data-sho1re1-original-display"
      ) || "";


    elements[i].removeAttribute(
      "data-sho1re1-hidden"
    );


    elements[i].removeAttribute(
      "data-sho1re1-original-display"
    );

  }


  var exitButton =
    document.getElementById(
      "Sho1re1ExitButton"
    );


  if (exitButton) {
    exitButton.remove();
  }

}


/* ============================================================
   EXIT BUTTON
   ============================================================ */

function Sho1re1CreateExitButton() {

  var existing =
    document.getElementById(
      "Sho1re1ExitButton"
    );


  if (existing) {
    return existing;
  }


  var button =
    document.createElement(
      "button"
    );


  button.id =
    "Sho1re1ExitButton";


  button.type =
    "button";


  button.innerHTML =
    "← View all posts";


  button.style.position =
    "fixed";


  button.style.top =
    "15px";


  button.style.left =
    "15px";


  button.style.zIndex =
    "999999";


  button.style.padding =
    "10px 16px";


  button.style.border =
    "0";


  button.style.borderRadius =
    "999px";


  button.style.background =
    "#111";


  button.style.color =
    "#fff";


  button.style.fontSize =
    "14px";


  button.style.fontWeight =
    "600";


  button.style.cursor =
    "pointer";


  button.style.boxShadow =
    "0 5px 20px rgba(0,0,0,.25)";


  button.addEventListener(
    "click",
    function () {

      window.Sho1re1ExitSharedPost();

    }
  );


  document.body.appendChild(
    button
  );


  return button;

}


/* ============================================================
   FIND POST ELEMENTS
   ============================================================ */

function Sho1re1FindElementsForPost(post) {

  var all =
    document.querySelectorAll(
      "*"
    );


  var matches = [];


  for (
    var i = 0;
    i < all.length;
    i++
  ) {

    var element =
      all[i];


    var possibleID =
      element.getAttribute(
        "data-id"
      ) ||
      element.getAttribute(
        "data-post-id"
      ) ||
      element.getAttribute(
        "data-place-id"
      );


    if (
      possibleID &&
      String(possibleID) ===
      String(post.id)
    ) {

      matches.push(
        element
      );


      continue;

    }


    if (
      element.tagName ===
      "A"
    ) {

      var href =
        element.getAttribute(
          "href"
        );


      if (
        href &&
        post.link &&
        href === post.link
      ) {

        matches.push(
          element
        );

      }

    }

  }


  return matches;

}


/* ============================================================
   ADD SHARE BUTTON
   ============================================================ */

function Sho1re1AddShareButton(
  element,
  post
) {

  if (!element || !post) {
    return;
  }


  if (
    element.querySelector(
      ".Sho1re1AutoShareButton"
    )
  ) {

    return;

  }


  var button =
    document.createElement(
      "button"
    );


  button.type =
    "button";


  button.className =
    "Sho1re1AutoShareButton";


  button.textContent =
    "Share";


  button.style.padding =
    "8px 14px";


  button.style.border =
    "0";


  button.style.borderRadius =
    "999px";


  button.style.background =
    "#111";


  button.style.color =
    "#fff";


  button.style.fontSize =
    "14px";


  button.style.cursor =
    "pointer";


  button.style.margin =
    "8px";


  button.addEventListener(
    "click",
    function (event) {

      event.preventDefault();

      event.stopPropagation();


      window.Sho1re1SharePost(
        post
      );

    }
  );


  element.appendChild(
    button
  );

}


/* ============================================================
   SCAN UI
   ============================================================ */

function Sho1re1ScanUI() {

  var posts =
    window.Sho1re1VisiblePlaces ||
    [];


  for (
    var i = 0;
    i < posts.length;
    i++
  ) {

    var post =
      posts[i];


    var elements =
      Sho1re1FindElementsForPost(
        post
      );


    for (
      var j = 0;
      j < elements.length;
      j++
    ) {

      Sho1re1AddShareButton(
        elements[j],
        post
      );

    }

  }

}


/* ============================================================
   OPEN SHARED POST
   ============================================================ */

function Sho1re1OpenSharedPost() {

  var sharedID =
    Sho1re1GetSharedPostID();


  if (!sharedID) {
    return;
  }


  var post =
    Sho1re1FindPost(
      sharedID
    );


  if (!post) {

    console.warn(
      "Sho1re1: Post not found:",
      sharedID
    );


    return;

  }


  Sho1re1CreateExitButton();


  var selectedElements =
    Sho1re1FindElementsForPost(
      post
    );


  var posts =
    window.Sho1re1VisiblePlaces ||
    [];


  for (
    var i = 0;
    i < posts.length;
    i++
  ) {

    var otherPost =
      posts[i];


    if (
      String(otherPost.id) ===
      String(post.id)
    ) {

      continue;

    }


    var otherElements =
      Sho1re1FindElementsForPost(
        otherPost
      );


    for (
      var j = 0;
      j < otherElements.length;
      j++
    ) {

      var element =
        otherElements[j];


      if (
        !element.hasAttribute(
          "data-sho1re1-hidden"
        )
      ) {

        element.setAttribute(
          "data-sho1re1-hidden",
          "true"
        );


        element.setAttribute(
          "data-sho1re1-original-display",
          element.style.display || ""
        );


        element.style.display =
          "none";

      }

    }

  }


  if (
    selectedElements.length
  ) {

    setTimeout(
      function () {

        selectedElements[0]
          .scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

      },
      100
    );

  }


  if (post.title) {

    document.title =
      post.title;

  }

}


/* ============================================================
   INITIALIZE
   ============================================================ */

function Sho1re1InitializeSharing() {

  Sho1re1ScanUI();

  Sho1re1OpenSharedPost();


  setInterval(
    function () {

      Sho1re1ScanUI();

    },
    1000
  );

}


/* ============================================================
   BACK / FORWARD
   ============================================================ */

window.addEventListener(
  "popstate",
  function () {

    Sho1re1ShowAllPosts();

    Sho1re1OpenSharedPost();

  }
);


/* ============================================================
   START
   ============================================================ */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    function () {

      setTimeout(
        Sho1re1InitializeSharing,
        300
      );

    }
  );

}
else {

  setTimeout(
    Sho1re1InitializeSharing,
    300
  );

}


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


      setTimeout(
        function () {

          Sho1re1ScanUI();

          Sho1re1OpenSharedPost();

        },
        100
      );

    }

  },
  30000
);

