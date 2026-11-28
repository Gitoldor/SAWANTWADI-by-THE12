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
  let active=false, loading=false, gpsWatch=null, car=null, routeLine=null, raf=0;
  let ui=null, driveButton=null, joystickBase=null, joystickKnob=null, status=null, junctionMarkers=[], branchLines=[], branchFetchKey='', branchFetchBusy=false, branchFetchVersion=0, speedFlashTimer=0, lastJunctionRefresh=0;
  let joystick={x:0,y:0,active:false};
  let routePoints=[], routeLengths=[], routeDistance=0, routeTotal=0;
  let lastFrame=0, lastRouteAt=0, lastHeading=null, currentPoint=null, currentHeading=0, routeBusy=false, routeSteps=[], routeTurnShown=null;
  let roadMapEnabled=false, lastCameraBearing=null, rotationWrapper=null, cameraAngle=0;
  let townRoadLayer=null,townRoadLoadStarted=false;
  let mapInteractionState=null, lastSteerRouteAt=0, selectedBranch=null, selectedBranchLine=null, selectedBranchCommit=false;
  let junctionOptions=[], junctionRouteDistance=Infinity, waitingForJunctionChoice=false;
  let committedJunctionNodeId=null, committedJunctionPoint=null;

  const style=document.createElement('style');
  style.textContent=`
    #sho1re1-drive-button{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));transform:translate(-50%,18px) scale(.94);z-index:1000002;border:1px solid #ffffff35;border-radius:999px;padding:13px 23px;background:rgba(15,17,20,.93);color:#fff;font:750 13px Inter,system-ui,sans-serif;letter-spacing:.08em;box-shadow:0 12px 35px #0007;backdrop-filter:blur(18px);opacity:0;pointer-events:none;transition:.3s}
    body.sho-map-only #sho1re1-drive-button{opacity:1;pointer-events:auto;transform:translate(-50%,0) scale(1)}
    #sho1re1-drive-ui{position:fixed;inset:0;z-index:1000003;pointer-events:none;font-family:Inter,system-ui,sans-serif}
    #sho1re1-drive-status{position:absolute;top:calc(72px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);max-width:calc(100vw - 36px);overflow:hidden;text-overflow:ellipsis;padding:8px 13px;border:1px solid #ffffff28;border-radius:20px;background:#101216e8;color:#fff;font-size:10px;font-weight:750;white-space:nowrap}
    #sho1re1-joy-base{position:absolute;right:16px;bottom:calc(26px + env(safe-area-inset-bottom));width:142px;height:142px;border-radius:50%;border:1px solid #ffffff50;background:radial-gradient(circle,#ffffff1c,#101216c9 68%);box-shadow:0 12px 36px #0008;backdrop-filter:blur(10px);pointer-events:auto;touch-action:none}
    #sho1re1-joy-base:before{content:'DRIVE';position:absolute;inset:0;display:grid;place-items:center;color:#ffffff55;font-size:10px;font-weight:800;letter-spacing:.18em}
    #sho1re1-joy-knob{position:absolute;left:50%;top:50%;width:56px;height:56px;transform:translate(-50%,-50%);border-radius:50%;border:1px solid #fff;background:linear-gradient(145deg,#fff,#aeb6c3);box-shadow:0 5px 20px #0008;pointer-events:none}
    #sho1re1-speed-gears{position:absolute;right:20px;bottom:calc(184px + env(safe-area-inset-bottom));display:flex;gap:7px;pointer-events:auto}
    .sho1re1-gear{width:40px;height:32px;border:1px solid #ffffff45;border-radius:10px;background:#111923ef;color:#fff;font:800 17px Inter,system-ui,sans-serif;box-shadow:0 5px 18px #0007;touch-action:manipulation}
    .sho1re1-gear:active{background:#247edb;transform:scale(.94)}
    #sho1re1-drive-ui[hidden]{display:none}
    .sho1re1-arrow-icon{background:transparent!important;border:0!important}
    .sho1re1-junction-arrow{width:44px;height:44px;display:grid;place-items:center;border:2px solid #fff;border-radius:50%;background:#006fe8;color:#fff;box-shadow:0 3px 16px #001a35cc,0 0 0 4px #087de044;cursor:pointer;touch-action:manipulation}
    .sho1re1-junction-arrow svg{width:29px;height:29px;filter:drop-shadow(0 1px 2px #00264f)}
    .sho1re1-junction-arrow:active{background:#16a36a;transform:scale(1.14)}
    #sho1re1-turn-choices{position:absolute;left:12px;bottom:calc(22px + env(safe-area-inset-bottom));width:min(190px,calc(100vw - 178px));display:none;flex-direction:column;gap:7px;pointer-events:auto;z-index:4}
    #sho1re1-turn-choices.show{display:flex}
    .sho1re1-turn-choice{display:flex;align-items:center;gap:9px;width:100%;min-height:44px;padding:8px 11px;border:1px solid #ffffff55;border-radius:13px;background:rgba(8,19,31,.94);color:#fff;text-align:left;font:800 11px Inter,system-ui,sans-serif;box-shadow:0 5px 18px #0008;touch-action:manipulation}
    .sho1re1-turn-choice:active{background:#087de0;transform:scale(.98)}
    .sho1re1-turn-choice b{font-size:19px;line-height:1;color:#49b5ff;width:22px;text-align:center}
    @media(max-width:380px){#sho1re1-joy-base{width:128px;height:128px;right:12px;bottom:calc(18px + env(safe-area-inset-bottom))}#sho1re1-joy-knob{width:52px;height:52px}}
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
  function drawTownRoadLayer(lines){
    if(!Array.isArray(lines)||!lines.length)return false;
    if(townRoadLayer&&mapRef.hasLayer(townRoadLayer))mapRef.removeLayer(townRoadLayer);
    townRoadLayer=L.polyline(lines,{
      renderer:L.canvas(),color:'#078cff',weight:3.5,opacity:.82,
      lineCap:'round',lineJoin:'round',interactive:false,smoothFactor:1.4
    }).addTo(mapRef);
    townRoadLayer.bringToBack();
    return true;
  }
  function buildUI(){
    if(ui)return;
    driveButton=document.createElement('button');driveButton.id='sho1re1-drive-button';driveButton.type='button';driveButton.textContent='START DRIVE';driveButton.hidden=true;document.body.appendChild(driveButton);
    ui=document.createElement('div');ui.id='sho1re1-drive-ui';ui.hidden=true;
    ui.innerHTML='<div id="sho1re1-drive-status">READY</div><div id="sho1re1-turn-choices" aria-live="polite"></div><div id="sho1re1-speed-gears"><button class="sho1re1-gear" type="button" data-gear="up" aria-label="Increase speed">＋</button><button class="sho1re1-gear" type="button" data-gear="down" aria-label="Decrease speed">−</button></div><div id="sho1re1-joy-base" aria-label="Driving joystick"><div id="sho1re1-joy-knob"></div></div>';
    document.body.appendChild(ui);status=ui.querySelector('#sho1re1-drive-status');joystickBase=ui.querySelector('#sho1re1-joy-base');joystickKnob=ui.querySelector('#sho1re1-joy-knob');
    const turnChoices=ui.querySelector('#sho1re1-turn-choices');
    turnChoices.addEventListener('click',e=>{const b=e.target.closest('[data-turn-index]');if(!b)return;const item=turnChoices._branches&&turnChoices._branches[Number(b.dataset.turnIndex)];if(item)chooseTurn(item.bearing,item.point,item)});
    driveButton.addEventListener('click',start);
    joystickBase.addEventListener('pointerdown',joyStart);joystickBase.addEventListener('pointermove',joyMove);joystickBase.addEventListener('pointerup',joyEnd);joystickBase.addEventListener('pointercancel',joyEnd);joystickBase.addEventListener('lostpointercapture',joyEnd);joystickBase.addEventListener('dblclick',selectBranchFromJoystick);
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
  function joyStart(e){e.preventDefault();joystick.active=true;try{joystickBase.setPointerCapture(e.pointerId)}catch(_){}joyMove(e)}
  function joyMove(e){
    if(!joystick.active)return;
    const r=joystickBase.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,max=r.width*.31;
    let dx=e.clientX-cx,dy=e.clientY-cy,mag=Math.hypot(dx,dy)||1;if(mag>max){dx=dx/mag*max;dy=dy/mag*max}
    joystick.x=dx/max;joystick.y=dy/max;joystickKnob.style.left='calc(50% + '+dx+'px)';joystickKnob.style.top='calc(50% + '+dy+'px)';
  }
  function joyEnd(){joystick.active=false;joystick.x=0;joystick.y=0;if(joystickKnob){joystickKnob.style.left='50%';joystickKnob.style.top='50%'}}
  function selectBranchFromJoystick(e){
    if(!active||!currentPoint||routeBusy)return;
    e.preventDefault();
    const panel=ui&&ui.querySelector('#sho1re1-turn-choices');
    const choices=panel&&panel._branches||[];
    if(!choices.length){setStatus('NO JUNCTION OPTIONS IN RANGE YET');return;}
    const rect=joystickBase.getBoundingClientRect(),dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2);
    if(Math.hypot(dx,dy)<rect.width*.13){setStatus('DOUBLE-TAP TOWARD LEFT, STRAIGHT OR RIGHT');return;}
    const desired=(currentHeading+Math.atan2(dx,-dy)*180/Math.PI+360)%360;
    let best=null,bestDiff=Infinity;
    choices.forEach(item=>{const diff=angleDifference(item.bearing,desired);if(diff<bestDiff){best=item;bestDiff=diff}});
    if(!best||bestDiff>78){setStatus('NO ROAD MATCHES THAT JOYSTICK DIRECTION');return;}
    waitingForJunctionChoice=false;selectedBranch=best;selectedBranchCommit=false;
    branchLines.forEach(line=>{const chosen=line._shoBranch===best;line.setStyle({color:chosen?'#ef3434':'#078cff',weight:chosen?16:13,opacity:chosen?1:.58});if(chosen)selectedBranchLine=line;});
    setStatus('ROAD SELECTED IN RED · PUSH JOYSTICK FORWARD');
  }
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
  async function snapToRoad(p,heading){
    const location={lat:p.lat,lon:p.lng};
    if(Number.isFinite(heading)){
      location.heading=(heading+360)%360;
      location.heading_tolerance=55;
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
    junctionMarkers.forEach(item=>{if(mapRef.hasLayer(item.marker))mapRef.removeLayer(item.marker)});
    junctionMarkers=[];branchFetchVersion++;branchFetchBusy=false;branchFetchKey='';
    const choices=ui&&ui.querySelector('#sho1re1-turn-choices');if(choices){choices.classList.remove('show');choices.innerHTML='';choices._branches=[];}
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
    routePoints=[];routeLengths=[];routeDistance=0;routeTotal=0;routeSteps=[];clearTurnCard();
    if(routeLine){mapRef.removeLayer(routeLine);routeLine=null}
  }
  function setRoute(coords,steps){
    clearRoute();routePoints=coords.map(c=>L.latLng(c[1],c[0]));routeSteps=steps||[];
    for(let i=1;i<routePoints.length;i++){const d=mapRef.distance(routePoints[i-1],routePoints[i]);routeLengths.push(d);routeTotal+=d}
    if(routePoints.length<2||routeTotal<2)throw new Error('Valhalla returned an unusable road route');
    currentHeading=bearing(routePoints[0],routePoints[1]);
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
  function renderTurnChoices(found){
    const panel=ui&&ui.querySelector('#sho1re1-turn-choices');if(!panel)return;
    panel._branches=found.slice();
    panel.innerHTML='';
    found.forEach((item,index)=>{
      const delta=((item.bearing-currentHeading+540)%360)-180;
      const label=Math.abs(delta)<28?'STRAIGHT':delta>0?'RIGHT TURN':'LEFT TURN';
      const glyph=Math.abs(delta)<28?'↑':delta>0?'→':'←';
      const button=document.createElement('button');button.type='button';button.className='sho1re1-turn-choice';button.dataset.turnIndex=String(index);
      button.innerHTML='<b>'+glyph+'</b><span>'+label+'<small style="display:block;opacity:.65;font-size:9px;margin-top:2px">'+Math.round(item.distance)+' m · SELECT ROAD</small></span>';
      panel.appendChild(button);
    });
    panel.classList.toggle('show',found.length>0);
  }
  function branchArrowPlacement(item){
    const graph=window.Sho1re1RoadGraph;
    const path=graph&&graph.getBranchPath?graph.getBranchPath(item,150):[];
    if(!Array.isArray(path)||path.length<2){
      return {point:destination(item.point,item.bearing,34),heading:item.bearing};
    }
    let remaining=32;
    for(let i=1;i<path.length;i++){
      const a=L.latLng(path[i-1].lat,path[i-1].lng),b=L.latLng(path[i].lat,path[i].lng);
      const length=mapRef.distance(a,b);
      if(length>=remaining){
        const t=length?remaining/length:0;
        return {
          point:L.latLng(a.lat+(b.lat-a.lat)*t,a.lng+(b.lng-a.lng)*t),
          heading:bearing(a,b)
        };
      }
      remaining-=length;
    }
    const a=L.latLng(path[path.length-2].lat,path[path.length-2].lng);
    const b=L.latLng(path[path.length-1].lat,path[path.length-1].lng);
    return {point:b,heading:bearing(a,b)};
  }
  async function fetchBranchHighlights(found){
    if(!found.length)return;
    renderTurnChoices(found);
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
        interactive:true,bubblingMouseEvents:false,renderer:L.canvas()
      }).addTo(mapRef);
      line._shoBranch=item;
      line.on('click',e=>{if(e.originalEvent){e.originalEvent.preventDefault();e.originalEvent.stopPropagation()}chooseTurn(item.bearing,item.point,item)});
      line.bindTooltip('TAP TO SELECT THIS ROAD',{sticky:true,direction:'top'});
      branchLines.push(line);
    });
    branchFetchBusy=false;
    if(branchLines.length)setStatus(waitingForJunctionChoice?'JUNCTION AHEAD · CAR PAUSED · TAP A ROAD ARROW':'TAP A BLUE ROAD OR DIRECTION ARROW TO TAKE IT');
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
    renderTurnChoices(found);
    if(!graphRefreshPending){
      graphRefreshPending=true;
      graph.refresh(currentPoint).then(updated=>{graphRefreshPending=false;if(active&&updated)refreshJunctionChoices()})
        .catch(err=>{graphRefreshPending=false;console.warn('MAX road graph refresh:',err)});
    }
    const keys=new Set(found.map(x=>x.key));
    junctionMarkers=junctionMarkers.filter(item=>{
      if(keys.has(item.key))return true;
      if(mapRef.hasLayer(item.marker))mapRef.removeLayer(item.marker);
      return false;
    });
    if(found.length){
      fetchBranchHighlights(found);
      found.forEach(item=>{
        if(junctionMarkers.some(x=>x.key===item.key))return;
        const arrow=branchArrowPlacement(item);
        const arrowSvg='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2 29 17h-8v13h-10V17H3Z" fill="#fff" stroke="#063b78" stroke-width="1.5" stroke-linejoin="round"/></svg>';
        const icon=L.divIcon({className:'sho1re1-arrow-icon',html:'<div class="sho1re1-junction-arrow" style="transform:rotate('+arrow.heading+'deg)">'+arrowSvg+'</div>',iconSize:[48,48],iconAnchor:[24,24]});
        const marker=L.marker(arrow.point,{keyboard:false,zIndexOffset:15000,pane:'markerPane',icon,interactive:true}).addTo(mapRef);
        marker.bindTooltip('TAP ARROW TO DRIVE ONTO THIS ROAD',{direction:'top'});
        marker.on('click',e=>{if(e.originalEvent)L.DomEvent.stopPropagation(e.originalEvent);chooseTurn(item.bearing,item.point,item)});
        junctionMarkers.push({key:item.key,marker});
      });
    }else {
      renderTurnChoices([]);
      if(!branchFetchBusy&&branchFetchKey){
      branchFetchVersion++;branchFetchKey='';
      branchLines.forEach(line=>{if(mapRef.hasLayer(line))mapRef.removeLayer(line)});branchLines=[];
      }
    }
  }
  function angleDifference(a,b){return Math.abs(((a-b+540)%360)-180)}
  async function chooseTurn(heading,junctionPoint,branch){
    if(!active||routeBusy||!currentPoint)return;
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
      // OSRM can return several valid paths. Inspect each one at the
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
    }finally{routeBusy=false}
  }
  async function requestRoute(force){
    if(!active||routeBusy||!joystick.active||waitingForJunctionChoice)return;
    // Valhalla route generation is independent of OSM junction discovery.
    // Missing junction coverage must never prevent a normal road route.
    const now=Date.now();if(!force&&now-lastRouteAt<1100)return;
    const throttle=Math.max(0,Math.min(1,-joystick.y));if(throttle<.16)return;
    const heading=(currentHeading+joystick.x*82+360)%360;
    if(!force&&lastHeading!==null&&Math.abs(((heading-lastHeading+540)%360)-180)<24&&routeDistance<routeTotal-45)return;
    routeBusy=true;lastRouteAt=now;lastHeading=heading;
    try{
      const from=currentPoint,aim=destination(from,heading,ROUTE_LOOKAHEAD_METERS);
      const data=await valhallaRoute([from,aim],[
        {heading:currentHeading,heading_tolerance:45},
        {heading:heading,heading_tolerance:45}
      ]);
      const route=data.routes&&data.routes[0],coords=route&&route.geometry&&route.geometry.coordinates;
      if(!coords||coords.length<2)throw new Error('No connected road route in that direction');
      setRoute(coords,route.legs&&route.legs[0]&&route.legs[0].steps);refreshJunctionChoices();setStatus('ROAD NETWORK · '+Math.round(route.distance)+' M AHEAD');
    }catch(err){setStatus('NO ROAD THAT WAY · STEER AGAIN');console.warn('MAX Valhalla route:',err)}
    finally{routeBusy=false}
  }
  function frame(now){
    if(!active)return;
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
    // Follow the vehicle continuously: pan the map beneath it so the car
    // remains at the centre of the screen throughout simulated movement.
    if(currentPoint){
      mapRef.panTo(currentPoint,{animate:false});
      setCar(currentPoint,currentHeading);
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
    if(!navigator.geolocation){loading=false;setStatus('GPS NOT AVAILABLE');return}
    setStatus('PREPARING GPS & ROAD CACHE…');
    const gpsPromise=new Promise(resolve=>{
      navigator.geolocation.getCurrentPosition(
        pos=>resolve({pos}),
        error=>resolve({error}),
        {enableHighAccuracy:true,timeout:20000,maximumAge:3000}
      );
    });
    const [gpsResult,mapResult]=await Promise.all([gpsPromise,mapWarm,graphWarm]);
    if(gpsResult.error){failStart('LOCATION PERMISSION NEEDED',gpsResult.error);return}
    if(mapResult.error){failStart('MAP LAYER FAILED',mapResult.error);return}
    try{
      if(roadMap){await roadMap.enable(mapRef);roadMapEnabled=true}
      else throw new Error('OpenFreeMap layer plugin is missing');
    }catch(err){failStart('MAP LAYER FAILED',err);return}
    try{
      const rawPoint=L.latLng(gpsResult.pos.coords.latitude,gpsResult.pos.coords.longitude);
      // Start the nearby OSM request while Valhalla snaps GPS to the road.
      const graphRequest=graph?graph.refresh(rawPoint).catch(err=>{
        console.warn('MAX initial junction graph:',err);
        if(active)setStatus('ROUTE READY · JUNCTION OPTIONS STILL LOADING');
        return false;
      }):Promise.resolve(false);
      setStatus('SNAPPING TO A REAL ROAD…');
      currentPoint=await snapToRoad(rawPoint);currentHeading=0;
      active=true;loading=false;ui.hidden=false;hideGpsMarker();setCar(currentPoint,0);
      if(roadMap){roadMap.setCamera(0,42);lastCameraBearing=0;}
      cameraAngle=0;mapRef.setView(currentPoint,Math.max(17,mapRef.getZoom()),{animate:false});
      lockMapInteractions();
      document.body.classList.add('sho1re1-driving');setStatus('STEER · TAP A ROAD ARROW AT ANY JUNCTION');

      if(graph){
        // Draw the last saved town roads immediately; update them quietly
        // if the background refresh returns newer OSM data.
        const cachedTown=graph.getTownRoadLines();
        if(cachedTown&&cachedTown.length)drawTownRoadLayer(cachedTown);
        refreshJunctionChoices();
        // Give the small, live junction graph first use of the Overpass
        // connection. The much larger town overlay follows without delaying it.
        graphRequest.then(()=>{
          if(!active)return;
          refreshJunctionChoices();
          if(townRoadLoadStarted)return;
          townRoadLoadStarted=true;
          graph.loadTown(currentPoint).then(()=>{
            if(!active)return;
            const lines=graph.getTownRoadLines();
            if(lines&&lines.length)drawTownRoadLayer(lines);
            if(status&&status.textContent==='STEER · TAP A ROAD ARROW AT ANY JUNCTION'){
              setStatus('SAWANTWADI ROAD NETWORK · '+lines.length+' ROADS IN BLUE');
            }
          }).catch(err=>{
            townRoadLoadStarted=false;
            console.warn('MAX Sawantwadi road overlay:',err);
            if(active&&(!status||status.textContent.startsWith('STEER')))setStatus('TOWN ROAD MAP FAILED · '+(err.message||'TRY AGAIN'));
          });
        });
      }
      lastFrame=0;raf=requestAnimationFrame(frame);
      gpsWatch=navigator.geolocation.watchPosition(
        p=>{ /* GPS is monitored; the simulated car remains road-constrained. */ },
        ()=>{},
        {enableHighAccuracy:true,maximumAge:1500,timeout:10000}
      );
    }catch(err){failStart('ROAD SNAP FAILED',err)}
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
