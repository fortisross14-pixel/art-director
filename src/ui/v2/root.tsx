/* ============================================================
   UI v2 — ROOT  ( src/ui/v2/ )
   Four menus (Week, Museum, Acquire, Office), each with sub-tabs.
   Everything a director does has one home. Full-screen overlays
   for the moments that deserve the whole phone: a gallery, an
   auction room, a crate, and the three card games.
   ============================================================ */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { GameState, StyleId } from '../../data/types';
import { STYLES } from '../../data/constants';
import * as R from '../../engine/research';
import { THESES } from '../../engine/ratings';
import '../styles.css';
import '../salon.css';
import './v2.css';
import * as E from '../../engine/game';
import * as Auc from '../../engine/auction';
import * as Saves from '../../engine/saves';
import * as Sim from '../../engine/sim';
import * as Season from '../../engine/season';
import * as Legacy from '../../engine/legacy';
import * as Att from '../../engine/attribution';
import * as W from '../../engine/weekly';
import { Home, ChooseStyle, NameGallery, EventInterior } from '../App';
import { ArtifactDetail } from '../components';
import { CrateScreen } from '../crates';
import { AnnualReportShow, ReviewShow } from '../present';
import { CareerCard } from '../legacy';
import { WeekPage } from './week';
import { MuseumPage, GalleryScreen } from './museum';
import { AcquirePage } from './acquire';
import { OfficePage } from './office';
import { GalaGame, DigGame, DealerGame } from './games';
import { compact } from './fmt';

export type Menu = 'week' | 'museum' | 'acquire' | 'office';
const SUBS: Record<Menu, [string, string][]> = {
  week: [['week', 'This Week'], ['crates', 'Crates'], ['news', 'News']],
  museum: [['floor', 'Floor'], ['collection', 'Collection'], ['catalogue', 'Catalogue'], ['building', 'Building']],
  acquire: [['calendar', 'Calendar'], ['auctions', 'Auctions'], ['expeditions', 'Expeditions'], ['artists', 'Artists']],
  office: [['plan', 'Plan'], ['money', 'Money'], ['people', 'Staff'], ['research', 'Research'], ['standing', 'Standing']],
};
const MENU_LABEL: Record<Menu, string> = { week: 'Week', museum: 'Museum', acquire: 'Acquire', office: 'Office' };

export type Apply = (r: { state: GameState; error?: string }) => void;
export interface Nav {
  go: (menu: Menu, sub?: string) => void;
  openRoom: (roomId: number) => void;
  openCrate: (id: string) => void;
  openArtifact: (id: string) => void;
  openGala: () => void;
  openDealer: () => void;
  openDig: (expeditionId: string) => void;
  endWeek: () => void;
  advanceTo: (s: GameState) => void;
}

export default function Root() {
  useEffect(() => { document.body.classList.add('salon'); }, []);
  const [slot, setSlot] = useState<number | null>(null);
  const [state, setState] = useState<GameState | null>(null);
  if (slot === null || !state) {
    return <Home
      onNew={s => { setSlot(s); setState(E.newGame(Legacy.legacyMuseumsFrom(Legacy.loadHallOfFame()))); }}
      onLoad={s => { const rec = Saves.loadSlot(s); if (rec) { setSlot(s); setState(rec.state); } }} />;
  }
  return <Game key={slot} slot={slot} initial={state} onExit={() => { setSlot(null); setState(null); }} />;
}

type Overlay = null
  | { kind: 'room'; id: number }
  | { kind: 'crate'; id: string }
  | { kind: 'artifact'; id: string }
  | { kind: 'gala' } | { kind: 'dealer' } | { kind: 'dig'; id: string };

function Game({ slot, initial, onExit }: { slot: number; initial: GameState; onExit: () => void }) {
  const [state, setRaw] = useState<GameState>(initial);
  const [menu, setMenu] = useState<Menu>('week');
  const [sub, setSub] = useState<Record<Menu, string>>({ week: 'week', museum: 'floor', acquire: 'calendar', office: 'plan' });
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [toast, setToast] = useState<string | null>(null);
  // large-tier feedback: research finished, milestones reached
  const [moments, setMoments] = useState<Moment[]>([]);
  const [presenting, setPresenting] = useState<('annual' | 'review')[]>([]);
  const [skipSheet, setSkipSheet] = useState(false);

  const saveWarned = useRef(false);
  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(t => (t === msg ? null : t)), 2800);
  }, []);
  const setState = useCallback((s: GameState) => {
    setRaw(s);
    if (!Saves.saveSlot(slot, s) && !saveWarned.current) {
      saveWarned.current = true;
      flash('The game could not be saved: this browser is out of storage or blocking it. Progress since now may be lost.');
    }
    if (s.careerRecord) Legacy.saveToHallOfFame(s.careerRecord);
  }, [slot, flash]);
  const apply: Apply = r => { if (r.error) flash(r.error); else setState(r.state); };

  // the auction clock: a fixed step, independent of renders
  const live = !!state.auction && !state.auction.over && state.auction.mode !== 'intro';
  useEffect(() => {
    if (!live) return;
    const h = window.setInterval(() => setRaw(s => (!s.auction || s.auction.over || s.auction.mode === 'intro')
      ? s : { ...s, auction: Auc.tickAuction(s, 200) }), 200);
    return () => window.clearInterval(h);
  }, [live]);
  useEffect(() => { if (state.auction?.over) Saves.saveSlot(slot, state); }, [state.auction?.over, slot, state]);

  if (state.phase === 'choose-specialty')
    return <ChooseStyle onFound={(bg, d, st, a, all) => setState(E.foundMuseum(state, bg, d, st, a, all))} onExit={onExit} />;
  if (state.phase === 'name-gallery')
    return <NameGallery state={state} onConfirm={(pn, gn, t) => setState(Season.ensureSeason(E.nameGallery(state, pn, gn, t)))} />;
  if (state.phase === 'ended' && state.careerRecord) {
    return (
      <div className="home-wrap">
        <div className="home-title">A career in the Hall of Fame</div>
        <CareerCard r={state.careerRecord} />
        <button onClick={onExit}>Back to the home screen</button>
      </div>
    );
  }

  const advanceTo = (next: GameState) => {
    const queue: ('annual' | 'review')[] = [];
    if ((next.annualReports || []).length > (state.annualReports || []).length) queue.push('annual');
    if (next.lastReview && next.lastReview !== state.lastReview) queue.push('review');
    setState(next);
    if (queue.length) setPresenting(queue);
    const m = momentsBetween(state, next);
    if (m.length) setMoments(x => [...x, ...m].slice(0, 4));
  };
  const doEndWeek = () => { setSkipSheet(false); advanceTo(Sim.stepWeek(state)); setMenu('week'); setSub(x => ({ ...x, week: 'week' })); };
  const nav: Nav = {
    go: (m, s) => { setOverlay(null); setMenu(m); if (s) setSub(x => ({ ...x, [m]: s })); window.scrollTo({ top: 0 }); },
    openRoom: id => setOverlay({ kind: 'room', id }),
    openCrate: id => setOverlay({ kind: 'crate', id }),
    openArtifact: id => setOverlay({ kind: 'artifact', id }),
    openGala: () => setOverlay({ kind: 'gala' }),
    openDealer: () => setOverlay({ kind: 'dealer' }),
    openDig: id => setOverlay({ kind: 'dig', id }),
    endWeek: () => { if (W.expiringEvents(state).length) setSkipSheet(true); else doEndWeek(); },
    advanceTo,
  };

  // --- full-screen moments ------------------------------------
  let full: React.ReactNode = null;
  if (state.activeEvent) {
    full = <EventInterior state={state} setState={setState} flash={flash} goGalleries={() => nav.go('museum', 'floor')} />;
  } else if (overlay?.kind === 'room') {
    full = <GalleryScreen state={state} roomId={overlay.id} apply={apply} setState={setState} nav={nav} onBack={() => setOverlay(null)} />;
  } else if (overlay?.kind === 'crate' && (state.crates || []).some(c => c.id === overlay.id)) {
    full = <CrateScreen state={state} crateId={overlay.id} apply={apply} onClose={() => setOverlay(null)} />;
  } else if (overlay?.kind === 'artifact') {
    full = <div><button className="ghost v2-back" onClick={() => setOverlay(null)}>← Back</button>
      <ArtifactDetail artifact={Att.workOf(state, overlay.id)} onBack={() => setOverlay(null)} /></div>;
  } else if (overlay?.kind === 'gala') {
    full = <GalaGame state={state} apply={apply}
      onClose={() => { setRaw(s => { const n = { ...s, galaPending: false }; Saves.saveSlot(slot, n); return n; }); setOverlay(null); }} />;
  } else if (overlay?.kind === 'dealer') {
    full = <DealerGame state={state} apply={apply}
      onClose={() => { setRaw(s => { const n = { ...s, blackMarketPending: false }; Saves.saveSlot(slot, n); return n; }); setOverlay(null); }} />;
  } else if (overlay?.kind === 'dig') {
    const exp = state.expeditions.find(e => e.id === overlay.id);
    if (exp) full = <DigGame state={state} expedition={exp} apply={apply}
      onDone={crateId => setOverlay(crateId ? { kind: 'crate', id: crateId } : null)} />;
  }

  const season = state.season;
  const surplus = state.lastRevenue - state.lastExpenses;
  const weekBadge = W.weekEvents(state).length;
  return (
    <div className="salon-shell v2">
      <header className="salon-header v2-header">
        <div className="salon-header-top">
          <div style={{ minWidth: 0 }}>
            <div className="salon-kicker">{season ? Season.seasonLabel(season.index) : ''} · week {Season.weekOfSeason(state)}/13</div>
            <h1 className="salon-title" onClick={onExit} title="Home">{state.galleryName}</h1>
          </div>
          <div className="v2-header-actions">
            <button className="v2-cash" onClick={() => nav.go('office', 'money')} aria-label="Money">
              <b>{compact(state.funds)}</b><small className={surplus >= 0 ? 'up' : 'down'}>{surplus >= 0 ? '+' : '−'}{compact(Math.abs(surplus))}/wk</small></button>
            {season && <button className="v2-tokens" onClick={() => nav.go('office', 'plan')} aria-label={`${season.initiativesLeft} initiatives left`}>
              {Array.from({ length: season.initiativesMax }, (_, i) => <i key={i} className={i < season.initiativesLeft ? '' : 'spent'} />)}</button>}
          </div>
        </div>
      </header>
      {!full && <nav className="salon-subtabs" aria-label={`${MENU_LABEL[menu]} sections`}>
        {SUBS[menu].map(([id, label]) => {
          const b = menu === 'week' && id === 'week' ? weekBadge : menu === 'week' && id === 'crates' ? (state.crates || []).length : 0;
          return <button key={id} className={sub[menu] === id ? 'active' : ''} onClick={() => setSub(x => ({ ...x, [menu]: id }))}>
            {label}{b ? <b>{b}</b> : null}</button>;
        })}
      </nav>}
      <main className="salon-main v2-main">
        {full || (menu === 'week' ? <WeekPage state={state} sub={sub.week} apply={apply} setState={setState} nav={nav} flash={flash} />
          : menu === 'museum' ? <MuseumPage state={state} sub={sub.museum} apply={apply} setState={setState} nav={nav} flash={flash} />
          : menu === 'acquire' ? <AcquirePage state={state} sub={sub.acquire} apply={apply} setState={setState} nav={nav} flash={flash} />
          : <OfficePage state={state} sub={sub.office} apply={apply} setState={setState} nav={nav} flash={flash} />)}
      </main>
      {!full && <nav className="salon-hubs" aria-label="Main">
        {(Object.keys(MENU_LABEL) as Menu[]).map(m => (
          <button key={m} className={menu === m ? 'active' : ''} onClick={() => nav.go(m)}>
            <MenuIcon m={m} />{MENU_LABEL[m]}{m === 'week' && weekBadge ? <b>{weekBadge}</b> : null}
          </button>))}
      </nav>}
      {skipSheet && (
        <div className="present" onClick={() => setSkipSheet(false)}>
          <div className="present-sheet" onClick={e => e.stopPropagation()}>
            <div className="kicker">Before you end the week</div>
            <h2>{W.expiringEvents(state).length} event{W.expiringEvents(state).length === 1 ? '' : 's'} still waiting</h2>
            {W.expiringEvents(state).map(e => <div key={e.id} className="v2-skiprow"><span>{e.title}</span><span>will be missed</span></div>)}
            <div className="actions">
              <button onClick={() => setSkipSheet(false)}>Go back</button>
              <button className="ghost" onClick={doEndWeek}>Skip &amp; end week</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
      {!presenting.length && moments.length > 0 && (
        <div className="v2-moment" onClick={() => setMoments(x => x.slice(1))} role="dialog" aria-label={moments[0].title}>
          <div className="v2-moment-card" key={moments[0].title}>
            <span className="v2-moment-burst" aria-hidden="true" />
            <div className="kicker">{moments[0].kind}</div>
            <h2>{moments[0].title}</h2>
            {moments[0].line && <p>{moments[0].line}</p>}
            <button onClick={e => { e.stopPropagation(); setMoments(x => x.slice(1)); }}>{moments.length > 1 ? 'Next' : 'Carry on'}</button>
          </div>
        </div>)}
      {presenting[0] === 'annual' && (state.annualReports || []).length > 0 &&
        <AnnualReportShow report={state.annualReports![state.annualReports!.length - 1]} onClose={() => setPresenting(p => p.slice(1))} />}
      {presenting[0] === 'review' && state.lastReview &&
        <ReviewShow review={state.lastReview} onClose={() => { setPresenting(p => p.slice(1)); nav.go('office', 'plan'); }} />}
    </div>
  );
}

function MenuIcon({ m }: { m: Menu }) {
  const p = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, 'aria-hidden': true } as const;
  if (m === 'week') return <svg {...p}><rect x="4" y="5" width="16" height="15" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>;
  if (m === 'museum') return <svg {...p}><path d="M3 10l9-6 9 6" /><path d="M5 10v9h14v-9" /><path d="M9 19v-5h6v5" /></svg>;
  if (m === 'acquire') return <svg {...p}><path d="M14 4l6 6-8 8-6-6z" /><path d="M4 20l5-5" /></svg>;
  return <svg {...p}><rect x="4" y="7" width="16" height="12" /><path d="M9 7V4h6v3" /></svg>;
}

/* --- moments: the big, rare news, one card at a time ------------ */
interface Moment { kind: string; title: string; line: string; }
function momentsBetween(a: GameState, b: GameState): Moment[] {
  const out: Moment[] = [];
  for (const st of Object.keys(b.knowledge || {}) as StyleId[]) {
    const was = a.knowledge?.[st] || 0, now = b.knowledge?.[st] || 0;
    if (now > was) out.push({ kind: 'Research complete', title: `${STYLES[st].name}: ${R.KNOWLEDGE_NAMES[now]}`, line: R.KNOWLEDGE_EFFECT[now] });
  }
  for (const t of R.thesesKnown(b)) if (!R.thesesKnown(a).includes(t))
    out.push({ kind: 'Research complete', title: `New thesis: ${THESES[t].name}`, line: 'Open a room and choose it from the thesis tiles.' });
  for (const t of R.digTiers(b)) if (!R.digTiers(a).includes(t) && t !== 'common')
    out.push({ kind: 'Research complete', title: R.DIG_RESEARCH[t].name, line: R.DIG_RESEARCH[t].blurb });
  for (const ms of (b.milestones || []).slice((a.milestones || []).length))
    out.push({ kind: 'Milestone', title: ms.text, line: '' });
  return out;
}
