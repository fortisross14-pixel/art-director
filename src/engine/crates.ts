/* ============================================================
   ENGINE — CRATES  ( src/engine/ )
   The pack-opening moment. Every luck-based channel (dig, estate
   lot, bequest) resolves as a crate of 1-6 face-down cards. This
   module holds the pure rolling rules: odds per tier, how a card
   is drawn, what bad pulls are worth as dust. game.ts wires crates
   into the career (creating, opening, keeping).
   ============================================================ */
import type { Artifact, CrateTier, StyleId } from '../data/types';
import { ARTIFACTS } from '../data/artifacts';
import { randInt } from './util';

export const CRATE_TIERS: CrateTier[] = ['field', 'major', 'legendary'];

export const CRATE_TIER_NAME: Record<CrateTier, string> = {
  field: 'Field', major: 'Major', legendary: 'Legendary',
};

/** odds, in %, of each band: Common, Uncommon, Rare, Epic, Legend+ */
export const CRATE_ODDS: Record<CrateTier, [number, number, number, number, number]> = {
  field: [70, 22, 7, 1, 0],
  major: [40, 30, 22, 7, 1],
  legendary: [15, 25, 35, 20, 5],
};
/** share of Legend+ pulls that are World Icons (legendary crates only) */
const WORLD_ICON_SHARE = 0.08;

/** dust a salvaged card is worth, by band (common .. world icon) */
export const DUST_VALUE = [2, 5, 15, 40, 120, 300];
export const REROLL_COST = 10;
export const UPGRADE_COST: Record<'field' | 'major', number> = { field: 30, major: 90 };
/** a Rare-or-better card is guaranteed at least every this many crates */
export const PITY_CRATES = 8;

export const BAND_NAMES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legend', 'World Icon'];

export function bandOf(score: number): number {
  if (score >= 200) return 5;
  if (score >= 100) return 4;
  if (score >= 50) return 3;
  if (score >= 20) return 2;
  if (score >= 10) return 1;
  return 0;
}

const BY_BAND: Artifact[][] = [0, 1, 2, 3, 4, 5].map(b =>
  ARTIFACTS.filter(a => bandOf(a.score) === b));

function rollBand(tier: CrateTier): number {
  const odds = CRATE_ODDS[tier];
  let r = Math.random() * 100;
  for (let b = 0; b < odds.length; b++) {
    r -= odds[b];
    if (r < 0) {
      if (b === 4 && tier === 'legendary' && Math.random() < WORLD_ICON_SHARE) return 5;
      return b;
    }
  }
  return 0;
}

/** Draw one work for a crate. Leans toward the crate's style, then
 *  the player's styles; falls back to lower bands if a band is
 *  exhausted. Never draws an id in `exclude`. */
export function rollCardId(
  tier: CrateTier, style: StyleId | null, prefer: StyleId[],
  exclude: Set<string>, minBand = 0,
): string | null {
  let band = Math.max(minBand, rollBand(tier));
  for (; band >= 0; band--) {
    const pool = BY_BAND[band].filter(a => !exclude.has(a.id));
    if (!pool.length) continue;
    const r = Math.random();
    const styled = style ? pool.filter(a => a.style === style) : [];
    const liked = pool.filter(a => prefer.includes(a.style));
    const from = styled.length && r < 0.6 ? styled
      : liked.length && r < 0.8 ? liked : pool;
    return from[randInt(0, from.length - 1)].id;
  }
  return null;
}

/** expected catalogue value of one card, used to price estate lots */
const BAND_MEDIAN_VALUE = [2500, 15000, 43000, 121000, 605000];
export function expectedCardValue(tier: CrateTier): number {
  return CRATE_ODDS[tier].reduce((n, p, b) => n + p / 100 * BAND_MEDIAN_VALUE[b], 0);
}

export const ESTATE_FAMILIES = [
  'Albescu', 'Hartigan', 'Moreau-Vasse', 'Oyelaran', 'Castellane', 'Lindqvist',
  'Okonkwo', 'Ferreira', 'Van Aalst', 'Delacourt', 'Brandt', 'Szabo',
];
export const BEQUEST_DONORS = [
  'Dame Imogen Hale', 'Mr. Teodor Wren', 'The late Mrs. Aditi Rao',
  'Professor Elias Mbeki', 'Count Anselm Roth', 'Mrs. Clara Whitcombe',
];
