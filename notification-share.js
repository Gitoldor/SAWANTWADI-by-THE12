/* ============================================================
   SAWANTWADI NOTIFICATION SHARE
   ============================================================

   SHARED URL:

   ?notification=n11

   BEHAVIOUR:

   • Opens notification drawer automatically
   • Shared notification goes directly to TOP
   • NO scrolling
   • Shared notification stays highlighted
   • Normal notifications are unchanged
   • Share button on every notification
   • d.link remains untouched

   LOAD:

   <script src="notification-share.js"></script>

   ============================================================ */


/* ============================================================
   CONFIG
   ============================================================ */

const S1_SHARE_PARAM = "notification";

const S1_SHARE_BUTTON_CLASS =
  "s1ShareButton";

const S1_SHARED_CLASS =
  "s1SharedNotification";


/* ============================================================
   GET SHARED ID
   ============================================================ */

function s1GetSharedID(){

  try{

    const params =
      new URLSearchParams(
        window.location.search
      );

    return params.get(
      S1_SHARE_PARAM
    );

  }

  catch(e){

    return null;

  }

}


const S1_SHARED_ID =
  s1GetSharedID();


/* ============================================================
   CSS
   ============================================================ */

(function(){

  if(
    document.getElementById(
      "s1NotificationShareStyle"
    )
  ){

    return;

  }


  const style =
    document.createElement("style");


  style.id =
    "s1NotificationShareStyle";


  style.textContent = `

    /* ======================================================
       SHARE BUTTON
       ====================================================== */

    .${S1_SHARE_BUTTON_CLASS}{

      position:absolute;

      right:18px;
      bottom:18px;

      width:42px;
      height:42px;

      border:0;

      border-radius:50%;

      display:grid;

      place-items:center;

      padding:0;

      background:#ffffffe8;

      color:#111;

      backdrop-filter:blur(12px);

      -webkit-backdrop-filter:blur(12px);

      box-shadow:
        0 8px 25px #0002;

      z-index:30;

      cursor:pointer;

      -webkit-tap-highlight-color:transparent;

      transition:
        transform .25s
        cubic-bezier(.18,1.5,.3,1);

    }


    .${S1_SHARE_BUTTON_CLASS}:active{

      transform:scale(.82);

    }


    .${S1_SHARE_BUTTON_CLASS} svg{

      width:19px;
      height:19px;

      fill:none;

      stroke:currentColor;

      stroke-width:2;

      stroke-linecap:round;

      stroke-linejoin:round;

    }


    /* ======================================================
       SHARED CARD
       ====================================================== */

    .${S1_SHARED_CLASS}{

      box-shadow:
        0 0 0 3px #111,
        0 18px 50px #0003 !important;

      transform:scale(1.015) !important;

      position:relative;

      z-index:50;

    }


    /* ======================================================
       COPIED
       ====================================================== */

    .s1ShareCopied{

      position:fixed;

      left:50%;

      bottom:25px;

      transform:
        translate(-50%,20px)
        scale(.9);

      padding:10px 16px;

      border-radius:999px;

      background:#111;

      color:#fff;

      font:600 13px system-ui;

      opacity:0;

      pointer-events:none;

      z-index:999999;

      transition:
        .35s cubic-bezier(.18,1.5,.3,1);

    }


    .s1ShareCopied.show{

      opacity:1;

      transform:
        translate(-50%,0)
        scale(1);

    }

  `;


  document.head.appendChild(style);

})();


/* ============================================================
   SHARE ICON
   ============================================================ */

function s1ShareIcon(){

  return `

    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >

      <circle
        cx="18"
        cy="5"
        r="2.5"
      ></circle>

      <circle
        cx="6"
        cy="12"
        r="2.5"
      ></circle>

      <circle
        cx="18"
        cy="19"
        r="2.5"
      ></circle>

      <path
        d="M8.2 13.2 15.8 17.8"
      ></path>

      <path
        d="M15.8 6.2 8.2 10.8"
      ></path>

    </svg>

  `;

}


/* ============================================================
   SHARE URL
   ============================================================ */

function s1GetShareURL(id){

  const url =
    new URL(
      window.location.href
    );


  url.searchParams.set(
    S1_SHARE_PARAM,
    id
  );


  url.hash = "";


  return url.toString();

}


/* ============================================================
   COPY MESSAGE
   ============================================================ */

function s1ShowCopied(){

  let box =
    document.querySelector(
      ".s1ShareCopied"
    );


  if(!box){

    box =
      document.createElement("div");

    box.className =
      "s1ShareCopied";

    box.textContent =
      "Link copied";

    document.body.appendChild(box);

  }


  box.classList.add("show");


  clearTimeout(
    box._timer
  );


  box._timer =
    setTimeout(()=>{

      box.classList.remove("show");

    },1800);

}


/* ============================================================
   SHARE
   ============================================================ */

async function s1ShareNotification(id){

  const url =
    s1GetShareURL(id);


  /* Native Android / browser share */

  if(
    typeof navigator.share ===
    "function"
  ){

    try{

      await navigator.share({

        title:
          "Sawantwadi",

        text:
          "Check this Sawantwadi update",

        url:url

      });

      return;

    }

    catch(error){

      /*
         User cancelled the share sheet.
      */

      if(
        error &&
        error.name === "AbortError"
      ){

        return;

      }

    }

  }


  /* Clipboard */

  try{

    await navigator.clipboard.writeText(
      url
    );

    s1ShowCopied();

    return;

  }

  catch(error){

    /* Old browser fallback */

  }


  const input =
    document.createElement("input");


  input.value =
    url;


  input.style.position =
    "fixed";


  input.style.opacity =
    "0";


  document.body.appendChild(
    input
  );


  input.select();


  try{

    document.execCommand("copy");

  }

  catch(e){}


  input.remove();


  s1ShowCopied();

}


/* ============================================================
   FIND DATA ITEM
   ============================================================ */

function s1FindDataItem(id){

  const data =
    window.Sho1re1Notifications;


  if(
    !Array.isArray(data)
  ){

    return null;

  }


  return data.find(
    item =>
      String(item.id) ===
      String(id)
  ) || null;

}


/* ============================================================
   MATCH CARD TO DATA
   ============================================================

   We DON'T use the card's index.

   This is important because the shared
   card will be moved to the top.

   Instead we compare the title and message
   rendered inside the card.

   ============================================================ */

function s1FindCardForData(item){

  if(!item)
    return null;


  const drawer =
    document.querySelector(
      ".s1drawer"
    );


  if(!drawer)
    return null;


  const cards =
    Array.from(
      drawer.querySelectorAll(
        ".s1item"
      )
    );


  const wantedTitle =
    String(
      item.title || ""
    ).trim();


  const wantedMessage =
    String(
      item.message || ""
    ).trim();


  for(
    const card of cards
  ){

    const titleElement =
      card.querySelector(
        ".s1title"
      );


    const messageElement =
      card.querySelector(
        ".s1msg"
      );


    const title =
      String(
        titleElement?.textContent || ""
      ).trim();


    const message =
      String(
        messageElement?.textContent || ""
      ).trim();


    if(
      title === wantedTitle &&
      message === wantedMessage
    ){

      return card;

    }

  }


  return null;

}


/* ============================================================
   ADD SHARE BUTTON TO CARD
   ============================================================ */

function s1AddShareButton(card,item){

  if(
    !card ||
    !item ||
    !item.id
  ){

    return;

  }


  /*
     Already installed.
  */

  if(
    card.querySelector(
      "." +
      S1_SHARE_BUTTON_CLASS
    )
  ){

    return;

  }


  card.dataset.notificationId =
    item.id;


  const button =
    document.createElement("button");


  button.className =
    S1_SHARE_BUTTON_CLASS;


  button.type =
    "button";


  button.setAttribute(
    "aria-label",
    "Share notification"
  );


  button.innerHTML =
    s1ShareIcon();


  /*
     Prevent the card's normal
     d.link click.
  */

  button.addEventListener(
    "pointerdown",
    event=>{

      event.stopPropagation();

    }
  );


  button.addEventListener(
    "touchstart",
    event=>{

      event.stopPropagation();

    },
    {
      passive:true
    }
  );


  button.addEventListener(
    "click",
    event=>{

      event.preventDefault();

      event.stopPropagation();

      s1ShareNotification(
        item.id
      );

    }
  );


  card.appendChild(button);

}


/* ============================================================
   PROCESS ALL CARDS
   ============================================================ */

function s1ProcessCards(){

  const data =
    window.Sho1re1Notifications;


  if(
    !Array.isArray(data) ||
    !data.length
  ){

    return false;

  }


  const drawer =
    document.querySelector(
      ".s1drawer"
    );


  if(!drawer)
    return false;


  const cards =
    Array.from(
      drawer.querySelectorAll(
        ".s1item"
      )
    );


  if(!cards.length)
    return false;


  /*
     Match every card against the
     notification data.

     This also works after reordering.
  */

  cards.forEach(card=>{

    /*
       Already identified.
    */

    if(
      card.dataset.notificationId
    ){

      return;

    }


    const title =
      String(
        card.querySelector(
          ".s1title"
        )?.textContent || ""
      ).trim();


    const message =
      String(
        card.querySelector(
          ".s1msg"
        )?.textContent || ""
      ).trim();


    const item =
      data.find(notification=>{

        return(
          String(
            notification.title || ""
          ).trim() === title &&

          String(
            notification.message || ""
          ).trim() === message
        );

      });


    if(item){

      card.dataset.notificationId =
        item.id;

      s1AddShareButton(
        card,
        item
      );

    }

  });


  return true;

}


/* ============================================================
   MOVE SHARED CARD TO TOP
   ============================================================ */

function s1MoveSharedToTop(){

  if(!S1_SHARED_ID)
    return false;


  const drawer =
    document.querySelector(
      ".s1drawer"
    );


  if(!drawer)
    return false;


  /*
     First identify all cards.
  */

  s1ProcessCards();


  const cards =
    Array.from(
      drawer.querySelectorAll(
        ".s1item"
      )
    );


  const target =
    cards.find(
      card =>
        String(
          card.dataset.notificationId
        ) ===
        String(S1_SHARED_ID)
    );


  if(!target)
    return false;


  /*
     Find the drawer header.

     We place the shared card
     immediately after it.
  */

  const header =
    drawer.querySelector(
      ".s1header"
    );


  if(header){

    header.after(target);

  }

  else{

    /*
       Fallback if header somehow
       isn't available.
    */

    const handle =
      drawer.querySelector(
        ".s1handle"
      );


    if(handle){

      handle.after(target);

    }

    else{

      drawer.prepend(target);

    }

  }


  /*
     Permanent highlight.
  */

  target.classList.add(
    S1_SHARED_CLASS
  );


  return true;

}


/* ============================================================
   OPEN DRAWER
   ============================================================ */

function s1OpenDrawer(){

  const now =
    document.querySelector(
      ".s1now"
    );


  if(!now)
    return false;


  /*
     The original notification system
     exposes its open function through
     onclick.

     Calling it directly avoids problems
     when .s1now is still hidden.
  */

  if(
    typeof now.onclick ===
    "function"
  ){

    now.onclick();

    return true;

  }


  /*
     Fallback.
  */

  now.click();

  return true;

}


/* ============================================================
   SHARED LINK STARTUP
   ============================================================ */

function s1StartSharedLink(){

  if(!S1_SHARED_ID)
    return;


  /*
     Make sure the ID actually exists.

     If it doesn't, don't interfere
     with the normal page.
  */

  const item =
    s1FindDataItem(
      S1_SHARED_ID
    );


  if(!item){

    return;

  }


  let openAttempts = 0;

  let opened = false;


  /*
     Wait for the original
     notification system.
  */

  const openTimer =
    setInterval(()=>{

      openAttempts++;


      const drawer =
        document.querySelector(
          ".s1drawer"
        );


      const now =
        document.querySelector(
          ".s1now"
        );


      if(
        drawer &&
        now
      ){

        if(!opened){

          opened =
            s1OpenDrawer();

        }


        /*
           Drawer has now been opened.
        */

        if(opened){

          clearInterval(
            openTimer
          );


          s1WaitForCards();

        }

      }


      /*
         Give up after 15 seconds.
      */

      if(
        openAttempts >= 150
      ){

        clearInterval(
          openTimer
        );

      }

    },100);

}


/* ============================================================
   WAIT FOR DRAWER CARDS
   ============================================================ */

function s1WaitForCards(){

  let attempts = 0;


  const timer =
    setInterval(()=>{

      attempts++;


      /*
         Identify cards and add share
         buttons.
      */

      s1ProcessCards();


      /*
         Try moving shared notification
         to top.
      */

      const success =
        s1MoveSharedToTop();


      if(success){

        clearInterval(timer);

        return;

      }


      /*
         Stop after 15 seconds.
      */

      if(
        attempts >= 150
      ){

        clearInterval(timer);

      }

    },100);

}


/* ============================================================
   NORMAL PAGE SHARE BUTTON SUPPORT
   ============================================================

   The drawer is created dynamically by
   the main notification script.

   We poll lightly instead of using a
   MutationObserver, preventing mutation
   loops and excessive CPU usage.

   ============================================================ */

function s1WatchForNormalDrawer(){

  let attempts = 0;


  const timer =
    setInterval(()=>{

      attempts++;


      const drawer =
        document.querySelector(
          ".s1drawer"
        );


      if(drawer){

        s1ProcessCards();

        /*
           Once the drawer exists, keep
           checking for newly created cards
           for a short period.
        */

        if(attempts >= 120){

          clearInterval(timer);

        }

      }


      /*
         20 seconds maximum.
      */

      if(
        attempts >= 200
      ){

        clearInterval(timer);

      }

    },100);

}


/* ============================================================
   START
   ============================================================ */

(function(){

  function start(){

    /*
       Normal drawer share buttons.
    */

    s1WatchForNormalDrawer();


    /*
       Shared URL behaviour.
    */

    if(S1_SHARED_ID){

      /*
         Tiny delay gives the main
         notification script a chance
         to start.
      */

      setTimeout(
        s1StartSharedLink,
        100
      );

    }

  }


  if(
    document.readyState ===
    "loading"
  ){

    document.addEventListener(
      "DOMContentLoaded",
      start,
      {
        once:true
      }
    );

  }

  else{

    start();

  }

})();
