---
name: ux-review
description: "Review Art Director's actual screens (not spec documents) for player need, flow, states, accessibility and touch use, with phone-width screenshots. Verdict: APPROVED / NOT ASSESSED / NEEDS REVISION / MAJOR REVISION NEEDED."
argument-hint: "[screen name or 'all']"
---

<!-- Adapted from the ux-review skill in Claude Code Game Studios
     (github.com/Donchitos/Claude-Code-Game-Studios @ 05ad7c8, MIT, (c) 2026 Donchitos;
     see .claude/skills/_licenses). Changes: reviews running screens instead of UX spec
     files; checklist rewritten for a touch-first web game; pipeline hooks removed. -->

# UX Review (Art Director)

Reviews the screens players actually use. Pair with `game-ui-ux` (layout, safe area,
accessibility floors) and `game-feel` (feedback on actions).

## Inputs
- The running app (`npx vite`), driven with Playwright at **390 × 860** (phone) and
  one desktop width. Take a screenshot of every state you judge.
- Screens live in `src/ui/v2/` (Week, Museum, Acquire, Office, games, pickers).
- The design pillars in `GAME_DIRECTION.md` (touch first, less text more game,
  visible progression).

If the app cannot be run or a screen cannot be reached, that screen is NOT ASSESSED.

## Checklist, per screen

**Player need**
- [ ] One sentence: "The player arrives here wanting to ___." The screen's first
      thing on view serves that want.
- [ ] Entry points (how you get here) and exits (back, done, next) are obvious.
- [ ] The next sensible action is visible without scrolling on a phone.

**States**
- [ ] Empty state says what to do, not just that it's empty.
- [ ] Error / blocked actions say why and how to unblock (not a silent disabled button).
- [ ] Locked content says what unlocks it.

**Touch and layout**
- [ ] Targets at least 44 px; nothing needs precision.
- [ ] Sheets and overlays can always be closed, also when taller than the screen.
- [ ] No horizontal scroll; text never clipped at 390 px.

**Feedback** (see `game-feel`)
- [ ] Every player action gets a visible response proportional to its importance.
- [ ] Big moments (a rare pull, a promotion, a won auction) are bigger than small ones.

**Accessibility**
- [ ] State is never shown by colour alone (add a word, icon or shape).
- [ ] Text contrast at least 4.5:1 for information; reduced motion respected.

**Words**
- [ ] Plain words from the player's side; numbers explained once where they appear.

## Output

```
## UX Review: [screen]
Player need: [sentence]
### Issues   | # | Issue | Where | BLOCKING / ADVISORY | Fix |
### Verdict: APPROVED / NOT ASSESSED / NEEDS REVISION / MAJOR REVISION NEEDED
```
For `all`, start with a table: screen | verdict | main issue.
The review itself changes nothing; fixes come after, one issue at a time, each
re-checked with a fresh screenshot.
