# BRIEF — Island dotted path via spline (10 nodes)

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

## Claude implementation notes (2026-09-11, branch `feat/island-spline-path`)
- **Pins:** `app/src/map/islandPath.js` holds the LOCKED 10-pin table, bend points and the 4→5 stub endpoints verbatim from `Eldrathor_Island_Path_Lock.md`. `IslandWorldMap.jsx` renders them as numbered warm-RPG pins (1–10); the old 7-hotspot table is gone.
- **Spline:** `catmullRomPath()` converts pins + bend points into cubic beziers (tension 0.85). Two open curves: [1 → 4 → stub A (38,12)] and [stub B (62,16) → 5 → 10]. Nothing is drawn between the stubs, so no line crosses the castle. Rendered as two SVG paths inside the pannable layer (dark underlay + cream dots via `stroke-dasharray: 0 11`, round caps) so it scales with pan/zoom. No PNG overlays.
- **Pin → run data (DESIGN-OPEN placeholder):** pins map onto the existing 6 WORLDS by geography (1 = Town, 2 → W1, 3 → W2, 4/5/6 → W3, 7/8 → W4, 9 → W5, 10 → W6) so difficulty → node map and boss-unlock progression are unchanged. Locked/held/open on a pin follows its mapped world. Table in `app/public/maps/README.md`. Final names and worlds-vs-sub-areas gating remain open.
- **Pin numbering (Anthony, chat 2026-09-11):** harbor pin shows a **town icon** (⌂) instead of "1"; route nodes display **1–9** after it. Display-only; the lock's 10-row table is unchanged. Anthony undecided between 9 nodes + harbor (current) and 10 + harbor — **DESIGN-OPEN**, one extra `ISLAND_PINS` row if 10.
- **Camera:** starts on the harbor pin at zoom 1.4; the ⚓ button recentres there.
- **Verified** (375×812 emulation): spline neat on phone, stub gap behind castle, pins 1–10 tappable (locked inert, pin 2 → Difficulty, pin 1 → Town), pan/zoom + tab persistence unchanged, `npm run build` + eslint clean on touched files.
- **Not done / for Boss:** engage confirm + flee/ambush (separate brief); phone `--host` playtest is Anthony's.

