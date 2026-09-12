# BRIEF — Route map v3: one-tap travel, node visual states, ambush flee, Mind-view scale fix

**Status:** READY · **Date:** 2026-09-12 · **Author:** Claude Design Chat  
**Spec:** `docs/Eldrathor_RouteMap_v3_Travel_Lock.md` (authoritative)

## Deliverables
1. **Travel** (lock §1): BFS shortest path through cleared nodes from `routeState`; `travelTo(nodeId)` action that steps the party one hop per ~120 ms, ticking the node-action clock per hop, halting on a respawned node (→ ambush). Frontier tap = travel to nearest cleared neighbour then open the scout card. Path highlight 300 ms before moving; tap again to skip the animation.
2. **Node rendering** (lock §2): state machine → shape + colour exactly as the table; party marker is a gold diamond; unknown nodes slate-blue hollow with pulse; edges styled per state; 44 px hit areas.
3. **Ambush + Flee** (lock §3): `AmbushCard` with Fight/Flee, flee odds formula, success = step back + one action; fail = `simulateFight({ enemyFirst: true })` giving enemies a 1.5 s free window. Add a simulate test for `enemyFirst`.
4. **Mind-view scale** (lock §4): set the vars to the new values, add `--mv-title`, bars 14 px, and **remove every inline numeric `fontSize` below `--mv-label` in FightScreen, LootResults, SanctuaryScreen, RallyScreen, RouteMapScreen and the cards** — replace with the vars. Grep for `fontSize: [0-9]` in those files must return only values ≥ 15 or var references.

5. **Fight screen order** (lock §5): remove the party HP-bar row from the stage; order = enemies → party cards → speed controls → feed. Party cards carry HP/mana/innate/aura.

## Test plan (phone)
Tap a cleared node 8 hops away → marker walks there in ~1 s, clock ticks 8, a respawned node on the path stops it with the ambush card. Flee works and fails visibly (enemies hit first). Party marker is gold, unknown nodes read blue-veiled, rare is the only red. Fight screen shows enemies, then party cards, then 1×/2×/Skip, then the feed, with no duplicate party bars; text is obviously larger than before; party cards ≥ 120 px; Rally lore is 18 px. Build + tests green.

PR: `feat(route): one-tap travel, node visual states, ambush flee, mind-view scale`
