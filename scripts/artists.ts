/* ============================================================
   ARTIST CHECK — `npm run sim:artists [careers]`
   Verifies the Milestone 5 "done when": a cheap Year 2 commission
   can become an Epic or better by about Year 10. Each career
   commissions one work from every artist under §5k in Year 2 and
   reports where those works stand at the start of Year 10.
   ============================================================ */
import * as E from '../src/engine/game';
import { stepWeek } from '../src/engine/sim';
import { ensureSeason } from '../src/engine/season';
import { commissionPrice } from '../src/engine/artistcore';
import { workOf } from '../src/engine/attribution';
import { bandOf, BAND_NAMES } from '../src/engine/crates';

const CAREERS = Number(process.argv[2] || 20);
let epicPlus = 0, total = 0, careersWithEpic = 0;
const bands = [0, 0, 0, 0, 0, 0];
for (let c = 0; c < CAREERS; c++) {
  let s = E.newGame();
  s = E.foundMuseum(s, 'artist', 'bohemian', 'contemporary');
  s = ensureSeason(E.nameGallery(s, 'Sim', 'Sim Gallery', 8));
  s.funds = 1e9;   // money isn't the question here
  while (s.week < 53) s = stepWeek(s);
  for (const a of (s.artists || []).filter(x => x.alive && commissionPrice(x) <= 5000))
    s = E.commissionWork(s, a.id).state;
  while (s.week < 52 * 9 + 1) { s.funds = 1e9; s = stepWeek(s); }
  const mine = s.owned.filter(id => s.livingWorks?.[id]?.paid);
  let any = false;
  for (const id of mine) {
    const b = bandOf(workOf(s, id).score);
    bands[b]++; total++;
    if (b >= 3) { epicPlus++; any = true; }
  }
  if (any) careersWithEpic++;
}
console.log(`${total} cheap Year-2 commissions across ${CAREERS} careers, by Year 10:`);
console.log(bands.map((n, i) => `${BAND_NAMES[i]} ${n}`).join(' · '));
console.log(`Epic or better: ${epicPlus} (${Math.round(epicPlus / Math.max(1, total) * 100)}%); careers with at least one: ${careersWithEpic}/${CAREERS}`);
