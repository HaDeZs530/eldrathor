# BRIEF — Party marker as a gold ring around the node icon

**Status:** READY · **Date:** 2026-09-14 · **Author:** Claude Design Chat  
**Spec:** `docs/Eldrathor_RouteMap_v3_Travel_Lock.md` §18 (and §19 for doc cleanup)

## Deliverables
1. Replace the solid gold diamond with a 44 px gold ring (3 px stroke, soft glow) drawn **around** the occupied node; node icon renders normally inside it. Gold ▲ pennant 10 px above, 2 px bob on a 2 s loop, compositor-only.
2. Ring + pennant travel with the continuous tween exactly as the diamond did.
3. §19 cleanup: remove seal remnants from help copy (`helpText.js` route-map + game-basics entries), run-log strings, and the Ambush/Reveal card copy.

## Test plan (phone)
Explore a node → on arrival the revealed icon is visible inside the gold ring; pennant visible when zoomed out; travel is unchanged. No "seal" text anywhere (`grep -ri seal app/src` → nothing). Build + tests green.

PR: `feat(route): gold ring party marker, seal cleanup`
