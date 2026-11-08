/* ============================================================
   SHARED UI COMPONENTS  ( src/ui/ )
   ============================================================ */
import { useEffect, useState } from 'react';
import type { Artifact } from '../data/types';
import { rarityForScore } from '../data/constants';

/* --- images from Wikipedia ----------------------------------
   Known works (Rare and up, hand-written catalogue) ask Wikipedia
   for the article's main image, free licences only, one request at
   a time. Answers (including "none") are remembered in the browser,
   so each work is looked up once per device. */
const CACHE_KEY = (id: string) => 'art-img:' + id;
const queue: (() => Promise<void>)[] = [];
let busy = false;
function runQueue() {
  if (busy) return;
  const job = queue.shift();
  if (!job) return;
  busy = true;
  job().finally(() => { busy = false; setTimeout(runQueue, 150); });
}
function cachedImage(id: string): string | null | undefined {
  try { const v = localStorage.getItem(CACHE_KEY(id)); return v === null ? undefined : v || null; }
  catch { return null; }
}
function lookupImage(a: Artifact, done: (url: string | null) => void) {
  queue.push(async () => {
    let url: string | null = null;
    try {
      const q = new URLSearchParams({
        action: 'query', format: 'json', origin: '*', redirects: '1', prop: 'pageimages',
        piprop: 'thumbnail', pithumbsize: '400', pilicense: 'free', titles: a.name,
      });
      const res = await fetch('https://en.wikipedia.org/w/api.php?' + q);
      const json = await res.json();
      const page = Object.values(json?.query?.pages || {})[0] as { thumbnail?: { source: string } } | undefined;
      url = page?.thumbnail?.source || null;
      try { localStorage.setItem(CACHE_KEY(a.id), url || ''); } catch { /* private mode */ }
    } catch { /* offline: try again next time */ }
    done(url);
  });
  runQueue();
}
const canLookUp = (a: Artifact) => /^\d+$/.test(a.id) && Number(a.id) <= 610 && a.score >= 20;

/** a link to read about the work */
const wikiLink = (a: Artifact) =>
  'https://en.wikipedia.org/wiki/Special:Search?search=' + encodeURIComponent(`${a.name} ${a.author === 'Unknown' ? '' : a.author}`.trim());

/* --- artifact thumbnail with letter fallback ----------------
   Tries /artifacts/<file>. Until that file exists (it doesn't
   yet), the artifact's first letter is shown instead. Dropping
   real images into public/artifacts/ later needs no code change. */
export function Thumb({
  artifact, size, onClick,
}: {
  artifact: Artifact;
  size?: 'sm' | 'lg';
  onClick?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const [remote, setRemote] = useState<string | null | undefined>(() => cachedImage(artifact.id));
  useEffect(() => {
    if (!failed || remote !== undefined || !canLookUp(artifact)) return;
    let live = true;
    lookupImage(artifact, url => { if (live) setRemote(url); });
    return () => { live = false; };
  }, [failed, remote, artifact]);
  const cls = 'thumb'
    + (size ? ' ' + size : '')
    + (onClick ? ' clickable' : '');
  return (
    <div
      className={cls}
      title={artifact.name}
      onClick={onClick}
    >
      {failed && remote ? (
        <img src={remote} alt={artifact.name} loading="lazy" />
      ) : failed ? (
        artifact.name.charAt(0).toUpperCase()
      ) : (
        <img
          src={import.meta.env.BASE_URL + artifact.image}
          alt={artifact.name}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

/* --- rarity pill (derived from score) ----------------------- */
export function RarityPill({ score }: { score: number }) {
  const band = rarityForScore(score);
  return <span className={'pill ' + band.cls}>{band.name}</span>;
}

/* --- artifact detail view ----------------------------------- */
export function ArtifactDetail({
  artifact, onBack,
}: {
  artifact: Artifact;
  onBack: () => void;
}) {
  const band = rarityForScore(artifact.score);
  return (
    <div className="panel">
      <h2>
        Catalogue Entry
        <span className="sub">artifact detail</span>
      </h2>
      <div className="divider" />
      <div className="detail-head">
        <Thumb artifact={artifact} size="lg" />
        <div className="detail-body">
          <div className="detail-title">{artifact.name}</div>
          <div className="detail-meta">
            {artifact.author} · {artifact.year}
          </div>
          <div>
            <RarityPill score={artifact.score} />{' '}
            <span className={'score-badge ' + band.cls}>
              Score {artifact.score}
            </span>
          </div>
        </div>
      </div>
      <dl className="detail-grid">
        <dt>Type</dt><dd>{artifact.type}</dd>
        <dt>Style</dt><dd>{artifact.style}</dd>
        <dt>Author</dt><dd>{artifact.author}</dd>
        <dt>Year</dt><dd>{artifact.year}</dd>
      </dl>
      <p className="detail-desc">{artifact.description}</p>
      {/^\d+$/.test(artifact.id) && Number(artifact.id) <= 610 && (
        <p><a href={wikiLink(artifact)} target="_blank" rel="noreferrer">Look it up on Wikipedia ↗</a></p>)}
      <div className="divider" />
      <button className="ghost" onClick={onBack}>← Back</button>
    </div>
  );
}
