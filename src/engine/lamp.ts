/* ============================================================
   ENGINE — UNDER THE LAMP  ( src/engine/ )
   The black-market minigame. A dealer's work sits under a UV lamp
   on a 4×4 grid. Hidden in the grid are TELLS that follow from the
   work's true verdict:
     ✓ green   period-correct detail
     ◐ amber   later restoration
     ✕ red     modern material — forgery
     ⊛ blue    a stolen-art registry stamp
     ? violet  a hand that doesn't match the claimed artist
   You get a few scans. Then: buy, haggle (the dealer may walk),
   call it stolen (cheap if right, insulting if wrong), or walk.
   ============================================================ */
import type { BlackMarketOffer, Verdict } from './blackmarket';
import { randInt } from './util';

export type Tell = 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'none';
export const LAMP_CELLS = 16;

const RECIPE: Record<Verdict, Partial<Record<Tell, number>>> = {
  genuine:         { green: 5 },
  altered:         { green: 3, amber: 3 },
  misattributed:   { green: 2, amber: 1, violet: 3 },
  partial_forgery: { green: 3, red: 2, amber: 1 },
  full_forgery:    { green: 1, red: 5 },
  stolen:          { green: 4, blue: 2 },
};

export interface LampState {
  cells: Tell[];
  scanned: boolean[];
  scansLeft: number;
  price: number;
  patience: number;
  /** what happened: null while playing */
  result: null | 'bought' | 'walked' | 'dealer_left' | 'called_stolen';
  last: string;
}

export function makeLamp(offer: BlackMarketOffer, bonusScans = 0): LampState {
  const cells: Tell[] = Array(LAMP_CELLS).fill('none');
  const spots = Array.from({ length: LAMP_CELLS }, (_, i) => i).sort(() => Math.random() - 0.5);
  let p = 0;
  for (const [tell, n] of Object.entries(RECIPE[offer.verdict]) as [Tell, number][])
    for (let k = 0; k < n; k++) cells[spots[p++]] = tell;
  return {
    cells, scanned: Array(LAMP_CELLS).fill(false),
    scansLeft: 5 + bonusScans, price: offer.ask, patience: offer.patience,
    result: null, last: 'The dealer pulls the cloth away. You have a few minutes under the lamp.',
  };
}

export function scan(l: LampState, i: number): LampState {
  if (l.result || l.scansLeft <= 0 || l.scanned[i]) return l;
  const scanned = l.scanned.map((v, j) => v || j === i);
  return { ...l, scanned, scansLeft: l.scansLeft - 1, last: '' };
}

export function seen(l: LampState): Record<Tell, number> {
  const out: Record<Tell, number> = { green: 0, amber: 0, red: 0, blue: 0, violet: 0, none: 0 };
  l.cells.forEach((t, i) => { if (l.scanned[i]) out[t]++; });
  return out;
}

/** push the price down; each push tries the dealer's patience */
export function haggle(l: LampState, offer: BlackMarketOffer): LampState {
  if (l.result) return l;
  const s = seen(l);
  // evidence of trouble is leverage
  const leverage = 0.08 + (s.red + s.amber + s.violet) * 0.03;
  const cost = randInt(1, 2);
  const patience = l.patience - cost;
  if (patience <= 0) return { ...l, patience: 0, result: 'dealer_left', last: 'The dealer covers the work. "We are done here."' };
  const price = Math.max(Math.round(offer.ask * 0.45), Math.round(l.price * (1 - leverage)));
  return { ...l, price, patience, last: patience <= 2 ? '"My last offer. Truly."' : '"You drive a hard bargain."' };
}

export function walk(l: LampState): LampState {
  return { ...l, result: 'walked', last: 'You walk away. Some bargains are not bargains.' };
}

/** accuse the dealer of selling stolen goods */
export function callStolen(l: LampState, offer: BlackMarketOffer): LampState {
  if (offer.verdict === 'stolen')
    return { ...l, price: offer.stolenPrice, result: 'called_stolen', last: 'The dealer goes pale and drops the price to be rid of it.' };
  return { ...l, result: 'dealer_left', last: 'The dealer is insulted and leaves with the work.' };
}
