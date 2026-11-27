/* Sho1re1 MAX discovery — subtle upgrade teaser for non-MAX users.
   Paid feature gates remain in their own modules; this is discovery UI only. */
(function () {
  "use strict";
  if (window.__sho1re1MaxDiscovery) return;
  window.__sho1re1MaxDiscovery = true;

  const style = document.createElement("style");
  style.textContent = `
    #sho-max-tease{position:fixed;left:50%;bottom:calc(92px + env(safe-area-inset-bottom));transform:translate(-50%,14px) scale(.96);z-index:1000001;display:none;align-items:center;gap:9px;padding:10px 15px 10px 11px;border:1px solid rgba(255,255,255,.55);border-radius:999px;background:rgba(17,19,23,.88);color:#fff;box-shadow:0 9px 30px #0005;backdrop-filter:blur(18px);font:750 11px Inter,system-ui,sans-serif;letter-spacing:.04em;white-space:nowrap;opacity:0;transition:opacity .28s ease,transform .35s cubic-bezier(.2,.8,.2,1)}
    #sho-max-tease.show{display:flex;opacity:1;transform:translate(-50%,0) scale(1)}
    #sho-max-tease .max-gem{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;background:linear-gradient(145deg,#f7df9b,#bd8733);color:#17120a;font-size:13px}
    #sho-max-panel{position:fixed;inset:0;z-index:1000004;display:flex;align-items:flex-end;justify-content:center;background:#0007;opacity:0;pointer-events:none;transition:opacity .25s ease}
    #sho-max-panel.open{opacity:1;pointer-events:auto}
    #sho-max-panel[hidden]{display:none}
    #sho-max-panel .sheet{width:100%;max-width:520px;padding:23px 21px calc(24px + env(safe-area-inset-bottom));border-radius:27px 27px 0 0;background:#f8f8fa;color:#151515;transform:translateY(24px);transition:transform .32s cubic-bezier(.2,.8,.2,1);font-family:Inter,system-ui,sans-serif}
    #sho-max-panel.open .sheet{transform:translateY(0)}
    #sho-max-panel .eyebrow{font-size:10px;font-weight:850;letter-spacing:.16em;color:#9a762f}
    #sho-max-panel h2{margin:8px 0 5px;font-size:28px;letter-spacing:-1.2px}
    #sho-max-panel .sub{margin:0 0 17px;color:#777;font-size:12px;line-height:1.55}
    #sho-max-panel .feature{display:flex;gap:12px;align-items:center;padding:12px 0;border-top:1px solid #e8e8eb}
    #sho-max-panel .ico{width:36px;height:36px;display:grid;place-items:center;border-radius:12px;background:#ececf0;font-size:17px}
    #sho-max-panel .feature b{display:block;font-size:13px}
    #sho-max-panel .feature small{display:block;margin-top:3px;color:#85858c;font-size:11px}
    #sho-max-panel .actions{display:flex;gap:10px;margin-top:17px}
    #sho-max-panel button{min-height:46px;border:0;border-radius:14px;font:750 12px Inter,sans-serif}
    #sho-max-panel .upgrade{flex:1;background:#151515;color:white}
    #sho-max-panel .close{width:82px;background:#e9e9ed;color:#333}
    @media(prefers-reduced-motion:reduce){#sho-max-tease,#sho-max-panel,#sho-max-panel .sheet{transition:none}}
  `;
  document.head.appendChild(style);

  const teaser = document.createElement("button");
  teaser.id = "sho-max-tease"; teaser.type = "button";
  teaser.innerHTML = '<span class="max-gem">✦</span><span>DISCOVER MAX</span><span aria-hidden="true">↗</span>';
  document.body.appendChild(teaser);
  const panel = document.createElement("div");
  panel.id = "sho-max-panel"; panel.hidden = true;
  panel.innerHTML = '<section class="sheet" role="dialog" aria-modal="true" aria-label="Discover MAX"><div class="eyebrow">THE NEXT LEVEL</div><h2>Meet Sho1re1 MAX.</h2><p class="sub">Everything in PRO, plus powerful extras for exploring and saving Sawantwadi.</p><div class="feature"><span class="ico">🚘</span><span><b>MAX Drive Mode</b><small>Explore with a road-following car and joystick.</small></span></div><div class="feature"><span class="ico">☁</span><span><b>Cloud Saved Posts</b><small>Keep your saved posts linked to your account across devices.</small></span></div><div class="feature"><span class="ico">✦</span><span><b>Exclusive MAX identity</b><small>Extra profile and marker customization.</small></span></div><div class="feature"><span class="ico">＋</span><span><b>All PRO features included</b><small>MAX includes the PRO experience too.</small></span></div><div class="actions"><button class="upgrade" type="button">EXPLORE MAX · ₹20 / 30 DAYS</button><button class="close" type="button">CLOSE</button></div></section>';
  document.body.appendChild(panel);
  const sheet = panel.querySelector(".sheet");
  function isMax() {
    const p = window.Sho1re1Pro;
    return !!(p && p.getCached() === true && /MAX/i.test(String(p.getPlanId() || "")));
  }
  function sync() {
    const visible = document.body.classList.contains("sho-map-only") && !isMax();
    teaser.classList.toggle("show", visible);
    if (!visible) close();
  }
  function open() {
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add("open"));
  }
  function close() {
    panel.classList.remove("open");
    setTimeout(() => { if (!panel.classList.contains("open")) panel.hidden = true; }, 280);
  }
  teaser.addEventListener("click", open);
  panel.querySelector(".close").addEventListener("click", close);
  panel.addEventListener("click", e => { if (e.target === panel) close(); });
  panel.querySelector(".upgrade").addEventListener("click", () => { location.href = "pro.html"; });
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  if (window.Sho1re1Pro) {
    window.Sho1re1Pro.onChange(sync);
    window.Sho1re1Pro.check().then(sync);
  }
  window.addEventListener("sho1re1:prochange", sync);
  sync();
})();