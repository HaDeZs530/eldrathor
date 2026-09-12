# BRIEF — Island dotted path via spline (10 nodes)

> **DONE (folded into the UI Shell brief, 2026-09-12)** — the Catmull-Rom spline from `app/src/map/islandPath.js` is drawn in code on the island map (PR: UI shell); pins 2–10 are the nine areas (`Eldrathor_Island_Areas_Lock.md`) and all are tappable, superseding the earlier 6-of-10 ruling.

**Status:** READY for Claude  
**Date:** 2026-09-11  
**Author:** Boss (Grok Bot)

## Goal
In `IslandWorldMap`, show pins **1→10** and a **smooth dotted spline path** between them (organic curves). **Hide** the mid **4→5** segment behind the castle (stubs only).

## Read first
- `docs/Eldrathor_Island_Path_Lock.md` — pin table + bend points + 4→5 stub rule
- `app/public/maps/island-path-sketch-anthony.png` — intent only (red lines)
- Existing `IslandWorldMap.jsx` / CSS / `app/public/maps/README.md`

## Requirements
1. Replace ~7 hotspots with the **10-pin table** from the lock.
2. Draw path in **code** (SVG or canvas): Catmull‑Rom or cubic bezier through pins + suggested bend points. Sample to a **dotted** stroke. **Do not** use Boss preview PNGs as the path graphic.
3. **4→5:** two stubs only; no visible mid path behind/through castle.
4. Keep pan/zoom, warm RPG, difficulty → node map, tab persistence, locked-pin UX.
5. Update `app/public/maps/README.md` with the pin table.
6. No engage/flee UI in this PR.

## Success criteria
- [ ] Smooth dotted spline looks neat on phone (not jagged scribbles)
- [ ] Gap / no line behind castle for 4→5
- [ ] Pins 1–10 work; locked state OK
- [ ] `npm run build` + `--host` playtest OK

## Out of scope
Flee/ambush confirm; combat v2; final world names; regenerating island art.
