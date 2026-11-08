/* ============================================================
   ENGINE — TIME CONTROLS  ( src/engine/ )
   Advancing time without clicking through every quiet week.
   `simToNextOpportunity` runs weeks until something worth the
   director's attention happens, then stops and says why.
   ============================================================ */
import type { GameState } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { rarityForScore } from '../data/constants';
import { advanceWeek, expeditionsReady, unlockedHouses } from './game';
import { progressDirectorSystems } from './director';
import { seasonStep, seasonIndexOfWeek, seasonLabel } from './season';
import { retire, CAREER_YEARS } from './legacy';

/** one full week: the core sim, then the director systems */
export function stepWeek(s: GameState): GameState {
  if (s.phase !== 'playing') return s;
  const next = seasonStep(s, progressDirectorSystems(advanceWeek(s)));
  // a career lasts at most 35 years
  return next.week > CAREER_YEARS * 52 ? retire(next, 'limit') : next;
}

/** Run to the first week of the next season (the review is waiting). */
export function simToEndOfSeason(s: GameState): { state: GameState; weeks: number; reason: string } {
  const target = seasonIndexOfWeek(s.week) + 1;
  let cur = s;
  let weeks = 0;
  while (seasonIndexOfWeek(cur.week) < target && weeks < 14) { cur = stepWeek(cur); weeks++; }
  return { state: cur, weeks, reason: `${seasonLabel(target - 1)} is over — the season review is ready.` };
}

const RARE_PLUS = new Set(['rare', 'epic', 'legend', 'worldicon']);

/** Why this week deserves attention, or null if it's a quiet one. */
export function notableReason(prev: GameState, s: GameState): string | null {
  if (s.lastReview && s.lastReview !== prev.lastReview)
    return `${s.lastReview.label} is over — the season review is ready.`;
  for (const ev of s.events) {
    if (ev.headlineId) {
      const a = ARTIFACT_BY_ID[ev.headlineId];
      return `Headline lot at ${ev.house}: ${a.name} (${rarityForScore(a.score).name}).`;
    }
  }
  for (const ev of s.events) {
    for (const id of ev.lotIds) {
      const a = ARTIFACT_BY_ID[id];
      const band = rarityForScore(a.score).id;
      if (RARE_PLUS.has(band))
        return `A ${rarityForScore(a.score).name} lot is up at ${ev.house}: ${a.name}.`;
      if (band === 'uncommon' && s.specialties.includes(a.style))
        return `An Uncommon lot in your style is up at ${ev.house}: ${a.name}.`;
    }
  }
  if ((s.crates || []).length > (prev.crates || []).length)
    return 'A crate has arrived and is waiting to be opened.';
  if (s.market?.nextHeadline && !prev.market?.nextHeadline) {
    const a = ARTIFACT_BY_ID[s.market.nextHeadline.artifactId];
    return `Rumour: ${a.name} is expected at auction in a few weeks.`;
  }
  if ((s.studies || []).length < (prev.studies || []).length)
    return 'An attribution study has reported back.';
  if (expeditionsReady(s).length > expeditionsReady(prev).length)
    return 'An expedition has returned and is ready to play out.';
  if (s.funds < 0 && prev.funds >= 0) return 'Funds have gone negative.';
  if (unlockedHouses(s).length > unlockedHouses(prev).length)
    return 'Your reputation has opened a new auction house.';
  if (s.specialties.length > prev.specialties.length) return 'Research has completed.';
  return null;
}

/** Advance until something notable happens, or `maxWeeks` pass. */
export function simToNextOpportunity(
  s: GameState, maxWeeks = 13,
): { state: GameState; weeks: number; reason: string } {
  let cur = s;
  for (let w = 1; w <= maxWeeks; w++) {
    const next = stepWeek(cur);
    if (next.phase === 'ended') return { state: next, weeks: w, reason: 'Your career is over — welcome to the Hall of Fame.' };
    const reason = notableReason(cur, next);
    cur = next;
    if (reason) return { state: cur, weeks: w, reason };
  }
  return { state: cur, weeks: maxWeeks, reason: `${maxWeeks} quiet weeks passed.` };
}
