/* Sho1re1 — 2010 Android chaos mode.
   Visual-only retro lag/glitch simulator. No app data or navigation is modified.
   Tap the floating 2010 badge or press Escape to switch it off.
   Add ?android2010=on to re-enable it after opting out.
*/
(() => {
  "use strict";
  const KEY = "sho1re1_android_2010";
  let enabled = true;
  try { enabled = localStorage.getItem(KEY) !== "off"; } catch (_) {}
  try {
    const mode = new URLSearchParams(location.search).get("android2010");
    if (mode === "on") { enabled = true; localStorage.setItem(KEY, "on"); }
    if (mode === "off") { enabled = false; localStorage.setItem(KEY, "off"); }
  } catch (_) {}

  const style = document.createElement("style");
  style.textContent = `
    html.sho2010-on { background:#080b0a !important; }
    html.sho2010-on body {
      filter: contrast(1.035) saturate(.82);
      text-rendering: optimizeSpeed;
      -webkit-font-smoothing: subpixel-antialiased;
    }
    html.sho2010-on body.sho2010-jank {
      animation: sho2010-jank 170ms steps(2,end) both;
    }
    @keyframes sho2010-jank {
      0% { transform:translate(0,0); filter:contrast(1.3) saturate(.55); }
      25% { transform:translate(-1px,1px); }
      55% { transform:translate(1px,0); filter:contrast(.8) hue-rotate(8deg); }
      100% { transform:translate(0,0); }
    }
    #sho2010-noise {
      position:fixed; inset:0; z-index:2147483000; pointer-events:none;
      opacity:.10; mix-blend-mode:screen;
      background:repeating-linear-gradient(to bottom, transparent 0 3px, rgba(180,255,205,.16) 4px, transparent 5px);
      display:none;
    }
    html.sho2010-on #sho2010-noise { display:block; }
    #sho2010-blackout {
      position:fixed; inset:0; z-index:2147483001; background:#000;
      opacity:0; pointer-events:none; transition:opacity 35ms linear;
    }
    #sho2010-blackout.active { opacity:1; pointer-events:auto; }
    #sho2010-glitch {
      position:fixed; inset:0; z-index:2147483002; pointer-events:none; overflow:hidden;
    }
    .sho2010-bar {
      position:absolute; left:-2%; width:104%; height:2px;
      background:rgba(145,255,185,.55); box-shadow:0 0 8px rgba(90,255,150,.45);
      transform:translateX(-2px); opacity:.8;
    }
    #sho2010-switch {
      position:fixed; z-index:2147483003; left:9px; bottom:9px;
      border:1px solid rgba(150,255,185,.55); border-radius:4px;
      background:rgba(10,16,13,.88); color:#a8ffbf;
      padding:6px 8px; font:10px/1.2 monospace; letter-spacing:1px;
      box-shadow:0 2px 8px #0008; opacity:.78; cursor:pointer;
      -webkit-tap-highlight-color:transparent;
    }
    #sho2010-switch:active { transform:translateY(1px); }
    html:not(.sho2010-on) #sho2010-noise,
    html:not(.sho2010-on) #sho2010-blackout,
    html:not(.sho2010-on) #sho2010-glitch { display:none; }
    @media (prefers-reduced-motion: reduce) {
      html.sho2010-on body.sho2010-jank { animation:none; }
    }
  `;
  document.head.appendChild(style);

  const noise = document.createElement("div");
  noise.id = "sho2010-noise";
  const blackout = document.createElement("div");
  blackout.id = "sho2010-blackout";
  const glitch = document.createElement("div");
  glitch.id = "sho2010-glitch";
  const toggle = document.createElement("button");
  toggle.id = "sho2010-switch";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Toggle 2010 Android mode");
  toggle.title = "Tap to switch 2010 Android mode on or off";
  document.body.append(noise, blackout, glitch, toggle);

  let timers = [];
  const later = (fn, min, max) => {
    let id;
    id = setTimeout(() => {
      timers = timers.filter(timer => timer !== id);
      fn();
    }, min + Math.random() * (max - min));
    timers.push(id);
  };
  const clearEffects = () => {
    timers.forEach(clearTimeout);
    timers = [];
    document.body.classList.remove("sho2010-jank");
    blackout.classList.remove("active");
    glitch.replaceChildren();
  };
  const update = () => {
    document.documentElement.classList.toggle("sho2010-on", enabled);
    toggle.textContent = enabled ? "2010 MODE  •  ON" : "2010 MODE  •  OFF";
    toggle.style.color = enabled ? "#a8ffbf" : "#ddd";
    toggle.style.borderColor = enabled ? "rgba(150,255,185,.55)" : "#777";
    if (!enabled) clearEffects();
    else schedule();
    try { localStorage.setItem(KEY, enabled ? "on" : "off"); } catch (_) {}
  };
  const glitchBurst = () => {
    if (!enabled) return;
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const bar = document.createElement("i");
      bar.className = "sho2010-bar";
      bar.style.top = Math.floor(Math.random() * 100) + "%";
      bar.style.height = (1 + Math.random() * 5) + "px";
      bar.style.opacity = (.25 + Math.random() * .6).toFixed(2);
      bar.style.transform = "translateX(" + (Math.random() * 16 - 8) + "px)";
      glitch.appendChild(bar);
    }
    later(() => glitch.replaceChildren(), 65, 170);
  };
  const blackoutBurst = () => {
    if (!enabled) return;
    blackout.classList.add("active");
    later(() => blackout.classList.remove("active"), 90, 260);
  };
  function scheduleJank() {
    if (!enabled) return;
    later(() => {
      if (!enabled) return;
      document.body.classList.add("sho2010-jank");
      later(() => document.body.classList.remove("sho2010-jank"), 100, 240);
      scheduleJank();
    }, 2200, 6200);
  }
  function schedule() {
    if (!enabled) return;
    scheduleJank();
    scheduleGlitch();
    scheduleBlackout();
  }
  function scheduleGlitch() {
    if (enabled) later(() => { glitchBurst(); scheduleGlitch(); }, 6500, 17000);
  }
  function scheduleBlackout() {
    if (enabled) later(() => { blackoutBurst(); scheduleBlackout(); }, 13000, 28000);
  }

  toggle.addEventListener("click", () => { enabled = !enabled; update(); });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && enabled) { enabled = false; update(); }
  });
  update();
})();
