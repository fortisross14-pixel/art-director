/* ============================================================
   IDENTITY DATA  ( src/data/ )
   What makes one career different from the next:
     * BACKGROUNDS  who the founder is (starting package + perk)
     * DISTRICT_RULES what each part of the city changes
     * MUSEUM_TYPES what the focus style implies: the main way
                    this museum acquires art, and its odds there
   Pure data. The engine reads these modifiers; the defaults
   (1, 0, false) mean "no change".
   ============================================================ */
import type { ArtType, Background, MuseumType, StyleId } from './types';

/* --- founders ------------------------------------------------ */
export interface BackgroundDef {
  id: Background;
  name: string;
  blurb: string;
  funds: number;
  /** extra initiatives every season */
  bonusInitiatives: number;
  /** works handed over at founding: count and rarity band (0 common .. 2 rare) */
  startWorks: { count: number; band: number } | null;
  perk: string;
}
export const BACKGROUNDS: Record<Background, BackgroundDef> = {
  heir: {
    id: 'heir', name: 'Heir', funds: 50000, bonusInitiatives: 0, startWorks: null,
    blurb: "Your grandparent's will leaves you one treasured work. Your cousins take the rest — and become your rivals.",
    perk: 'Choose one of three inherited Rare works.',
  },
  academic: {
    id: 'academic', name: 'Academic', funds: 30000, bonusInitiatives: 1, startWorks: { count: 2, band: 1 },
    blurb: 'A professor who left the university to build a museum. Little money, many colleagues.',
    perk: '+1 initiative a season, studies and research run faster, a researcher on staff from day one.',
  },
  entrepreneur: {
    id: 'entrepreneur', name: 'Entrepreneur', funds: 120000, bonusInitiatives: 0, startWorks: null,
    blurb: 'You sold a company and want your name on a museum. Critics are suspicious of new money.',
    perk: 'Lots of cash; sponsors pay 40% more; prestige grows 15% slower.',
  },
  artist: {
    id: 'artist', name: 'Artist', funds: 35000, bonusInitiatives: 0, startWorks: { count: 3, band: 0 },
    blurb: 'A painter turned director. Your studio friends are your best supply line.',
    perk: 'A free studio crate every season from your network of artists.',
  },
  collector: {
    id: 'collector', name: 'Collector', funds: 40000, bonusInitiatives: 0, startWorks: { count: 3, band: 1 },
    blurb: 'You already own a modest collection and know everyone who matters.',
    perk: 'Three Uncommon works; galas are more frequent and loans cost 30% less.',
  },
};
export const BACKGROUND_IDS = Object.keys(BACKGROUNDS) as Background[];

/* --- districts ---------------------------------------------- */
export interface DistrictRules {
  /** one line for the founding screen */
  summary: string;
  visitorMult: number;
  /** how much the art itself pulls visitors */
  artDrawMult: number;
  /** extra weight on presentation (attractiveness) */
  presentationMult: number;
  /** shop, café and events spend per visitor, on top of the ticket */
  retailPerVisitor: number;
  /** what visitors will pay, relative to the usual fair price */
  ticketTolerance: number;
  sponsorMult: number;
  galaChance: number;
  /** chance to raise an estate lot's crate one tier */
  estateUpgrade: number;
  /** research and attribution studies run this much faster (weeks saved) */
  researchWeeksSaved: number;
  roomCostMult: number;
  maintenanceMult: number;
  capacityMult: number;
  /** works of these styles draw 15% more here */
  styleBoost: StyleId[];
  typeBoost: ArtType | null;
  /** grant income per season, per point of prestige */
  grantPerPrestige: number;
  seasonalTourism: boolean;
  /** weekly chance of a flood costing three weeks of upkeep (halved with operations >= 20%) */
  floodRisk: number;
  membershipMult: number;
  popularityMult: number;
  prestigeMult: number;
  /** rivals bid this much higher here */
  rivalAggression: number;
}

const BASE: DistrictRules = {
  summary: '', visitorMult: 1, artDrawMult: 1, presentationMult: 1, retailPerVisitor: 3,
  ticketTolerance: 1, sponsorMult: 1, galaChance: 0.4, estateUpgrade: 0, researchWeeksSaved: 0,
  roomCostMult: 1, maintenanceMult: 1, capacityMult: 1, styleBoost: [], typeBoost: null,
  grantPerPrestige: 0, seasonalTourism: false, floodRisk: 0, membershipMult: 1,
  popularityMult: 1, prestigeMult: 1, rivalAggression: 1,
};

export const DISTRICT_RULES: Record<string, DistrictRules> = {
  historic: { ...BASE,
    summary: 'Tourists and heritage. Busy summers, quiet winters, popularity grows faster.',
    visitorMult: 1.08, seasonalTourism: true, popularityMult: 1.15, roomCostMult: 1.25 },
  art: { ...BASE,
    summary: 'Collectors and critics. Frequent galas, better estates, prestige grows faster — and rivals bid harder.',
    galaChance: 0.6, estateUpgrade: 0.35, prestigeMult: 1.1, rivalAggression: 1.15, ticketTolerance: 1.1 },
  college: { ...BASE,
    summary: 'Students and scholars. Grants instead of big sponsors, research twice as fast, cheap tickets.',
    researchWeeksSaved: 2, grantPerPrestige: 300, sponsorMult: 0.5, ticketTolerance: 0.55,
    prestigeMult: 1.1, typeBoost: 'Manuscript' },
  bohemian: { ...BASE,
    summary: 'Artists and studios. Cheap rooms and rent; modern and contemporary works shine.',
    roomCostMult: 0.6, maintenanceMult: 0.8, styleBoost: ['modernism', 'contemporary', 'popculture'],
    ticketTolerance: 0.9 },
  downtown: { ...BASE,
    summary: 'The financial district. Shop, café and events can out-earn tickets; sponsors queue up; the experience matters more than the fame of the pieces.',
    retailPerVisitor: 17, sponsorMult: 1.6, artDrawMult: 0.85, presentationMult: 1.3,
    ticketTolerance: 1.15, visitorMult: 1.1 },
  park: { ...BASE,
    summary: 'Families and locals. Strong memberships, sculpture gardens, steady crowds.',
    membershipMult: 1.6, typeBoost: 'Sculpture', popularityMult: 1.05 },
  waterfront: { ...BASE,
    summary: 'Vast, cheap warehouse space for immersive shows — and the odd flood.',
    capacityMult: 1.3, maintenanceMult: 0.85, floodRisk: 0.02, presentationMult: 1.15, retailPerVisitor: 5 },
};
export const rulesFor = (districtId: string | undefined | null): DistrictRules =>
  (districtId && DISTRICT_RULES[districtId]) || BASE;

/* --- museum types (from the focus style) --------------------- */
export interface MuseumTypeDef {
  id: MuseumType;
  name: string;
  channel: string;
  /** extra cards in dig crates */
  digExtraCards: number;
  /** chance to raise a dig crate one tier */
  digUpgrade: number;
  expeditionCostMult: number;
  /** chance to raise an estate crate one tier */
  estateUpgrade: number;
  /** share of Rare+ auction lots surfacing with a doubtful attribution */
  doubtRate: number;
  /** extra lots at each sale */
  extraLots: number;
  bequestMult: number;
  galaBonus: number;
  loanFeeMult: number;
  retailBonus: number;
  /** a free studio crate is offered each season (costs an initiative) */
  studioVisits: boolean;
  repatriation: boolean;
}
const TYPE_BASE = {
  digExtraCards: 0, digUpgrade: 0, expeditionCostMult: 1, estateUpgrade: 0, doubtRate: 0.15,
  extraLots: 0, bequestMult: 1, galaBonus: 0, loanFeeMult: 1, retailBonus: 0,
  studioVisits: false, repatriation: false,
};
export const MUSEUM_TYPES: Record<MuseumType, MuseumTypeDef> = {
  archaeological: { ...TYPE_BASE, id: 'archaeological', name: 'Archaeological museum',
    channel: 'Expeditions: bigger, better dig crates and cheaper digs — but countries may ask for their treasures back.',
    digExtraCards: 1, digUpgrade: 0.2, expeditionCostMult: 0.8, repatriation: true },
  oldmasters: { ...TYPE_BASE, id: 'oldmasters', name: 'Old Masters gallery',
    channel: 'Auctions and estates: an extra lot at every sale, more sleepers, richer estates.',
    extraLots: 1, doubtRate: 0.25, estateUpgrade: 0.3 },
  modern: { ...TYPE_BASE, id: 'modern', name: 'Modern & contemporary museum',
    channel: 'Studio visits: a studio crate on offer each season, straight from the artists.',
    studioVisits: true },
  popculture: { ...TYPE_BASE, id: 'popculture', name: 'Pop culture & design museum',
    channel: 'Donations and fans: bequests three times as often, and a busy shop.',
    bequestMult: 3, retailBonus: 3 },
  worldcultures: { ...TYPE_BASE, id: 'worldcultures', name: 'World cultures museum',
    channel: 'Loans and exchanges: more galas and loans at a lower fee.',
    galaBonus: 0.2, loanFeeMult: 0.6 },
};
export const MUSEUM_TYPE_OF_STYLE: Record<StyleId, MuseumType> = {
  egyptian: 'archaeological', classical: 'archaeological', precolumbian: 'archaeological',
  medieval: 'oldmasters', renaissance: 'oldmasters', baroque: 'oldmasters', romanticism: 'oldmasters',
  impressionism: 'modern', modernism: 'modern', contemporary: 'modern',
  popculture: 'popculture',
  asian: 'worldcultures', islamic: 'worldcultures',
};
