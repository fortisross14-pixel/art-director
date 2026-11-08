/* ============================================================
   UI v2 — MUSEUM  ( src/ui/v2/ )
   Floor: your rooms as big tiles. Tap one for the full-screen
   Gallery: an editable name, the wall with empty + frames, a hang
   sheet with your stored works (best fit first), visitors, staff
   slots, ratings, thesis and decor. Collection, Catalogue and the
   Building live alongside.
   ============================================================ */
import { useState } from 'react';
import type { GameState, Room } from '../../data/types';
import { ARTIFACT_BY_ID } from '../../data/artifacts';
import { BUILDINGS, ROOM_CAPACITY, STYLES, districtOfBuilding, rarityForScore } from '../../data/constants';
import * as E from '../../engine/game';
import * as D from '../../engine/director';
import * as Att from '../../engine/attribution';
import { Thumb } from '../components';
import { ThesisIcon, ThesisPicker, StylePicker, DecorPicker } from './pickers';
import { thesisOf } from '../../engine/ratings';
import { CodexTab, TemporaryExhibitionsPanel } from '../App';
import { CatalogueTab } from '../crates';
import { money } from '../../engine/util';
import type { Apply, Nav } from './root';

interface Props { state: GameState; sub: string; apply: Apply; setState: (s: GameState) => void; nav: Nav; flash: (m: string) => void; }

export function MuseumPage(p: Props) {
  if (p.sub === 'collection') return <CodexTab state={p.state} apply={p.apply} onArtifact={p.nav.openArtifact} />;
  if (p.sub === 'catalogue') return <CatalogueTab state={p.state} onArtifact={p.nav.openArtifact} />;
  if (p.sub === 'building') return <Building {...p} />;
  return <Floor {...p} />;
}

const hexOf = (s: GameState, id: string) => rarityForScore(Att.workOf(s, id).score).hex;

function Floor({ state, apply, nav }: Props) {
  const m = E.activeMuseum(state);
  const b = BUILDINGS[m.buildingId];
  const perDay = Math.round(E.dailyVisitors(state, m));
  const cap = E.buildingCapacity(m);
  const open = m.rooms.filter(r => r.unlocked);
  const locked = m.rooms.filter(r => !r.unlocked);
  return (
    <div className="v2-floor">
      <div className="v2-floorhead">
        <div><b>{b.name}</b><span>{districtOfBuilding(m.buildingId)?.name}</span></div>
        <div className="v2-capacity" title="Visitors a day against what the building holds">
          <span>{perDay} / {cap} a day</span>
          <i><em style={{ width: `${Math.min(100, perDay / cap * 100)}%` }} /></i>
        </div>
      </div>
      <div className="v2-rooms">
        {open.map((r, i) => {
          const rr = r.items.length ? E.roomRatings(state, r) : null;
          return (
            <button key={r.id} className={'v2-room' + (r.theme ? '' : ' unthemed')} style={{ animationDelay: `${i * 0.05}s` }} onClick={() => nav.openRoom(r.id)}>
              <span className="v2-room-name">{E.roomName(r)}</span>
              <span className="v2-room-frames">
                {Array.from({ length: ROOM_CAPACITY }, (_, k) => {
                  const id = r.items[k];
                  return <i key={k} className={id ? 'on' : ''} style={id ? { background: hexOf(state, id) } : undefined} />;
                })}
              </span>
              <span className="v2-room-meta">{r.theme ? STYLES[r.theme].name : 'Choose a style'} · {r.items.length}/{ROOM_CAPACITY}{rr ? ` · appeal ${rr.visitorAppeal}` : ''}</span>
            </button>
          );
        })}
        {locked.length > 0 && (
          <button className="v2-room locked" onClick={() => apply(E.openRoom(state))}>
            <span className="v2-room-plus">+</span>
            <span className="v2-room-meta">Open a room · {money(E.roomCost(state))}</span>
          </button>
        )}
      </div>
      <p className="v2-muted" style={{ textAlign: 'center', marginTop: 10 }}>Tap a room to curate it.</p>
    </div>
  );
}

/* --- the full-screen gallery --------------------------------- */
type Sheet = null | { kind: 'hang'; slot: number } | { kind: 'work'; id: string } | { kind: 'staff'; role: 'curator' | 'researcher' } | { kind: 'thesis' } | { kind: 'decor' } | { kind: 'style' };

export function GalleryScreen({ state, roomId, apply, setState, nav, onBack }: {
  state: GameState; roomId: number; apply: Apply; setState: (s: GameState) => void; nav: Nav; onBack: () => void;
}) {
  const m = E.activeMuseum(state);
  const room = m.rooms.find(r => r.id === roomId) as Room | undefined;
  const [sheet, setSheet] = useState<Sheet>(null);
  const [name, setName] = useState(room ? E.roomName(room) : '');
  // the moment a work goes up: which frame, and what it did to the room
  const [hung, setHung] = useState<{ id: string; gain: number } | null>(null);
  if (!room) return null;
  const rr = D.detailedRoomRatings(state, room);
  const perf = D.roomPerformance(state, room);
  const perDay = Math.round(perf.weeklyVisitors / 6);
  const figures = Math.min(14, 2 + Math.round(perDay / 6));
  const shown = new Set(state.museums.flatMap(x => x.rooms.flatMap(r => r.items)));
  const storage = state.owned.filter(id => !shown.has(id) && !state.salvageOnly.includes(id)
    && !state.restorationOwed[id] && !state.stolenUndeclared[id])
    .map(id => Att.workOf(state, id))
    .sort((a, b) => Number(b.style === room.theme) - Number(a.style === room.theme) || b.score - a.score);
  const loans = m.loans.filter(l => l.roomId === null);
  const staffOf = (id?: string | null) => state.staff.find(s => s.id === id);
  const curator = staffOf(room.assignedCuratorId);
  const educator = staffOf(room.assignedResearcherId);
  const upgradeCost = Math.min(...(['decoration', 'interpretation', 'amenities'] as const)
    .filter(k => (room[k] || 0) < 3).map(k => E.roomUpgradeCost(room, k)), Infinity);
  const hang = (id: string) => {
    const res = E.placeArtifact({ ...state, pendingItemId: id }, room.id);
    apply(res); setSheet(null);
    if (!res.error) {
      const after = res.state.museums.flatMap(x => x.rooms).find(r => r.id === room.id && r.items.includes(id));
      setHung({ id, gain: after ? D.detailedRoomRatings(res.state, after).visitorAppeal - rr.visitorAppeal : 0 });
    }
  };
  const ratings: [string, number][] = [
    ['Visitor appeal', rr.visitorAppeal], ['Art quality', rr.artQuality], ['Attractiveness', rr.attractiveness],
    ['Cohesion', rr.cohesion], ['Interpretation', rr.interpretation],
  ];

  return (
    <div className="v2-gallery">
      <div className="v2-gtop">
        <button className="v2-round" onClick={onBack} aria-label="Back to the floor">←</button>
        <div className="v2-gname">
          <label htmlFor="gname">{room.hallName} <span aria-hidden="true">✎</span></label>
          <input id="gname" aria-label="Room name (tap to change)" value={name} onChange={e => setName(e.target.value)}
            onBlur={() => setState(E.renameRoom(state, room.id, name.trim() === E.roomName({ ...room, name: undefined }) ? '' : name.trim()))} />
        </div>
        <button className="v2-stylechip" onClick={() => setSheet({ kind: 'thesis' })}>{room.theme ? STYLES[room.theme].name : 'Mixed'}</button>
      </div>

      <div className="v2-wall">
        <div className="v2-frames">
          {Array.from({ length: ROOM_CAPACITY }, (_, k) => {
            const id = room.items[k];
            if (!id) return <button key={k} className="v2-slot" onClick={() => setSheet({ kind: 'hang', slot: k })} aria-label="Hang a work here">+</button>;
            const art = Att.workOf(state, id);
            const isSig = state.signatureId === id;
            return (
              <button key={k} className={'v2-work' + (isSig ? ' sig' : '') + (hung?.id === id ? ' just' : '')} style={{ borderColor: rarityForScore(art.score).hex }} onClick={() => setSheet({ kind: 'work', id })}>
                <Thumb artifact={art} size="lg" />
                <span>{art.name}</span>
              </button>
            );
          })}
        </div>
        {hung && <div className="v2-hungnote" key={hung.id} onAnimationEnd={() => setHung(null)}>
          <b className={hung.gain >= 0 ? 'up' : 'down'}>{hung.gain >= 0 ? '+' : ''}{hung.gain}</b> appeal</div>}
        <div className="v2-floorline" />
        <div className="v2-people" aria-hidden="true">
          {Array.from({ length: 14 }, (_, i) => <span key={i} className={i < figures ? 'here' : ''} style={{ animationDelay: `${(i * 0.37) % 3}s` }}><i /><b /></span>)}
        </div>
        <div className="v2-wallfoot"><span>{perDay} visitors a day in here</span><span>{room.items.length} / {ROOM_CAPACITY} works</span></div>
      </div>

      <div className="v2-staff">
        <button onClick={() => setSheet({ kind: 'staff', role: 'curator' })} className={curator ? 'filled' : ''}>
          <span className="v2-avatar">{curator ? curator.name.split(' ').map(x => x[0]).join('').slice(0, 2) : '+'}</span>
          <span><b>{curator ? curator.name : 'Curator'}</b><small>{curator ? `Curator · ${'★'.repeat(curator.skill)}` : 'Assign staff'}</small></span>
        </button>
        <button onClick={() => setSheet({ kind: 'staff', role: 'researcher' })} className={educator ? 'filled' : ''}>
          <span className="v2-avatar">{educator ? educator.name.split(' ').map(x => x[0]).join('').slice(0, 2) : '+'}</span>
          <span><b>{educator ? educator.name : 'Educator'}</b><small>{educator ? `Educator · ${'★'.repeat(educator.skill)}` : 'Assign staff'}</small></span>
        </button>
      </div>

      <div className="v2-ratings">
        {ratings.map(([label, v]) => (
          <div key={label}><span>{label}</span><i><em style={{ width: `${v}%` }} /></i><b>{v}</b></div>
        ))}
      </div>
      <div className="v2-gchips">
        <button onClick={() => setSheet({ kind: 'thesis' })}><span className="v2-chipicon"><ThesisIcon id={thesisOf(room)} /></span>{D.THESES[thesisOf(room)].name}{room.theme && thesisOf(room) === 'movement' ? `: ${STYLES[room.theme].name}` : ''}</button>
        <button onClick={() => setSheet({ kind: 'decor' })}>Decor: {D.DECOR[(room.decorStyle || 'classic') as keyof typeof D.DECOR].name}</button>
        <span>Presentation: {E.presentationTier(room)}</span>
      </div>
      {Number.isFinite(upgradeCost) && <button className="v2-wide" onClick={() => apply(E.upgradePresentation(state, room.id))}>Upgrade presentation<span className="cost">{money(upgradeCost)}</span></button>}

      {sheet && (
        <div className="present" onClick={() => setSheet(null)}>
          <div className="present-sheet" onClick={e => e.stopPropagation()}>
            <button className="v2-sheetclose" onClick={() => setSheet(null)} aria-label="Close">×</button>
            {sheet.kind === 'hang' && <>
              <h2>Hang a work</h2>
              {!storage.length && !loans.length && <p className="empty-note">Nothing in storage. Win something at auction, open a crate, or commission an artist.</p>}
              {loans.map(l => {
                const art = ARTIFACT_BY_ID[l.artifactId];
                return <button key={l.id} className="v2-pick" onClick={() => { apply(E.placeLoan(state, l.id, room.id)); setSheet(null); }}>
                  <Thumb artifact={art} size="sm" /><span><b>{art.name}</b><small>On loan from {l.lenderName} · {l.weeksLeft} wk</small></span><em className="fit">Loan</em></button>;
              })}
              {storage.map(a => {
                const themed = !!room.theme && thesisOf(room) === 'movement';
                const fits = a.style === room.theme;
                const gain = D.detailedRoomRatings(state, { ...room, items: [...room.items, a.id] }).visitorAppeal - rr.visitorAppeal;
                return <button key={a.id} className="v2-pick" onClick={() => hang(a.id)}>
                  <Thumb artifact={a} size="sm" /><span><b>{a.name}</b><small>{rarityForScore(a.score).name} {a.score} · {STYLES[a.style].name}</small></span>
                  {themed ? <em className={fits ? 'fit' : 'off'}>{fits ? 'Fits' : 'Off-theme'}</em>
                    : <em className={gain >= 0 ? 'fit' : 'off'}>{gain >= 0 ? '+' : ''}{gain} appeal</em>}</button>;
              })}
            </>}
            {sheet.kind === 'work' && (() => {
              const art = Att.workOf(state, sheet.id);
              const doubtful = Att.isDoubtful(state, art.id) && !state.attributions?.[art.id]?.settled;
              return <>
                <div className="kicker">{Att.attributionLine(state, art.id)}</div>
                <h2>{art.name}</h2>
                <p className="empty-note">{rarityForScore(art.score).name} {art.score} · {STYLES[art.style].name} · worth {money(art.value)}</p>
                <div className="v2-sheetbtns">
                  {state.signatureId !== art.id && <button onClick={() => { apply(E.setSignature(state, art.id)); setSheet(null); }}>Make it the signature work</button>}
                  {doubtful && <button className="ghost" onClick={() => { apply(E.startStudy(state, art.id)); setSheet(null); }}>Study the attribution<span className="cost">{money(Att.studyCost(state, art.id))}</span></button>}
                  <button className="ghost" onClick={() => { nav.openArtifact(art.id); }}>Details</button>
                  <button className="ghost" onClick={() => { apply(E.removeArtifact(state, art.id)); setSheet(null); }}>Take it down</button>
                </div>
              </>;
            })()}
            {sheet.kind === 'staff' && <>
              <h2>{sheet.role === 'curator' ? 'Who curates this room?' : 'Who teaches in this room?'}</h2>
              {state.staff.filter(x => x.role === sheet.role).map(x => (
                <button key={x.id} className="v2-pick" onClick={() => { setState(D.assignRoomStaff(state, room.id, sheet.role, x.id)); setSheet(null); }}>
                  <span className="v2-avatar">{x.name.split(' ').map(y => y[0]).join('').slice(0, 2)}</span>
                  <span><b>{x.name}</b><small>{'★'.repeat(x.skill)} · {x.specialty}</small></span></button>))}
              {!state.staff.some(x => x.role === sheet.role) && <p className="empty-note">No {sheet.role === 'curator' ? 'curators' : 'researchers'} on staff. Hire one in Office → Staff.</p>}
              <button className="ghost" onClick={() => { setState(D.assignRoomStaff(state, room.id, sheet.role, null)); setSheet(null); }}>Leave the slot empty</button>
            </>}
            {sheet.kind === 'thesis' && <ThesisPicker state={state} room={room}
              onPick={t => { apply(D.setRoomThesis(state, room.id, t)); setSheet(null); }}
              onStyle={() => setSheet({ kind: 'style' })} />}
            {sheet.kind === 'decor' && <DecorPicker state={state} room={room} onPick={k => { setState(D.setRoomDecor(state, room.id, k)); setSheet(null); }} />}
            {sheet.kind === 'style' && <StylePicker state={state} room={room} onPick={st => { apply(D.setRoomStyle(state, room.id, st)); setSheet(null); }} />}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- the building -------------------------------------------- */
function Building({ state, apply, nav }: Props) {
  const m = E.activeMuseum(state);
  const b = BUILDINGS[m.buildingId];
  const next = E.nextBuilding(state);
  const nb = next ? BUILDINGS[next] : null;
  const perDay = Math.round(E.dailyVisitors(state, m));
  const cap = E.buildingCapacity(m);
  const open = m.rooms.filter(r => r.unlocked).length;
  return (
    <>
      <div className="panel">
        <div className="kicker">{districtOfBuilding(m.buildingId)?.name}</div>
        <h2>{b.name}</h2>
        <p className="empty-note">{b.blurb}</p>
        <div className="v2-ratings">
          <div><span>Visitors / capacity</span><i><em style={{ width: `${Math.min(100, perDay / cap * 100)}%` }} /></i><b>{perDay}</b></div>
          <div><span>Rooms open</span><i><em style={{ width: `${open / m.rooms.length * 100}%` }} /></i><b>{open}/{m.rooms.length}</b></div>
        </div>
        <p className="empty-note">Holds {cap.toLocaleString()} a day now; each room you open makes room for more. Collection care {money(E.collectionCare(state))} a week. {E.atCapacity(state, m) ? <b>The building is full: open rooms or move.</b> : ''}</p>
        {open < m.rooms.length && <button className="v2-wide" onClick={() => apply(E.openRoom(state))}>Open a room<span className="cost">{money(E.roomCost(state))}</span></button>}
      </div>
      {nb && <div className="panel">
        <div className="kicker">The next step up</div>
        <h2>{nb.name}</h2>
        <p className="empty-note">{nb.blurb} Holds about {nb.capacity.toLocaleString()} a day · upkeep {money(nb.maintenance)} / week.</p>
        {E.moveBlocker(state, nb.id) && <p className="v2-muted"><b>{E.moveBlocker(state, nb.id)}</b></p>}
        <button className="v2-wide" onClick={() => apply(E.moveToBuilding(state, nb.id))} disabled={state.funds < nb.moveCost || !!E.moveBlocker(state, nb.id)}>Move here<span className="cost">{money(nb.moveCost)}</span></button>
        <button className="ghost v2-wide" onClick={() => nav.go('office', 'standing')}>See the whole city</button>
      </div>}
      {!nb && !b.starter && <div className="panel">
        <div className="kicker">Grow the flagship</div>
        <h2>A new wing<span className="sub">{m.wings || 0} of {E.MAX_WINGS} built</span></h2>
        {(m.wings || 0) < E.MAX_WINGS ? <>
          <p className="empty-note">Five more rooms and a quarter more visitors. Each wing costs twice the last.</p>
          {E.wingBlocker(state) && <p className="v2-muted"><b>{E.wingBlocker(state)}</b></p>}
          <button className="v2-wide" disabled={!!E.wingBlocker(state)} onClick={() => apply(E.buildWing(state))}>Build the wing<span className="cost">{money(E.wingCost(m))}</span></button>
        </> : <p className="empty-note">The site is complete.</p>}
      </div>}
      <TemporaryExhibitionsPanel state={state} apply={apply} />
    </>
  );
}
