/* Sho1re1 MAX Drive — OSM road-network driving with a right-thumb joystick. */
(() => {
  'use strict';
  if (window.__sho1re1MaxDriveLoaded) return;
  window.__sho1re1MaxDriveLoaded = true;

  let mapRef;
  try { mapRef = map; } catch (_) {}
  if (!mapRef || !window.L) return;

  const OVERPASS = 'https://overpass-api.de/api/interpreter';
  const ROAD_RADIUS = 1100;
  const SPEED_MPS = 7.5;
  const roadsLayer = L.layerGroup();
  let graph = new Map(), edges = [], car = null, gpsWatch = null;
  let gps = null, currentEdge = null, progress = 0, direction = 1;
  let active = false, loading = false, lastFrame = 0, raf = 0;
  let joystick = { x: 0, y: 0, active: false };
  let ui, driveButton, joystickBase, joystickKnob, status;

  const style = document.createElement('style');
  style.textContent = `
    #sho1re1-drive-button{position:fixed;left:50%;bottom:calc(22px + env(safe-area-inset-bottom));transform:translate(-50%,18px) scale(.94);z-index:1000002;border:1px solid #ffffff35;border-radius:999px;padding:13px 23px;background:rgba(15,17,20,.91);color:#fff;font:750 13px Inter,system-ui,sans-serif;letter-spacing:.08em;box-shadow:0 12px 35px #0007;backdrop-filter:blur(18px);opacity:0;pointer-events:none;transition:.35s cubic-bezier(.2,.8,.2,1)}
    body.sho-map-only #sho1re1-drive-button{opacity:1;pointer-events:auto;transform:translate(-50%,0) scale(1)}
    #sho1re1-drive-ui{position:fixed;inset:0;z-index:1000003;pointer-events:none;font-family:Inter,system-ui,sans-serif}
    #sho1re1-drive-status{position:absolute;top:calc(18px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);padding:10px 15px;border:1px solid #ffffff28;border-radius:20px;background:#101216d9;color:#fff;font-size:11px;font-weight:700;letter-spacing:.04em;white-space:nowrap;box-shadow:0 5px 22px #0005}
    #sho1re1-drive-exit{position:absolute;top:calc(18px + env(safe-area-inset-top));right:16px;width:40px;height:40px;border:1px solid #ffffff30;border-radius:50%;background:#111d;color:#fff;font-size:21px;pointer-events:auto}
    #sho1re1-joy-base{position:absolute;right:22px;bottom:calc(30px + env(safe-area-inset-bottom));width:158px;height:158px;border-radius:50%;border:1px solid #ffffff50;background:radial-gradient(circle,#ffffff1c,#101216a8 68%);box-shadow:0 12px 36px #0008;backdrop-filter:blur(10px);pointer-events:auto;touch-action:none}
    #sho1re1-joy-base:before{content:'DRIVE';position:absolute;inset:0;display:grid;place-items:center;color:#ffffff55;font-size:10px;font-weight:800;letter-spacing:.18em}
    #sho1re1-joy-knob{position:absolute;left:50%;top:50%;width:62px;height:62px;transform:translate(-50%,-50%);border-radius:50%;border:1px solid #fff;background:linear-gradient(145deg,#fff,#aeb6c3);box-shadow:0 5px 20px #0008;pointer-events:none}
    #sho1re1-joy-knob:after{content:'';position:absolute;inset:13px;border:2px solid #20242b;border-radius:50%;opacity:.45}
    #sho1re1-drive-ui[hidden]{display:none}
    @media(max-width:380px){#sho1re1-joy-base{width:142px;height:142px;right:15px}#sho1re1-joy-knob{width:56px;height:56px}}
    @media(prefers-reduced-motion:reduce){#sho1re1-drive-button{transition:none}}
  `;
  document.head.appendChild(style);

  function buildUI() {
    if (ui) return;
    driveButton = document.createElement('button');
    driveButton.id = 'sho1re1-drive-button';
    driveButton.type = 'button';
    driveButton.textContent = 'START DRIVE';
    driveButton.hidden = true;
    document.body.appendChild(driveButton);
    ui = document.createElement('div');
    ui.id = 'sho1re1-drive-ui';
    ui.hidden = true;
    ui.innerHTML = '<div id="sho1re1-drive-status">CONNECTING TO ROADS</div><button id="sho1re1-drive-exit" type="button" aria-label="Exit drive">×</button><div id="sho1re1-joy-base" aria-label="Driving joystick"><div id="sho1re1-joy-knob"></div></div>';
    document.body.appendChild(ui);
    status = ui.querySelector('#sho1re1-drive-status');
    joystickBase = ui.querySelector('#sho1re1-joy-base');
    joystickKnob = ui.querySelector('#sho1re1-joy-knob');
    driveButton.addEventListener('click', start);
    ui.querySelector('#sho1re1-drive-exit').addEventListener('click', stop);
    joystickBase.addEventListener('pointerdown', joyStart);
    joystickBase.addEventListener('pointermove', joyMove);
    joystickBase.addEventListener('pointerup', joyEnd);
    joystickBase.addEventListener('pointercancel', joyEnd);
    joystickBase.addEventListener('lostpointercapture', joyEnd);
  }

  function setStatus(value) { if (status) status.textContent = value; }

  // MAX-only discovery: non-MAX users must not see or discover Drive at all.
  function hasMaxAccess() {
    const access = window.Sho1re1Pro;
    return !!(access && access.getCached() === true && /MAX/i.test(String(access.getPlanId() || '')));
  }
  function syncDriveVisibility() {
    if (!driveButton) return;
    const visible = document.body.classList.contains('sho-map-only') && !active && hasMaxAccess();
    driveButton.hidden = !visible;
    driveButton.style.display = visible ? 'block' : 'none';
    driveButton.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }
  function nodeKey(p) { return p.lat.toFixed(6) + ',' + p.lng.toFixed(6); }
  function addEdge(a, b) {
    const ak = nodeKey(a), bk = nodeKey(b);
    if (ak === bk) return;
    const edge = { a, b, ak, bk, length: mapRef.distance([a.lat,a.lng],[b.lat,b.lng]) };
    if (!Number.isFinite(edge.length) || edge.length < .5) return;
    edges.push(edge);
    if (!graph.has(ak)) graph.set(ak, []);
    if (!graph.has(bk)) graph.set(bk, []);
    graph.get(ak).push({ edge, dir: 1 });
    graph.get(bk).push({ edge, dir: -1 });
  }

  async function loadRoads(point) {
    const q = '[out:json][timeout:25];(way(around:' + ROAD_RADIUS + ',' + point.lat + ',' + point.lng + ')["highway"]["area"!="yes"]["highway"!~"footway|path|steps|pedestrian|cycleway|bridleway|corridor|construction|proposed"];);out geom;';
    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
      'https://overpass.private.coffee/api/interpreter'
    ];
    let data = null, lastError = null;
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 18000);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
          body: 'data=' + encodeURIComponent(q),
          signal: controller.signal,
          cache: 'no-store'
        });
        clearTimeout(timer);
        if (!response.ok) throw new Error('Road service returned ' + response.status);
        const candidate = await response.json();
        if (!candidate || !Array.isArray(candidate.elements)) throw new Error('Invalid road data');
        data = candidate;
        break;
      } catch (error) { lastError = error; }
    }
    if (!data) throw new Error('All road data servers failed: ' + (lastError && lastError.message || 'network error'));
    graph = new Map(); edges = [];
    roadsLayer.clearLayers();
    (data.elements || []).forEach(way => {
      const pts = (way.geometry || []).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon))
        .map(p => L.latLng(p.lat,p.lon));
      if (pts.length < 2) return;
      for (let i=1;i<pts.length;i++) addEdge(pts[i-1],pts[i]);
    });
    if (!edges.length) throw new Error('No mapped roads found nearby');
  }

  function nearestRoad(point) {
    let best = null, bestDistance = Infinity;
    edges.forEach(edge => {
      const a = L.latLng(edge.a), b = L.latLng(edge.b);
      const p = L.LineUtil.closestPointOnSegment(mapRef.latLngToLayerPoint(point),mapRef.latLngToLayerPoint(a),mapRef.latLngToLayerPoint(b));
      const ll = mapRef.layerPointToLatLng(p);
      const d = mapRef.distance(point,ll);
      if (d < bestDistance) {
        const full = edge.length || 1;
        const t = Math.max(0,Math.min(1,mapRef.distance([edge.a.lat,edge.a.lng],[ll.lat,ll.lng])/full));
        bestDistance = d; best = {edge,t,point:ll};
      }
    });
    return best;
  }

  function pointOn(edge,t) {
    return L.latLng(edge.a.lat+(edge.b.lat-edge.a.lat)*t,edge.a.lng+(edge.b.lng-edge.a.lng)*t);
  }
  function bearing(a,b) {
    const r=Math.PI/180, y=Math.sin((b.lng-a.lng)*r)*Math.cos(b.lat*r);
    const x=Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos((b.lng-a.lng)*r);
    return Math.atan2(y,x);
  }
  function chooseNext(node, incomingBearing) {
    const list=graph.get(node)||[];
    if (!list.length) return null;
    let best=null, score=Infinity;
    const wanted=Math.atan2(joystick.x,-joystick.y);
    list.forEach(item=>{
      const from=item.dir===1?item.edge.a:item.edge.b;
      const to=item.dir===1?item.edge.b:item.edge.a;
      const b=bearing(from,to);
      const diff=Math.atan2(Math.sin(b-wanted),Math.cos(b-wanted));
      const turn=Math.atan2(Math.sin(b-incomingBearing),Math.cos(b-incomingBearing));
      const s=Math.abs(diff)+Math.abs(turn)*.10;
      if(s<score){score=s;best=item;}
    });
    return best;
  }

  function setCar(point, angle) {
    if (!car) {
      car=L.marker(point,{icon:L.divIcon({
        className:'sho1re1-drive-car',
        html:'<div style="width:34px;height:52px;transform:rotate('+(angle||0)+'deg);filter:drop-shadow(0 5px 7px #0009)"><svg viewBox="0 0 34 52" width="34" height="52"><path d="M8 3Q17 -1 26 3L31 14V43Q31 49 25 49H9Q3 49 3 43V14Z" fill="#f8fafc" stroke="#17191d" stroke-width="2"/><path d="M8 13Q17 8 26 13L28 26H6Z" fill="#536579"/><path d="M7 34H27V43H7Z" fill="#b8c5d3"/><rect x="0" y="15" width="4" height="10" rx="2" fill="#17191d"/><rect x="30" y="15" width="4" height="10" rx="2" fill="#17191d"/></svg></div>',
        iconSize:[42,58],iconAnchor:[21,29]
      }),zIndexOffset:5000,interactive:false}).addTo(mapRef);
    } else {
      car.setLatLng(point);
      const el=car.getElement();
      const body=el&&el.querySelector('div');
      if(body)body.style.transform='rotate('+(angle||0)+'deg)';
    }
  }

  function joyStart(e) {
    e.preventDefault(); joystick.active=true;
    try{joystickBase.setPointerCapture(e.pointerId);}catch(_){}
    joyMove(e);
  }
  function joyMove(e) {
    if(!joystick.active)return;
    const r=joystickBase.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let dx=e.clientX-cx,dy=e.clientY-cy;
    const max=r.width*.31,mag=Math.hypot(dx,dy)||1;
    if(mag>max){dx=dx/mag*max;dy=dy/mag*max;}
    joystick.x=dx/max;joystick.y=dy/max;
    joystickKnob.style.left='calc(50% + '+dx+'px';
    joystickKnob.style.top='calc(50% + '+dy+'px';
  }
  function joyEnd() {
    joystick.active=false;joystick.x=0;joystick.y=0;
    if(joystickKnob){joystickKnob.style.left='50%';joystickKnob.style.top='50%';}
  }

  function frame(now) {
    if(!active)return;
    if(!lastFrame)lastFrame=now;
    const dt=Math.min(.06,(now-lastFrame)/1000);lastFrame=now;
    const magnitude=Math.hypot(joystick.x,joystick.y);
    if(currentEdge&&magnitude>.15){
      const travelFrom=direction===1?currentEdge.a:currentEdge.b;
      const travelTo=direction===1?currentEdge.b:currentEdge.a;
      const roadHeading=bearing(travelFrom,travelTo);
      const joystickHeading=Math.atan2(joystick.x,-joystick.y);
      if(Math.cos(joystickHeading-roadHeading)<-.25) direction*=-1;
      let remaining=SPEED_MPS*magnitude*dt;
      let edge=currentEdge,dir=direction;
      while(remaining>0&&edge){
        const available=(dir===1?(1-progress):progress)*edge.length;
        const travel=Math.min(remaining,available);
        progress+=dir*travel/edge.length;
        remaining-=travel;
        if(remaining>0.01||progress<=0.0001||progress>=0.9999){
          const endKey=dir===1?edge.bk:edge.ak;
          const incoming=bearing(dir===1?edge.a:edge.b,dir===1?edge.b:edge.a);
          const next=chooseNext(endKey,incoming);
          if(!next){remaining=0;break;}
          edge=next.edge;dir=next.dir;progress=dir===1?0:1;
        } else break;
      }
      currentEdge=edge;direction=dir;
      const p=pointOn(edge,progress);
      const a=dir===1?edge.a:edge.b,b=dir===1?edge.b:edge.a;
      const deg=bearing(a,b)*180/Math.PI;
      setCar(p,deg);
      mapRef.panTo(p,{animate:false});
    }
    raf=requestAnimationFrame(frame);
  }

  function hideRealMarker() {
    const loc=window.Sho1re1LocateMe;
    // my-location.js owns the actual GPS marker; hide its marker DOM and accuracy circle
    // by hiding only the known user marker pane elements while Drive is active.
    document.querySelectorAll('.sho1re1-live-user-marker,.sho1re1-user-accuracy').forEach(el=>{
      el.dataset.driveHidden='1';el.style.opacity='0';
    });
  }
  function restoreRealMarker() {
    document.querySelectorAll('[data-drive-hidden="1"]').forEach(el=>{el.style.opacity='';delete el.dataset.driveHidden;});
  }

  async function start() {
    if(active||loading)return;
    loading=true;buildUI();ui.hidden=false;setStatus('CHECKING MAX ACCESS…');
    const access=window.Sho1re1Pro;
    if(!hasMaxAccess()){
      if(access)await access.check();
      if(!hasMaxAccess()){
        loading=false;ui.hidden=true;syncDriveVisibility();return;
      }
    }
    if(!navigator.geolocation){loading=false;setStatus('GPS NOT AVAILABLE');return;}
    setStatus('GETTING YOUR LIVE LOCATION…');
    navigator.geolocation.getCurrentPosition(async pos=>{
      gps=L.latLng(pos.coords.latitude,pos.coords.longitude);
      try{
        setStatus('LOADING REAL ROAD MAP…');
        if (window.Sho1re1RoadMap) await window.Sho1re1RoadMap.enable(mapRef);
        setStatus('CONNECTING TO ROAD ROUTES…');
        await loadRoads(gps);
        const snap=nearestRoad(gps);
        if(!snap||!snap.edge)throw new Error('Could not find a nearby road');
        currentEdge=snap.edge;progress=snap.t;direction=1;
        const p=snap.point;
        const dirBearing=bearing(currentEdge.a,currentEdge.b);
        if(progress>.5)direction=-1;
        setCar(p,dirBearing*180/Math.PI+(direction===-1?180:0));
        hideRealMarker();
        active=true;loading=false;lastFrame=0;
        document.body.classList.add('sho1re1-driving');
        ui.hidden=false;setStatus('DRIVE MODE · JOYSTICK RIGHT');
        mapRef.flyTo(p,Math.max(17,mapRef.getZoom()),{duration:.8});
        raf=requestAnimationFrame(frame);
        if(gpsWatch!==null)navigator.geolocation.clearWatch(gpsWatch);
        gpsWatch=navigator.geolocation.watchPosition(p=>{gps=L.latLng(p.coords.latitude,p.coords.longitude);},{enableHighAccuracy:true,maximumAge:1500,timeout:10000});
      }catch(err){loading=false;setStatus('ROAD LOAD FAILED · TAP TO RETRY');console.warn('MAX Drive:',err);alert('Could not load nearby road data. Check your connection and try again.');}
    },err=>{loading=false;setStatus('LOCATION PERMISSION NEEDED');alert('Allow precise location to start Drive.');},{enableHighAccuracy:true,timeout:20000,maximumAge:5000});
  }

  function stop() {
    active=false;loading=false;cancelAnimationFrame(raf);raf=0;lastFrame=0;joyEnd();
    if(gpsWatch!==null){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null;}
    if(car){mapRef.removeLayer(car);car=null;}
    roadsLayer.clearLayers();mapRef.removeLayer(roadsLayer);
    if (window.Sho1re1RoadMap) window.Sho1re1RoadMap.disable(mapRef);
    restoreRealMarker();document.body.classList.remove('sho1re1-driving');
    if(ui)ui.hidden=true;
    document.body.classList.remove('sho-map-only');
    syncDriveVisibility();
  }

  buildUI();
  // Drive control is offered only while the card carousel has been swiped away.
  const observer=new MutationObserver(syncDriveVisibility);
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  syncDriveVisibility();
  if (window.Sho1re1Pro) {
    window.Sho1re1Pro.onChange(syncDriveVisibility);
    window.Sho1re1Pro.check().then(syncDriveVisibility);
  }
  window.addEventListener('sho1re1:prochange', syncDriveVisibility);
  window.addEventListener('pagehide',stop);
  window.Sho1re1Drive={start,stop,isActive:()=>active};
  window.addEventListener('sho1re1:prochange',()=>{if(active&&!hasMaxAccess())stop();syncDriveVisibility();});
})();
