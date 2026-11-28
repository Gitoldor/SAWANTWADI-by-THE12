/* MAX-only progressive OSM road graph. */
(() => {
 'use strict';
 if(window.__sho1re1RoadGraphLoaded)return;
 window.__sho1re1RoadGraphLoaded=true;
 const RADIUS=2600,TTL=12000,MIN_MOVE=170;
 const ENDPOINTS=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter'];
 let nodes=new Map(),lastFetchAt=0,lastCenter=null,pending=null;
 const rad=n=>n*Math.PI/180;
 function distance(a,b){const R=6371000,p1=rad(a.lat),p2=rad(b.lat),dp=rad(b.lat-a.lat),dl=rad(b.lng-a.lng),h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))}
 function bearing(a,b){const p1=rad(a.lat),p2=rad(b.lat),dl=rad(b.lng-a.lng);return (Math.atan2(Math.sin(dl)*Math.cos(p2),Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl))*180/Math.PI+360)%360}
 function allowed(tags,from,to){const v=String(tags.oneway||'').toLowerCase();if(v==='yes'||v==='1'||v==='true')return to>from;if(v==='-1')return to<from;return true}
 function build(elements){
  const fresh=new Map();
  for(const way of elements||[]){
   if(way.type!=='way'||!way.nodes||!way.geometry||way.nodes.length!==way.geometry.length)continue;
   const tags=way.tags||{},highway=String(tags.highway||'');
   if(tags.access==='no'||tags.motor_vehicle==='no'||tags.vehicle==='no'||!highway||['footway','path','cycleway','steps','pedestrian','bridleway','construction','proposed'].includes(highway))continue;
   for(let i=0;i<way.nodes.length-1;i++){
    const id=String(way.nodes[i]),nid=String(way.nodes[i+1]),a=way.geometry[i],b=way.geometry[i+1];if(!a||!b)continue;
    const pa={lat:a.lat,lng:a.lon},pb={lat:b.lat,lng:b.lon},len=distance(pa,pb),wayId=String(way.id);
    if(!fresh.has(id))fresh.set(id,{point:pa,edges:[]});if(!fresh.has(nid))fresh.set(nid,{point:pb,edges:[]});
    if(allowed(tags,i,i+1))fresh.get(id).edges.push({to:nid,bearing:bearing(pa,pb),wayId,len});
    if(allowed(tags,i+1,i))fresh.get(nid).edges.push({to:id,bearing:bearing(pb,pa),wayId,len});
   }
  }
  for(const [id,node] of fresh){
   const old=nodes.get(id);
   if(old){const seen=new Set(old.edges.map(e=>e.to+':'+e.wayId));for(const e of node.edges){const k=e.to+':'+e.wayId;if(!seen.has(k)){old.edges.push(e);seen.add(k)}}}
   else nodes.set(id,node);
  }
  if(lastCenter)for(const [id,n] of nodes)if(distance(lastCenter,n.point)>5200)nodes.delete(id);
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
 function nearestNode(point,max=180){
  let best=null,bestD=max;
  for(const [id,n] of nodes){const d=distance(point,n.point);if(d<bestD){bestD=d;best=id}}
  return best?{id:best,point:nodes.get(best).point,distance:bestD}:null;
 }
 function shortestPath(fromPoint,toPoint){
  const start=nearestNode(fromPoint,220),goal=nearestNode(toPoint,100);if(!start||!goal)return null;
  if(start.id===goal.id)return [start.point];
  const dist=new Map([[start.id,0]]),prev=new Map(),open=new Set([start.id]),done=new Set();
  while(open.size){
   let u=null,du=Infinity;for(const id of open){const v=dist.get(id);if(v<du){du=v;u=id}}
   if(u===null)break;open.delete(u);if(u===goal.id)break;done.add(u);
   const node=nodes.get(u);if(!node)continue;
   for(const e of node.edges){if(done.has(e.to)||!nodes.has(e.to))continue;const nd=du+(e.len||distance(node.point,nodes.get(e.to).point));if(nd<(dist.get(e.to)??Infinity)){dist.set(e.to,nd);prev.set(e.to,u);open.add(e.to)}}
  }
  if(!prev.has(goal.id))return null;
  const ids=[goal.id];let at=goal.id;while(at!==start.id){at=prev.get(at);if(!at)return null;ids.push(at)}ids.reverse();
  return ids.map(id=>nodes.get(id).point);
 }
 function traceBranch(nodeId,firstEdge){
  const start=nodes.get(nodeId),out=[start.point];let previous=nodeId,current=firstEdge.to,edge=firstEdge,travel=0,guard=0;
  while(current&&nodes.has(current)&&guard++<80){
   const n=nodes.get(current);out.push(n.point);travel+=edge.len||distance(nodes.get(previous).point,n.point);
   const options=n.edges.filter(e=>e.to!==previous);
   if(options.length!==1||travel>=650)break;
   previous=current;edge=options[0];current=edge.to;
  }
  return out;
 }
 function getBranches(center,maxDistance=1800,travelHeading=null){
  if(!center||!nodes.size)return [];
  const candidates=[],angular=(a,b)=>Math.abs(((a-b+540)%360)-180);
  for(const [id,node] of nodes){
   const d=distance(center,node.point);if(d<8||d>maxDistance)continue;
   const approach=Number.isFinite(travelHeading)?travelHeading:bearing(center,node.point),back=(approach+180)%360,arms=[];
   for(const edge of node.edges){if(angular(edge.bearing,back)<42)continue;if(arms.some(a=>angular(a.bearing,edge.bearing)<10))continue;arms.push(edge)}
   if(arms.length<2)continue;
   for(const edge of arms){const key=id+':'+edge.to+':'+edge.wayId;candidates.push({key,nodeId:id,point:window.L.latLng(node.point.lat,node.point.lng),bearing:edge.bearing,distance:d,path:traceBranch(id,edge)})}
  }
  if(!candidates.length)return [];
  const nearest=Math.min(...candidates.map(x=>x.distance));
  return candidates.filter(x=>x.distance<=nearest+9);
 }
 function getBranchPath(branch){return branch&&branch.path?branch.path:null}
 function getRoadAhead(center,heading){
  const near=nearestNode(center,100);if(!near)return null;
  const node=nodes.get(near.id),angular=(a,b)=>Math.abs(((a-b+540)%360)-180);
  const edges=node.edges.slice().sort((a,b)=>angular(a.bearing,heading)-angular(b.bearing,heading));
  if(!edges.length||angular(edges[0].bearing,heading)>78)return null;
  return traceBranch(near.id,edges[0]);
 }
 window.Sho1re1RoadGraph={refresh,getBranches,getBranchPath,getRoadAhead,shortestPath,nearestNode,stats:()=>({nodes:nodes.size,updatedAt:lastFetchAt,loading:!!pending})};
})();