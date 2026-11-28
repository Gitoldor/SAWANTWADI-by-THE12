/* Sho1re1 MAX Drive — OpenFreeMap visual basemap + OSRM road-following movement.
   MAX-only module. Uses the existing Leaflet map; does not alter post/place/GPS markers. */
(() => {
  'use strict';
  if (window.__sho1re1MaxDriveLoaded) return;
  let mapRef;
  try { mapRef = map; } catch (_) {}
  if (!mapRef || !window.L) return;

  const SPEED_MPS = 15; // ~54 km/h in the driving simulation
  const ROUTE_LOOKAHEAD_METERS = 1800;
  const ROUTER = 'https://router.project-osrm.org';
  let active=false, loading=false, gpsWatch=null, car=null, routeLine=null, raf=0;
  let ui=null, driveButton=null, joystickBase=null, joystickKnob=null, status=null, turnMarker=null, turnOptions=[];
  let joystick={x:0,y:0,active:false};
  let routePoints=[], routeLengths=[], routeDistance=0, routeTotal=0;
  let lastFrame=0, lastRouteAt=0, lastHeading=null, currentPoint=null, currentHeading=0, routeBusy=false, routeSteps=[], routeTurnShown=null;
  let roadMapEnabled=false;

  const style=document.createElement('style');
  style.textContent=`
    #sho1re1-drive-button{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));transform:translate(-50%,18px) scale(.94);z-index:1000002;border:1px solid #ffffff35;border-radius:999px;padding:13px 23px;background:rgba(15,17,20,.93);color:#fff;font:750 13px Inter,system-ui,sans-serif;letter-spacing:.08em;box-shadow:0 12px 35px #0007;backdrop-filter:blur(18px);opacity:0;pointer-events:none;transition:.3s}
    body.sho-map-only #sho1re1-drive-button{opacity:1;pointer-events:auto;transform:translate(-50%,0) scale(1)}
    #sho1re1-drive-ui{position:fixed;inset:0;z-index:1000003;pointer-events:none;font-family:Inter,system-ui,sans-serif}
    #sho1re1-drive-status{position:absolute;top:calc(72px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);max-width:calc(100vw - 36px);overflow:hidden;text-overflow:ellipsis;padding:8px 13px;border:1px solid #ffffff28;border-radius:20px;background:#101216e8;color:#fff;font-size:10px;font-weight:750;white-space:nowrap}
    #sho1re1-joy-base{position:absolute;right:16px;bottom:calc(26px + env(safe-area-inset-bottom));width:142px;height:142px;border-radius:50%;border:1px solid #ffffff50;background:radial-gradient(circle,#ffffff1c,#101216c9 68%);box-shadow:0 12px 36px #0008;backdrop-filter:blur(10px);pointer-events:auto;touch-action:none}
    #sho1re1-joy-base:before{content:'DRIVE';position:absolute;inset:0;display:grid;place-items:center;color:#ffffff55;font-size:10px;font-weight:800;letter-spacing:.18em}
    #sho1re1-joy-knob{position:absolute;left:50%;top:50%;width:56px;height:56px;transform:translate(-50%,-50%);border-radius:50%;border:1px solid #fff;background:linear-gradient(145deg,#fff,#aeb6c3);box-shadow:0 5px 20px #0008;pointer-events:none}
    #sho1re1-turn-card{position:absolute;left:50%;top:calc(112px + env(safe-area-inset-top));transform:translateX(-50%);width:min(310px,calc(100vw - 34px));padding:12px;border:1px solid #ffffff35;border-radius:17px;background:rgba(12,15,20,.94);color:#fff;box-shadow:0 12px 35px #0008;backdrop-filter:blur(18px);pointer-events:auto}
    #sho1re1-turn-card[hidden],#sho1re1-drive-ui[hidden]{display:none}
    #sho1re1-turn-title{font-size:11px;font-weight:800;letter-spacing:.08em;margin-bottom:9px;color:#dbeafe}
    #sho1re1-turn-options{display:flex;gap:7px}
    .sho1re1-turn-choice{flex:1;min-width:0;padding:10px 5px;border:1px solid #ffffff25;border-radius:11px;background:#ffffff12;color:#fff;text-align:center;font-size:11px;font-weight:750;touch-action:manipulation}
    .sho1re1-turn-choice:active{background:#247edb}
    #sho1re1-drive-ui[hidden]{display:none}
    @media(max-width:380px){#sho1re1-joy-base{width:128px;height:128px;right:12px;bottom:calc(18px + env(safe-area-inset-bottom))}#sho1re1-joy-knob{width:52px;height:52px}}
    body.sho1re1-driving .leaflet-control-container{opacity:.35}
  `;
  document.head.appendChild(style);

  function hasMaxAccess(){
    const a=window.Sho1re1Pro;
    return !!(a&&a.getCached()===true&&/MAX/i.test(String(a.getPlanId()||'')));
  }
  function setStatus(v){if(status)status.textContent=v;}
  function buildUI(){
    if(ui)return;
    driveButton=document.createElement('button');driveButton.id='sho1re1-drive-button';driveButton.type='button';driveButton.textContent='START DRIVE';driveButton.hidden=true;document.body.appendChild(driveButton);
    ui=document.createElement('div');ui.id='sho1re1-drive-ui';ui.hidden=true;
    ui.innerHTML='<div id="sho1re1-drive-status">READY</div><div id="sho1re1-turn-card" hidden><div id="sho1re1-turn-title">JUNCTION AHEAD · CHOOSE A TURN (OPTIONAL)</div><div id="sho1re1-turn-options"></div></div><div id="sho1re1-joy-base" aria-label="Driving joystick"><div id="sho1re1-joy-knob"></div></div>';
    document.body.appendChild(ui);status=ui.querySelector('#sho1re1-drive-status');joystickBase=ui.querySelector('#sho1re1-joy-base');joystickKnob=ui.querySelector('#sho1re1-joy-knob');
    driveButton.addEventListener('click',start);
    joystickBase.addEventListener('pointerdown',joyStart);joystickBase.addEventListener('pointermove',joyMove);joystickBase.addEventListener('pointerup',joyEnd);joystickBase.addEventListener('pointercancel',joyEnd);joystickBase.addEventListener('lostpointercapture',joyEnd);
    ui.querySelector('#sho1re1-turn-options').addEventListener('click',e=>{
      const choice=e.target.closest('[data-bearing]');if(!choice)return;
      chooseTurn(Number(choice.dataset.bearing));
    });
    let touchY=null;
    ui.addEventListener('touchstart',e=>{if(e.target.closest('#sho1re1-joy-base,#sho1re1-turn-card'))return;if(e.touches.length===1&&e.touches[0].clientY<75)touchY=e.touches[0].clientY},{passive:true});
    ui.addEventListener('touchend',e=>{if(touchY===null)return;const y=e.changedTouches[0].clientY;if(y-touchY>105)stop();touchY=null},{passive:true});
    window.addEventListener('keydown',e=>{if(active&&e.key==='Escape')stop()});
  }
  function syncVisibility(){
    if(!driveButton)return;
    const show=document.body.classList.contains('sho-map-only')&&!active&&hasMaxAccess();
    driveButton.hidden=!show;driveButton.style.display=show?'block':'none';driveButton.setAttribute('aria-hidden',show?'false':'true');
  }
  function joyStart(e){e.preventDefault();joystick.active=true;try{joystickBase.setPointerCapture(e.pointerId)}catch(_){}joyMove(e)}
  function joyMove(e){
    if(!joystick.active)return;
    const r=joystickBase.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.31;
    let dx=e.clientX-cx,dy=e.clientY-cy,mag=Math.hypot(dx,dy)||1;if(mag>max){dx=dx/mag*max;dy=dy/mag*max}
    joystick.x=dx/max;joystick.y=dy/max;joystickKnob.style.left='calc(50% + '+dx+'px)';joystickKnob.style.top='calc(50% + '+dy+'px)';
  }
  function joyEnd(){joystick.active=false;joystick.x=0;joystick.y=0;if(joystickKnob){joystickKnob.style.left='50%';joystickKnob.style.top='50%'}}
  function bearing(a,b){
    const r=Math.PI/180,y=Math.sin((b.lng-a.lng)*r)*Math.cos(b.lat*r);
    const x=Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos((b.lng-a.lng)*r);
    return (Math.atan2(y,x)*180/Math.PI+360)%360;
  }
  function destination(p,bearingDeg,meters){
    const R=6378137,br=bearingDeg*Math.PI/180,lat=p.lat*Math.PI/180,lng=p.lng*Math.PI/180,d=meters/R;
    const lat2=Math.asin(Math.sin(lat)*Math.cos(d)+Math.cos(lat)*Math.sin(d)*Math.cos(br));
    const lng2=lng+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(lat),Math.cos(d)-Math.sin(lat)*Math.sin(lat2));
    return L.latLng(lat2*180/Math.PI,lng2*180/Math.PI);
  }
  async function osrm(path){
    const response=await fetch(ROUTER+path,{method:'GET',mode:'cors',cache:'no-store'});
    if(!response.ok)throw new Error('OSRM HTTP '+response.status);
    const data=await response.json();if(data.code!=='Ok')throw new Error(data.message||data.code||'No road route found');
    return data;
  }
  async function snapToRoad(p, heading){
    const bearingParam=Number.isFinite(heading)?'&bearings='+Math.round((heading+360)%360)+',55':'';
    const data=await osrm('/nearest/v1/driving/'+p.lng+','+p.lat+'?number=1'+bearingParam);
    const loc=data.waypoints&&data.waypoints[0]&&data.waypoints[0].location;
    if(!loc)throw new Error('No nearby drivable road found');
    return L.latLng(loc[1],loc[0]);
  }
  function setCar(p,angle){
    if(!car){
      car=L.marker(p,{icon:L.divIcon({className:'sho1re1-drive-car',html:'<div style="width:34px;height:52px;transform:rotate('+(angle||0)+'deg);filter:drop-shadow(0 5px 7px #0009)"><svg viewBox="0 0 34 52" width="34" height="52"><path d="M8 3Q17 -1 26 3L31 14V43Q31 49 25 49H9Q3 49 3 43V14Z" fill="#f8fafc" stroke="#17191d" stroke-width="2"/><path d="M8 13Q17 8 26 13L28 26H6Z" fill="#536579"/><path d="M7 34H27V43H7Z" fill="#b8c5d3"/><rect x="0" y="15" width="4" height="10" rx="2" fill="#17191d"/><rect x="30" y="15" width="4" height="10" rx="2" fill="#17191d"/></svg></div>',iconSize:[42,58],iconAnchor:[21,29]}),zIndexOffset:5000,interactive:false}).addTo(mapRef);
    }else{car.setLatLng(p);const el=car.getElement(),body=el&&el.querySelector('div');if(body)body.style.transform='rotate('+(angle||0)+'deg)'}
  }
  function clearTurnCard(){
    if(turnMarker){mapRef.removeLayer(turnMarker);turnMarker=null}
    turnOptions=[];routeTurnShown=null;
    const card=ui&&ui.querySelector('#sho1re1-turn-card');if(card)card.hidden=true;
  }
  function clearRoute(){
    routePoints=[];routeLengths=[];routeDistance=0;routeTotal=0;routeSteps=[];clearTurnCard();
    if(routeLine){mapRef.removeLayer(routeLine);routeLine=null}
  }
  function setRoute(coords,steps){
    clearRoute();routePoints=coords.map(c=>L.latLng(c[1],c[0]));routeSteps=steps||[];
    for(let i=1;i<routePoints.length;i++){const d=mapRef.distance(routePoints[i-1],routePoints[i]);routeLengths.push(d);routeTotal+=d}
    if(routePoints.length<2||routeTotal<2)throw new Error('OSRM returned an unusable road route');
    routeLine=L.polyline(routePoints,{color:'#27a7ff',weight:5,opacity:.78,lineCap:'round',lineJoin:'round',interactive:false}).addTo(mapRef);
  }
  function pointAt(distance){
    let d=Math.max(0,Math.min(routeTotal,distance));
    for(let i=0;i<routeLengths.length;i++){
      const seg=routeLengths[i];if(d<=seg||i===routeLengths.length-1){
        const t=seg?d/seg:0,a=routePoints[i],b=routePoints[i+1];
        return {point:L.latLng(a.lat+(b.lat-a.lat)*t,a.lng+(b.lng-a.lng)*t),angle:bearing(a,b)};
      }d-=seg;
    }return {point:routePoints[routePoints.length-1],angle:0};
  }
  function getUpcomingTurn(){
    let travelled=0;
    for(const step of routeSteps){
      const maneuver=step.maneuver||{};
      const loc=maneuver.location;
      if(loc&&Array.isArray(loc)&&['turn','fork','roundabout','end of road','merge'].includes(maneuver.type)){
        const p=L.latLng(loc[1],loc[0]),distance=mapRef.distance(currentPoint,p);
        if(distance>18&&distance<230){
          const intersection=(step.intersections||[]).find(x=>Array.isArray(x.bearings)&&Array.isArray(x.location)&&mapRef.distance(p,L.latLng(x.location[1],x.location[0]))<35);
          if(!intersection)continue;
          const incoming=Number.isInteger(intersection.in)&&intersection.bearings[intersection.in]!==undefined?intersection.bearings[intersection.in]:currentHeading;
          const options=[];
          (intersection.bearings||[]).forEach((b,i)=>{
            if(!(intersection.entry||[])[i])return;
            const delta=((b-incoming+540)%360)-180;
            if(Math.abs(delta)<28)return;
            const side=delta<-28?'LEFT':delta>28?'RIGHT':'STRAIGHT';
            if(!options.some(o=>o.side===side))options.push({side,bearing:b});
          });
          if(options.length)return {point:p,distance,options};
        }
      }
      travelled+=Number(step.distance)||0;
    }
    return null;
  }
  function showTurnChoices(){
    const next=getUpcomingTurn(),card=ui&&ui.querySelector('#sho1re1-turn-card');
    if(!next||!card){clearTurnCard();return}
    const key=next.point.lat.toFixed(5)+','+next.point.lng.toFixed(5);
    if(routeTurnShown===key)return;
    routeTurnShown=key;turnOptions=next.options;
    if(turnMarker){mapRef.removeLayer(turnMarker);turnMarker=null}
    turnMarker=L.marker(next.point,{interactive:false,icon:L.divIcon({className:'',html:'<div style="width:17px;height:17px;border-radius:50%;background:#39a8ff;border:3px solid white;box-shadow:0 0 0 7px #39a8ff40"></div>',iconSize:[17,17],iconAnchor:[8,8]})}).addTo(mapRef);
    const labels={LEFT:'↰ LEFT',RIGHT:'↱ RIGHT',STRAIGHT:'↑ STRAIGHT'};
    const wrap=ui.querySelector('#sho1re1-turn-options');wrap.innerHTML='';
    next.options.forEach(o=>{
      const el=document.createElement('div');el.className='sho1re1-turn-choice';el.textContent=labels[o.side];el.dataset.bearing=String(o.bearing);wrap.appendChild(el);
    });
    ui.querySelector('#sho1re1-turn-title').textContent='JUNCTION IN '+Math.round(next.distance)+' M · OPTIONAL TURN';
    card.hidden=false;
  }
  async function chooseTurn(heading){
    if(!active||routeBusy)return;
    routeBusy=true;setStatus('LOADING SELECTED ROAD…');
    try{
      const aim=destination(currentPoint,heading,ROUTE_LOOKAHEAD_METERS);
      const snapped=await snapToRoad(aim,heading);
      const data=await osrm('/route/v1/driving/'+currentPoint.lng+','+currentPoint.lat+';'+snapped.lng+','+snapped.lat+'?overview=full&geometries=geojson&steps=true&alternatives=false');
      const route=data.routes&&data.routes[0];if(!route||!route.geometry)throw new Error('That turn has no connected road');
      setRoute(route.geometry.coordinates,route.legs&&route.legs[0]&&route.legs[0].steps);
      setStatus('TURN SELECTED · KEEP DRIVING');
    }catch(err){setStatus('THAT TURN IS UNAVAILABLE');console.warn('MAX turn selection:',err)}
    finally{routeBusy=false}
  }
  async function requestRoute(force){
    if(!active||routeBusy||!joystick.active)return;
    const now=Date.now();if(!force&&now-lastRouteAt<1100)return;
    const throttle=Math.max(0,Math.min(1,-joystick.y));if(throttle<.16)return;
    const heading=(currentHeading+joystick.x*82+360)%360;
    if(!force&&lastHeading!==null&&Math.abs(((heading-lastHeading+540)%360)-180)<24&&routeDistance<routeTotal-45)return;
    routeBusy=true;lastRouteAt=now;lastHeading=heading;
    try{
      const from=currentPoint,aim=destination(from,heading,ROUTE_LOOKAHEAD_METERS),snapped=await snapToRoad(aim,heading);
      const data=await osrm('/route/v1/driving/'+from.lng+','+from.lat+';'+snapped.lng+','+snapped.lat+'?overview=full&geometries=geojson&steps=true&alternatives=false');
      const route=data.routes&&data.routes[0],coords=route&&route.geometry&&route.geometry.coordinates;
      if(!coords||coords.length<2)throw new Error('No connected road route in that direction');
      setRoute(coords,route.legs&&route.legs[0]&&route.legs[0].steps);setStatus('LONG ROAD SEGMENT LOADED · '+Math.round(route.distance)+' M');
    }catch(err){setStatus('NO ROAD THAT WAY · STEER AGAIN');console.warn('MAX OSRM route:',err)}
    finally{routeBusy=false}
  }
  function frame(now){
    if(!active)return;if(!lastFrame)lastFrame=now;const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
    const throttle=Math.max(0,Math.min(1,-joystick.y));
    if(throttle>.16&&routePoints.length>1&&!routeBusy){
      routeDistance=Math.min(routeTotal,routeDistance+SPEED_MPS*throttle*dt);
      const at=pointAt(routeDistance);currentPoint=at.point;currentHeading=at.angle;setCar(at.point,at.angle);mapRef.panTo(at.point,{animate:false});
      showTurnChoices();
      if(routeDistance>=routeTotal-8){clearRoute();setStatus('LOADING ROAD AHEAD…');requestRoute(true)}
    }else if(throttle>.16&&routePoints.length===0&&!routeBusy){requestRoute(true)}
    raf=requestAnimationFrame(frame);
  }
  function hideGpsMarker(){
    document.querySelectorAll('.sho1re1-live-user-marker,.sho1re1-user-accuracy').forEach(el=>{el.dataset.driveHidden='1';el.style.opacity='0'});
  }
  function restoreGpsMarker(){document.querySelectorAll('[data-drive-hidden="1"]').forEach(el=>{el.style.opacity='';delete el.dataset.driveHidden})}
  async function start(){
    if(active||loading)return;loading=true;buildUI();ui.hidden=false;setStatus('VERIFYING MAX ACCESS…');
    if(!hasMaxAccess()){const a=window.Sho1re1Pro;if(a)await a.refresh();if(!hasMaxAccess()){loading=false;ui.hidden=true;syncVisibility();return}}
    if(!navigator.geolocation){loading=false;setStatus('GPS NOT AVAILABLE');return}
    setStatus('LOADING OPENFREEMAP ROADS…');
    try{
      if(window.Sho1re1RoadMap){await window.Sho1re1RoadMap.enable(mapRef);roadMapEnabled=true}
      else throw new Error('OpenFreeMap layer plugin is missing');
    }catch(err){loading=false;setStatus('MAP LAYER FAILED');console.error('MAX OpenFreeMap:',err);return}
    setStatus('GETTING PRECISE GPS…');
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        currentPoint=L.latLng(pos.coords.latitude,pos.coords.longitude);
        setStatus('SNAPPING TO A REAL ROAD…');currentPoint=await snapToRoad(currentPoint);currentHeading=0;
        active=true;loading=false;ui.hidden=false;hideGpsMarker();setCar(currentPoint,0);
        document.body.classList.add('sho1re1-driving');setStatus('PUSH UP TO DRIVE · TURN CARDS APPEAR AT JUNCTIONS');
        mapRef.flyTo(currentPoint,Math.max(17,mapRef.getZoom()),{duration:.7});lastFrame=0;raf=requestAnimationFrame(frame);
        gpsWatch=navigator.geolocation.watchPosition(p=>{ /* GPS is monitored; the simulated car remains road-constrained. */ },()=>{},{enableHighAccuracy:true,maximumAge:1500,timeout:10000});
      }catch(err){failStart('ROAD SNAP FAILED',err)}
    },err=>{failStart('LOCATION PERMISSION NEEDED',err)},{enableHighAccuracy:true,timeout:20000,maximumAge:3000});
  }
  function failStart(label, err){
    loading=false;
    setStatus(label);
    if(roadMapEnabled&&window.Sho1re1RoadMap)window.Sho1re1RoadMap.disable(mapRef);
    roadMapEnabled=false;
    if(ui)ui.hidden=true;
    syncVisibility();
    if(err)console.warn('MAX Drive start:',err);
  }
  function stop(){
    active=false;loading=false;cancelAnimationFrame(raf);raf=0;lastFrame=0;joyEnd();
    if(gpsWatch!==null){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null}
    if(car){mapRef.removeLayer(car);car=null}clearRoute();clearTurnCard();restoreGpsMarker();
    if(roadMapEnabled&&window.Sho1re1RoadMap)window.Sho1re1RoadMap.disable(mapRef);roadMapEnabled=false;
    document.body.classList.remove('sho1re1-driving');if(ui)ui.hidden=true;syncVisibility();
  }
  buildUI();
  const observer=new MutationObserver(syncVisibility);observer.observe(document.body,{attributes:true,attributeFilter:['class']});syncVisibility();
  const access=window.Sho1re1Pro;if(access){access.onChange(()=>{if(active&&!hasMaxAccess())stop();syncVisibility()});access.check().then(syncVisibility)}
  window.addEventListener('sho1re1:prochange',()=>{if(active&&!hasMaxAccess())stop();syncVisibility()});
  window.addEventListener('pagehide',stop);
  window.Sho1re1Drive={start,stop,isActive:()=>active};
})();
