/* ============================================================
   ENGINE — ARTIST SETS  ( src/engine/ )
   Named collections built from the catalogue: every named artist
   with three or more works forms a set ("The Monet Set", 10
   works). Completing one is a career milestone and gives the
   museum lasting prestige while the set hangs together.
   ============================================================ */
import type { Artifact, GameState } from '../data/types';
import { ARTIFACTS } from '../data/artifacts';

export interface ArtistSet {
  id: string;          // 'artist:Claude Monet'
  name: string;        // 'The Monet Set'
  author: string;
  workIds: string[];
}

const GENERIC = /workshop|school|studio/i;

/** the name a set is known by: "Leonardo", "Rembrandt", "Goya", "Monet" */
function shortName(author: string): string {
  const parts = author.split(' ');
  if (/ (da|van) /i.test(author)) return parts[0];
  return parts[parts.length - 1];
}

export const ARTIST_SETS: ArtistSet[] = (() => {
  const byAuthor: Record<string, Artifact[]> = {};
  for (const a of ARTIFACTS) {
    if (a.author === 'Unknown' || GENERIC.test(a.author) || Number(a.id) > 610) continue;
    (byAuthor[a.author] = byAuthor[a.author] || []).push(a);
  }
  return Object.entries(byAuthor)
    .filter(([, works]) => works.length >= 3)
    .map(([author, works]) => ({
      id: 'artist:' + author,
      name: `The ${shortName(author)} Set`,
      author,
      workIds: works.sort((x, y) => x.score - y.score).map(w => w.id),
    }))
    .sort((a, b) => b.workIds.length - a.workIds.length);
})();

export const SET_BY_WORK: Record<string, ArtistSet> = Object.fromEntries(
  ARTIST_SETS.flatMap(set => set.workIds.map(id => [id, set])));

export function setProgress(s: GameState, set: ArtistSet): { owned: number; total: number } {
  const owned = new Set(s.owned);
  return { owned: set.workIds.filter(id => owned.has(id)).length, total: set.workIds.length };
}

/** sets whose every work is owned and on display somewhere */
export function displayedCompleteSets(s: GameState): ArtistSet[] {
  const shown = new Set(s.museums.filter(m => m.open).flatMap(m => m.rooms.flatMap(r => r.items)));
  return ARTIST_SETS.filter(set => set.workIds.every(id => shown.has(id)));
}
