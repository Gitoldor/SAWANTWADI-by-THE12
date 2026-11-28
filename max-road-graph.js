/* MAX-only progressive OSM road graph. */
(() => {
 'use strict';
 if(window.__sho1re1RoadGraphLoaded)return;
 window.__sho1re1RoadGraphLoaded=true;
 const RADIUS=2600,TTL=12000,MIN_MOVE=170,CELL=.003;
 const ENDPOINTS=['https://overpass.private.coffee/api/interpreter','https://overpass-api.de/api/interpreter','https://ovp.dresel.systems/api-as/interpreter'];
 const CACHE_DB='Sho1re1MaxRoadCache',CACHE_STORE='snapshots';
 let nodeEdges=new Map(),lastFetchAt=0,lastCenter=null,pending=null;
 let spatialIndex=new Map(),cacheDbPromise=null,cacheLoadPromise=null,graphPersistScheduled=false,townPersistScheduled=false;
 const rad=n=>n*Math.PI/180;
 function openCacheDb(){
  if(!window.indexedDB)return Promise.resolve(null);
  if(cacheDbPromise)return cacheDbPromise;
  cacheDbPromise=new Promise(resolve=>{
   let request;
   try{request=window.indexedDB.open(CACHE_DB,1)}catch(_){resolve(null);return}
   request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(CACHE_STORE))db.createObjectStore(CACHE_STORE)};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>resolve(null);
  }).catch(()=>null);
  return cacheDbPromise;
 }
 function readCache(key){
  return openCacheDb().then(db=>new Promise(resolve=>{
   if(!db){resolve(null);return}
   try{
    const request=db.transaction(CACHE_STORE,'readonly').objectStore(CACHE_STORE).get(key);
    request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>resolve(null);
   }catch(_){resolve(null)}
  }));
 }
 function writeCache(key,value){
  return openCacheDb().then(db=>new Promise(resolve=>{
   if(!db){resolve(false);return}
   try{
    const tx=db.transaction(CACHE_STORE,'readwrite');tx.objectStore(CACHE_STORE).put(value,key);
    tx.oncomplete=()=>resolve(true);tx.onerror=()=>resolve(false);tx.onabort=()=>resolve(false);
   }catch(_){resolve(false)}
  }));
 }
 function scheduleIdle(task){
  if(typeof window.requestIdleCallback==='function')window.requestIdleCallback(task,{timeout:1800});
  else setTimeout(task,250);
 }
 function rebuildSpatial(){
  spatialIndex=new Map();
  for(const [id,node] of nodeEdges){
   const key=Math.floor(node.point.lat/CELL)+':'+Math.floor(node.point.lng/CELL);
   let bucket=spatialIndex.get(key);if(!bucket){bucket=[];spatialIndex.set(key,bucket)}bucket.push(id);
  }
 }
 function scheduleGraphCache(){
  if(graphPersistScheduled)return;graphPersistScheduled=true;
  scheduleIdle(()=>{
   graphPersistScheduled=false;
   const snapshot={version:1,updatedAt:lastFetchAt,center:lastCenter,nodes:Array.from(nodeEdges.entries())};
   writeCache('graph-v1',snapshot);
  });
 }
 function scheduleTownCache(){
  if(townPersistScheduled)return;townPersistScheduled=true;
  scheduleIdle(()=>{
   townPersistScheduled=false;
   writeCache('town-v1',{version:1,updatedAt:townLoadedAt,lines:townRoadLines});
  });
 }
 function preload(){
  if(cacheLoadPromise)return cacheLoadPromise;
  cacheLoadPromise=Promise.all([readCache('graph-v1'),readCache('town-v1')]).then(([graph,town])=>{
   if(graph&&graph.version===1&&Array.isArray(graph.nodes)&&graph.nodes.length<180000){
    nodeEdges=new Map(graph.nodes);lastCenter=graph.center||null;lastFetchAt=Number(graph.updatedAt)||0;rebuildSpatial();
   }
   // The fixed whole-town snapshot is written as version 1. Accept that
   // schema here; the old version-2 check silently discarded every saved
   // Sawantwadi road network and forced a fresh Overpass request on each load.
   if(town&&town.version===1&&Array.isArray(town.lines)&&town.lines.length>0&&town.lines.length<60000){
    townRoadLines=town.lines;townLoadedAt=Number(town.updatedAt)||0;
   }
   return {nodes:nodeEdges.size,townRoads:townRoadLines.length};
  }).catch(()=>({nodes:nodeEdges.size,townRoads:townRoadLines.length}));
  return cacheLoadPromise;
 }
 function distance(a,b){const R=6371000,p1=rad(a.lat),p2=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lng-a.lng),h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
 function bearing(a,b){const p1=rad(a.lat),p2=rad(b.lat),dl=rad(b.lng-a.lng);return (Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))*180/Math.PI+360)%360}
 function allowed(tags,from,to){const v=String(tags.oneway||'').toLowerCase();if(v==='yes'||v==='1'||v==='true')return to>from;if(v==='-1')return to<from;return true}
 function build(elements,pruneCenter){
  const graph=new Map();
  for(const way of elements||[]){
   if(way.type!=='way'||!way.nodes||!way.geometry||way.nodes.length!==way.geometry.length)continue;
   const tags=way.tags||{},highway=String(tags.highway||'');
   if(tags.access==='no'||tags.motor_vehicle==='no'||tags.vehicle==='no'||!highway||['footway','path','cycleway','steps','pedestrian','bridleway','construction','proposed'].includes(highway))continue;
   for(let i=0;i<way.nodes.length-1;i++){
    const id=String(way.nodes[i]),nid=String(way.nodes[i+1]),a=way.geometry[i],b=way.geometry[i+1];if(!a||!b)continue;
    const pa={lat:a.lat,lng:a.lon},pb={lat:b.lat,lng:b.lon};
    if(!graph.has(id))graph.set(id,{point:pa,edges:[]});if(!graph.has(nid))graph.set(nid,{point:pb,edges:[]});
    if(allowed(tags,i,i+1))graph.get(id).edges.push({to:nid,bearing:bearing(pa,pb)});
    if(allowed(tags,i+1,i))graph.get(nid).edges.push({to:id,bearing:bearing(pb,pa)});
   }
  }
  // Merge nearby graph tiles so knowledge expands with movement instead of replacing the previous tile.
  for(const [id,node] of graph){
   const old=nodeEdges.get(id);
   if(old){const seen=new Set(old.edges.map(e=>e.to+':'+Math.round(e.bearing)));for(const edge of node.edges){const k=edge.to+':'+Math.round(edge.bearing);if(!seen.has(k)){old.edges.push(edge);seen.add(k)}}}
   else nodeEdges.set(id,node);
  }
  // Keep memory bounded while retaining a useful explored corridor.
  const pruneAt=pruneCenter||lastCenter;
  if(pruneAt){for(const [id,node] of nodeEdges){if(distance(pruneAt,node.point)>5200)nodeEdges.delete(id)}}
  rebuildSpatial();
 }

 const TOWN_BBOX={south:15.86,west:73.77,north:15.96,east:73.88};
 let townRoadLines=[],townPending=null,townLoadedAt=0;
 const EXCLUDED_HIGHWAYS=['footway','path','cycleway','steps','pedestrian','bridleway','construction','proposed'];
 function isDriveRoad(way){
  const tags=way&&way.tags||{},highway=String(tags.highway||'');
  return !!highway&&tags.access!=='no'&&tags.motor_vehicle!=='no'&&tags.vehicle!=='no'&&!EXCLUDED_HIGHWAYS.includes(highway);
 }
async function queryTown(url){
  const b=TOWN_BBOX;
  const q='[out:json][timeout:35];way('+b.south+','+b.west+','+b.north+','+b.east+')["highway"]["area"!="yes"];out body geom;';
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),38000);
  try{
   const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(q),signal:ctl.signal,cache:'no-store'});
   if(!r.ok)throw Error('Overpass town map HTTP '+r.status);
   const data=await r.json();if(!Array.isArray(data.elements))throw Error('Invalid Sawantwadi road response');
   return data.elements;
  }finally{clearTimeout(timer)}
 }
 function loadTown(center){
  if(townPending)return townPending;
  townPending=(async()=>{
   await preload();
   if(townRoadLines.length&&Date.now()-townLoadedAt<86400000)return townRoadLines.length;
   let elements,error;
   for(const url of ENDPOINTS){try{elements=await queryTown(url);break}catch(e){error=e}}
   if(!elements)throw error||Error('Sawantwadi road network unavailable');
   // The full-town layer is display-only. Do not merge its thousands of
   // distant nodes into the live junction graph.
   const lines=[];
   for(const way of elements){
    if(way.type!=='way'||!isDriveRoad(way)||!Array.isArray(way.geometry)||way.geometry.length<2)continue;
    const coords=way.geometry.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)).map(p=>[p.lat,p.lon]);
    if(coords.length>1)lines.push(coords);
   }
   if(!lines.length)throw Error('No drivable Sawantwadi roads were returned');
   townRoadLines=lines;townLoadedAt=Date.now();scheduleTownCache();
   return townRoadLines.length;
  })().finally(()=>{townPending=null});
  return townPending;
 }
 function getTownRoadLines(){return townRoadLines;}
 async function query(center,url){
  const q='[out:json][timeout:18];way(around:'+RADIUS+','+center.lat+','+center.lng+')["highway"]["area"!="yes"];out body geom;';
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),19000);
  try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(q),signal:ctl.signal,cache:'no-store'});if(!r.ok)throw Error('Overpass HTTP '+r.status);const data=await r.json();if(!Array.isArray(data.elements))throw Error('Invalid Overpass response');return data.elements}finally{clearTimeout(timer)}
 }
 function refresh(center){
  if(!center)return Promise.resolve(false);if(pending)return pending;
  const snapshot={lat:center.lat,lng:center.lng};
  pending=(async()=>{
   await preload();
   if(lastCenter&&Date.now()-lastFetchAt<TTL&&distance(lastCenter,snapshot)<MIN_MOVE)return false;
   let data,error;
   for(const url of ENDPOINTS){try{data=await query(snapshot,url);break}catch(e){error=e}}
   if(!data)throw error||Error('Road graph unavailable');
   build(data,snapshot);lastCenter=snapshot;lastFetchAt=Date.now();scheduleGraphCache();return true;
  })().finally(()=>{pending=null});
  return pending;
 }
 function angleDifference(a,b){return Math.abs(((a-b+540)%360)-180)}
 function getBranches(center,maxDistance=850,travelHeading=null){
  if(!center||!nodeEdges.size)return [];
  const candidates=[];
  const latSpan=maxDistance/110540,lngSpan=maxDistance/(111320*Math.max(.2,Math.cos(rad(center.lat))));
  const minRow=Math.floor((center.lat-latSpan)/CELL),maxRow=Math.floor((center.lat+latSpan)/CELL);
  const minCol=Math.floor((center.lng-lngSpan)/CELL),maxCol=Math.floor((center.lng+lngSpan)/CELL);
  const nearby=[];
  for(let row=minRow;row<=maxRow;row++)for(let col=minCol;col<=maxCol;col++){
   const bucket=spatialIndex.get(row+':'+col);if(bucket)nearby.push(...bucket);
  }
  for(const id of nearby){
   const node=nodeEdges.get(id);if(!node)continue;
   const d=distance(center,node.point);if(d<3||d>maxDistance)continue;
   const directionToNode=bearing(center,node.point);
   // Include small side-road forks as well as large intersections.
   // A junction can sit slightly beside the travelled road, so use a wider
   // approach cone rather than requiring the node to be directly ahead.
   if(Number.isFinite(travelHeading)&&angleDifference(directionToNode,travelHeading)>112)continue;
   const approach=Number.isFinite(travelHeading)?travelHeading:directionToNode;
   const back=(approach+180)%360;
   const arms=[];
   for(const edge of node.edges){
    if(angleDifference(edge.bearing,back)<38)continue;
    if(arms.some(a=>angleDifference(a.bearing,edge.bearing)<12))continue;
    arms.push(edge);
   }
   // Two distinct forward/legal arms are enough: e.g. continue OR turn.
   if(arms.length<2)continue;
   for(const edge of arms){
    const key=id+':'+edge.to+':'+Math.round(edge.bearing);
    candidates.push({key,nodeId:id,to:edge.to,point:window.L.latLng(node.point.lat,node.point.lng),bearing:edge.bearing,distance:d});
   }
  }
  if(!candidates.length)return [];
  const nearest=Math.min(...candidates.map(x=>x.distance));
  // Nearby OSM nodes can represent the same physical fork; keep a wider
  // small cluster so every outgoing choice at that fork is offered.
  return candidates.filter(x=>x.distance<=nearest+42);
 }
 // Build a preview from real connected OSM graph edges. This is display-only:
 // the existing OSRM movement engine remains responsible for driving.
 function getBranchPath(branch,maxMeters=650){
  if(!branch||!nodeEdges.size)return [];
  let id=String(branch.nodeId),next=String(branch.to),node=nodeEdges.get(id);
  if(!node||!nodeEdges.has(next))return [];
  const points=[{lat:node.point.lat,lng:node.point.lng}],seen=new Set([id]);
  let travelled=0,previous=id,current=next;
  let incoming=Number(branch.bearing)||0;
  while(current&&!seen.has(current)){
   const here=nodeEdges.get(current);if(!here)break;
   const step=nodeEdges.get(previous);
   const edge=step&&step.edges.find(e=>String(e.to)===current);
   const segment=edge?distance(step.point,here.point):distance(points[points.length-1],here.point);
   travelled+=segment;if(travelled>maxMeters)break;
   points.push({lat:here.point.lat,lng:here.point.lng});
   seen.add(current);
   const options=(here.edges||[]).filter(e=>String(e.to)!==previous&&nodeEdges.has(String(e.to)));
   if(!options.length)break;
   options.sort((a,b)=>angleDifference(a.bearing,incoming)-angleDifference(b.bearing,incoming));
   const chosen=options[0];
   // Stop rather than inventing a continuation if the graph forks sharply.
   if(angleDifference(chosen.bearing,incoming)>78)break;
   previous=current;current=String(chosen.to);incoming=chosen.bearing;
  }
  return points.length>1?points:[];
 }
 function hasCoverage(center){return !!(center&&lastCenter&&nodeEdges.size&&distance(lastCenter,center)<RADIUS*.92)}
 window.Sho1re1RoadGraph={preload,refresh,loadTown,getTownRoadLines,getBranches,getBranchPath,hasCoverage,stats:()=>({nodes:nodeEdges.size,buckets:spatialIndex.size,updatedAt:lastFetchAt,center:lastCenter,cacheReady:!!cacheLoadPromise,loading:!!pending||!!townPending,townRoads:townRoadLines.length})};
})();