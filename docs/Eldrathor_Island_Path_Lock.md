# Island world path lock (2026-09-11)

> **Status:** LOCKED for Claude implementation. **Do not** ship Boss PNG overlays as the path — draw a **spline in `IslandWorldMap`** from the pin/control-point table. Anthony red-line sketch (`island-path-sketch-anthony.png`) is intent reference only.

## Intent
- Linear clockwise advance **1 → 10** from harbor to crystal.
- **~10 nodes** OK (may exceed old 5–7 worlds).
- Path = **smooth dotted spline** (Catmull‑Rom or cubic bezier) through pins + bend points — neat, not hand-traced scribbles.
- Feel **organic** (coast / approach curves), not straight chords between pins.
- **4 → 5** goes **behind the castle**: omit the mid segment (two stubs only). Do not draw a visible line across/through the peak.

## Pins (order LOCKED)
Percent of island art width×height (origin top-left). Claude may nudge slightly onto landmarks; keep order.

| # | x% | y% | Working label |
|---|----|----|---------------|
| 1 | 47.0 | 73.0 | Harbor / Veinharbor |
| 2 | 28.0 | 62.0 | Shore trail |
| 3 | 17.0 | 38.0 | West cliffs |
| 4 | 32.0 | 15.0 | NW shore |
| 5 | 68.0 | 24.0 | NE lookout |
| 6 | 78.0 | 54.0 | East coast |
| 7 | 58.0 | 55.0 | East ruins |
| 8 | 38.0 | 48.0 | Forge gate |
| 9 | 42.0 | 28.0 | High walls |
| 10 | 51.0 | 22.0 | Crystal / summit |

## Spline control (suggested bend points — path only)
Use as extra Catmull‑Rom / bezier handles between pins. Adjust if a curve clips ocean or buildings.

| Segment | Bend points (x%, y%) |
|---------|----------------------|
| 1→2 | (40, 70), (33, 66) |
| 2→3 | (22, 55), (18, 46) |
| 3→4 | (16, 28), (22, 20) |
| 4→5 | **STUB A:** (32,15)→(38,12) only. **STUB B:** (62,16)→(68,24) only. **No mid points** (behind castle). |
| 5→6 | (74, 34), (78, 44) |
| 6→7 | (70, 56) |
| 7→8 | (52, 60), (45, 58) |
| 8→9 | (39, 38) |
| 9→10 | (46, 24) |

## Implementation rules
- Render dotted stroke along sampled spline points in map space (scales with pan/zoom).
- Pins tappable; locked nodes inert.
- Keep warm RPG island + existing run flow (difficulty → node map) + tab persistence.
- Engage confirm / flee = separate brief.

## DESIGN-OPEN
- Final display names; AFK world-gate mapping; exact stub lengths for 4→5.
