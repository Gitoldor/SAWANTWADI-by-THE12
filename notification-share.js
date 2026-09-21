/* ============================================================
   SAWANTWADI NOTIFICATION SHARE
   ============================================================

   SHARED URL
   ------------------------------------------------------------
   ?notification=n11

   SHARED-LINK BEHAVIOUR
   ------------------------------------------------------------
   1. Page loads
   2. Notification drawer automatically opens
   3. Notification cards are detected
   4. Exact shared notification ID is found
   5. Shared card moves to the TOP
   6. Shared card is highlighted
   7. Drawer scrolls to the TOP
   8. No page scrolling
   9. Works with dynamically generated cards
   10. d.link is never modified

   NORMAL BEHAVIOUR
   ------------------------------------------------------------
   • Normal notifications remain in their normal order
   • Share button remains inside its own card
   ============================================================ */


/* ============================================================
   CONFIG
   ============================================================ */

const S1_SHARE_PARAM =
  "notification";

const S1_SHARE_BUTTON_CLASS =
  "s1ShareButton";

const S1_SHARED_CLASS =
  "s1SharedNotification";


/* ============================================================
   READ SHARED NOTIFICATION ID
   ============================================================ */

function s1GetSharedID(){

  try{

    const params =
      new URLSearchParams(
        window.location.search
      );

    const id =
      params.get(
        S1_SHARE_PARAM
      );

    if(
      id === null ||
      id === ""
    ){

      return null;

    }


    return String(id);

  }

  catch(error){

    return null;

  }

}


const S1_SHARED_ID =
  s1GetSharedID();


/* ============================================================
   STYLE
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
    document.createElement(
      "style"
    );


  style.id =
    "s1NotificationShareStyle";


  style.textContent = `

    /* ======================================================
       NOTIFICATION CARD
       ====================================================== */

    .s1item{

      position:relative !important;

    }


    /* ======================================================
       SHARE BUTTON
       ====================================================== */

    .${S1_SHARE_BUTTON_CLASS}{

      position:absolute !important;

      right:16px !important;

      bottom:16px !important;

      left:auto !important;

      top:auto !important;

      width:42px !important;

      height:42px !important;

      min-width:42px !important;

      min-height:42px !important;

      max-width:42px !important;

      max-height:42px !important;

      margin:0 !important;

      padding:0 !important;

      border:0 !important;

      border-radius:50% !important;

      display:grid !important;

      place-items:center !important;

      background:#ffffffe8 !important;

      color:#111 !important;

      backdrop-filter:blur(12px);

      -webkit-backdrop-filter:blur(12px);

      box-shadow:
        0 8px 25px #0002;

      cursor:pointer;

      z-index:100 !important;

      overflow:hidden;

      -webkit-tap-highlight-color:transparent;

      transform:none;

      transition:
        transform .25s
        cubic-bezier(.18,1.5,.3,1);

    }


    .${S1_SHARE_BUTTON_CLASS}:active{

      transform:
        scale(.82) !important;

    }


    .${S1_SHARE_BUTTON_CLASS} svg{

      width:19px !important;

      height:19px !important;

      min-width:19px !important;

      min-height:19px !important;

      display:block !important;

      fill:none !important;

      stroke:currentColor !important;

      stroke-width:2 !important;

      stroke-linecap:round !important;

      stroke-linejoin:round !important;

      pointer-events:none;

    }


    /* ======================================================
       SHARED NOTIFICATION
       ====================================================== */

    .${S1_SHARED_CLASS}{

      position:relative !important;

      z-index:50 !important;

      box-shadow:
        0 0 0 3px #111,
        0 18px 50px #0003 !important;

      transform:
        scale(1.015) !important;

    }


    /* ======================================================
       COPIED MESSAGE
       ====================================================== */

    .s1ShareCopied{

      position:fixed;

      left:50%;

      bottom:25px;

      transform:
        translate(-50%,20px)
        scale(.9);

      z-index:999999;

      padding:10px 16px;

      border-radius:999px;

      background:#111;

      color:#fff;

      font:600 13px system-ui;

      opacity:0;

      pointer-events:none;

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


  document.head.appendChild(
    style
  );

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
   CREATE SHARE URL
   ============================================================ */

function s1GetShareURL(id){

  const url =
    new URL(
      window.location.href
    );


  url.searchParams.set(
    S1_SHARE_PARAM,
    String(id)
  );


  /*
     Never carry the current hash.
  */

  url.hash = "";


  return url.toString();

}


/* ============================================================
   COPIED MESSAGE
   ============================================================ */

function s1ShowCopied(){

  let box =
    document.querySelector(
      ".s1ShareCopied"
    );


  if(!box){

    box =
      document.createElement(
        "div"
      );


    box.className =
      "s1ShareCopied";


    box.textContent =
      "Link copied";


    document.body.appendChild(
      box
    );

  }


  box.classList.add(
    "show"
  );


  clearTimeout(
    box._timer
  );


  box._timer =
    setTimeout(()=>{

      box.classList.remove(
        "show"
      );

    },1800);

}


/* ============================================================
   SHARE NOTIFICATION
   ============================================================ */

async function s1ShareNotification(id){

  const shareURL =
    s1GetShareURL(id);


  /* ========================================================
     NATIVE SHARE
     ======================================================== */

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

        url:
          shareURL

      });


      return;

    }

    catch(error){

      /*
         User cancelled the share sheet.
      */

      if(
        error &&
        error.name ===
        "AbortError"
      ){

        return;

      }

    }

  }


  /* ========================================================
     CLIPBOARD
     ======================================================== */

  try{

    await navigator.clipboard.writeText(
      shareURL
    );


    s1ShowCopied();


    return;

  }

  catch(error){}


  /* ========================================================
     OLD BROWSER FALLBACK
     ======================================================== */

  const input =
    document.createElement(
      "input"
    );


  input.value =
    shareURL;


  input.style.position =
    "fixed";


  input.style.opacity =
    "0";


  document.body.appendChild(
    input
  );


  input.select();


  try{

    document.execCommand(
      "copy"
    );

  }

  catch(error){}


  input.remove();


  s1ShowCopied();

}


/* ============================================================
   INSTALL SHARE BUTTON
   ============================================================ */

function s1InstallButton(
  card,
  id
){

  if(!card)
    return;


  if(
    id === undefined ||
    id === null ||
    id === ""
  ){

    return;

  }


  /*
     Always remember the notification ID.
  */

  card.dataset.notificationId =
    String(id);


  /*
     Don't create duplicate buttons.
  */

  if(
    card.querySelector(
      "." +
      S1_SHARE_BUTTON_CLASS
    )
  ){

    return;

  }


  const button =
    document.createElement(
      "button"
    );


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


  /* ========================================================
     POINTER
     ======================================================== */

  button.addEventListener(
    "pointerdown",
    event=>{

      event.stopPropagation();

    },
    {
      passive:true
    }
  );


  /* ========================================================
     TOUCH
     ======================================================== */

  button.addEventListener(
    "touchstart",
    event=>{

      event.stopPropagation();

    },
    {
      passive:true
    }
  );


  /* ========================================================
     CLICK
     ======================================================== */

  button.addEventListener(
    "click",
    event=>{

      event.preventDefault();

      event.stopPropagation();


      s1ShareNotification(
        String(id)
      );

    }
  );


  card.appendChild(
    button
  );

}


/* ============================================================
   GET NOTIFICATION DATA
   ============================================================ */

function s1GetNotificationData(){

  const data =
    window.Sho1re1Notifications;


  if(
    !Array.isArray(data)
  ){

    return [];

  }


  return data;

}


/* ============================================================
   PROCESS NOTIFICATION CARDS
   ============================================================ */

function s1ProcessCards(){

  const drawer =
    document.querySelector(
      ".s1drawer"
    );


  if(!drawer)
    return;


  const data =
    s1GetNotificationData();


  if(!data.length)
    return;


  const cards =
    Array.from(
      drawer.querySelectorAll(
        ".s1item"
      )
    );


  if(!cards.length)
    return;


  /*
     IMPORTANT

     The notification renderer normally
     creates cards in the same order as
     Sho1re1Notifications.

     We only assign IDs here.

     We DO NOT reorder anything here.
  */

  let dataIndex = 0;


  cards.forEach(card=>{

    /*
       Already identified.
    */

    if(
      card.dataset.notificationId
    ){

      return;

    }


    /*
       Find next valid data item.
    */

    while(
      dataIndex < data.length &&
      (
        !data[dataIndex] ||
        data[dataIndex].id === undefined ||
        data[dataIndex].id === null
      )
    ){

      dataIndex++;

    }


    const item =
      data[dataIndex];


    if(!item){

      return;

    }


    s1InstallButton(
      card,
      item.id
    );


    dataIndex++;

  });

}


/* ============================================================
   FIND SHARED CARD
   ============================================================ */

function s1FindSharedCard(){

  if(!S1_SHARED_ID)
    return null;


  const drawer =
    document.querySelector(
      ".s1drawer"
    );


  if(!drawer)
    return null;


  /*
     First make sure cards have IDs.
  */

  s1ProcessCards();


  const cards =
    Array.from(
      drawer.querySelectorAll(
        ".s1item"
      )
    );


  for(
    let i = 0;
    i < cards.length;
    i++
  ){

    const card =
      cards[i];


    if(
      String(
        card.dataset.notificationId
      ) ===
      String(
        S1_SHARED_ID
      )
    ){

      return card;

    }

  }


  return null;

}


/* ============================================================
   MOVE SHARED CARD TO TOP
   ============================================================ */

function s1MoveSharedCardToTop(){

  const drawer =
    document.querySelector(
      ".s1drawer"
    );


  if(!drawer)
    return false;


  const target =
    s1FindSharedCard();


  if(!target)
    return false;


  /*
     Remove previous shared highlight.
  */

  drawer
    .querySelectorAll(
      "." +
      S1_SHARED_CLASS
    )
    .forEach(card=>{

      if(card !== target){

        card.classList.remove(
          S1_SHARED_CLASS
        );

      }

    });


  /* ========================================================
     FIND THE CORRECT TOP POSITION
     ======================================================== */

  const header =
    drawer.querySelector(
      ".s1header"
    );


  const handle =
    drawer.querySelector(
      ".s1handle"
    );


  /*
     Header gets priority.
  */

  if(header){

    /*
       Don't move if already directly
       underneath the header.
    */

    if(
      target.previousElementSibling !==
      header
    ){

      header.after(
        target
      );

    }

  }

  /*
     Otherwise use handle.
  */

  else if(handle){

    if(
      target.previousElementSibling !==
      handle
    ){

      handle.after(
        target
      );

    }

  }

  /*
     Otherwise place at beginning.
  */

  else{

    if(
      drawer.firstElementChild !==
      target
    ){

      drawer.prepend(
        target
      );

    }

  }


  /* ========================================================
     HIGHLIGHT
     ======================================================== */

  target.classList.add(
    S1_SHARED_CLASS
  );


  /*
     Make sure drawer itself is
     positioned at the top.

     This scrolls ONLY the drawer.
  */

  requestAnimationFrame(()=>{

    drawer.scrollTo({

      top:0,

      behavior:
        "smooth"

    });

  });


  return true;

}


/* ============================================================
   CHECK WHETHER DRAWER IS VISUALLY OPEN
   ============================================================ */

function s1IsDrawerOpen(){

  const drawer =
    document.querySelector(
      ".s1drawer"
    );


  if(!drawer)
    return false;


  /*
     Common hidden states.
  */

  const style =
    window.getComputedStyle(
      drawer
    );


  if(
    style.display ===
    "none"
  ){

    return false;

  }


  if(
    style.visibility ===
    "hidden"
  ){

    return false;

  }


  if(
    parseFloat(
      style.opacity
    ) === 0
  ){

    return false;

  }


  /*
     If it has dimensions, consider
     it available/open.
  */

  const rect =
    drawer.getBoundingClientRect();


  return(
    rect.width > 0 &&
    rect.height > 0
  );

}


/* ============================================================
   OPEN DRAWER
   ============================================================ */

function s1OpenDrawer(){

  /*
     If drawer exists and is already
     visibly open, don't click again.
  */

  if(
    s1IsDrawerOpen()
  ){

    return true;

  }


  const now =
    document.querySelector(
      ".s1now"
    );


  if(!now)
    return false;


  /*
     Use the original notification
     button's click behaviour.
  */

  try{

    now.click();

    return true;

  }

  catch(error){}


  /*
     Fallback to onclick if needed.
  */

  if(
    typeof now.onclick ===
    "function"
  ){

    try{

      now.onclick();

      return true;

    }

    catch(error){}

  }


  return false;

}


/* ============================================================
   OPEN DRAWER + FIND SHARED CARD
   ============================================================ */

function s1StartSharedLink(){

  if(!S1_SHARED_ID)
    return;


  let attempts = 0;


  const MAX_ATTEMPTS =
    300;


  const timer =
    setInterval(()=>{

      attempts++;


      const drawer =
        document.querySelector(
          ".s1drawer"
        );


      const now =
        document.querySelector(
          ".s1now"
        );


      /*
         =====================================================
         STEP 1
         MAKE SURE DRAWER IS OPEN
         =====================================================
      */

      if(
        !drawer ||
        !s1IsDrawerOpen()
      ){

        if(now){

          s1OpenDrawer();

        }


        if(
          attempts >=
          MAX_ATTEMPTS
        ){

          clearInterval(
            timer
          );

        }


        return;

      }


      /*
         =====================================================
         STEP 2
         CARDS ARE NOW AVAILABLE
         =====================================================
      */

      s1ProcessCards();


      /*
         =====================================================
         STEP 3
         FIND EXACT SHARED CARD
         =====================================================
      */

      const target =
        s1FindSharedCard();


      if(!target){

        if(
          attempts >=
          MAX_ATTEMPTS
        ){

          clearInterval(
            timer
          );

        }


        return;

      }


      /*
         =====================================================
         STEP 4
         MOVE EXACT CARD TO TOP
         =====================================================
      */

      const moved =
        s1MoveSharedCardToTop();


      if(moved){

        clearInterval(
          timer
        );

        return;

      }


      if(
        attempts >=
        MAX_ATTEMPTS
      ){

        clearInterval(
          timer
        );

      }

    },50);

}


/* ============================================================
   NORMAL DYNAMIC CARD WATCH
   ============================================================ */

function s1WatchDrawer(){

  const observer =
    new MutationObserver(()=>{

      const drawer =
        document.querySelector(
          ".s1drawer"
        );


      if(drawer){

        s1ProcessCards();

      }

    });


  observer.observe(
    document.documentElement,
    {
      childList:true,
      subtree:true
    }
  );


  /*
     Process drawer if it already exists.
  */

  const drawer =
    document.querySelector(
      ".s1drawer"
    );


  if(drawer){

    s1ProcessCards();

  }

}


/* ============================================================
   START
   ============================================================ */

(function(){

  function start(){

    /*
       Always watch notification cards.
    */

    s1WatchDrawer();


    /*
       Shared URL behaviour.
    */

    if(S1_SHARED_ID){

      /*
         Give the main notification
         system a tiny amount of time
         to initialize.

         Then automatically open
         the drawer and locate the card.
      */

      setTimeout(()=>{

        s1StartSharedLink();

      },100);

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