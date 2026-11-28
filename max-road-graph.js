/* MAX-only progressive OSM road graph. */
(() => {
 'use strict';
 if(window.__sho1re1RoadGraphLoaded)return;
 window.__sho1re1RoadGraphLoaded=true;
 const RADIUS=2600,TTL=12000,MIN_MOVE=170;
 const ENDPOINTS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
 let nodeEdges=new Map(),lastFetchAt=0,lastCenter=null,pending=null;
 const rad=n=>n*Math.PI/180;
 function distance(a,b){const R=6371000,p1=rad(a.lat),p2=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lng-a.lng),h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
 function bearing(a,b){const p1=rad(a.lat),p2=rad(b.lat),dl=rad(b.lng-a.lng);return (Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))*180/Math.PI+360)%360}
 function allowed(tags,from,to){const v=String(tags.oneway||'').toLowerCase();if(v==='yes'||v==='1'||v==='true')return to>from;if(v==='-1')return to<from;return true}
 function build(elements){
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
  if(lastCenter){for(const [id,node] of nodeEdges){if(distance(lastCenter,node.point)>5200)nodeEdges.delete(id)}}
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
  if(townRoadLines.length&&Date.now()-townLoadedAt<86400000)return Promise.resolve(townRoadLines.length);
  if(townPending)return townPending;
  townPending=(async()=>{
   let elements,error;
   for(const url of ENDPOINTS){try{elements=await queryTown(url);break}catch(e){error=e}}
   if(!elements)throw error||Error('Sawantwadi road network unavailable');
   build(elements);
   const lines=[];
   for(const way of elements){
    if(way.type!=='way'||!isDriveRoad(way)||!Array.isArray(way.geometry)||way.geometry.length<2)continue;
    const coords=way.geometry.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)).map(p=>[p.lat,p.lon]);
    if(coords.length>1)lines.push(coords);
   }
   if(!lines.length)throw Error('No drivable Sawantwadi roads were returned');
   townRoadLines=lines;townLoadedAt=Date.now();
   if(center){lastCenter={lat:center.lat,lng:center.lng};lastFetchAt=Date.now()}
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
  if(lastCenter&&Date.now()-lastFetchAt<TTL&&distance(lastCenter,center)<MIN_MOVE)return Promise.resolve(false);
  const snapshot={lat:center.lat,lng:center.lng};
  pending=(async()=>{let data,error;for(const url of ENDPOINTS){try{data=await query(snapshot,url);break}catch(e){error=e}}if(!data)throw error||Error('Road graph unavailable');build(data);lastCenter=snapshot;lastFetchAt=Date.now();return true})().finally(()=>{pending=null});
  return pending;
 }
 function angleDifference(a,b){return Math.abs(((a-b+540)%360)-180)}
 function getBranches(center,maxDistance=850,travelHeading=null){
  if(!center||!nodeEdges.size)return [];
  const candidates=[];
  for(const [id,node] of nodeEdges){
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
 window.Sho1re1RoadGraph={refresh,loadTown,getTownRoadLines,getBranches,getBranchPath,stats:()=>({nodes:nodeEdges.size,updatedAt:lastFetchAt,loading:!!pending||!!townPending,townRoads:townRoadLines.length})};
})();