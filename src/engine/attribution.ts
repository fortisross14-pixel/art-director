/* ============================================================
   ENGINE — ATTRIBUTION & SLEEPERS  ( src/engine/ )
   Some works surface with a doubtful attribution: "Circle of",
   "Workshop of", "Attributed to". They sell, draw and rate at a
   fraction of their catalogue strength until a study settles the
   question. A few are sleepers — the master's own hand — and a
   study turns them into the real thing overnight.

   Attribution is rolled per career, so the same work can be a
   sleeper in one career and confirmed in the next.
   ============================================================ */
import type { Artifact, AttributionLabel, GameState } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { livingArtifact } from './artistcore';

/** how much of the work's true strength shows while doubtful */
export const ATTRIBUTION_FACTOR: Record<AttributionLabel, number> = {
  confirmed: 1, attributed: 0.6, workshop: 0.3, circle: 0.12,
};
/** chance that a doubtful work is secretly the real thing */
const SLEEPER_ODDS: Record<Exclude<AttributionLabel, 'confirmed'>, number> = {
  attributed: 0.4, workshop: 0.2, circle: 0.1,
};

export const STUDY_WEEKS = 4;

/** a work can be doubtful if it is a known, named, non-iconic piece */
export function canBeDoubtful(art: Artifact): boolean {
  return art.score >= 20 && art.score < 200 && Number(art.id) <= 610;
}

/** Possibly give a work a doubtful attribution, the first time it
 *  surfaces this career. Mutates `s.attributions`. */
export function maybeDoubt(s: GameState, id: string, chance: number): void {
  const art = ARTIFACT_BY_ID[id];
  if (!art || !canBeDoubtful(art)) return;
  s.attributions = s.attributions || {};
  if (s.attributions[id] || Math.random() >= chance) return;
  const r = Math.random();
  const label: Exclude<AttributionLabel, 'confirmed'> =
    r < 0.4 ? 'attributed' : r < 0.75 ? 'workshop' : 'circle';
  s.attributions[id] = { label, sleeper: Math.random() < SLEEPER_ODDS[label], settled: false };
}

export function attributionOf(s: GameState, id: string): AttributionLabel {
  return s.attributions?.[id]?.label || 'confirmed';
}

export function isDoubtful(s: GameState, id: string): boolean {
  return attributionOf(s, id) !== 'confirmed';
}

/** "Circle of Caravaggio", "Workshop of an unknown master", ... */
export function attributionLine(s: GameState, id: string): string {
  const art = ARTIFACT_BY_ID[id];
  const label = attributionOf(s, id);
  if (label === 'confirmed') return art.author;
  const who = art.author === 'Unknown' ? 'an unknown master' : art.author;
  if (label === 'attributed') return `Attributed to ${who}`;
  if (label === 'workshop') return `Workshop of ${who}`;
  return `Circle of ${who}`;
}

/** The work as this career sees it: score and value scaled by any
 *  doubt over who made it. Every simulation path that cares about
 *  strength or price reads works through this. */
export function workOf(s: GameState, id: string): Artifact {
  // works by living artists are valued from the artist's reputation today
  const living = s.livingWorks?.[id] ? livingArtifact(s, id) : null;
  if (living) { ARTIFACT_BY_ID[id] = living; return living; }
  const art = ARTIFACT_BY_ID[id];
  const label = attributionOf(s, id);
  if (label === 'confirmed') return art;
  const f = ATTRIBUTION_FACTOR[label];
  return { ...art, score: Math.round(art.score * f), value: Math.round(art.value * f) };
}

export const effectiveScore = (s: GameState, id: string) => workOf(s, id).score;

/** cost of an attribution study: a fee plus a share of the stake */
export function studyCost(s: GameState, id: string): number {
  return Math.round(1500 + workOf(s, id).value * 0.05);
}
