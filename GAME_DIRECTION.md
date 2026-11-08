# Art Director — Game Direction Proposal

> From a rented room to a world-renowned museum, and every career ends
> with a different museum.

This is a design proposal, not a changelog. It covers where the game is
today (v0.7), what holds it back, the direction for each of the five
goals, a list of new requirements, and a phased roadmap.

---

## 1. Where the game stands (v0.7)

### What's already strong
- **A great catalogue.** About 610 real, hand-written works across 13
  styles, plus 300 procedural commons. This is the game's biggest asset
  and most of it goes unused.
- **The opening.** The grandparent's will and the cousins who inherit
  the two works you leave behind is a good story hook.
- **Several acquisition channels**, each with its own mini-game:
  real-time auctions, a dig board, gala conversations and a black market
  with authentication.
- **An exhibition model** with themed rooms, cohesion between works,
  a curatorial thesis, decor and interpretation.
- **A world.** City districts, building moves, several museums, rivals
  and rankings against real-inspired institutions.

### What holds it back
I measured these with a headless 52-week simulation using the engine.

| # | Problem | Evidence |
|---|---------|----------|
| 1 | **Fame has no ongoing engine.** It only goes up as a one-off bump when you acquire a work. Visitors, exhibitions and reviews never add fame. | Passive year: fame 0 → 0. The cousins reached 54, 95 and 116 on fixed scripts. |
| 2 | **Money barely moves.** Revenue is about §2.0k a week against §1.75k upkeep. Cash went from §50k to §57k over a year. No pressure means no tactics. | `advanceWeek` sim |
| 3 | **Few exciting moments.** The starter house offered 176 commons, 5 uncommons and 1 rare in a year. Epics and Legends need 600 fame, which is unreachable if fame doesn't grow. | `rollEvents` sample |
| 4 | **Systems look connected but aren't.** Thesis, decor style, assigned curators and style research feed `detailedRoomRatings`, which only the UI reads. Visitors and revenue use the simpler `roomRatings`. | `director.ts` vs `game.ts:dailyVisitors` |
| 5 | **No sense of "how far we've come".** History keeps the last 12 weeks only. | `history.slice(-12)` |
| 6 | **Every museum plays the same.** Districts only change visitor numbers by ±12%. Styles are reskins. The best strategy is always "hang the highest score". | `districtMult`, `artifactDailyDraw` |
| 7 | **Breadth over depth.** 9 nav destinations, 4 mini-games with their own currencies (shards, patience, bombs, dossiers), and many exact-money knobs: ticket §, three upgrade tracks per room, sponsor terms. | UI |
| 8 | **No career arc.** Play is open-ended with no week cap. `finalScore` exists but nothing triggers it. The README still says "50-week". | `advanceWeek` |

**Summary:** most of the pieces are already there. The next step is to
connect and deepen the systems, not add more of them.

---

## 2. The direction in one paragraph

You are the **Director**. A **career** runs about 25 in-game years, in
**seasons**. Each season you make a few weighty decisions: what to
acquire, what to exhibit, where the budget goes, and which initiatives
your limited staff pursue. Then you watch the season play out, with
interruptions for auctions, discoveries and crises. Your museum climbs a
**league ladder** (City → National → World) with promotion moments and
an **Annual Report** that shows how far you've come. *Where* you found
the museum, *what* you collect and *how* you fund it give each career a
different identity. A finished career goes into a Hall of Fame and the
next one starts in a freshly generated city.

### A day in the life: the first year of a career
The target pace is about 5–10 minutes per season, about 30 per year,
and about 10–12 hours per 25-year career.

**Founding (once, 2–3 min).**
- Founder: *Heir*. You take the Roman marble head, and Cousin Marchetti
  takes the Baroque sketch, so they'll bid on Baroque lots.
- District: *Academic*. Research is twice as fast and grants are
  available, but students won't pay much.
- Focus: *Antiquities*. Name: *The Meridian Institute*.
- You start in one rented room with §40k and 2 initiatives per season.

**Spring: plan (2 min).**
- Budget sliders: Acquisitions 50 / Exhibitions 20 / Marketing 10 /
  Operations 20.
- Feature the marble head alone: *"A Face from Rome."*
- Spend the 2 initiatives on a university grant and an excavation
  permit.
- Forecast: about 25 visitors a day, a slight loss, 9 months of
  runway.

**Spring: play (5 min, "Sim to next event").**
- Week 2, a rumour: Roman bronzes are expected in about 5 weeks. Save
  for them, or fill the walls now?
- Week 4: an estate lot reveals a *"Circle of a Hellenistic workshop"*
  bronze for §3.8k, plus two Roman lamps. The room's cohesion goes up.
- Week 7: you're outbid on the Rare bronze. It hurts, and you'll plan
  for it next time.
- Weeks 9 and 11: the grant arrives (+§12k, Prestige +3) and the
  permit is granted.

**Spring: review (1 min).**
- *"Visitors +60%: new Roman room (+40%), student word-of-mouth (+20%).
  Rank City #9 → #8."*
- One line of advice: *"Visitors want labels."*

**Summer.**
- A new hire gives you a third initiative.
- The dig crate reveals a partial inscribed stele.
- Attribution research on the bronze comes back: **"It's an original."**
  It becomes an Epic, gets a front page and becomes your Signature Work.

**Year-end Annual Report.**
- 1 room / 25 per day → 2 rooms / 110 per day. Collection value §18k →
  §140k.
- Award: *Discovery of the Year*. Critic: ★★★ *"Small, scholarly, and
  lucky. Mostly scholarly."*
- Next goal: City Top 3 unlocks Harringate & Cole.

**By year 5, a season looks like this:**
- Plan: rebalance the budget, choose blockbuster vs permanent, spend
  about 4 initiatives.
- Play: 2–4 interruptions.
- Review: deltas, plus one problem to fix.

The thinking is never about exact amounts. It's questions like *"4
initiatives and §60k: chase the Vermeer rumour, fund the excavation, or
fix Room 3?"*

---

## 3. Pillar 1: Collectibles and excitement

The aim is for a Legend to feel like signing a star player, and for a
sleeper discovery to feel like your academy kid turning into a
world-beater.

### 3.1 Make every work more than a score
Add three light attributes to `Artifact`. They are generated per career
for the handcrafted works, so no data entry is needed.

- **Attribution:** `Confirmed` / `Attributed to` / `Workshop of` /
  `Circle of`. Lower attribution means a much lower price and draw. Research
  can **upgrade** it.
- **Condition:** `Pristine` / `Good` / `Needs conservation`. Conservation
  costs a season of the work being off the wall, and then it shines.
- **Provenance:** `Clean` / `Gaps` / `Disputed`. Disputed works bring
  scandal risk and repatriation claims. This folds the black market into
  the main game.

### 3.2 The sleeper mechanic
The most exciting moment a collector has is **finding** a masterpiece,
not buying one.

- Some lots are *"Circle of Caravaggio, oil on canvas, §4,000"*.
- A researcher assigned to it for a season may come back with **"It's a
  Caravaggio."** The work's score jumps to its true value, with a headline
  and a visitor spike.
- Most come back as "workshop piece, pleasant". The odds depend on your
  scholars' expertise in that style.
- This reuses the black-market dossier UI and gives research a purpose
  you can feel.

### 3.3 A Catalogue with silhouettes
The vault currently shows owned works only. Add a **Catalogue** view per
style: *"Renaissance — 7 of 64 known works"*, with silhouettes for
missing works and a hint of where each might surface. Nearly 600 real
works make this a strong long-term collection goal.

### 3.4 Sets and series
Group works into named **sets**: an artist (5 Vermeers), a series (the
Hokusai views), or an assemblage (Book of Hours leaves, Terracotta
guard). Completing a set gives a named bonus, such as *"The Vermeer
Room" +prestige*, plus a Catalogue badge. Rivals may own the piece you
need, which leads to trade or loan negotiations.

### 3.5 Anticipation, not just supply
- **Market rumours:** *"The Delacroix estate is expected at The
  Belvedere Rooms in ~6 weeks."* You decide whether to save up, sell
  something, or court a donor. Anticipation is half the fun.
- **A guaranteed headline lot** every season at your league's top house,
  plus a soft pity timer so rarity rolls never leave you dry for a year.
- **Named rival bidders.** Cousin Marchetti bids on Baroque works
  because that's their focus. Losing a Legend to them and then seeing it
  in their museum's ranking creates a real rivalry.

### 3.6 The reveal
- When the hammer falls, show a **card reveal** with rarity colour,
  frame and catalogue number.
- Your first Epic, first Legend and first World Icon each get a
  full-screen **press moment**, a newspaper front page, and a marker on
  the progression chart.
- **Images:** most works before about 1900 are public domain (Wikimedia
  Commons). Even 100 images for the Rare+ works would change how the
  game feels. Use stylised frames for works still under copyright.

### 3.7 The Signature Work
Each museum chooses one **Signature Work** for its poster. It drives
tourist demand and appears on the title card, in the Annual Report and
in the Hall of Fame. Replacing it with something better is a milestone.

### 3.8 Crates and reveals (the pack-opening moment)
Every luck-based channel ends in the **same ritual**, the way a Football
GM pack does. It might be a Rare 71 or a Common 59; here it might be a
Rare bronze or a Common worn coin.

**Crate sources**

| Source | How you get it | Cards | Twist |
|---|---|---|---|
| **Dig crate** | An expedition returns | 3–6 | The dig board you play sets the card count and tier |
| **Estate lot** | Bought at auction "sight unseen" | 3–5 | Cheap, mostly commons, with a sleeper chance |
| **Dealer portfolio** | Black market | 2–3 | A card may flip to **Forgery** |
| **Bequest** | A donor dies (Patronage) | 1–3 | Rare and up, guaranteed |
| **Studio visit** | Contemporary runs | 3 | Emerging-artist works with hidden potential |

**The reveal**
1. Cards come out face down. **The frame colour shows first**: grey,
   green, blue, purple, gold, crimson.
2. You flip them one by one, best last.
3. Each card shows **score** (like overall rating), **type** (like
   position: Painting, Sculpture, Manuscript, Object), **style**, and
   **fit** with your museum. Off-focus works are valuable but
   misplaced, like a great goalkeeper when you needed a striker.
4. **A second roll:** attribution and condition. A "Circle of" coin can
   become a sleeper after research (§3.2).
5. **Legend and World Icon** pulls dim the screen, glow gold and make
   the front page.

**Openly shown odds (example)**

| Crate tier | Common | Uncommon | Rare | Epic | Legend+ |
|---|---|---|---|---|---|
| Field dig | 70% | 22% | 7% | 1% | — |
| Major excavation | 40% | 30% | 22% | 7% | 1% |
| Legendary site | 15% | 25% | 35% | 20% | 5% |

**Shards become "dust" from bad pulls.** There is one currency instead
of today's 26 balances (2 tiers × 13 styles).
- *Earned from:* duplicates, unwanted off-focus works, forgeries and
  failed dig tiles.
- *Spent on:* rerolling a card, upgrading a crate's tier, or filling the
  **pity meter**. The meter guarantees a Rare+ every 8 crates and is
  shown on screen.

**It stays management:**
- A crate costs an initiative, a season and budget. In the same slot
  you could buy a known Uncommon at auction.
- Misfits go to market, trade or loan instead of sitting in storage.
- Each museum type has better odds in its own channel: Academic → dig
  crates, Financial → studio crates, Art District → estate lots.
- Crates are bought with in-game money only, never real money.

---

## 4. Pillar 2: Progression you can see

### 4.1 Keep the whole career
- Keep full history: weekly for the current year, then compressed to
  monthly.
- Track more than visitors: size (rooms and works on display),
  collection value, average art quality, the three reputations
  (§5.2), league rank and staff count.

### 4.2 The Annual Report (the "season recap")
At each year's end, show one page (FBGM's season summary):
- Year-over-year table: **Year 1 → Year N** for visitors/day, rooms,
  works, collection value and rank.
- Acquisition of the Year, Exhibition of the Year, best and worst
  decision.
- **Critic review**: a 1–5 star score plus a short quote, e.g.
  *"A small museum with a big Vermeer."*
- Awards: Museum of the Year (city, national or world), Best New
  Exhibition, Discovery of the Year.

### 4.3 Then vs Now
- A side-by-side of the **floor plan from Year 1** and the plan today.
- A **building exterior** that changes per tier, from shopfront to
  civic hall to palace.
- A **Museum History** page listing every year, like FBGM's team
  history page.

### 4.4 Milestones
Examples: first 100 visitors/day, first Epic, first move, first
international loan, first completed set, promoted to National, entered
the World Top 50. Each one is logged with its date, so the timeline
reads like a chronicle.

---

## 5. Pillar 3: Management at the core

The goal is meaningful choices with a few resources, not accounting.

### 5.1 Four resources, each scarce in a different way

| Resource | What it is | Why it's scarce |
|----------|-----------|-----------------|
| **Budget** | Money, split into a few budget lines per season | Revenue must exceed upkeep, and acquisitions compete with operations |
| **Space** | Wall slots and rooms | Better works compete for the same walls, so storage, rotation and lending all matter |
| **Staff time** | Initiatives per season (start at 2, grow to about 6) | Each initiative uses one: research an attribution, court a donor, run a campaign, send an expedition, negotiate a loan |
| **Reputation** | Three tracks (below) | You can't max all three, so you choose an identity |

**Initiatives** are the key addition. They turn "do everything every
week" into "pick three things this season".

### 5.2 Split fame into three reputations

| Reputation | Earned by | Unlocks |
|------------|-----------|---------|
| **Prestige** (critics, scholars) | Quality, research, scholarly catalogues, sets | Top auction houses, museum loans, grants, academic partners |
| **Popularity** (public, tourists) | Visitors, blockbusters, the Signature Work, marketing | Ticket and retail revenue, corporate sponsors |
| **Patronage** (donors, collectors) | Galas, memberships, naming rights, trust | Donations, bequests, endowment, gala loans |

**League rank** is a weighted mix of the three, so different museums can
all rise, by different routes. The three also make fame **ongoing**:
every season the museum earns reputation from what it is, not only from
what it just bought.

### 5.3 The season loop (replaces "do everything every week")
1. **Plan (one screen):**
   - Budget split across Acquisitions, Exhibitions & Education,
     Marketing, Operations and Reserves (5 sliders).
   - Choose the season's featured exhibition.
   - Spend your initiatives.
2. **Play:** weeks run automatically, with **"Sim to next event"** and
   **"Sim to end of season"** buttons. Auctions, discoveries, rumours,
   crises and offers interrupt.
3. **Review:** a delta report with causes, e.g. *"Visitors +14%: new
   Turner (+9%), spring campaign (+5%). Prestige −2: off-theme hang in
   Room 3."*

### 5.4 Tactical tradeoffs to design for
- One masterpiece **or** three rooms of solid works.
- Free admission (popularity and donations) **or** paid (cash).
- **Deaccession** a duplicate to fund a Legend, at a cost in patronage
  ("donors hate it").
- **A loaned blockbuster** (a big temporary spike) **or** a permanent
  acquisition (slower but lasting).
- **Research** (slow prestige, possible sleeper discoveries) **or**
  **marketing** (fast popularity that fades).
- **Lend your star** to a world museum for a season: you lose the draw,
  but gain prestige and a favour back.
- **Move to a bigger building** (more space and prestige) while upkeep
  roughly triples.

### 5.5 Connect what exists
- **One rating model.** Make `detailedRoomRatings` feed visitors and
  reputation, and delete the duplicate `roomRatings` path.
- **Rivals live in the market.** They bid, buy, lend and grow based on
  what they acquired, not on fixed scripts.
- **The mini-games stay, but cost initiatives**, and all of them pay
  into the same few outcomes: works, reputation and money. The luck
  channels resolve as **crates** (§3.8), and the per-style shard
  balances become one universal **dust** currency.

---

## 6. Pillar 4: Replayability through museum identity

The FBGM parallel: a new team, a new league and a new style of play.
Here, each career's identity comes from **District × Focus × Funding
model × Founder**.

### 6.1 Founding draft (start of career)
1. **Founder background**, which sets starting resources and one perk:
   - *Heir*: the inheritance work, rivals are cousins (today's opening).
   - *Academic*: university ties, faster research, low cash.
   - *Entrepreneur*: high cash, strong sponsor deals, low prestige.
   - *Artist*: living-artist network, cheap commissions.
   - *Collector*: three modest works, plus galas unlocked early.
2. **District**, which now has a rule twist, not a ±12% multiplier.
3. **Focus**: a style, or a cross-style theme such as *Antiquities*,
   *Old Masters*, *Modern & Contemporary* or *World Cultures*.

### 6.2 Districts with real rules

| District | Audience | Twist |
|----------|----------|-------|
| **Financial** | Professionals, corporate | Sponsors are plentiful; **shop, café and events can out-earn tickets**; the contemporary market is hot; works' fame matters less than experience |
| **Academic / College** | Students, scholars, international researchers | Research ×2, **grants instead of sponsors**, low ticket tolerance, **excavation partnerships** with the university |
| **Historic** | Tourists | Heritage buildings carry prestige but **limited expansion**; heavy seasonal tourism |
| **Art District** | Collectors, critics | Galas are frequent and the best houses are nearby; **rivals are strongest here** |
| **Bohemian** | Artists, young locals | Cheap space, **artist residencies**, works by living artists appreciate faster |
| **Waterfront** | Nightlife, families | Huge, cheap space; **immersive and event** exhibitions; flood and insurance events |
| **Park** | Families, locals | Sculpture garden; strong membership; slow but steady |

### 6.3 Each museum type has its own acquisition channel

| Museum type | Main channel | Feel |
|-------------|-------------|------|
| **Archaeological** | Expeditions and excavation permits; university partnerships; **repatriation claims** as an ethical risk | Long bets, legendary finds |
| **Old Masters** | Auctions, estates and bequests | Bidding wars, sleeper attributions |
| **Contemporary** | **Living-artist commissions and residencies** | Scouting and player development (below) |
| **Pop culture / design** | Donations, fan collections, licensing | Retail-heavy, fast popularity |
| **World cultures** | Loans and exchanges with other museums | Diplomacy, partnerships |

### 6.4 Living artists (the "draft and development" system)
This is FBGM's player development applied to art, and it's the system
your financial-district example needs.

- A procedural pool of **emerging artists**, each with a style, a
  current reputation and a hidden **potential**.
- You **commission** works cheaply, **host residencies** (one per
  season, costing an initiative) and give them **solo shows**.
- Artists' careers rise, plateau, scandalise or break out over the
  years. **Works by artists who break out are revalued**: a §3k
  commission from Year 2 can become a Legend by Year 15.
- An artist "you discovered" who becomes world-famous is a career
  highlight, with Annual Report awards and a Hall of Fame entry.
- Rivals scout the same artists, so you compete to sign them.

### 6.5 Funding models
Revenue mix is part of identity and can be read in the Annual Report:

- **Ticket-led:** tourist museums.
- **Membership-led:** local and park museums.
- **Retail and events-led:** financial and waterfront museums.
- **Grants and endowment-led:** academic and prestige museums.

Each model reacts to different decisions. That gives two careers a
visibly different revenue pie, which shows the game really did play out
differently.

### 6.6 Career end and the next career
- **Career length** is chosen at start: 15 years (short), 25 (standard)
  or Endless.
- **Retirement** produces a career summary, a legacy score and a **Hall
  of Fame** entry with the museum name, signature work, peak rank, best
  discovery and a floor-plan thumbnail.
- **New world each career:** a generated city name, district layout
  (not every city has every district), rival museums with their own
  focus, and a market shuffle (which works are "in circulation").
- **Legacy:** your past museums appear as institutions in the world
  rankings of later careers, and can lend to you.
- **Scenarios** (later): *Rescue a bankrupt museum*, *No inheritance*,
  *The Repatriation Crisis*.

---

## 7. Pillar 5: Complexity at the FBGM level, not Football Manager

**Rule of thumb:** the player sets direction, the sim does the
arithmetic, and the report explains the results.

| Today | Proposed |
|-------|----------|
| Exact ticket price in § | 4 presets: Free / Low / Standard / Premium |
| 3 upgrade tracks × 3 levels per room | One **Presentation tier** per room (Basic → Fine → Landmark), plus the decor style choice |
| Sponsor cash amounts and term weeks | "Sign a sponsor: Small / Major / Naming rights" with clear effects |
| Weekly clicking | Season planning plus "Sim to next event / end of season" |
| 9 nav destinations | **4 hubs:** Museum (floor and exhibitions) · Acquire (auctions, dealers, digs, galas, artists) · Institution (staff, research, budget) · World (city, league, rivals, history) |
| Hidden formulas | **Every number has a "why"** tooltip listing its top 3 contributors |

You should still be able to see that a decision made a difference. The
review screen's cause-and-effect deltas are the single most important
UI addition for this pillar.

---

## 8. New requirements

### Foundation (fix before adding)
- **R1** One room rating model drives visitors, revenue and reputation.
- **R2** Reputation (prestige, popularity, patronage) accrues every week
  from operations, not only from acquisitions.
- **R3** Keep full career history (weekly for the current year, monthly
  before that).
- **R4** Rivals take part in auctions and grow from what they acquire.
- **R5** Rarity supply follows a designed curve: a headline lot per
  season and a pity timer.
- **R6** "Sim to next event" and "Sim to end of season" controls.
- **R7** Break even by about week 8 when playing sensibly. Running at a
  loss is possible when the player overreaches, and is never an
  automatic death spiral.

### Collectibles
- **R8** Works carry attribution, condition and provenance, generated
  per career.
- **R9** Attribution research can upgrade a work (the sleeper mechanic).
- **R10** A Catalogue with silhouettes for unowned works, and per-style
  completion.
- **R11** Sets with named bonuses.
- **R12** Market rumours announce headline lots in advance.
- **R13** A card reveal on acquisition, and a press moment for a first
  Epic, Legend or World Icon.
- **R14** Choosing a Signature Work.
- **R15** Images for at least the Rare and higher public-domain works.
- **R33** A crate system: every luck-based channel (dig, estate lot,
  dealer, bequest, studio) resolves as a crate of 1–6 cards.
- **R34** A reveal sequence: face-down cards, frame colour first, flip
  one by one, best last, and a special treatment for Legend+.
- **R35** Cards show score, type, style and **fit**, plus a second roll
  for attribution and condition.
- **R36** Odds are shown per crate tier, and each channel's odds depend
  on museum type.
- **R37** Dust: one currency from bad pulls, spent on rerolls, crate
  upgrades and the pity meter (Rare+ every 8 crates, visible).
- **R38** Crates cost an initiative and budget, and are never bought
  with real money.

### Progression
- **R16** An Annual Report with a year-over-year table, critic review
  and awards.
- **R17** A League ladder (City → National → World) with promotion
  events.
- **R18** Museum History and milestone timeline pages.
- **R19** A Year 1 vs now floor-plan comparison, and a building exterior
  per tier.

### Management
- **R20** A season loop: Plan, then Play, then Review.
- **R21** Budget lines as season sliders.
- **R22** Initiatives as a limited resource that grows with staff.
- **R23** A review screen with cause-and-effect deltas.
- **R24** Simplified knobs: ticket presets, Presentation tier, sponsor
  tiers.
- **R25** Navigation in 4 hubs.

### Identity and replayability
- **R26** A founding draft: background, district and focus.
- **R27** District rule twists (§6.2).
- **R28** A main acquisition channel per museum type (§6.3).
- **R29** Living artists with potential, commissions, residencies and
  revaluation.
- **R30** Funding models with a visible revenue mix.
- **R31** Choice of career length, retirement and a Hall of Fame.
- **R32** A generated city and rival set per career, and legacy museums
  that appear in later careers.

### Visual identity
- **R39** One game name, with a logo and title screen.
- **R40** Images for public-domain works, and stylised cards for works
  under copyright and for procedural ones.
- **R41** One card language across crates, vault and catalogue: rarity
  frames, card backs and reveal effects.
- **R42** Building exteriors per tier, and floor styles per district and
  focus.
- **R43** A visual Annual Report and Hall of Fame, and a phone-first
  layout pass.
- **R43b** Three proposed visual identities to choose from (made with
  the design skills), then navigation, animations, shading and depth in
  the chosen one.

### Balance
- **R44** Sim bots per archetype, plus careless and optimal bots.
- **R44b** Three career stages (early fill, mid expand, late compete),
  each with its own bottleneck, visible transitions and target
  lengths.
- **R45** Target curves per milestone, checked in CI.
- **R46** Late-game spending sinks so income never outruns what's worth
  buying.
- **R47** Rival tuning: about 1 in 4 contested headline lots go to
  cousins, and they stay credible threats long term.
- **R48** Archetype parity, and a Relaxed / Standard / Ruthless
  difficulty setting.

---

## 9. Milestones

Each milestone is playable when it ships and has a **"done when"** check
that the headless balance sim (`npm run sim`) or a play session can
verify.

### M1 (v0.8): Make it breathe ✅ shipped, see VERSION_8_NOTES.md
**Scope:** R1–R7.
- One rating model.
- Weekly reputation: Prestige, Popularity, Patronage.
- Full career history.
- Rivals who bid at auctions and grow from what they buy.
- A paced rarity supply: a headline lot per season and a pity timer.
- "Sim to next opportunity".
- An economy with pressure.

**Done when:**
- Fame rises every week from operations alone.
- A sensible strategy reaches Harringate & Cole (120 fame) in roughly
  weeks 20–35.
- Thesis, decor and curators visibly change visitors.
- A Rare+ lot appears at least every 8 weeks.
- History covers the whole career.

### M2 (v0.9): The thrill ✅ shipped, see VERSION_9_NOTES.md (images moved to M7)
**Scope:** R8–R15 and R33–R38.
- Crates and the reveal sequence.
- Dust and the pity meter.
- Attribution and the sleeper mechanic.
- The Catalogue with silhouettes, and sets.
- Market rumours and the Signature Work.
- The first image pass.

**Done when:**
- Every dig, estate lot and dealer offer resolves as a crate.
- A first-year player sees at least one purple frame.
- Per-style shard balances are gone.

### M3 (v1.0): A career ✅ shipped (engine-first), see VERSION_10_NOTES.md; 4-hub nav and sponsor tiers moved to M7
**Scope:** R16–R25.
- The season loop with budget sliders and initiatives.
- A review screen with deltas.
- The Annual Report.
- The league ladder.
- Museum History and milestones.
- Simplified knobs.
- Navigation in 4 hubs.

**Done when:** one year is 4 seasons, about 30 minutes of play, and
ends with a report and a rank change.

### M4 (v1.1): Identity
**Scope:** R26–R28 and R30.
- The founding draft.
- District rule twists.
- An acquisition channel per museum type.
- Funding models.

**Done when:** two sim runs with different districts and focuses end
with visibly different revenue mixes and reputation profiles.

### M5 (v1.2): Living artists
**Scope:** R29.
- Emerging artists with hidden potential.
- Commissions, residencies and revaluation.
- Studio crates.
- Rivals scouting the same artists.

**Done when:** a §3k Year 2 commission can become an Epic+ by about
Year 10.

### M6 (v1.3): Legacy
**Scope:** R31–R32.
- Career length options and retirement.
- A Hall of Fame.
- Generated cities and rivals.
- Legacy museums in later careers.

**Done when:** finishing a career leads straight into a new one in a
different city.

### M7 (v1.4): Visual identity
**Scope:** R39–R43.
- **Process, as in the F1 and Football GM projects:** use the design
  skills to propose **3 distinct visual identities** as mock-ups of the
  same screens (floor, crate reveal, Annual Report). Pick one, then
  apply it everywhere. Example directions:
  - *Gilded Salon:* deep reds, gold leaf, serif type, oil-paint texture.
  - *Modern Institution:* white cube, a strong grid, one accent colour,
    museum-signage typography.
  - *Cosy Tycoon:* the current chunky pixel-dollhouse look, polished.
- **Navigation** redesigned with the chosen identity: the 4 hubs, a phone
  bottom bar, and clear "what needs me now" badges.
- **Motion and depth:**
  - Card flip and frame-glow animations for reveals.
  - Hammer-fall and "SOLD" animations at auction.
  - Visitors walking the floor.
  - Number tick-ups on review screens.
  - Layered shadows and shading for frames, rooms and panels.
  - Respect reduced-motion settings.
- Pick one name (*Art Director* vs *Museum Wars*), with a logo and
  title screen to match.
- Artwork images: public-domain images for real works, and a stylised
  frame-and-silhouette treatment for works under copyright and for
  procedural commons.
- Rarity frames, card backs and reveal effects that are consistent
  across crates, the vault and the catalogue.
- A museum exterior per building tier, and a floor plan that looks
  different per district and focus (marble halls, white cube,
  warehouse brick).
- A visual Annual Report and Hall of Fame, including the Year 1 vs now
  floor plan.
- A phone-first layout pass on every screen.

**Done when:** a screenshot of any two careers looks clearly different,
and every Rare+ work shows an image or a deliberate stylised card.

### M8 (v1.5): Balance
**Scope:** R44–R48.

**The three stages of a career** are the backbone of balance. Each one
has its own goal, bottleneck and target length:

| Stage | Goal | Bottleneck | Typical works | Target length |
|---|---|---|---|---|
| **Early: fill the gallery** | Fill a small gallery with *any* works: commons, coins, sketches, one or two lucky rares | Cash and wall space; every purchase matters | Common–Rare | Year 1–2 |
| **Mid: expand and diversify** | More rooms, a bigger building, new collections in different styles and topics, cohesive rooms and sets | Space, staff time, choosing which collections to grow | Uncommon–Epic | Years 2–8 |
| **Late: compete with the world** | One of the best museums in the world, built on Epic, Legendary and World Icon works | Supply of top works, rival competition, prestige | Epic–World Icon | Years 8+ |

- Each stage changes what "good play" means. Early you buy anything
  that hangs; mid you curate and specialise; late you hunt specific
  masterpieces and outbid the world.
- Stage transitions are visible moments in the Annual Report: *"Casa
  Arte is no longer a small gallery."*
- The sim bots must show all three stages in order, at roughly these
  lengths, for every archetype.
- Extend `npm run sim` with bot personalities, one per museum
  archetype, plus a careless bot and an optimal bot.
- Target curves per milestone: time to each league, first Epic, first
  Legend, first move, and cash runway. CI fails when a run leaves its
  band.
- Late-game economy: spending sinks (conservation, endowment, building
  wings) so income never outruns what's worth buying.
- Rival tuning: cousins should win roughly 1 in 4 contested headline
  lots, and at least one should stay a credible threat through Year 10.
- Archetype parity: every district and focus combination can reach
  World Top 50 within a standard career, by a different route.
- A difficulty setting (Relaxed / Standard / Ruthless) that changes
  rival aggression and the economy, not the rules.

**Done when:** across 50 simulated careers per archetype, every
target curve holds and no single strategy dominates.

### What to cut or fold in
- Per-style shard balances become one dust currency (M2).
- Three room upgrade tracks become one Presentation tier.
- Separate Research and Style Research merge into one knowledge tree per
  style, which also unlocks attribution research.
- Galas, black market and digs stay, but they live under **Acquire**
  and cost initiatives.
- Multiple simultaneous museums move to late game or are cut. One
  growing institution with branches (a "satellite" in another district)
  is easier to read.

### Naming
The repo is *Art Director* and the in-game title is *Museum Wars*. Pick
one. *Art Director* fits the "you are the director, making calls"
direction better.

---

## 10. Two example careers (the target experience)

**"The Exchange", Financial District, Contemporary, Entrepreneur.**
Year 1: a glass lobby, two rooms, a café that earns more than tickets.
You commission three unknown painters. Year 6: one of them, Ilse Moreau,
wins a major prize, and your §3k canvas is revalued as an Epic. Year 12:
the shop and events line is 55% of revenue, Popularity is high, Prestige
is middling, and you are national #8. The Annual Report's revenue pie
is mostly orange (retail).

**"The Meridian Institute", Academic District, Antiquities, Academic.**
Year 1: one rare stela and a university partnership. You spend your
initiatives on excavation permits and attribution research. Year 4: a
"Circle of" bronze turns out to be a lost Classical original, and you
get a front page. Year 9: a repatriation claim forces a choice between
returning a Legend (Prestige +, collection −) or fighting it (scandal
risk). Year 20: World #31 on Prestige alone, with grants and endowment
as the main revenue. Visitors are fewer but come from 40 countries.

The same game, the same 25 years, two very different museums.
