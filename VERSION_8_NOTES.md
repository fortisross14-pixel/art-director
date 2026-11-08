# Museum Wars v0.8 — Make It Breathe (Milestone 1)

The first milestone of `GAME_DIRECTION.md`. It adds no new screens.
It connects the existing systems so that decisions move the numbers.

## One rating model (R1)
- New `src/engine/ratings.ts` is the single source of room ratings.
- Thesis, decor style, assigned curators/educators, style research and
  room upgrades now change **visitors and revenue**. Before, they only
  changed the UI.
- Presentation has a larger effect on attendance than before.

## Reputation that grows from running the museum (R2)
- Fame is split into **Prestige** (quality, research, completed rooms),
  **Popularity** (visitors, publicists, campaigns) and **Patronage**
  (members, sponsors, loans). Headline fame is their sum.
- Every week each reputation moves toward a target set by what the
  museum is now. It rises quickly and fades slowly, so acquisition buzz
  wears off unless the museum lives up to it.
- The room-completion bonus is paid once per room. Taking a work down
  and re-hanging it no longer earns fame again.
- Selling significant works costs a little Patronage.

## Building capacity
- Each building has a comfortable daily capacity (Local Gallery 180,
  Palace 3,000). Demand beyond about 70% of capacity is squeezed, and
  the floor shows when you're turning people away. Outgrowing a
  building is now the signal to expand or move.
- Ticket "fair price" follows reputation (about §6 to §25) instead of
  crowd size.
- A small per-visitor running cost, so busy museums cost more to run.

## Full career history (R3)
- History is no longer capped at 12 weeks. The last year is kept week
  by week, and every 4th week before that.
- Snapshots record reputation split, cash, revenue, expenses, rooms,
  works and collection value.
- A **Career So Far** card (Finance) compares your first week with now.

## Cousins who live in the market (R4)
- Each cousin collects the style of the heirloom they inherited, earns
  income, buys works, and grows fame from what they actually own.
- Cousins bid in person at auctions in their style, up to what they can
  afford. If they win, the work goes to their museum and is gone from
  the market.
- Other bidders are named (a telephone bidder, the Varga Foundation…).

## Rarity on a curve (R5)
- A **headline lot** every 13 weeks (first one in week 6) at your best
  house: Rare at the Old Quarter, Epic at Harringate & Cole, Legend at
  the Belvedere. It is flagged on the event card.
- A **pity timer** guarantees a Rare-or-better lot at least every 8
  weeks.
- Old Quarter Saleroom odds moved from 90/9/1 to 82/14/4.

## Time controls (R6)
- **Sim to next opportunity ⏩** runs quiet weeks and stops at the next
  notable lot, a returning expedition, a new auction house, negative
  funds or completed research, then says why it stopped.

## Balance tooling (R7)
- `npm run sim [weeks] [runs]` plays headless careers with a sensible
  bot and prints the trajectory. Current year-1 shape:
  - Harringate & Cole (120 fame) in about weeks 20–35.
  - The first move out of the Local Gallery in about weeks 30–50.
  - Cash stays tight (§30–100k).
  - Cousins stay close in year 1.
- Known gap: late-game income still outpaces spending. Season budgets
  (Milestone 3) are the planned fix.

## Compatibility
- Old saves migrate. Existing fame becomes Prestige, cousins get a
  style and wallet, and full rooms are marked as already completed.
