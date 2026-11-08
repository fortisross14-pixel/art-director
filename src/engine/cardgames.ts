/* ============================================================
   ENGINE — THE CARD GAMES  ( src/engine/ )
   Three short games that decide how new art comes in. Pure logic;
   each ends in a result the core game already understands.

   GALA (deckbuilder)  Your deck of conversation cards; the guest
     secretly loves (×2), tolerates (×1), ignores (×0) or resents
     (−1) each topic. Play 5 cards, discard three times, Wit doubles the
     next card. Reach the charm goal and the work is loaned to you.
   DIG (push your luck)  Three trenches of face-down layers: finds,
     plain earth and hazards. A second card of the same hazard
     collapses the trench and loses what it held; bank in time.
     The team always brings one piece home; every three fragments add another card to the crate.
   DEALER (bluff)  Six face-down evidence cards that follow from the
     work's hidden verdict. Flip three, then pay, counter or walk.
   ============================================================ */
import type { ExpeditionTier, GameState, SocietyMember } from '../data/types';
import type { ConverseTag } from '../data/gala';
import type { Guest } from './gala';
import type { BlackMarketOffer, PurchaseOutcome } from './blackmarket';
import { purchaseOutcome } from './blackmarket';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { rand } from './util';

const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/* ============================ GALA ============================ */
export type GalaTopic = ConverseTag | 'wit';
export const TOPIC_NAME: Record<GalaTopic, string> = {
  flattery: 'Flattery', scholarship: 'Academic chat', prestige: 'Name-drop', exclusivity: 'Rarity talk',
  publicity: 'Press buzz', commerce: 'Money talk', accessibility: 'Civic duty', history: 'Legacy', wit: 'Wit',
};
export interface GalaCard { id: number; topic: GalaTopic; val: number; }
export interface GalaGame {
  guestName: string;
  targetId: string;
  goal: number;
  deck: GalaCard[];
  hand: GalaCard[];
  taste: Record<GalaTopic, number>;
  known: Partial<Record<GalaTopic, number>>;
  charm: number;
  plays: number;
  discards: number;
  wit: boolean;
  last: { gain: number; line: string; wit: boolean } | null;
}

/** your conversation deck: a base set, plus cards your people and
 *  your background bring to the party */
export function galaDeck(s: GameState): GalaCard[] {
  const base: [GalaTopic, number][] = [
    ['flattery', 1], ['flattery', 2], ['flattery', 3], ['scholarship', 2], ['scholarship', 3],
    ['prestige', 2], ['prestige', 3], ['publicity', 2], ['commerce', 3], ['accessibility', 2],
    ['history', 2], ['history', 3], ['wit', 0], ['wit', 0],
  ];
  const bonus: Record<string, [GalaTopic, number]> = {
    academic: ['scholarship', 3], collector: ['prestige', 3], entrepreneur: ['commerce', 4],
    artist: ['flattery', 3], heir: ['history', 3],
  };
  if (s.background && bonus[s.background]) base.push(bonus[s.background]);
  for (const m of s.staff) {
    if (m.specialty === 'publicist') base.push(['publicity', 2 + m.skill]);
    if (m.role === 'researcher') base.push(['scholarship', 1 + m.skill]);
    if (m.role === 'curator' && m.specialty !== 'publicist') base.push(['history', 1 + m.skill]);
  }
  return base.map(([topic, val], i) => ({ id: i, topic, val }));
}

export const galaGoal = (score: number) => (score >= 50 ? 17 : score >= 20 ? 13 : 9);

/** start a conversation; a society member brings fixed tastes and what you already know */
export function startGala(s: GameState, guest: Guest, targetId: string, member?: SocietyMember): GalaGame {
  const taste = {} as Record<GalaTopic, number>;
  for (const t of Object.keys(TOPIC_NAME) as GalaTopic[]) {
    if (member && member.taste[t] !== undefined) { taste[t] = member.taste[t]; continue; }
    if (t === 'wit') { taste[t] = 1; continue; }
    taste[t] = guest.archetype.likes.includes(t as ConverseTag) ? 2
      : guest.archetype.dislikes.includes(t as ConverseTag) ? -1 : Math.random() < 0.65 ? 1 : 0;
  }
  const deck = shuffle(galaDeck(s));
  const art = ARTIFACT_BY_ID[targetId];
  return {
    guestName: guest.name, targetId, goal: galaGoal(art?.score || 0),
    deck: deck.slice(5), hand: deck.slice(0, 5), taste, known: { ...(member?.known || {}) } as GalaGame['known'],
    charm: 0, plays: 5, discards: 3, wit: false, last: null,
  };
}

export const galaOver = (g: GalaGame) => g.plays <= 0 || g.charm >= g.goal;

export function playCard(g: GalaGame, index: number): GalaGame {
  const c = g.hand[index];
  if (!c || galaOver(g)) return g;
  const draw = g.deck.slice(0, 1);
  const hand = [...g.hand.filter((_, i) => i !== index), ...draw];
  if (c.topic === 'wit')
    return { ...g, hand, deck: g.deck.slice(1), plays: g.plays - 1, wit: true, last: { gain: 0, line: 'A laugh. Your next card counts double.', wit: true } };
  const m = g.taste[c.topic];
  const gain = c.val * m * (g.wit && m > 0 ? 2 : 1);
  const line = m >= 2 ? 'Delighted!' : m === 1 ? 'A polite smile.' : m === 0 ? 'Her attention drifts…' : 'That gave offence.';
  return {
    ...g, hand, deck: g.deck.slice(1), plays: g.plays - 1, wit: false,
    known: { ...g.known, [c.topic]: m }, charm: Math.max(0, g.charm + gain),
    last: { gain, line: g.wit && m > 0 ? line + ' Wit doubles it!' : line, wit: false },
  };
}

export function discardCard(g: GalaGame, index: number): GalaGame {
  if (g.discards <= 0 || galaOver(g) || !g.hand[index]) return g;
  return { ...g, hand: [...g.hand.filter((_, i) => i !== index), ...g.deck.slice(0, 1)], deck: g.deck.slice(1), discards: g.discards - 1, last: null };
}

export function galaResult(g: GalaGame): { success: boolean; loanWeeks: number; weeklyFee: number } {
  const art = ARTIFACT_BY_ID[g.targetId];
  if (g.charm < g.goal) return { success: false, loanWeeks: 0, weeklyFee: 0 };
  const over = g.charm - g.goal;
  return {
    success: true, loanWeeks: Math.min(10, 4 + Math.floor(over / 2)),
    weeklyFee: Math.max(200, Math.round(art.value * 0.012 * (1 - Math.min(0.4, over * 0.05)))),
  };
}

/* ============================= DIG ============================ */
export interface DigLayer { name: string; kind: 'find' | 'earth' | 'hazard'; worth: number; }
export interface Trench { name: string; deck: DigLayer[]; layers: DigLayer[]; state: 'open' | 'banked' | 'collapsed'; }
export interface DigGame { trenches: Trench[]; digs: number; banked: number; helmets: number; }

const L = (name: string, kind: DigLayer['kind'], worth = 0): DigLayer => ({ name, kind, worth });
const TRENCH_NAMES = ['North trench', 'Temple steps', 'Old well', 'Burial mound', 'Market floor', 'Kiln yard'];

function trenchDeck(tier: ExpeditionTier): DigLayer[] {
  const finds: DigLayer[] = [L('Coin', 'find', 1), L('Coin', 'find', 1), L('Pottery', 'find', 1), L('Pottery', 'find', 1), L('Bead string', 'find', 1)];
  if (tier !== 'common') finds.push(L('Statuette', 'find', 2));
  if (tier === 'rare' || tier === 'epic') finds.push(L('Statuette', 'find', 2), L('Relic', 'find', 4));
  if (tier === 'epic') finds.push(L('Relic', 'find', 4), L('Gold mask', 'find', 6));
  const hazards = ['Flood', 'Cave-in', 'Scorpions'].flatMap(h => [L(h, 'hazard'), L(h, 'hazard')]);
  return shuffle([...finds, L('Earth', 'earth'), L('Earth', 'earth'), L('Earth', 'earth'), ...hazards]);
}

export function startDig(tier: ExpeditionTier, bonusDigs = 0, helmets = 0): DigGame {
  const digs = { common: 9, uncommon: 11, rare: 13, epic: 15 }[tier] + bonusDigs;
  const names = shuffle(TRENCH_NAMES).slice(0, 3);
  return { trenches: names.map(name => ({ name, deck: trenchDeck(tier), layers: [], state: 'open' })), digs, banked: 0, helmets };
}

export const trenchValue = (t: Trench) => t.layers.reduce((n, l) => n + l.worth, 0);

export function digDeeper(g: DigGame, i: number): { game: DigGame; event: 'find' | 'earth' | 'hazard' | 'collapse' | 'saved' | null; layer?: DigLayer } {
  const t = g.trenches[i];
  if (!t || t.state !== 'open' || g.digs <= 0 || !t.deck.length) return { game: g, event: null };
  const layer = t.deck[0];
  const repeat = layer.kind === 'hazard' && t.layers.some(l => l.name === layer.name);
  let helmets = g.helmets;
  let state: Trench['state'] = 'open';
  let event: 'find' | 'earth' | 'hazard' | 'collapse' | 'saved' = layer.kind;
  if (repeat && helmets > 0) { helmets -= 1; event = 'saved'; }
  else if (repeat) { state = 'collapsed'; event = 'collapse'; }
  const nt: Trench = { ...t, deck: t.deck.slice(1), layers: event === 'saved' ? t.layers : [...t.layers, layer], state };
  return { game: { ...g, digs: g.digs - 1, helmets, trenches: g.trenches.map((x, j) => (j === i ? nt : x)) }, event, layer };
}

export function bankTrench(g: DigGame, i: number): DigGame {
  const t = g.trenches[i];
  if (!t || t.state !== 'open' || !t.layers.length) return g;
  return { ...g, banked: g.banked + trenchValue(t), trenches: g.trenches.map((x, j) => (j === i ? { ...x, state: 'banked' } : x)) };
}

export const digOver = (g: DigGame) => g.digs <= 0 || g.trenches.every(t => t.state !== 'open' || !t.deck.length);
/** what the dig sends home: unbanked open trenches are banked at the end */
export function digResult(g: DigGame): { finds: number; shards: number; ejected: boolean } {
  const open = g.trenches.filter(t => t.state === 'open').reduce((n, t) => n + trenchValue(t), 0);
  return { finds: 1, shards: g.banked + open, ejected: false };
}

/* =========================== DEALER =========================== */
export type Evidence = 'ok' | 'restored' | 'fake' | 'odd' | 'gap' | 'stolen';
export const EVIDENCE_NAMES = ['Signature', 'Canvas', 'Pigment', 'Frame', 'Provenance', 'Registry'];
const EVIDENCE_BY_VERDICT: Record<string, Evidence[]> = {
  genuine:         ['ok', 'ok', 'ok', 'ok', 'ok', 'ok'],
  altered:         ['ok', 'restored', 'restored', 'ok', 'ok', 'ok'],
  misattributed:   ['odd', 'ok', 'ok', 'ok', 'gap', 'ok'],
  partial_forgery: ['ok', 'fake', 'fake', 'ok', 'gap', 'ok'],
  full_forgery:    ['fake', 'fake', 'fake', 'ok', 'fake', 'ok'],
  stolen:          ['ok', 'ok', 'ok', 'ok', 'gap', 'stolen'],
};

export interface DealerGame {
  offer: BlackMarketOffer;
  cards: { name: string; ev: Evidence; up: boolean }[];
  flips: number;
  price: number;
  countered: boolean;
  line: string;
  result: null | 'paid' | 'walked' | 'gone';
}

export function startDealer(offer: BlackMarketOffer, bonusFlips = 0): DealerGame {
  const ev = EVIDENCE_BY_VERDICT[offer.verdict] || EVIDENCE_BY_VERDICT.genuine;
  return {
    offer, cards: EVIDENCE_NAMES.map((name, i) => ({ name, ev: ev[i], up: false })),
    flips: 3 + bonusFlips, price: offer.ask, countered: false,
    line: '“Look all you like. The price stays.”', result: null,
  };
}

export function flipEvidence(g: DealerGame, i: number): DealerGame {
  if (g.result || g.flips <= 0 || g.cards[i]?.up) return g;
  return { ...g, flips: g.flips - 1, cards: g.cards.map((c, j) => (j === i ? { ...c, up: true } : c)) };
}

export const warningSigns = (g: DealerGame) => g.cards.filter(c => c.up && c.ev !== 'ok').length;

/** push back: evidence on the table makes him fold; a bluff may not */
export function counterOffer(g: DealerGame): DealerGame {
  if (g.result || g.countered) return g;
  if (g.cards.some(c => c.up && c.ev === 'stolen'))
    return { ...g, countered: true, price: g.offer.stolenPrice, line: '“…Keep your voice down. Take it, cheap.”' };
  const bad = warningSigns(g);
  if (Math.random() < (bad ? 0.85 : 0.35))
    return { ...g, countered: true, price: Math.round(g.price * rand(0.65, 0.75)), line: bad ? '“Fine. You have seen too much.”' : '“You drive a hard bargain.”' };
  return { ...g, result: 'gone', line: '“Then we are done here.”' };
}

export function payDealer(g: DealerGame): { game: DealerGame; outcome: PurchaseOutcome } {
  const outcome = purchaseOutcome(g.offer, g.price);
  return { game: { ...g, result: 'paid', cards: g.cards.map(c => ({ ...c, up: true })) }, outcome: { ...outcome, pricePaid: g.price } };
}

export const walkAway = (g: DealerGame): DealerGame => ({ ...g, result: 'walked', cards: g.cards.map(c => ({ ...c, up: true })) });
