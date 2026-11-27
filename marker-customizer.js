/* Sho1re1 MAX Marker Studio — appearance settings stay on this device. */
(() => {
  'use strict';
  if (window.Sho1re1MarkerCustomizer) return;
  const keys={places:'sho1re1_max_place_marker_style_v1',user:'sho1re1_max_user_marker_style_v1'};
  const styles=[
    ['orbit','Orbit','✦'],['classic','Classic','●'],['diamond','Diamond','◆'],['hex','Hexagon','⬡'],['squircle','Squircle','▣'],
    ['halo','Halo','◎'],['shield','Shield','⬟'],['soft','Soft','✿'],['tech','Tech','⌘'],['pulse','Pulse','✧']
  ];
  const selected={places:read(keys.places),user:read(keys.user)};
  const places=new Map(),users=new Set();
  let sheet,backdrop,grid,current='places';
  function read(key){try{const v=localStorage.getItem(key);return styles.some(s=>s[0]===v)?v:'orbit';}catch(_){return 'orbit';}}
  function max(){const p=window.Sho1re1Pro;return !!(p&&p.getCached()===true&&/MAX/i.test(String(p.getPlanId()||'')));}
  function cls(type){return 'max-marker-frame-'+(max()?selected[type]:'classic');}
  function ensure(){
    if(sheet)return;
    const css=document.createElement('style');
    css.textContent="#sho1re1MarkerBackdrop{position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.43);backdrop-filter:blur(5px);opacity:0;pointer-events:none;transition:opacity .25s}#sho1re1MarkerBackdrop.open{opacity:1;pointer-events:auto}#sho1re1MarkerSheet{position:fixed;z-index:2147483001;left:0;right:0;bottom:0;max-height:76vh;overflow:auto;padding:12px 17px calc(22px + env(safe-area-inset-bottom));background:linear-gradient(155deg,#25272d,#0b0c0f);color:#fff;border:1px solid #ffffff20;border-bottom:0;border-radius:27px 27px 0 0;box-shadow:0 -18px 60px #0007;transform:translateY(105%);transition:transform .45s cubic-bezier(.16,1,.3,1);font-family:Inter,system-ui,sans-serif}#sho1re1MarkerSheet.open{transform:translateY(0)}#sho1re1MarkerSheet .handle{width:38px;height:4px;border-radius:9px;background:#ffffff50;margin:0 auto 16px}#sho1re1MarkerSheet .head{display:flex;justify-content:space-between;gap:12px}#sho1re1MarkerSheet .heading{font-size:19px;font-weight:750}#sho1re1MarkerSheet .sub{font-size:12px;color:#aaa;margin-top:5px}#sho1re1MarkerSheet .close{width:35px;height:35px;border:1px solid #ffffff25;border-radius:50%;background:#ffffff12;color:#fff;font-size:21px}#sho1re1MarkerSheet .kind{display:inline-block;margin-top:14px;padding:7px 11px;border-radius:20px;background:#ffffff0d;border:1px solid #ffffff18;font-size:10px;letter-spacing:.5px;color:#ddd}#sho1re1MarkerSheet .grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:9px;margin-top:16px}#sho1re1MarkerSheet .option{min-width:0;border:1px solid #ffffff18;border-radius:15px;background:#ffffff09;color:#fff;padding:9px 2px;display:flex;flex-direction:column;align-items:center;gap:8px}#sho1re1MarkerSheet .option.selected{border-color:#fff;background:#ffffff20;box-shadow:0 0 0 1px #ffffff55}#sho1re1MarkerSheet .option:disabled{opacity:.45}#sho1re1MarkerSheet .preview{height:44px;width:44px;display:grid;place-items:center}#sho1re1MarkerSheet .glyph{width:30px;height:30px;display:grid;place-items:center;background:linear-gradient(145deg,#fff,#9daabd);color:#111;font-size:17px;font-weight:900;box-shadow:0 4px 12px #0008}#sho1re1MarkerSheet .preview[data-style=orbit] .glyph{border-radius:50%;outline:3px solid #ffffff66;outline-offset:4px}#sho1re1MarkerSheet .preview[data-style=classic] .glyph{border-radius:50%;border:4px solid #fff}#sho1re1MarkerSheet .preview[data-style=diamond] .glyph{border-radius:6px;transform:rotate(45deg) scale(.85)}#sho1re1MarkerSheet .preview[data-style=hex] .glyph{clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)}#sho1re1MarkerSheet .preview[data-style=squircle] .glyph{border-radius:11px}#sho1re1MarkerSheet .preview[data-style=halo] .glyph{border-radius:50%;outline:5px solid #ffffff40;outline-offset:2px;background:#20242d;color:#fff;border:2px solid #fff}#sho1re1MarkerSheet .preview[data-style=shield] .glyph{clip-path:polygon(50% 0,95% 17%,86% 72%,50% 100%,14% 72%,5% 17%)}#sho1re1MarkerSheet .preview[data-style=soft] .glyph{border-radius:42% 58% 62% 38% / 40% 38% 62% 60%}#sho1re1MarkerSheet .preview[data-style=tech] .glyph{border-radius:5px;border:2px solid #fff;background:#10141c;color:#fff;box-shadow:0 0 0 3px #ffffff25}#sho1re1MarkerSheet .preview[data-style=pulse] .glyph{border-radius:50%;box-shadow:0 0 0 5px #ffffff22,0 0 0 9px #ffffff12}#sho1re1MarkerSheet .name{font-size:10px;font-weight:650;white-space:nowrap}#sho1re1MarkerSheet .lock{margin-top:13px;padding:12px;border:1px solid #ffffff20;border-radius:14px;background:#ffffff09;color:#ddd;font-size:12px;line-height:1.45}.custom-marker.max-marker-frame-orbit{border-radius:50%!important;border:3px solid #fff!important;outline:2px solid #ffffff88;outline-offset:3px;box-shadow:0 5px 18px #0008!important}.custom-marker.max-marker-frame-classic{border-radius:50%!important;border:5px solid #fff!important}.custom-marker.max-marker-frame-diamond{border-radius:10px!important;transform:rotate(45deg) scale(.78);border:3px solid #fff!important}.custom-marker.max-marker-frame-diamond img{transform:rotate(-45deg) scale(1.35)}.custom-marker.max-marker-frame-hex{border-radius:0!important;clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%);border:3px solid #fff!important}.custom-marker.max-marker-frame-squircle{border-radius:27%!important;border:3px solid #fff!important}.custom-marker.max-marker-frame-halo{border-radius:50%!important;border:3px solid #fff!important;outline:5px solid #ffffff55;outline-offset:2px}.custom-marker.max-marker-frame-shield{border-radius:12px 12px 20px 20px!important;clip-path:polygon(50% 0,100% 16%,91% 76%,50% 100%,9% 76%,0 16%)}.custom-marker.max-marker-frame-soft{border-radius:42% 58% 62% 38% / 40% 38% 62% 60%!important;border:3px solid #fff!important}.custom-marker.max-marker-frame-tech{border-radius:8px!important;border:3px solid #fff!important;outline:2px solid #ffffff55;outline-offset:3px}.custom-marker.max-marker-frame-pulse{border-radius:50%!important;border:3px solid #fff!important;box-shadow:0 0 0 6px #ffffff30,0 0 0 11px #ffffff16!important}.max-user-marker{width:42px;height:42px;display:grid;place-items:center;background:linear-gradient(145deg,#fff,#b7c4d8);color:#111;border:3px solid #fff;box-shadow:0 4px 16px #0008}.max-user-marker svg{width:22px;height:22px}.max-user-marker.max-marker-frame-orbit{border-radius:50%;outline:3px solid #ffffff70;outline-offset:4px}.max-user-marker.max-marker-frame-classic{border-radius:50%;border-width:5px}.max-user-marker.max-marker-frame-diamond{border-radius:8px;transform:rotate(45deg) scale(.8)}.max-user-marker.max-marker-frame-diamond svg{transform:rotate(-45deg)}.max-user-marker.max-marker-frame-hex{clip-path:polygon(25% 0,75% 0,100% 50%,75% 100%,25% 100%,0 50%)}.max-user-marker.max-marker-frame-squircle{border-radius:12px}.max-user-marker.max-marker-frame-halo{border-radius:50%;outline:5px solid #ffffff50;outline-offset:2px;background:#1c2430;color:#fff}.max-user-marker.max-marker-frame-shield{clip-path:polygon(50% 0,100% 16%,91% 76%,50% 100%,9% 76%,0 16%)}.max-user-marker.max-marker-frame-soft{border-radius:42% 58% 62% 38% / 40% 38% 62% 60%}.max-user-marker.max-marker-frame-tech{border-radius:7px;background:#10141c;color:#fff;outline:2px solid #ffffff55;outline-offset:3px}.max-user-marker.max-marker-frame-pulse{border-radius:50%;box-shadow:0 0 0 6px #ffffff30,0 0 0 11px #ffffff16}";
    document.head.appendChild(css);
    backdrop=document.createElement('div');backdrop.id='sho1re1MarkerBackdrop';
    sheet=document.createElement('section');sheet.id='sho1re1MarkerSheet';sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');
    sheet.innerHTML='<div class="handle"></div><div class="head"><div><div class="heading">Marker Studio</div><div class="sub">Choose how your map markers appear</div></div><button class="close" type="button" aria-label="Close">×</button></div><div class="kind"></div><div class="grid"></div><div class="lock" hidden></div>';
    document.body.append(backdrop,sheet);grid=sheet.querySelector('.grid');
    backdrop.addEventListener('click',close);sheet.querySelector('.close').addEventListener('click',close);
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
    sheet.addEventListener('touchstart',e=>{sheet.dataset.touchY=String(e.touches[0].clientY);},{passive:true});
    sheet.addEventListener('touchend',e=>{if(e.changedTouches[0].clientY-Number(sheet.dataset.touchY||0)>90)close();},{passive:true});
  }
  function placeIcon(marker,place){
    const old=marker.options.icon&&marker.options.icon.options||{},size=old.iconSize||[80,80],w=size[0],h=size[1];
    const media=place&&place.contentKind==='reel'?'media-reel':place&&place.contentKind==='long_form'?'media-video':place&&place.contentKind==='post'?'media-post':'';
    const src=String(place&&place.image||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
    return L.divIcon({html:'<div class="custom-marker '+media+' '+cls('places')+'"><img src="'+src+'" loading="lazy" decoding="async" fetchpriority="low" alt=""></div>',className:'',iconSize:[w,h],iconAnchor:[w/2,h/2]});
  }
  function userIcon(){return L.divIcon({className:'',html:'<div class="max-user-marker '+cls('user')+'"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Zm0 2c-4.2 0-7.5 2.25-7.5 5.05 0 .65.53 1.18 1.18 1.18h12.64c.65 0 1.18-.53 1.18-1.18C19.5 16.25 16.2 14 12 14Z"/></svg></div>',iconSize:[52,52],iconAnchor:[26,26]});}
  function refresh(type){if(type==='places')places.forEach((place,marker)=>marker.setIcon(placeIcon(marker,place)));else users.forEach(marker=>marker.setIcon(userIcon()));}
  function decoratePlaceMarker(marker,place){if(!marker)return;places.set(marker,place);marker.setIcon(placeIcon(marker,place));}
  function registerUserMarker(marker){if(!marker)return;users.add(marker);marker.setIcon(userIcon());}
  function open(type){
    ensure();current=type==='user'?'user':'places';
    const access=window.Sho1re1Pro;
    if(access&&access.getCached()===null)access.check().then(()=>{if(sheet&&sheet.classList.contains('open'))open(current);}).catch(()=>{});
    const allowed=max();
    sheet.querySelector('.heading').textContent=current==='user'?'Your location marker':'Place markers';
    sheet.querySelector('.sub').textContent=allowed?'10 designs · saved on this device':'MAX exclusive · upgrade to customize';
    sheet.querySelector('.kind').textContent=current==='user'?'PERSONAL LOCATION':'ALL PLACE & CONTENT MARKERS';
    const lock=sheet.querySelector('.lock');lock.hidden=allowed;lock.textContent='🔒 Marker Studio is a MAX-exclusive feature. Upgrade to MAX to select and save a marker design.';
    grid.innerHTML='';
    styles.forEach(s=>{
      const b=document.createElement('button');b.type='button';b.className='option'+(selected[current]===s[0]?' selected':'');b.disabled=!allowed;
      b.innerHTML='<span class="preview" data-style="'+s[0]+'"><span class="glyph">'+s[2]+'</span></span><span class="name">'+s[1]+'</span>';
      b.addEventListener('click',()=>{
        if(!max())return;selected[current]=s[0];
        try{localStorage.setItem(keys[current],s[0]);}catch(e){console.warn('Marker preference could not be saved',e);}
        refresh(current);grid.querySelectorAll('.option').forEach(x=>x.classList.toggle('selected',x===b));
      });
      grid.appendChild(b);
    });
    backdrop.classList.add('open');sheet.classList.add('open');document.body.style.overflow='hidden';
  }
  function close(){if(!sheet)return;backdrop.classList.remove('open');sheet.classList.remove('open');document.body.style.overflow='';}
  window.Sho1re1MarkerCustomizer={open,close,decoratePlaceMarker,registerUserMarker,createUserIcon:userIcon,refresh:()=>{refresh('places');refresh('user');},getSelection:type=>selected[type==='user'?'user':'places']};
  if(window.Sho1re1Pro&&window.Sho1re1Pro.onChange)window.Sho1re1Pro.onChange(()=>{refresh('places');refresh('user');if(sheet&&sheet.classList.contains('open'))open(current);});
})();