# Museum Wars v1.0: A Career (Milestone 3)

The career arc from `GAME_DIRECTION.md`. This milestone is engine-first:
the new panels are plain on purpose and will be rebuilt in the M7
visual revamp.

## Seasons (R20)
- A year is four 13-week seasons (Spring, Summer, Autumn, Winter).
  The header shows the season and the initiatives left.
- **Sim to end of season ⏭** runs to the review. "Sim to next
  opportunity" also stops when a season review is ready.

## Budget plan (R21)
- Each season you split the weekly operating surplus across five
  lines:
  - **Acquisitions:** stays as cash.
  - **Exhibitions & education:** adds up to +20% presentation.
  - **Marketing:** adds up to +25% visitors and Popularity.
  - **Operations:** below 15%, visitors lose up to 15%. Above 15%,
    comfort adds up to +10%.
  - **Endowment:** invested. It pays 0.25% a week and lifts Patronage.
- Marketing and exhibition spending fade over time, so you need to keep
  funding them. Their effect saturates with building size, so a palace
  needs a palace-sized budget. This is also the first late-game money
  sink.
- Default plan: 50 / 15 / 10 / 15 / 10.

## Initiatives (R22)
- **2 to 6 a season** (2, plus 1 per two staff).
- **Each uses one:** commissioning an expedition, an attribution study,
  buying an estate lot, starting research (either kind), an ad
  campaign, signing a sponsor, or a temporary exhibition.
- **Bidding at auction never costs an initiative.**

## Season review (R23)
At every season change the review explains:
- **Visitors:** the change in visitors per day.
- **Top new works:** this season's best acquisitions and how many
  visitors each draws.
- **Budget:** what marketing, exhibitions and operations are doing.
- **Capacity:** whether the building is full.
- **Reputation and rank:** reputation deltas and league movement.
- **What happened:** wins, crate reveals, discoveries, sets and moves.
- **Advice:** one line, such as unused initiatives, a full building, a
  weak room or under-funded operations.

## Annual Report and leagues (R16, R17)
- **Every year the report gives:**
  - A start vs end table.
  - Acquisition, Discovery and Exhibition of the Year.
  - A ★1–5 critic score with a quote.
  - Awards and the league rank.
- **Three leagues are the three career stages:**
  - **City League (early):** your city's local and regional museums
    plus the cousins. A **top 3** finish promotes you.
  - **National League (mid):** national and regional institutions. A
    **top 3** finish promotes you.
  - **World League (late):** everyone, including the global icons.

## History and milestones (R18)
- **Museum History** (Finance): one row per year, plus a milestone log:
  - First Rare, Epic, Legend and World Icon.
  - 100, 500, 1,000 and 2,500 visitors a day.
  - First move.
  - First set.
  - First discovery.
  - Reputation 100, 500, 1,000 and 2,000.
  - Promotions.

## Simpler controls (R24)
- **Ticket presets:** Free / Low / Standard / Premium, priced from your
  reputation. Free entry adds Popularity and Patronage.
- **Room presentation:** `upgradePresentation` and a Basic / Fine /
  Landmark tier in the engine, ready for the new UI.

## Deferred to M7 (UI revamp)
- Navigation in 4 hubs (R25), sponsor tiers, and real screens for the
  season plan, review and report.

## Balance note (for M8)
- The bot reaches the National League at the end of Year 2 and often
  the World League at the end of Year 3. The mid stage needs to last
  much longer (target: Years 2–8).
- Late-game income is the main lever, alongside promotion thresholds
  and the supply of top works.
