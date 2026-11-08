/* ============================================================
   GAME CONSTANTS  ( src/data/ )  — STAGE 1 REWORK
   ============================================================ */
import type {
  StyleDef, StyleId, RarityBand, RarityId, ArtType,
  BuildingDef, DistrictDef, StaticMuseum,
} from './types';

/* --- styles (what a museum specialises in) ----------------- */
export const STYLES: Record<StyleId, StyleDef> = {
  egyptian:     { id: 'egyptian',     name: 'Egyptian' },
  classical:    { id: 'classical',    name: 'Classical' },
  medieval:     { id: 'medieval',     name: 'Medieval' },
  renaissance:  { id: 'renaissance',  name: 'Renaissance' },
  baroque:      { id: 'baroque',      name: 'Baroque' },
  asian:        { id: 'asian',        name: 'Asian' },
  romanticism:  { id: 'romanticism',  name: 'Romanticism' },
  impressionism:{ id: 'impressionism',name: 'Impressionism' },
  modernism:    { id: 'modernism',    name: 'Modernism' },
  contemporary: { id: 'contemporary', name: 'Contemporary' },
  popculture:   { id: 'popculture',   name: 'Pop Culture' },
  precolumbian: { id: 'precolumbian', name: 'Pre-Columbian' },
  islamic:      { id: 'islamic',      name: 'Islamic' },
};
export const STYLE_IDS = Object.keys(STYLES) as StyleId[];

/* --- artifact types ---------------------------------------- */
export const ART_TYPES: ArtType[] = ['Painting', 'Sculpture', 'Manuscript', 'Object'];

/* --- rarity bands (derived from score) --------------------- */
export const RARITY_BANDS: RarityBand[] = [
  { id: 'common',    name: 'Common',     min: 0,   cls: 'r-common',    hex: '#6f6657' },
  { id: 'uncommon',  name: 'Uncommon',   min: 10,  cls: 'r-uncommon',  hex: '#4a6149' },
  { id: 'rare',      name: 'Rare',       min: 20,  cls: 'r-rare',      hex: '#2f6485' },
  { id: 'epic',      name: 'Epic',       min: 50,  cls: 'r-epic',      hex: '#7d4f9c' },
  { id: 'legend',    name: 'Legend',     min: 100, cls: 'r-legend',    hex: '#b06d1f' },
  { id: 'worldicon', name: 'World Icon', min: 200, cls: 'r-worldicon', hex: '#8b3a2f' },
];
export function rarityForScore(score: number): RarityBand {
  let band = RARITY_BANDS[0];
  for (const b of RARITY_BANDS) if (score >= b.min) band = b;
  return band;
}
export function rarityById(id: RarityId): RarityBand {
  return RARITY_BANDS.find(b => b.id === id) ?? RARITY_BANDS[0];
}

/* --- artifact type -> slot icon ---------------------------- */
export const TYPE_ICON: Record<ArtType, string> = {
  Painting: '🖼', Sculpture: '🗿', Manuscript: '📜', Object: '⚱',
};
export const typeIcon = (t: ArtType) => TYPE_ICON[t] || '◆';

/* --- buildings --------------------------------------------- */
export const ROOM_CAPACITY = 5;
export const BUILDINGS: Record<string, BuildingDef> = {
  /* --- starter homes: one small first building per district -- */
  seminar: {
    id: 'seminar', name: 'The Seminar Rooms', starter: true,
    blurb: 'Borrowed teaching rooms on campus. Students wander in between lectures.',
    prestige: 1.0, moveCost: 0, maintenance: 1500, capacity: 170,
    halls: [{ id: 'ground', name: 'Seminar Wing', roomCap: 3, startRooms: 1 }],
  },
  garage: {
    id: 'garage', name: 'The Garage Gallery', starter: true,
    blurb: 'A converted garage between studios. Raw, cheap, full of character.',
    prestige: 1.0, moveCost: 0, maintenance: 1200, capacity: 160,
    halls: [{ id: 'ground', name: 'Garage Floor', roomCap: 3, startRooms: 1 }],
  },
  lobby: {
    id: 'lobby', name: 'The Lobby Gallery', starter: true,
    blurb: 'A glass lobby in an office tower. Bankers on their lunch break.',
    prestige: 1.0, moveCost: 0, maintenance: 2400, capacity: 200,
    halls: [{ id: 'ground', name: 'Lobby Level', roomCap: 3, startRooms: 1 }],
  },
  gatehouse: {
    id: 'gatehouse', name: 'The Gatehouse', starter: true,
    blurb: 'An old lodge at the park gates. Families on their Sunday walk.',
    prestige: 1.0, moveCost: 0, maintenance: 1600, capacity: 170,
    halls: [{ id: 'ground', name: 'Lodge Rooms', roomCap: 3, startRooms: 1 }],
  },
  boathouse: {
    id: 'boathouse', name: 'The Boathouse', starter: true,
    blurb: 'A long boathouse on the quay. Damp, roomy and cheap.',
    prestige: 1.0, moveCost: 0, maintenance: 1300, capacity: 200,
    halls: [{ id: 'ground', name: 'Boat Shed', roomCap: 4, startRooms: 1 }],
  },
  cabinet: {
    id: 'cabinet', name: "The Collector's Cabinet", starter: true,
    blurb: 'Two panelled rooms above a dealer on the smartest street in town.',
    prestige: 1.05, moveCost: 0, maintenance: 2600, capacity: 150,
    halls: [{ id: 'ground', name: 'Cabinet Rooms', roomCap: 2, startRooms: 1 }],
  },
  /* --- district flagships: the top address in each district -- */
  cathedral: {
    id: 'cathedral', name: "The Cathedral Museum",
    blurb: "A deconsecrated cathedral in the old town — the city's most famous address.",
    prestige: 1.5, moveCost: 200000, maintenance: 40000, capacity: 2600, needsLeague: 'national',
    halls: [
      { id: 'ca0', name: 'North Hall', roomCap: 5, startRooms: 1 },
      { id: 'ca1', name: 'South Hall', roomCap: 5, startRooms: 0 },
      { id: 'ca2', name: 'East Hall', roomCap: 5, startRooms: 0 },
      { id: 'ca3', name: 'West Hall', roomCap: 5, startRooms: 0 },
      { id: 'ca4', name: 'Grand Hall', roomCap: 5, startRooms: 0 },
    ],
  },
  library: {
    id: 'library', name: "The Great Library",
    blurb: "The university's neo-classical library, given over to the museum.",
    prestige: 1.5, moveCost: 180000, maintenance: 36000, capacity: 2400, needsLeague: 'national',
    halls: [
      { id: 'li0', name: 'North Hall', roomCap: 5, startRooms: 1 },
      { id: 'li1', name: 'South Hall', roomCap: 5, startRooms: 0 },
      { id: 'li2', name: 'East Hall', roomCap: 5, startRooms: 0 },
      { id: 'li3', name: 'West Hall', roomCap: 5, startRooms: 0 },
      { id: 'li4', name: 'Grand Hall', roomCap: 5, startRooms: 0 },
    ],
  },
  foundry: {
    id: 'foundry', name: "The Old Foundry",
    blurb: "A vast ironworks turned into the city's beating cultural heart.",
    prestige: 1.35, moveCost: 140000, maintenance: 26000, capacity: 2200, needsLeague: 'national',
    halls: [
      { id: 'fo0', name: 'North Hall', roomCap: 5, startRooms: 1 },
      { id: 'fo1', name: 'South Hall', roomCap: 5, startRooms: 0 },
      { id: 'fo2', name: 'East Hall', roomCap: 5, startRooms: 0 },
      { id: 'fo3', name: 'West Hall', roomCap: 5, startRooms: 0 },
      { id: 'fo4', name: 'Grand Hall', roomCap: 5, startRooms: 0 },
    ],
  },
  exchange: {
    id: 'exchange', name: "The Exchange",
    blurb: "The old stock exchange: marble trading floors, glass roofs, money everywhere.",
    prestige: 1.45, moveCost: 260000, maintenance: 55000, capacity: 2800, needsLeague: 'national',
    halls: [
      { id: 'ex0', name: 'North Hall', roomCap: 5, startRooms: 1 },
      { id: 'ex1', name: 'South Hall', roomCap: 5, startRooms: 0 },
      { id: 'ex2', name: 'East Hall', roomCap: 5, startRooms: 0 },
      { id: 'ex3', name: 'West Hall', roomCap: 5, startRooms: 0 },
      { id: 'ex4', name: 'Grand Hall', roomCap: 5, startRooms: 0 },
    ],
  },
  conservatory: {
    id: 'conservatory', name: "The Grand Conservatory",
    blurb: "A glasshouse palace among the gardens, sculptures under palms.",
    prestige: 1.45, moveCost: 170000, maintenance: 34000, capacity: 2400, needsLeague: 'national',
    halls: [
      { id: 'co0', name: 'North Hall', roomCap: 5, startRooms: 1 },
      { id: 'co1', name: 'South Hall', roomCap: 5, startRooms: 0 },
      { id: 'co2', name: 'East Hall', roomCap: 5, startRooms: 0 },
      { id: 'co3', name: 'West Hall', roomCap: 5, startRooms: 0 },
      { id: 'co4', name: 'Grand Hall', roomCap: 5, startRooms: 0 },
    ],
  },
  terminal: {
    id: 'terminal', name: "The Grand Terminal",
    blurb: "A disused ocean terminal — enormous halls over the water.",
    prestige: 1.35, moveCost: 160000, maintenance: 30000, capacity: 2600, needsLeague: 'national',
    halls: [
      { id: 'te0', name: 'North Hall', roomCap: 5, startRooms: 1 },
      { id: 'te1', name: 'South Hall', roomCap: 5, startRooms: 0 },
      { id: 'te2', name: 'East Hall', roomCap: 5, startRooms: 0 },
      { id: 'te3', name: 'West Hall', roomCap: 5, startRooms: 0 },
      { id: 'te4', name: 'Grand Hall', roomCap: 5, startRooms: 0 },
    ],
  },
  /* --- Historic District: where a museum begins ----------- */
  local: {
    id: 'local', name: 'Local Gallery', starter: true,
    blurb: 'A rented room in a small city. A beginning.',
    prestige: 1.0, moveCost: 0, maintenance: 1750, capacity: 180,
    halls: [{ id: 'ground', name: 'Ground Floor', roomCap: 3, startRooms: 1 }],
  },
  town: {
    id: 'town', name: 'Town Museum',
    blurb: 'A civic museum across two halls — room to grow.',
    prestige: 1.25, moveCost: 22000, maintenance: 8000, capacity: 500, needsFame: 200,
    halls: [
      { id: 'east', name: 'East Hall', roomCap: 4, startRooms: 1 },
      { id: 'west', name: 'West Hall', roomCap: 3, startRooms: 0 },
    ],
  },
  /* --- Art District: prestige addresses ------------------- */
  palace: {
    id: 'palace', name: 'Historic Palace',
    blurb: 'A grand palace of five wings — the address of a great museum.',
    prestige: 1.6, moveCost: 220000, maintenance: 46000, capacity: 3000, needsLeague: 'national',
    halls: [
      { id: 'north', name: 'North Wing', roomCap: 5, startRooms: 1 },
      { id: 'south', name: 'South Wing', roomCap: 5, startRooms: 0 },
      { id: 'east',  name: 'East Wing',  roomCap: 5, startRooms: 0 },
      { id: 'west',  name: 'West Wing',  roomCap: 5, startRooms: 0 },
      { id: 'grand', name: 'Grand Wing', roomCap: 5, startRooms: 0 },
    ],
  },
  salon: {
    id: 'salon', name: 'The Beaux-Arts Salon',
    blurb: 'An elegant exhibition house — modest, but a fine pedigree.',
    prestige: 1.4, moveCost: 95000, maintenance: 19000, capacity: 900, needsFame: 200,
    halls: [
      { id: 'upper', name: 'Upper Salon', roomCap: 4, startRooms: 1 },
      { id: 'lower', name: 'Lower Salon', roomCap: 4, startRooms: 0 },
    ],
  },
  /* --- College District: teaching museums ----------------- */
  college: {
    id: 'college', name: 'University Museum',
    blurb: 'A teaching museum on campus — busy halls, young crowds.',
    prestige: 1.2, moveCost: 40000, maintenance: 11000, capacity: 650, needsFame: 200,
    halls: [
      { id: 'first',  name: 'First Floor',  roomCap: 4, startRooms: 1 },
      { id: 'second', name: 'Second Floor', roomCap: 4, startRooms: 0 },
      { id: 'third',  name: 'Third Floor',  roomCap: 3, startRooms: 0 },
    ],
  },
  /* --- Bohemian Neighborhood: artist quarters ------------- */
  loft: {
    id: 'loft', name: 'The Artists\u2019 Loft',
    blurb: 'A converted studio block — raw character, low overhead.',
    prestige: 1.15, moveCost: 30000, maintenance: 6500, capacity: 350, needsFame: 200,
    halls: [
      { id: 'main', name: 'Loft Floor', roomCap: 5, startRooms: 1 },
    ],
  },
  /* --- Downtown: commercial heart ------------------------- */
  tower: {
    id: 'tower', name: 'The Gallery Tower',
    blurb: 'A high-rise museum — many floors, steep rent, vast footfall.',
    prestige: 1.45, moveCost: 130000, maintenance: 33000, capacity: 1000, needsFame: 200,
    halls: [
      { id: 'f2', name: 'Second Floor', roomCap: 3, startRooms: 1 },
      { id: 'f3', name: 'Third Floor',  roomCap: 3, startRooms: 0 },
      { id: 'f4', name: 'Fourth Floor', roomCap: 3, startRooms: 0 },
      { id: 'f5', name: 'Fifth Floor',  roomCap: 3, startRooms: 0 },
    ],
  },
  /* --- Park District: green, quiet pavilions -------------- */
  pavilion: {
    id: 'pavilion', name: 'The Park Pavilion',
    blurb: 'A glass pavilion among the gardens — calm, and a gentle upkeep.',
    prestige: 1.3, moveCost: 60000, maintenance: 13000, capacity: 700, needsFame: 200,
    halls: [
      { id: 'glass', name: 'Glass Hall', roomCap: 4, startRooms: 1 },
      { id: 'garden', name: 'Garden Hall', roomCap: 4, startRooms: 0 },
    ],
  },
  /* --- Waterfront: docks and warehouses ------------------- */
  warehouse: {
    id: 'warehouse', name: 'The Dockside Warehouse',
    blurb: 'A cavernous old warehouse on the water — cheap space, lots of it.',
    prestige: 1.2, moveCost: 70000, maintenance: 12000, capacity: 1000, needsFame: 200,
    halls: [
      { id: 'hold', name: 'The Hold',    roomCap: 5, startRooms: 1 },
      { id: 'wharf', name: 'Wharf Hall', roomCap: 5, startRooms: 0 },
      { id: 'pier',  name: 'Pier Hall',  roomCap: 4, startRooms: 0 },
    ],
  },
};
export const BUILDING_ORDER = [
  'local', 'seminar', 'garage', 'lobby', 'gatehouse', 'boathouse', 'cabinet', 'loft', 'town', 'college', 'pavilion', 'warehouse',
  'salon', 'tower', 'palace', 'foundry', 'terminal', 'conservatory', 'library', 'cathedral', 'exchange',
];

/* --- districts (7) ----------------------------------------- */
export const DISTRICTS: DistrictDef[] = [
  { id: 'historic', name: 'Historic District',
    blurb: 'Old streets and civic halls — where a small museum can begin.',
    accent: '#b9892f', pos: { x: 82, y: 70 }, buildingIds: ['local', 'town', 'cathedral'] },
  { id: 'art', name: 'Art District',
    blurb: 'Grand institutions and collectors. The address of a great museum.',
    accent: '#8b3a2f', pos: { x: 83, y: 20 }, buildingIds: ['cabinet', 'salon', 'palace'] },
  { id: 'college', name: 'College District',
    blurb: 'Universities and young crowds — busy, affordable halls.',
    accent: '#3f6694', pos: { x: 18, y: 17 }, buildingIds: ['seminar', 'college', 'library'] },
  { id: 'bohemian', name: 'Bohemian Neighborhood',
    blurb: 'Artists and studios — raw spaces with real character.',
    accent: '#6b4a8a', pos: { x: 49, y: 17 }, buildingIds: ['garage', 'loft', 'foundry'] },
  { id: 'downtown', name: 'Financial District',
    blurb: 'The commercial heart of the city — high-rise galleries, high rent.',
    accent: '#3a352c', pos: { x: 47, y: 55 }, buildingIds: ['lobby', 'tower', 'exchange'] },
  { id: 'park', name: 'Park District',
    blurb: 'Green space and quiet — a pavilion among the gardens.',
    accent: '#4a6149', pos: { x: 13, y: 66 }, buildingIds: ['gatehouse', 'pavilion', 'conservatory'] },
  { id: 'waterfront', name: 'Waterfront',
    blurb: 'Docks and open water — vast warehouse space for little rent.',
    accent: '#2f4a55', pos: { x: 50, y: 86 }, buildingIds: ['boathouse', 'warehouse', 'terminal'] },
];
export function districtOfBuilding(buildingId: string): DistrictDef | null {
  return DISTRICTS.find(d => d.buildingIds.includes(buildingId)) || null;
}

/* --- research tiers (Nth extra specialty) ------------------ */
export const RESEARCH_TIERS = [
  { fameReq: 20,  fee: 1200 },
  { fameReq: 60,  fee: 2500 },
  { fameReq: 130, fee: 4500 },
  { fameReq: 240, fee: 7000 },
];

/* --- advertising ------------------------------------------- */
export const AD_CAMPAIGN = { cost: 700, weeks: 4, visitorMult: 1.4 };

export const START = {
  funds: 50000,
  roomCost: 20000,
  eventChancePerSpecialty: 0.5,
  maxEventsPerWeek: 3,
  defaultTicket: 8,            // starting ticket price
};

/* ============================================================
   AUCTION HOUSES
   Three fame-gated houses. Each has a rarity mix (weights for
   Common / Uncommon / Rare / Epic / Legend) and a join fee paid
   once. Lots still skew toward the player's unlocked styles, but
   the RARITY spread is set by the house. World Icons never appear
   in any house. More specialised houses can be added later.
   ============================================================ */
export interface AuctionHouseDef {
  id: string;
  name: string;
  blurb: string;
  fameToUnlock: number;       // fame needed before the house opens
  joinFee: number;            // one-time fee to gain access
  attendFee: number;          // fee charged each time you attend
  /** rarity weights: [common, uncommon, rare, epic, legend] */
  rarityWeights: [number, number, number, number, number];
  worldOnly?: boolean;        // only World League museums may join
  iconWeight?: number;        // weight for World Icons (otherwise never sold)
}
export const AUCTION_HOUSES: AuctionHouseDef[] = [
  {
    id: 'house1',
    name: 'The Old Quarter Saleroom',
    blurb: 'A modest saleroom of estate clearances and minor lots.',
    fameToUnlock: 0, joinFee: 0, attendFee: 0,
    rarityWeights: [82, 14, 4, 0, 0],
  },
  {
    id: 'house2',
    name: 'Harringate & Cole Auctioneers',
    blurb: 'An established house drawing finer regional collections.',
    fameToUnlock: 120, joinFee: 200, attendFee: 60,
    rarityWeights: [75, 15, 9, 1, 0],
  },
  {
    id: 'house3',
    name: 'The Belvedere Rooms',
    blurb: 'A world auction house where legendary works change hands.',
    fameToUnlock: 600, joinFee: 1500, attendFee: 250,
    rarityWeights: [50, 20, 15, 12, 3],
  },
  {
    id: 'house4',
    name: 'The Meridian Evening Sale',
    blurb: 'Black tie, phone banks, and the works museums wait decades for.',
    fameToUnlock: 1500, joinFee: 25000, attendFee: 2000,
    rarityWeights: [0, 0, 0, 55, 35], worldOnly: true, iconWeight: 10,
  },
];

/* --- the three rival players' names ------------------------ */
/* the player's cousins — fellow grandchildren who each inherit one
   of the grandparent's heirloom works and become rival curators. */
export const RIVAL_NAMES = [
  'Cousin Marchetti',
  'Cousin Adler',
  'Cousin Thorne',
];

/* --- expeditions ------------------------------------------- */
/* Four tiers. The player picks a tier; it sets the cost and the
   board the dig mini-game lays out. Common/Uncommon boards yield
   whole objects; Rare/Epic boards yield shards, banked toward a
   summon. An expedition runs EXPEDITION_WEEKS before it can be
   played out. */
export interface ExpeditionTierDef {
  id: 'common' | 'uncommon' | 'rare' | 'epic';
  name: string;
  blurb: string;
  cost: number;
  gridSize: number;        // NxN board
  digs: number;            // tiles the player may reveal
  bombs: number;           // "lose everything" tiles on the board
  bombTolerance: number;   // bombs you may hit before ejection
  artifacts: number;       // whole objects hidden on the board (0 = shards only)
  shardTiles: number;      // shard caches on the board
  yieldsObjects: boolean;  // true: find whole works; false: shards only
}

export const EXPEDITION_TIERS: ExpeditionTierDef[] = [
  {
    id: 'common', name: 'Common Expedition',
    blurb: 'A short, well-trodden dig. Low cost, low risk — you should '
      + 'come home with a Common work or two.',
    cost: 10000,
    gridSize: 5, digs: 9, bombs: 2, bombTolerance: 2,
    artifacts: 2, shardTiles: 4, yieldsObjects: true,
  },
  {
    id: 'uncommon', name: 'Uncommon Expedition',
    blurb: 'A harder site. Costlier, and the board is tighter — at most '
      + 'one Uncommon work, and not every run finds it.',
    cost: 25000,
    gridSize: 5, digs: 8, bombs: 2, bombTolerance: 2,
    artifacts: 1, shardTiles: 5, yieldsObjects: true,
  },
  {
    id: 'rare', name: 'Rare Expedition',
    blurb: 'Dangerous ground. A single wrong dig ends the run. No whole '
      + 'works — you bank Rare shards toward a summon.',
    cost: 50000,
    gridSize: 6, digs: 10, bombs: 3, bombTolerance: 1,
    artifacts: 0, shardTiles: 8, yieldsObjects: false,
  },
  {
    id: 'epic', name: 'Epic Expedition',
    blurb: 'Treacherous and costly. Four ways to lose everything, and one '
      + 'is enough. You bank Epic shards toward a summon.',
    cost: 100000,
    gridSize: 6, digs: 11, bombs: 4, bombTolerance: 1,
    artifacts: 0, shardTiles: 10, yieldsObjects: false,
  },
];

/* shards needed to summon a work of the given rarity, in a style */
export const SUMMON_COST: Record<'rare' | 'epic', number> = {
  rare: 30,
  epic: 50,
};

/* expedition runs this many weeks before it can be played out */
export const EXPEDITION_WEEKS = 4;

/* ============================================================
   STATIC COMPETITOR MUSEUMS
   Real-inspired, freely invented numbers. Numbers never change —
   they are fixed benchmarks the player's stats are measured
   against. `inYourCity` museums also appear in the City ranking.
   Tiers: 8 global, ~17 national, rest regional/local.
   ============================================================ */
export const STATIC_MUSEUMS: StaticMuseum[] = [
  /* --- global icons (8) --- */
  { id: 'louvre',      name: 'The Louvre',                 city: 'Paris',     tier: 'global', inYourCity: false, fame: 4320, quality: 2100, visitors: 85800 },
  { id: 'british',     name: 'The British Museum',         city: 'London',    tier: 'global', inYourCity: false, fame: 3870, quality: 2300, visitors: 109400 },
  { id: 'met',         name: 'The Metropolitan Museum',    city: 'New York',  tier: 'global', inYourCity: false, fame: 3690, quality: 1950, visitors: 88700 },
  { id: 'prado',       name: 'Museo del Prado',            city: 'Madrid',    tier: 'global', inYourCity: false, fame: 3060, quality: 1850, visitors: 122600 },
  { id: 'vatican',     name: 'The Vatican Museums',        city: 'Vatican',   tier: 'global', inYourCity: false, fame: 3420, quality: 2000, visitors: 70800 },
  { id: 'uffizi',      name: 'The Uffizi Gallery',         city: 'Florence',  tier: 'global', inYourCity: false, fame: 2970, quality: 1700, visitors: 101900 },
  { id: 'hermitage',   name: 'The State Hermitage',        city: 'St. Petersburg', tier: 'global', inYourCity: false, fame: 3150, quality: 1900, visitors: 112300 },
  { id: 'palace-mus',  name: 'The Palace Museum',          city: 'Beijing',   tier: 'global', inYourCity: false, fame: 3240, quality: 1600, visitors: 137600 },

  /* --- national (17) --- */
  { id: 'reinasofia', name: 'Museo Reina Sofía',           city: 'Madrid',    tier: 'national', inYourCity: false, fame: 2120,  quality: 860,  visitors: 8200 },
  { id: 'smithsonian',name: 'The Smithsonian',             city: 'Washington',tier: 'national', inYourCity: false, fame: 2530, quality: 940,  visitors: 11000 },
  { id: 'nationalgal',name: 'The National Gallery',        city: 'London',    tier: 'national', inYourCity: false, fame: 2420, quality: 1120, visitors: 41900 },
  { id: 'orsay',      name: "Musée d'Orsay",               city: 'Paris',     tier: 'national', inYourCity: false, fame: 2250,  quality: 1010, visitors: 8800 },
  { id: 'rijks',      name: 'The Rijksmuseum',             city: 'Amsterdam', tier: 'national', inYourCity: false, fame: 2320, quality: 1080, visitors: 18800 },
  { id: 'natmuschina',name: 'National Museum of China',    city: 'Beijing',   tier: 'national', inYourCity: false, fame: 2000,  quality: 760,  visitors: 12500 },
  { id: 'anthro-mx',  name: 'National Anthropology Museum',city: 'Mexico City',tier:'national', inYourCity: false, fame: 1250,  quality: 880,  visitors: 6400 },
  { id: 'egyptmus',   name: 'The Egyptian Museum',         city: 'Cairo',     tier: 'national', inYourCity: false, fame: 2160,  quality: 1240, visitors: 5200 },
  { id: 'tokyonat',   name: 'Tokyo National Museum',       city: 'Tokyo',     tier: 'national', inYourCity: false, fame: 1890,  quality: 900,  visitors: 7300 },
  { id: 'tate',       name: 'Tate Modern',                 city: 'London',    tier: 'national', inYourCity: false, fame: 2280,  quality: 740,  visitors: 10200 },
  { id: 'moma',       name: 'The Museum of Modern Art',    city: 'New York',  tier: 'national', inYourCity: false, fame: 2480, quality: 820,  visitors: 8600 },
  { id: 'natindia',   name: 'National Museum of India',    city: 'New Delhi', tier: 'national', inYourCity: false, fame: 1590,  quality: 720,  visitors: 4800 },
  { id: 'pushkin',    name: 'The Pushkin Museum',          city: 'Moscow',    tier: 'national', inYourCity: false, fame: 1470,  quality: 700,  visitors: 4100 },
  { id: 'kunsthist',  name: 'Kunsthistorisches Museum',    city: 'Vienna',    tier: 'national', inYourCity: false, fame: 1750,  quality: 880,  visitors: 4600 },
  /* national museums in YOUR city (2) */
  { id: 'city-natl-1',name: 'The Whitlock National Museum',city: 'Your City', tier: 'national', inYourCity: true,  fame: 1610,  quality: 660,  visitors: 5200 },
  { id: 'city-natl-2',name: 'The Grand Civic Museum',      city: 'Your City', tier: 'national', inYourCity: true,  fame: 1430,  quality: 720,  visitors: 4400 },
  /* global museum in your city (1) */
  { id: 'city-global',name: 'The Imperial Museum',         city: 'Your City', tier: 'global',   inYourCity: true,  fame: 2700, quality: 1450, visitors: 16000 },

  /* --- regional (12) --- */
  { id: 'reg-1', name: 'Ashbourne Museum of Art',  city: 'Ashbourne',  tier: 'regional', inYourCity: false, fame: 480, quality: 300, visitors: 8600 },
  { id: 'reg-2', name: 'The Castleton Gallery',    city: 'Castleton',  tier: 'regional', inYourCity: false, fame: 390, quality: 360, visitors: 8900 },
  { id: 'reg-3', name: 'Fairhaven Art Institute',  city: 'Fairhaven',  tier: 'regional', inYourCity: false, fame: 570, quality: 320, visitors: 8200 },
  { id: 'reg-4', name: 'The Linden Collection',    city: 'Linden',     tier: 'regional', inYourCity: false, fame: 350, quality: 280, visitors: 3100 },
  { id: 'reg-5', name: 'Pemberton Museum',         city: 'Pemberton',  tier: 'regional', inYourCity: false, fame: 500, quality: 340, visitors: 8600 },
  { id: 'reg-6', name: 'The Hartwell Gallery',     city: 'Hartwell',   tier: 'regional', inYourCity: false, fame: 420, quality: 260, visitors: 8800 },
  { id: 'reg-7', name: 'Brightwater Art Museum',   city: 'Brightwater',tier: 'regional', inYourCity: false, fame: 600, quality: 380, visitors: 8200 },
  { id: 'reg-8', name: 'The Aldermoor Institute',  city: 'Aldermoor',  tier: 'regional', inYourCity: false, fame: 380, quality: 310, visitors: 3000 },
  { id: 'reg-9', name: 'Crestfield Museum',        city: 'Crestfield', tier: 'regional', inYourCity: false, fame: 550, quality: 290, visitors: 8400 },

  /* --- regional, in YOUR city (3 static local-tier benchmarks) --- */
  { id: 'city-loc-1', name: 'The Rosewood Gallery',  city: 'Your City', tier: 'local', inYourCity: true, fame: 120,  quality: 80,  visitors: 520 },
  { id: 'city-loc-2', name: 'Maple Street Museum',   city: 'Your City', tier: 'local', inYourCity: true, fame: 180, quality: 120, visitors: 1300 },
  { id: 'city-loc-3', name: 'The Old Mill Gallery',  city: 'Your City', tier: 'local', inYourCity: true, fame: 260, quality: 170, visitors: 800 },
  /* regional, in your city (3) */
  { id: 'city-reg-1', name: 'The Beaumont Museum',   city: 'Your City', tier: 'regional', inYourCity: true, fame: 450, quality: 290, visitors: 8900 },
  { id: 'city-reg-2', name: 'Harborview Art Museum', city: 'Your City', tier: 'regional', inYourCity: true, fame: 530, quality: 350, visitors: 8600 },
  { id: 'city-reg-3', name: 'The Sterling Collection',city:'Your City', tier: 'regional', inYourCity: true, fame: 410, quality: 330, visitors: 3000 },
];

/** a district's starter building */
export function starterBuilding(districtId: string): string {
  const d = DISTRICTS.find(x => x.id === districtId);
  return d?.buildingIds.find(id => BUILDINGS[id]?.starter) || 'local';
}
