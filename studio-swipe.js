/* Sho1re1 Studio — right-edge swipe entry, paid-account gated. */
(function(){
 'use strict';
 if(window.__sho1re1StudioLoaded)return;
 window.__sho1re1StudioLoaded=true;
 let allowed=false,start=null,overlay=null,frame=null;
 function checker(){return window.Sho1re1Pro||null}
 async function checkAccess(){
  const pro=checker();
  allowed=pro?await pro.check():false;
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
 const pro=checker();
 if(pro)pro.onChange(value=>{allowed=value});
 checkAccess();
})();