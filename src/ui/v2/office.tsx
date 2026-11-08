/* ============================================================
   UI v2 — OFFICE  ( src/ui/v2/ )
   Plan: the 20 strategy points and initiatives. Money: ticket
   price, income, sponsors, campaigns. Staff. Research. Standing:
   league, Annual Reports, history, rivals, the city, retirement.
   ============================================================ */
import { useState } from 'react';
import type { GameState } from '../../data/types';
import { AD_CAMPAIGN, BUILDINGS } from '../../data/constants';
import * as E from '../../engine/game';
import * as S from '../../engine/season';
import * as Sim from '../../engine/sim';
import { money } from '../../engine/util';
import { PointsPicker, fromPlan, toPlan, TicketPresets, MixLine, LeagueTable, RetireButton, AnnualReportPanel, HistoryPanel } from '../season';
import { ResearchPage } from './research';
import { loadSettings, saveSettings } from '../settings';
import type { Settings } from '../settings';
import { PersonnelTab, SponsorsPanel, CompetitorsTab, MapTab, CareerSoFar } from '../App';
import type { Apply, Nav } from './root';

interface Props { state: GameState; sub: string; apply: Apply; setState: (s: GameState) => void; nav: Nav; flash: (m: string) => void; }

export function OfficePage(p: Props) {
  if (p.sub === 'money') return <Money {...p} />;
  if (p.sub === 'people') return <PersonnelTab state={p.state} apply={p.apply} />;
  if (p.sub === 'research') return <ResearchPage state={p.state} apply={p.apply} />;
  if (p.sub === 'standing') return <Standing {...p} />;
  if (p.sub === 'settings') return <SettingsPage />;
  return <Plan {...p} />;
}

function Plan({ state, setState, nav, flash }: Props) {
  const season = state.season;
  const [pts, setPts] = useState<Record<string, number> | null>(null);
  if (!season) return null;
  const draft = pts || fromPlan(season.plan);
  return (
    <>
      <div className="panel">
        <div className="kicker">{S.STAGE_NAMES[S.careerStage(state)]}</div>
        <h2>{S.seasonLabel(season.index)}<span className="sub">week {S.weekOfSeason(state)} of {S.SEASON_WEEKS}</span></h2>
        <div className="v2-initiatives">
          {Array.from({ length: season.initiativesMax }, (_, i) => <i key={i} className={i < season.initiativesLeft ? '' : 'spent'} />)}
          <span><b>{season.initiativesLeft}</b> of {season.initiativesMax} initiatives left</span>
        </div>
        <p className="v2-muted">Expeditions, studies, estate lots, viewings, research, campaigns, sponsors, residencies and shows each use one. More staff, more initiatives.</p>
      </div>
      <div className="panel">
        <h2>Strategy points<span className="sub">{season.planned ? 'plan confirmed' : 'not yet confirmed'}</span></h2>
        <PointsPicker state={state} pts={draft} setPts={setPts} />
        <div className="v2-sheetbtns">
          <button onClick={() => { setState(S.setPlan(state, toPlan(draft))); setPts(null); flash('Plan confirmed for the season.'); }}>{season.planned ? 'Update the plan' : 'Confirm the plan'}</button>
          <button className="ghost" onClick={() => { const r = Sim.simToEndOfSeason(state); nav.advanceTo(r.state); flash(r.reason); }}>Play out the season</button>
        </div>
      </div>
    </>
  );
}

function Money({ state, apply, setState }: Props) {
  const m = E.activeMuseum(state);
  const mix = state.revenueMix;
  return (
    <>
      <div className="panel">
        <h2>Ticket price<span className="sub">what visitors pay</span></h2>
        <TicketPresets state={state} setState={setState} />
        <p className="v2-muted">Reputation sets what people will happily pay. Free entry pleases patrons and crowds; premium earns more from fewer.</p>
      </div>
      <div className="panel">
        <h2>Last week<span className="sub">income and costs</span></h2>
        <div className="v2-ledger">
          <div><span>Income</span><b className="up">{money(state.lastRevenue)}</b></div>
          <div><span>Costs</span><b className="down">{money(state.lastExpenses)}</b></div>
          <div><span>Result</span><b>{money(state.lastRevenue - state.lastExpenses)}</b></div>
          <div><span>Endowment</span><b>{money(state.endowment || 0)}</b></div>
        </div>
        {mix && <MixLine mix={mix} />}
        <MixLine mix={state.yearMix} />
      </div>
      <div className="panel">
        <h2>Marketing<span className="sub">a campaign</span></h2>
        <p className="v2-muted">{m.adWeeksLeft > 0 ? `A campaign is running: ${m.adWeeksLeft} week(s) left.` : `${AD_CAMPAIGN.weeks} weeks of +${Math.round((AD_CAMPAIGN.visitorMult - 1) * 100)}% visitors.`}</p>
        <button className="v2-wide" disabled={m.adWeeksLeft > 0} onClick={() => apply(E.runAdCampaign(state, m.id))}>Run a campaign<span className="cost">{money(AD_CAMPAIGN.cost)} and 1 initiative</span></button>
      </div>
      <SponsorsPanel state={state} apply={apply} museum={m} building={BUILDINGS[m.buildingId]} />
    </>
  );
}

function Standing({ state, apply, setState, flash, nav }: Props) {
  return (
    <>
      <div className="panel"><LeagueTable state={state} /><RetireButton state={state} setState={setState} /></div>
      <AnnualReportPanel state={state} />
      <CareerSoFar state={state} />
      <HistoryPanel state={state} />
      <CompetitorsTab state={state} apply={apply} />
      <MapTab state={state} apply={apply} setState={setState} flash={flash} goGalleries={() => nav.go('museum', 'floor')} />
    </>
  );
}

/** comfort settings for this device */
function SettingsPage() {
  const [st, setSt] = useState<Settings>(loadSettings);
  const set = (patch: Partial<Settings>) => { const n = { ...st, ...patch }; setSt(n); saveSettings(n); };
  const deviceReduces = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <>
      <div className="panel">
        <h2>Motion</h2>
        <p className="v2-muted">Reduce turns off the falling frames, the gold bursts, card deals and other movement.
          {deviceReduces ? ' Your device already asks for reduced motion, so the game is following it.' : ''}</p>
        <div className="v2-sheetbtns two">
          <button className={st.motion === 'device' ? '' : 'ghost'} aria-pressed={st.motion === 'device'} onClick={() => set({ motion: 'device' })}>Match my device</button>
          <button className={st.motion === 'reduce' ? '' : 'ghost'} aria-pressed={st.motion === 'reduce'} onClick={() => set({ motion: 'reduce' })}>Reduce motion</button>
        </div>
      </div>
      <div className="panel">
        <h2>Text and button size</h2>
        <p className="v2-muted">Scales everything: text, buttons and pictures.</p>
        <div className="v2-sheetbtns three">
          {([[1, 'Standard'], [1.15, 'Large'], [1.3, 'Larger']] as const).map(([v, label]) => (
            <button key={v} className={st.size === v ? '' : 'ghost'} aria-pressed={st.size === v} onClick={() => set({ size: v })}>{label}</button>))}
        </div>
        <div className="v2-preview"><b>The Night Watch</b><span>Legendary, Baroque. Worth about §2,400,000.</span></div>
      </div>
      <p className="empty-note">These settings belong to this device and apply to every save.</p>
    </>
  );
}
