/* ============================================================
   ENGINE — SAVES  ( src/engine/ )
   localStorage-backed save slots. Three slots (0,1,2). The game
   autosaves the active slot after every meaningful change.
   ============================================================ */
import type { GameState, SaveSlot } from '../data/types';
import { makeCandidates } from './game';
import { ensureSeason } from './season';
import { makeArtistPool, registerAllLivingWorks } from './artistcore';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { ROOM_CAPACITY } from '../data/constants';

const KEY = (slot: number) => `museum-wars:slot:${slot}`;
export const SLOT_COUNT = 3;

/* Saves made by an earlier build may lack fields that newer
   features added (staff, expeditions, history, ...). Loading such
   a save would crash any screen that reads a missing array. This
   migration backfills every field with a safe default so old
   saves keep working. New fields must be added here too. */
export function migrateState(state: Partial<GameState>): GameState {
  const s = state as GameState & Record<string, unknown>;
  if (!Array.isArray(s.staff)) s.staff = [];
  if (!Array.isArray(s.candidates)) s.candidates = makeCandidates();
  // old saves predate staff specialties — drop the stale recruit
  // pool and any specialty-less staff so the new system is clean
  if (s.staff.some(m => !m.specialty)) {
    s.staff = s.staff.filter(m => !!m.specialty);
  }
  if (s.candidates.some(c => !c.specialty)) {
    s.candidates = makeCandidates();
  }
  if (!Array.isArray(s.expeditions)) s.expeditions = [];
  if (!s.shards || typeof s.shards !== 'object') s.shards = {};
  if (typeof s.galaPending !== 'boolean') s.galaPending = false;
  if (typeof s.blackMarketPending !== 'boolean') s.blackMarketPending = false;
  if (!s.restorationOwed || typeof s.restorationOwed !== 'object')
    s.restorationOwed = {};
  if (!s.stolenUndeclared || typeof s.stolenUndeclared !== 'object')
    s.stolenUndeclared = {};
  if (!Array.isArray(s.salvageOnly)) s.salvageOnly = [];
  if (!Array.isArray(s.history)) s.history = [];
  if (!Array.isArray(s.joinedHouses)) s.joinedHouses = ['house1'];
  if (!Array.isArray(s.rivals)) s.rivals = [];
  if (!Array.isArray(s.events)) s.events = [];
  if (!Array.isArray(s.owned)) s.owned = [];
  if (!Array.isArray(s.log)) s.log = [];
  if (!s.expertise) s.expertise = {};
  if (typeof s.lastRevenue !== 'number') s.lastRevenue = 0;
  if (typeof s.lastExpenses !== 'number') s.lastExpenses = 0;
  if (s.pendingItemId === undefined) s.pendingItemId = null;
  if (s.research === undefined) s.research = null;
  if (s.activeEvent === undefined) s.activeEvent = null;
  if (s.auction === undefined) s.auction = null;
  if (!s.styleResearch || typeof s.styleResearch !== 'object') s.styleResearch = {};
  if (!Array.isArray(s.temporaryExhibitions)) s.temporaryExhibitions = [];
  // v18: knowledge 0..5 per style, researched theses and dig sizes
  if (!s.knowledge) {
    s.knowledge = {};
    (s.specialties || []).forEach((st, i) => {
      const nodes = s.styleResearch?.[st]?.completed?.length || 0;
      s.knowledge![st] = Math.min(5, Math.max(i === 0 ? 2 : 1, 1 + Math.floor(nodes * 0.7)));
    });
    const used = new Set<string>(['none', 'movement']);
    for (const m of s.museums || []) for (const r of m.rooms || []) if (r.thesis) used.add(r.thesis);
    s.thesesKnown = [...used];
    const tiers = new Set<string>(['common', 'uncommon']);
    for (const e of s.expeditions || []) tiers.add(e.tier);
    s.digTiers = [...tiers] as GameState['digTiers'];
  }
  if (!Array.isArray(s.researchProjects)) s.researchProjects = [];
  if (s.research) {
    // an old "new style" project carries on as level-1 style research
    s.researchProjects.push({ id: 'rp-old', kind: 'style', key: s.research.style, weeksLeft: s.research.weeksLeft, weeksTotal: s.research.weeksLeft });
    s.research = null;
  }
  if (!Array.isArray(s.thesesKnown)) s.thesesKnown = ['none'];
  if (!Array.isArray(s.digTiers)) s.digTiers = ['common'];
  if (!Array.isArray(s.society)) s.society = [];
  if (typeof s.memberships !== 'number') s.memberships = 0;
  if (!s.museumRelations || typeof s.museumRelations !== 'object') s.museumRelations = {};
  if (s.weeklyReport === undefined) s.weeklyReport = null;
  // v0.8: rarity pacing and cousins who collect
  if (!s.market) s.market = { weeksSinceRarePlus: 0, lastHeadlineWeek: (s.week || 1) - 7 };
  for (const r of s.rivals) {
    if (!Array.isArray(r.collection)) r.collection = [];
    if (typeof r.budget !== 'number') r.budget = 15000;
    if (!r.style) r.style = (r.heirloomId && ARTIFACT_BY_ID[r.heirloomId]?.style) || 'baroque';
  }
  // v0.9: crates, dust, attributions. Old per-style shards become dust.
  if (!Array.isArray(s.crates)) s.crates = [];
  if (typeof s.dust !== 'number') {
    const shards = Object.values(s.shards || {}).reduce((n, v) => n + (Number(v) || 0), 0);
    s.dust = Math.round(shards / 2);
    s.shards = {};
  }
  if (typeof s.cratePity !== 'number') s.cratePity = 0;
  if (s.estateOffer === undefined) s.estateOffer = null;
  if (!s.attributions || typeof s.attributions !== 'object') s.attributions = {};
  if (!Array.isArray(s.studies)) s.studies = [];
  if (!Array.isArray(s.completedSets)) s.completedSets = [];
  if (s.signatureId === undefined) s.signatureId = null;
  // v1.2: living artists
  if (!Array.isArray(s.artists)) s.artists = makeArtistPool();
  if (!s.livingWorks || typeof s.livingWorks !== 'object') s.livingWorks = {};
  if (!Array.isArray(s.commissions)) s.commissions = [];
  registerAllLivingWorks(s);
  if (!Array.isArray(s.artistsKnown))
    s.artistsKnown = [...s.artists].filter(a => a.alive && a.reputation <= 50).sort((a, b) => a.reputation - b.reputation).slice(0, 6).map(a => a.id);
  if (s.auction && !s.auction.rivalName) {
    s.auction.rivalName = 'A private collector';
    s.auction.rivalId = null;
  }

  // --- multi-museum migration ---------------------------------
  // a pre-multimuseum save kept rooms/fame/buildingId/etc. flat on
  // the state. Wrap that into a single Museum so the new array
  // model is satisfied and the game plays on unchanged.
  if (!Array.isArray(s.museums)) {
    const legacy = s as unknown as Record<string, unknown>;
    const museum = {
      id: 'museum_0',
      name: (s.galleryName as string) || 'The Museum',
      buildingId: (legacy.buildingId as string) || 'local',
      rooms: Array.isArray(legacy.rooms) ? legacy.rooms : [],
      fame: typeof legacy.fame === 'number' ? legacy.fame : 0,
      ticket: typeof legacy.ticket === 'number' ? legacy.ticket : 5,
      sponsors: Array.isArray(legacy.sponsors) ? legacy.sponsors : [],
      wingNames: legacy.wingNames || {},
      adWeeksLeft: typeof legacy.adWeeksLeft === 'number'
        ? legacy.adWeeksLeft : 0,
      loans: Array.isArray(legacy.loans) ? legacy.loans : [],
      open: true,
    };
    s.museums = [museum as GameState['museums'][number]];
    s.activeMuseumId = museum.id;
  }
  if (!s.activeMuseumId || !s.museums.some(m => m.id === s.activeMuseumId)) {
    s.activeMuseumId = s.museums[0]?.id || 'museum_0';
  }
  // backfill any museum missing the newer `open` flag
  for (const m of s.museums) {
    if (typeof m.open !== 'boolean') m.open = true;
    if (!Array.isArray(m.loans)) m.loans = [];
    if (!Array.isArray(m.sponsors)) m.sponsors = [];
    // pre-term-sponsor saves used a different Sponsor shape — drop
    // any sponsor lacking the new `scope`/`weeksLeft` fields
    m.sponsors = m.sponsors.filter(sp =>
      sp && typeof sp.scope === 'string'
      && typeof sp.weeksLeft === 'number');
    if (!m.wingNames) m.wingNames = {};
    if (typeof m.adWeeksLeft !== 'number') m.adWeeksLeft = 0;
    // v0.8: fame gains a reputation breakdown; old fame counts as prestige
    if (!m.reputation) m.reputation = { prestige: m.fame || 0, popularity: 0, patronage: 0 };
    for (const r of m.rooms) {
      // rooms already full were paid their completion bonus long ago
      if (r.completedOnce === undefined) r.completedOnce = r.items.length >= ROOM_CAPACITY;
      if (r.thesis === undefined) r.thesis = 'movement';
      if (r.decorStyle === undefined) r.decorStyle = 'classic';
      if (r.assignedCuratorId === undefined) r.assignedCuratorId = null;
      if (r.assignedResearcherId === undefined) r.assignedResearcherId = null;
    }
  }
  return s;
}

/** The save schema version. Bump it when the shape of a save changes and
 *  add the step to migrateState; a save newer than this build is refused. */
export const SAVE_VERSION = 18;
const BAK = (slot: number) => KEY(slot) + ':bak';

function parseRecord(raw: string | null): SaveSlot | null {
  if (!raw) return null;
  const parsed = JSON.parse(raw) as SaveSlot;
  if (!parsed || typeof parsed.slot !== 'number' || !parsed.state || typeof parsed.state.week !== 'number') throw new Error('bad save');
  return parsed;
}

/** what's in a slot: nothing, a good save, a damaged one we recovered from backup,
 *  one we couldn't read at all, or one written by a newer version of the game */
export type SlotStatus = 'empty' | 'ok' | 'restored' | 'damaged' | 'newer';
export function slotStatus(slot: number): SlotStatus {
  try {
    const raw = localStorage.getItem(KEY(slot));
    if (!raw) return localStorage.getItem(BAK(slot)) ? 'restored' : 'empty';
    const rec = parseRecord(raw)!;
    return (rec.version || 0) > SAVE_VERSION ? 'newer' : 'ok';
  } catch {
    try { return parseRecord(localStorage.getItem(BAK(slot))) ? 'restored' : 'damaged'; } catch { return 'damaged'; }
  }
}

/** read a slot's save (falling back to its backup), or null if there is none.
 *  A save from a newer build is never loaded: its fields can't be trusted here. */
export function loadSlot(slot: number): SaveSlot | null {
  for (const key of [KEY(slot), BAK(slot)]) {
    try {
      const rec = parseRecord(localStorage.getItem(key));
      if (!rec) continue;
      if ((rec.version || 0) > SAVE_VERSION) return null;
      rec.state = ensureSeason(migrateState(rec.state));
      rec.version = SAVE_VERSION;
      return rec;
    } catch { /* try the backup */ }
  }
  return null;
}

/** all three slots, empty ones as null */
export function listSlots(): (SaveSlot | null)[] {
  const out: (SaveSlot | null)[] = [];
  for (let i = 0; i < SLOT_COUNT; i++) out.push(loadSlot(i));
  return out;
}

/** write a game state into a slot (the autosave); the previous good save is
 *  kept as a backup. Returns false when the browser refused to store it. */
export function saveSlot(slot: number, state: GameState): boolean {
  try {
    const record: SaveSlot = {
      slot, version: SAVE_VERSION,
      playerName: state.playerName,
      galleryName: state.galleryName,
      week: state.week,
      fame: state.museums.reduce((a, m) => a + (m.open ? m.fame : 0), 0),
      savedAt: Date.now(),
      state,
    };
    const prev = localStorage.getItem(KEY(slot));
    // keep the last good save as a backup, but never overwrite a backup with a newer build's save
    try { if (prev && (parseRecord(prev)!.version || 0) <= SAVE_VERSION) localStorage.setItem(BAK(slot), prev); } catch { /* prev was damaged: keep the old backup */ }
    localStorage.setItem(KEY(slot), JSON.stringify(record));
    return true;
  } catch {
    return false;
  }
}

/** erase a slot */
export function deleteSlot(slot: number): void {
  try { localStorage.removeItem(KEY(slot)); localStorage.removeItem(BAK(slot)); } catch { /* ignore */ }
}
