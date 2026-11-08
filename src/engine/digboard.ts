/* ============================================================
   ENGINE — EXPEDITION DIG BOARD  ( src/engine/ )
   A deduction dig. Under each tile: a RELIC (★, one card in the
   crate), FRAGMENTS (◈, four make a card), a HAZARD (✸), or earth.
   Every dug tile shows two numbers: gold = finds touching it, red =
   hazards touching it (diagonals count). Dig an untouched patch and
   the empty ground opens up for free. One SURVEY per dig marks what
   lies in a 3×3 area without digging. Shovels limit your digs;
   helmets are how many hazards you can survive. Bank any time.
   Pure logic — the UI owns timing and presentation.
   ============================================================ */
import type { ExpeditionTierDef } from '../data/constants';
import { randInt } from './util';

export type TileKind = 'bomb' | 'find' | 'empty';
export type FindKind = 'artifact' | 'shard';

export interface DigTile {
  kind: TileKind;
  findKind?: FindKind;
  shardAmount?: number;
  revealed: boolean;
  /** marked by a survey (seen but not dug) */
  surveyed?: boolean;
  /** finds / hazards in the 8 surrounding tiles */
  nearFinds: number;
  nearHazards: number;
}

export interface DigBoard {
  size: number;
  tiles: DigTile[];
  digsLeft: number;
  bombsHit: number;
  bombTolerance: number;
  artifactsFound: number;
  shardsBanked: number;
  surveysLeft: number;
  ejected: boolean;
  finished: boolean;
  /** tiles revealed by the last move, for the dig animation */
  lastRevealed: number[];
  started: boolean;
}

function neighbours(size: number, i: number): number[] {
  const r = Math.floor(i / size), c = i % size;
  const out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    if (!dr && !dc) continue;
    const rr = r + dr, cc = c + dc;
    if (rr >= 0 && rr < size && cc >= 0 && cc < size) out.push(rr * size + cc);
  }
  return out;
}

function withCounts(size: number, tiles: DigTile[]): DigTile[] {
  return tiles.map((t, i) => {
    const nb = neighbours(size, i);
    return {
      ...t,
      nearFinds: nb.filter(j => tiles[j].kind === 'find').length,
      nearHazards: nb.filter(j => tiles[j].kind === 'bomb').length,
    };
  });
}

/** Build a board for a tier. `bonusDigs` and `bonusTolerance` come
 *  from explorer staff. */
export function makeBoard(def: ExpeditionTierDef, bonusDigs = 0, bonusTolerance = 0): DigBoard {
  const size = def.gridSize;
  const n = size * size;
  const tiles: DigTile[] = Array.from({ length: n }, () => ({ kind: 'empty', revealed: false, nearFinds: 0, nearHazards: 0 }));
  const free = Array.from({ length: n }, (_, i) => i);
  for (let i = free.length - 1; i > 0; i--) { const j = randInt(0, i); [free[i], free[j]] = [free[j], free[i]]; }
  let p = 0;
  for (let b = 0; b < def.bombs; b++) tiles[free[p++]].kind = 'bomb';
  for (let a = 0; a < Math.max(1, def.artifacts); a++) {
    const t = tiles[free[p++]]; t.kind = 'find'; t.findKind = 'artifact';
  }
  for (let sc = 0; sc < def.shardTiles; sc++) {
    const t = tiles[free[p++]]; t.kind = 'find'; t.findKind = 'shard';
    t.shardAmount = randInt(2, def.id === 'epic' ? 5 : 4);
  }
  return {
    size, tiles: withCounts(size, tiles),
    digsLeft: def.digs + bonusDigs,
    bombsHit: 0, bombTolerance: def.bombTolerance + bonusTolerance,
    artifactsFound: 0, shardsBanked: 0, surveysLeft: 1,
    ejected: false, finished: false, lastRevealed: [], started: false,
  };
}

/** the first dig is never a hazard: move it somewhere else */
function safeFirst(board: DigBoard, i: number): DigBoard {
  if (board.started || board.tiles[i].kind !== 'bomb') return board;
  const tiles = board.tiles.map(t => ({ ...t }));
  const spot = tiles.findIndex((t, j) => j !== i && t.kind === 'empty');
  if (spot < 0) return board;
  tiles[spot].kind = 'bomb';
  tiles[i].kind = 'empty';
  return { ...board, tiles: withCounts(board.size, tiles) };
}

/** Dig a tile. Hazards cost a helmet; finds bank; empty ground with
 *  nothing nearby opens up around it for free. */
export function revealTile(board0: DigBoard, i: number): DigBoard {
  if (board0.finished || board0.digsLeft <= 0 || board0.tiles[i].revealed) return board0;
  const board = safeFirst(board0, i);
  const tiles = board.tiles.map(t => ({ ...t }));
  let { bombsHit, artifactsFound, shardsBanked } = board;
  const opened: number[] = [];
  const open = (j: number) => {
    const t = tiles[j];
    if (t.revealed) return;
    t.revealed = true; opened.push(j);
    if (t.kind === 'bomb') bombsHit++;
    else if (t.kind === 'find') {
      if (t.findKind === 'artifact') artifactsFound++; else shardsBanked += t.shardAmount || 0;
    }
  };
  open(i);
  // the free cascade: from a tile with nothing nearby, keep opening
  if (tiles[i].kind === 'empty' && tiles[i].nearFinds === 0 && tiles[i].nearHazards === 0) {
    const stack = [i];
    while (stack.length) {
      const j = stack.pop()!;
      for (const k of neighbours(board.size, j)) {
        if (tiles[k].revealed || tiles[k].kind !== 'empty') continue;
        open(k);
        if (tiles[k].nearFinds === 0 && tiles[k].nearHazards === 0) stack.push(k);
      }
    }
  }
  const digsLeft = board.digsLeft - 1;
  const ejected = bombsHit >= board.bombTolerance;
  return {
    ...board, tiles, digsLeft, bombsHit, artifactsFound, shardsBanked,
    ejected, finished: ejected || digsLeft <= 0, lastRevealed: opened, started: true,
  };
}

/** Survey a 3×3 area around a tile: marks what lies there, digs nothing. */
export function surveyArea(board: DigBoard, i: number): DigBoard {
  if (board.finished || board.surveysLeft <= 0) return board;
  const area = [i, ...neighbours(board.size, i)];
  const tiles = board.tiles.map((t, j) => area.includes(j) && !t.revealed ? { ...t, surveyed: true } : t);
  return { ...board, tiles, surveysLeft: board.surveysLeft - 1, lastRevealed: [] };
}

export function bankBoard(board: DigBoard): DigBoard {
  if (board.finished) return board;
  return { ...board, finished: true };
}

export function boardResult(board: DigBoard): { artifacts: number; shards: number } {
  if (board.ejected) return { artifacts: 0, shards: 0 };
  return { artifacts: board.artifactsFound, shards: board.shardsBanked };
}
