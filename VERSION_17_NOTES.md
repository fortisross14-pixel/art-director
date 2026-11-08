# Version 17 — balance (M8)

The three career stages now take the time they were designed to.
Measured with `npm run sim:sweep` (bot careers in all seven districts).

| | Before | Now |
|---|---|---|
| National League | Year 1 | Years 2–3 (Art district: 4–6) |
| World League | Years 2–3 | Years 6–9 |
| World #1 | Year 5, every time | Years 10–21 in the best runs; most careers end at World #2–6 |
| Cash at Year 10 | §17–70M | §2–9M |
| Cash at Year 20 | §40M+ | under §30M, except the Financial District (§80–120M) |

## What changed
- **Building gates:** the mid-size building needs 200 reputation, and the flagship needs the National League.
- **Capacity:** it grows with the rooms you open, so a new building starts small and fills up as you open it.
- **Room prices:** each room costs more than the last (×1.22), and big buildings cost more per room. Opening up a flagship is a project that takes years.
- **Wings:** up to 6 on a flagship, at §3M, §6M, §12M and doubling. Each adds 5 rooms and a quarter more capacity. This is the late game's growth.
- **The Meridian Evening Sale:** World League only, every 6 weeks, three Epic, Legendary or World Icon lots.
- **Prestige rewards quality over numbers:** your best works count fully, and each further one counts a little less. Rival cousins use the same rule, and only their best 125 works count.
- **Popularity from crowds:** the returns diminish past about 300 visitors a day.
- **Costs that grow with success:**
  - Collection care is 0.08% of the collection's value each week.
  - The running cost per visitor rises with reputation, from §3.50 up to §20.
  - Wings add upkeep.
  - The endowment pays 0.1% a week (it was 0.25%).
- **The established museums are stronger:** city ×1.3–1.4, national ×2.3, world ×1.8. The Louvre is now at 4,320.
- **Districts:**
  - **Financial District:** shop takings are lower, rent and rooms cost more, and the tower and the Exchange are smaller.
  - **Waterfront:** less extra capacity, normal rent, and a smaller terminal.
  - **Bohemian:** rooms cost 75% of normal (was 60%).
  - **Art district:** a bigger prestige bonus.
  - **College:** better ticket tolerance and bigger grants.
- **The test bot** now hires staff, researches new styles, builds wings and pays up when it's rich.

## Known
- After about Year 20 the richest museums still pile up cash once all 6 wings are built. Financial District careers reach about §500M by Year 35. Branch museums (the engine supports several open museums) are the natural end-game sink.
- Not done yet from M8: the Relaxed / Standard / Ruthless setting, a target-band check in CI, and measuring how often cousins win contested headline lots.
