import { useMemo, useState } from 'react';
import './styles.css';
import { ARTIFACTS, ARTIFACT_BY_ID } from '../data/artifacts';
import { STYLES, STYLE_IDS } from '../data/constants';
import type { StyleId } from '../data/types';

type UpgradeKey = 'labels' | 'audio' | 'lighting' | 'decor' | 'seating';
type Gallery = { id:number; name:string; x:number; y:number; w:number; h:number; theme:StyleId; artworks:string[]; upgrades:Record<UpgradeKey,number> };
type Game = { cash:number; week:number; ticket:number; galleries:Gallery[]; collection:string[]; selected:number; visitors:number; revenue:number };

const seedIds = ['0001','0002','0004','0007','0011','0014','0020','0032','0050','0065','0080','0100','0120','0140','0160','0180'].filter(id=>ARTIFACT_BY_ID[id]);
const starter = ARTIFACTS.filter(a=>['renaissance','baroque','impressionism','medieval','egyptian','islamic','modernism'].includes(a.style)).slice(0,42).map(a=>a.id);
const initial:Game={cash:180000,week:1,ticket:18,selected:1,visitors:820,revenue:14760,collection:[...new Set([...seedIds,...starter])],galleries:[
{id:1,name:'Renaissance Masters',x:1,y:1,w:4,h:3,theme:'renaissance',artworks:starter.filter(id=>ARTIFACT_BY_ID[id]?.style==='renaissance').slice(0,5),upgrades:{labels:1,audio:0,lighting:1,decor:1,seating:0}},
{id:2,name:'Baroque Drama',x:5,y:1,w:4,h:3,theme:'baroque',artworks:starter.filter(id=>ARTIFACT_BY_ID[id]?.style==='baroque').slice(0,5),upgrades:{labels:1,audio:0,lighting:1,decor:0,seating:0}},
{id:3,name:'Modern Experiments',x:1,y:4,w:4,h:3,theme:'modernism',artworks:starter.filter(id=>ARTIFACT_BY_ID[id]?.style==='modernism').slice(0,4),upgrades:{labels:0,audio:0,lighting:0,decor:1,seating:0}},
]};

const rivals=[['Louvre',96,92,8900000,410000000],['Prado',94,88,3400000,156000000],['National Gallery',92,87,3200000,145000000],['Hermitage',91,84,2800000,118000000],['Rijksmuseum',89,86,2700000,110000000]] as const;
const clamp=(n:number)=>Math.max(0,Math.min(100,Math.round(n)));
function metrics(g:Gallery){
 const arts=g.artworks.map(id=>ARTIFACT_BY_ID[id]).filter(Boolean);
 const avg=arts.length?arts.reduce((s,a)=>s+a.score,0)/arts.length:0;
 const matching=arts.filter(a=>a.style===g.theme).length;
 const cohesion=arts.length?matching/arts.length:0;
 const education=g.upgrades.labels*7+g.upgrades.audio*8;
 const presentation=g.upgrades.lighting*5+g.upgrades.decor*8+g.upgrades.seating*3;
 return {quality:clamp(avg*.42+education+arts.length*2),attractiveness:clamp(28+cohesion*42+presentation+Math.min(12,arts.length*2)),cohesion:Math.round(cohesion*100)};
}
function money(n:number){return '$'+Math.round(n).toLocaleString()}

export default function App(){
 const [game,setGame]=useState<Game>(()=>{try{return JSON.parse(localStorage.getItem('museumWarsArtV2')||'null')||initial}catch{return initial}});
 const [panel,setPanel]=useState<'museum'|'collection'|'business'>('museum');
 const [search,setSearch]=useState('');
 const selected=game.galleries.find(g=>g.id===game.selected) || game.galleries[0];
 const sm=selected?metrics(selected):null;
 const museum=useMemo(()=>{
   const ms=game.galleries.map(metrics); const q=ms.length?ms.reduce((s,m)=>s+m.quality,0)/ms.length:0; const a=ms.length?ms.reduce((s,m)=>s+m.attractiveness,0)/ms.length:0;
   return {q:Math.round(q),a:Math.round(a)};
 },[game.galleries]);
 const commit=(next:Game)=>{setGame(next);localStorage.setItem('museumWarsArtV2',JSON.stringify(next))};
 const updateGallery=(fn:(g:Gallery)=>Gallery)=>commit({...game,galleries:game.galleries.map(g=>g.id===selected.id?fn(g):g)});
 const advance=()=>{const demand=game.galleries.reduce((s,g)=>{const m=metrics(g);return s+(m.quality*.55+m.attractiveness*.75)*18},0); const visitors=Math.round(demand*Math.max(.5,1.22-game.ticket/55)); const revenue=visitors*game.ticket; const costs=game.galleries.length*4200+game.galleries.reduce((s,g)=>s+Object.values(g.upgrades).reduce((x,v)=>x+v,0)*450,0); commit({...game,week:game.week+1,visitors,revenue,cash:game.cash+revenue-costs});};
 const build=()=>{if(game.cash<30000)return; const id=Math.max(...game.galleries.map(g=>g.id))+1; const g:Gallery={id,name:'New Exhibition',x:5,y:4,w:4,h:3,theme:'impressionism',artworks:[],upgrades:{labels:0,audio:0,lighting:0,decor:0,seating:0}}; commit({...game,cash:game.cash-30000,selected:id,galleries:[...game.galleries,g]});};
 const addArt=(id:string)=>{if(selected.artworks.includes(id)||selected.artworks.length>=8)return; updateGallery(g=>({...g,artworks:[...g.artworks,id]}));};
 const removeArt=(id:string)=>updateGallery(g=>({...g,artworks:g.artworks.filter(x=>x!==id)}));
 const upgrade=(k:UpgradeKey)=>{const level=selected.upgrades[k]; const cost=3500*(level+1); if(level>=3||game.cash<cost)return; commit({...game,cash:game.cash-cost,galleries:game.galleries.map(g=>g.id===selected.id?{...g,upgrades:{...g.upgrades,[k]:level+1}}:g)});};
 const filtered=game.collection.map(id=>ARTIFACT_BY_ID[id]).filter(Boolean).filter(a=>`${a.name} ${a.author} ${STYLES[a.style].name}`.toLowerCase().includes(search.toLowerCase()));
 const projectedRank=[...rivals.map(r=>({name:r[0],q:r[1],a:r[2],v:r[3],rev:r[4]})),{name:'Your Museum',q:museum.q,a:museum.a,v:game.visitors*52,rev:game.revenue*52}].sort((a,b)=>(b.q+b.a)-(a.q+a.a));
 return <div className="app-shell">
   <header className="topbar"><div><b>MUSEUM WARS</b><span>Art Museum Director</span></div><div className="topstats"><span>Week <b>{game.week}</b></span><span>Cash <b>{money(game.cash)}</b></span><span>Visitors <b>{game.visitors.toLocaleString()}</b></span><span>Revenue <b>{money(game.revenue)}</b></span><button onClick={advance}>Open Next Week ▶</button></div></header>
   <nav><button className={panel==='museum'?'active':''} onClick={()=>setPanel('museum')}>Museum Floor</button><button className={panel==='collection'?'active':''} onClick={()=>setPanel('collection')}>Collection</button><button className={panel==='business'?'active':''} onClick={()=>setPanel('business')}>Business Almanac</button></nav>
   {panel==='museum' && <main className="workspace">
    <section className="floor-wrap"><div className="floor-head"><div><h1>The Founder’s Gallery</h1><p>Click a room to curate it. Quality comes from art and interpretation; attractiveness comes from coherence and presentation.</p></div><button onClick={build}>＋ Build gallery · $30,000</button></div>
      <div className="museum-floor">
       <div className="entrance">TICKETS & ENTRANCE</div>
       {game.galleries.map(g=>{const m=metrics(g);return <button key={g.id} onClick={()=>commit({...game,selected:g.id})} className={'gallery-room '+(g.id===selected?.id?'selected':'')} style={{gridColumn:`${g.x} / span ${g.w}`,gridRow:`${g.y} / span ${g.h}`}}>
         <div className="room-title"><span>{g.name}</span><small>{STYLES[g.theme].name}</small></div><div className="wall-art">{g.artworks.slice(0,6).map(id=><span key={id} title={ARTIFACT_BY_ID[id].name}>{ARTIFACT_BY_ID[id].type==='Painting'?'▣':'◆'}</span>)}</div><div className="room-bars"><label>Art quality <i style={{width:m.quality+'%'}}></i><b>{m.quality}</b></label><label>Attractiveness <i style={{width:m.attractiveness+'%'}}></i><b>{m.attractiveness}</b></label></div><div className="visitors">● ● ● <em>{Math.round((m.quality+m.attractiveness)*2.4)} visitors</em></div>
       </button>})}
       <div className="service cafe">CAFÉ</div><div className="service shop">SHOP</div><div className="corridor">MAIN HALL</div>
      </div>
    </section>
    {selected && <aside className="inspector"><div className="inspector-title"><div><small>CURATING</small><input value={selected.name} onChange={e=>updateGallery(g=>({...g,name:e.target.value}))}/></div><button onClick={()=>commit({...game,galleries:game.galleries.filter(g=>g.id!==selected.id),selected:game.galleries.find(g=>g.id!==selected.id)?.id||0})}>×</button></div>
      <label className="field">Exhibition theme<select value={selected.theme} onChange={e=>updateGallery(g=>({...g,theme:e.target.value as StyleId}))}>{STYLE_IDS.map(id=><option key={id} value={id}>{STYLES[id].name}</option>)}</select></label>
      <div className="score-pair"><div><b>{sm?.quality}</b><span>Art Quality</span></div><div><b>{sm?.attractiveness}</b><span>Attractiveness</span></div><div><b>{sm?.cohesion}%</b><span>Cohesion</span></div></div>
      <h3>Works on display <span>{selected.artworks.length}/8</span></h3><div className="display-list">{selected.artworks.map(id=>{const a=ARTIFACT_BY_ID[id];return <div key={id}><span className={'art-chip '+a.style}>{a.type==='Painting'?'▣':'◆'}</span><p><b>{a.name}</b><small>{a.author} · {STYLES[a.style].name} · Quality {a.score}</small></p><button onClick={()=>removeArt(id)}>−</button></div>})}{!selected.artworks.length&&<p className="empty">Choose works from the Collection tab.</p>}</div>
      <h3>Interpretation & presentation</h3><div className="upgrade-grid">{([['labels','Wall texts'],['audio','Audio guide'],['lighting','Gallery lighting'],['decor','Period décor'],['seating','Benches']] as [UpgradeKey,string][]).map(([k,label])=><button key={k} onClick={()=>upgrade(k)} disabled={selected.upgrades[k]>=3}><span>{label}</span><b>Lv. {selected.upgrades[k]}</b><small>{selected.upgrades[k]>=3?'MAX':money(3500*(selected.upgrades[k]+1))}</small></button>)}</div>
    </aside>}
   </main>}
   {panel==='collection' && <main className="collection-page"><div className="page-head"><div><h1>Collection Storage</h1><p>{game.collection.length} works available. Add works to <b>{selected?.name}</b>.</p></div><input placeholder="Search artwork, artist, or movement…" value={search} onChange={e=>setSearch(e.target.value)}/></div><div className="art-grid">{filtered.map(a=><article key={a.id}><div className={'art-image '+a.style}><span>{a.type==='Painting'?'▣':a.type==='Sculpture'?'◆':'◈'}</span></div><div><small>{STYLES[a.style].name} · {a.year}</small><h3>{a.name}</h3><p>{a.author}</p><div className="art-footer"><b>Quality {a.score}</b><button disabled={selected?.artworks.includes(a.id)||selected?.artworks.length>=8} onClick={()=>addArt(a.id)}>{selected?.artworks.includes(a.id)?'Displayed':'Add to room'}</button></div></div></article>)}</div></main>}
   {panel==='business' && <main className="business-page"><div className="page-head"><div><h1>World Museum Business Almanac</h1><p>Compare cultural quality, visitor appeal, attendance, and revenue.</p></div></div><div className="kpis"><div><small>Museum art quality</small><b>{museum.q}</b></div><div><small>Museum attractiveness</small><b>{museum.a}</b></div><div><small>Annualized visitors</small><b>{(game.visitors*52).toLocaleString()}</b></div><div><small>Annualized revenue</small><b>{money(game.revenue*52)}</b></div></div><table><thead><tr><th>#</th><th>Museum</th><th>Art quality</th><th>Attractiveness</th><th>Annual visitors</th><th>Revenue</th></tr></thead><tbody>{projectedRank.map((r,i)=><tr key={r.name} className={r.name==='Your Museum'?'you':''}><td>{i+1}</td><td>{r.name}</td><td>{r.q}</td><td>{r.a}</td><td>{r.v.toLocaleString()}</td><td>{money(r.rev)}</td></tr>)}</tbody></table><div className="business-note"><b>Director’s assessment</b><p>Your museum’s immediate growth lever is whichever score is lower. A beautiful but incoherent room will not convert great art into repeat visits; a coherent exhibition without major works will struggle to become a destination.</p></div></main>}
 </div>
}
