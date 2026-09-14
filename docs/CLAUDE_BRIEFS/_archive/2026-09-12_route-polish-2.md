# BRIEF — Route map polish 2: run log, node scale, planar outward web, travel pacing + camera follow

> **DONE** — PR #29.

**Status:** READY · **Date:** 2026-09-12 · **Author:** Claude Design Chat  
**Spec:** `docs/Eldrathor_RouteMap_v3_Travel_Lock.md` §9–§12 (authoritative)

## Deliverables
1. **Run log** (§9): `routeState.log[]` events appended by every action; HUD scroll icon with unread badge; `RunLogSheet` (Mind-view, scrollable, newest at bottom); 3 s toast of the latest line under the HUD strip.
2. **Node scale** (§10): party 40 px, icons 34 px, unknown 26 px, edges 3 px.
3. **Planar outward generator** (§11): rewrite edge construction in `genTerritory.js` — candidate edges from a Delaunay/Gabriel pass over positions, segment-intersection rejection, prune to 2–4 per node, keep connectivity + ≥4 loops, cross-links only between equal/adjacent depth bands; positions laid out in depth bands from entrance edge to boss edge. Add a test: zero crossing edges over 200 generated maps, and every node's depth-band neighbours differ by ≤1.
4. **Travel pacing + camera** (§12): 350 ms eased glide per hop; camera eases to party (300 ms) then follows; 200 ms pause before cards; tap-to-skip; all camera motion eased ≥250 ms including pan release.

## Test plan (phone)
Log opens and lists the run; badge clears on open. Nodes read clearly larger. Generate 10 maps — no crossing lines, structure fans outward from the entrance. A long trip is smooth, centred, followable, ~4 s, skippable; no jerky cuts anywhere on the route map. Build + tests green.

PR: `feat(route): run log, node scale, planar outward web, travel pacing + camera follow`
