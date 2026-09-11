# Island world path lock (2026-09-11)

> **Status:** LOCKED direction (Anthony sketch). Hotspot % are **v1 refine** from the sketch — Claude may nudge pins onto visible roads/landmarks but must keep order and clockwise intent. Preview: `app/public/maps/island-path-refined-preview.png`. Sketch SoT: `app/public/maps/island-path-sketch-anthony.png`.

## Intent
- Island map shows a **linear advance path**: **dotted line** between world nodes so the route is obvious.
- Progression goes **clockwise from Veinharbor (harbor)**, then climbs to the crystal summit.
- **Node count may exceed** the original 5–7 world plan — **~10 playable areas** is OK for this map.
- Path must **follow roads / terrain / shoreline**, not cut across open ocean.
- Special fix: **4 → 5** must hug the **northern land / mountain shelf**, not arc over water (Anthony called this out).

## Nodes (order LOCKED)
Percentages are of the island art width × height (origin top-left), matching `island-world.png` / preview.

| # | x% | y% | Working label | Notes |
|---|----|----|---------------|-------|
| 1 | 47.0 | 72.0 | Harbor / Veinharbor | Start; may open Town or act as hub pin |
| 2 | 30.0 | 59.0 | Shore trail | West of town, into forest |
| 3 | 19.0 | 36.0 | West cliffs | NW coast / cliff buildings |
| 4 | 33.0 | 16.0 | NW shore | Far NW tip |
| 5 | 66.0 | 25.0 | NE lookout | NE side — connected via **land** waypoints |
| 6 | 75.0 | 52.0 | East coast | Eastern shore / peninsula feel |
| 7 | 56.0 | 52.0 | East ruins | Inland east clearing/ruins |
| 8 | 41.0 | 46.0 | Forge gate | Mid-mountain approach / gate |
| 9 | 44.0 | 18.0 | High walls | Upper castle approach |
| 10 | 51.0 | 23.0 | Crystal / summit | End / Vaelyx / boss area |

### Land waypoints (path only, not pins) — 4 → 5
Use for the dotted polyline only: `(38,14) → (45,12) → (53,13) → (60,18)` then node 5. Adjust slightly to visible shore/ridge if needed.

## UI requirements (for Claude brief)
- Draw **dotted path** along the polyline (nodes + 4→5 waypoints).
- Pins 1–10 tappable; locked nodes show locked state.
- Keep **pan + zoom**; path/pins scale with the map.
- Does **not** replace engage-confirm / flee (separate playtest lock).

## DESIGN-OPEN
- Final display names for nodes 2–9
- Which nodes are “worlds” vs sub-areas for AFK unlock gating
- Exact pin snap to roads after art polish
- Whether harbor (#1) starts unlocked-only vs also a Town shortcut
