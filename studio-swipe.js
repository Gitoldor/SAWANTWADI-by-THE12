/* Sho1re1 Studio — right-edge swipe entry, paid-account gated. */
(function(){
 'use strict';
 if(window.__sho1re1StudioLoaded)return;
 window.__sho1re1StudioLoaded=true;
 const ALLOWED_EMAIL='rajguruowais@gmail.com';
 const API='https://sawantwadi-read-api.onrender.com/location-custom-access';
 let allowed=false,checking=false,start=null,overlay=null,frame=null;
 const style=document.createElement('style');
 style.textContent=`
 #s1-studio-overlay{position:fixed;inset:0;z-index:2147483000;background:#080808;transform:translate3d(100%,0,0);visibility:hidden;transition:transform .72s cubic-bezier(.16,1,.3,1),visibility .72s;will-change:transform}
 #s1-studio-overlay.open{transform:translate3d(0,0,0);visibility:visible}
 #s1-studio-frame{width:100%;height:100%;border:0;display:block;background:#080808}
 #s1-studio-toast{position:fixed;z-index:2147483001;left:50%;bottom:28px;transform:translate(-50%,12px);opacity:0;pointer-events:none;background:#171717;color:#fff;border:1px solid #ffffff22;border-radius:99px;padding:12px 17px;font:600 12px Inter,system-ui;transition:opacity .2s,transform .2s;white-space:nowrap}
 #s1-studio-toast.show{opacity:1;transform:translate(-50%,0)}
 @media(prefers-reduced-motion:reduce){#s1-studio-overlay{transition-duration:.01ms}}
 `;
 document.head.appendChild(style);
 function toast(message){let el=document.getElementById('s1-studio-toast');if(!el){el=document.createElement('div');el.id='s1-studio-toast';document.body.appendChild(el)}el.textContent=message;el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),1900)}
 function authUser(){const a=window.Sho1re1Auth;try{return a&&a.getUser?a.getUser():null}catch(_){return null}}
 function checkAccess(){
  if(checking)return;checking=true;
  const a=window.Sho1re1Auth,user=authUser();
  if(user&&String(user.email||'').trim().toLowerCase()===ALLOWED_EMAIL)allowed=true;
  if(a&&typeof a.getCredential==='function'){
   const token=a.getCredential();
   if(token){fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({credential:token}),cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Access check failed');return r.json()}).then(d=>{allowed=d.success===true&&d.allowed===true}).catch(()=>{}).finally(()=>{checking=false});return}
  }
  checking=false;
 }
 function build(){
  if(overlay)return;
  overlay=document.createElement('div');overlay.id='s1-studio-overlay';
  frame=document.createElement('iframe');frame.id='s1-studio-frame';frame.title='Sho1re1 Studio';frame.src='./studio.html';
  overlay.appendChild(frame);document.body.appendChild(overlay);
 }
 function openStudio(){
  checkAccess();
  if(!allowed){toast('Studio is available to paid accounts');return}
  build();requestAnimationFrame(()=>overlay.classList.add('open'));
  document.body.classList.add('sho1re1-studio-open');
 }
 function closeStudio(){if(!overlay)return;overlay.classList.remove('open');document.body.classList.remove('sho1re1-studio-open')}
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data&&e.data.type==='sho1re1:close-studio')closeStudio()});
 document.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0)||overlay&&overlay.classList.contains('open'))return;
  if(e.clientX<window.innerWidth-28)return;
  if(e.target.closest('button,a,input,textarea,select,.leaflet-control,.leaflet-marker-icon,.leaflet-popup'))return;
  start={x:e.clientX,y:e.clientY,id:e.pointerId};
 },{capture:true,passive:true});
 document.addEventListener('pointerup',e=>{
  if(!start||e.pointerId!==start.id)return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
  if(dx<-85&&Math.abs(dx)>Math.abs(dy)*1.35)openStudio();
 },{capture:true,passive:true});
 document.addEventListener('pointercancel',()=>start=null,{capture:true,passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStudio()});
 window.addEventListener('sho1re1:authchange',checkAccess);
 window.addEventListener('sho1re1:credential',checkAccess);
 checkAccess();
})();