/* ============================================================
   UI — SEASON, REVIEW, ANNUAL REPORT, HISTORY  ( src/ui/ )
   Deliberately plain: these panels expose the M3 engine and will
   be replaced in the M7 visual revamp.
   ============================================================ */
import { useState } from 'react';
import type { BudgetPlan, GameState, SeasonSnapshot } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import * as S from '../engine/season';
import * as E from '../engine/game';
import { money } from '../engine/util';

export function SeasonPanel({ state, setState, onSimSeason }: {
  state: GameState; setState: (s: GameState) => void; onSimSeason: () => void;
}) {
  const season = state.season;
  const [plan, setPlan] = useState<BudgetPlan | null>(null);
  if (!season) return null;
  const draft = plan || season.plan;
  const total = S.BUDGET_LINES.reduce((n, k) => n + (draft[k] || 0), 0);
  const fx = E.budgetEffects(state, E.activeMuseum(state));
  return (
    <div className="panel">
      <h2>{S.seasonLabel(season.index)}<span className="sub">
        week {S.weekOfSeason(state)} of {S.SEASON_WEEKS} · {S.LEAGUE_NAMES[state.league || 'city']} #{S.leagueRank(state)}
        {' '}· {S.STAGE_NAMES[S.careerStage(state)]}</span></h2>
      <p className="empty-note">Initiatives left: <b>{season.initiativesLeft} / {season.initiativesMax}</b> (expeditions, studies,
        estate lots, research, campaigns, sponsors and temporary shows each use one; more staff, more initiatives).</p>
      <p className="empty-note">Budget plan: how each week's surplus is split. {season.planned ? '' : <b>Not yet confirmed this season.</b>}</p>
      <table className="then-now"><tbody>{S.BUDGET_LINES.map(k => (
        <tr key={k}><td>{S.BUDGET_NAMES[k]}</td><td>
          <input type="number" min={0} max={100} value={draft[k]} style={{ width: 64 }}
            onChange={e => setPlan({ ...draft, [k]: Math.max(0, Number(e.target.value) || 0) })} /> %</td></tr>))}
        <tr><td>Total</td><td>{total}% {total !== 100 && '(will be scaled to 100%)'}</td></tr>
      </tbody></table>
      <p className="empty-note">Now: marketing +{Math.round(25 * fx.marketing)}% visitors · exhibitions +{Math.round(20 * fx.exhibitions)}%
        presentation · operations {Math.round(fx.operations * 100)}% funded · endowment {money(state.endowment || 0)}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => { setState(S.setPlan(state, draft)); setPlan(null); }}>Confirm plan</button>
        <button className="ghost" onClick={onSimSeason}>Sim to end of season ⏭</button>
      </div>
      {state.lastReview && <ReviewBlock state={state} />}
    </div>
  );
}

function ReviewBlock({ state }: { state: GameState }) {
  const r = state.lastReview!;
  return (
    <>
      <div className="divider" />
      <h3>Review: {r.label}</h3>
      <ul>{r.causes.map((c, i) => <li key={i}>{c}</li>)}</ul>
      {r.chronicle.length > 0 && <><b>What happened</b><ul>{r.chronicle.slice(-8).map((c, i) => <li key={i}>{c}</li>)}</ul></>}
      {r.advice && <p><b>Advice:</b> {r.advice}</p>}
    </>
  );
}

const row = (label: string, a: number, b: number, fmt: (n: number) => string = n => n.toLocaleString()) =>
  <tr key={label}><td>{label}</td><td>{fmt(a)}</td><td><b>{fmt(b)}</b></td></tr>;

function snapRows(a: SeasonSnapshot, b: SeasonSnapshot) {
  return [
    row('Visitors per day', a.dailyVisitors, b.dailyVisitors),
    row('Prestige', a.prestige, b.prestige),
    row('Popularity', a.popularity, b.popularity),
    row('Patrons', a.patronage, b.patronage),
    row('Rooms', a.rooms, b.rooms),
    row('Works on display', a.works, b.works),
    row('Collection value', a.collectionValue, b.collectionValue, money),
    row('Cash', a.funds, b.funds, money),
  ];
}

export function AnnualReportPanel({ state }: { state: GameState }) {
  const reports = state.annualReports || [];
  const r = reports[reports.length - 1];
  if (!r) return null;
  const name = (id: string | null) => id ? ARTIFACT_BY_ID[id]?.name : '—';
  return (
    <div className="panel">
      <h2>Annual Report, Year {r.year}<span className="sub">{'★'.repeat(r.criticStars)}{'☆'.repeat(5 - r.criticStars)}</span></h2>
      <p><i>“{r.criticQuote}”</i></p>
      <table className="then-now"><thead><tr><th /><th>Start of year</th><th>End of year</th></tr></thead>
        <tbody>{snapRows(r.start, r.end)}
          {row(`League rank (${S.LEAGUE_NAMES[r.end.league]})`, r.start.rank, r.end.rank, n => '#' + n)}</tbody></table>
      <p>Acquisition of the year: <b>{name(r.acquisitionOfYear)}</b> · Discovery: <b>{name(r.discoveryOfYear)}</b>
        {' '}· Exhibition: <b>{r.exhibitionOfYear || '—'}</b></p>
      {r.awards.length > 0 && <p>Awards: {r.awards.join(' · ')}</p>}
      {r.promotedTo && <p><b>Promoted to the {S.LEAGUE_NAMES[r.promotedTo]}!</b> New stage: {S.STAGE_NAMES[r.stage]}.</p>}
    </div>
  );
}

export function HistoryPanel({ state }: { state: GameState }) {
  const reports = state.annualReports || [];
  const ms = state.milestones || [];
  return (
    <div className="panel">
      <h2>Museum History<span className="sub">year by year</span></h2>
      {reports.length === 0 ? <p className="empty-note">The first Annual Report arrives at the end of Year 1.</p> : (
        <table className="then-now"><thead><tr><th>Year</th><th>Visitors/day</th><th>Works</th><th>Value</th><th>League</th><th>Critics</th></tr></thead>
          <tbody>{reports.map(r => <tr key={r.year}><td>{r.year}</td><td>{r.end.dailyVisitors}</td><td>{r.end.works}</td>
            <td>{money(r.end.collectionValue)}</td><td>{S.LEAGUE_NAMES[r.end.league]} #{r.end.rank}{r.promotedTo ? ' ↑' : ''}</td>
            <td>{'★'.repeat(r.criticStars)}</td></tr>)}</tbody></table>)}
      <h3>Milestones</h3>
      {ms.length === 0 ? <p className="empty-note">None yet.</p>
        : <ul>{ms.map((m, i) => <li key={i}>Week {m.week}: {m.text}</li>)}</ul>}
    </div>
  );
}

export function TicketPresets({ state, setState }: { state: GameState; setState: (s: GameState) => void }) {
  const m = E.activeMuseum(state);
  const cur = E.ticketPresetOf(m);
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '6px 0' }}>
      {(Object.keys(E.TICKET_PRESETS) as E.TicketPreset[]).map(p => (
        <button key={p} className={p === cur ? '' : 'ghost'} title={E.TICKET_PRESETS[p].blurb}
          onClick={() => setState(E.setTicketPreset(state, p))}>
          {E.TICKET_PRESETS[p].name} · {money(Math.round(E.fairTicket(m) * E.TICKET_PRESETS[p].mult))}
        </button>))}
    </div>
  );
}
