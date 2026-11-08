/* ============================================================
   BALANCE SIM — `npm run sim [weeks] [runs]`
   Plays the game headless with a simple "sensible director"
   strategy and prints how a career unfolds, so tuning changes
   can be checked against the milestone targets in
   GAME_DIRECTION.md without clicking through hundreds of weeks.
   ============================================================ */
import type { Background, GameState, StyleId } from '../src/data/types';
import * as E from '../src/engine/game';
import * as Auc from '../src/engine/auction';
import { stepWeek } from '../src/engine/sim';
import { ensureSeason, leagueRank } from '../src/engine/season';
import { ARTIFACT_BY_ID } from '../src/data/artifacts';
import { randInt } from '../src/engine/util';
import { AUCTION_HOUSES, BUILDINGS, START, rarityForScore } from '../src/data/constants';

const WEEKS = Number(process.argv[2] || 104);
const RUNS = Number(process.argv[3] || 5);
/** optional archetype: npm run sim 260 3 downtown entrepreneur contemporary */
const DISTRICT = process.argv[4] || 'historic';
const BACKGROUND = (process.argv[5] || 'heir') as Background;
const STYLE = (process.argv[6] || 'renaissance') as StyleId;

/** keep enough cash for this many weeks of upkeep */
const RESERVE_WEEKS = 6;

function unplaced(s: GameState): string[] {
  const placed = new Set(s.museums.flatMap(m => m.rooms.flatMap(r => r.items)));
  return s.owned.filter(id => !placed.has(id) && !s.salvageOnly.includes(id));
}

function hasWall(s: GameState, style: string): boolean {
  const mus = E.activeMuseum(s);
  const waiting = unplaced(s).filter(id => ARTIFACT_BY_ID[id].style === style).length;
  const free = mus.rooms.filter(r => r.unlocked && r.theme === style)
    .reduce((n, r) => n + (5 - r.items.length), 0);
  const canOpen = mus.rooms.some(r => !r.unlocked)
    && s.funds > START.roomCost + s.lastExpenses * RESERVE_WEEKS;
  return free - waiting > 0 || canOpen;
}

function weakestShown(s: GameState, style: string): number {
  const shown = E.activeMuseum(s).rooms.flatMap(r => r.items)
    .map(id => ARTIFACT_BY_ID[id]).filter(a => a.style === style);
  return shown.length ? Math.min(...shown.map(a => a.score)) : 0;
}

/** swap stored works in for weaker ones on the wall, and sell what
 *  will never hang again */
function rotate(s: GameState): GameState {
  for (const id of unplaced(s)) {
    const art = ARTIFACT_BY_ID[id];
    const mus = E.activeMuseum(s);
    const room = mus.rooms.find(r => r.theme === art.style && r.items.length >= 5);
    if (room) {
      const weakest = [...room.items].sort((x, y) => ARTIFACT_BY_ID[x].score - ARTIFACT_BY_ID[y].score)[0];
      if (ARTIFACT_BY_ID[weakest].score < art.score) {
        s = E.removeArtifact(s, weakest).state;
        s = E.placeArtifact({ ...s, pendingItemId: id }, room.id).state;
        s = E.quickSellArtifact(s, weakest).state;
        continue;
      }
    }
    if (!s.specialties.includes(art.style)) s = E.quickSellArtifact(s, id).state;
  }
  return s;
}

/** move to the next building once this one is full and the move is affordable */
function maybeMove(s: GameState): GameState {
  const target = E.nextBuilding(s);
  if (!target || !E.atCapacity(s)) return s;
  const b = BUILDINGS[target];
  if (s.funds < b.moveCost + b.maintenance * 10) return s;
  return E.moveToBuilding(s, target).state;
}

function hangEverything(s: GameState): GameState {
  for (const id of unplaced(s)) {
    const art = ARTIFACT_BY_ID[id];
    const mus = E.activeMuseum(s);
    // prefer a room of the work's own style, else any room with space
    let room = mus.rooms.find(r => E.canPlace(r, art.style) && r.theme === art.style)
      || mus.rooms.find(r => E.canPlace(r, art.style));
    if (!room) {
      // open and theme a new room when it's affordable
      const reserve = s.lastExpenses * RESERVE_WEEKS;
      if (s.funds - START.roomCost < reserve) continue;
      const opened = E.openRoom(s);
      if (opened.error) continue;
      s = opened.state;
      const fresh = E.activeMuseum(s).rooms.find(r => r.unlocked && !r.theme);
      if (!fresh) continue;
      const style = s.specialties.includes(art.style) ? art.style : s.specialties[0];
      s = E.assignRoom(s, fresh.id, style).state;
      room = E.activeMuseum(s).rooms.find(r => r.id === fresh.id);
      if (!room) continue;
    }
    s = E.placeArtifact({ ...s, pendingItemId: id }, room.id).state;
  }
  return { ...s, pendingItemId: null };
}

/** Attend every sale and bid on lots worth having, resolving each
 *  lot instantly: we win if our limit beats the rival's ceiling. */
function shop(s: GameState): GameState {
  for (const ev of [...s.events]) {
    const res = E.attendEvent(s, ev.id);
    if (res.error) continue;
    s = res.state;
    for (let i = 0; i < ev.lotIds.length; i++) {
      const id = ev.lotIds[i];
      const art = ARTIFACT_BY_ID[id];
      s = { ...s, auction: Auc.startLot(s, id), activeEvent: { ...s.activeEvent!, lotIndex: i } };
      const a = s.auction!;
      const reserve = Math.max(s.lastExpenses, 1800) * RESERVE_WEEKS;
      const inStyle = s.specialties.includes(art.style);
      // a sensible director only buys what will hang: a free wall, a
      // room they can afford to open, or an upgrade on the weakest work
      const useful = inStyle && (hasWall(s, art.style) || art.score > weakestShown(s, art.style) + 4);
      const limit = useful ? Math.min(s.funds - reserve, a.estimate * 1.2) : 0;
      const wins = limit > a.rivalCeiling && limit > a.currentBid;
      const price = Math.max(a.currentBid, Math.min(limit, a.rivalCeiling + a.increment));
      s = E.finishLot({
        ...s,
        auction: { ...a, over: true, won: wins, currentBid: wins ? price : a.rivalCeiling,
          leader: wins ? 'player' : 'rival' },
      });
    }
    s = E.leaveAuction(s);
  }
  return s;
}

/** buy affordable estate lots now and then, and open every crate */
function crates(s: GameState, stats: { crates: number; bigPulls: number }): GameState {
  const offer = s.estateOffer;
  if (offer && s.funds > offer.price + s.lastExpenses * RESERVE_WEEKS * 2 && Math.random() < 0.5)
    s = E.buyEstate(s).state;
  for (const c of [...(s.crates || [])]) {
    for (let i = 0; i < c.cards.length; i++) s = E.revealCard(s, c.id, i).state;
    for (const card of c.cards) if (ARTIFACT_BY_ID[card.artifactId].score >= 50) stats.bigPulls++;
    s = E.finishCrate(s, c.id).state;
    stats.crates++;
  }
  return s;
}

/** play the museum type's channel: digs for archaeology, sponsors for everyone */
function channels(s: GameState): GameState {
  const m = E.activeMuseum(s);
  if (E.canSponsor(s, m.id, 'building', null).ok) {
    const firm = E.availableFirms(s, m.id)[0];
    if (firm) s = E.courtSponsor(s, m.id, 'building', null, 52, firm).state;
  }
  // resolve returned digs with a plausible board result
  for (const exp of E.expeditionsReady(s)) {
    const ejected = Math.random() < 0.15;
    s = E.resolveExpedition(s, exp.id, { finds: randInt(0, 2), shards: randInt(4, 14), ejected }).state;
  }
  if (E.museumTypeOf(s) === 'archaeological' && E.expeditionsActive(s).length === 0) {
    const tier = s.funds > 400000 ? 'epic' : s.funds > 200000 ? 'rare' : s.funds > 80000 ? 'uncommon' : 'common';
    if (s.funds > E.expeditionCost(s, tier) + s.lastExpenses * RESERVE_WEEKS)
      s = E.commissionExpedition(s, tier, s.specialties[0], null).state;
  }
  return s;
}

function manage(s: GameState): GameState {
  s = channels(s);
  if (E.canStudioVisit(s)) s = E.studioVisit(s).state;
  if (s.claim) s = E.answerClaim(s, Math.random() < 0.5).state;
  // fair ticket price for the current crowd
  s = E.setTicket(s, Math.round(E.fairTicket(E.activeMuseum(s))));
  // join houses as soon as reputation opens them
  for (const h of AUCTION_HOUSES)
    if (!s.joinedHouses.includes(h.id) && E.totalFame(s) >= h.fameToUnlock)
      s = E.joinHouse(s, h.id).state;
  // modest presentation upgrades when cash is comfortable
  for (const room of E.activeMuseum(s).rooms.filter(r => r.unlocked && r.items.length)) {
    for (const kind of ['interpretation', 'decoration', 'amenities'] as const) {
      const cost = E.roomUpgradeCost(room, kind);
      if ((room[kind] || 0) < 3 && s.funds > cost * 6 + s.lastExpenses * RESERVE_WEEKS)
        s = E.upgradeRoom(s, room.id, kind).state;
    }
  }
  return s;
}

interface RunSummary { reached: Record<string, number | null>; final: string; lines: string[]; }

function run(verbose: boolean): RunSummary {
  let s = E.newGame();
  const choices = E.foundingArtworkChoices();
  s = E.foundMuseum(s, BACKGROUND, DISTRICT, STYLE, choices[0], choices);
  s = ensureSeason(E.nameGallery(s, 'Sim', 'Sim Gallery', START.defaultTicket));
  const reached: Record<string, number | null> = { house2: null, house3: null, firstRare: null, firstEpic: null, national: null, world: null };
  const lines: string[] = [];
  let rarePlusLots = 0;
  const crateStats = { crates: 0, bigPulls: 0 };
  for (let w = 1; w <= WEEKS; w++) {
    for (const ev of s.events) for (const id of ev.lotIds)
      if (ARTIFACT_BY_ID[id].score >= 20) rarePlusLots++;
    s = shop(s);
    s = crates(s, crateStats);
    s = hangEverything(s);
    s = rotate(s);
    s = maybeMove(s);
    s = hangEverything(s);
    s = manage(s);
    s = stepWeek(s);
    const fame = E.totalFame(s);
    if (reached.house2 === null && fame >= 120) reached.house2 = w;
    if (reached.house3 === null && fame >= 600) reached.house3 = w;
    if (reached.national === null && s.league === 'national') reached.national = w;
    if (reached.world === null && s.league === 'world') reached.world = w;
    const best = Math.max(0, ...s.owned.map(id => ARTIFACT_BY_ID[id].score));
    if (reached.firstRare === null && best >= 20 && w > 1) reached.firstRare = w;
    if (reached.firstEpic === null && best >= 50) reached.firstEpic = w;
    if (verbose && (w % 8 === 0 || w === 1)) {
      const r = E.totalReputation(s);
      lines.push(`wk${String(w).padStart(3)}  funds §${Math.round(s.funds).toLocaleString().padStart(9)}`
        + `  rev ${String(s.lastRevenue).padStart(6)} exp ${String(s.lastExpenses).padStart(6)}`
        + `  ${String(Math.round(E.totalVisitors(s) / 6)).padStart(4)}/day`
        + `  fame ${String(fame).padStart(4)} (P${Math.round(r.prestige)} Pop${Math.round(r.popularity)} Pat${Math.round(r.patronage)})`
        + `  works ${E.placedCount(s)} rooms ${E.activeMuseum(s).rooms.filter(x => x.unlocked).length} ${E.activeMuseum(s).buildingId}`
        + `  cousins ${s.rivals.map(x => x.fame).join('/')}  ${s.league} #${leagueRank(s)}`);
    }
  }
  const best = s.owned.map(id => ARTIFACT_BY_ID[id]).sort((a, b) => b.score - a.score)[0]
    || ARTIFACT_BY_ID['0611'];
  const mix = s.annualReports?.[s.annualReports.length - 1]?.revenueMix;
  const tot = mix ? Object.values(mix).reduce((n, v) => n + v, 0) || 1 : 1;
  const r = E.totalReputation(s);
  const rt = r.prestige + r.popularity + r.patronage || 1;
  lines.push(`final year income: ${mix ? Object.entries(mix).map(([k, v]) => `${k} ${Math.round(v / tot * 100)}%`).join(', ') : 'n/a'}`
    + ` -> ${E.fundingModel(mix)}; reputation P${Math.round(r.prestige / rt * 100)}% Pop${Math.round(r.popularity / rt * 100)}% Pat${Math.round(r.patronage / rt * 100)}%`);
  return {
    reached, lines,
    final: `fame ${E.totalFame(s)}, funds §${Math.round(s.funds).toLocaleString()}, `
      + `${s.owned.length} works, best ${best.name} (${rarityForScore(best.score).name} ${best.score}), `
      + `rare+ lots seen ${rarePlusLots}, crates ${crateStats.crates} (epic+ pulls ${crateStats.bigPulls}), `
      + `doubtful works ${Object.keys(s.attributions || {}).length}, sets ${(s.completedSets || []).length}`,
  };
}

for (let i = 0; i < RUNS; i++) {
  const r = run(i === 0);
  if (i === 0) console.log(r.lines.join('\n'));
  console.log(`run ${i + 1}: ${JSON.stringify(r.reached)}  ${r.final}`);
}
