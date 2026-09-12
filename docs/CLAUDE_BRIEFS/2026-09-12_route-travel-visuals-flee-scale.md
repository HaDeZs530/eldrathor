# BRIEF — Route map v3: one-tap travel, node visual states, ambush flee, Mind-view scale fix

> **DONE** — PR #23 (travel, node states, ambush flee, scale, fight order) + PR #26 (§6–§8 amendments: no respawns, free travel, named at generation, full-screen map) + PR #27/#28 (camera margin).

**Status:** READY · **Date:** 2026-09-12 · **Author:** Claude Design Chat  
**Spec:** `docs/Eldrathor_RouteMap_v3_Travel_Lock.md` (authoritative)

## Deliverables
1. **Travel** (lock §1 as amended by §6): BFS shortest path through cleared nodes; `travelTo(nodeId)` steps the party one hop per ~120 ms. **Travel is free** — no clock ticks, no ambushes en route (unless the destination is an unscouted rare). Frontier tap = travel to nearest cleared neighbour then open the scout card. Path highlight 300 ms before moving; tap again to skip the animation.
2. **Node rendering** (lock §2): state machine → shape + colour exactly as the table; party marker is a gold diamond; unknown nodes slate-blue hollow with pulse; edges styled per state; 44 px hit areas.
3. **No respawns** (lock §6): delete the respawn mechanic and `respawned` state entirely; named variants roll at generation (10% of Fight nodes, min 1); rares roam only on scout/clear actions.
3b. **Ambush + Flee** (lock §3, scoped by §6): `AmbushCard` with Fight/Flee, flee odds formula, success = step back + one action; fail = `simulateFight({ enemyFirst: true })` giving enemies a 1.5 s free window. Add a simulate test for `enemyFirst`.
4. **Mind-view scale** (lock §4): set the vars to the new values, add `--mv-title`, bars 14 px, and **remove every inline numeric `fontSize` below `--mv-label` in FightScreen, LootResults, SanctuaryScreen, RallyScreen, RouteMapScreen and the cards** — replace with the vars. Grep for `fontSize: [0-9]` in those files must return only values ≥ 15 or var references.

6. **Route map size** (lock §7): map fills header→tab bar; HUD is one 44 px overlay strip; node sizes +40%; default zoom ≈ 12–16 nodes visible.
5. **Fight screen order** (lock §5): remove the party HP-bar row from the stage; order = enemies → party cards → speed controls → feed. Party cards carry HP/mana/innate/aura.

## Test plan (phone)
Tap a cleared node 8 hops away → marker walks there in ~1 s with no ticks and no interruption. Nothing ever respawns. A named node is visible after scouting. Flee works and fails visibly (enemies hit first). Route map fills the screen with a single thin HUD strip; party marker is gold, unknown nodes read blue-veiled, rare is the only red. Fight screen shows enemies, then party cards, then 1×/2×/Skip, then the feed, with no duplicate party bars; text is obviously larger than before; party cards ≥ 120 px; Rally lore is 18 px. Build + tests green.

PR: `feat(route): one-tap travel, node visual states, ambush flee, mind-view scale`
