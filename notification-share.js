/* ============================================================
   SAWANTWADI NOTIFICATION SHARE
   ============================================================

   ?notification=n11

   FEATURES
   ------------------------------------------------------------
   • Share button always stays inside its own card
   • Share button = bottom-right of card
   • Automatically opens shared notification
   • Shared notification moves to top
   • No scrolling
   • Shared notification remains highlighted
   • Normal notifications remain normal
   • Does not change d.link
   • Works with dynamically created notification cards
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
   SHARED ID
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
    document.createElement("style");


  style.id =
    "s1NotificationShareStyle";


  style.textContent = `

    /* ======================================================
       IMPORTANT

       The button is positioned relative to the
       notification card itself.
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

      transform:scale(.82) !important;

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

      z-index:20 !important;

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
   COPIED MESSAGE
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
   SHARE NOTIFICATION
   ============================================================ */

async function s1ShareNotification(id){

  const shareURL =
    s1GetShareURL(id);


  /* Android / browser share sheet */

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
         User cancelled share.
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
      shareURL
    );

    s1ShowCopied();

    return;

  }

  catch(e){}


  /* Old browser fallback */

  const input =
    document.createElement("input");


  input.value =
    shareURL;


  input.style.position =
    "fixed";


  input.style.opacity =
    "0";


  document.body.appendChild(input);


  input.select();


  try{

    document.execCommand("copy");

  }

  catch(e){}


  input.remove();


  s1ShowCopied();

}


/* ============================================================
   ADD BUTTON TO CARD
   ============================================================ */

function s1InstallButton(card,id){

  if(!card)
    return;


  if(!id)
    return;


  /*
     Already installed.
  */

  if(
    card.dataset.s1ShareInstalled ===
    "true"
  ){

    return;

  }


  card.dataset.notificationId =
    String(id);


  card.dataset.s1ShareInstalled =
    "true";


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
     Stop the original card's
     click handler.
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

      s1ShareNotification(id);

    }
  );


  card.appendChild(button);

}


/* ============================================================
   IDENTIFY CARDS
   ============================================================ */

function s1ProcessCards(){

  const drawer =
    document.querySelector(
      ".s1drawer"
    );


  if(!drawer)
    return;


  const data =
    window.Sho1re1Notifications;


  if(
    !Array.isArray(data) ||
    !data.length
  ){

    return;

  }


  const cards =
    Array.from(
      drawer.querySelectorAll(
        ".s1item"
      )
    );


  if(!cards.length)
    return;


  /*
     IMPORTANT:

     At this stage the original notification
     cards are still in their original order.

     So:

     card 0 = data 0
     card 1 = data 1
     card 2 = data 2

     This is much more reliable than matching
     title/message text.
  */

  cards.forEach((card,index)=>{

    if(
      card.dataset.s1ShareInstalled ===
      "true"
    ){

      return;

    }


    const item =
      data[index];


    if(
      !item ||
      !item.id
    ){

      return;

    }


    s1InstallButton(
      card,
      item.id
    );

  });

}


/* ============================================================
   FIND CARD BY ID
   ============================================================ */

function s1FindCardByID(id){

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


  return(
    cards.find(
      card =>
        String(
          card.dataset.notificationId
        ) ===
        String(id)
    ) || null
  );

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
     Make sure cards have IDs first.
  */

  s1ProcessCards();


  const target =
    s1FindCardByID(
      S1_SHARED_ID
    );


  if(!target)
    return false;


  /*
     Don't repeatedly move it.

     This prevents layout/mutation problems.
  */

  if(
    target.dataset.s1SharedMoved !==
    "true"
  ){

    const header =
      drawer.querySelector(
        ".s1header"
      );


    if(header){

      header.after(target);

    }

    else{

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


    target.dataset.s1SharedMoved =
      "true";

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
     Use the original notification
     system's open function.
  */

  if(
    typeof now.onclick ===
    "function"
  ){

    now.onclick();

    return true;

  }


  now.click();

  return true;

}


/* ============================================================
   SHARED LINK
   ============================================================ */

function s1StartSharedLink(){

  if(!S1_SHARED_ID)
    return;


  /*
     Wait until notification system
     creates .s1now and .s1drawer.
  */

  let attempts = 0;


  const timer =
    setInterval(()=>{

      attempts++;


      const now =
        document.querySelector(
          ".s1now"
        );


      const drawer =
        document.querySelector(
          ".s1drawer"
        );


      if(
        now &&
        drawer
      ){

        clearInterval(timer);


        /*
           Open drawer.
        */

        s1OpenDrawer();


        /*
           Wait for notification cards.
        */

        let cardAttempts = 0;


        const cardTimer =
          setInterval(()=>{

            cardAttempts++;


            /*
               Install buttons.
            */

            s1ProcessCards();


            /*
               Put shared card first.
            */

            const done =
              s1MoveSharedToTop();


            if(done){

              clearInterval(
                cardTimer
              );

              return;

            }


            if(
              cardAttempts >= 150
            ){

              clearInterval(
                cardTimer
              );

            }

          },100);

      }


      if(
        attempts >= 150
      ){

        clearInterval(timer);

      }

    },100);

}


/* ============================================================
   NORMAL DRAWER WATCH
   ============================================================ */

function s1WatchDrawer(){

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

      }


      /*
         20 seconds is enough for
         the notification system.
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
       Install normal share buttons.
    */

    s1WatchDrawer();


    /*
       Shared link.
    */

    if(S1_SHARED_ID){

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
