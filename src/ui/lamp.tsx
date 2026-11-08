/* ============================================================
   UI — UNDER THE LAMP  ( src/ui/ )
   The black market as a quick visual game: scan the canvas, read
   the tells, then buy, haggle, call it stolen, or walk away.
   ============================================================ */
import { useState } from 'react';
import type { GameState } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { rarityForScore } from '../data/constants';
import * as BM from '../engine/blackmarket';
import * as L from '../engine/lamp';
import * as E from '../engine/game';
import { money } from '../engine/util';
import { Thumb } from './components';

const TELL: Record<L.Tell, { icon: string; name: string }> = {
  green: { icon: '✓', name: 'Period-correct' },
  amber: { icon: '◐', name: 'Restored' },
  red: { icon: '✕', name: 'Modern material' },
  blue: { icon: '⊛', name: 'Registry stamp' },
  violet: { icon: '?', name: "Wrong hand" },
  none: { icon: '', name: '' },
};

const VERDICT_TITLE: Record<BM.Verdict, string> = {
  genuine: 'Genuine!', altered: 'Altered', misattributed: 'Misattributed',
  partial_forgery: 'Part forgery', full_forgery: 'A fake', stolen: 'Stolen goods',
};

export function LampScreen({ state, onBuy, onClose }: {
  state: GameState;
  onBuy: (artId: string, outcome: BM.PurchaseOutcome) => void;
  onClose: () => void;
}) {
  const [offer] = useState<BM.BlackMarketOffer>(() => BM.makeBlackMarketOffer(state.specialties));
  const [lamp, setLamp] = useState<L.LampState>(() => L.makeLamp(offer, E.specialtySkill(state, 'authenticator')));
  const [outcome, setOutcome] = useState<BM.PurchaseOutcome | null>(null);
  const art = ARTIFACT_BY_ID[offer.artifactId];
  const band = rarityForScore(art.score);
  const s = L.seen(lamp);
  const finish = (l: L.LampState) => {
    setLamp(l);
    if (l.result === 'bought' || l.result === 'called_stolen') {
      const o = BM.purchaseOutcome(offer, l.price);
      setOutcome(o);
      onBuy(art.id, o);
    }
  };
  const buy = () => {
    if (state.funds < lamp.price) return;
    finish({ ...lamp, result: 'bought' });
  };
  const done = !!lamp.result;

  return (
    <div className="panel lamp">
      <div className="lamp-head">
        <div className="salon-kicker">A discreet offer</div>
        <h2 style={{ margin: 0 }}>{art.name}</h2>
        <span className="lamp-sub">{art.author} · claimed <span className={'pill ' + band.cls}>{band.name}</span></span>
      </div>

      <div className="lamp-board">
        <div className="lamp-art"><Thumb artifact={art} size="lg" /></div>
        <div className="lamp-grid">
          {lamp.cells.map((t, i) => {
            const show = lamp.scanned[i] || (done && t !== 'none');
            return (
              <button key={i} disabled={done || lamp.scanned[i] || lamp.scansLeft <= 0}
                className={'lamp-cell' + (lamp.scanned[i] ? ' scanned' : '') + (show ? ' t-' + t : '') + (done && !lamp.scanned[i] ? ' late' : '')}
                onClick={() => setLamp(L.scan(lamp, i))} aria-label={show ? TELL[t].name || 'nothing' : 'scan here'}>
                {show ? TELL[t].icon : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lamp-status">
        <span className="lamp-scans" aria-label={`${lamp.scansLeft} scans left`}>
          {Array.from({ length: lamp.scansLeft }, (_, i) => <i key={i} />)}</span>
        <span className="lamp-tally">
          {(['green', 'amber', 'red', 'blue', 'violet'] as L.Tell[]).filter(t => s[t]).map(t =>
            <b key={t} className={'t-' + t}>{TELL[t].icon} {s[t]}</b>)}
        </span>
      </div>

      <div className="lamp-price">
        <span>Asking</span>
        <b key={lamp.price}>{money(lamp.price)}</b>
        <span className="lamp-patience" aria-label={`dealer patience ${lamp.patience}`}>
          {Array.from({ length: offer.patience }, (_, i) => <i key={i} className={i < lamp.patience ? 'on' : ''} />)}</span>
      </div>
      {lamp.last && <p className="lamp-line">{lamp.last}</p>}

      {!done ? (
        <div className="lamp-actions">
          <button onClick={buy} disabled={state.funds < lamp.price}>Buy</button>
          <button className="ghost" onClick={() => finish(L.haggle(lamp, offer))}>Haggle</button>
          {s.blue > 0 && <button className="ghost" onClick={() => finish(L.callStolen(lamp, offer))}>It's stolen!</button>}
          <button className="ghost" onClick={() => finish(L.walk(lamp))}>Walk</button>
        </div>
      ) : (
        <div className={'lamp-result' + (outcome && (outcome.salvageOnly) ? ' bad' : outcome ? ' good' : '')}>
          {outcome ? <>
            <b>{VERDICT_TITLE[outcome.verdict]}</b>
            <span>Paid {money(outcome.pricePaid)} · worth {money(outcome.effectiveValue)}
              {outcome.restorationFee ? ` · restoration ${money(outcome.restorationFee)}` : ''}
              {outcome.declareFee ? ` · declare for ${money(outcome.declareFee)}` : ''}</span>
          </> : <b>{VERDICT_TITLE[offer.verdict]}</b>}
          <button onClick={onClose}>Done</button>
        </div>
      )}
      <div className="lamp-legend">
        {(['green', 'amber', 'red', 'blue', 'violet'] as L.Tell[]).map(t =>
          <span key={t}><b className={'t-' + t}>{TELL[t].icon}</b> {TELL[t].name}</span>)}
      </div>
    </div>
  );
}
