# Museum Wars v0.9: The Thrill (Milestone 2)

The pack-opening milestone from `GAME_DIRECTION.md`.

## Crates and the reveal (R33–R37)
- Every luck-based channel now ends in the same ritual: a **crate** of
  1–6 face-down cards (`src/engine/crates.ts`, `src/ui/crates.tsx`).
- **The reveal:**
  - Each card's frame glows in its rarity colour before you flip it.
  - Cards flip in order, and the best is always last.
  - A Legend or World Icon dims the screen and makes the front page of
    *The City Herald*.
- **Each card shows:** score, type (Painting, Sculpture, Manuscript,
  Object), style, year, rarity and **fit** ("Fits your museum" /
  "Off-focus"), plus a "Doubtful attribution" tag when relevant.
- **Openly shown odds** per crate tier:
  - Field 70/22/7/1/0
  - Major 40/30/22/7/1
  - Legendary 15/25/35/20/5 (8% of its Legend+ pulls are World Icons)
- **Dust:** salvage any card for dust (2 / 5 / 15 / 40 / 120 / 300 by
  rarity). Spend it on a **reroll** (10) or a **crate upgrade** before
  flipping (Field→Major 30, Major→Legendary 90).
- **Luck meter (pity):** a Rare-or-better card is guaranteed at least
  every 8 crates, and the meter shows how close you are.

### Crate sources
- **Dig crates:** expeditions no longer give shards. Every ★ find is a
  card and every 4 ◈ shards make another card (up to 6).
  - Common digs send a Field crate.
  - Uncommon and Rare digs send a Major crate.
  - Epic digs send a Legendary crate.
  - The dig board shows the crate filling up as you dig.
- **Estate lots:** about 30% of weeks, your best auction house offers a
  family estate sight unseen: 3–5 lots, priced at roughly 60–80% of
  their expected value.
- **Bequests:** donors leave the museum a free crate (1–3 cards,
  guaranteed Rare+). The chance grows with Patronage.
- Old per-style shard balances convert to dust.

## Attribution and sleepers (R8, R9)
- Works can surface as *Attributed to*, *Workshop of* or *Circle of*:
  - About 15% of Rare+ auction lots.
  - About 20% of crate cards.
- While doubtful, a work draws, rates, sells and prices at 60% / 30% /
  12% of its real strength.
- **Study attribution** (vault) puts a researcher on it for 4 weeks.
  Sleepers (40% / 20% / 10% by label, rolled per career) turn out to be
  the master's hand: full score, a prestige and popularity jump, and a
  DISCOVERY headline. The rest are settled as fine but lesser works.
- Doubtful works show their doubtful rarity everywhere (lots, auction,
  vault, detail), so sleepers can't be spotted early.

## Catalogue and sets (R10, R11)
- New **Catalogue & Sets** tab:
  - All 610 known works by style, with silhouettes for missing ones.
  - It shows which cousin holds a work.
- **15 artist sets** (the Monet Set, 10 works … the Caravaggio Set, 3).
  Completing one is a headline with a prestige bonus, plus extra
  prestige while the whole set is on display.

## Rumours and the Signature Work (R12, R14)
- Headline lots are **rumoured 4 weeks ahead** in the Calendar ("…is
  expected at Harringate & Cole in about 3 weeks"). Cousins won't buy a
  rumoured work before the sale.
- Make any displayed work your **Signature Work** (vault). It pulls its
  own crowd, lifts Popularity and shows on the museum floor.

## Time controls
- "Sim to next opportunity" also stops for:
  - A new crate.
  - A new rumour.
  - A finished attribution study.

## Deferred, by design
- **Images (R15):** moved to M7, so the art can be matched to the works
  carefully.
- **Condition and provenance:** a later pass.
- **Dealer-portfolio crates:** a later pass. The black market keeps its
  own authentication game for now.
- **Crate odds by museum type (R36):** M4.
- **Crates costing an initiative (R38):** M3.
