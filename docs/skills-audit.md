# Skills audit, November 2026

The game was audited against six public game-development skills, now installed in
`.claude/skills/` (sources and licenses in `.claude/skills/README.md`).

| Skill | Verdict before | Main findings | Status |
|---|---|---|---|
| `game-feel` | Concerns | Feedback wasn't tiered: hanging a work, finishing research and reaching a milestone all got the same log line | Fixed |
| `game-ui-ux` | Concerns | No visible keyboard focus; 10 text sizes under 11 px; rarity shown by colour alone in gala collections | Fixed |
| `card-game` | Critical | Three biased shuffles (`sort` with a random comparator); the gala deck never reshuffled its discards | Fixed |
| `save-systems` | Critical | No version number, no backup; a damaged save showed as an empty slot, so starting a new game there destroyed it; failed saves were silent | Fixed |
| `balance-check` | Critical, then Concerns | Remembered gala tastes made every loan certain (100% at full knowledge) | Fixed, one concern kept (below) |
| `ux-review` | Needs revision | Disabled buttons without a reason (expedition send, dig research); mixed "label · cost · cost" buttons | Fixed |

## What changed

**Feedback by importance (`game-feel`)**
- Small: toasts for routine results.
- Medium: hanging a work drops the frame onto the wall with the appeal change.
- Large: a moment card with an eased pop and a gold burst. It shows when research finishes (knowledge level, thesis, dig size) or a milestone is reached, queued after the season and annual reports.
- All of it respects reduced-motion settings.

**Layout and accessibility (`game-ui-ux`)**
- A gold focus ring on every button and input.
- Nothing informational under 11 px.
- Gala collections show a rarity letter on each square, not only its colour.

**Cards (`card-game`)**
- One Fisher–Yates `shuffled()` in `engine/util.ts` used everywhere.
- The gala keeps a pile of played and discarded cards and reshuffles it when the deck runs out.

**Saves (`save-systems`)**
- `SAVE_VERSION` is stamped on every save.
- The previous save is kept as a backup.
- Loading falls back to the backup when the latest save is damaged.
- A save from a newer build is refused, never loaded as empty.
- The home screen says which of these happened.
- The player is warned once if the browser refuses to store a save.

**Balance (`balance-check`)**, measured with a greedy bot, 3,000 galas per cell:

| Guest | Minor | Mid | Masterpiece |
|---|---|---|---|
| Stranger | 90% | 71% | 48% |
| Know 3 of 8 tastes | 97% | 88% | 71% |
| Know all, first loan | 100% | 100% | 99% |
| Know all, second loan | 100% | 99% | 91% |
| Know all, third loan | 100% | 95% | 75% |

Goals went up by 1, and each earlier loan from the same collector adds 3 charm to the goal.
- **Kept concern:** a well-known collector's first loan is near-certain. It takes several galas to learn their tastes, and a lent work leaves their collection, so it reads as a reward for building a relationship. Revisit if playtests say otherwise.
- **Career pacing is unchanged** (sweep, 15 years): National League in Years 2–4, World League in Years 6–8.

**Screens (`ux-review`)**
- Blocked actions say why: research first, knowledge needed, or how much money is missing.
- Prices sit under the action on every button.

**Settings, added in a follow-up (Office → Settings)**
- **Motion:** match the device, or reduce motion. Reduce turns off animations and transitions everywhere: falling frames, bursts and card deals.
- **Text and button size:** Standard, Large (115%) or Larger (130%). The whole interface scales.
- Checked at 390 px and Larger: no sideways scrolling on any menu or the gallery.
- Both settings are stored per device and apply to every save.

## Not done
- **Screen stack and back gestures** (`game-ui-ux`): overlays are separate flags, and the browser Back button leaves the game.
