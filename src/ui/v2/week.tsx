/* ============================================================
   UI v2 — WEEK  ( src/ui/v2/ )
   This Week: the queue of what needs you, each with Go or Skip,
   the Upcoming strip, and End week. Crates: what's waiting to be
   opened. News: the last season review, milestones, the log.
   ============================================================ */
import type { GameState } from '../../data/types';
import * as E from '../../engine/game';
import * as Auc from '../../engine/auction';
import * as Sim from '../../engine/sim';
import * as W from '../../engine/weekly';
import { ARTIFACT_BY_ID } from '../../data/artifacts';
import { CratesPanel, DustPanel } from '../crates';
import { ReviewBlock } from '../season';
import type { Apply, Nav } from './root';

interface Props { state: GameState; sub: string; apply: Apply; setState: (s: GameState) => void; nav: Nav; flash: (m: string) => void; }

const ICON: Record<W.WeekEventKind, string> = {
  auction: '§', gala: '♛', dealer: '?', estate: '⚱', dig: '▲', crate: '▣', claim: '⚖', plan: '✦',
};

export function WeekPage(p: Props) {
  if (p.sub === 'crates') return <>
    <CratesPanel state={p.state} apply={p.apply} onOpen={p.nav.openCrate} />
    {!(p.state.crates || []).length && !p.state.estateOffer && <div className="panel"><p className="empty-note">No crates waiting. Digs, estate lots, studio visits and donors send them.</p></div>}
    <DustPanel state={p.state} />
  </>;
  if (p.sub === 'news') return <News state={p.state} />;
  return <ThisWeek {...p} />;
}

function ThisWeek({ state, apply, setState, nav, flash }: Props) {
  const events = W.weekEvents(state);
  const coming = W.upcoming(state, 8).slice(0, 6);
  const go = (e: W.WeekEvent) => {
    if (e.kind === 'plan') return nav.go('office', 'plan');
    if (e.kind === 'auction') {
      const ev = state.events.find(x => x.id === e.ref);
      const res = E.attendEvent(state, e.ref!);
      if (res.error || !ev) { flash(res.error || 'That sale has ended.'); return; }
      setState({ ...res.state, auction: Auc.startLot(res.state, res.state.activeEvent!.lotIds[0]) });
      return;
    }
    if (e.kind === 'gala') return nav.openGala();
    if (e.kind === 'dealer') return nav.openDealer();
    if (e.kind === 'estate') return apply(E.buyEstate(state));
    if (e.kind === 'dig') return nav.openDig(e.ref!);
    if (e.kind === 'crate') return nav.openCrate(e.ref!);
  };
  const sim = () => {
    const res = Sim.simToNextOpportunity(state);
    nav.advanceTo(res.state);
    flash(`${res.weeks} week${res.weeks === 1 ? '' : 's'} later — ${res.reason}`);
  };
  return (
    <div className="v2-week">
      <div className="v2-coming">
        <span className="v2-label">Coming up</span>
        <div className="v2-chips">
          {coming.length ? coming.map((c, i) => (
            <button key={i} className={'v2-chip' + (c.highlight ? ' hot' : '')} onClick={() => nav.go('acquire', 'calendar')}>
              {c.week - state.week} wk · {c.title}</button>
          )) : <span className="v2-muted">Nothing on the calendar yet</span>}
        </div>
      </div>

      {events.length === 0 && <div className="v2-quiet"><b>A quiet week.</b><span>Hang your works, plan the season, or end the week.</span></div>}
      <div className="v2-events">
        {events.map((e, i) => (
          <div key={e.id} className={'v2-event k-' + e.kind} style={{ animationDelay: `${i * 0.06}s` }}>
            <span className="v2-event-icon">{ICON[e.kind]}</span>
            <div className="v2-event-body">
              <b>{e.title}</b>
              <span>{e.sub}</span>
              {e.expires && <small>Today only</small>}
            </div>
            {e.kind === 'claim' ? (
              <div className="v2-event-actions">
                <button onClick={() => apply(E.answerClaim(state, true))}>Return</button>
                <button className="ghost" onClick={() => apply(E.answerClaim(state, false))}>Refuse</button>
              </div>
            ) : (
              <div className="v2-event-actions">
                <button onClick={() => go(e)}>{e.kind === 'estate' ? 'Buy' : e.kind === 'crate' ? 'Open' : e.kind === 'plan' ? 'Plan' : 'Go'}</button>
                {e.expires && <button className="ghost" onClick={() => setState(W.skipEvent(state, e.id))}>Skip</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="v2-endweek">
        <button className="v2-end" onClick={nav.endWeek}>End the week</button>
        <button className="ghost v2-sim" onClick={sim}>Skip quiet weeks</button>
      </div>
    </div>
  );
}

function News({ state }: { state: GameState }) {
  const ms = [...(state.milestones || [])].reverse();
  return (
    <>
      {state.lastReview && <div className="panel"><ReviewBlock state={state} /></div>}
      <div className="panel">
        <h2>Milestones<span className="sub">your career so far</span></h2>
        {ms.length ? <ul className="v2-list">{ms.map((m, i) => <li key={i}><span>Week {m.week}</span>{m.text}</li>)}</ul>
          : <p className="empty-note">Your first milestones are ahead of you.</p>}
      </div>
      <div className="panel">
        <h2>The log<span className="sub">recent events</span></h2>
        <ul className="v2-list">{state.log.slice(0, 25).map((l, i) => <li key={i} className={'log-' + l.kind}>{l.text}</li>)}</ul>
      </div>
      {state.signatureId && <p className="empty-note" style={{ textAlign: 'center' }}>Signature work: {ARTIFACT_BY_ID[state.signatureId]?.name}</p>}
    </>
  );
}
