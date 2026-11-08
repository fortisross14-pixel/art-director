# Museum Wars v1.1: Identity (Milestone 4)

Different careers now build very different museums. Engine-first, with
plain UI until the M7 revamp. Data lives in `src/data/identity.ts`.

## Founding draft (R26)
Pick a **founder**, a **district** and a **focus**. Heirs still choose
one of three inherited works and get cousin rivals. Other founders face
rival foundations.

| Founder | Cash | Starts with | Perk |
|---|---|---|---|
| Heir | §50k | 1 inherited Rare | Cousin rivals |
| Academic | §30k | 2 Uncommons, a researcher | +1 initiative, faster research and studies |
| Entrepreneur | §120k | nothing | Sponsors pay 40% more, prestige grows 15% slower |
| Artist | §35k | 3 Commons | A free studio crate every season |
| Collector | §40k | 3 Uncommons | More galas, loans 30% cheaper |

## District rules (R27)
Each district has a starter building, a mid-size building and a new
**flagship**. Museums grow within their own district, and moving
across town is a deliberate choice on the map.

| District | Ladder | Rules |
|---|---|---|
| Historic | Local Gallery → Town Museum → Cathedral Museum | Tourists, summer +20% / winter −15%, popularity ×1.15, dearer rooms |
| Art | Collector's Cabinet → Salon → Palace | Galas 60%, richer estates, prestige ×1.1, rivals bid 15% harder |
| College | Seminar Rooms → University Museum → Great Library | Grants each season (300 per prestige point), research 2 weeks faster, tickets ×0.55, manuscripts draw more |
| Bohemian | Garage → Loft → Old Foundry | Rooms −40%, upkeep −20%, modern, contemporary and pop works draw more |
| Financial | Lobby → Tower → The Exchange | Shop, café and events spend ×5, sponsors ×1.6, the experience matters more than the art |
| Park | Gatehouse → Pavilion → Conservatory | Memberships ×1.6, sculptures draw more |
| Waterfront | Boathouse → Warehouse → Grand Terminal | Capacity +30%, cheap upkeep, immersive presentation, floods (halved at 20%+ operations) |

## Museum types and their channels (R28)
The focus style sets the museum type and its main way to acquire art.

| Type | Styles | Channel |
|---|---|---|
| Archaeological | Egyptian, Classical, Pre-Columbian | Dig crates +1 card, 20% tier upgrade, digs −20%, **repatriation claims** |
| Old Masters | Medieval, Renaissance, Baroque, Romanticism | +1 lot per sale, 25% doubtful lots (more sleepers), richer estates |
| Modern & contemporary | Impressionism, Modernism, Contemporary | **Studio visits:** a studio crate each season (§2,500 + 1 initiative) |
| Pop culture & design | Pop culture | Bequests ×3, busier shop |
| World cultures | Asian, Islamic | More galas, loans 40% cheaper |

- **Repatriation claims:** a country may ask for an Epic+ antiquity
  back.
  - **Return it:** prestige plus goodwill.
  - **Refuse:** a 50% chance of a scandal.

## Funding models (R30)
- Income is now tracked by source: tickets, shop/café/events, sponsors,
  grants, members (new: §1.5 per member per week) and endowment.
- Shop spending grows with reputation.
- The Annual Report shows the year's mix and labels the funding model:
  Ticket-led, Retail & events-led, Sponsor-led, Grants &
  endowment-led, or Membership-led.

## Check against "done when"
Headless runs over 5 years:

| Run | Income | Reputation | Funding model |
|---|---|---|---|
| Financial / Entrepreneur / Contemporary | retail 49%, tickets 44% | Prestige 45%, Popularity 38% | Retail & events-led |
| College / Academic / Egyptian | tickets 64%, grants 13% | Prestige 60% | Ticket-led |
| Park / Collector / Impressionism | tickets 76% | Patronage 21%, the highest | Ticket-led |
| Historic / Heir / Renaissance | tickets 77%, retail 16% | Balanced | Ticket-led |

`npm run sim <weeks> <runs> <district> <background> <style>` reproduces
these. The bot plays each type's channel (digs, studio visits,
sponsors).

## Known for M8
Every archetype still reaches the World League by Year 3–4, and
late-game cash runs into the tens of millions. Stage lengths and the
late-game economy are the main M8 work.
