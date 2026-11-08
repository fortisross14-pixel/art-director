/* ============================================================
   ENGINE — EXHIBITION RATINGS  ( src/engine/ )
   The single source of truth for how good a room is. Visitors,
   reputation and the room editor all read from here, so every
   lever the player sees (thesis, decor, staff, research, room
   upgrades) changes the simulation, not only the display.
   ============================================================ */
import type { GameState, Room, StyleId } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { workOf } from './attribution';

export type ThesisId = 'movement' | 'artist' | 'period' | 'region' | 'medium' | 'dialogue';
export const THESES: Record<ThesisId, { name: string; blurb: string }> = {
  movement: { name: 'Movement survey', blurb: 'A clear overview of one artistic movement.' },
  artist: { name: 'Artist focus', blurb: 'Build the room around one artist and their circle.' },
  period: { name: 'Period panorama', blurb: 'Connect works made within a close historical era.' },
  region: { name: 'Place and school', blurb: 'Explore a region, court, city, or artistic school.' },
  medium: { name: 'Medium and technique', blurb: 'Compare how artists used a shared medium.' },
  dialogue: { name: 'Dialogue across time', blurb: 'Intentionally contrast periods through research.' },
};

export const DECOR = {
  classic: { name: 'Classic gallery', best: ['renaissance', 'baroque', 'romanticism', 'medieval'] },
  dramatic: { name: 'Dramatic staging', best: ['baroque', 'egyptian', 'medieval', 'precolumbian'] },
  minimal: { name: 'Minimal white cube', best: ['modernism', 'contemporary', 'impressionism'] },
  immersive: { name: 'Immersive interpretation', best: ['egyptian', 'islamic', 'asian', 'popculture'] },
} as const;

function year(a: string) { return Number(String(a).match(/\d{3,4}/)?.[0] || 0); }

export function styleResearchLevel(s: GameState, style: StyleId) {
  return s.styleResearch?.[style]?.completed?.length || 0;
}

function assignedSkill(s: GameState, id?: string | null) {
  return id ? (s.staff.find(x => x.id === id)?.skill || 0) : 0;
}

/** Base cohesion: how well the works on the wall relate to the
 *  room theme and to each other. */
export function roomCohesion(room: Room): number {
  const works = room.items.map(id => ARTIFACT_BY_ID[id]).filter(Boolean);
  if (!room.theme || works.length === 0) return 0;
  let relatedPairs = 0;
  let pairWeight = 0;
  for (let i = 0; i < works.length; i++) {
    for (let j = i + 1; j < works.length; j++) {
      pairWeight++;
      // Off-theme works are legal but weaken the room's coherence.
      const iMatches = works[i].style === room.theme;
      const jMatches = works[j].style === room.theme;
      let link = iMatches && jMatches ? 0.42
        : works[i].style === works[j].style ? 0.28 : 0.04;
      if (works[i].author === works[j].author) link += 0.28;
      if (works[i].type === works[j].type) link += 0.14;
      const y1 = year(works[i].year);
      const y2 = year(works[j].year);
      if (y1 && y2 && Math.abs(y1 - y2) <= 35) link += 0.16;
      relatedPairs += Math.min(1, link);
    }
  }
  const themeMatch = works.filter(a => a.style === room.theme).length / works.length;
  const pairCohesion = works.length === 1 ? (themeMatch ? 72 : 24)
    : Math.round((relatedPairs / Math.max(1, pairWeight)) * 100);
  return Math.round(pairCohesion * 0.72 + themeMatch * 100 * 0.28);
}

export interface RoomRatings {
  artQuality: number;
  attractiveness: number;
  cohesion: number;
  collectionStrength: number;
  curatorialDepth: number;
  interpretation: number;
  comfort: number;
  decorFit: number;
  visitorAppeal: number;
}

const EMPTY: RoomRatings = {
  artQuality: 0, attractiveness: 0, cohesion: 0, collectionStrength: 0,
  curatorialDepth: 0, interpretation: 0, comfort: 0, decorFit: 0, visitorAppeal: 0,
};

/** Full room ratings, 0-100 each. */
export function roomRatings(s: GameState, room: Room): RoomRatings {
  const works = room.items.filter(id => ARTIFACT_BY_ID[id]).map(id => workOf(s, id));
  if (!room.unlocked || !room.theme || works.length === 0) return { ...EMPTY };

  const avg = works.reduce((n, a) => n + a.score, 0) / works.length;
  const fill = Math.min(works.length, 5);
  const collectionStrength = Math.min(100, Math.round(18 + Math.sqrt(avg) * 6 + fill * 4));
  const research = styleResearchLevel(s, room.theme);
  const curator = assignedSkill(s, room.assignedCuratorId);
  const educator = assignedSkill(s, room.assignedResearcherId);
  const cohesion = roomCohesion(room);

  const thesis = (room.thesis || 'movement') as ThesisId;
  let thesisFit = cohesion;
  if (thesis === 'artist' && works.length > 1) {
    const counts = works.reduce((m, a) => (m[a.author] = (m[a.author] || 0) + 1, m), {} as Record<string, number>);
    thesisFit = Math.round(Math.max(...Object.values(counts)) / works.length * 100);
  }
  if (thesis === 'period' && works.length > 1) {
    const ys = works.map(a => year(a.year)).filter(Boolean);
    thesisFit = ys.length ? Math.max(20, 100 - (Math.max(...ys) - Math.min(...ys)) / 2) : 50;
  }
  if (thesis === 'medium') {
    const types = new Set(works.map(a => a.type));
    thesisFit = Math.max(25, 110 - types.size * 22);
  }
  if (thesis === 'dialogue')
    thesisFit = research >= 6 ? Math.max(cohesion, 78) : Math.round(cohesion * 0.72);

  const curatorialDepth = Math.min(100, Math.round(12 + research * 10 + curator * 9 + thesisFit * 0.35));
  const interpretation = Math.min(100, Math.round((room.interpretation || 0) * 22 + research * 5 + educator * 10));
  const decor = (room.decorStyle || 'classic') as keyof typeof DECOR;
  const decorFit = (DECOR[decor].best as readonly string[]).includes(room.theme) ? 100 : 58;
  const comfort = Math.min(100, Math.round((room.amenities || 0) * 27 + 35));
  const attractiveness = Math.min(100, Math.round(
    thesisFit * 0.34 + (room.decoration || 0) * 14 + comfort * 0.16 + decorFit * 0.14 + fill * 3));
  const artQuality = Math.min(100, Math.round(
    collectionStrength * 0.55 + curatorialDepth * 0.28 + interpretation * 0.17));
  const visitorAppeal = Math.round(artQuality * 0.48 + attractiveness * 0.52);
  return {
    artQuality, attractiveness, cohesion: Math.round(thesisFit), collectionStrength,
    curatorialDepth, interpretation, comfort, decorFit, visitorAppeal,
  };
}
