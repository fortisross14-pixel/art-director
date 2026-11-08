/* ============================================================
   UI — HALL OF FAME & CAREER SUMMARY  ( src/ui/ )
   Plain panels for M6; rebuilt in the M7 revamp.
   ============================================================ */
import type { CareerRecord } from '../data/types';
import { DISTRICTS, STYLES } from '../data/constants';
import { BACKGROUNDS, MUSEUM_TYPES } from '../data/identity';
import { LEAGUE_NAMES } from '../engine/season';
import { hallRecords, loadHallOfFame } from '../engine/legacy';
import { money } from '../engine/util';

const districtName = (id: string) => DISTRICTS.find(d => d.id === id)?.name || id;

export function CareerCard({ r }: { r: CareerRecord }) {
  return (
    <div className="panel">
      <h2>{r.galleryName}<span className="sub">{r.years} year{r.years === 1 ? "" : "s"} · legacy {r.legacyScore.toLocaleString()}</span></h2>
      <p className="empty-note">{r.playerName}, {BACKGROUNDS[r.background].name} · {districtName(r.district)} ·
        {' '}{MUSEUM_TYPES[r.museumType].name} ({STYLES[r.focus].name}) · {r.fundingModel}
        {r.reason === 'limit' ? ' · served the full 35 years' : ' · retired'}</p>
      <table className="then-now"><tbody>
        <tr><td>Final standing</td><td><b>{LEAGUE_NAMES[r.finalLeague]} #{r.finalRank}</b></td></tr>
        <tr><td>Peak visitors</td><td>{r.peakDailyVisitors.toLocaleString()} a day</td></tr>
        <tr><td>Peak reputation</td><td>{r.peakFame.toLocaleString()}</td></tr>
        <tr><td>Most valuable work</td><td>{r.mostValuable ? `${r.mostValuable.name} — ${r.mostValuable.author} (${r.mostValuable.rarity}, ${money(r.mostValuable.value)})` : '—'}</td></tr>
        <tr><td>Signature work</td><td>{r.signature || '—'}</td></tr>
        <tr><td>Collection</td><td>{r.worksOwned} works · {money(r.collectionValue)}</td></tr>
        <tr><td>Honours</td><td>{r.awards} awards · {r.discoveries} discoveries · {r.setsCompleted} sets · best critics {'★'.repeat(r.bestCriticStars) || '—'}</td></tr>
      </tbody></table>
    </div>
  );
}

export function HallOfFame() {
  const list = loadHallOfFame().sort((a, b) => b.legacyScore - a.legacyScore);
  if (!list.length) return null;
  const rec = hallRecords(list);
  return (
    <div className="hall-of-fame panel">
      <h2>Hall of Fame<span className="sub">{list.length} museum{list.length === 1 ? '' : 's'} built</span></h2>
      <ul className="hall-records">
        {rec.bestLegacy && <li>Greatest legacy: <b>{rec.bestLegacy.galleryName}</b> ({rec.bestLegacy.legacyScore.toLocaleString()})</li>}
        {rec.topVisitors && <li>Most visitors: <b>{rec.topVisitors.galleryName}</b> ({rec.topVisitors.peakDailyVisitors.toLocaleString()} a day)</li>}
        {rec.topFame && <li>Highest reputation: <b>{rec.topFame.galleryName}</b> ({rec.topFame.peakFame.toLocaleString()})</li>}
        {rec.longest && <li>Longest career: <b>{rec.longest.galleryName}</b> ({rec.longest.years} year{rec.longest.years === 1 ? "" : "s"})</li>}
        {rec.mostValuable?.mostValuable && <li>Most valuable masterpiece: <b>{rec.mostValuable.mostValuable.name}</b> at {rec.mostValuable.galleryName} ({money(rec.mostValuable.mostValuable.value)})</li>}
      </ul>
      <div style={{ overflowX: 'auto' }}>
        <table className="then-now">
          <thead><tr><th>Museum</th><th>Years</th><th>Peak visitors</th><th>Peak rep.</th><th>Standing</th><th>Masterpiece</th><th>Legacy</th></tr></thead>
          <tbody>{list.map(r => (
            <tr key={r.id}>
              <td><b>{r.galleryName}</b><br /><small>{r.playerName} · {districtName(r.district)} · {MUSEUM_TYPES[r.museumType].name}</small></td>
              <td>{r.years}</td><td>{r.peakDailyVisitors.toLocaleString()}</td><td>{r.peakFame.toLocaleString()}</td>
              <td>{LEAGUE_NAMES[r.finalLeague]} #{r.finalRank}</td>
              <td>{r.mostValuable?.name || '—'}</td><td>{r.legacyScore.toLocaleString()}</td>
            </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
