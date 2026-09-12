# Map assets

- `island-world.png` — Mountain island world map (warm RPG micro-pixel). Landscape 1280×720; used with pan+zoom on portrait (`app/src/components/IslandWorldMap.jsx`). Harbor south, castle summit, blue crystal, no dragon. Candidate locked 2026-09-11 (Boss / Anthony).
  - Note: the file bytes are actually JPEG (JFIF) despite the `.png` name. Browsers sniff the content so it renders fine; keep the path as wired, or re-export as real PNG when the final asset lands.

## Island pins (LOCKED — `docs/Eldrathor_Island_Path_Lock.md` + `docs/Eldrathor_Island_Areas_Lock.md`)

Percent of the island art (origin top-left), in `app/src/map/islandPath.js` (`ISLAND_PINS`). Pin 1 = Veinharbor (opens Town); pins 2–10 = the nine areas (`AREAS[i].pin`), all tappable once unlocked. The dotted route is a Catmull-Rom spline through the pins + the lock's bend points, drawn in code by `IslandWorldMap.jsx`; segment 4→5 is two stubs only (the middle runs behind the castle).

| Pin | x % | y % | Area |
|---|-----|-----|------|
| 1 | 47 | 73 | Veinharbor (Town) |
| 2 | 28 | 62 | Gullwatch Trail (T1) |
| 3 | 17 | 38 | The Saltcliffs (T2) |
| 4 | 32 | 15 | Drowned Quay (T3) |
| 5 | 68 | 24 | Serpent's Stair (T4) |
| 6 | 78 | 54 | Ashfall Strand (T5) |
| 7 | 58 | 55 | The Hollow Ward (T6) |
| 8 | 38 | 48 | The Temple Forge (T7) |
| 9 | 42 | 28 | The Bastion (T8) |
| 10 | 51 | 22 | The Worldforge (T9) |

Zoom: Close (1.4× fit-height) ⇄ Overview (fit height) via the +/− control; camera starts on the harbor in Close.
