/* ============================================================
   ENGINE — AUCTION ROOM  ( src/engine/ )
   A live sale with several paddles in the room.

   What you know: the catalogue ESTIMATE range (narrower when you
   know the style). What you don't: the work's real appraised VALUE,
   and how far each bidder will go. Most bidders stop somewhere
   around the value; some lose interest early (steals); now and
   then a collector is fixated and will go far past it; a telephone
   bidder may join late. A jump bid can scare the timid out.

   Flow per lot: intro (paused) → announcing a bid → counting 3-2-1
   → SOLD. Any bid restarts the count. All functions are pure.
   ============================================================ */
import type { AuctionBidder, AuctionState, GameState } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { rand, money, pick, randInt } from './util';
import { workOf } from './attribution';
import { rulesFor } from '../data/identity';
import { districtOfBuilding } from '../data/constants';

export const AUCTION_CFG = {
  stepMs: 1100,         // each countdown number is held this long
  announceMs: 900,      // a new bid is announced for this long
  countFrom: 3,         // count 3 -> 2 -> 1 -> sold
  hardCapMs: 60000,
};

const COLLECTORS = [
  'Mme. Valcourt', 'The Varga Foundation', 'Mr. Okonjo', 'A dealer in the second row',
  'Baroness Lindt', 'The Halvorsen Trust', 'Signor Bassi', 'Dr. Amara Chen',
];

/** round to a "nice" auction number */
function nice(n: number): number {
  const mag = Math.pow(10, Math.max(1, Math.floor(Math.log10(Math.max(10, n))) - 1));
  return Math.max(10, Math.round(n / mag) * mag);
}

/** A catalogue estimate for a lot, without the room: the midpoint
 *  of the estimate range (used by sims and previews). */
export function lotEstimate(artifactId: string, state?: GameState): number {
  const art = state ? workOf(state, artifactId) : ARTIFACT_BY_ID[artifactId];
  return Math.round(art.value * rand(0.85, 1.15));
}

/** the auction house's verdict on what you paid */
export function dealRating(paid: number, value: number): { label: string; tone: 'great' | 'good' | 'fair' | 'bad' } {
  const r = paid / Math.max(1, value);
  if (r <= 0.7) return { label: 'Steal!', tone: 'great' };
  if (r <= 0.9) return { label: 'Good buy', tone: 'good' };
  if (r <= 1.1) return { label: 'Fair price', tone: 'fair' };
  if (r <= 1.3) return { label: 'Paid up', tone: 'bad' };
  return { label: 'Overpaid', tone: 'bad' };
}

export function startLot(state: GameState, artifactId: string): AuctionState {
  const art = workOf(state, artifactId);
  // this sale's real appraisal: the catalogue value, give or take
  const value = Math.round(art.value * rand(0.88, 1.12));
  // the estimate is the house's guess; your expertise narrows the doubt
  const stars = state.expertise[art.style] || 0;
  const spread = Math.max(0.08, 0.32 - stars * 0.05);
  const centre = value * rand(1 - spread, 1 + spread);
  const estLow = nice(centre * 0.8);
  const estHigh = nice(centre * 1.2);

  const here = state.museums.find(m => m.id === state.activeMuseumId) || state.museums[0];
  const aggression = rulesFor(districtOfBuilding(here?.buildingId || 'local')?.id).rivalAggression;
  const score = art.score;
  const count = Math.min(4, 2 + (score >= 20 ? 1 : 0) + (Math.random() < 0.4 ? 1 : 0));
  const names = [...COLLECTORS].sort(() => Math.random() - 0.5);
  const bidders: AuctionBidder[] = [];
  // a cousin who collects this style comes in person
  const cousins = state.rivals.filter(r => r.style === art.style && (r.budget || 0) > value * 0.4);
  if (cousins.length) {
    const c = pick(cousins);
    bidders.push({ id: 'b-' + c.id, name: c.name, kind: 'cousin', cousinId: c.id, active: true, out: false,
      max: Math.round(Math.min((c.budget || 0) * 0.9, value * rand(0.8, 1.5) * aggression)) });
  }
  while (bidders.length < count) {
    const fixated = Math.random() < 0.14;
    const kind: AuctionBidder['kind'] = Math.random() < 0.3 ? 'dealer' : 'collector';
    // dealers want a margin; collectors pay for love
    const base = fixated ? rand(1.3, 1.9) : kind === 'dealer' ? rand(0.45, 0.95) : rand(0.55, 1.25);
    bidders.push({ id: 'b' + bidders.length, name: names[bidders.length] || 'A collector', kind,
      active: true, out: false, max: Math.round(value * base * aggression) });
  }
  // a telephone bidder may ring in partway through
  if (Math.random() < 0.25) {
    bidders.push({ id: 'phone', name: 'Telephone bidder', kind: 'phone', active: false, out: false,
      joinsAt: randInt(4000, 9000), max: Math.round(value * rand(0.9, 1.6) * aggression) });
  }
  const top = [...bidders].sort((a, b) => b.max - a.max)[0];
  const opening = nice(estLow * 0.4);
  return {
    artifactId, estimate: Math.round((estLow + estHigh) / 2),
    value, estLow, estHigh, bidders,
    currentBid: opening,
    leader: 'house', leaderId: null, nextBidderId: null,
    rivalCeiling: top ? top.max : 0,
    rivalName: top ? top.name : 'A collector',
    rivalId: top?.cousinId || null,
    increment: nice(Math.max(15, (estLow + estHigh) / 2 * 0.06)),
    mode: 'intro',
    count: AUCTION_CFG.countFrom,
    phaseMs: 0, elapsedMs: 0,
    rivalNextGap: 0, sinceCountStart: 0,
    over: false, won: null,
    message: `Estimate ${money(estLow)}–${money(estHigh)}. ${bidders.filter(b => b.active).length} paddles in the room.`,
  };
}

export function beginAuction(a: AuctionState): AuctionState {
  if (a.mode !== 'intro') return a;
  return { ...pickNext({ ...a }), mode: 'announcing', phaseMs: AUCTION_CFG.announceMs,
    message: `We open at ${money(a.currentBid)}. Who will start us?` };
}

/** roll who bids next this count (the quickest eager bidder), and when */
function pickNext(a: AuctionState): AuctionState {
  const next = a.currentBid + a.increment;
  let best: { id: string; at: number } | null = null;
  for (const b of a.bidders || []) {
    if (!b.active || b.out || b.id === a.leaderId || b.max < next) continue;
    // nearer their limit, they hesitate
    const room = (b.max - next) / Math.max(1, b.max);
    const hesitate = room < 0.08 ? rand(1400, 3000) : room < 0.2 ? rand(700, 2000) : rand(250, 1300);
    if (!best || hesitate < best.at) best = { id: b.id, at: hesitate };
  }
  return { ...a, nextBidderId: best?.id || null, rivalNextGap: best ? best.at : AUCTION_CFG.hardCapMs, sinceCountStart: 0 };
}

/** anyone priced out lowers their paddle */
function dropOuts(a: AuctionState): { a: AuctionState; quit: string[] } {
  const next = a.currentBid + a.increment;
  const quit: string[] = [];
  const bidders = (a.bidders || []).map(b => {
    if (b.active && !b.out && b.id !== a.leaderId && b.max < next) { quit.push(b.name); return { ...b, out: true }; }
    return b;
  });
  return { a: { ...a, bidders }, quit };
}

function applyBid(a: AuctionState, who: string, amount: number, note?: string): AuctionState {
  const bidder = a.bidders?.find(b => b.id === who);
  let n: AuctionState = {
    ...a, currentBid: amount,
    leader: who === 'player' ? 'player' : 'rival',
    leaderId: who,
    rivalName: bidder ? bidder.name : a.rivalName,
    rivalId: bidder ? bidder.cousinId || null : a.rivalId,
    bidders: (a.bidders || []).map(b => b.id === who ? { ...b, lastBidMs: 0 } : b),
    mode: 'announcing', phaseMs: AUCTION_CFG.announceMs, count: AUCTION_CFG.countFrom,
  };
  const d = dropOuts(n);
  n = d.a;
  const quitNote = d.quit.length ? ` ${d.quit.join(' and ')} ${d.quit.length > 1 ? 'lower their paddles' : 'lowers their paddle'}.` : '';
  n.message = (note || (who === 'player' ? `You bid ${money(amount)}.` : `${bidder?.name || 'A bidder'} bids ${money(amount)}.`)) + quitNote;
  return pickNext(n);
}

function closeLot(a: AuctionState): AuctionState {
  const playerWon = a.leader === 'player';
  return {
    ...a, over: true, won: playerWon,
    message: playerWon ? 'SOLD — to your museum!'
      : a.leader === 'rival' ? `SOLD — to ${a.rivalName}.` : 'The lot passed unsold.',
  };
}

/** Advance the room by deltaMs. Frozen in intro until begun. */
export function tickAuction(state: GameState, deltaMs: number): AuctionState | null {
  const a0 = state.auction;
  if (!a0 || a0.over || a0.mode === 'intro') return a0;
  const C = AUCTION_CFG;
  let n: AuctionState = {
    ...a0, elapsedMs: a0.elapsedMs + deltaMs,
    bidders: (a0.bidders || []).map(b => ({ ...b, lastBidMs: b.lastBidMs === undefined ? undefined : b.lastBidMs + deltaMs })),
  };
  if (n.elapsedMs >= C.hardCapMs) return closeLot(n);
  // the telephone rings
  const caller = n.bidders?.find(b => !b.active && !b.out && b.joinsAt !== undefined && n.elapsedMs >= b.joinsAt);
  if (caller) {
    n.bidders = n.bidders!.map(b => b.id === caller.id ? { ...b, active: true } : b);
    if (caller.max >= n.currentBid + n.increment) {
      n = pickNext(n);
      n.message = 'A telephone bidder has joined the room!';
    } else {
      n.bidders = n.bidders!.map(b => b.id === caller.id ? { ...b, out: true } : b);
    }
  }

  if (n.mode === 'announcing') {
    n.phaseMs -= deltaMs;
    if (n.phaseMs <= 0) {
      n.mode = 'counting'; n.count = C.countFrom; n.phaseMs = C.stepMs; n.sinceCountStart = 0;
      n = pickNext(n);
      n.message = n.leader === 'house' ? 'Do I hear an opening bid?' : `${money(n.currentBid)}… going once…`;
    }
    return n;
  }

  n.phaseMs -= deltaMs;
  n.sinceCountStart += deltaMs;
  if (n.nextBidderId && n.sinceCountStart >= n.rivalNextGap) {
    const amount = n.currentBid + n.increment;
    return applyBid(n, n.nextBidderId, amount);
  }
  if (n.phaseMs <= 0) {
    n.count -= 1;
    if (n.count <= 0) return closeLot(n);
    n.phaseMs = C.stepMs;
    n.message = `${money(n.currentBid)}… ${n.count === 2 ? 'going twice…' : 'last call…'}`;
  }
  return n;
}

/** Player bids: a normal raise, or a jump of three increments that
 *  can spook bidders who were near their limit. */
export function playerBid(state: GameState, jump = false): { auction: AuctionState | null; error?: string } {
  const a = state.auction;
  if (!a || a.over) return { auction: a };
  if (a.mode === 'intro') return { auction: a, error: 'Begin the auction first.' };
  if (a.leader === 'player') return { auction: a, error: 'You already hold the leading bid.' };
  const amount = a.currentBid + a.increment * (jump ? 3 : 1);
  if (amount > state.funds) return { auction: a, error: 'That bid would exceed your funds.' };
  let pre = a;
  let note: string | undefined;
  if (jump) {
    // a bold jump: the timid fold even if they could go higher
    const spooked: string[] = [];
    pre = { ...a, bidders: (a.bidders || []).map(b => {
      if (b.active && !b.out && b.kind !== 'phone' && b.max < amount * 1.35 && Math.random() < 0.55) {
        spooked.push(b.name); return { ...b, out: true };
      }
      return b;
    }) };
    note = `You jump to ${money(amount)}!` + (spooked.length ? ` ${spooked.join(' and ')} ${spooked.length > 1 ? 'fold' : 'folds'}.` : '');
  }
  return { auction: applyBid(pre, 'player', amount, note) };
}
