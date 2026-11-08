/* ============================================================
   ENGINE — LIVING ARTISTS, CORE  ( src/engine/ )
   The rules of an artist's career and the works they make. Pure
   enough to be imported anywhere (no game.ts import): generation,
   how reputation becomes a score, making a new work, and the
   weekly drift of every career.

   A work by a living artist is stored in `s.livingWorks` and also
   registered in ARTIFACT_BY_ID so names and types resolve
   everywhere; its *score and value* are always computed fresh from
   the artist's current reputation (see workOf in attribution.ts).
   ============================================================ */
import type { Artifact, ArtType, GameState, LivingArtist, LivingWork, StyleId } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { STYLE_IDS } from '../data/constants';
import { pick, rand, randInt, uid } from './util';

/* --- reputation -> strength ---------------------------------- */
/** what a typical work is worth, by reputation: an unknown (10) makes
 *  Commons, a name (50) Rares, a star (75) Epics, a legend (85+) Legends */
export function artistScore(rep: number): number {
  return 2 * Math.exp(Math.max(0, rep) / 21);
}
export function valueForScore(score: number): number {
  return Math.round(220 * Math.pow(Math.max(1, score), 1.6));
}
export type ArtistStatusName = 'emerging' | 'rising' | 'established' | 'star' | 'fading' | 'deceased';
export function statusFor(a: LivingArtist): ArtistStatusName {
  if (!a.alive) return 'deceased';
  if (a.trend < -0.05 && a.age > 60) return 'fading';
  if (a.reputation >= 80) return 'star';
  if (a.reputation >= 55) return 'established';
  if (a.reputation >= 30 && a.trend > 0) return 'rising';
  return 'emerging';
}

/** the work as it stands today */
export function livingArtifact(s: GameState, id: string): Artifact | null {
  const w = s.livingWorks?.[id];
  if (!w) return null;
  const artist = (s.artists || []).find(a => a.id === w.artistId);
  const rep = artist ? artist.reputation : 10;
  const score = Math.max(1, Math.round(artistScore(rep) * w.quality));
  return {
    id, name: w.title, type: w.type, style: w.style,
    author: artist?.name || 'Unknown artist', year: w.year,
    description: `A ${w.type.toLowerCase()} by ${artist?.name || 'an artist'}, made in ${w.year}.`,
    score, value: valueForScore(score), image: '',
  };
}

/** make a living work resolvable by id everywhere (names, types, logs) */
export function registerLivingWork(s: GameState, id: string): void {
  const art = livingArtifact(s, id);
  if (art) ARTIFACT_BY_ID[id] = art;
}
export function registerAllLivingWorks(s: GameState): void {
  for (const id of Object.keys(s.livingWorks || {})) registerLivingWork(s, id);
}

/* --- generating artists -------------------------------------- */
const FIRST = ['Ilse', 'Tomás', 'Amara', 'Kenji', 'Noor', 'Lucien', 'Freya', 'Mateo', 'Yara', 'Oskar',
  'Leila', 'Dmitri', 'Saoirse', 'Kwame', 'Mei', 'Rafael', 'Ingrid', 'Arjun', 'Zofia', 'Emeka',
  'Camille', 'Hugo', 'Sun-hee', 'Bruno', 'Thandiwe', 'Aurelio', 'Hana', 'Felix', 'Marisol', 'Teodor'];
const LAST = ['Moreau', 'Okafor', 'Lindqvist', 'Tanaka', 'Haddad', 'Vasquez', 'Brennan', 'Kowalski',
  'Adeyemi', 'Rossi', 'Novak', 'Castellanos', 'Wren', 'Ishikawa', 'Mbeki', 'Duval', 'Petrova',
  'Sandoval', 'Achterberg', 'Ferreira', 'Laurent', 'Oyelowo', 'Halvorsen', 'Quintero', 'Szabo'];
const MODERN: StyleId[] = ['contemporary', 'modernism', 'popculture'];
const MEDIA: ArtType[] = ['Painting', 'Painting', 'Painting', 'Sculpture', 'Sculpture', 'Object', 'Manuscript'];

function rollPotential(): number {
  const r = Math.random();
  if (r < 0.55) return randInt(20, 45);
  if (r < 0.85) return randInt(45, 65);
  if (r < 0.97) return randInt(65, 85);
  return randInt(85, 98);
}

export function makeArtist(established = false): LivingArtist {
  const potential = rollPotential();
  const age = established ? randInt(48, 72) : randInt(22, 38);
  const reputation = established ? Math.min(potential, randInt(45, 78)) : Math.min(potential, randInt(8, 32));
  return {
    id: uid('artist'), name: `${pick(FIRST)} ${pick(LAST)}`,
    style: Math.random() < 0.65 ? pick(MODERN) : pick(STYLE_IDS),
    medium: pick(MEDIA), age, reputation, potential, trend: 0, alive: true,
    signed: null, scouted: null, prizes: 0, worksMade: 0, soloShows: 0,
  };
}

/** a fresh pool for a new career: mostly unknowns, a few names */
export function makeArtistPool(): LivingArtist[] {
  return [...Array.from({ length: 20 }, () => makeArtist(false)),
    ...Array.from({ length: 4 }, () => makeArtist(true))];
}

/* --- making work --------------------------------------------- */
const TITLE_A = ['Untitled', 'Study for', 'Fragment of', 'Elegy for', 'Portrait of', 'Map of', 'Notes on', 'Hymn to'];
const TITLE_B = ['a Burning City', 'the Flood', 'My Mother', 'Blue Field', 'the Night Shift', 'Lost Gardens',
  'the Harbour', 'Static', 'a Quiet Revolution', 'Salt', 'the Last Summer', 'Glass Weather', 'the Market'];
const MEDIUM_PREFIX: Record<ArtType, string> = {
  Painting: '', Sculpture: 'Figure: ', Object: 'Installation: ', Manuscript: "Artist's book: ",
};
export const careerYear = (week: number) => 2025 + Math.floor((week - 1) / 52);

/** a new work by an artist (not yet owned by anyone). Mutates `s`. */
export function createLivingWork(s: GameState, artistId: string, paid = 0): string | null {
  const artist = (s.artists || []).find(a => a.id === artistId);
  if (!artist || !artist.alive) return null;
  const id = uid('L');
  const a = pick(TITLE_A), b = pick(TITLE_B);
  const work: LivingWork = {
    id, artistId, type: artist.medium, style: artist.style,
    title: `${MEDIUM_PREFIX[artist.medium]}${a === 'Untitled' ? `Untitled (${b})` : `${a} ${b}`}`,
    year: String(careerYear(s.week)), quality: +rand(0.7, 1.35).toFixed(2),
    madeWeek: s.week, paid,
  };
  s.livingWorks = { ...(s.livingWorks || {}), [id]: work };
  s.artists = (s.artists || []).map(x => x.id === artistId ? { ...x, worksMade: x.worksMade + 1 } : x);
  registerLivingWork(s, id);
  return id;
}

/** what a commission from this artist costs today */
export function commissionPrice(a: LivingArtist): number {
  return Math.round(valueForScore(artistScore(a.reputation)) * 0.7 / 100) * 100;
}

/* --- the weekly career drift --------------------------------- */
export interface ArtistNews { artistId: string; text: string; kind: 'good' | 'bad' | 'note'; }

/** Advance every career by a week. `exposure` maps artist id -> how
 *  much their work is being seen (0..1) in the player's museum.
 *  Returns headline-worthy news. Mutates `s.artists`. */
export function artistWeek(s: GameState, exposure: Record<string, number>): ArtistNews[] {
  const news: ArtistNews[] = [];
  const aging = s.week % 52 === 0;
  s.artists = (s.artists || []).map(a0 => {
    const a = { ...a0 };
    if (!a.alive) return a;
    if (aging) a.age += 1;
    const ageFactor = a.age < 35 ? 1.2 : a.age < 55 ? 1 : a.age < 70 ? 0.5 : 0;
    let d = Math.max(0, a.potential - a.reputation) * 0.006 * ageFactor;
    if (a.age >= 70) d -= 0.02;
    d += (exposure[a.id] || 0) * 0.08;
    if (a.signed) d += 0.05;
    d += rand(-0.25, 0.25);
    // prizes and scandals
    if (Math.random() < 0.002 + a.reputation / 20000) {
      const jump = randInt(6, 12);
      d += jump; a.prizes += 1;
      news.push({ artistId: a.id, kind: 'good', text: `${a.name} wins a major art prize (+${jump} reputation).` });
    } else if (Math.random() < 0.001) {
      const drop = randInt(8, 15);
      d -= drop;
      news.push({ artistId: a.id, kind: 'bad', text: `Scandal: ${a.name} is dropped by their gallery (−${drop} reputation).` });
    }
    a.reputation = Math.max(0, Math.min(100, a.reputation + d));
    a.trend = d;
    if (a.signed) a.signed = a.signed.weeksLeft > 1 ? { ...a.signed, weeksLeft: a.signed.weeksLeft - 1 } : null;
    // death, late in life — and the legend grows
    if (a.age > 72 && Math.random() < 0.0006 * (a.age - 70)) {
      a.alive = false;
      a.reputation = Math.min(100, a.reputation + 8);
      a.signed = null;
      news.push({ artistId: a.id, kind: 'note', text: `${a.name} has died, aged ${a.age}. Their work is suddenly in demand.` });
    }
    return a;
  });
  // a few new names every year
  if (aging) s.artists = [...s.artists, ...Array.from({ length: 4 }, () => makeArtist(false))];
  return news;
}
