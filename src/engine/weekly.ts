/* ============================================================
   ENGINE — THE WEEK & THE CALENDAR  ( src/engine/ )
   What needs the director this week (an ordered queue of events,
   each playable or skippable), and what is coming up over the
   next weeks. Events that expire at the end of the week are the
   ones "End week" warns about.
   ============================================================ */
import type { GameState } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { AUCTION_HOUSES, EXPEDITION_TIERS, STYLES, rarityForScore } from '../data/constants';
import { galaInWeek, houseSellsInWeek, joinedHouses } from './game';
import { SEASON_WEEKS, seasonLabel, seasonIndexOfWeek } from './season';

export type WeekEventKind = 'auction' | 'gala' | 'dealer' | 'estate' | 'dig' | 'crate' | 'claim' | 'plan';

export interface WeekEvent {
  id: string;
  kind: WeekEventKind;
  title: string;
  sub: string;
  /** gone at the end of the week if not played */
  expires: boolean;
  /** the id of the underlying thing (event id, crate id, expedition id) */
  ref?: string;
}

/** this week's queue, in the order a director would want them */
export function weekEvents(s: GameState): WeekEvent[] {
  const out: WeekEvent[] = [];
  if (s.season && !s.season.planned && s.week === s.season.startWeek)
    out.push({ id: 'plan', kind: 'plan', title: `Plan ${seasonLabel(s.season.index)}`, sub: 'Spend your 20 strategy points for the season', expires: false });
  for (const ev of s.events) {
    const head = ev.headlineId ? ARTIFACT_BY_ID[ev.headlineId] : null;
    const best = Math.max(...ev.lotIds.map(id => ARTIFACT_BY_ID[id]?.score || 0));
    out.push({
      id: ev.id, ref: ev.id, kind: 'auction', expires: true,
      title: `${ev.house} sale`,
      sub: head ? `★ Headline: ${head.name} · ${ev.lotIds.length} lots`
        : `${ev.lotIds.length} lots · best is ${rarityForScore(best).name}${ev.fee ? ` · entry §${ev.fee}` : ''}`,
    });
  }
  if (s.galaPending) out.push({ id: 'gala', kind: 'gala', title: 'Society gala', sub: 'Charm a collector into lending you a work', expires: true });
  if (s.blackMarketPending) out.push({ id: 'dealer', kind: 'dealer', title: 'A discreet dealer', sub: 'A bargain, if it is real', expires: true });
  if (s.estateOffer) out.push({ id: 'estate', kind: 'estate', title: `The ${s.estateOffer.family} estate`, sub: `${s.estateOffer.cardCount} lots sight unseen · §${s.estateOffer.price.toLocaleString()}`, expires: true });
  for (const e of s.expeditions.filter(x => !x.resolved && x.weeksLeft <= 0)) {
    const def = EXPEDITION_TIERS.find(t => t.id === e.tier);
    out.push({ id: 'dig:' + e.id, ref: e.id, kind: 'dig', title: `${regionOf(e.style)} team is back`, sub: `${def?.name || 'Expedition'} · play out the dig`, expires: false });
  }
  for (const c of s.crates || [])
    out.push({ id: 'crate:' + c.id, ref: c.id, kind: 'crate', title: c.title, sub: `${c.cards.length} card${c.cards.length === 1 ? '' : 's'} to open`, expires: false });
  if (s.claim) out.push({ id: 'claim', kind: 'claim', title: 'A repatriation claim', sub: ARTIFACT_BY_ID[s.claim.artifactId]?.name || '', expires: false });
  return out;
}

/** skip an expiring event: it is gone for this week */
export function skipEvent(s: GameState, id: string): GameState {
  if (id === 'gala') return { ...s, galaPending: false };
  if (id === 'dealer') return { ...s, blackMarketPending: false };
  if (id === 'estate') return { ...s, estateOffer: null };
  if (s.events.some(e => e.id === id)) return { ...s, events: s.events.filter(e => e.id !== id) };
  return s;
}

export const expiringEvents = (s: GameState) => weekEvents(s).filter(e => e.expires);

/* --- regions for expeditions -------------------------------- */
const REGIONS: Record<string, string> = {
  egyptian: 'Nile Valley', classical: 'Aegean Isles', medieval: 'Abbey Ruins', renaissance: 'Tuscan Villas',
  baroque: 'Flemish Cellars', asian: 'Silk Road', romanticism: 'Alpine Passes', impressionism: 'Seine Studios',
  modernism: 'Paris Ateliers', contemporary: 'Berlin Warehouses', popculture: 'Hollywood Lots',
  precolumbian: 'Yucatán', islamic: 'Anatolian Bazaars',
};
export const regionOf = (style: string) => REGIONS[style] || STYLES[style as keyof typeof STYLES]?.name || style;

/* --- the calendar ------------------------------------------- */
export interface CalendarItem { week: number; kind: string; title: string; detail: string; highlight?: boolean; }

/** what is coming over the next `weeks` weeks (this week excluded) */
export function upcoming(s: GameState, weeks = SEASON_WEEKS): CalendarItem[] {
  const out: CalendarItem[] = [];
  const houses = joinedHouses(s);
  for (let w = s.week + 1; w <= s.week + weeks; w++) {
    for (const h of houses)
      if (houseSellsInWeek(h.id, w) && h.id !== 'house1')
        out.push({ week: w, kind: 'auction', title: `${h.name} sale`, detail: h.blurb });
    if (galaInWeek(s, w)) out.push({ week: w, kind: 'gala', title: 'Society gala', detail: 'Collectors you can charm for a loan' });
    if (seasonIndexOfWeek(w) !== seasonIndexOfWeek(w - 1))
      out.push({ week: w, kind: 'season', title: `${seasonLabel(seasonIndexOfWeek(w))} begins`, detail: 'Season review, then a new plan', highlight: true });
  }
  // the Old Quarter sells every week; say it once
  if (houses.some(h => h.id === 'house1'))
    out.push({ week: s.week + 1, kind: 'auction', title: 'Old Quarter sale (every week)', detail: AUCTION_HOUSES[0].blurb });
  const next = s.market?.nextHeadline;
  if (next) {
    const a = ARTIFACT_BY_ID[next.artifactId];
    const h = AUCTION_HOUSES.find(x => x.id === next.houseId);
    out.push({ week: next.week, kind: 'headline', title: `★ Rumour: ${a?.name}`, detail: `${rarityForScore(a?.score || 0).name} · expected at ${h?.name}`, highlight: true });
  }
  for (const e of s.expeditions.filter(x => !x.resolved && x.weeksLeft > 0))
    out.push({ week: s.week + e.weeksLeft, kind: 'dig', title: `${regionOf(e.style)} team returns`, detail: 'Play out the dig' });
  for (const c of s.commissions || [])
    out.push({ week: s.week + c.weeksLeft, kind: 'commission', title: 'A commission arrives', detail: (s.artists || []).find(a => a.id === c.artistId)?.name || '' });
  for (const a of (s.artists || []).filter(x => x.signed?.by === 'player'))
    out.push({ week: s.week + (a.signed!.weeksLeft), kind: 'residency', title: `${a.name}'s residency ends`, detail: 'They leave you a work' });
  for (const st of s.studies || [])
    out.push({ week: s.week + st.weeksLeft, kind: 'study', title: 'Attribution study reports', detail: ARTIFACT_BY_ID[st.artifactId]?.name || '' });
  for (const m of s.museums) for (const l of m.loans)
    out.push({ week: s.week + l.weeksLeft, kind: 'loan', title: `Loan ends: ${ARTIFACT_BY_ID[l.artifactId]?.name}`, detail: `Back to ${l.lenderName}` });
  return out.filter(x => x.week > s.week && x.week <= s.week + weeks).sort((a, b) => a.week - b.week);
}
