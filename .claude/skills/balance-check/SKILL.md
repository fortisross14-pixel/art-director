---
name: balance-check
description: "Find balance outliers, broken progressions, degenerate strategies and economy imbalances in Art Director's formulas and data, measured with the headless sim. Use for 'check game balance', economy, progression, loot/crate odds, or minigame win rates."
argument-hint: "[economy|progression|loot|minigames|all]"
---

<!-- Adapted from the balance-check skill in Claude Code Game Studios
     (github.com/Donchitos/Claude-Code-Game-Studios @ 05ad7c8, MIT, (c) 2026 Donchitos;
     see .claude/skills/_licenses). Changes: rewired to this repo's design doc, data
     files and balance sim; removed that project's hooks, registry and GDD folders. -->

# Balance Check (Art Director)

## Insufficient input: check this before producing any report

If the inputs a section needs do not exist, that section is **NOT ASSESSED — NO DATA**.
Never estimate a number the sim did not produce. A scan that found nothing because
there was nothing to scan has not verified anything; say which of the two happened.

## Inputs

| Input | Where |
|---|---|
| Targets (the source of truth) | `GAME_DIRECTION.md`: the three career stages table and M8 |
| Economy, buildings, houses, rivals | `src/data/constants.ts`, `src/data/identity.ts` |
| Formulas | `src/engine/game.ts` (visitors, revenue, costs, reputation), `src/engine/season.ts` (leagues, budget), `src/engine/ratings.ts` (rooms), `src/engine/research.ts`, `src/engine/crates.ts` |
| Minigames | `src/engine/cardgames.ts`, `src/engine/auction.ts` |
| Measurements | `npm run sim [weeks] [runs] [district] [background] [style]` and `npm run sim:sweep -- [weeks] [runs]` (all seven archetypes) |

## Phase 1: domain
Economy (faucets and sinks), progression (league and stage timing), loot (crate odds,
pity, rarity supply), minigames (win rates and yields), or all.

## Phase 2: measure, don't guess
Run the sweep for at least 20 years (`npm run sim:sweep -- 1040 3`) and a 35-year
career for the fastest and slowest archetypes. For a minigame, write a short
headless Monte Carlo against the engine functions (a sensible greedy player,
4,000 trials) and report win rate or yield per tier.

## Phase 3: compare each value with its target
A value outside its target is an outlier. A value with no stated target is listed as
"no stated range — not judged", never as fine.

Domain checks:
- **Economy:** map every faucet (tickets, retail, sponsors, grants, members,
  endowment) and sink (rooms, wings, moves, research, auctions, care, wages); project
  cash at years 5, 10, 20 and 35; look for loops with no sink and for a point where
  cash stops mattering.
- **Progression:** national and world league years per archetype, first Rare/Epic/
  Legend, time each building fills; dead zones with no visible progress; spikes such
  as a move that multiplies income overnight.
- **Loot:** expected weeks to each rarity, pity math, cards that are never worth keeping.
- **Minigames:** a win rate per difficulty tier that is neither trivial nor hopeless;
  no choice that dominates every other (for example, one gala card always best).
- **Parity:** every district reaches the World League within a career by a
  different route; no archetype dominates.

## Phase 4: report

```
## Balance Check: [domain]
### Data sources (files read, sim commands run)
### Health: NOT ASSESSED / HEALTHY / CONCERNS / CRITICAL ISSUES
### Outliers   | Value | Target | Measured | Issue |
### Degenerate strategies
### Progression (table by archetype)
### Recommendations   | Priority | Issue | Fix | Expected impact |
```

Health, worst finding first: CRITICAL (a dominant strategy, a stall, a sinkless
loop) > CONCERNS (tunable outliers) > NOT ASSESSED (missing data or targets) > HEALTHY.

## Phase 5: fix and verify
Fix the highest priority issue, re-run the same measurement, and show before and
after. If a fix changes a target in `GAME_DIRECTION.md`, update the doc in the same
change and say so.
