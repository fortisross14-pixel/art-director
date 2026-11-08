/* ============================================================
   ENGINE — SEASONS & THE CAREER ARC  ( src/engine/ )
   A year is four 13-week seasons. Each season the director sets a
   budget plan (how each week's surplus is split) and has a few
   initiatives to spend. When a season ends the game writes a
   review that explains what changed and why; when a year ends it
   writes the Annual Report, judges the museum's league position
   and may promote it: City -> National -> World. The three
   leagues are the three career stages (early, mid, late).

   Runs after advanceWeek (see sim.stepWeek).
   ============================================================ */
import type {
  AnnualReport, BudgetLine, BudgetPlan, CareerStage, GameState, League,
  SeasonReview, SeasonSnapshot,
} from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { BUILDINGS, STATIC_MUSEUMS, STYLES } from '../data/constants';
import {
  activeMuseum, atCapacity, budgetEffects, dailyVisitors, openMuseums,
  placedCount, totalFame, totalReputation, roomRatings,
  addIncome, createCrate, districtRules, emptyMix, fundingModel, maybeRaiseClaim,
} from './game';
import { BACKGROUNDS } from '../data/identity';
import { workOf } from './attribution';
import { bandOf, BAND_NAMES } from './crates';

export const SEASON_WEEKS = 13;
export const SEASON_NAMES = ['Spring', 'Summer', 'Autumn', 'Winter'];
export const BUDGET_LINES: BudgetLine[] = ['acquisitions', 'exhibitions', 'marketing', 'operations', 'reserves'];
export const BUDGET_NAMES: Record<BudgetLine, string> = {
  acquisitions: 'Acquisitions', exhibitions: 'Exhibitions & education',
  marketing: 'Marketing', operations: 'Operations', reserves: 'Endowment',
};
export const DEFAULT_PLAN: BudgetPlan = {
  acquisitions: 50, exhibitions: 15, marketing: 10, operations: 15, reserves: 10,
};
/** budget stocks fade by this share each week */
const STOCK_DECAY = 0.08;
/** the endowment pays this share of itself into funds each week */
const ENDOWMENT_YIELD = 0.0025;

export const LEAGUE_NAMES: Record<League, string> = {
  city: 'City League', national: 'National League', world: 'World League',
};
export const STAGE_FOR_LEAGUE: Record<League, CareerStage> = {
  city: 'early', national: 'mid', world: 'late',
};
export const STAGE_NAMES: Record<CareerStage, string> = {
  early: 'Early: fill the gallery', mid: 'Mid: expand and diversify', late: 'Late: compete with the world',
};
/** promotion at year end if the museum finishes this high */
const PROMOTE_AT: Record<League, number> = { city: 3, national: 3, world: 0 };

export const seasonIndexOfWeek = (week: number) => Math.floor((week - 1) / SEASON_WEEKS);
export const seasonLabel = (index: number) =>
  `${SEASON_NAMES[index % 4]}, Year ${Math.floor(index / 4) + 1}`;
export const weekOfSeason = (s: GameState) => ((s.week - 1) % SEASON_WEEKS) + 1;

export function initiativesFor(s: GameState): number {
  const bonus = s.background ? BACKGROUNDS[s.background].bonusInitiatives : 0;
  return Math.min(7, 2 + Math.floor(s.staff.length / 2) + bonus);
}

/** what arrives with each new season: grants, the artists' crate, claims */
function seasonStart(s: GameState): void {
  const m = activeMuseum(s);
  const grant = Math.round(totalReputation(s).prestige * districtRules(m).grantPerPrestige);
  if (grant > 0) {
    s.funds += grant;
    addIncome(s, 'grants', grant);
    s.log = [{ kind: 'good' as const, text: `Research grants this season: §${grant.toLocaleString()}.` }, ...s.log].slice(0, 60);
  }
  if (s.background === 'artist') {
    s.attributions = { ...(s.attributions || {}) };
    createCrate(s, 'studio', 'field', 3, s.specialties[0] || null, 'Gift crate from your artist friends');
  }
  maybeRaiseClaim(s);
}

/* --- leagues ------------------------------------------------ */
export interface LeagueRow { id: string; name: string; fame: number; you: boolean; cousin: boolean; }

export function leagueTable(s: GameState, league: League): LeagueRow[] {
  const statics = STATIC_MUSEUMS.filter(m =>
    league === 'city' ? m.inYourCity && (m.tier === 'local' || m.tier === 'regional')
    : league === 'national' ? m.tier === 'national' || m.tier === 'regional'
    : true);
  const rows: LeagueRow[] = [
    ...statics.map(m => ({ id: m.id, name: m.name, fame: m.fame, you: false, cousin: false })),
    ...s.rivals.map(r => ({ id: r.id, name: `${r.name}'s museum`, fame: r.fame, you: false, cousin: true })),
    { id: 'you', name: s.galleryName, fame: totalFame(s), you: true, cousin: false },
  ];
  return rows.sort((a, b) => b.fame - a.fame);
}
export function leagueRank(s: GameState, league?: League): number {
  return leagueTable(s, league || s.league || 'city').findIndex(r => r.you) + 1;
}
export function careerStage(s: GameState): CareerStage {
  return STAGE_FOR_LEAGUE[s.league || 'city'];
}

/* --- snapshots ---------------------------------------------- */
export function snapshot(s: GameState): SeasonSnapshot {
  const rep = totalReputation(s);
  return {
    week: s.week,
    dailyVisitors: Math.round(openMuseums(s).reduce((n, m) => n + dailyVisitors(s, m), 0)),
    prestige: Math.round(rep.prestige), popularity: Math.round(rep.popularity), patronage: Math.round(rep.patronage),
    funds: Math.round(s.funds),
    collectionValue: s.owned.reduce((n, id) => n + (ARTIFACT_BY_ID[id] ? workOf(s, id).value : 0), 0),
    rooms: openMuseums(s).reduce((n, m) => n + m.rooms.filter(r => r.unlocked).length, 0),
    works: openMuseums(s).reduce((n, m) => n + placedCount(s, m.id), 0),
    rank: leagueRank(s),
    league: s.league || 'city',
  };
}

/* --- starting a season -------------------------------------- */
function beginSeason(s: GameState, index: number, plan: BudgetPlan, yearStart?: SeasonSnapshot, ownedAtYearStart?: string[]): void {
  const snap = snapshot(s);
  const max = initiativesFor(s);
  s.season = {
    index, startWeek: s.week, plan: { ...plan },
    initiativesMax: max, initiativesLeft: max,
    start: snap, chronicle: [], planned: false,
    ownedAtStart: [...s.owned],
    yearStart: yearStart || snap,
    ownedAtYearStart: ownedAtYearStart || [...s.owned],
  };
}

/** Give a state its season, league and budget stocks if it has none
 *  (a new career, or a save from before seasons existed). */
export function ensureSeason(s: GameState): GameState {
  if (s.season || s.phase !== 'playing') return s;
  const next: GameState = { ...s };
  next.league = next.league || 'city';
  next.milestones = next.milestones || [];
  next.milestoneKeys = next.milestoneKeys || [];
  next.annualReports = next.annualReports || [];
  next.endowment = next.endowment || 0;
  // operations start fully funded, so a new museum isn't penalised
  const cap = BUILDINGS[activeMuseum(next).buildingId].capacity;
  next.stocks = next.stocks || { marketing: 0, exhibitions: 0, operations: cap * 25 };
  beginSeason(next, seasonIndexOfWeek(next.week), DEFAULT_PLAN);
  return next;
}

/** Set this season's budget plan. Values are normalised to 100%. */
export function setPlan(s: GameState, plan: Partial<BudgetPlan>): GameState {
  if (!s.season) return s;
  const merged = { ...s.season.plan, ...plan };
  const total = BUDGET_LINES.reduce((n, k) => n + Math.max(0, merged[k] || 0), 0) || 1;
  const norm = Object.fromEntries(BUDGET_LINES.map(k =>
    [k, Math.round(Math.max(0, merged[k] || 0) / total * 100)])) as BudgetPlan;
  return { ...s, season: { ...s.season, plan: norm, planned: true } };
}

/* --- the weekly budget flow --------------------------------- */
/** Split last week's operating surplus by the plan: acquisitions stay
 *  as cash; the other lines are spent into stocks or the endowment. */
function applyBudget(s: GameState): void {
  const plan = s.season?.plan || DEFAULT_PLAN;
  const st = { ...(s.stocks || { marketing: 0, exhibitions: 0, operations: 0 }) };
  for (const k of ['marketing', 'exhibitions', 'operations'] as const) st[k] *= 1 - STOCK_DECAY;
  const surplus = s.lastRevenue - s.lastExpenses;
  if (surplus > 0) {
    const part = (k: BudgetLine) => surplus * plan[k] / 100;
    st.marketing += part('marketing');
    st.exhibitions += part('exhibitions');
    st.operations += part('operations');
    s.endowment = (s.endowment || 0) + part('reserves');
    s.funds -= surplus - part('acquisitions');
  }
  const income = Math.round((s.endowment || 0) * ENDOWMENT_YIELD);
  s.funds += income;
  addIncome(s, 'endowment', income);
  s.stocks = st;
}

/* --- reviews ------------------------------------------------- */
const pct = (a: number, b: number) => a > 0 ? Math.round((b - a) / a * 100) : 0;

function buildReview(prev: GameState, s: GameState): SeasonReview {
  const season = prev.season!;
  const start = season.start;
  const end = snapshot(s);
  const causes: string[] = [];
  const d = end.dailyVisitors - start.dailyVisitors;
  causes.push(`Visitors ${start.dailyVisitors} → ${end.dailyVisitors}/day (${d >= 0 ? '+' : ''}${pct(start.dailyVisitors, end.dailyVisitors)}%).`);
  const fresh = s.owned.filter(id => !season.ownedAtStart.includes(id))
    .map(id => workOf(s, id)).sort((a, b) => b.score - a.score).slice(0, 2);
  for (const a of fresh)
    causes.push(`New: ${a.name} (${BAND_NAMES[bandOf(a.score)]}, draws about ${Math.round(4 + a.score * 0.85)}/day on the wall).`);
  const m = activeMuseum(s);
  const fx = budgetEffects(s, m);
  if (fx.marketing > 0.15) causes.push(`Marketing is adding about ${Math.round(25 * fx.marketing)}% to visitors.`);
  if (fx.exhibitions > 0.15) causes.push(`Exhibition spending lifts presentation by about ${Math.round(20 * fx.exhibitions)}%.`);
  if (fx.operations < 0.7) causes.push(`Under-funded operations are costing about ${Math.round(15 * (1 - fx.operations))}% of visitors.`);
  if (atCapacity(s, m)) causes.push(`${m.name} is full — visitors are being turned away.`);
  const rp = end.prestige - start.prestige, pp = end.popularity - start.popularity, tp = end.patronage - start.patronage;
  causes.push(`Reputation: prestige ${rp >= 0 ? '+' : ''}${rp}, popularity ${pp >= 0 ? '+' : ''}${pp}, patrons ${tp >= 0 ? '+' : ''}${tp}.`);
  if (end.rank !== start.rank && end.league === start.league)
    causes.push(`${LEAGUE_NAMES[end.league]}: #${start.rank} → #${end.rank}.`);

  let advice: string | null = null;
  const weak = m.rooms.filter(r => r.unlocked && r.items.length)
    .map(r => ({ r, q: roomRatings(s, r) })).sort((a, b) => a.q.visitorAppeal - b.q.visitorAppeal)[0];
  if (season.initiativesLeft > 0) advice = `You left ${season.initiativesLeft} initiative(s) unused.`;
  else if (atCapacity(s, m)) advice = 'The building is full: open rooms or move somewhere bigger.';
  else if (weak && weak.q.attractiveness < 45)
    advice = `Room ${weak.r.id + 1} (${weak.r.theme ? STYLES[weak.r.theme].name : 'unthemed'}) needs better presentation.`;
  else if (fx.operations < 0.7) advice = 'Raise the operations budget: visitors are having a worse day.';
  return { label: seasonLabel(season.index), start, end, causes, chronicle: [...season.chronicle], advice };
}

const QUOTES: Record<number, string[]> = {
  1: ['A brave start, if a thin one.', 'More storeroom than museum, for now.'],
  2: ['Promising, uneven, worth a detour.', 'A few fine things in search of a story.'],
  3: ['A museum that knows what it wants to be.', 'Small, scholarly, and sometimes lucky.'],
  4: ['Confident curation and works to match.', 'One of the city\'s essential visits.'],
  5: ['A world-class museum, full stop.', 'The kind of collection people cross oceans for.'],
};

function buildAnnualReport(prev: GameState, s: GameState): AnnualReport {
  const season = prev.season!;
  const year = Math.floor(season.index / 4) + 1;
  const end = snapshot(s);
  const newIds = s.owned.filter(id => !season.ownedAtYearStart.includes(id));
  const best = newIds.map(id => workOf(s, id)).sort((a, b) => b.score - a.score)[0];
  const disc = (s.discoveries || []).filter(x => x.week >= season.yearStart.week).map(x => x.artifactId);
  const rooms = openMuseums(s).flatMap(mu => mu.rooms.filter(r => r.unlocked && r.items.length)
    .map(r => ({ label: `${mu.name}, Room ${r.id + 1} (${r.theme ? STYLES[r.theme].name : 'mixed'})`, q: roomRatings(s, r) })));
  const topRoom = rooms.sort((a, b) => b.q.visitorAppeal - a.q.visitorAppeal)[0];
  const avg = rooms.length ? rooms.reduce((n, r) => n + (r.q.artQuality + r.q.attractiveness) / 2, 0) / rooms.length : 0;
  const stars = Math.max(1, Math.min(5, Math.round(avg / 18)));
  const quotes = QUOTES[stars];
  const league = s.league || 'city';
  const rank = leagueRank(s, league);
  const awards: string[] = [];
  if (rank === 1) awards.push(`Museum of the Year — ${LEAGUE_NAMES[league]}`);
  if (disc.length) awards.push('Discovery of the Year');
  if (best && bandOf(best.score) >= 3) awards.push('Acquisition of the Year');
  let promotedTo: League | null = null;
  if (league !== 'world' && rank <= PROMOTE_AT[league]) promotedTo = league === 'city' ? 'national' : 'world';
  return {
    year, start: season.yearStart, end,
    acquisitionOfYear: best?.id || null,
    discoveryOfYear: disc[0] || null,
    exhibitionOfYear: topRoom?.label || null,
    criticStars: stars,
    criticQuote: quotes[year % quotes.length],
    promotedTo, awards,
    stage: STAGE_FOR_LEAGUE[promotedTo || league],
    revenueMix: s.yearMix ? { ...s.yearMix } : undefined,
    fundingModel: fundingModel(s.yearMix),
  };
}

/* --- milestones ---------------------------------------------- */
function milestone(s: GameState, key: string, text: string): void {
  if ((s.milestoneKeys || []).includes(key)) return;
  s.milestoneKeys = [...(s.milestoneKeys || []), key];
  s.milestones = [...(s.milestones || []), { week: s.week, text }];
  s.log = [{ kind: 'good' as const, text: `Milestone: ${text}` }, ...s.log].slice(0, 60);
}

function checkMilestones(s: GameState): void {
  const perDay = openMuseums(s).reduce((n, m) => n + dailyVisitors(s, m), 0);
  for (const v of [100, 500, 1000, 2500])
    if (perDay >= v) milestone(s, 'visitors' + v, `${v.toLocaleString()} visitors a day`);
  const best = Math.max(0, ...s.owned.map(id => bandOf(workOf(s, id).score)));
  for (let b = 2; b <= best; b++) milestone(s, 'band' + b, `First ${BAND_NAMES[b]} in the collection`);
  if (s.museums.some(m => m.buildingId !== 'local')) milestone(s, 'move', 'Moved out of the Local Gallery');
  if ((s.completedSets || []).length) milestone(s, 'set', 'First artist set completed');
  if ((s.discoveries || []).length) milestone(s, 'discovery', 'First attribution discovery');
  for (const f of [100, 500, 1000, 2000])
    if (totalFame(s) >= f) milestone(s, 'fame' + f, `Reputation ${f.toLocaleString()}`);
}

/* --- the post-week step ------------------------------------- */
/** Runs after the week's simulation: the budget flow, milestones,
 *  and the season / year rollover. */
export function seasonStep(prev: GameState, s: GameState): GameState {
  if (!s.season) s = ensureSeason(s);
  if (!s.season) return s;
  const next: GameState = { ...s, log: [...s.log] };
  applyBudget(next);
  checkMilestones(next);
  const index = seasonIndexOfWeek(next.week);
  const cur = next.season!;
  if (index !== cur.index) {
    next.lastReview = buildReview({ ...prev, season: cur }, next);
    let yearStart = cur.yearStart, ownedAtYearStart = cur.ownedAtYearStart;
    if (index % 4 === 0) {
      const report = buildAnnualReport({ ...prev, season: cur }, next);
      next.annualReports = [...(next.annualReports || []), report];
      if (report.promotedTo) {
        next.league = report.promotedTo;
        milestone(next, 'league-' + report.promotedTo, `Promoted to the ${LEAGUE_NAMES[report.promotedTo]}`);
      }
      yearStart = snapshot(next);
      ownedAtYearStart = [...next.owned];
      next.yearMix = emptyMix();
    }
    beginSeason(next, index, cur.plan, yearStart, ownedAtYearStart);
    seasonStart(next);
  }
  return next;
}
