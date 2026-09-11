# Map assets

- `island-world.png` — Mountain island world map (warm RPG micro-pixel). Landscape 1280×720; used with pan+zoom on portrait (`app/src/components/IslandWorldMap.jsx`). Harbor south, castle summit, blue crystal, no dragon. Candidate locked 2026-09-11 (Boss / Anthony).
  - Note: the file bytes are actually JPEG (JFIF) despite the `.png` name. Browsers sniff the content so it renders fine; keep the path as wired, or re-export as real PNG when the final asset lands.
- `island-path-sketch-anthony.png`, `island-path-refined-preview.png` — route intent reference only. Not shipped as the path graphic; the route is drawn in code.

## Island route pins (order LOCKED — `docs/Eldrathor_Island_Path_Lock.md`)

Percent of the island art (origin top-left). Defined in `app/src/map/islandPath.js` (`ISLAND_PINS`). The dotted route is a Catmull-Rom spline through the pins plus the lock's bend points, rendered by `IslandWorldMap.jsx` as two SVG paths. Segment 4→5 is two stubs only (A: pin 4 → (38,12); B: (62,16) → pin 5); the middle runs behind the castle and is never drawn.

| Lock row | Shown on pin | x % | y % | Working label | Run data (placeholder mapping — DESIGN-OPEN) |
|---|---|-----|-----|---------------|-----------------------------------------------|
| 1 | ⌂ (town icon) | 47 | 73 | Veinharbor | opens Town tab (no run) |
| 2 | 1 | 28 | 62 | Shore trail | W1 Shoreline Forest |
| 3 | 2 | 17 | 38 | West cliffs | W2 Overrun Peninsula Town |
| 4 | 3 | 32 | 15 | NW shore | W3 The Ravine Path |
| 5 | 4 | 68 | 24 | NE lookout | W3 The Ravine Path |
| 6 | 5 | 78 | 54 | East coast | W3 The Ravine Path |
| 7 | 6 | 58 | 55 | East ruins | W4 The Magical Forge |
| 8 | 7 | 38 | 48 | Forge gate | W4 The Magical Forge |
| 9 | 8 | 42 | 28 | High walls | W5 The Upper Castle |
| 10 | 9 | 51 | 22 | Crystal summit | W6 Vaelyx |

Display numbering (Anthony, 2026-09-11): the harbor pin shows a town icon and the route nodes count 1–9 after it; the lock's row numbers are unchanged. Whether the route ends up 9 or 10 nodes + harbor is DESIGN-OPEN (add a row to `ISLAND_PINS`).

A pin's locked / held / open state comes from its mapped world versus the player's `unlocked` world, so boss kills still advance progression unchanged. Final display names and worlds-vs-sub-areas gating are DESIGN-OPEN.

Camera: starts centred on pin 1 at zoom 1.4 (zoom 1.0 = whole island fits the viewport height; max 3.5).
