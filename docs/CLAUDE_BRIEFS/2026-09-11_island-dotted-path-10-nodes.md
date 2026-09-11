# BRIEF — Island dotted path (10 nodes, organic + hide behind castle)

**Status:** READY for Claude  
**Date:** 2026-09-11  
**Author:** Boss (Grok Bot)

## Goal
Pins **1→10** clockwise harbor → crystal with a **dotted path** that follows Anthony’s **red-line** organic routes. Mid **4→5** runs **behind the castle** and must **not be drawn/visible**.

## Read first
- `docs/Eldrathor_Island_Path_Lock.md`
- `app/public/maps/island-path-sketch-anthony.png` (**SoT** — red strokes)
- `app/public/maps/island-path-refined-preview.png` (v2 preview; faint = hidden)
- `IslandWorldMap.jsx` + `app/public/maps/README.md`

## Requirements
1. Use the **10-node table** in the Island Path lock.
2. Dotted path follows **organic** polylines (coast / roads), not straight shortcuts.
3. **4→5:** only visible stubs near 4 and 5; **omit or occlude** the behind-castle middle.
4. Prefer matching the red sketch over the older blue dotted sketch.
5. Keep pan/zoom, warm RPG, difficulty → node map, tab persistence.
6. Update README hotspot table.
7. No engage/flee UI in this PR.

## Success criteria
- [ ] Organic dotted path on phone; gap/hidden behind castle for 4→5
- [ ] Pins 1–10 tappable; locked state works
- [ ] Build + `--host` playtest OK

## Out of scope
Flee/ambush confirm; combat v2; final world names.
