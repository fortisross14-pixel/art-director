/* ============================================================
   ENGINE — SOCIETY  ( src/engine/ )
   The same dozen collectors turn up at galas year after year.
   Each has fixed tastes; what you learn talking to them is kept,
   so the second conversation starts where the first left off.
   ============================================================ */
import type { GameState, SocietyMember, StyleId } from '../data/types';
import { ARTIFACTS } from '../data/artifacts';
import { GUEST_ARCHETYPES } from '../data/gala';
import type { ConverseTag } from '../data/gala';
import type { Guest } from './gala';
import type { GalaGame } from './cardgames';
import { randInt } from './util';

const NAMES = [
  'Lady Ashcombe', 'Baron Veil', 'Mme. Toussaint', 'Sir Roderick Quayle', 'Contessa Bellandi',
  'Mr. Augustus Frame', 'Dowager Hesketh', 'Don Ramiro Salas', 'Mrs. Edith Calloway',
  'Herr Direktor Brandt', 'Ms. Ottoline Reyes', 'Lord Peverell', 'Signora Vanni', 'Dr. Haruki Ota',
];
const TOPICS = ['flattery', 'scholarship', 'prestige', 'exclusivity', 'publicity', 'commerce', 'accessibility', 'history'];

function worksFor(styles: StyleId[], taken: Set<string>, count: number): string[] {
  const out: string[] = [];
  for (let k = 0; k < count; k++) {
    const bias = styles.length && Math.random() < 0.6 ? styles[randInt(0, styles.length - 1)] : null;
    let pool = ARTIFACTS.filter(a => a.score >= 10 && a.score < 200 && !taken.has(a.id) && (!bias || a.style === bias));
    if (!pool.length) pool = ARTIFACTS.filter(a => a.score >= 10 && a.score < 200 && !taken.has(a.id));
    if (!pool.length) break;
    const pick = pool[randInt(0, pool.length - 1)];
    out.push(pick.id); taken.add(pick.id);
  }
  return out;
}

function makeMember(i: number, styles: StyleId[], taken: Set<string>): SocietyMember {
  const archetype = randInt(0, GUEST_ARCHETYPES.length - 1);
  const arch = GUEST_ARCHETYPES[archetype];
  const taste: Record<string, number> = { wit: 1 };
  for (const t of TOPICS)
    taste[t] = arch.likes.includes(t as ConverseTag) ? 2 : arch.dislikes.includes(t as ConverseTag) ? -1 : Math.random() < 0.65 ? 1 : 0;
  return { id: 'soc' + i, name: NAMES[i % NAMES.length], archetype, taste, known: {}, met: 0, collection: worksFor(styles, taken, randInt(2, 3)) };
}

/** the city's collectors, created the first time you need them */
export function ensureSociety(s: GameState): SocietyMember[] {
  if (s.society?.length) return s.society;
  const taken = new Set(s.owned);
  return NAMES.map((_, i) => makeMember(i, s.specialties, taken));
}

/** who turns up tonight: a familiar face or two, and someone new */
export function galaGuests(s: GameState): SocietyMember[] {
  const all = ensureSociety(s).filter(m => m.collection.length);
  const met = all.filter(m => m.met > 0).sort(() => Math.random() - 0.5);
  const fresh = all.filter(m => m.met === 0).sort(() => Math.random() - 0.5);
  const out = [...met.slice(0, fresh.length ? 2 : 3), ...fresh.slice(0, 2)];
  for (const m of all) if (out.length < 3 && !out.includes(m)) out.push(m);
  return out.slice(0, 4).sort(() => Math.random() - 0.5);
}

/** a society member, seen as a gala guest */
export function asGuest(m: SocietyMember): Guest {
  return { id: m.id, name: m.name, archetype: GUEST_ARCHETYPES[m.archetype], collection: [...m.collection] };
}

/** how much you know about someone, 0..8 topics */
export const knownCount = (m: SocietyMember) => Object.keys(m.known).filter(k => k !== 'wit').length;

/** write back what the evening taught you; a lender parts with the work */
export function recordGala(s: GameState, memberId: string, g: GalaGame, lent: boolean): GameState {
  const society = ensureSociety(s).map(m => {
    if (m.id !== memberId) return m;
    let collection = m.collection;
    if (lent) {
      collection = collection.filter(id => id !== g.targetId);
      // collectors keep buying: now and then a new piece replaces the old
      if (collection.length < 2) collection = [...collection, ...worksFor(s.specialties, new Set([...s.owned, ...collection]), 1)];
    }
    return { ...m, known: { ...m.known, ...g.known }, met: m.met + 1, lent: (m.lent || 0) + (lent ? 1 : 0), collection };
  });
  return { ...s, society };
}
