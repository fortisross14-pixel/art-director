/* ============================================================
   UI v2 — LIVING ARTISTS  ( src/ui/v2/ )
   Only the artists you know. Studio visits introduce new ones;
   your curators' eye decides how established they can be.
   ============================================================ */
import { useState } from 'react';
import type { GameState, LivingArtist } from '../../data/types';
import { STYLES, rarityForScore } from '../../data/constants';
import * as E from '../../engine/game';
import { commissionPrice, statusFor, artistScore } from '../../engine/artistcore';
import { workOf } from '../../engine/attribution';
import { money } from '../../engine/util';
import type { Apply } from './root';

const initials = (n: string) => n.split(' ').map(x => x[0]).join('').slice(0, 2);

export function ArtistsPage({ state, apply }: { state: GameState; apply: Apply }) {
  const [open, setOpen] = useState<string | null>(null);
  const known = E.knownArtists(state).filter(a => a.alive || state.owned.some(id => state.livingWorks?.[id]?.artistId === a.id))
    .sort((a, b) => b.reputation - a.reputation);
  const reach = E.scoutReach(state);
  const mineCount = (id: string) => state.owned.filter(w => state.livingWorks?.[w]?.artistId === id).length;
  const a = open ? known.find(x => x.id === open) || null : null;
  const commissions = state.commissions || [];

  return (
    <>
      {E.canStudioVisit(state) && <div className="panel v2-callout"><b>A crate from the studios</b>
        <span>Brand-new work from the artists you know.</span>
        <button onClick={() => apply(E.studioVisit(state))}>Open a studio crate · §2,500 · 1 initiative</button></div>}

      <div className="panel">
        <div className="kicker">Your circle · {known.length} artist{known.length === 1 ? '' : 's'}</div>
        <h2>Meet more artists</h2>
        <div className="v2-reach"><span>Your curators can spot talent up to</span>
          <i><em style={{ width: `${reach}%` }} /></i><b>{reach}</b></div>
        <p className="v2-muted">Better curators see further: more established artists, bigger names. Breakout stars find you on their own.</p>
        <button className="v2-wide" onClick={() => apply(E.findArtists(state))}>Visit the studios · {money(E.STUDIO_ROUND_COST)} · 1 initiative</button>
      </div>

      {commissions.length > 0 && <p className="empty-note">Commissions under way: {commissions.map(c =>
        `${state.artists?.find(x => x.id === c.artistId)?.name} (${c.weeksLeft} wk)`).join(', ')}</p>}

      <div className="v2-artists">
        {known.map(x => <ArtistCard key={x.id} a={x} mine={mineCount(x.id)} onOpen={() => setOpen(x.id)} />)}
      </div>

      {a && (
        <div className="present" onClick={() => setOpen(null)}>
          <div className="present-sheet" onClick={e => e.stopPropagation()}>
            <div className="kicker">{STYLES[a.style].name} · {a.medium} · {statusFor(a)}</div>
            <h2>{a.name}</h2>
            <p className="empty-note">{a.alive ? `Age ${a.age}` : 'Deceased'} · reputation {Math.round(a.reputation)}{a.prizes ? ` · ${a.prizes} prize${a.prizes > 1 ? 's' : ''}` : ''}
              {' · '}potential {a.scouted ? `${a.scouted.low}–${a.scouted.high}` : 'unknown'}</p>
            {a.signed && <p className="v2-muted">{a.signed.by === 'player' ? `In residency with you, ${a.signed.weeksLeft} weeks left.` : 'In residency with a rival.'}</p>}
            {a.alive && <div className="v2-sheetbtns">
              <button disabled={!!a.signed && a.signed.by !== 'player'} onClick={() => { apply(E.commissionWork(state, a.id)); setOpen(null); }}>
                Commission a work · {money(commissionPrice(a))} · {E.COMMISSION_WEEKS} weeks</button>
              <button className="ghost" disabled={!!a.signed} onClick={() => { apply(E.startResidency(state, a.id)); setOpen(null); }}>
                Residency · {money(E.residencyCost(a.reputation))} · 1 initiative</button>
              <button className="ghost" onClick={() => { apply(E.scoutArtist(state, a.id)); setOpen(null); }}>Read their potential · 1 initiative</button>
              <button className="ghost" disabled={mineCount(a.id) < 2} onClick={() => { apply(E.soloShow(state, a.id)); setOpen(null); }}>
                Solo show {mineCount(a.id) < 2 ? '(needs 2 of their works)' : '· 1 initiative'}</button>
            </div>}
            {state.owned.filter(id => state.livingWorks?.[id]?.artistId === a.id).map(id => {
              const w = workOf(state, id);
              return <p key={id} className="v2-muted">You own {w.name}: {rarityForScore(w.score).name} {w.score}, worth about {money(w.value)}.</p>;
            })}
          </div>
        </div>
      )}
    </>
  );
}

function ArtistCard({ a, mine, onOpen }: { a: LivingArtist; mine: number; onOpen: () => void }) {
  const typical = Math.round(artistScore(a.reputation));
  const band = rarityForScore(typical);
  return (
    <button className="v2-artist" onClick={onOpen}>
      <span className="v2-avatar">{initials(a.name)}</span>
      <span className="v2-artist-body">
        <b>{a.name}</b>
        <small>{STYLES[a.style].name} · {a.medium}{mine ? ` · you own ${mine}` : ''}</small>
        <span className="v2-artist-rep"><i><em style={{ width: `${a.reputation}%` }} /></i>
          <em className={a.trend > 0.3 ? 'up' : a.trend < -0.3 ? 'down' : ''}>{a.trend > 0.3 ? '▲' : a.trend < -0.3 ? '▼' : '–'}</em></span>
      </span>
      <span className="v2-artist-band" style={{ borderColor: band.hex, color: band.hex }}>{band.name}</span>
    </button>
  );
}
