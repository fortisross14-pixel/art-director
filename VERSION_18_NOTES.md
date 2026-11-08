# Version 18 — rooms that grow, research, artists you discover, galas that remember

## Rooms start mixed
- Any room takes any work. New rooms start with **No thesis**: every work you hang still adds visitors and appeal, but the room tops out early.
  - In a test, appeal rose 32 → 42 as five unrelated works went up. The same five works of one style scored 56 as a **Style survey**.
- Theses have to be researched before you can use them. Style survey is the cheap first one (§1,000, 2 weeks).
- Thesis, style and decor are picked from tiles with icons and swatches. Each tile shows how much it would change the room's appeal. When you hang a work in a mixed room, its appeal gain is shown.
- Every gallery sheet has a close button. Sheets were sliding under the header on phones; that's fixed.

## Research, its own tab (Office → Research)
- **Knowledge of every style, from 0 to 5:**

  | Level | Name | What it gives |
  |---|---|---|
  | 1 | Familiar | Collect the style and build rooms around it |
  | 2 | Informed | Its dig region opens |
  | 3 | Expert | Deeper curation |
  | 4 | Authority | Cross-period dialogue rooms become possible |
  | 5 | World authority | The last word on the subject |

  - Each level deepens curation.
  - **Educators** turn knowledge into interpretation: the more you know, the more an educator adds.
  - Your founding style starts at Informed, so you can dig at home from day one.
- **Theses:** six to research, from Style survey (§1,000) to Dialogue across time (§25,000, needs one style at Authority).
- **Expeditions:** Field digs from the start. Major, Deep and Grand digs are researched in order.
- **How many at once:** one project, plus one per researcher. Better researchers finish sooner. Each project uses one initiative.
- Staff is now its own tab.

## Living artists
- You start knowing 3 young artists, not a list of 24.
- **Visit the studios** (§600, 1 initiative) introduces two more. How established they can be depends on your curators (a "spot talent up to" bar), and the Artist background helps.
- Breakout stars become known on their own.
- Artists are shown as cards. Tap one for commission, residency, reading their potential and solo show.
- The weekly news only mentions artists you know.

## Galas remember people
- The same circle of 14 collectors comes to galas. Each one's tastes are fixed.
- What you learn in a conversation is kept. Next time their card shows "Met 2× · you know 5 of 8 tastes", and those tastes are already revealed when you start talking.
- When a collector lends a work, it leaves their collection.

## Under the hood
- Old saves migrate:
  - Each style you collected becomes knowledge 1–2, more if you'd done its old research steps.
  - Rooms keep their styles as Style surveys.
  - Old saves know Major digs and the theses their rooms use.
  - An old save knows 6 artists.
- The balance bot uses the new research. The stage pacing from v17 still holds: National League in Years 2–3, World League in Years 6–9.

## Design pass (frontend-design skill)
- **Motion answers your actions:** list items no longer slide in on every screen. The one choreographed moment is hanging a work: the frame drops onto the wall, settles with a swing and a gold glint, and the change in appeal rises off the wall. Reduced-motion settings are respected.
- **Plainer labels:** small all-caps labels and stacked headings are gone. Labels are sentence case, in italic serif.
- **Prices below the button label:** costs sit on a second line ("Visit the studios", then "§600 and 1 initiative, meet two artists") instead of being strung together with "·".
- **No decorative arrows** on buttons ("End the week", "Open the crate").
- **Copy in plain words**, from the player's side: "Under way" instead of "In the library", "You know 5 of their 8 tastes", and full sentences for artists.
