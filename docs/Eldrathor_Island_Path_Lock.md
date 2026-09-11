# Island world path lock (2026-09-11)

> **Status:** LOCKED direction — follow **Anthony red-line diagram** (`island-path-sketch-anthony.png`) closer than any Boss preview. Preview v2: `island-path-refined-preview.png`.

## Intent
- Island map shows a **linear advance path**: **dotted line** between world nodes so the route is obvious.
- Progression goes **clockwise from Veinharbor (harbor)**, then climbs to the crystal summit.
- **~10 playable nodes** OK (may exceed old 5–7 worlds).
- Path must be **organic** — follow coast, roads, and terrain (Anthony red strokes), not straight blue shortcuts.
- **4 → 5** goes **behind the castle / peak**. That mid segment must **not be visible** in-game (occluded by mountain/castle art, or simply omitted). Only short visible stubs near pins 4 and 5.

## Nodes (order LOCKED)
Percentages are of the island art (origin top-left). Nudge onto landmarks if needed; keep order.

| # | x% | y% | Working label | Notes |
|---|----|----|---------------|-------|
| 1 | 47.0 | 73.0 | Harbor / Veinharbor | Start |
| 2 | 28.0 | 62.0 | Shore trail | SW forest edge |
| 3 | 17.0 | 38.0 | West cliffs | West coast buildings |
| 4 | 32.0 | 15.0 | NW shore | NW tip |
| 5 | 68.0 | 24.0 | NE lookout | NE — path from 4 hidden mid-route |
| 6 | 78.0 | 54.0 | East coast | East shore |
| 7 | 58.0 | 55.0 | East ruins | Inland east |
| 8 | 38.0 | 48.0 | Forge gate | Mid-mountain keep/gate |
| 9 | 42.0 | 28.0 | High walls | Climb above forge |
| 10 | 51.0 | 22.0 | Crystal / summit | End |

### Path polyline notes
- Prefer organic curves matching the **red** strokes on the sketch (coast-hugging 2→3→4, inland curve 6→7→8, climb 8→9→10).
- **4→5:** visible near 4 (e.g. toward ~38,12) and near 5 (e.g. from ~62,16); **do not draw** the behind-castle middle.

## UI requirements (for Claude)
- Dotted path along organic polyline; hide behind-castle segment.
- Pins 1–10 tappable; locked state retained.
- Pan + zoom; path/pins scale with map.
- Engage confirm / flee is a **separate** brief.

## DESIGN-OPEN
- Final display names for nodes 2–9
- Worlds vs sub-areas for AFK unlock gating
- Exact occlusion method (draw under castle layer vs omit segment)
