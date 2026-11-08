/* ============================================================
   UI — CRATES, DUST & CATALOGUE  ( src/ui/ )
   The pack-opening screen and the panels around it:
     * CrateScreen     face-down cards, frame colour first, flip
                       one by one with the best last, keep/salvage
     * CratesPanel     crates waiting, this week's estate lot, the
                       headline rumour (Calendar)
     * DustPanel       dust, pity meter and openly shown odds
     * CatalogueTab    every work per style, silhouettes for the
                       ones you don't have yet, and artist sets
   ============================================================ */
import { useState } from 'react';
import type { GameState, StyleId } from '../data/types';
import { ARTIFACTS, ARTIFACT_BY_ID } from '../data/artifacts';
import { STYLES, STYLE_IDS, RARITY_BANDS, rarityForScore, typeIcon } from '../data/constants';
import * as E from '../engine/game';
import * as C from '../engine/crates';
import * as A from '../engine/attribution';
import { ARTIST_SETS, setProgress } from '../engine/sets';
import { money } from '../engine/util';
import { Thumb } from './components';

type Apply = (r: { state: GameState; error?: string }) => void;

const bandHex = (score: number) => rarityForScore(score).hex;

/* --- the odds table, shown openly --------------------------- */
export function OddsTable({ highlight }: { highlight?: string }) {
  return (
    <table className="odds-table">
      <thead><tr><th>Crate</th>{C.BAND_NAMES.slice(0, 4).map(b => <th key={b}>{b}</th>)}<th>Legend+</th></tr></thead>
      <tbody>{C.CRATE_TIERS.map(t => (
        <tr key={t} className={t === highlight ? 'hl' : ''}>
          <td>{C.CRATE_TIER_NAME[t]}</td>
          {C.CRATE_ODDS[t].map((p, i) => <td key={i}>{p ? p + '%' : '—'}</td>)}
        </tr>))}
      </tbody>
    </table>
  );
}

export function PityMeter({ state }: { state: GameState }) {
  const n = state.cratePity || 0;
  return (
    <div className="pity-meter" title={`A Rare-or-better card is guaranteed at least every ${C.PITY_CRATES} crates.`}>
      <span>Luck meter</span>
      <div className="pity-pips">{Array.from({ length: C.PITY_CRATES }, (_, i) =>
        <i key={i} className={i < n ? 'on' : ''} />)}</div>
      <small>{n >= C.PITY_CRATES - 1 ? 'Next crate guarantees a Rare+' : `${C.PITY_CRATES - n} crates to a guaranteed Rare+`}</small>
    </div>
  );
}

/* --- the reveal ---------------------------------------------- */
export function CrateScreen({ state, crateId, apply, onClose }: {
  state: GameState; crateId: string; apply: Apply; onClose: () => void;
}) {
  const crate = (state.crates || []).find(c => c.id === crateId);
  const [spotlight, setSpotlight] = useState<string | null>(null);
  if (!crate) return null;
  const anyRevealed = crate.cards.some(c => c.revealed);
  const allRevealed = crate.cards.every(c => c.revealed);
  // flip in order: the best card is always last
  const nextIndex = crate.cards.findIndex(c => !c.revealed);

  const flip = (i: number) => {
    if (crate.cards[i].revealed) return;
    const art = A.workOf(state, crate.cards[i].artifactId);
    if (C.bandOf(art.score) >= 4) setSpotlight(art.id);
    apply(E.revealCard(state, crate.id, i));
  };
  const flipAll = () => {
    let s = state;
    for (let i = 0; i < crate.cards.length; i++) {
      if (crate.cards[i].revealed) continue;
      const art = A.workOf(s, crate.cards[i].artifactId);
      if (C.bandOf(art.score) >= 4) setSpotlight(art.id);
      s = E.revealCard(s, crate.id, i).state;
    }
    apply({ state: s });
  };
  const fits = (style: StyleId) => state.specialties.includes(style);

  return (
    <div className="panel crate-screen">
      <h2>{crate.title}
        <span className="sub">{C.CRATE_TIER_NAME[crate.tier]} crate · {crate.cards.length} card{crate.cards.length === 1 ? '' : 's'}</span></h2>
      {!anyRevealed && <div className="crate-intro">
        <p>Each frame glows in the colour of what's inside. Flip them one by one — the best is always last.</p>
        <OddsTable highlight={crate.tier} />
        <div className="crate-intro-actions">
          {crate.tier !== 'legendary' && (
            <button className="ghost" onClick={() => apply(E.upgradeCrate(state, crate.id))}
              disabled={(state.dust || 0) < C.UPGRADE_COST[crate.tier as 'field' | 'major']}>
              Upgrade to {C.CRATE_TIER_NAME[crate.tier === 'field' ? 'major' : 'legendary']} · {C.UPGRADE_COST[crate.tier as 'field' | 'major']} dust
            </button>)}
          <span className="dust-chip">◈ {state.dust || 0} dust</span>
        </div>
      </div>}

      <div className="crate-cards">
        {crate.cards.map((card, i) => {
          const art = A.workOf(state, card.artifactId);
          const band = rarityForScore(art.score);
          const doubtful = A.isDoubtful(state, art.id);
          const big = C.bandOf(art.score) >= 4;
          return (
            <div key={card.artifactId + i}
              className={'crate-card' + (card.revealed ? ' flipped' : '') + (big ? ' legendary' : '')
                + (card.decision === 'salvage' ? ' salvaged' : '')}
              style={{ ['--frame' as string]: band.hex }}>
              <button className="crate-card-inner" disabled={card.revealed || i !== nextIndex}
                onClick={() => flip(i)} aria-label={card.revealed ? art.name : 'Face-down card'}>
                <span className="crate-card-back">
                  <span className="crate-card-mark">?</span>
                  {i === nextIndex && <span className="crate-card-hint">Flip</span>}
                </span>
                <span className="crate-card-front">
                  <span className="cc-top">
                    <span className="cc-score">{art.score}</span>
                    <span className="cc-type">{typeIcon(art.type)} {art.type}</span>
                  </span>
                  <Thumb artifact={art} size="lg" />
                  <strong className="cc-name">{art.name}</strong>
                  <span className="cc-author">{A.attributionLine(state, art.id)}</span>
                  <span className="cc-meta">{STYLES[art.style].name} · {art.year}</span>
                  <span className="cc-tags">
                    <span className={'pill ' + band.cls}>{band.name}</span>
                    <span className={'fit-tag ' + (fits(art.style) ? 'fit' : 'off')}>{fits(art.style) ? 'Fits your museum' : 'Off-focus'}</span>
                    {doubtful && <span className="fit-tag doubt" title="A study may reveal more">Doubtful attribution</span>}
                  </span>
                </span>
              </button>
              {card.revealed && (
                <div className="cc-actions">
                  <button className={card.decision !== 'salvage' ? 'active' : 'ghost'}
                    onClick={() => apply(E.decideCard(state, crate.id, i, 'keep'))}>Keep</button>
                  <button className={card.decision === 'salvage' ? 'active' : 'ghost'}
                    onClick={() => apply(E.decideCard(state, crate.id, i, 'salvage'))}>Salvage ◈{C.DUST_VALUE[C.bandOf(art.score)]}</button>
                  <button className="ghost" disabled={(state.dust || 0) < C.REROLL_COST}
                    onClick={() => apply(E.rerollCard(state, crate.id, i))}>Reroll ◈{C.REROLL_COST}</button>
                </div>)}
            </div>
          );
        })}
      </div>

      <div className="divider" />
      <div className="crate-footer">
        {!allRevealed && <button className="ghost" onClick={flipAll}>Flip all</button>}
        {allRevealed && <button className="primary" onClick={() => { apply(E.finishCrate(state, crate.id)); onClose(); }}>
          Add to collection</button>}
        <button className="ghost" onClick={onClose}>{allRevealed ? 'Later' : 'Open later'}</button>
        <PityMeter state={state} />
      </div>

      {spotlight && (() => {
        const art = A.workOf(state, spotlight);
        return (
          <div className="front-page" onClick={() => setSpotlight(null)} role="dialog">
            <div className="front-page-sheet">
              <div className="fp-masthead">The City Herald</div>
              <div className="fp-kicker">Extraordinary acquisition</div>
              <h3>{state.galleryName} uncovers {art.name}</h3>
              <Thumb artifact={art} size="lg" />
              <p>{A.attributionLine(state, art.id)} · {art.year}. A {rarityForScore(art.score).name} work that will draw crowds for years.</p>
              <button className="primary">Magnificent</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* --- Calendar: crates, estate lot, rumour --------------------- */
export function CratesPanel({ state, apply, onOpen }: {
  state: GameState; apply: Apply; onOpen: (crateId: string) => void;
}) {
  const crates = state.crates || [];
  const offer = state.estateOffer;
  const rumour = state.market?.nextHeadline;
  if (!crates.length && !offer && !rumour) return null;
  return (
    <div className="panel crates-panel">
      <h2>Crates &amp; Rumours<span className="sub">what's waiting to be opened</span></h2>
      {rumour && (() => {
        const art = A.workOf(state, rumour.artifactId);
        const weeks = Math.max(0, rumour.week - state.week);
        const house = E.unlockedHouses(state).find(h => h.id === rumour.houseId)?.name || 'a major house';
        return (
          <div className="rumour-card" style={{ borderColor: bandHex(art.score) }}>
            <b>Rumour:</b> {A.attributionLine(state, art.id)}'s <i>{art.name}</i> ({rarityForScore(art.score).name},
            {' '}est. {money(art.value)}) is expected at {house} {weeks <= 1 ? 'next week' : `in about ${weeks} weeks`}.
            {state.funds < art.value * 0.8 && <span className="rumour-warn"> You'll need more cash.</span>}
          </div>
        );
      })()}
      {crates.map(c => (
        <div className="crate-row" key={c.id}>
          <span className={'crate-icon tier-' + c.tier}>▣</span>
          <span><b>{c.title}</b><small>{C.CRATE_TIER_NAME[c.tier]} · {c.cards.length} card(s)
            {c.cards.some(x => x.revealed) ? ' · half opened' : ''}</small></span>
          <button className="primary" onClick={() => onOpen(c.id)}>Open</button>
        </div>
      ))}
      {offer && (
        <div className="crate-row estate">
          <span className={'crate-icon tier-' + offer.tier}>⚱</span>
          <span><b>The {offer.family} estate</b><small>{offer.house} · sight unseen · {offer.cardCount} lots ·
            {' '}{C.CRATE_TIER_NAME[offer.tier]} odds</small></span>
          <button onClick={() => apply(E.buyEstate(state))} disabled={state.funds < offer.price}>Buy · {money(offer.price)}</button>
        </div>
      )}
    </div>
  );
}

/* --- Exploration: dust & odds -------------------------------- */
export function DustPanel({ state }: { state: GameState }) {
  return (
    <div className="panel">
      <h2>Dust &amp; Odds<span className="sub">what every crate can hold</span></h2>
      <p className="empty-note">Expeditions send home crates: Common digs a Field crate, Uncommon and Rare digs a Major crate,
        Epic digs a Legendary crate. The dig board decides how many cards. Salvage pieces you don't want into
        dust, and spend it on rerolls ({C.REROLL_COST}) or crate upgrades ({C.UPGRADE_COST.field} / {C.UPGRADE_COST.major}).</p>
      <div className="crate-intro-actions"><span className="dust-chip">◈ {state.dust || 0} dust</span><PityMeter state={state} /></div>
      <OddsTable />
    </div>
  );
}

/* --- the catalogue: silhouettes and sets ---------------------- */
export function CatalogueTab({ state, onArtifact }: { state: GameState; onArtifact: (id: string) => void }) {
  const [style, setStyle] = useState<StyleId>(state.specialties[0] || 'renaissance');
  const [view, setView] = useState<'style' | 'sets'>('style');
  const owned = new Set(state.owned);
  const cousins = new Map<string, string>();
  for (const r of state.rivals) {
    for (const id of [...(r.collection || []), ...(r.heirloomId ? [r.heirloomId] : [])]) cousins.set(id, r.name);
  }
  const known = ARTIFACTS.filter(a => Number(a.id) <= 610);
  const works = known.filter(a => a.style === style).sort((a, b) => a.score - b.score);
  const have = works.filter(a => owned.has(a.id)).length;

  return (
    <div className="museum-page catalogue-page">
      <section className="page-hero compact">
        <div>
          <div className="eyebrow">Collection</div>
          <h2>Catalogue</h2>
          <p>Every known work. Silhouettes are still out there — at auction, in estates, in the ground, or in a cousin's museum.</p>
        </div>
        <div className="page-metrics">
          <div><strong>{known.filter(a => owned.has(a.id)).length} / {known.length}</strong><span>Known works owned</span></div>
          <div><strong>{(state.completedSets || []).length} / {ARTIST_SETS.length}</strong><span>Sets complete</span></div>
        </div>
      </section>
      <div className="segmented">
        <button className={view === 'style' ? 'active' : ''} onClick={() => setView('style')}>By style</button>
        <button className={view === 'sets' ? 'active' : ''} onClick={() => setView('sets')}>Artist sets</button>
      </div>

      {view === 'style' && <>
        <div className="style-chips">{STYLE_IDS.map(id => {
          const total = known.filter(a => a.style === id);
          const n = total.filter(a => owned.has(a.id)).length;
          return <button key={id} className={id === style ? 'active' : ''} onClick={() => setStyle(id)}>
            {STYLES[id].name} <small>{n}/{total.length}</small></button>;
        })}</div>
        <p className="empty-note">{STYLES[style].name}: {have} of {works.length} known works.</p>
        <div className="catalogue-grid">{works.map(a => {
          const mine = owned.has(a.id);
          const art = mine ? A.workOf(state, a.id) : a;
          const where = cousins.get(a.id);
          return mine ? (
            <button key={a.id} className="cat-card owned" style={{ borderColor: bandHex(art.score) }} onClick={() => onArtifact(a.id)}>
              <Thumb artifact={art} size="sm" /><b>{art.name}</b><small>{rarityForScore(art.score).name} · {art.score}</small>
            </button>
          ) : (
            <div key={a.id} className="cat-card silhouette" style={{ borderColor: bandHex(a.score) }}
              title={where ? `In ${where}'s museum` : 'Not yet found'}>
              <span className="sil">{typeIcon(a.type)}</span><b>???</b>
              <small>{rarityForScore(a.score).name}{where ? ` · ${where}` : ''}</small>
            </div>
          );
        })}</div>
      </>}

      {view === 'sets' && <div className="sets-list">{ARTIST_SETS.map(set => {
        const p = setProgress(state, set);
        const done = (state.completedSets || []).includes(set.id);
        return (
          <div key={set.id} className={'set-row' + (done ? ' done' : '')}>
            <div className="set-head"><b>{set.name}</b><small>{p.owned}/{p.total}{done ? ' · complete — +prestige while it hangs together' : ''}</small></div>
            <div className="set-bar"><i style={{ width: `${(p.owned / p.total) * 100}%` }} /></div>
            <div className="set-works">{set.workIds.map(id => {
              const a = ARTIFACT_BY_ID[id];
              return owned.has(id)
                ? <span key={id} className="set-work owned" style={{ borderColor: bandHex(a.score) }}>{a.name}</span>
                : <span key={id} className="set-work" style={{ borderColor: bandHex(a.score) }}>{typeIcon(a.type)} ???</span>;
            })}</div>
          </div>
        );
      })}</div>}
      <p className="empty-note">Rarity colours: {RARITY_BANDS.map(b => b.name).join(' · ')}.</p>
    </div>
  );
}
