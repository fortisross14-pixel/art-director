/* ============================================================
   ENGINE — LEGACY & THE HALL OF FAME  ( src/engine/ )
   A career ends when the director retires or after 35 years. The
   finished museum is written into the Hall of Fame (kept in the
   browser, across every save slot) and joins the world of every
   later career as a rival institution.
   ============================================================ */
import type { CareerRecord, GameState, LegacyMuseum } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { districtOfBuilding, rarityForScore } from '../data/constants';
import { activeMuseum, museumTypeOf, totalFame, fundingModel } from './game';
import { workOf } from './attribution';
import { leagueRank, SEASON_WEEKS } from './season';
import { uid } from './util';

export const CAREER_YEARS = 35;
const HALL_KEY = 'museum-wars:hall-of-fame';

export const careerYears = (s: GameState) => Math.max(1, Math.ceil((s.week - 1) / (SEASON_WEEKS * 4)));

export function legacyScore(r: Omit<CareerRecord, 'legacyScore'>): number {
  const league = r.finalLeague === 'world' ? 1500 : r.finalLeague === 'national' ? 500 : 0;
  const top = r.finalLeague === 'world' && r.finalRank <= 10 ? 1000 : 0;
  return Math.round(r.peakFame * 2 + r.collectionValue / 5000 + r.awards * 50
    + r.setsCompleted * 100 + r.discoveries * 40 + league + top);
}

/** sum up a career for the Hall of Fame */
export function buildCareerRecord(s: GameState, reason: CareerRecord['reason']): CareerRecord {
  const owned = s.owned.filter(id => ARTIFACT_BY_ID[id]).map(id => workOf(s, id));
  const best = [...owned].sort((a, b) => b.value - a.value)[0];
  const reports = s.annualReports || [];
  const fameNow = totalFame(s);
  const base = {
    id: uid('career'),
    playerName: s.playerName, galleryName: s.galleryName,
    background: s.background || 'heir',
    district: districtOfBuilding(activeMuseum(s).buildingId)?.id || 'historic',
    museumType: museumTypeOf(s),
    focus: s.specialties[0] || 'renaissance',
    endedAt: Date.now(),
    years: careerYears(s),
    reason,
    peakDailyVisitors: Math.max(0, ...s.history.map(h => h.dailyVisitors), ...reports.map(r => r.end.dailyVisitors)),
    peakFame: Math.max(fameNow, ...s.history.map(h => h.fame)),
    finalFame: fameNow,
    finalLeague: s.league || 'city',
    finalRank: leagueRank(s),
    mostValuable: best ? { name: best.name, author: best.author, value: best.value, rarity: rarityForScore(best.score).name } : null,
    signature: s.signatureId ? ARTIFACT_BY_ID[s.signatureId]?.name || null : null,
    collectionValue: owned.reduce((n, a) => n + a.value, 0),
    worksOwned: owned.length,
    awards: reports.reduce((n, r) => n + r.awards.length, 0),
    discoveries: (s.discoveries || []).length,
    setsCompleted: (s.completedSets || []).length,
    bestCriticStars: Math.max(0, ...reports.map(r => r.criticStars)),
    fundingModel: fundingModel(reports[reports.length - 1]?.revenueMix || s.yearMix),
    milestones: (s.milestones || []).length,
  };
  return { ...base, legacyScore: legacyScore(base) };
}

/** end the career: the museum is written into history */
export function retire(s: GameState, reason: CareerRecord['reason'] = 'retired'): GameState {
  if (s.phase === 'ended') return s;
  const record = buildCareerRecord(s, reason);
  return {
    ...s, phase: 'ended', careerRecord: record, auction: null, activeEvent: null,
    log: [{ kind: 'good' as const, text: `${s.galleryName} enters the Hall of Fame after ${record.years} years.` }, ...s.log].slice(0, 60),
  };
}

/* --- the Hall of Fame (browser storage, across all slots) ---- */
export function loadHallOfFame(): CareerRecord[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(HALL_KEY) : null;
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}
export function saveToHallOfFame(record: CareerRecord): void {
  try {
    const list = loadHallOfFame().filter(r => r.id !== record.id);
    localStorage.setItem(HALL_KEY, JSON.stringify([...list, record]));
  } catch { /* storage unavailable: the record lives only in the save */ }
}

/** earlier careers as institutions in a new career's world */
export function legacyMuseumsFrom(records: CareerRecord[]): LegacyMuseum[] {
  return records.map(r => ({
    id: 'legacy:' + r.id,
    name: `${r.galleryName} (founded by ${r.playerName})`,
    fame: r.finalFame,
    league: r.finalLeague,
  }));
}

export interface HallRecords {
  topVisitors: CareerRecord | null;
  topFame: CareerRecord | null;
  longest: CareerRecord | null;
  mostValuable: CareerRecord | null;
  bestLegacy: CareerRecord | null;
}
export function hallRecords(list: CareerRecord[]): HallRecords {
  const top = (f: (r: CareerRecord) => number) => list.length ? [...list].sort((a, b) => f(b) - f(a))[0] : null;
  return {
    topVisitors: top(r => r.peakDailyVisitors),
    topFame: top(r => r.peakFame),
    longest: top(r => r.years),
    mostValuable: top(r => r.mostValuable?.value || 0),
    bestLegacy: top(r => r.legacyScore),
  };
}
