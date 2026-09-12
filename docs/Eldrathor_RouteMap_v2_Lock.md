# Route Map v2 — Web, Scouting, Depth, Node Types, Respawns (LOCKED 2026-09-12)

*Author: Claude Design Chat. Refines design doc §8c from Anthony's 2026-09-12 playtest. Replaces the "cut Attack/Flee" ruling with a designed scout-and-choose loop.*

## 1. The web (generation)
- Single connected web, **not a tree**. Every cleared node reveals **2–3 new frontier nodes**; frontier nodes revealed from different directions are **cross-linked** so paths keep rejoining (target: 30–40% of non-entrance nodes have ≥3 edges; at least 4 loops per map).
- Size 30–45 nodes (tier 9: 45+). Entrance at one edge, boss at the far edge; boss position varies within its quadrant.
- Texture rules (unchanged): 1–2 quiet trails (chains of 3–4 single-edge nodes), 1–2 dense clusters, 2–3 dead-ends, 1–2 long-edge curiosity nodes. Crystal nodes biased off the entrance→boss drift.
- **Depth** = shortest graph distance from entrance, normalised 0–1 by the boss's depth. Enemy hp/dmg multiplier = `1 + 0.5 × depth`. Rares and the boss ignore the depth multiplier (they have their own).

## 2. Scout → Engage / Leave (the interaction — replaces tap-to-fight)
- Frontier nodes show as **unknown** (dark rune). Tapping one **scouts** it: the rune resolves into its type icon, and a scout card slides up: type, enemy count, estimated threat (Easy / Even / Hard / Deadly vs current party), and for crystal/sanctuary nodes the yield.
- The card offers **Engage** (go to the fight/event) or **Leave** (card closes; node stays scouted-but-uncleared, you keep choosing elsewhere).
- **Scouting is a node-action:** it advances the respawn clock (§5) like a clear does. That is the cost — you can look before you commit, but looking everywhere lets the map fill in behind you. Scouted-uncleared nodes stay visible with their type.
- Fights start on Engage. There is no flee from inside a fight (auto-resolve, §8b).
- The current node's neighbours are always tappable; moving onto a cleared node to reposition is free (no scout card).

## 3. Node types (5)
| Type | Icon | What happens |
|---|---|---|
| **Fight** | crossed blades | 1–3 enemies. Loot + Worldvein. Map filler. |
| **Crystal** | blue shard | 2–3 enemies guarding a deposit; ×2 Worldvein on victory. |
| **Sanctuary** | green shard | **No fight.** A wild healing crystal: full HP + mana for the party, revive any fallen Adventurer, and one of: +10% damage this run / +10% mitigation this run / a small Worldvein pouch. 2–4 per map, never adjacent to each other, never adjacent to the entrance. Consumed on use. |
| **Rare** | red skull | Roaming mini-boss (§4). Big loot; may drop a class gem. |
| **Boss** | crown | Area boss. Sealed until all rares are dead (§4). |

## 4. Rares and the seal
- 2–3 rares per map. They **roam**: after every 2 node-actions each living rare moves one edge to a random revealed, uncleared, non-boss neighbour (or stays). Rares that roam onto a scouted node update its icon — the hunt is visible.
- Boss node is **sealed** (crown with chains). Killing all rares breaks the seal, the boss node pulses, and the shortest path to it lights.
- A rare that roams next to the current node ambushes: scout card is skipped, fight starts on your next action there.

## 5. Respawns and named variants
- Every node-action (clear, scout, or a rare-ambush fight) ticks the clock. Each cleared node has a **25% chance per 4 ticks** to respawn (tune). A respawned node shows a faint glow; moving through it = a fight (or route around).
- **10%** of respawns come back as a **named variant**: gold-rimmed icon, ×1.3 stats, drops one extra loot roll at +1 tier. Names are `<Adjective> <Enemy>` from the area roster (roster lock later).

## 6. Run end
- **Extract** (button on the route map): bank everything, return to the island map, map is discarded. Next entry = fresh map.
- **Boss kill**: area cleared; unlock next pin; **map-clear bonus** if every node was cleared: +50% Worldvein and one guaranteed rare-tier loot roll.
- **Wipe**: back to Veinharbor with banked loot, map discarded.
- App close mid-run: map frozen, resume in place.

## 7. Rally screen (before the route map)
- Header: area name, tier, boss name. 
- **Lore panel**: the area's 2–3 sentences (`Eldrathor_Island_Areas_Lock.md`).
- **Party panel**: the three fielded Adventurers, each tappable to **swap** from the roster (roster picker sheet). Warn if fewer than 3.
- **Explore** button. Back returns to the island map.
