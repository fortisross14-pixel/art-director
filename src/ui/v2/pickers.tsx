/* ============================================================
   UI v2 — ROOM PICKERS  ( src/ui/v2/ )
   Thesis, style and decor as tiles you can see: an icon, what it
   does, and how the room's appeal would change if you chose it.
   ============================================================ */
import type { GameState, Room, StyleId } from '../../data/types';
import { STYLES } from '../../data/constants';
import { ARTIFACT_BY_ID } from '../../data/artifacts';
import * as D from '../../engine/director';
import * as R from '../../engine/research';
import { thesisOf } from '../../engine/ratings';

/** small line icons, one per thesis */
export function ThesisIcon({ id }: { id: D.ThesisId }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      {id === 'none' && <><rect x="5" y="8" width="9" height="12" {...p} /><rect x="22" y="5" width="12" height="9" {...p} /><rect x="17" y="22" width="10" height="13" {...p} /></>}
      {id === 'movement' && <><rect x="4" y="11" width="9" height="18" {...p} /><rect x="15.5" y="11" width="9" height="18" {...p} /><rect x="27" y="11" width="9" height="18" {...p} /></>}
      {id === 'artist' && <><circle cx="20" cy="14" r="6" {...p} /><path d="M8 34c2-8 7-11 12-11s10 3 12 11" {...p} /></>}
      {id === 'period' && <><path d="M11 5h18M11 35h18M13 5c0 9 14 9 14 15S13 26 13 35M27 5c0 9-14 9-14 15s14 6 14 15" {...p} /></>}
      {id === 'region' && <><path d="M20 35s-11-11-11-19a11 11 0 0 1 22 0c0 8-11 19-11 19z" {...p} /><circle cx="20" cy="16" r="4" {...p} /></>}
      {id === 'medium' && <><path d="M28 5l7 7-15 15-7-7z" {...p} /><path d="M13 20c-5 0-8 4-8 9 0 3-1 5-1 5s9 1 12-3c2-3 1-6 1-6" {...p} /></>}
      {id === 'dialogue' && <><circle cx="15" cy="20" r="10" {...p} /><circle cx="25" cy="20" r="10" {...p} /></>}
    </svg>
  );
}

/** knowledge of a style, as five marks */
export function Pips({ n }: { n: number }) {
  return <span className="v2-pips" aria-label={`Knowledge ${n} of 5`}>{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= n ? 'on' : ''} />)}</span>;
}

const appealWith = (s: GameState, room: Room, patch: Partial<Room>) =>
  D.detailedRoomRatings(s, { ...room, ...patch }).visitorAppeal;

function Delta({ now, then }: { now: number; then: number }) {
  const d = then - now;
  return <em className={'v2-delta ' + (d > 0 ? 'up' : d < 0 ? 'down' : '')}>{d > 0 ? '+' : ''}{d} appeal</em>;
}

/** choose what the room is about */
export function ThesisPicker({ state, room, onPick, onStyle }: {
  state: GameState; room: Room; onPick: (t: D.ThesisId) => void; onStyle: () => void;
}) {
  const known = R.thesesKnown(state);
  const cur = thesisOf(room);
  const now = D.detailedRoomRatings(state, room).visitorAppeal;
  return (
    <>
      <h2>What is this room about?</h2>
      <div className="v2-tiles">
        {(Object.keys(D.THESES) as D.ThesisId[]).map(t => {
          const open = known.includes(t);
          const patch: Partial<Room> = t === 'none' ? { thesis: 'none', theme: null } : { thesis: t };
          const needsStyle = t === 'movement' && !room.theme;
          return (
            <button key={t} className={'v2-tile' + (cur === t ? ' sel' : '') + (open ? '' : ' locked')}
              onClick={() => open && (needsStyle ? onStyle() : onPick(t))} aria-disabled={!open}>
              <span className="v2-tile-icon"><ThesisIcon id={t} /></span>
              <b>{D.THESES[t].name}</b>
              <small>{D.THESES[t].blurb}</small>
              {!open ? <em className="v2-delta">Research it first</em>
                : needsStyle ? <em className="v2-delta">Choose a style</em>
                : cur !== t ? <Delta now={now} then={appealWith(state, room, patch)} /> : <em className="v2-delta">Current</em>}
            </button>
          );
        })}
      </div>
      <p className="empty-note">New theses come from Office → Research. A room with no thesis still gains from every work you hang; a thesis it fits makes it add up.</p>
    </>
  );
}

/** a colour for each style, for the tiles */
const STYLE_HUE: Partial<Record<StyleId, string>> = {
  egyptian: '#C9A24B', classical: '#B9B2A2', medieval: '#7A4A8A', renaissance: '#A0522D', baroque: '#6B1F2A',
  asian: '#B8432F', romanticism: '#4A6A8A', impressionism: '#7FA6C9', modernism: '#2F4A6A', contemporary: '#5A5A5A',
  popculture: '#D9468F', precolumbian: '#8A6A2E', islamic: '#2F7A6A',
};

/** a style survey: which style */
export function StylePicker({ state, room, onPick }: { state: GameState; room: Room; onPick: (st: StyleId) => void }) {
  const now = D.detailedRoomRatings(state, room).visitorAppeal;
  const shown = new Set(state.museums.flatMap(x => x.rooms.flatMap(r => r.items)));
  return (
    <>
      <h2>Which style will it survey?</h2>
      <div className="v2-tiles">
        {state.specialties.map(st => {
          const inRoom = room.items.filter(id => ARTIFACT_BY_ID[id]?.style === st).length;
          const stored = state.owned.filter(id => ARTIFACT_BY_ID[id]?.style === st && !shown.has(id)).length;
          return (
            <button key={st} className={'v2-tile' + (room.theme === st ? ' sel' : '')} onClick={() => onPick(st)}>
              <span className="v2-tile-swatch" style={{ background: STYLE_HUE[st] || '#777' }} />
              <b>{STYLES[st].name}</b>
              <Pips n={R.knowledgeOf(state, st)} />
              <small>{inRoom} hanging here, {stored} in storage</small>
              <Delta now={now} then={appealWith(state, room, { theme: st, thesis: 'movement' })} />
            </button>
          );
        })}
      </div>
      <p className="empty-note">Research more styles in Office → Research.</p>
    </>
  );
}

const DECOR_LOOK: Record<keyof typeof D.DECOR, string> = {
  classic: 'linear-gradient(#6B1F2A, #3A1418)',
  dramatic: 'radial-gradient(circle at 50% 20%, #8A7A5A 0, #1A1210 60%)',
  minimal: 'linear-gradient(#F4F1EA, #D9D4C8)',
  immersive: 'linear-gradient(135deg, #2F2A6A, #7A3A8A, #2F6A7A)',
};

/** how the room should feel */
export function DecorPicker({ state, room, onPick }: { state: GameState; room: Room; onPick: (k: keyof typeof D.DECOR) => void }) {
  const now = D.detailedRoomRatings(state, room).visitorAppeal;
  return (
    <>
      <h2>How should the room feel?</h2>
      <div className="v2-tiles">
        {(Object.keys(D.DECOR) as (keyof typeof D.DECOR)[]).map(k => (
          <button key={k} className={'v2-tile' + ((room.decorStyle || 'classic') === k ? ' sel' : '')} onClick={() => onPick(k)}>
            <span className="v2-tile-swatch big" style={{ background: DECOR_LOOK[k] }}><i /><i /><i /></span>
            <b>{D.DECOR[k].name}</b>
            <small>Suits {D.DECOR[k].best.map(x => STYLES[x as StyleId].name).join(', ')}</small>
            {(room.decorStyle || 'classic') !== k ? <Delta now={now} then={appealWith(state, room, { decorStyle: k })} /> : <em className="v2-delta">Current</em>}
          </button>
        ))}
      </div>
    </>
  );
}
