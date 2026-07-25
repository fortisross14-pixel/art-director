# Museum Wars v7 — Gallery & Grey Market Pass

## Deployment
- Vite now uses a relative `base: './'`, so GitHub Pages assets resolve regardless of repository name or fork path.
- Existing GitHub Actions Pages workflow remains in place.

## Gallery editor
- The editor is capped to the viewport and scrolls internally.
- Display slots are compact and arranged in a five-slot wall row on desktop.
- Any eligible artwork can be placed in any themed gallery.
- Off-theme works remain legal but visibly display an `off-theme` warning.
- Cohesion and attractiveness now fall based on room-theme mismatch and relationships between the displayed works.
- Art quality still benefits from strong artworks, preserving the intended tradeoff.

## Grey market
- Authentication tests can only be used once and their costs are tracked.
- A dossier confidence meter summarizes how much evidence has been gathered.
- Price negotiation is now interactive: choose an offer, use evidence as leverage, react to dealer counters, and manage dealer patience.
- Very aggressive offers can consume extra patience and end negotiation.
- Final results separate dealer price, authentication expenses, and total investment.
