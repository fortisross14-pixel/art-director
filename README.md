# Museum Wars

A museum-management game: grow a rented room into a world-renowned
museum. See `GAME_DIRECTION.md` for the design direction and milestones. Found a museum, specialise in
artistic fields, win artworks at real-time auctions, fill themed
rooms, manage tickets and sponsors, and out-build a rival.

## Run locally

```bash
npm install
npm run dev
```

## Balance sim

```bash
npm run sim 104 5   # 5 headless careers of 104 weeks
```

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which
builds and publishes to GitHub Pages. After the first push, set
repo **Settings → Pages → Source** to **GitHub Actions**. The live
URL is then the repo URL: `https://<user>.github.io/museum-wars/`.

`git push` is the only deploy step.

## Structure

- `src/data/`   — types, constants, the artifact database (pure data)
- `src/engine/` — pure game logic; no DOM, no React. `game.ts` is the
  core, `auction.ts` the real-time auction sub-system.
- `src/ui/`     — React components; the only code that touches the DOM.

## Artwork images

Artifacts reference image paths under `public/artifacts/`. Until
those files exist, each artifact shows a letter placeholder. Drop
real images in (matching the `image` field in `src/data/artifacts.ts`)
and they appear automatically — no code change needed.
