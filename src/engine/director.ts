import type { GameState, Room, StyleId } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { STYLES, districtOfBuilding, STATIC_MUSEUMS } from '../data/constants';
import { activeMuseum, museumById, roomRatings } from './game';
import { money, uid } from './util';

export type ThesisId = 'movement' | 'artist' | 'period' | 'region' | 'medium' | 'dialogue';
export const THESES: Record<ThesisId, {name:string; blurb:string}> = {
  movement:{name:'Movement survey',blurb:'A clear overview of one artistic movement.'},
  artist:{name:'Artist focus',blurb:'Build the room around one artist and their circle.'},
  period:{name:'Period panorama',blurb:'Connect works made within a close historical era.'},
  region:{name:'Place and school',blurb:'Explore a region, court, city, or artistic school.'},
  medium:{name:'Medium and technique',blurb:'Compare how artists used a shared medium.'},
  dialogue:{name:'Dialogue across time',blurb:'Intentionally contrast periods through research.'},
};

export const DECOR = {
  classic:{name:'Classic gallery',best:['renaissance','baroque','romanticism','medieval']},
  dramatic:{name:'Dramatic staging',best:['baroque','egyptian','medieval','precolumbian']},
  minimal:{name:'Minimal white cube',best:['modernism','contemporary','impressionism']},
  immersive:{name:'Immersive interpretation',best:['egyptian','islamic','asian','popculture']},
} as const;

export const STYLE_RESEARCH_NODES: Record<StyleId, {id:string;name:string;weeks:number;cost:number;effect:string}[]> = Object.fromEntries(
  Object.keys(STYLES).map(style => [style, [
    {id:'survey',name:`${STYLES[style as StyleId].name} Survey`,weeks:2,cost:1200,effect:'Unlocks stronger introductory texts.'},
    {id:'artists',name:'Artists & Schools',weeks:3,cost:2200,effect:'Improves curator depth and cohesion.'},
    {id:'symbols',name:'Themes & Symbolism',weeks:3,cost:2600,effect:'Improves educational interpretation.'},
    {id:'technique',name:'Materials & Technique',weeks:4,cost:3400,effect:'Improves labels and specialist appeal.'},
    {id:'catalogue',name:'Scholarly Catalogue',weeks:5,cost:5000,effect:'Major Art Quality bonus for this style.'},
    {id:'dialogue',name:'Cross-Period Dialogue',weeks:5,cost:5600,effect:'Makes intentional mixed exhibitions viable.'},
  ]])
) as Record<StyleId, {id:string;name:string;weeks:number;cost:number;effect:string}[]>;

function year(a:string){ return Number(String(a).match(/\d{3,4}/)?.[0] || 0); }
function assignedSkill(s:GameState,id?:string|null){ return id ? (s.staff.find(x=>x.id===id)?.skill || 0) : 0; }
export function styleResearchLevel(s:GameState, style:StyleId){ return s.styleResearch?.[style]?.completed?.length || 0; }

export function detailedRoomRatings(s:GameState, room:Room){
  const base=roomRatings(room); const works=room.items.map(id=>ARTIFACT_BY_ID[id]).filter(Boolean);
  if(!works.length || !room.theme) return {...base,collectionStrength:0,curatorialDepth:0,interpretation:0,comfort:0,decorFit:0,visitorAppeal:0};
  const avg=works.reduce((n,a)=>n+a.score,0)/works.length;
  const collectionStrength=Math.min(100,Math.round(18+Math.sqrt(avg)*6+Math.min(works.length,5)*4));
  const research=styleResearchLevel(s,room.theme);
  const curator=assignedSkill(s,room.assignedCuratorId);
  const educator=assignedSkill(s,room.assignedResearcherId);
  const thesis=(room.thesis || 'movement') as ThesisId;
  let thesisFit=base.cohesion;
  if(thesis==='artist' && works.length>1){ const top=Math.max(...Object.values(works.reduce((m,a)=>(m[a.author]=(m[a.author]||0)+1,m),{} as Record<string,number>))); thesisFit=Math.round(top/works.length*100); }
  if(thesis==='period' && works.length>1){ const ys=works.map(a=>year(a.year)).filter(Boolean); thesisFit=ys.length?Math.max(20,100-(Math.max(...ys)-Math.min(...ys))/2):50; }
  if(thesis==='medium'){ const types=new Set(works.map(a=>a.type)); thesisFit=Math.max(25,110-types.size*22); }
  if(thesis==='dialogue') thesisFit=research>=6?Math.max(base.cohesion,78):Math.round(base.cohesion*.72);
  const curatorialDepth=Math.min(100,Math.round(12+research*10+curator*9+thesisFit*.35));
  const interpretation=Math.min(100,Math.round((room.interpretation||0)*22+research*5+educator*10));
  const decor=(room.decorStyle||'classic') as keyof typeof DECOR;
  const decorFit=DECOR[decor].best.includes(room.theme as never)?100:58;
  const comfort=Math.min(100,Math.round((room.amenities||0)*27+35));
  const attractiveness=Math.min(100,Math.round(thesisFit*.38+(room.decoration||0)*15+comfort*.18+decorFit*.15));
  const artQuality=Math.min(100,Math.round(collectionStrength*.55+curatorialDepth*.28+interpretation*.17));
  const visitorAppeal=Math.round(artQuality*.48+attractiveness*.52);
  return {artQuality,attractiveness,cohesion:Math.round(thesisFit),collectionStrength,curatorialDepth,interpretation,comfort,decorFit,visitorAppeal};
}

export function visitorSegments(s:GameState, museumId?:string){
  const m=museumId?museumById(s,museumId):activeMuseum(s); const rooms=m.rooms.filter(r=>r.unlocked&&r.items.length);
  const avg=rooms.length?rooms.map(r=>detailedRoomRatings(s,r)).reduce((o,r)=>({q:o.q+r.artQuality,a:o.a+r.attractiveness,i:o.i+r.interpretation}),{q:0,a:0,i:0}):{q:0,a:0,i:0};
  const q=rooms.length?avg.q/rooms.length:0,a=rooms.length?avg.a/rooms.length:0,i=rooms.length?avg.i/rooms.length:0;
  const district=districtOfBuilding(m.buildingId)?.id || '';
  const boost=(name:string)=> district.includes(name)?1.25:1;
  return {
    tourists:Math.round((a*.65+m.fame*.35)*boost('downtown')),
    enthusiasts:Math.round((q*.75+m.fame*.25)*boost('historic')),
    scholars:Math.round((q*.55+i*.45)*boost('college')),
    families:Math.round((a*.55+rooms.reduce((n,r)=>n+(r.amenities||0)*8,0))*boost('park')),
    members:Math.round((m.fame*.55+q*.45)+(s.memberships||0)/8),
  };
}

export function roomPerformance(s:GameState, room:Room){
  const r=detailedRoomRatings(s,room); const share=Math.max(0,Math.round(r.visitorAppeal*5.5));
  return {weeklyVisitors:share,revenue:Math.round(share*(activeMuseum(s).ticket+2.4)),skipRate:Math.max(3,Math.round(40-r.attractiveness*.32)),satisfaction:(2.6+(r.artQuality+r.attractiveness)/125).toFixed(1)};
}

function clone(s:GameState):GameState{return JSON.parse(JSON.stringify(s));}
export function setRoomThesis(s:GameState,roomId:number,thesis:ThesisId){const n=clone(s); const r=activeMuseum(n).rooms.find(x=>x.id===roomId); if(r)r.thesis=thesis; return n;}
export function setRoomDecor(s:GameState,roomId:number,decor:keyof typeof DECOR){const n=clone(s); const r=activeMuseum(n).rooms.find(x=>x.id===roomId); if(r)r.decorStyle=decor; return n;}
export function assignRoomStaff(s:GameState,roomId:number,role:'curator'|'researcher',id:string|null){const n=clone(s); const r=activeMuseum(n).rooms.find(x=>x.id===roomId); if(r){if(role==='curator')r.assignedCuratorId=id;else r.assignedResearcherId=id;} return n;}

export function startStyleResearch(s:GameState,style:StyleId,nodeId:string):{state:GameState;error?:string}{
 const node=STYLE_RESEARCH_NODES[style].find(n=>n.id===nodeId); if(!node)return{state:s,error:'Research project not found.'};
 const existing=s.styleResearch?.[style]; if(existing?.activeNode)return{state:s,error:'That style already has active research.'};
 if(existing?.completed?.includes(nodeId))return{state:s,error:'That project is already complete.'};
 if(s.funds<node.cost)return{state:s,error:`Research costs ${money(node.cost)}.`};
 const n=clone(s); n.funds-=node.cost; n.styleResearch=n.styleResearch||{}; n.styleResearch[style]={level:(existing?.completed?.length||0),points:0,completed:[...(existing?.completed||[])],activeNode:nodeId,weeksLeft:node.weeks}; return{state:n};
}

export function progressDirectorSystems(s:GameState):GameState{
 const n=clone(s); n.styleResearch=n.styleResearch||{};
 for(const style of Object.keys(n.styleResearch) as StyleId[]){const rs=n.styleResearch[style];if(!rs?.activeNode)continue;rs.weeksLeft--;if(rs.weeksLeft<=0){rs.completed.push(rs.activeNode);rs.level=rs.completed.length;rs.activeNode=null;rs.weeksLeft=0;}}
 n.temporaryExhibitions=(n.temporaryExhibitions||[]).map(x=>({...x,weeksLeft:x.weeksLeft-1})).filter(x=>x.weeksLeft>0);
 const seg=visitorSegments(n); const visitors=Object.values(seg).reduce((a,b)=>a+b,0); n.memberships=Math.max(0,(n.memberships||0)+Math.round(seg.members/35)-Math.round((n.memberships||0)*.015)); const revenue=n.lastRevenue; const expenses=n.lastExpenses;
 const notes:string[]=[]; const rooms=activeMuseum(n).rooms.filter(r=>r.unlocked&&r.items.length);
 if(rooms.length){const weakest=rooms.map(r=>({r,d:detailedRoomRatings(n,r)})).sort((a,b)=>a.d.visitorAppeal-b.d.visitorAppeal)[0]; if(weakest.d.attractiveness<50)notes.push(`${STYLES[weakest.r.theme!].name} is losing visitors because its presentation is weak.`); if(weakest.d.interpretation<35)notes.push('Visitors want more labels, audio guidance, and context.');}
 n.weeklyReport={visitors,revenue,expenses,profit:revenue-expenses,headline:revenue>=expenses?'The museum finished the week in surplus.':'Operating costs exceeded income this week.',notes,segments:seg};
 return n;
}

export function launchTemporaryExhibition(s:GameState,roomId:number,name:string,weeks:number,marketing:number,surcharge:number):{state:GameState;error?:string}{
 const room=activeMuseum(s).rooms.find(r=>r.id===roomId); if(!room||!room.theme||room.items.length<2)return{state:s,error:'Use a themed room with at least two artworks.'};
 const cost=2500+marketing; if(s.funds<cost)return{state:s,error:`Opening costs ${money(cost)}.`}; const d=detailedRoomRatings(s,room); const n=clone(s); n.funds-=cost;n.temporaryExhibitions=n.temporaryExhibitions||[];n.temporaryExhibitions.push({id:uid('temp'),name:name||`${STYLES[room.theme].name} Special Exhibition`,style:room.theme,roomId,artifactIds:[...room.items],weeksLeft:weeks,marketing,surcharge,quality:d.artQuality,attractiveness:d.attractiveness});return{state:n};
}

export function relationship(s:GameState,id:string){return s.museumRelations?.[id]||0;}
export function improveRelationship(s:GameState,id:string):{state:GameState;error?:string}{const cost=1200;if(s.funds<cost)return{state:s,error:`Outreach costs ${money(cost)}.`};const n=clone(s);n.funds-=cost;n.museumRelations=n.museumRelations||{};n.museumRelations[id]=Math.min(100,(n.museumRelations[id]||0)+12);return{state:n};}
export function dynamicMuseumRows(s:GameState){return STATIC_MUSEUMS.map(m=>({...m,relation:relationship(s,m.id),quality:m.quality+Math.round((s.week%8)*.4),visitors:m.visitors+((s.week*17+m.name.length*9)%160)}));}
