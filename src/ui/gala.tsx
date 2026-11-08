/* ============================================================
   UI — CHARM THE GUEST  ( src/ui/ )
   The gala as a little card game. Pick a guest and a work you
   covet, then play topic cards from a hand of three. Each card
   reveals whether the guest likes or hates that topic; the mood
   bar must reach the gold line before the turns run out.
   ============================================================ */
import { useState } from 'react';
import type { GameState } from '../data/types';
import { ARTIFACT_BY_ID } from '../data/artifacts';
import { rarityForScore } from '../data/constants';
import * as Gala from '../engine/gala';
import type { ConverseTag } from '../data/gala';
import { money } from '../engine/util';
import { Thumb } from './components';

const TOPIC: Record<ConverseTag, { icon: string; name: string }> = {
  prestige: { icon: '♛', name: 'Prestige' },
  scholarship: { icon: '✎', name: 'Scholarship' },
  exclusivity: { icon: '◆', name: 'Rarity' },
  publicity: { icon: '✦', name: 'Fame' },
  commerce: { icon: '§', name: 'Money' },
  accessibility: { icon: '⌂', name: 'The public' },
  flattery: { icon: '❦', name: 'Flattery' },
  history: { icon: '♜', name: 'Legacy' },
};

export function CharmGala({ state, onAccept, onClose }: {
  state: GameState;
  onAccept: (artId: string, weeks: number, fee: number, lender: string) => void;
  onClose: () => void;
}) {
  const [guests] = useState<Gala.Guest[]>(() => Gala.makeGuests(state.specialties));
  const [guest, setGuest] = useState<Gala.Guest | null>(null);
  const [convo, setConvo] = useState<Gala.Conversation | null>(null);
  const [learned, setLearned] = useState<Partial<Record<ConverseTag, 'like' | 'hate' | 'meh'>>>({});
  const [outcome, setOutcome] = useState<Gala.GalaOutcome | null>(null);
  const [pulse, setPulse] = useState(0);

  // 1. the room: pick a guest
  if (!guest) {
    return (
      <div className="panel charm">
        <div className="salon-kicker">A society gala</div>
        <h2 style={{ margin: '0 0 12px' }}>Who will you charm?</h2>
        <div className="charm-guests">
          {guests.map(g => (
            <button key={g.id} className="charm-guest" onClick={() => setGuest(g)}>
              <span className="charm-face">{g.name.replace(/^(Lady|Baron|Mme\.|Sir|Contessa|Mr\.|Dowager|Don|Mrs\.|Herr Direktor) /, '').charAt(0)}</span>
              <b>{g.name}</b>
              <span className="charm-owns">{g.collection.map(id => {
                const a = ARTIFACT_BY_ID[id];
                return <i key={id} style={{ background: rarityForScore(a.score).hex }} />;
              })}</span>
            </button>
          ))}
        </div>
        <button className="ghost" style={{ marginTop: 12, width: '100%' }} onClick={onClose}>Leave the gala</button>
      </div>
    );
  }

  // 2. pick the work to ask for
  if (!convo) {
    return (
      <div className="panel charm">
        <div className="salon-kicker">{guest.name}'s collection</div>
        <h2 style={{ margin: '0 0 12px' }}>Which work will you ask for?</h2>
        <div className="charm-works">
          {guest.collection.map(id => {
            const a = ARTIFACT_BY_ID[id];
            const band = rarityForScore(a.score);
            return (
              <button key={id} className="charm-work" style={{ borderColor: band.hex }}
                onClick={() => setConvo(Gala.startConversation(guest, id))}>
                <Thumb artifact={a} size="lg" />
                <b>{a.name}</b>
                <span className={'pill ' + band.cls}>{band.name}</span>
                <small>{Gala.thresholdForScore(a.score) <= 5 ? 'Easy ask' : Gala.thresholdForScore(a.score) <= 7 ? 'A real ask' : 'A big ask'}</small>
              </button>
            );
          })}
        </div>
        <button className="ghost" style={{ marginTop: 12, width: '100%' }} onClick={() => setGuest(null)}>← Another guest</button>
      </div>
    );
  }

  // 3. the conversation
  const art = ARTIFACT_BY_ID[convo.targetId];
  const goal = Gala.thresholdForScore(art.score);
  const max = goal + 4;
  const mood = Math.min(max, convo.trust);
  const play = (line: Gala.Conversation['options'][number]) => {
    const next = Gala.chooseLine(convo, line);
    setLearned(l => ({ ...l, [line.tag]: next.lastDelta >= 2 ? 'like' : next.lastDelta < 0 ? 'hate' : 'meh' }));
    setPulse(p => p + 1);
    setConvo(next);
    if (next.finished) setOutcome(Gala.conversationOutcome(next));
  };
  const face = convo.lastDelta >= 2 ? 'warm' : convo.lastDelta < 0 ? 'cold' : 'calm';

  return (
    <div className="panel charm">
      <div className="charm-top">
        <span className={'charm-face big ' + face} key={pulse}>{guest.name.replace(/^(Lady|Baron|Mme\.|Sir|Contessa|Mr\.|Dowager|Don|Mrs\.|Herr Direktor) /, '').charAt(0)}</span>
        <div className="charm-who">
          <b>{guest.name}</b>
          <span className="charm-learned">{(Object.keys(learned) as ConverseTag[]).map(t =>
            <i key={t} className={learned[t]}>{TOPIC[t].icon}</i>)}</span>
        </div>
        <div className="charm-ask"><Thumb artifact={art} size="sm" /></div>
      </div>

      <div className="charm-mood" aria-label={`mood ${mood} of ${goal} needed`}>
        <div className="charm-fill" style={{ width: `${(mood / max) * 100}%` }} />
        <div className="charm-goal" style={{ left: `${(goal / max) * 100}%` }} />
      </div>
      <div className="charm-turns">{Array.from({ length: convo.totalRounds }, (_, i) =>
        <i key={i} className={i < convo.round ? 'used' : ''} />)}</div>

      {!outcome ? (
        <div className="charm-hand">
          {convo.options.map(line => {
            const known = learned[line.tag];
            return (
              <button key={line.text} className={'charm-card' + (known ? ' ' + known : '')} onClick={() => play(line)}>
                <span className="cc-icon">{TOPIC[line.tag].icon}</span>
                <span className="cc-topic">{TOPIC[line.tag].name}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className={'charm-result' + (outcome.success ? ' won' : ' lost')}>
          <b>{outcome.success ? 'A loan secured' : 'Politely declined'}</b>
          {outcome.success && <span>{art.name} · {outcome.loanWeeks} weeks · {money(outcome.weeklyFee)}/week</span>}
          <button onClick={() => {
            if (outcome.success) onAccept(convo.targetId, outcome.loanWeeks, outcome.weeklyFee, guest.name);
            onClose();
          }}>{outcome.success ? 'Hang it' : 'Leave'}</button>
        </div>
      )}
    </div>
  );
}
