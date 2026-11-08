/* ============================================================
   UI v2 — ACQUIRE  ( src/ui/v2/ )
   Calendar: the next thirteen weeks. Auctions: your houses, when
   they sell, this week's sales. Expeditions: region → size →
   leader → send, and teams in the field. Artists.
   ============================================================ */
import { useState } from 'react';
import type { ExpeditionTier, GameState, StyleId } from '../../data/types';
import { ARTIFACT_BY_ID } from '../../data/artifacts';
import { AUCTION_HOUSES, EXPEDITION_TIERS, EXPEDITION_WEEKS, STYLES, rarityForScore } from '../../data/constants';
import * as E from '../../engine/game';
import * as Auc from '../../engine/auction';
import * as W from '../../engine/weekly';
import * as Att from '../../engine/attribution';
import * as R from '../../engine/research';
import { EXPEDITION_CRATE } from '../../engine/game';
import { CRATE_TIER_NAME } from '../../engine/crates';
import { ArtistsPage } from './artists';
import { money } from '../../engine/util';
import type { Apply, Nav } from './root';

interface Props { state: GameState; sub: string; apply: Apply; setState: (s: GameState) => void; nav: Nav; flash: (m: string) => void; }

export function AcquirePage(p: Props) {
  if (p.sub === 'auctions') return <Auctions {...p} />;
  if (p.sub === 'expeditions') return <Expeditions {...p} />;
  if (p.sub === 'artists') return <ArtistsPage state={p.state} apply={p.apply} />;
  return <Calendar {...p} />;
}

function Calendar({ state, nav }: Props) {
  const items = W.upcoming(state, 13);
  const byWeek = new Map<number, W.CalendarItem[]>();
  for (const it of items) byWeek.set(it.week, [...(byWeek.get(it.week) || []), it]);
  const now = W.weekEvents(state).filter(e => e.expires);
  return (
    <div className="v2-calendar">
      <div className="panel v2-today" onClick={() => nav.go('week', 'week')} role="button" tabIndex={0}>
        <div className="kicker">This week</div>
        <b>{now.length ? now.map(e => e.title).join(' · ') : 'Nothing that expires this week'}</b>
        <span>Play it from the Week menu</span>
      </div>
      {[...byWeek.entries()].map(([w, list]) => (
        <div key={w} className="v2-calweek">
          <div className="v2-calhead"><b>Week {w}</b><span>in {w - state.week} week{w - state.week === 1 ? '' : 's'}</span></div>
          {list.map((it, i) => (
            <div key={i} className={'v2-calitem k-' + it.kind + (it.highlight ? ' hot' : '')}>
              <b>{it.title}</b><span>{it.detail}</span>
            </div>
          ))}
        </div>
      ))}
      {!items.length && <p className="empty-note">Join an auction house or send an expedition to fill your calendar.</p>}
    </div>
  );
}

function nextSale(houseId: string, from: number): number {
  for (let w = from; w < from + 8; w++) if (E.houseSellsInWeek(houseId, w)) return w;
  return from;
}

function Auctions({ state, apply, setState, flash }: Props) {
  const fame = E.totalFame(state);
  const attend = (evId: string) => {
    const res = E.attendEvent(state, evId);
    if (res.error) { flash(res.error); return; }
    setState({ ...res.state, auction: Auc.startLot(res.state, res.state.activeEvent!.lotIds[0]) });
  };
  return (
    <>
      <div className="v2-houses">
        {AUCTION_HOUSES.map(h => {
          const joined = state.joinedHouses.includes(h.id);
          const open = E.houseOpen(state, h, fame);
          const w = nextSale(h.id, state.week);
          return (
            <div key={h.id} className={'v2-house' + (joined ? ' joined' : open ? '' : ' locked')}>
              <div><b>{h.name}</b><span>{h.blurb}</span>
                <small>{joined ? (w === state.week ? 'Selling this week' : `Next sale in ${w - state.week} week${w - state.week === 1 ? '' : 's'}`) : open ? `Join for ${money(h.joinFee)}` : h.worldOnly && state.league !== 'world' ? 'World League museums only' : `Needs ${h.fameToUnlock} reputation (you have ${fame})`}</small></div>
              {!joined && open && <button onClick={() => apply(E.joinHouse(state, h.id))}>Join</button>}
            </div>
          );
        })}
      </div>
      <h3 className="v2-h3">This week's sales</h3>
      {!state.events.length && <p className="empty-note">No sales this week. Check the Calendar for the next ones.</p>}
      {state.events.map(ev => (
        <div key={ev.id} className="panel v2-sale">
          <div className="v2-salehead"><b>{ev.house}</b><span>{ev.lotIds.length} lots{ev.fee ? ` · entry ${money(ev.fee)}` : ''}</span></div>
          <div className="v2-lots">
            {ev.lotIds.map(id => {
              const a = Att.workOf(state, id);
              const band = rarityForScore(a.score);
              return <div key={id} className="v2-lot" style={{ borderColor: band.hex }}>
                <b>{a.name}</b><small>{STYLES[a.style].name} · {band.name}{ev.headlineId === id ? ' · ★ headline' : ''}</small></div>;
            })}
          </div>
          <button className="v2-wide" onClick={() => attend(ev.id)}>Enter the saleroom</button>
        </div>
      ))}
    </>
  );
}

const SIZE_NAME: Record<ExpeditionTier, string> = { common: 'Field', uncommon: 'Major', rare: 'Deep', epic: 'Grand' };

function Expeditions({ state, apply, nav }: Props) {
  const [style, setStyle] = useState<StyleId>(state.specialties.find(st => R.knowledgeOf(state, st) >= R.DIG_KNOWLEDGE) || state.specialties[0]);
  const [tier, setTier] = useState<ExpeditionTier>('common');
  const free = E.freeExplorers(state);
  const [leader, setLeader] = useState<string>('');
  const active = state.expeditions.filter(e => !e.resolved);
  const cost = E.expeditionCost(state, tier);
  const busy = new Set(active.map(e => e.style));
  return (
    <>
      {active.length > 0 && <div className="panel">
        <div className="kicker">In the field</div>
        {active.map(e => (
          <div key={e.id} className="v2-field">
            <div><b>{W.regionOf(e.style)} · {SIZE_NAME[e.tier]}</b><span>{e.weeksLeft > 0 ? `Back in ${e.weeksLeft} week${e.weeksLeft === 1 ? '' : 's'}` : 'Back: play out the dig'}</span></div>
            {e.weeksLeft <= 0 ? <button onClick={() => nav.openDig(e.id)}>Dig</button>
              : <i><em style={{ width: `${(EXPEDITION_WEEKS - e.weeksLeft) / EXPEDITION_WEEKS * 100}%` }} /></i>}
          </div>
        ))}
      </div>}

      <div className="panel">
        <div className="kicker">1 · Where</div>
        <div className="v2-regions">
          {state.specialties.map(st => {
            const open = R.knowledgeOf(state, st) >= R.DIG_KNOWLEDGE;
            return (
              <button key={st} className={(st === style && open ? 'sel' : '') + (open ? '' : ' locked')} onClick={() => open && setStyle(st)}>
                <b>{W.regionOf(st)}</b><span>{STYLES[st].name}</span>
                {!open ? <small>Research to {R.KNOWLEDGE_NAMES[R.DIG_KNOWLEDGE]}</small> : busy.has(st) && <small>a team is there</small>}</button>
            );
          })}
        </div>
        <p className="v2-muted">Regions open as your knowledge of a style grows (Office → Research).</p>
        <div className="kicker" style={{ marginTop: 14 }}>2 · How big</div>
        <div className="v2-tiers">
          {EXPEDITION_TIERS.map(t => {
            const crate = EXPEDITION_CRATE[t.id];
            const known = R.digTiers(state).includes(t.id);
            return (
              <button key={t.id} className={(t.id === tier ? 'sel' : '') + (known ? '' : ' locked')} onClick={() => known && setTier(t.id)}>
                <i className={'crate-' + crate} />
                <b>{SIZE_NAME[t.id]}</b><span>{CRATE_TIER_NAME[crate]} crate</span><em>{known ? money(E.expeditionCost(state, t.id)) : 'Research'}</em>
              </button>
            );
          })}
        </div>
        <div className="kicker" style={{ marginTop: 14 }}>3 · Who leads</div>
        <div className="v2-leaders">
          <button className={leader === '' ? 'sel' : ''} onClick={() => setLeader('')}>No leader</button>
          {free.map(x => <button key={x.id} className={leader === x.id ? 'sel' : ''} onClick={() => setLeader(x.id)}>{x.name} · {x.specialty}</button>)}
        </div>
        <button className="v2-wide v2-send" disabled={state.funds < cost}
          onClick={() => apply(E.commissionExpedition(state, tier, style, leader || null))}>
          Send the team · {money(cost)} · 1 initiative</button>
        <p className="v2-muted">Back in {EXPEDITION_WEEKS} weeks. You play the dig when they return.</p>
      </div>
      {state.claim && <p className="empty-note">A repatriation claim on {ARTIFACT_BY_ID[state.claim.artifactId]?.name} is waiting in the Week menu.</p>}
    </>
  );
}
