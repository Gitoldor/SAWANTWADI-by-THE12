/* Sho1re1 Studio — right-edge swipe entry, paid-account gated. */
(function(){
 'use strict';
 if(window.__sho1re1StudioLoaded)return;
 window.__sho1re1StudioLoaded=true;
 const API='https://sawantwadi-read-api.onrender.com/pro-status';
 let allowed=false,checking=false,start=null,overlay=null,frame=null;
 const style=document.createElement('style');
 style.textContent=`
 #s1-studio-overlay{position:fixed;inset:0;z-index:2147483000;background:#080808;transform:translate3d(100%,0,0);visibility:hidden;transition:transform .95s cubic-bezier(.22,.61,.36,1),visibility .95s;will-change:transform}
 #s1-studio-overlay.open{transform:translate3d(0,0,0);visibility:visible}
 #s1-studio-frame{width:100%;height:100%;border:0;display:block;background:#080808}
 #s1-studio-toast{position:fixed;z-index:2147483001;left:50%;bottom:28px;transform:translate(-50%,12px);opacity:0;pointer-events:none;background:#171717;color:#fff;border:1px solid #ffffff22;border-radius:99px;padding:12px 17px;font:600 12px Inter,system-ui;transition:opacity .2s,transform .2s;white-space:nowrap}
 #s1-studio-toast.show{opacity:1;transform:translate(-50%,0)}
 @media(prefers-reduced-motion:reduce){#s1-studio-overlay{transition-duration:.01ms}}
 `;
 document.head.appendChild(style);
 function toast(message){let el=document.getElementById('s1-studio-toast');if(!el){el=document.createElement('div');el.id='s1-studio-toast';document.body.appendChild(el)}el.textContent=message;el.classList.add('show');clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),1900)}
 function authInstance(){return window.Sho1re1Auth||null}
 function authUser(){const a=authInstance();try{return a&&a.getUser?a.getUser():null}catch(_){return null}}
 async function checkAccess(){
  if(checking)return false;
  checking=true;
  const auth=authInstance();
  const user=authUser();
  let credential='';
  try{credential=auth&&((auth.getSessionToken&&auth.getSessionToken())||(auth.getCredential&&auth.getCredential()))||''}catch(_){}
  if(!user||!credential){allowed=false;checking=false;return false}
  try{
   const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:String(user.email||'').trim().toLowerCase(),credential:credential}),cache:'no-store'});
   if(!response.ok)throw Error('Access check failed');
   const data=await response.json();
   allowed=data.success===true&&data.active===true;
  }catch(_){allowed=false}
  checking=false;
  return allowed;
 }
 function build(){
  if(overlay)return;
  overlay=document.createElement('div');overlay.id='s1-studio-overlay';
  frame=document.createElement('iframe');frame.id='s1-studio-frame';frame.title='Sho1re1 Studio';frame.src='./studio.html';
  overlay.appendChild(frame);document.body.appendChild(overlay);
 }
 async function openStudio(){
  if(!await checkAccess()){toast('Studio is available to paid accounts');return}
  build();requestAnimationFrame(()=>overlay.classList.add('open'));
  document.body.classList.add('sho1re1-studio-open');
 }
 function closeStudio(){if(!overlay)return;overlay.classList.remove('open');document.body.classList.remove('sho1re1-studio-open')}
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data&&e.data.type==='sho1re1:close-studio')closeStudio()});
 document.addEventListener('pointerdown',e=>{
  if(!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0)||overlay&&overlay.classList.contains('open'))return;
  if(e.clientX<window.innerWidth-96)return;
  if(e.target.closest('button,a,input,textarea,select,.leaflet-control,.leaflet-marker-icon,.leaflet-popup'))return;
  start={x:e.clientX,y:e.clientY,id:e.pointerId};
 },{capture:true,passive:true});
 document.addEventListener('pointerup',e=>{
  if(!start||e.pointerId!==start.id)return;
  const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;
  if(dx<-48&&Math.abs(dx)>Math.abs(dy)*1.15)openStudio();
 },{capture:true,passive:true});
 document.addEventListener('pointercancel',()=>start=null,{capture:true,passive:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStudio()});
 window.addEventListener('sho1re1:authchange',checkAccess);
 window.addEventListener('sho1re1:credential',checkAccess);
 checkAccess();
})();