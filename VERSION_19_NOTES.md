# Version 19 — game skills installed and applied

Six game-development skills are installed in `.claude/skills/`. Four come unchanged from awesome-gamedev-agent-skills: `game-feel`, `game-ui-ux`, `card-game` and `save-systems`. Two come from Claude Code Game Studios, adapted to this repo: `balance-check` and `ux-review`. The game was audited against all six; the full report is in `docs/skills-audit.md`.

- **Big moments:** finishing research and reaching a milestone get their own card with a gold burst. Hanging a work keeps its smaller wall animation.
- **Safer saves:** every save has a version number and a backup. A damaged save recovers from the backup instead of looking like an empty slot, and a save from a newer version is never overwritten. The game warns you if the browser refuses to save.
- **Fairer cards:** an unbiased shuffle everywhere. The gala deck reshuffles its pile instead of running dry.
- **Gala balance:** goals are one point higher, and a collector who has already lent to you asks for 3 more charm each time.
- **Accessibility:** a visible keyboard focus ring, no informational text under 11px, and rarity letters alongside colours.
- **Clear blocked actions:** buttons that can't be used say why, and every price sits under its button's label.
