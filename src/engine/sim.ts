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

/** one full week: the core sim, then the director systems */
export function stepWeek(s: GameState): GameState {
  return progressDirectorSystems(advanceWeek(s));
}

const RARE_PLUS = new Set(['rare', 'epic', 'legend', 'worldicon']);

/** Why this week deserves attention, or null if it's a quiet one. */
export function notableReason(prev: GameState, s: GameState): string | null {
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
    const reason = notableReason(cur, next);
    cur = next;
    if (reason) return { state: cur, weeks: w, reason };
  }
  return { state: cur, weeks: maxWeeks, reason: `${maxWeeks} quiet weeks passed.` };
}
