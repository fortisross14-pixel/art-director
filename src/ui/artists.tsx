/* ============================================================
   UI — LIVING ARTISTS  ( src/ui/ )
   Plain table exposing the M5 engine; rebuilt in the M7 revamp.
   ============================================================ */
import { useState } from 'react';
import type { GameState } from '../data/types';
import { STYLES } from '../data/constants';
import * as E from '../engine/game';
import { commissionPrice, statusFor, artistScore } from '../engine/artistcore';
import { workOf } from '../engine/attribution';
import { bandOf, BAND_NAMES } from '../engine/crates';
import { money } from '../engine/util';

type Apply = (r: { state: GameState; error?: string }) => void;

export function ArtistsTab({ state, apply }: { state: GameState; apply: Apply }) {
  const [sort, setSort] = useState<'reputation' | 'trend' | 'mine'>('reputation');
  const artists = (state.artists || []).filter(a => a.alive || state.owned.some(id => state.livingWorks?.[id]?.artistId === a.id));
  const mineCount = (id: string) => state.owned.filter(w => state.livingWorks?.[w]?.artistId === id).length;
  const rows = [...artists].sort((a, b) => sort === 'trend' ? b.trend - a.trend
    : sort === 'mine' ? mineCount(b.id) - mineCount(a.id) : b.reputation - a.reputation);
  const rivalName = (id: string) => state.rivals.find(r => r.id === id)?.name || 'a rival';
  const myWorks = state.owned.filter(id => state.livingWorks?.[id]);
  return (
    <div className="panel">
      <h2>Living Artists<span className="sub">scout, commission, champion</span></h2>
      <p className="empty-note">Every artist has a hidden potential. Their works are valued from their reputation <i>today</i>,
        so a cheap commission from an unknown can become a masterpiece if they break out. Commissions take {E.COMMISSION_WEEKS} weeks
        and need no initiative; residencies, solo shows and scouting each use one. Showing an artist's work in your museum helps their career.</p>
      {(state.commissions || []).length > 0 && <p className="empty-note">Commissions under way: {(state.commissions || []).map(c =>
        `${state.artists?.find(a => a.id === c.artistId)?.name} (${c.weeksLeft} wk)`).join(', ')}</p>}
      <div style={{ display: 'flex', gap: 6, margin: '6px 0' }}>
        Sort: {(['reputation', 'trend', 'mine'] as const).map(k =>
          <button key={k} className={sort === k ? '' : 'ghost'} onClick={() => setSort(k)}>{k === 'mine' ? 'my artists' : k}</button>)}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="then-now artists-table">
          <thead><tr><th>Artist</th><th>Reputation</th><th>Potential</th><th>Typical work</th><th>Yours</th><th /></tr></thead>
          <tbody>{rows.map(a => {
            const st = statusFor(a);
            const typical = Math.round(artistScore(a.reputation));
            const blocked = a.signed && a.signed.by !== 'player';
            return (
              <tr key={a.id}>
                <td><b>{a.name}</b><br /><small>{STYLES[a.style].name} · {a.medium} · {a.alive ? `age ${a.age}` : 'deceased'} · {st}
                  {a.prizes ? ` · ${a.prizes} prize${a.prizes > 1 ? 's' : ''}` : ''}</small>
                  {a.signed && <><br /><small>{a.signed.by === 'player' ? `In residency with you (${a.signed.weeksLeft} wk)` : `In residency with ${rivalName(a.signed.by)}`}</small></>}</td>
                <td>{Math.round(a.reputation)} {a.trend > 0.3 ? '▲' : a.trend < -0.3 ? '▼' : '·'}</td>
                <td>{a.scouted ? `${a.scouted.low}–${a.scouted.high}` : '?'}</td>
                <td>{BAND_NAMES[bandOf(typical)]} ({typical})</td>
                <td>{mineCount(a.id) || ''}</td>
                <td>{a.alive && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button disabled={!!blocked} onClick={() => apply(E.commissionWork(state, a.id))}>Commission {money(commissionPrice(a))}</button>
                  <button className="ghost" disabled={!!a.signed} onClick={() => apply(E.startResidency(state, a.id))}>Residency {money(E.residencyCost(a.reputation))}</button>
                  <button className="ghost" disabled={mineCount(a.id) < 2} onClick={() => apply(E.soloShow(state, a.id))}>Solo show</button>
                  <button className="ghost" onClick={() => apply(E.scoutArtist(state, a.id))}>Scout</button>
                </div>}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      {myWorks.length > 0 && <>
        <h3>Your works by living artists</h3>
        <ul>{myWorks.map(id => {
          const w = state.livingWorks![id];
          const art = workOf(state, id);
          return <li key={id}>{art.name} — {art.author}, {w.year}: <b>{BAND_NAMES[bandOf(art.score)]} {art.score}</b>,
            worth about {money(art.value)}{w.paid ? ` (paid ${money(w.paid)})` : ''}</li>;
        })}</ul>
      </>}
    </div>
  );
}
