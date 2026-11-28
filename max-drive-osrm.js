/* Sho1re1 MAX Drive — OpenFreeMap visual basemap + Valhalla road-following movement.
   MAX-only module. Uses the existing Leaflet map; does not alter post/place/GPS markers. */
(() => {
  'use strict';
  if (window.__sho1re1MaxDriveLoaded) return;
  let mapRef;
  try { mapRef = map; } catch (_) {}
  if (!mapRef || !window.L) return;

  let SPEED_MPS = 15; // live speed; gear taps adjust without a fixed upper limit
  const ROUTE_LOOKAHEAD_METERS = 1800;
  const ROUTER = 'https://valhalla1.openstreetmap.de';
  let lastValhallaRequestAt=0, valhallaQueue=Promise.resolve();
  let active=false, loading=false, car=null, routeLine=null, raf=0;
  let ui=null, driveButton=null, joystickBase=null, joystickKnob=null, status=null, branchLines=[], branchFetchKey='', branchFetchBusy=false, branchFetchVersion=0, speedFlashTimer=0, lastJunctionRefresh=0;
  let joystick={x:0,y:0,active:false};
  let routePoints=[], routeLengths=[], routeDistance=0, routeTotal=0, routeSegmentIndex=0, routeSegmentStart=0;
  let lastFrame=0, lastRouteAt=0, lastHeading=null, currentPoint=null, currentHeading=0, routeBusy=false, routeSteps=[], routeTurnShown=null;
  let roadMapEnabled=false, lastCameraBearing=null, rotationWrapper=null, cameraAngle=0;
  let townRoadLayer=null,townRoadLoadStarted=false,branchRenderer=null;
  let mapInteractionState=null, lastSteerRouteAt=0, selectedBranch=null, selectedBranchLine=null, selectedBranchCommit=false;
  let junctionOptions=[], junctionRouteDistance=Infinity, waitingForJunctionChoice=false;
  let committedJunctionNodeId=null, committedJunctionPoint=null;
  let townRoadGeometry=[];
  let driveRevision=0, driveFacingBack=false, uTurnButton=null;
  let lastVisualPoint=null,lastVisualHeading=NaN;

  const style=document.createElement('style');
  style.textContent=`
    /* Sho1re1's native white-glass control language: restrained, rounded,
       black typography, soft shadows and the same Inter type system. */
    #sho1re1-drive-button{
      position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));
      transform:translate(-50%,18px) scale(.96);z-index:1000002;
      border:1px solid rgba(0,0,0,.10);border-radius:999px;padding:13px 24px;
      background:rgba(255,255,255,.94);color:#111;
      font:800 13px Inter,system-ui,sans-serif;letter-spacing:.045em;
      box-shadow:0 10px 28px rgba(0,0,0,.20),inset 0 1px 0 rgba(255,255,255,.9);
      backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
      opacity:0;pointer-events:none;
      transition:opacity .24s ease,transform .28s cubic-bezier(.16,1,.3,1),box-shadow .2s ease;
      cursor:pointer;touch-action:manipulation;
    }
    body.sho-map-only #sho1re1-drive-button{
      opacity:1;pointer-events:auto;transform:translate(-50%,0) scale(1)
    }
    #sho1re1-drive-button:active{transform:translate(-50%,1px) scale(.96);box-shadow:0 4px 12px rgba(0,0,0,.16)}
    #sho1re1-drive-ui{
      position:fixed;inset:0;z-index:1000003;pointer-events:none;
      font-family:Inter,system-ui,sans-serif;color:#111
    }
    #sho1re1-drive-status{
      position:absolute;top:calc(72px + env(safe-area-inset-top));left:50%;
      transform:translateX(-50%);max-width:calc(100vw - 36px);
      overflow:hidden;text-overflow:ellipsis;padding:9px 15px;
      border:1px solid rgba(0,0,0,.10);border-radius:999px;
      background:rgba(255,255,255,.94);color:#111;
      font-size:10px;font-weight:800;letter-spacing:.035em;white-space:nowrap;
      box-shadow:0 7px 22px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.95);
      backdrop-filter:blur(9px);-webkit-backdrop-filter:blur(9px)
    }
    #sho1re1-joy-base{
      position:absolute;right:16px;bottom:calc(26px + env(safe-area-inset-bottom));
      width:142px;height:142px;border-radius:50%;
      border:1px solid rgba(0,0,0,.14);
      background:radial-gradient(circle at 35% 28%,rgba(255,255,255,.98),rgba(255,255,255,.84) 62%,rgba(235,237,240,.94));
      box-shadow:0 12px 32px rgba(0,0,0,.20),inset 0 1px 2px rgba(255,255,255,.95);
      backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
      pointer-events:auto;touch-action:none;cursor:grab
    }
    #sho1re1-joy-base:active{cursor:grabbing}
    #sho1re1-joy-base:before{
      content:'DRIVE';position:absolute;inset:0;display:grid;place-items:center;
      color:rgba(0,0,0,.34);font-size:10px;font-weight:800;letter-spacing:.16em;
      pointer-events:none
    }
    #sho1re1-joy-knob{
      position:absolute;left:50%;top:50%;width:56px;height:56px;
      transform:translate(-50%,-50%);border-radius:50%;
      border:1px solid rgba(0,0,0,.12);
      background:linear-gradient(145deg,#fff,#e8eaed);
      box-shadow:0 4px 13px rgba(0,0,0,.20),inset 0 1px 1px #fff;
      pointer-events:none;will-change:left,top
    }
    #sho1re1-speed-gears{
      position:absolute;right:20px;bottom:calc(184px + env(safe-area-inset-bottom));
      display:flex;gap:8px;pointer-events:auto
    }
    #sho1re1-drive-ui button{
      color:#111;background:rgba(255,255,255,.94);
      border:1px solid rgba(0,0,0,.12);
      box-shadow:0 5px 16px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.95);
      font-family:Inter,system-ui,sans-serif;font-weight:800;
      backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
      cursor:pointer;touch-action:manipulation;
      transition:background .16s ease,transform .16s ease,box-shadow .16s ease
    }
    #sho1re1-drive-ui button:active{
      background:#111;color:#fff;transform:scale(.95);
      box-shadow:0 2px 8px rgba(0,0,0,.16)
    }
    #sho1re1-uturn{
      position:absolute;right:20px;bottom:calc(224px + env(safe-area-inset-bottom));
      min-width:87px;height:34px;padding:0 13px;border-radius:999px;
      font-size:11px;letter-spacing:.035em;pointer-events:auto
    }
    #sho1re1-uturn[data-reversed="true"]{
      background:#111;color:#fff;border-color:#111;
      box-shadow:0 0 0 2px rgba(255,255,255,.72),0 5px 16px rgba(0,0,0,.2)
    }
    .sho1re1-gear{
      width:40px;height:34px;border-radius:13px;font-size:17px
    }
    #sho1re1-drive-ui[hidden]{display:none}
    @media(max-width:380px){
      #sho1re1-joy-base{width:128px;height:128px;right:12px;bottom:calc(18px + env(safe-area-inset-bottom))}
      #sho1re1-joy-knob{width:52px;height:52px}
    }
    @media(prefers-reduced-motion:reduce){
      #sho1re1-drive-ui button,#sho1re1-drive-button{transition:none}
    }
    body.sho1re1-driving .leaflet-control-container{display:none!important}
  `;
  document.head.appendChild(style);

  function hasMaxAccess(){
    const a=window.Sho1re1Pro;
    return !!(a&&a.getCached()===true&&/MAX/i.test(String(a.getPlanId()||'')));
  }
  function setStatus(v){if(status)status.textContent=v;}
  function junctionGraphReady(){
    const graph=window.Sho1re1RoadGraph;
    if(!graph||!currentPoint)return false;
    try{return typeof graph.hasCoverage==='function'&&graph.hasCoverage(currentPoint)}catch(_){return false}
  }
  function simplifyTownLine(coords,toleranceMeters=1.25){
    if(!Array.isArray(coords)||coords.length<3)return coords;
    const cos=Math.cos(Number(coords[0][0])*Math.PI/180);
    const xy=p=>({x:Number(p[1])*111320*cos,y:Number(p[0])*110540});
    const points=coords.map(xy),keep=new Uint8Array(coords.length);
    keep[0]=1;keep[coords.length-1]=1;
    const stack=[[0,coords.length-1]],limit=toleranceMeters*toleranceMeters;
    while(stack.length){
      const pair=stack.pop(),first=pair[0],last=pair[1],a=points[first],b=points[last];
      const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
      let best=limit,index=-1;
      for(let i=first+1;i<last;i++){
        const p=points[i],t=den?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/den)):0;
        const ex=p.x-(a.x+t*dx),ey=p.y-(a.y+t*dy),sq=ex*ex+ey*ey;
        if(sq>best){best=sq;index=i;}
      }
      if(index!==-1){keep[index]=1;stack.push([first,index],[index,last]);}
    }
    const result=[];
    for(let i=0;i<coords.length;i++)if(keep[i])result.push(coords[i]);
    return result;
  }
  function drawTownRoadLayer(lines){
    if(!Array.isArray(lines)||!lines.length)return false;
    if(townRoadLayer&&mapRef.hasLayer(townRoadLayer))mapRef.removeLayer(townRoadLayer);
    townRoadGeometry=lines;
    // Keep the town roads above the MapLibre GL basemap instead of sharing
    // Leaflet's default overlay pane, where the GL canvas can cover them.
    const paneName='sho1re1TownRoadsPane';
    const pane=mapRef.getPane(paneName)||mapRef.createPane(paneName);
    pane.style.zIndex='450';
    pane.style.pointerEvents='auto';
    // Keep the original OSM geometry for accurate tap-to-road snapping,
    // but draw a lightly simplified copy to reduce Canvas vertices.
    const displayLines=lines.map(line=>simplifyTownLine(line,3.0)).filter(line=>line.length>1);
    const renderer=L.canvas({pane:paneName});
    townRoadLayer=L.polyline(displayLines,{
      pane:paneName,renderer,color:'#078cff',weight:7,opacity:.96,
      lineCap:'round',lineJoin:'round',interactive:true,bubblingMouseEvents:false,smoothFactor:1.4
    }).addTo(mapRef);
    townRoadLayer.on('click',e=>{
      if(!active||!e.latlng)return;
      if(e.originalEvent)L.DomEvent.stopPropagation(e.originalEvent);
      jumpCarToRoad(e.latlng);
    });
    townRoadLayer.bringToFront();
    return true;
  }
  function nearestTownRoadSegment(point){
    if(!point||!townRoadGeometry.length)return null;
    const cos=Math.cos(point.lat*Math.PI/180),toXY=p=>({
      x:(Number(p[1])-point.lng)*111320*cos,
      y:(Number(p[0])-point.lat)*110540
    });
    let best=null,bestSq=Infinity;
    for(const line of townRoadGeometry){
      if(!Array.isArray(line)||line.length<2)continue;
      for(let i=1;i<line.length;i++){
        const a=line[i-1],b=line[i];
        if(!a||!b)continue;
        const A=toXY(a),B=toXY(b),dx=B.x-A.x,dy=B.y-A.y;
        const denom=dx*dx+dy*dy;
        if(denom<.01)continue;
        const t=Math.max(0,Math.min(1,(-(A.x*dx+A.y*dy))/denom));
        const x=A.x+t*dx,y=A.y+t*dy,sq=x*x+y*y;
        if(sq>=bestSq)continue;
        const near=L.latLng(
          Number(a[0])+(Number(b[0])-Number(a[0]))*t,
          Number(a[1])+(Number(b[1])-Number(a[1]))*t
        );
        bestSq=sq;
        best={point:near,distance:Math.sqrt(sq),bearing:bearing(
          L.latLng(Number(a[0]),Number(a[1])),
          L.latLng(Number(b[0]),Number(b[1]))
        )};
      }
    }
    if(!best)return null;
    const reverse=(best.bearing+180)%360;
    best.heading=angleDifference(best.bearing,currentHeading)<=angleDifference(reverse,currentHeading)
      ?best.bearing:reverse;
    return best;
  }
  async function jumpCarToRoad(point){
    if(!active||!point)return;
    const revision=++driveRevision;
    const target=L.latLng(point.lat,point.lng);
    const road=nearestTownRoadSegment(target);
    const snapOrigin=road&&road.distance<65?road.point:target;
    const heading=road&&road.distance<65?road.heading:currentHeading;
    clearRoute();
    routeBusy=false;
    lastHeading=null;lastRouteAt=0;lastSteerRouteAt=0;
    committedJunctionNodeId=null;committedJunctionPoint=null;
    selectedBranch=null;selectedBranchLine=null;selectedBranchCommit=false;
    waitingForJunctionChoice=false;
    currentPoint=snapOrigin;
    currentHeading=heading;
    lastVisualPoint=null;lastVisualHeading=NaN;
    setCar(currentPoint,currentHeading);
    mapRef.panTo(currentPoint,{animate:false});
    setStatus('ALIGNING CAR TO SELECTED ROAD…');
    try{
      // This is a map-tap road snap, never a device-GPS lookup. The heading
      // constraint keeps Valhalla from snapping onto a nearby parallel road.
      const snapped=await snapToRoad(snapOrigin,heading,28);
      if(!active||revision!==driveRevision)return;
      if(mapRef.distance(snapOrigin,snapped)>45)throw new Error('Nearest drivable match is not the selected road');
      currentPoint=snapped;
    }catch(err){
      if(!active||revision!==driveRevision)return;
      console.warn('MAX tapped-road snap:',err);
      // Keep the car on the exact OSM line instead of allowing a wrong-road snap.
    }
    if(!active||revision!==driveRevision)return;
    setCar(currentPoint,currentHeading);
    mapRef.panTo(currentPoint,{animate:false});
    setStatus('CAR MOVED TO SELECTED ROAD · PUSH DRIVE TO MOVE');
    const graph=window.Sho1re1RoadGraph;
    if(graph&&graph.refresh){
      graph.refresh(currentPoint).then(()=>{
        if(active&&revision===driveRevision)refreshJunctionChoices();
      }).catch(err=>console.warn('MAX tapped-road junction refresh:',err));
    }else refreshJunctionChoices();
  }
  function buildUI(){
    if(ui)return;
    driveButton=document.createElement('button');driveButton.id='sho1re1-drive-button';driveButton.type='button';driveButton.textContent='START DRIVE';driveButton.hidden=true;document.body.appendChild(driveButton);
    ui=document.createElement('div');ui.id='sho1re1-drive-ui';ui.hidden=true;
    ui.innerHTML='<div id="sho1re1-drive-status">READY</div><button id="sho1re1-uturn" type="button" data-reversed="false" aria-label="Turn the car around" aria-pressed="false">↶ U-TURN</button><div id="sho1re1-speed-gears"><button class="sho1re1-gear" type="button" data-gear="up" aria-label="Increase speed">＋</button><button class="sho1re1-gear" type="button" data-gear="down" aria-label="Decrease speed">−</button></div><div id="sho1re1-joy-base" aria-label="Driving joystick"><div id="sho1re1-joy-knob"></div></div>';
    document.body.appendChild(ui);status=ui.querySelector('#sho1re1-drive-status');joystickBase=ui.querySelector('#sho1re1-joy-base');joystickKnob=ui.querySelector('#sho1re1-joy-knob');uTurnButton=ui.querySelector('#sho1re1-uturn');uTurnButton.addEventListener('click',toggleUTurn);
    driveButton.addEventListener('click',start);
    joystickBase.addEventListener('pointerdown',joyStart);joystickBase.addEventListener('pointermove',joyMove);joystickBase.addEventListener('pointerup',joyEnd);joystickBase.addEventListener('pointercancel',joyEnd);joystickBase.addEventListener('lostpointercapture',joyEnd);
    ui.querySelector('#sho1re1-speed-gears').addEventListener('click',e=>{const b=e.target.closest('[data-gear]');if(!b)return;SPEED_MPS=Math.max(1,SPEED_MPS+(b.dataset.gear==='up'?2:-2));flashSpeed();});
    let touchY=null;
    ui.addEventListener('touchstart',e=>{if(e.target.closest('#sho1re1-joy-base,#sho1re1-speed-gears'))return;if(e.touches.length===1&&e.touches[0].clientY<75)touchY=e.touches[0].clientY},{passive:true});
    ui.addEventListener('touchend',e=>{if(touchY===null)return;const y=e.changedTouches[0].clientY;if(y-touchY>105)stop();touchY=null},{passive:true});
    window.addEventListener('keydown',e=>{if(active&&e.key==='Escape')stop()});
  }
  function syncVisibility(){
    if(!driveButton)return;
    const show=document.body.classList.contains('sho-map-only')&&!active&&hasMaxAccess();
    driveButton.hidden=!show;driveButton.style.display=show?'block':'none';driveButton.setAttribute('aria-hidden',show?'false':'true');
  }
  function toggleUTurn(){
    if(!active||!currentPoint)return;
    driveFacingBack=!driveFacingBack;
    driveRevision++;routeBusy=false;
    clearRoute();
    lastHeading=null;lastRouteAt=0;lastSteerRouteAt=0;
    selectedBranch=null;selectedBranchLine=null;selectedBranchCommit=false;
    waitingForJunctionChoice=false;
    currentHeading=(currentHeading+180)%360;
    joyEnd();
    if(uTurnButton){
      uTurnButton.dataset.reversed=driveFacingBack?'true':'false';
      uTurnButton.setAttribute('aria-pressed',driveFacingBack?'true':'false');
      uTurnButton.textContent=driveFacingBack?'↻ U-TURN':'↶ U-TURN';
    }
    setCar(currentPoint,currentHeading);
    lastVisualPoint=L.latLng(currentPoint.lat,currentPoint.lng);lastVisualHeading=currentHeading;
    if(roadMapEnabled&&window.Sho1re1RoadMap)window.Sho1re1RoadMap.setCamera(currentHeading,42);
    setStatus(driveFacingBack?'FACING BACK · DRIVE IN THIS DIRECTION':'FACING FORWARD · DRIVE IN THIS DIRECTION');
    refreshJunctionChoices();
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
  async function valhallaPost(path,payload){
    const run=async()=>{
      const wait=Math.max(0,1100-(Date.now()-lastValhallaRequestAt));
      if(wait)await new Promise(resolve=>setTimeout(resolve,wait));
      lastValhallaRequestAt=Date.now();
      const response=await fetch(ROUTER+path,{
        method:'POST',mode:'cors',cache:'no-store',
        headers:{'Content-Type':'application/json','X-Client-Id':'sho1re1-the12.github.io'},
        body:JSON.stringify(payload)
      });
      const raw=await response.text();
      let data;try{data=JSON.parse(raw)}catch(_){throw new Error('Valhalla returned an unreadable response (HTTP '+response.status+')')}
      if(!response.ok)throw new Error((data.error||data.message||'Valhalla HTTP '+response.status));
      if(data.error)throw new Error(data.error);
      return data;
    };
    const task=valhallaQueue.then(run,run);
    valhallaQueue=task.catch(()=>{});
    return task;
  }
  async function valhallaRoute(points,options){
    const locations=points.map((p,index)=>{
      const extra=options&&options[index]||{};
      return Object.assign({lat:p.lat,lon:p.lng,type:index===0||index===points.length-1?'break':'through'},extra);
    });
    const data=await valhallaPost('/route',{
      locations,costing:'auto',units:'kilometers',format:'osrm',
      shape_format:'geojson',directions_type:'instructions',
      alternates:points.length===2?0:0
    });
    if(data.code&&data.code!=='Ok')throw new Error(data.message||data.code);
    if(!data.routes||!data.routes.length)throw new Error('Valhalla found no drivable route');
    return data;
  }
  async function snapToRoad(p,heading,headingTolerance=55){
    const location={lat:p.lat,lon:p.lng};
    if(Number.isFinite(heading)){
      location.heading=(heading+360)%360;
      location.heading_tolerance=headingTolerance;
    }
    const data=await valhallaPost('/locate',{locations:[location],costing:'auto',verbose:false});
    const first=Array.isArray(data)?data[0]:null;
    const edge=first&&first.edges&&first.edges[0];
    if(edge&&Number.isFinite(edge.correlated_lat)&&Number.isFinite(edge.correlated_lon)){
      return L.latLng(edge.correlated_lat,edge.correlated_lon);
    }
    const waypoint=data.waypoints&&data.waypoints[0]&&data.waypoints[0].location;
    if(waypoint&&waypoint.length>=2)return L.latLng(waypoint[1],waypoint[0]);
    throw new Error('Valhalla could not snap this point to a drivable road');
  }
  function beginMapRotation(){
    if(rotationWrapper)return;
    const pane=mapRef.getPane('mapPane');if(!pane)return;
    rotationWrapper=document.createElement('div');
    rotationWrapper.className='sho1re1-map-rotation-wrapper';
    const size=mapRef.getSize();Object.assign(rotationWrapper.style,{position:'absolute',left:'0',top:'0',width:size.x+'px',height:size.y+'px',transformOrigin:'50% 50%',willChange:'transform',transition:'transform 260ms cubic-bezier(.22,.75,.25,1)'});
    const children=Array.from(pane.children);
    pane.appendChild(rotationWrapper);
    children.forEach(child=>rotationWrapper.appendChild(child));
  }
  function rotateMapTo(heading){
    if(rotationWrapper){const delta=((heading-cameraAngle+540)%360)-180;cameraAngle+=delta;rotationWrapper.style.transform='rotate('+(-cameraAngle)+'deg)';}
  }
  function endMapRotation(){
    if(!rotationWrapper)return;
    const pane=mapRef.getPane('mapPane');
    while(rotationWrapper.firstChild)pane.appendChild(rotationWrapper.firstChild);
    rotationWrapper.remove();rotationWrapper=null;
  }
  function setCar(p,angle){
    if(!car){
      car=L.marker(p,{icon:L.divIcon({className:'sho1re1-drive-car',html:'<div style="width:34px;height:52px;transform:rotate(0deg);transition:transform 260ms cubic-bezier(.22,.75,.25,1);filter:drop-shadow(0 5px 7px #0009)"><svg viewBox="0 0 34 52" width="34" height="52"><path d="M8 3Q17 -1 26 3L31 14V43Q31 49 25 49H9Q3 49 3 43V14Z" fill="#f8fafc" stroke="#17191d" stroke-width="2"/><path d="M8 13Q17 8 26 13L28 26H6Z" fill="#536579"/><path d="M7 34H27V43H7Z" fill="#b8c5d3"/><rect x="0" y="15" width="4" height="10" rx="2" fill="#17191d"/><rect x="30" y="15" width="4" height="10" rx="2" fill="#17191d"/></svg></div>',iconSize:[42,58],iconAnchor:[21,29]}),zIndexOffset:5000,interactive:false}).addTo(mapRef);
    }else{car.setLatLng(p);const el=car.getElement(),body=el&&el.querySelector('div');if(body)body.style.transform='rotate('+(angle||0)+'deg)'}
  }
  function clearTurnCard(){
    selectedBranch=null;selectedBranchLine=null;selectedBranchCommit=false;
    junctionOptions=[];junctionRouteDistance=Infinity;waitingForJunctionChoice=false;
    branchFetchVersion++;branchFetchBusy=false;branchFetchKey='';
    branchLines.forEach(line=>{if(mapRef.hasLayer(line))mapRef.removeLayer(line)});
    branchLines=[];
  }
  function flashSpeed(){
    if(!car)return;
    const label=Math.round(SPEED_MPS*3.6)+' km/h';
    const icon=L.divIcon({className:'',html:'<div style="padding:4px 7px;border-radius:8px;background:#101820ed;color:white;font:800 12px Inter,system-ui;white-space:nowrap;box-shadow:0 3px 12px #0008">'+label+'</div>',iconSize:[72,24],iconAnchor:[36,30]});
    if(car._speedFlash){car._speedFlash.setIcon(icon);car._speedFlash.setLatLng(currentPoint)}
    else car._speedFlash=L.marker(currentPoint,{icon,interactive:false,zIndexOffset:9000}).addTo(mapRef);
    clearTimeout(speedFlashTimer);speedFlashTimer=setTimeout(()=>{if(car&&car._speedFlash){mapRef.removeLayer(car._speedFlash);car._speedFlash=null}},900);
  }
  function clearRoute(){
    routePoints=[];routeLengths=[];routeDistance=0;routeTotal=0;routeSegmentIndex=0;routeSegmentStart=0;routeSteps=[];clearTurnCard();
    if(routeLine){mapRef.removeLayer(routeLine);routeLine=null}
  }
  function setRoute(coords,steps){
    clearRoute();routePoints=coords.map(c=>L.latLng(c[1],c[0]));routeSteps=steps||[];
    for(let i=1;i<routePoints.length;i++){const segment=mapRef.distance(routePoints[i-1],routePoints[i]);routeLengths.push(segment);routeTotal+=segment}routeSegmentIndex=0;routeSegmentStart=0
    if(routePoints.length<2||routeTotal<2)throw new Error('Valhalla returned an unusable road route');
    currentHeading=bearing(routePoints[0],routePoints[1]);
    routeLine=L.polyline(routePoints,{color:'#27a7ff',weight:5,opacity:.78,lineCap:'round',lineJoin:'round',interactive:false}).addTo(mapRef);
  }
  function pointAt(distance){
    const d=Math.max(0,Math.min(routeTotal,distance));
    // routeDistance only moves forward; reuse the current segment instead
    // of scanning all earlier route geometry on every frame.
    while(routeSegmentIndex<routeLengths.length-1&&
      d>routeSegmentStart+routeLengths[routeSegmentIndex]){
      routeSegmentStart+=routeLengths[routeSegmentIndex];
      routeSegmentIndex++;
    }
    const i=routeSegmentIndex,seg=routeLengths[i]||0;
    const t=seg?Math.max(0,Math.min(1,(d-routeSegmentStart)/seg)):0;
    const a=routePoints[i],b=routePoints[Math.min(i+1,routePoints.length-1)];
    return {point:L.latLng(a.lat+(b.lat-a.lat)*t,a.lng+(b.lng-a.lng)*t),angle:bearing(a,b)};
  }
  function distanceAlongRouteTo(target,tolerance=42){
    if(routePoints.length<2||routeLengths.length!==routePoints.length-1)return Infinity;
    const cos=Math.cos(target.lat*Math.PI/180);
    const xy=p=>({x:(p.lng-target.lng)*111320*cos,y:(p.lat-target.lat)*110540});
    let walked=0,bestCross=Infinity,bestAlong=Infinity;
    for(let i=0;i<routeLengths.length;i++){
      const len=routeLengths[i],end=walked+len;
      if(end>=routeDistance&&len>0){
        const a=xy(routePoints[i]),b=xy(routePoints[i+1]),dx=b.x-a.x,dy=b.y-a.y;
        const minT=Math.max(0,(routeDistance-walked)/len);
        if(minT<=1){
          const rawT=(-(a.x*dx+a.y*dy)/(dx*dx+dy*dy));
          const t=Math.max(minT,Math.min(1,rawT));
          const cross=Math.hypot(a.x+dx*t,a.y+dy*t);
          const along=Math.max(0,walked+len*t-routeDistance);
          if(cross<bestCross){bestCross=cross;bestAlong=along;}
        }
      }
      walked=end;
    }
    return bestCross<=tolerance?bestAlong:Infinity;
  }
  let graphRefreshPending=false;
  async function fetchBranchHighlights(found){
    if(!found.length)return;
    const signature=found.map(x=>x.key).sort().join('|');
    if(signature===branchFetchKey||branchFetchBusy)return;
    branchFetchBusy=true;branchFetchKey=signature;
    const version=++branchFetchVersion,graph=window.Sho1re1RoadGraph;
    // Draw from the exact OSM edges already loaded; no extra Valhalla preview
    // requests, no nearest-road ambiguity, and no missing branch due to routing.
    const results=found.map(item=>{
      const points=graph&&graph.getBranchPath?graph.getBranchPath(item,720):[];
      return points.length>1?{item,coords:points}:null;
    });
    if(version!==branchFetchVersion||!active){branchFetchBusy=false;return}
    branchLines.forEach(line=>{if(mapRef.hasLayer(line))mapRef.removeLayer(line)});branchLines=[];
    results.filter(Boolean).forEach(({item,coords})=>{
      const line=L.polyline(coords.map(p=>[p.lat,p.lng]),{
        color:'#078cff',weight:13,opacity:.96,lineCap:'round',lineJoin:'round',
        interactive:true,bubblingMouseEvents:false,renderer:(branchRenderer||(branchRenderer=L.canvas()))
      }).addTo(mapRef);
      line._shoBranch=item;
      line.on('click',e=>{if(e.originalEvent){e.originalEvent.preventDefault();e.originalEvent.stopPropagation()}chooseTurn(item.bearing,item.point,item)});
      line.bindTooltip('TAP TO SELECT THIS ROAD',{sticky:true,direction:'top'});
      branchLines.push(line);
    });
    branchFetchBusy=false;
    if(branchLines.length)setStatus(waitingForJunctionChoice?'JUNCTION AHEAD · CAR PAUSED · TAP A BLUE ROAD':'TAP A BLUE ROAD TO TAKE IT');
    else setStatus('JUNCTION FOUND · LOADING ROAD CONNECTIONS…');
  }
  function refreshJunctionChoices(){
    if(!currentPoint||!window.Sho1re1RoadGraph)return;
    const graph=window.Sho1re1RoadGraph;
    if(committedJunctionPoint&&distanceAlongRouteTo(committedJunctionPoint,85)===Infinity){
      committedJunctionNodeId=null;committedJunctionPoint=null;
    }
    const detected=graph.getBranches(currentPoint,680,currentHeading);
    const found=committedJunctionNodeId===null?detected:detected.filter(item=>String(item.nodeId)!==String(committedJunctionNodeId));
    junctionOptions=found.slice();
    junctionRouteDistance=Infinity;
    if(routePoints.length>1){
      found.forEach(item=>{
        const along=distanceAlongRouteTo(item.point);
        if(along<junctionRouteDistance)junctionRouteDistance=along;
      });
    }
    if(!graphRefreshPending){
      graphRefreshPending=true;
      graph.refresh(currentPoint).then(updated=>{graphRefreshPending=false;if(active&&updated)refreshJunctionChoices()})
        .catch(err=>{graphRefreshPending=false;console.warn('MAX road graph refresh:',err)});
    }
    if(found.length){
      fetchBranchHighlights(found);
    }else {
      if(!branchFetchBusy&&branchFetchKey){
      branchFetchVersion++;branchFetchKey='';
      branchLines.forEach(line=>{if(mapRef.hasLayer(line))mapRef.removeLayer(line)});branchLines=[];
      }
    }
  }
  function angleDifference(a,b){return Math.abs(((a-b+540)%360)-180)}
  async function chooseTurn(heading,junctionPoint,branch){
    if(!active||routeBusy||!currentPoint)return;
    const revision=driveRevision;
    routeBusy=true;setStatus('LOCKING SELECTED ROAD…');
    try{
      const turnPoint=junctionPoint||currentPoint;
      const chosen=Math.round((heading+360)%360);
      // Force the route through the selected junction and onto the chosen arm.
      // Valhalla's intermediate "through" location prevents a U-turn there.
      const graph=window.Sho1re1RoadGraph;
      const preview=branch&&graph&&graph.getBranchPath?graph.getBranchPath(branch,720):[];
      const aim=preview.length>1?L.latLng(preview[preview.length-1].lat,preview[preview.length-1].lng):destination(turnPoint,heading,ROUTE_LOOKAHEAD_METERS);
      const endpointHeading=preview.length>1?bearing(
        L.latLng(preview[preview.length-2].lat,preview[preview.length-2].lng),aim
      ):heading;
      const data=await valhallaRoute([currentPoint,turnPoint,aim],[
        {heading:currentHeading,heading_tolerance:45},
        {heading:chosen,heading_tolerance:18,type:'through'},
        {heading:endpointHeading,heading_tolerance:30}
      ]);
      if(!active||revision!==driveRevision)return;
      // Inspect each valid path at the
      // selected junction and choose the route that actually exits along
      // the tapped OSM branch (rather than blindly taking routes[0]).
      const candidates=data.routes||[];
      let selected=null,selectedScore=Infinity;
      for(const candidate of candidates){
        const geometry=candidate.geometry&&candidate.geometry.coordinates;
        if(!geometry||geometry.length<3)continue;
        let junctionIndex=0,best=Infinity;
        for(let i=0;i<geometry.length;i++){
          const p=L.latLng(geometry[i][1],geometry[i][0]),dist=mapRef.distance(p,turnPoint);
          if(dist<best){best=dist;junctionIndex=i}
        }
        if(best>45||junctionIndex>=geometry.length-1)continue;
        // Measure the outgoing direction over a useful distance. The first
        // geometry segment can be tiny/noisy on curved roads and at snapped nodes.
        let sampleIndex=junctionIndex+1;
        while(sampleIndex<geometry.length-1&&
          mapRef.distance(
            L.latLng(geometry[junctionIndex][1],geometry[junctionIndex][0]),
            L.latLng(geometry[sampleIndex][1],geometry[sampleIndex][0])
          )<22)sampleIndex++;
        const sample=L.latLng(geometry[sampleIndex][1],geometry[sampleIndex][0]);
        const actual=bearing(turnPoint,sample);
        const deviation=angleDifference(actual,heading);
        if(deviation<selectedScore){selectedScore=deviation;selected={route:candidate,geometry};}
      }
      if(!selected)throw new Error('Router could not reach the selected junction');
      if(selectedScore>72)throw new Error('Router did not follow the selected road ('+Math.round(selectedScore)+'° off)');
      setRoute(selected.geometry,selected.route.legs&&selected.route.legs[0]&&selected.route.legs[0].steps);
      committedJunctionNodeId=branch&&branch.nodeId!==undefined?String(branch.nodeId):null;
      committedJunctionPoint=branch?turnPoint:null;
      refreshJunctionChoices();
      setStatus('SELECTED ROAD LOCKED · KEEP DRIVING');
    }catch(err){
      selectedBranchCommit=false;
      setStatus('COULD NOT LOCK THAT ROAD · TRY THE BLUE LINE');
      console.warn('MAX Valhalla turn selection:',err);
    }finally{if(revision===driveRevision)routeBusy=false}
  }
  async function requestRoute(force){
    if(!active||routeBusy||!joystick.active||waitingForJunctionChoice)return;
    // Valhalla route generation is independent of OSM junction discovery.
    // Missing junction coverage must never prevent a normal road route.
    const now=Date.now();if(!force&&now-lastRouteAt<1100)return;
    const throttle=Math.max(0,Math.min(1,-joystick.y));if(throttle<.16)return;
    const heading=(currentHeading+joystick.x*82+360)%360;
    if(!force&&lastHeading!==null&&Math.abs(((heading-lastHeading+540)%360)-180)<24&&routeDistance<routeTotal-45)return;
    const revision=driveRevision;
    routeBusy=true;lastRouteAt=now;lastHeading=heading;
    try{
      const from=currentPoint,aim=destination(from,heading,ROUTE_LOOKAHEAD_METERS);
      const data=await valhallaRoute([from,aim],[
        {heading:currentHeading,heading_tolerance:30},
        {heading:heading,heading_tolerance:45}
      ]);
      if(!active||revision!==driveRevision)return;
      const route=data.routes&&data.routes[0],coords=route&&route.geometry&&route.geometry.coordinates;
      if(!coords||coords.length<2)throw new Error('No connected road route in that direction');
      setRoute(coords,route.legs&&route.legs[0]&&route.legs[0].steps);refreshJunctionChoices();setStatus('ROAD NETWORK · '+Math.round(route.distance)+' M AHEAD');
    }catch(err){setStatus('NO ROAD THAT WAY · STEER AGAIN');console.warn('MAX Valhalla route:',err)}
    finally{if(revision===driveRevision)routeBusy=false}
  }
  function frame(now){
    if(!active)return;
    // Cap expensive map/route work to 30 updates per second on mobile.
    // This is still smooth motion, while avoiding 60+ full map redraw cycles.
    if(lastFrame&&now-lastFrame<1000/30){raf=requestAnimationFrame(frame);return}
    if(!lastFrame)lastFrame=now;
    const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;
    const throttle=Math.max(0,Math.min(1,-joystick.y));
    if(!selectedBranch&&junctionOptions.length&&junctionRouteDistance<=42&&!waitingForJunctionChoice){
      waitingForJunctionChoice=true;
      setStatus('JUNCTION AHEAD · CAR PAUSED · CHOOSE A BLUE ROAD');
    }
    if(selectedBranch&&throttle>.35&&!selectedBranchCommit&&!routeBusy){selectedBranchCommit=true;const chosen=selectedBranch;chooseTurn(chosen.bearing,chosen.point,chosen);}
    if(!selectedBranch&&!waitingForJunctionChoice&&throttle>.16&&routePoints.length>1&&!routeBusy){
      routeDistance=Math.min(routeTotal,routeDistance+SPEED_MPS*throttle*dt);
      const at=pointAt(routeDistance);currentPoint=at.point;currentHeading=at.angle;
      if(now-lastJunctionRefresh>300){refreshJunctionChoices();lastJunctionRefresh=now;}
      if(routeDistance>=routeTotal-8){clearRoute();setStatus('LOADING ROAD AHEAD…');requestRoute(true)}
    }else if(!selectedBranch&&!waitingForJunctionChoice&&throttle>.16&&routePoints.length===0&&!routeBusy){requestRoute(true)}
    if(!selectedBranch&&!waitingForJunctionChoice&&throttle>.16&&Math.abs(joystick.x)>.34&&routePoints.length>1&&!routeBusy&&now-lastSteerRouteAt>950){lastSteerRouteAt=now;clearRoute();requestRoute(true)}
    // Avoid repeatedly asking Leaflet to redraw an unchanged map while
    // the joystick is idle. During movement, keep the same per-frame follow.
    if(currentPoint&&(!lastVisualPoint||
      Math.pow(currentPoint.lat-lastVisualPoint.lat,2)+
      Math.pow(currentPoint.lng-lastVisualPoint.lng,2)>2.5e-11||
      angleDifference(lastVisualHeading,currentHeading)>.25)){
      mapRef.panTo(currentPoint,{animate:false});
      setCar(currentPoint,currentHeading);
      lastVisualPoint=L.latLng(currentPoint.lat,currentPoint.lng);
      lastVisualHeading=currentHeading;
    }
    raf=requestAnimationFrame(frame);
  }
  function lockMapInteractions(){
    if(mapInteractionState)return;
    mapInteractionState={dragging:!!(mapRef.dragging&&mapRef.dragging.enabled&&mapRef.dragging.enabled())};
    if(mapRef.dragging&&mapRef.dragging.disable)mapRef.dragging.disable();
  }
  function restoreMapInteractions(){
    if(!mapInteractionState)return;
    if(mapInteractionState.dragging&&mapRef.dragging&&mapRef.dragging.enable)mapRef.dragging.enable();
    mapInteractionState=null;
  }
  function hideGpsMarker(){
    document.querySelectorAll('.sho1re1-live-user-marker,.sho1re1-user-accuracy').forEach(el=>{el.dataset.driveHidden='1';el.style.opacity='0'});
  }
  function restoreGpsMarker(){document.querySelectorAll('[data-drive-hidden="1"]').forEach(el=>{el.style.opacity='';delete el.dataset.driveHidden})}
  async function start(){
    if(active||loading)return;
    loading=true;buildUI();ui.hidden=false;setStatus('VERIFYING MAX ACCESS…');
    const graph=window.Sho1re1RoadGraph;
    const graphWarm=graph&&graph.preload?graph.preload().catch(()=>null):Promise.resolve(null);
    const roadMap=window.Sho1re1RoadMap;
    const mapWarm=roadMap&&roadMap.preload?roadMap.preload().then(()=>({ok:true})).catch(error=>({error})):Promise.resolve({ok:true});
    if(!hasMaxAccess()){
      const a=window.Sho1re1Pro;if(a)await a.refresh();
      if(!hasMaxAccess()){loading=false;ui.hidden=true;syncVisibility();return}
    }
    setStatus('LOADING ROAD MAP…');
    const [mapResult]=await Promise.all([mapWarm,graphWarm]);
    if(mapResult.error){failStart('MAP LAYER FAILED',mapResult.error);return}
    try{
      if(roadMap){await roadMap.enable(mapRef);roadMapEnabled=true}
      else throw new Error('OpenFreeMap layer plugin is missing');
    }catch(err){failStart('MAP LAYER FAILED',err);return}
    try{
      // Drive mode is map-based now: never request or imitate device GPS.
      // Start at the current map centre; the user chooses any blue road.
      currentPoint=mapRef.getCenter();
      currentHeading=0;driveFacingBack=false;
      lastVisualPoint=L.latLng(currentPoint.lat,currentPoint.lng);lastVisualHeading=currentHeading;
      if(uTurnButton){uTurnButton.dataset.reversed='false';uTurnButton.setAttribute('aria-pressed','false');uTurnButton.textContent='↶ U-TURN';}
      active=true;loading=false;ui.hidden=false;
      setCar(currentPoint,currentHeading);
      if(roadMap){roadMap.setCamera(0,42);lastCameraBearing=0;}
      cameraAngle=0;mapRef.setView(currentPoint,Math.max(17,mapRef.getZoom()),{animate:false});
      lockMapInteractions();
      document.body.classList.add('sho1re1-driving');
      setStatus('TAP ANY BLUE ROAD TO MOVE THE CAR THERE');
      if(graph){
        // Restore the complete fixed Sawantwadi blue-road overlay independently
        // of the nearby junction graph. A graph/Overpass failure must not block it.
        const cachedTown=graph.getTownRoadLines();
        if(cachedTown&&cachedTown.length)drawTownRoadLayer(cachedTown);
        if(!townRoadLoadStarted){
          townRoadLoadStarted=true;
          graph.loadTown(currentPoint).then(()=>{
            if(!active)return;
            const lines=graph.getTownRoadLines();
            if(lines&&lines.length)drawTownRoadLayer(lines);
            setStatus('ALL SAWANTWADI ROADS LOADED · TAP ANY BLUE ROAD');
          }).catch(err=>{
            townRoadLoadStarted=false;
            console.warn('MAX Sawantwadi road overlay:',err);
            if(active)setStatus('ROAD MAP FAILED · '+(err.message||'TRY AGAIN'));
          });
        }
        graph.refresh(currentPoint).then(()=>{
          if(!active)return;
          refreshJunctionChoices();
        }).catch(err=>{
          console.warn('MAX initial junction graph:',err);
          if(active)setStatus('BLUE ROAD MAP · JUNCTION DATA UNAVAILABLE');
        });
      }
      lastFrame=0;raf=requestAnimationFrame(frame);
    }catch(err){failStart('DRIVE MODE FAILED',err)}
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
    driveRevision++;routeBusy=false;driveFacingBack=false;
    townRoadLoadStarted=false;
    if(uTurnButton){uTurnButton.dataset.reversed='false';uTurnButton.setAttribute('aria-pressed','false');uTurnButton.textContent='↶ U-TURN';}
    active=false;loading=false;cancelAnimationFrame(raf);raf=0;lastFrame=0;lastVisualPoint=null;lastVisualHeading=NaN;joyEnd();
    if(car){if(car._speedFlash)mapRef.removeLayer(car._speedFlash);mapRef.removeLayer(car);car=null}clearRoute();clearTurnCard();if(townRoadLayer&&mapRef.hasLayer(townRoadLayer))mapRef.removeLayer(townRoadLayer);townRoadLayer=null;restoreGpsMarker();
    committedJunctionNodeId=null;committedJunctionPoint=null;
    mapRef.stop();endMapRotation();cameraAngle=0;if(roadMapEnabled&&window.Sho1re1RoadMap){window.Sho1re1RoadMap.resetCamera();window.Sho1re1RoadMap.disable(mapRef)}roadMapEnabled=false;lastCameraBearing=null;
    restoreMapInteractions();
    document.body.classList.remove('sho1re1-driving');if(ui)ui.hidden=true;syncVisibility();
  }
  buildUI();
  const observer=new MutationObserver(syncVisibility);observer.observe(document.body,{attributes:true,attributeFilter:['class']});syncVisibility();
  const access=window.Sho1re1Pro;if(access){access.onChange(()=>{if(active&&!hasMaxAccess())stop();syncVisibility()});access.check().then(syncVisibility)}
  window.addEventListener('sho1re1:prochange',()=>{if(active&&!hasMaxAccess())stop();syncVisibility()});
  window.addEventListener('pagehide',stop);
  window.Sho1re1Drive={start,stop,isActive:()=>active};
})();
