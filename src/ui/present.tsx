/* ============================================================
   UI — PRESENTATIONS  ( src/ui/ )
   The moments between seasons: the season review slides up as a
   sheet; the Annual Report is unveiled centre stage — rows arrive
   one by one, numbers count up, critic stars land one at a time,
   and a promotion gets a gold shimmer and falling leaf.
   ============================================================ */
import { useEffect, useState } from 'react';
import type { AnnualReport, SeasonReview, SeasonSnapshot } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { LEAGUE_NAMES, STAGE_NAMES } from '../engine/season';
import { money } from '../engine/util';
import { MixLine } from './season';

const reduceMotion = () => typeof window !== 'undefined'
  && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** animate a number from 0 to `to` after `delay` ms */
function useCountUp(to: number, delay = 0, ms = 900): number {
  const [v, setV] = useState(() => (reduceMotion() ? to : 0));
  useEffect(() => {
    if (reduceMotion()) return;
    let raf = 0;
    const start = performance.now() + delay;
    const step = (t: number) => {
      const k = Math.min(1, Math.max(0, (t - start) / ms));
      setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, delay, ms]);
  return v;
}

function CountRow({ label, a, b, i, fmt = (n: number) => n.toLocaleString() }: {
  label: string; a: number; b: number; i: number; fmt?: (n: number) => string;
}) {
  const delay = 500 + i * 220;
  const v = useCountUp(b, delay);
  const d = b - a;
  const pct = a > 0 ? Math.round(d / a * 100) : 0;
  return (
    <tr style={{ animation: `rise 0.5s ${delay / 1000}s ease both` }}>
      <td>{label}</td>
      <td style={{ color: 'var(--s-muted)' }}>{fmt(a)}</td>
      <td className="now">{fmt(v)}
        {d !== 0 && <span className={'delta' + (d < 0 ? ' down' : '')}>{d > 0 ? '▲' : '▼'} {a > 0 ? `${Math.abs(pct)}%` : 'new'}</span>}</td>
    </tr>
  );
}

function rows(a: SeasonSnapshot, b: SeasonSnapshot) {
  return [
    ['Visitors a day', a.dailyVisitors, b.dailyVisitors],
    ['Prestige', a.prestige, b.prestige],
    ['Popularity', a.popularity, b.popularity],
    ['Patrons', a.patronage, b.patronage],
    ['Works on display', a.works, b.works],
  ] as [string, number, number][];
}

function Confetti() {
  const bits = Array.from({ length: 36 }, (_, i) => i);
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map(i => <i key={i} style={{
        left: `${(i * 37) % 100}%`,
        animationDelay: `${1.2 + (i % 12) * 0.12}s`,
        animationDuration: `${2.6 + (i % 5) * 0.4}s`,
        background: i % 3 ? 'var(--s-gold-bright)' : 'var(--s-ivory)',
        transform: `rotate(${i * 29}deg)`,
      }} />)}
    </div>
  );
}

export function AnnualReportShow({ report, onClose }: { report: AnnualReport; onClose: () => void }) {
  const r = report;
  const list = rows(r.start, r.end);
  const starsAt = 500 + list.length * 220 + 300;
  const name = (id: string | null) => (id && ARTIFACT_BY_ID[id]?.name) || null;
  const awards = r.awards;
  return (
    <div className="present center" role="dialog" aria-label={`Annual Report, Year ${r.year}`}>
      {r.promotedTo && <Confetti />}
      <div className="present-sheet">
        <div className="kicker">The Annual Report</div>
        <h2>Year {r.year}</h2>
        <table>
          <thead><tr><th style={{ textAlign: 'left' }} /><th style={{ textAlign: 'right' }}>Start</th><th style={{ textAlign: 'right' }}>End</th></tr></thead>
          <tbody>
            {list.map(([label, a, b], i) => <CountRow key={label} label={label} a={a} b={b} i={i} />)}
            <CountRow label="Collection value" a={r.start.collectionValue} b={r.end.collectionValue} i={list.length} fmt={money} />
          </tbody>
        </table>
        <div className="stars" aria-label={`${r.criticStars} of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < r.criticStars ? '' : 'off'}
              style={{ animationDelay: `${(starsAt + i * 180) / 1000}s` }}>★</span>))}
        </div>
        <div className="quote" style={{ animationDelay: `${(starsAt + 1000) / 1000}s` }}>“{r.criticQuote}”</div>
        <div className="stagger">
          {name(r.acquisitionOfYear) && <div className="award" style={{ animationDelay: `${(starsAt + 1300) / 1000}s` }}>
            <span>Acquisition of the year</span><b>{name(r.acquisitionOfYear)}</b></div>}
          {name(r.discoveryOfYear) && <div className="award" style={{ animationDelay: `${(starsAt + 1500) / 1000}s` }}>
            <span>Discovery of the year</span><b>{name(r.discoveryOfYear)}</b></div>}
          {r.exhibitionOfYear && <div className="award" style={{ animationDelay: `${(starsAt + 1700) / 1000}s` }}>
            <span>Exhibition of the year</span><b>{r.exhibitionOfYear}</b></div>}
          {awards.map((a, i) => <div key={a} className="award" style={{ animationDelay: `${(starsAt + 1900 + i * 200) / 1000}s` }}>
            <span>Award</span><b>{a}</b></div>)}
        </div>
        <div style={{ animation: `fade 0.6s ${(starsAt + 2200) / 1000}s ease both` }}>
          <MixLine mix={r.revenueMix} />
          <p className="empty-note">{LEAGUE_NAMES[r.end.league]} · #{r.end.rank}</p>
        </div>
        {r.promotedTo && <div className="promotion" style={{ animationDelay: `${(starsAt + 2500) / 1000}s` }}>
          Promoted to the {LEAGUE_NAMES[r.promotedTo]}
          <small>{STAGE_NAMES[r.stage]}</small></div>}
        <div className="actions"><button onClick={onClose}>Onward</button></div>
      </div>
    </div>
  );
}

export function ReviewShow({ review, onClose }: { review: SeasonReview; onClose: () => void }) {
  return (
    <div className="present" role="dialog" aria-label={`Season review: ${review.label}`} onClick={onClose}>
      <div className="present-sheet" onClick={e => e.stopPropagation()}>
        <div className="kicker">Season review</div>
        <h2>{review.label}</h2>
        <ul className="stagger" style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
          {review.causes.map((c, i) => <li key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--s-line-soft)', animationDelay: `${0.3 + i * 0.12}s` }}>{c}</li>)}
        </ul>
        {review.chronicle.length > 0 && <>
          <div className="kicker" style={{ marginTop: 12 }}>What happened</div>
          <ul className="stagger" style={{ paddingLeft: 18, margin: '6px 0' }}>
            {review.chronicle.slice(-6).map((c, i) => <li key={i} style={{ padding: '3px 0', animationDelay: `${0.6 + i * 0.1}s` }}>{c}</li>)}
          </ul>
        </>}
        {review.advice && <div className="award" style={{ animationDelay: '1s' }}><span>Advice</span><b style={{ fontSize: 16 }}>{review.advice}</b></div>}
        <div className="actions"><button onClick={onClose}>Plan the new season</button></div>
      </div>
    </div>
  );
}
