/* ============================================================
   UI v2 — THE CARD GAMES  ( src/ui/v2/ )
   Gala (a hand of conversation cards), Dig (push your luck in
   three trenches) and the Dealer (flip evidence, then decide).
   ============================================================ */
import { useState } from 'react';
import type { Expedition, GameState, SocietyMember } from '../../data/types';
import { ARTIFACT_BY_ID } from '../../data/artifacts';
import { rarityForScore } from '../../data/constants';
import * as E from '../../engine/game';
import * as Soc from '../../engine/society';
import * as BM from '../../engine/blackmarket';
import * as C from '../../engine/cardgames';
import * as W from '../../engine/weekly';
import { money } from '../../engine/util';
import { Thumb } from '../components';
import type { Apply } from './root';

const initials = (name: string) => name.replace(/^(Lady|Baron|Mme\.|Sir|Contessa|Mr\.|Dowager|Don|Mrs\.|Herr Direktor) /, '').charAt(0);

/* ============================ GALA ============================ */
export function GalaGame({ state, apply, onClose }: { state: GameState; apply: Apply; onClose: () => void }) {
  // the circle is pinned for this evening, so what you learn is saved against the same people
  const [base] = useState(() => ({ ...state, society: Soc.ensureSociety(state) }));
  const [members] = useState(() => Soc.galaGuests(base));
  const [member, setMember] = useState<SocietyMember | null>(null);
  const guest = member ? Soc.asGuest(member) : null;
  const tasteChips = (known: Record<string, number>) => (Object.keys(C.TOPIC_NAME) as C.GalaTopic[]).filter(t => t !== 'wit' && known[t] !== undefined)
    .map(t => <span key={t} className={known[t] >= 2 ? 'love' : known[t] === 1 ? 'ok' : 'bad'}>{C.TOPIC_NAME[t]} <b>{known[t] >= 2 ? '×2' : known[t] === 1 ? '×1' : known[t] === 0 ? '×0' : '−1'}</b></span>);
  /** leave the gala, keeping what you learned about them */
  const finish = (loan: { weeks: number; fee: number } | null) => {
    if (member && g) {
      const s2 = Soc.recordGala({ ...state, society: base.society }, member.id, g, !!loan);
      apply(loan ? E.acceptLoan(s2, g.targetId, loan.weeks, loan.fee, g.guestName) : { state: s2 });
    }
    onClose();
  };
  const [g, setG] = useState<C.GalaGame | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [claimed, setClaimed] = useState(false);

  if (!guest) return (
    <div className="v2-game">
      <div className="kicker">A society gala</div>
      <h2>Who will you charm?</h2>
      <div className="v2-guests">
        {members.map(x => (
          <button key={x.id} onClick={() => setMember(x)} className={x.met ? 'met' : ''}>
            <span className="v2-face">{initials(x.name)}</span><b>{x.name}</b>
            <span className="v2-owns" aria-label={x.collection.map(id => rarityForScore(ARTIFACT_BY_ID[id].score).name).join(', ')}>
              {x.collection.map(id => { const b = rarityForScore(ARTIFACT_BY_ID[id].score); return <i key={id} style={{ background: b.hex }}>{b.name.charAt(0)}</i>; })}</span>
            <small className="v2-metline">{x.met ? `You know ${Soc.knownCount(x)} of their 8 tastes` : 'Someone new'}</small>
            {x.met > 0 && <span className="v2-tastes mini">{tasteChips(x.known)}</span>}
          </button>))}
      </div>
      <button className="ghost v2-wide" onClick={() => { apply({ state: { ...state, society: base.society } }); onClose(); }}>Leave the gala</button>
    </div>
  );

  if (!g) return (
    <div className="v2-game">
      <div className="kicker">{guest.name}'s collection</div>
      <h2>Which work will you ask for?</h2>
      <div className="v2-askworks">
        {guest.collection.map(id => {
          const a = ARTIFACT_BY_ID[id];
          const band = rarityForScore(a.score);
          return <button key={id} style={{ borderColor: band.hex }} onClick={() => setG(C.startGala(state, guest, id, member!))}>
            <Thumb artifact={a} size="lg" /><b>{a.name}</b><span className={'pill ' + band.cls}>{band.name}</span>
            <small>Charm needed: {C.galaGoal(a.score)}</small></button>;
        })}
      </div>
      {member!.met > 0 && <><div className="v2-label" style={{ marginTop: 12 }}>What you remember about them</div><div className="v2-tastes">{tasteChips(member!.known)}</div></>}
      <button className="ghost v2-wide" onClick={() => setMember(null)}>← Another guest</button>
    </div>
  );

  const art = ARTIFACT_BY_ID[g.targetId];
  const over = C.galaOver(g);
  const result = over ? C.galaResult(g) : null;
  const topics = (Object.keys(C.TOPIC_NAME) as C.GalaTopic[]).filter(t => t !== 'wit');
  const last = g.last;
  return (
    <div className="v2-game v2-gala">
      <div className="v2-galahead">
        <span className={'v2-face big' + (last ? (last.wit || last.gain > 0 ? ' warm' : last.gain < 0 ? ' cold' : '') : '')} key={g.plays}>{initials(g.guestName)}</span>
        <div><b>{g.guestName}</b><span>Asking to borrow <em>{art.name}</em></span></div>
      </div>
      <div className="v2-tastes">
        {topics.map(t => {
          const k = g.known[t];
          return <span key={t} className={k === undefined ? '' : k >= 2 ? 'love' : k === 1 ? 'ok' : 'bad'}>
            {C.TOPIC_NAME[t]} <b>{k === undefined ? '?' : k >= 2 ? '×2' : k === 1 ? '×1' : k === 0 ? '×0' : '−1'}</b></span>;
        })}
      </div>
      <div className="v2-charm"><span>Charm <b>{g.charm}</b> / {g.goal}</span><i><em style={{ width: `${Math.min(100, g.charm / g.goal * 100)}%` }} /></i></div>
      <div className="v2-counters"><span>Plays <b>{g.plays}</b></span><span>Discards <b>{g.discards}</b></span><span>Deck <b>{g.deck.length}</b></span>{g.wit && <span className="hot">Next card ×2</span>}</div>

      <div className="v2-stage">
        {last && !over && <div className="v2-gain" key={g.plays}>
          <b className={last.wit || last.gain > 0 ? 'up' : 'down'}>{last.wit ? '×2' : (last.gain >= 0 ? '+' : '') + last.gain}</b><span>{last.line}</span></div>}
        {result && <div className={'v2-result ' + (result.success ? 'won' : 'lost')}>
          <b>{result.success ? 'A loan secured!' : 'Politely declined'}</b>
          {result.success && <span>{art.name}, on loan for {result.loanWeeks} weeks at {money(result.weeklyFee)} a week</span>}
          <button onClick={() => {
            if (claimed) return;
            setClaimed(true);
            finish(result.success ? { weeks: result.loanWeeks, fee: result.weeklyFee } : null);
          }}>{result.success ? 'Hang it in a gallery' : 'Leave'}</button>
        </div>}
      </div>

      {!over && <>
        <div className="v2-hand">
          {g.hand.map((c, i) => {
            const k = g.known[c.topic];
            const hint = c.topic === 'wit' ? 'next ×2' : k === undefined ? '' : k >= 2 ? 'loved' : k === 1 ? 'ok' : k === 0 ? 'bored' : 'offends';
            return (
              <button key={c.id} className={'v2-card' + (sel === i ? ' sel' : '') + (hint ? ' h-' + hint.replace(/\W/g, '') : '')} onClick={() => setSel(sel === i ? null : i)}>
                <span className="v2-card-val">{c.topic === 'wit' ? '×2' : '+' + c.val}</span>
                <span className="v2-card-name">{C.TOPIC_NAME[c.topic]}</span>
                <small>{hint}</small>
              </button>
            );
          })}
        </div>
        <div className="v2-sheetbtns two">
          <button disabled={sel === null} onClick={() => { if (sel !== null) { setG(C.playCard(g, sel)); setSel(null); } }}>Play card</button>
          <button className="ghost" disabled={sel === null || g.discards <= 0} onClick={() => { if (sel !== null) { setG(C.discardCard(g, sel)); setSel(null); } }}>Discard &amp; draw</button>
        </div>
      </>}
    </div>
  );
}

/* ============================= DIG ============================ */
export function DigGame({ state, expedition, apply, onDone }: {
  state: GameState; expedition: Expedition; apply: Apply; onDone: (crateId: string | null) => void;
}) {
  const [g, setG] = useState(() => C.startDig(expedition.tier, E.specialtySkill(state, 'surveyor'), E.specialtySkill(state, 'veteran') >= 2 ? 1 : 0));
  const [sel, setSel] = useState(0);
  const [msg, setMsg] = useState<{ text: string; bad: boolean }>({ text: 'Pick a trench and dig. Bank it before your luck runs out.', bad: false });
  const [quake, setQuake] = useState(-1);
  const over = C.digOver(g);
  const res = C.digResult(g);
  const cards = E.expeditionCardCount(res);
  const dig = () => {
    const r = C.digDeeper(g, sel);
    if (!r.event) return;
    setG(r.game);
    setQuake(r.event === 'collapse' ? sel : -1);
    setMsg(r.event === 'collapse' ? { text: `A second ${r.layer!.name.toLowerCase()}! The trench collapses.`, bad: true }
      : r.event === 'saved' ? { text: `Another ${r.layer!.name.toLowerCase()}, but your veteran pulls the team clear.`, bad: true }
      : r.event === 'hazard' ? { text: `${r.layer!.name}… one more of those and the trench goes.`, bad: true }
      : r.event === 'find' ? { text: `Found: ${r.layer!.name}!`, bad: false } : { text: 'Just earth.', bad: false });
  };
  const finish = () => {
    const before = (state.crates || []).length;
    const out = E.resolveExpedition(state, expedition.id, res);
    apply(out);
    const crates = out.state.crates || [];
    onDone(!out.error && crates.length > before ? crates[crates.length - 1].id : null);
  };
  return (
    <div className="v2-game v2-dig">
      <div className="v2-dighead">
        <div><div className="kicker">{W.regionOf(expedition.style)}</div><h2>Dig deeper?</h2></div>
        <div className="v2-digcrate"><b>{cards}</b><span>cards</span><small>{res.shards % 3}/3 ◈</small></div>
      </div>
      <p className="v2-muted">Shovels <b>{g.digs}</b>{g.helmets ? ` · veteran saves ${g.helmets}` : ''} · a second card of the same hazard collapses the trench</p>
      <div className="v2-trenches">
        {g.trenches.map((t, i) => (
          <div key={t.name} className={'v2-trench' + (sel === i ? ' sel' : '') + (quake === i ? ' quake' : '') + ' st-' + t.state}>
            <button onClick={() => setSel(i)}>{t.name}</button>
            <div className="v2-layers">
              {t.layers.map((l, k) => <span key={k} className={'v2-layer k-' + l.kind + (l.name === 'Relic' || l.name === 'Gold mask' ? ' gold' : '')}>{l.name}{l.worth ? <b>+{l.worth}</b> : l.kind === 'hazard' ? <b>!</b> : null}</span>)}
            </div>
            <small>{t.state === 'collapsed' ? 'Collapsed: lost' : t.state === 'banked' ? `Banked ${C.trenchValue(t)} ◈` : C.trenchValue(t) ? `${C.trenchValue(t)} ◈ at risk` : 'Untouched'}</small>
          </div>
        ))}
      </div>
      <p className={'v2-digmsg' + (msg.bad ? ' bad' : '')}>{over ? `The dig is over: ${cards} card${cards === 1 ? '' : 's'} for the crate.` : msg.text}</p>
      {!over ? (
        <div className="v2-sheetbtns two">
          <button onClick={dig} disabled={g.trenches[sel].state !== 'open'}>Dig deeper</button>
          <button className="ghost" onClick={() => setG(C.bankTrench(g, sel))} disabled={g.trenches[sel].state !== 'open' || !g.trenches[sel].layers.length}>Bank this trench</button>
        </div>
      ) : <button className="v2-wide" onClick={finish}>{cards ? 'Open the crate' : 'Head home'}</button>}
      {!over && <button className="ghost v2-wide" onClick={() => setG({ ...g, digs: 0 })}>Stop digging and head home</button>}
    </div>
  );
}

/* =========================== DEALER =========================== */
const EV: Record<C.Evidence, { icon: string; label: string }> = {
  ok: { icon: '✓', label: 'Period-correct' }, restored: { icon: '◐', label: 'Restored' }, fake: { icon: '✕', label: 'Modern!' },
  odd: { icon: '?', label: 'Wrong hand' }, gap: { icon: '…', label: 'Gaps in history' }, stolen: { icon: '⊛', label: 'On a stolen list' },
};
const VERDICT: Record<string, string> = {
  genuine: 'Genuine!', altered: 'Restored, but real', misattributed: 'Misattributed', partial_forgery: 'Part forgery',
  full_forgery: 'A forgery', stolen: 'Stolen goods',
};

export function DealerGame({ state, apply, onClose }: { state: GameState; apply: Apply; onClose: () => void }) {
  const [g, setG] = useState(() => C.startDealer(BM.makeBlackMarketOffer(state.specialties), E.specialtySkill(state, 'authenticator')));
  const [outcome, setOutcome] = useState<BM.PurchaseOutcome | null>(null);
  const art = ARTIFACT_BY_ID[g.offer.artifactId];
  const band = rarityForScore(art.score);
  const pay = () => {
    if (state.funds < g.price) return;
    const r = C.payDealer(g);
    setG(r.game); setOutcome(r.outcome);
    apply(E.buyBlackMarket(state, art.id, r.outcome));
  };
  const bad = C.warningSigns(g);
  return (
    <div className="v2-game v2-dealer">
      <div className="v2-dealerhead">
        <span className="v2-face">?</span>
        <div><div className="kicker">A back room, after hours</div>
          <b>“{art.name}. {art.author === 'Unknown' ? 'A rare piece' : art.author}. Cash only.”</b>
          <span>Claimed <span className={'pill ' + band.cls}>{band.name}</span> · catalogue value if genuine {money(g.offer.originalValue)}</span></div>
      </div>
      <div className="v2-evhead"><span>Evidence · flip {g.flips} more</span><span>{g.cards.some(c => c.up) ? (bad ? `${bad} warning sign${bad > 1 ? 's' : ''}` : 'all clean so far') : ''}</span></div>
      <div className="v2-evidence">
        {g.cards.map((c, i) => c.up ? (
          <div key={c.name} className={'v2-ev up e-' + c.ev}><b>{EV[c.ev].icon}</b><span>{c.name}</span><small>{EV[c.ev].label}</small></div>
        ) : (
          <button key={c.name} className="v2-ev" disabled={g.flips <= 0 || !!g.result} onClick={() => setG(C.flipEvidence(g, i))}><b>?</b><span>{c.name}</span></button>
        ))}
      </div>
      <div className="v2-askprice"><span>The dealer wants</span><b key={g.price}>{money(g.price)}</b><i>{g.line}</i></div>
      {!g.result ? (
        <div className="v2-sheetbtns three">
          <button onClick={pay} disabled={state.funds < g.price}>Pay</button>
          <button className="ghost" onClick={() => setG(C.counterOffer(g))} disabled={g.countered}>Counter</button>
          <button className="ghost" onClick={() => setG(C.walkAway(g))}>Walk</button>
        </div>
      ) : (
        <div className={'v2-result ' + (outcome ? (outcome.salvageOnly ? 'lost' : 'won') : '')}>
          <b>{g.result === 'gone' ? 'The dealer left' : g.result === 'walked' ? `You walked: it was ${VERDICT[g.offer.verdict].toLowerCase()}` : VERDICT[g.offer.verdict]}</b>
          <span>{outcome ? `Paid ${money(outcome.pricePaid)} · worth ${money(outcome.effectiveValue)}${outcome.restorationFee ? ` · restoration ${money(outcome.restorationFee)}` : ''}${outcome.declareFee ? ` · declare for ${money(outcome.declareFee)}` : ''}` : ''}</span>
          <button onClick={onClose}>Done</button>
        </div>
      )}
    </div>
  );
}
