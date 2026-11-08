# Museum Wars v1.2: Living Artists (Milestone 5)

Football GM's draft and development, applied to art. Engine-first;
the new **Living Artists** tab is a plain table until the M7 revamp.

## Artists (R29)
- Each career starts with **24 living artists**: 20 unknowns (ages
  22–38) and 4 established names (48–72). Four newcomers appear every
  year.
  - Most work in contemporary, modern or pop styles, but any style is
    possible.
  - Each has a medium (painting, sculpture, installation, artist's
    book) and an age.
- **Reputation** (0–100, public) is what their work is worth today.
- **Potential** (0–100) is hidden:
  - 55% of artists: 20–45
  - 30%: 45–65
  - 12%: 65–85
  - 3%: 85–98
- **Weekly career drift.** Reputation closes about 30% of the gap to
  potential each year:
  - Faster under 35, slower after 55, declining after 70.
  - Exposure (their work on your walls, scaled by your reputation)
    and residencies speed it up.
  - Prizes jump +6–12; scandals cost 8–15.
  - Death late in life adds +8 ("suddenly in demand").

## Works that revalue
- A living work's score is computed from the artist's reputation
  **today** (via `workOf`), times a per-piece quality (0.7–1.35):
  - Reputation about 10 makes Commons.
  - Reputation 50 makes Rares.
  - Reputation 75 makes Epics.
  - Reputation 85+ makes Legends.
- Visitors, ratings, prices and every display follow it.
- When an owned work climbs a rarity band you get a **REVALUED**
  headline ("You paid §3,100; it is now worth about §84,000"), and the
  season review mentions it.

## Your moves
| Action | Cost | Initiative | Effect |
|---|---|---|---|
| Commission | about 70% of a typical work's value (§3k for an unknown) | no | A new work in 4 weeks |
| Residency | (§600 + rep × 25) a week × 13 | yes | Faster career, +3 patronage, a free work at the end |
| Solo show | §3,000 (needs 2 of their works) | yes | Artist reputation +2 to +10 (scales with your reputation, less each repeat), your popularity up |
| Scout | free | yes | A potential range; the range narrows with curator and researcher skill |

## Studio crates now hold living artists
- Studio visits (modern museums) and artist-founder gift crates draw
  **new works by living artists**. Field crates mostly hold unknowns;
  Major crates hold better-known names.
- Every card is a bet on a career.

## Rivals scout too
- Each season, rivals sign promising artists to residencies:
  - Rivals who collect modern styles do so 80% of the time; others 35%.
  - They judge potential with some error.
- A signed artist can't take your commission that season, and the
  rival keeps a work at the end.

## Check against "done when"
`npm run sim:artists 10` commissions every artist under §5k in Year 2
across 10 careers and checks again at Year 10:

| Band at Year 10 | Commissions |
|---|---|
| Common | 42 |
| Uncommon | 62 |
| Rare | 53 |
| Epic | 11 |
| Legend | 4 |
| World Icon | 1 |

**9% reached Epic or better, and every career had at least one.**
Most bets stay modest; a few pay off big.
