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
 function getBranches(center,maxDistance=1800,travelHeading=null){
  if(!center||!nodeEdges.size)return [];
  const candidates=[];
  const angular=(a,b)=>Math.abs(((a-b+540)%360)-180);
  for(const [id,node] of nodeEdges){
   const d=distance(center,node.point);if(d<10||d>maxDistance)continue;
   const approach=Number.isFinite(travelHeading)?travelHeading:bearing(center,node.point);
   const back=(approach+180)%360;
   const arms=[];
   for(const edge of node.edges){
    if(angular(edge.bearing,back)<42)continue;
    if(arms.some(a=>angular(a.bearing,edge.bearing)<12))continue;
    arms.push(edge);
   }
   if(arms.length<2)continue;
   for(const edge of arms){
    const key=id+':'+Math.round(edge.bearing/5)*5;
    candidates.push({key,point:window.L.latLng(node.point.lat,node.point.lng),bearing:edge.bearing,distance:d});
   }
  }
  if(!candidates.length)return [];
  const nearest=Math.min(...candidates.map(x=>x.distance));
  return candidates.filter(x=>x.distance<=nearest+7);
 }
 window.Sho1re1RoadGraph={refresh,getBranches,stats:()=>({nodes:nodeEdges.size,updatedAt:lastFetchAt,loading:!!pending})};
})();