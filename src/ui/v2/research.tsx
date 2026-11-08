/* ============================================================
   UI v2 — RESEARCH  ( src/ui/v2/ )
   Office → Research: what you're studying, knowledge of every
   style (0-5), the theses you can use, and how far your
   expeditions can go.
   ============================================================ */
import { useState } from 'react';
import type { ExpeditionTier, GameState, StyleId } from '../../data/types';
import { STYLES } from '../../data/constants';
import * as R from '../../engine/research';
import * as D from '../../engine/director';
import * as W from '../../engine/weekly';
import { EXPEDITION_CRATE } from '../../engine/game';
import { money } from '../../engine/util';
import { ThesisIcon } from './pickers';
import type { Apply } from './root';

const STYLE_IDS = Object.keys(STYLES) as StyleId[];
const SIZE_NAME: Record<ExpeditionTier, string> = { common: 'Field', uncommon: 'Major', rare: 'Deep', epic: 'Grand' };

function Pips({ n }: { n: number }) {
  return <span className="v2-pips">{[1, 2, 3, 4, 5].map(i => <i key={i} className={i <= n ? 'on' : ''} />)}</span>;
}

export function ResearchPage({ state, apply }: { state: GameState; apply: Apply }) {
  const [style, setStyle] = useState<StyleId | null>(null);
  const live = R.projects(state);
  const slots = R.researchSlots(state);
  const labelOf = (p: (typeof live)[number]) => p.kind === 'style' ? `${STYLES[p.key as StyleId].name} → ${R.KNOWLEDGE_NAMES[R.knowledgeOf(state, p.key as StyleId) + 1]}`
    : p.kind === 'thesis' ? D.THESES[p.key as D.ThesisId].name : R.DIG_RESEARCH[p.key as Exclude<ExpeditionTier, 'common'>].name;
  const begin = (kind: 'style' | 'thesis' | 'dig', key: string) => { apply(R.startProject(state, kind, key)); setStyle(null); };
  const known = R.thesesKnown(state);
  const mine = [...STYLE_IDS].sort((a, b) => R.knowledgeOf(state, b) - R.knowledgeOf(state, a));

  return (
    <>
      <div className="panel">
        <h2>In the library<span className="sub">{live.length} of {slots} project{slots === 1 ? '' : 's'}</span></h2>
        {!live.length && <p className="empty-note">Nothing under way. Each project takes one initiative.</p>}
        {live.map(p => (
          <div key={p.id} className="v2-field"><div><b>{labelOf(p)}</b><span>{p.weeksLeft} week{p.weeksLeft === 1 ? '' : 's'} left</span></div>
            <i><em style={{ width: `${(1 - p.weeksLeft / p.weeksTotal) * 100}%` }} /></i></div>
        ))}
        <p className="v2-muted">One project at a time, plus one for every researcher you hire. Better researchers finish sooner.</p>
      </div>

      <div className="panel">
        <h2>Knowledge<span className="sub">by style, 0 to 5</span></h2>
        <p className="v2-muted">1 lets you collect a style and build rooms around it. 2 opens its dig region. Every level deepens your curation, and educators turn it into labels and tours.</p>
        <div className="v2-tiles">
          {mine.map(st => {
            const k = R.knowledgeOf(state, st);
            const busy = live.some(p => p.kind === 'style' && p.key === st);
            return (
              <button key={st} className={'v2-tile compact' + (k ? '' : ' faint')} onClick={() => setStyle(st)}>
                <b>{STYLES[st].name}</b><Pips n={k} />
                <small>{busy ? 'Researching…' : R.KNOWLEDGE_NAMES[k]}{k >= R.DIG_KNOWLEDGE ? ` · digs in ${W.regionOf(st)}` : ''}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h2>Theses<span className="sub">ways to make a room add up</span></h2>
        <div className="v2-tiles">
          {(Object.keys(D.THESES) as D.ThesisId[]).map(t => {
            const have = known.includes(t);
            const plan = t === 'none' ? null : R.planFor(state, 'thesis', t);
            const busy = live.some(p => p.kind === 'thesis' && p.key === t);
            return (
              <div key={t} className={'v2-tile' + (have ? ' sel' : '')}>
                <span className="v2-tile-icon"><ThesisIcon id={t} /></span>
                <b>{D.THESES[t].name}</b><small>{D.THESES[t].blurb}</small>
                {have ? <em className="v2-delta up">Known</em> : busy ? <em className="v2-delta">Researching…</em> : plan &&
                  <button disabled={!!plan.blocker} onClick={() => begin('thesis', t)} title={plan.blocker || ''}>
                    {money(plan.cost)} · {plan.weeks} wk</button>}
                {!have && !busy && plan?.blocker && <small className="v2-why">{plan.blocker}</small>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h2>Expeditions<span className="sub">how big you can dig</span></h2>
        <div className="v2-tiers">
          {(['common', 'uncommon', 'rare', 'epic'] as ExpeditionTier[]).map(t => {
            const have = R.digTiers(state).includes(t);
            const plan = t === 'common' ? null : R.planFor(state, 'dig', t);
            const busy = live.some(p => p.kind === 'dig' && p.key === t);
            return (
              <div key={t} className={'v2-tier' + (have ? ' sel' : '')}>
                <i className={'crate-' + EXPEDITION_CRATE[t]} /><b>{SIZE_NAME[t]}</b>
                {have ? <span>Ready</span> : busy ? <span>Researching…</span> : plan &&
                  <button disabled={!!plan.blocker} onClick={() => begin('dig', t)}>{money(plan.cost)}</button>}
              </div>
            );
          })}
        </div>
        <p className="v2-muted">Regions open with knowledge: reach {R.KNOWLEDGE_NAMES[R.DIG_KNOWLEDGE]} in a style to dig in its homeland.</p>
      </div>

      {style && (() => {
        const k = R.knowledgeOf(state, style);
        const plan = R.planFor(state, 'style', style);
        return (
          <div className="present" onClick={() => setStyle(null)}>
            <div className="present-sheet" onClick={e => e.stopPropagation()}>
              <div className="kicker">Knowledge</div>
              <h2>{STYLES[style].name}</h2>
              <Pips n={k} />
              <ol className="v2-levels">
                {[1, 2, 3, 4, 5].map(l => <li key={l} className={l <= k ? 'done' : l === k + 1 ? 'next' : ''}><b>{R.KNOWLEDGE_NAMES[l]}</b><span>{R.KNOWLEDGE_EFFECT[l]}</span></li>)}
              </ol>
              {k < 5 && <>
                {plan.blocker && <p className="v2-muted"><b>{plan.blocker}</b></p>}
                <button className="v2-wide" disabled={!!plan.blocker} onClick={() => begin('style', style)}>
                  Research {R.KNOWLEDGE_NAMES[k + 1]} · {money(plan.cost)} · {plan.weeks} weeks · 1 initiative</button>
              </>}
            </div>
          </div>
        );
      })()}
    </>
  );
}
