(()=>{

const DATA="notificationdata.js",
      START=2000,
      INTERVAL=1000,
      MAX=3;


/* =========================
   LOAD DATA
========================= */

function load(){

  if(window.Sho1re1Notifications)return start();

  const s=document.createElement("script");

  s.src=DATA;
  s.onload=start;

  document.head.append(s);

}


/* =========================
   STYLE
========================= */

const style=document.createElement("style");

style.textContent=`

*{
  -webkit-tap-highlight-color:transparent;
  box-sizing:border-box;
}


/* =========================
   FLOATING AREA
========================= */

.s1n{
  position:fixed;

  top:20px;
  left:12px;
  right:12px;

  z-index:999;

  pointer-events:none;

  transition:
    .5s cubic-bezier(.2,1.5,.3,1);
}


.s1stack{

  position:relative;

  width:100%;

  aspect-ratio:16/9;

  pointer-events:auto;
}


/* =========================
   CARD
========================= */

.s1card,
.s1item{

  position:relative;

  box-sizing:border-box;

  aspect-ratio:16/9;

  padding:10px;

  overflow:hidden;

  border-radius:24px;

  background:#fff;

  box-shadow:
    0 18px 50px #0002;

  cursor:pointer;

  transform-origin:center;
}


/* =========================
   FLOATING CARD
========================= */

.s1card{

  position:absolute;

  inset:0;

  opacity:0;

  will-change:
    transform,
    opacity;
}


.s1card.enter{

  animation:
    drop .7s
    cubic-bezier(.16,1.65,.3,1)
    both;
}


@keyframes drop{

  0%{

    opacity:0;

    transform:
      translateY(-130px)
      scale(.78)
      rotate(-5deg);
  }

  60%{

    opacity:1;

    transform:
      translateY(8px)
      scale(1.025)
      rotate(1deg);
  }

  80%{

    transform:
      translateY(-3px)
      scale(.995);
  }

  100%{

    opacity:1;

    transform:none;
  }

}


/* =========================
   INNER IMAGE
========================= */

.s1image{

  position:relative;

  width:100%;
  height:100%;

  overflow:hidden;

  border-radius:17px;

  background:#eee;
}


.s1image img{

  width:100%;
  height:100%;

  display:block;

  object-fit:cover;

  transform:scale(1.07);

  transition:
    1s cubic-bezier(.2,1,.3,1);
}


.s1card.enter img,
.s1item.show img{

  transform:scale(1);
}


/* =========================
   OVERLAY
========================= */

.s1text{

  position:absolute;

  inset:0;

  padding:16px;

  box-sizing:border-box;

  display:flex;

  flex-direction:column;

  align-items:flex-start;

  color:#fff;

  background:
    linear-gradient(
      #000a,
      transparent 60%
    );
}


/* =========================
   TITLE
========================= */

.s1title{

  font:
    750 18px system-ui;

  text-decoration:underline;

  text-underline-offset:5px;

  opacity:0;

  transform:
    translateY(-12px);
}


/* =========================
   MESSAGE
========================= */

.s1msg{

  margin-top:7px;

  font:
    14px system-ui;

  opacity:0;

  transform:
    translateY(-10px);
}


/* =========================
   TEXT ARRIVAL
========================= */

.enter .s1title,
.show .s1title{

  animation:
    text .45s
    cubic-bezier(.18,1.5,.3,1)
    .16s forwards;
}


.enter .s1msg,
.show .s1msg{

  animation:
    text .45s
    cubic-bezier(.18,1.5,.3,1)
    .25s forwards;
}


@keyframes text{

  to{

    opacity:1;

    transform:none;
  }

}


/* =========================
   PRESS
========================= */

.s1card:active,
.s1item:active{

  scale:.97;
}


/* ==================================================
   FLOATING ROUNDED BUTTON
   EDIT POSITION HERE
================================================== */

.s1trigger{

  /* ===== POSITION ===== */

  top:47%;
  right:20px;

  /* =================== */

  position:fixed;

  z-index:1002;

  width:58px;
  height:58px;

  padding:0;

  border:0;

  border-radius:24px;

  background:#fff;

  box-shadow:
    0 8px 25px #0002;

  display:flex;

  align-items:center;

  justify-content:center;

  cursor:pointer;

  opacity:0;

  pointer-events:none;

  transform:
    translateY(-50%)
    translateX(25px)
    scale(.8);

  transition:
    .55s
    cubic-bezier(.18,1.5,.3,1);
}


.s1trigger.show{

  opacity:1;

  pointer-events:auto;

  transform:
    translateY(-50%)
    translateX(0)
    scale(1);
}


/* =========================
   BUTTON ICON
========================= */

.s1trigger svg{

  width:21px;
  height:21px;

  fill:none;

  stroke:#111;

  stroke-width:1.8;

  stroke-linecap:round;

  stroke-linejoin:round;
}


/* =========================
   NOTIFICATION DOT
========================= */

.s1trigger span{

  position:absolute;

  top:6px;
  right:6px;

  width:7px;
  height:7px;

  border-radius:50%;

  background:#111;

  animation:
    pulse 1.5s infinite;
}


/* =========================
   BUTTON PRESS
========================= */

.s1trigger:active{

  transform:
    translateY(-50%)
    scale(.9);
}


/* =========================
   PULSE
========================= */

@keyframes pulse{

  50%{

    transform:scale(1.5);

    opacity:.45;
  }

}


/* =========================
   SUBTLE HINT
========================= */

.s1hint{

  position:fixed;

  top:50%;
  right:76px;

  z-index:998;

  transform:
    translateY(-50%);

  font:
    12px system-ui;

  color:#777;

  pointer-events:none;

  opacity:0;

  white-space:nowrap;

  transition:.4s;
}


.s1hint.show{

  opacity:.75;

  animation:
    hint 1.8s
    ease-in-out
    infinite;
}


@keyframes hint{

  50%{

    transform:
      translateY(
        calc(-50% + 5px)
      );
  }

}


/* =========================
   BACKDROP
========================= */

.s1back{

  position:fixed;

  inset:0;

  z-index:1000;

  background:transparent;

  backdrop-filter:none;

  opacity:0;

  pointer-events:none;

  transition:.3s;
}


/* =========================
   DRAWER
========================= */

.s1drawer{

  position:fixed;

  top:10px;
  left:10px;

  width:95%;
  height:58.5vh;

  padding:
    calc(env(safe-area-inset-top,0px) + 8px)
    12px
    30px;

  box-sizing:border-box;

  overflow-y:auto;

  overscroll-behavior:contain;

  background:#fff;

  border-radius:40px;

  z-index:1001;

  transform:
    translateY(-105%)
    scale(.97);

  transform-origin:top;

  transition:
    transform .65s
    cubic-bezier(.16,1.6,.3,1);
}


.s1drawer.open{

  transform:none;
}


.s1drawer.drag{

  transition:none;
}


/* =========================
   DRAWER HANDLE
========================= */

.s1handle{

  width:55px;
  height:32px;

  margin:auto;

  display:grid;

  place-items:center;

  touch-action:none;
}


.s1handle:after{

  content:"";

  width:42px;
  height:5px;

  border-radius:99px;

  background:#ddd;
}


/* =========================
   DRAWER HEADER
========================= */

.s1header{

  position:relative;

  min-height:82px;

  margin:
    5px 4px 18px;

  padding-right:105px;

  box-sizing:border-box;
}


/* =========================
   HEADER TITLE
========================= */

.s1head{

  margin:
    5px 0 4px;

  font:
    750 24px system-ui;

  line-height:1.1;
}


/* =========================
   SUBTITLE
========================= */

.s1sub{

  font:
    14px system-ui;

  color:#777;

  line-height:1.3;
}


/* =========================
   LIVE DATE
========================= */

.s1date{

  position:absolute;

  top:0;
  right:0;

  width:88px;

  display:flex;

  flex-direction:column;

  align-items:flex-end;

  text-align:right;

  color:#111;

  line-height:1;

  pointer-events:none;

  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}


/* =========================
   MONTH
========================= */

.s1month{

  font-size:10px;

  font-weight:750;

  letter-spacing:1.2px;

  text-transform:uppercase;

  margin-bottom:3px;
}


/* =========================
   BIG DATE
========================= */

.s1daynum{

  font-size:42px;

  font-weight:900;

  letter-spacing:-2px;

  line-height:.9;
}


/* =========================
   DAY
========================= */

.s1weekday{

  margin-top:6px;

  font-size:11px;

  font-weight:750;

  letter-spacing:.8px;

  text-transform:uppercase;
}


/* =========================
   DRAWER CARD
========================= */

.s1item{

  width:100%;

  margin-bottom:14px;

  opacity:0;

  transform:
    translateY(-35px)
    scale(.94);

  transition:
    .55s
    cubic-bezier(.18,1.5,.3,1);
}


.s1item.show{

  opacity:1;

  transform:none;
}


/* =========================
   REDUCED MOTION
========================= */

@media(prefers-reduced-motion:reduce){

  *,
  *:before,
  *:after{

    animation-duration:.01ms!important;

    transition-duration:.01ms!important;
  }

}

`;

document.head.append(style);


/* =========================
   CREATE CARD
========================= */

function card(d,cls){

  const el=
    document.createElement("div");

  el.className=cls;

  el.innerHTML=`

    <div class="s1image">

      <img
        src="${d.image||""}"
        alt=""
      >

      <div class="s1text">

        <div class="s1title">
          ${d.title||""}
        </div>

        <div class="s1msg">
          ${d.message||""}
        </div>

      </div>

    </div>

  `;


  el.onclick=()=>{

    if(d.link)
      location.href=d.link;

  };


  return el;

}


/* =========================
   START
========================= */

function start(){

  /* =========================
     NOTIFICATION SOUND
  ========================= */

  const notifyAudio=
    new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3"
    );


  notifyAudio.volume=.05;


  function playNotificationSound(){

    notifyAudio.currentTime=0;

    notifyAudio.play().catch(()=>{});

  }


  const data=
    window.Sho1re1Notifications;


  if(!data?.length)return;


  /* =========================
     CREATE ELEMENTS
  ========================= */

  const root=
    document.createElement("div");

  const stack=
    document.createElement("div");

  const trigger=
    document.createElement("button");

  const hint=
    document.createElement("div");

  const back=
    document.createElement("div");

  const drawer=
    document.createElement("div");


  root.className="s1n";

  stack.className="s1stack";

  trigger.className="s1trigger";

  hint.className="s1hint";

  back.className="s1back";

  drawer.className="s1drawer";


  /* =========================
     TRIGGER ICON
  ========================= */

  trigger.setAttribute(
    "aria-label",
    "Open updates"
  );


  trigger.innerHTML=`

    <svg viewBox="0 0 24 24">

      <path d="
        M18 8
        a6 6 0 0 0-12 0
        c0 7-3 7-3 9
        h18
        c0-2-3-2-3-9
        M10 21h4
      ">

      </path>

    </svg>

    <span></span>

  `;


  root.append(stack);


  hint.textContent=
    "Updates";


  document.body.append(
    root,
    trigger,
    hint,
    back,
    drawer
  );


  /* =========================
     STATE
  ========================= */

  const cards=[];


  let opened=false,
      sy=0,
      pulling=false;


  /* =========================
     STACK
  ========================= */

  function update(){

    cards.forEach((c,i)=>{

      const n=
        Math.min(
          i,
          MAX-1
        );


      c.style.zIndex=
        20-i;


      c.style.opacity=
        i<MAX?1:0;


      if(
        !c.classList.contains("enter")
      ){

        c.style.transform=`

          translateY(${n*11}px)

          scale(${1-n*.035})

          rotate(${n*.7}deg)

        `;

      }

    });

  }


  /* =========================
     SHOW HIGHLIGHTS
  ========================= */

  setTimeout(()=>{

    data.forEach((d,i)=>{

      setTimeout(()=>{

        const c=
          card(
            d,
            "s1card"
          );


        cards.unshift(c);

        stack.prepend(c);


        /* SOUND */

        playNotificationSound();


        requestAnimationFrame(()=>{

          c.classList.add("enter");

          update();

        });


        setTimeout(()=>{

          c.classList.remove("enter");

          update();

        },750);


        /* REACT STACK */

        cards
          .slice(1,MAX)
          .forEach(x=>{

            x.animate(

              [

                {
                  transform:
                    x.style.transform
                },

                {
                  transform:
                    "translateY(20px) scale(.97)"
                },

                {
                  transform:
                    x.style.transform
                }

              ],

              {

                duration:400,

                easing:
                  "cubic-bezier(.18,1.5,.3,1)"

              }

            );

          });


      },i*INTERVAL);

    });


    /* =========================
       COLLAPSE
    ========================= */

    const end=
      data.length*
      INTERVAL+
      700;


    setTimeout(()=>{

      root.animate(

        [

          {
            opacity:1,

            transform:
              "translateY(0) scale(1)"
          },

          {
            opacity:0,

            transform:
              "translateY(-20px) scale(.75)"
          }

        ],

        {

          duration:500,

          easing:
            "cubic-bezier(.2,1.5,.3,1)"

        }

      );


      setTimeout(()=>{

        root.style.display="none";


        /* SHOW BUTTON */

        trigger.classList.add("show");

        hint.classList.add("show");

      },450);


    },end);


  },START);


  /* =========================
     LIVE DATE
  ========================= */

  function updateDate(){

    const month=
      drawer.querySelector(
        ".s1month"
      );

    const daynum=
      drawer.querySelector(
        ".s1daynum"
      );

    const weekday=
      drawer.querySelector(
        ".s1weekday"
      );


    if(!month)return;


    const today=
      new Date();


    month.textContent=
      today.toLocaleDateString(
        "en-IN",
        {
          month:"long"
        }
      );


    daynum.textContent=
      today.getDate();


    weekday.textContent=
      today.toLocaleDateString(
        "en-IN",
        {
          weekday:"long"
        }
      );

  }


  /* =========================
     BUILD DRAWER
  ========================= */

  function build(){

    drawer.innerHTML=`

      <div class="s1handle"></div>

      <div class="s1header">

        <div>

          <div class="s1head">
            Sawantwadi on
          </div>

          <div class="s1sub">
            What's happening around today
          </div>

        </div>


        <div class="s1date">

          <div class="s1month"></div>

          <div class="s1daynum"></div>

          <div class="s1weekday"></div>

        </div>

      </div>

    `;


    /* =========================
       DATE
    ========================= */

    updateDate();


    /* =========================
       LIVE DATE TIMER
    ========================= */

    if(!window.Sho1re1DateTimer){

      window.Sho1re1DateTimer=
        setInterval(
          updateDate,
          1000
        );

    }


    /* =========================
       CARDS
    ========================= */

    data.forEach((d,i)=>{

      const item=
        card(
          d,
          "s1item"
        );


      drawer.append(item);


      setTimeout(

        ()=>item.classList.add("show"),

        100+i*80

      );

    });


    /* =========================
       HANDLE
    ========================= */

    const handle=
      drawer.querySelector(
        ".s1handle"
      );


    handle.addEventListener(
      "touchstart",
      closeStart,
      {passive:true}
    );


    handle.addEventListener(
      "touchmove",
      closeMove,
      {passive:true}
    );


    handle.addEventListener(
      "touchend",
      closeEnd,
      {passive:true}
    );

  }


  /* =========================
     OPEN
  ========================= */

  function open(){

    if(opened)return;


    opened=true;


    build();


    trigger.classList.remove(
      "show"
    );

    hint.classList.remove(
      "show"
    );


    back.style.opacity=1;

    back.style.pointerEvents=
      "auto";


    requestAnimationFrame(
      ()=>{
        drawer.classList.add(
          "open"
        );
      }
    );

  }


  /* =========================
     CLOSE
  ========================= */

  function close(){

    if(!opened)return;


    opened=false;


    drawer.classList.remove(
      "open"
    );


    back.style.opacity=0;

    back.style.pointerEvents=
      "none";


    trigger.classList.add(
      "show"
    );

    hint.classList.add(
      "show"
    );

  }


  /* =========================
     TAP BUTTON
  ========================= */

  trigger.onclick=open;


  /* =========================
     PULL FROM TOP
  ========================= */

  document.addEventListener(

    "touchstart",

    e=>{

      const t=
        e.touches[0];


      if(

        !opened

        &&

        t.clientY<90

      ){

        sy=
          t.clientY;

        pulling=true;

      }

    },

    {passive:true}

  );


  document.addEventListener(

    "touchmove",

    e=>{

      if(!pulling)return;


      const dy=
        e.touches[0].clientY-
        sy;


      if(dy<=0)return;


      const h=
        drawer.offsetHeight;


      const p=
        Math.min(dy,h)/h;


      drawer.classList.add(
        "drag"
      );


      drawer.style.transform=

        `translateY(${-h+h*p}px)
         scale(${.97+p*.03})`;


      back.style.opacity=
        p*.6;

    },

    {passive:true}

  );


  document.addEventListener(

    "touchend",

    ()=>{

      if(!pulling)return;


      pulling=false;


      drawer.classList.remove(
        "drag"
      );


      const top=
        drawer
          .getBoundingClientRect()
          .top;


      drawer.style.transform="";


      if(
        top>
        -drawer.offsetHeight*.55
      ){

        open();

      }

      else{

        back.style.opacity=0;

      }

    }

  );


  /* =========================
     CLOSE HANDLE
  ========================= */

  let cy=0,
      cm=0;


  function closeStart(e){

    cy=
      e.touches[0].clientY;

    cm=0;


    drawer.classList.add(
      "drag"
    );

  }


  function closeMove(e){

    cm=
      e.touches[0].clientY-
      cy;


    if(cm>=0)return;


    drawer.style.transform=
      `translateY(${cm}px)`;

  }


  function closeEnd(){

    drawer.classList.remove(
      "drag"
    );


    if(cm<-80){

      drawer.style.transform="";

      close();

    }

    else{

      drawer.style.transform="";

      drawer.classList.add(
        "open"
      );

    }

  }


  /* =========================
     BACKDROP
  ========================= */

  back.onclick=close;

}


load();

})();