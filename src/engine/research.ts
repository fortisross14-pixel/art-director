/* ============================================================
   ENGINE — RESEARCH  ( src/engine/ )
   Three things to learn, each a project that takes weeks and one
   initiative. One project at a time, plus one per researcher.
     * STYLE KNOWLEDGE 0..5. Level 1 makes a style yours (you can
       build a room around it); level 2 opens its dig region; every
       level deepens curation, and educators turn it into labels.
     * THESES. Every room starts with "No thesis". Each further way
       of making a room add up has to be researched first.
     * EXPEDITIONS. Field digs from day one; bigger digs need the
       logistics learned.
   ============================================================ */
import type { ExpeditionTier, GameState, ResearchProject, StyleId } from '../data/types';
import { RESEARCH_TIERS, STYLES } from '../data/constants';
import { THESES, styleResearchLevel } from './ratings';
import type { ThesisId } from './ratings';
import { initiativeError, spendInitiative, totalFame } from './game';
import { money, uid } from './util';

export const KNOWLEDGE_NAMES = ['Unknown', 'Familiar', 'Informed', 'Expert', 'Authority', 'World authority'];
export const KNOWLEDGE_EFFECT = [
  '',
  'Yours to collect: build rooms around it.',
  'Its dig region opens to your expeditions.',
  'Deeper curation; educators have more to say.',
  'Cross-period dialogue rooms become possible.',
  'The last word on the subject.',
];
/** the dig region a style's knowledge unlocks */
export const DIG_KNOWLEDGE = 2;

export const knowledgeOf = (s: GameState, style: StyleId) => styleResearchLevel(s, style);

/** what learning the next level of a style costs */
export function styleStep(s: GameState, style: StyleId): { level: number; cost: number; weeks: number; fame: number } | null {
  const k = knowledgeOf(s, style);
  if (k >= 5) return null;
  const level = k + 1;
  if (level === 1) {
    // a brand-new style: the more you already collect, the more reputation it takes
    const n = (s.specialties || []).length;
    const tier = RESEARCH_TIERS[n - 1];
    return { level, cost: tier ? tier.fee : 9000 + 3000 * (n - 4), weeks: 3, fame: tier ? tier.fameReq : 400 + 300 * (n - 4) };
  }
  return { level, cost: [0, 0, 3000, 8000, 20000, 50000][level], weeks: [0, 0, 4, 6, 8, 10][level], fame: [0, 0, 0, 150, 600, 1500][level] };
}

export const THESIS_RESEARCH: Record<Exclude<ThesisId, 'none'>, { cost: number; weeks: number; needs?: number }> = {
  movement: { cost: 1000, weeks: 2 },
  region:   { cost: 4000, weeks: 3 },
  period:   { cost: 4000, weeks: 3 },
  medium:   { cost: 6000, weeks: 4 },
  artist:   { cost: 9000, weeks: 5 },
  dialogue: { cost: 25000, weeks: 8, needs: 4 },
};

export const DIG_RESEARCH: Record<Exclude<ExpeditionTier, 'common'>, { name: string; cost: number; weeks: number; blurb: string }> = {
  uncommon: { name: 'Major digs', cost: 8000, weeks: 3, blurb: 'A bigger team and a season on site: Major crates.' },
  rare: { name: 'Deep digs', cost: 30000, weeks: 5, blurb: 'Survey teams and shoring: richer trenches.' },
  epic: { name: 'Grand expeditions', cost: 120000, weeks: 8, blurb: 'A year-long campaign. Legendary crates.' },
};

export const thesesKnown = (s: GameState): ThesisId[] => (s.thesesKnown as ThesisId[]) || ['none'];
export const digTiers = (s: GameState): ExpeditionTier[] => s.digTiers || ['common'];
export const projects = (s: GameState): ResearchProject[] => s.researchProjects || [];
export const researchSlots = (s: GameState) => 1 + s.staff.filter(x => x.role === 'researcher').length;
/** a researcher's skill shaves weeks off each project */
function weeksFor(s: GameState, base: number): number {
  const best = Math.max(0, ...s.staff.filter(x => x.role === 'researcher').map(x => x.skill));
  const college = s.background === 'academic' ? 1 : 0;
  return Math.max(1, base - Math.floor(best / 2) - college);
}

export interface Plan { cost: number; weeks: number; blocker: string | null; label: string; }

/** what a project would cost, and why it can't start yet */
export function planFor(s: GameState, kind: ResearchProject['kind'], key: string): Plan {
  const busy = projects(s).some(p => p.kind === kind && p.key === key);
  const full = projects(s).length >= researchSlots(s);
  const common = (cost: number): string | null =>
    busy ? 'Already being researched.'
    : full ? `Your researchers are busy (${researchSlots(s)} project${researchSlots(s) === 1 ? '' : 's'} at a time). Hire a researcher for more.`
    : initiativeError(s) || (s.funds < cost ? `Needs ${money(cost)}.` : null);
  if (kind === 'style') {
    const st = styleStep(s, key as StyleId);
    if (!st) return { cost: 0, weeks: 0, blocker: 'Fully researched.', label: '' };
    const weeks = weeksFor(s, st.weeks);
    const fame = totalFame(s) < st.fame ? `Needs ${st.fame} reputation.` : null;
    return { cost: st.cost, weeks, blocker: fame || common(st.cost), label: `${STYLES[key as StyleId].name}: ${KNOWLEDGE_NAMES[st.level]}` };
  }
  if (kind === 'thesis') {
    const t = THESIS_RESEARCH[key as Exclude<ThesisId, 'none'>];
    if (!t || thesesKnown(s).includes(key as ThesisId)) return { cost: 0, weeks: 0, blocker: 'Already known.', label: '' };
    const deep = t.needs && !Object.values(s.knowledge || {}).some(k => (k || 0) >= t.needs!)
      ? `Needs one style at ${KNOWLEDGE_NAMES[t.needs]}.` : null;
    return { cost: t.cost, weeks: weeksFor(s, t.weeks), blocker: deep || common(t.cost), label: THESES[key as ThesisId].name };
  }
  const d = DIG_RESEARCH[key as Exclude<ExpeditionTier, 'common'>];
  if (!d || digTiers(s).includes(key as ExpeditionTier)) return { cost: 0, weeks: 0, blocker: 'Already known.', label: '' };
  const order: ExpeditionTier[] = ['common', 'uncommon', 'rare', 'epic'];
  const prev = order[order.indexOf(key as ExpeditionTier) - 1];
  const step = !digTiers(s).includes(prev) ? `Learn ${DIG_RESEARCH[prev as Exclude<ExpeditionTier, 'common'>]?.name || 'field digs'} first.` : null;
  return { cost: d.cost, weeks: weeksFor(s, d.weeks), blocker: step || common(d.cost), label: d.name };
}

export function startProject(s: GameState, kind: ResearchProject['kind'], key: string): { state: GameState; error?: string } {
  const plan = planFor(s, kind, key);
  if (plan.blocker) return { state: s, error: plan.blocker };
  const next: GameState = JSON.parse(JSON.stringify(s));
  spendInitiative(next);
  next.funds -= plan.cost;
  next.researchProjects = [...projects(next), { id: uid('rp'), kind, key, weeksLeft: plan.weeks, weeksTotal: plan.weeks }];
  next.log = [{ kind: 'good' as const, text: `Research begun: ${plan.label} (${plan.weeks} weeks).` }, ...next.log].slice(0, 60);
  return { state: next };
}

/** what finishing a project gives you */
function complete(s: GameState, p: ResearchProject): string {
  if (p.kind === 'style') {
    const style = p.key as StyleId;
    const k = Math.min(5, (s.knowledge?.[style] || 0) + 1);
    s.knowledge = { ...(s.knowledge || {}), [style]: k };
    if (k >= 1 && !s.specialties.includes(style)) s.specialties = [...s.specialties, style];
    return `${STYLES[style].name} knowledge is now ${KNOWLEDGE_NAMES[k]}. ${KNOWLEDGE_EFFECT[k]}`;
  }
  if (p.kind === 'thesis') {
    s.thesesKnown = [...new Set([...thesesKnown(s), p.key])];
    return `New thesis researched: ${THESES[p.key as ThesisId].name}. Try it in a room.`;
  }
  s.digTiers = [...new Set([...digTiers(s), p.key as ExpeditionTier])];
  return `Your teams can now run ${DIG_RESEARCH[p.key as Exclude<ExpeditionTier, 'common'>].name.toLowerCase()}.`;
}

/** one week of research; mutates a freshly forked state */
export function researchWeek(s: GameState): void {
  const left: ResearchProject[] = [];
  for (const p of projects(s)) {
    const q = { ...p, weeksLeft: p.weeksLeft - 1 };
    if (q.weeksLeft <= 0) s.log = [{ kind: 'good' as const, text: complete(s, q) }, ...s.log].slice(0, 60);
    else left.push(q);
  }
  s.researchProjects = left;
}

/** knowledge and unlocks for a museum founded in a style */
export function foundingResearch(s: GameState, style: StyleId): void {
  s.knowledge = { ...(s.knowledge || {}), [style]: Math.max(DIG_KNOWLEDGE, s.knowledge?.[style] || 0) };
  s.thesesKnown = thesesKnown(s);
  s.digTiers = digTiers(s);
  s.researchProjects = projects(s);
  // the first three artists you hear about are the youngest unknowns
  if (!s.artistsKnown?.length)
    s.artistsKnown = [...(s.artists || [])].filter(a => a.alive).sort((a, b) => a.reputation - b.reputation).slice(0, 3).map(a => a.id);
}
