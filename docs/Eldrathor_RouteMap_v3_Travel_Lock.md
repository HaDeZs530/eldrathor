# Route Map v3 — Travel, Node Visual States, Ambush Flee (LOCKED 2026-09-12)

*Author: Claude Design Chat, from Anthony's playtest round 2. Extends `Eldrathor_RouteMap_v2_Lock.md` (which stays in force).*

## 1. Travel — one tap to anywhere you've cleared
Backtracking hop-by-hop across a 30–45 node web is clicking, not play. But free teleport loses the territory feel. The answer is **travel with cost**:
- **Tap any cleared node** → the party **travels** there along the shortest path through cleared nodes. The party marker animates hop by hop (≈120 ms per hop, skippable by tapping again). One tap, whatever the distance.
- **Each hop is a node-action** and ticks the respawn/rare clock. Long trips let the map fill in behind you — that's the cost, and it's a real decision on a big map.
- **A respawned node on the path stops the trip there:** travel halts, the ambush rule (§3) fires. Route around it next time or fight through.
- **Tap a frontier (unknown) node anywhere** → the party travels to its nearest cleared neighbour, then scouts it (v2 scout card). So the whole map is one-tap; "adjacent only" is gone.
- Tapping the current node does nothing. Tapping the sealed boss node travels to its neighbour and shows the seal card ("Rares remaining: 2").
- The route map shows the **planned path highlighted** for 300 ms before the marker moves, so the player sees which way it's going.

## 2. Node visual states (LOCKED palette; shapes distinguish state, colour distinguishes type)
| State | Shape | Colour | Notes |
|---|---|---|---|
| **Unknown** | small rune circle, hollow | slate-blue `#5b6a8a` stroke, faint inner glow pulsing 3 s | replaces brownish-black; reads as "veiled," not "dirt" |
| **Scouted (uncleared)** | type icon in a hollow ring | type colour (below) | icon shows what's there |
| **Cleared** | filled dot, small | dim teal `#3d6b6e` | recedes; the trail behind you |
| **Party (current)** | **diamond** with a bright ring | gold `#e8c46a` on white core | never red; gold = you |
| **Respawned** | cleared dot with an amber halo | amber `#d99a3a` | "something's back" |
| **Named variant** | scouted ring, gold rim, double stroke | gold rim over type colour | |
| **Rare (roaming)** | skull icon | crimson `#c0392b` | the only red on the map |
| **Boss (sealed)** | crown icon with chain overlay | violet `#8e6bd1`, chains grey | pulses violet when unsealed |
| **Sanctuary** | soft shard, rounded | green `#5fbf8a` | |
| **Crystal** | sharp shard | Mythros blue `#4fa3ff` | |
| **Fight** | crossed blades | steel `#a9b4c7` | |
Edges: cleared↔cleared = solid dim teal; to frontier = dotted slate; planned travel path = gold for 300 ms. Sizes: node hit area ≥ 44 px regardless of drawn size.

## 3. Ambush + Flee (restored, scoped)
Flee exists **only for ambushes** — never on a chosen Engage.
- **Ambush** occurs when: a roaming rare moves onto/next to the party, or travel hits a respawned node.
- Ambush card: enemy type/count + **Fight** / **Flee**. Flee chance: **65%** base; **45%** if the ambusher is a rare; **+5% per Striker or Adept** in the party (they're the quick ones). Bosses never ambush.
- **Flee success:** party steps back to the previous node; the ambusher stays (rare keeps roaming; respawned node stays respawned). Costs one node-action.
- **Flee fail:** fight starts with enemies acting first — a **1.5 s free window** before the party's first swings.
- Combat v2: `simulateFight` gets an `enemyFirst` flag for the free window.

## 4. Mind-view scale — hard numbers (supersedes the UI Shell lock's values)
The previous pass set the vars near browser defaults, so nothing visibly changed. New values, and an **audit rule: no inline `fontSize:` numbers below the label size anywhere a Mind-view screen renders** — Fight, Route map, Scout/Ambush/Seal cards, Sanctuary, Results, Rally.

| Var | Value |
|---|---|
| `--mv-text` | **18px** |
| `--mv-label` | **15px** (uppercase labels may use 14px with letter-spacing) |
| `--mv-num` | **24px** (HP/mana numbers, damage in results) |
| `--mv-title` | **26px** |
| `--mv-feed` | **17px**, line-height 1.45 |
| `--mv-tap` | **52px** min height for any button |
| `--mv-card-min` | **120px** party card |
| Bars | HP/mana bars **14px** tall, not 6–8 |
Rally lore panel uses `--mv-text`; Rally name/tier uses `--mv-title`/`--mv-label`. The 9–14 px inline sizes in `RallyScreen.jsx` are removed.

## 5. Fight screen order (amends Combat v2 lock §6)
Top to bottom: **enemies row → party cards (HP, mana, innate button, aura icon) → speed controls (1×/2×/Skip) → combat feed.** The separate party HP-bar row on the stage is **removed** — the party cards are the party's only representation; the stage shows enemies only, with hit-flashes on the enemy portraits. No duplicated bars anywhere.

## 6. NO RESPAWNS — cleared stays cleared (RULED 2026-09-12, supersedes v2 §5 and design doc §8c respawn text)
Playtest verdict: the route map is about clearing and progressing. **Cleared nodes never repopulate. Backtracking and crossing the map is free** — travel hops do NOT tick any clock, do NOT trigger ambushes, and there is no penalty for going anywhere you've cleared.
- **Named variants** now spawn at **generation**: 10% of Fight nodes (min 1 per map) are named — gold rim once scouted, ×1.3 stats, +1 loot roll at +1 tier.
- **Rares still roam**, but only on **scout and clear** actions (one move per 2 such actions), never on travel hops. Ambush + Flee (§3) applies only to a rare that roams onto the party's node or the party travelling into a rare's node unscouted.
- Remove the amber "respawned" visual state from §2. Remove `respawned` from `routeState`.
- Map-clear bonus (v2 §6) stands and is now reliably attainable.

## 7. Route map must dominate the screen
The route map fills everything between the screen header and the tab bar; the run HUD (Worldvein banked, rares remaining, Extract) is a **single 44 px strip** overlaid at the top of the map, not a stacked panel. Node draw size goes up ~40% (party diamond ≈ 34 px, type icons ≈ 28 px, unknown runes ≈ 22 px); default camera zoom shows roughly 12–16 nodes, pan for the rest. Nothing else on the page competes with it.

## 8. What the route map IS (design intent — LOCKED 2026-09-12)
The route map is a **farm loop**, not a survival gauntlet. Enter → clear outward → hunt the rares → break the seal → kill the boss → extract → re-enter a fresh map and do it again. Pressure comes from **fight difficulty** (depth scaling, rare and boss power, the gear wall) and from **the decision of how much to clear before the boss** (full-clear bonus vs beeline speed) — never from the map fighting back. Every rule in this doc serves that loop: free travel, no respawns, scouting to choose fights, rares and the boss as the prize. When a future idea adds friction to moving around the map, it's wrong by default.

## 9. Run log (RULED 2026-09-12)
The map keeps the whole screen (§7), so the history does not live below it. A **scroll icon** in the HUD strip (top-right, left of ☰ and ?) opens the **Run log** — a Mind-view bottom sheet, scrollable, newest at the bottom, listing every run event: scouted X (type), engaged X → won in 14 s (loot line), sanctuary used (+bonus), rare slain (n remaining), seal broken, ambush (fled / fought), extracted / boss killed. A small unread-count badge on the icon when new lines have been added since it was last opened. The last event is also echoed for 3 s as a one-line toast under the HUD strip.

## 10. Node scale (raise again)
Party diamond **40 px**, type icons **34 px**, unknown runes **26 px**, edge stroke 3 px. The previous +40% landed too small on the phone. Hit areas stay ≥ 44 px.

## 11. No crossing edges — the web is planar and flows outward
- The generator must produce a **planar graph**: when adding any edge, reject it if the segment intersects an existing edge (standard segment-intersection test). Build with a Delaunay-style or gabriel/relative-neighbourhood pass over the node positions, then prune to 2–4 edges per node while keeping connectivity and the loop count from v2 §1.
- **Always moving out:** node positions are laid out so depth increases away from the entrance (entrance at one map edge, boss at the far edge, nodes placed in rough depth bands). Cross-links connect nodes of **equal or adjacent depth** only — never a link that jumps back two or more bands. Loops therefore feel like alternate routes forward, not tangles.
- Long-edge curiosity nodes (v2 §1) must also pass the no-crossing test.

## 12. Travel pacing and camera (replaces §1 timing)
- **350 ms per hop**, ease-in-out, marker glides along the edge (not a jump). A 12-hop trip ≈ 4 s; tap the map to skip to arrival.
- **Camera:** on tap, the camera first **eases to centre on the party (300 ms)**, then **follows the marker** hop by hop so it stays centred, then settles. Never a cut.
- After arrival: 200 ms pause, then the scout card / seal card / fight opens. Cards slide up in 250 ms.
- Every camera move on the route map is eased ≥ 250 ms; no instant jumps anywhere (pan release included).

## 13. Transitions between fight and map — continuous, never rebuilt (RULED 2026-09-12)
- The route map is **never unmounted** during a run. Fight, Results, Scout/Ambush/Seal cards and Sanctuary render as **overlays above the map**, so returning from Results is a **single 350 ms crossfade** back to a map that is already positioned. No close → open → recenter sequence; no layout reflow; the camera is already where it was when the fight started (centred on the party), so **no recentering happens at all on return**.
- Entering a fight: map stays put, Mind-view overlay fades in over it (350 ms). Leaving Results (Continue): overlay fades out over the same map. One motion each way.
- The route map's camera state, pan position and node layout persist in `routeState`, not component-local state, so nothing resets across overlays.

## 14. Travel motion — one continuous ease (replaces §12 timing)
- **450 ms per hop.** The marker's motion is a **single continuous path animation** across all hops (one tween along the polyline with ease-in-out at the start and end only), not per-hop tweens — so there's no hitch between hops and **no jump on the last hop**. Arrival lands exactly on the destination node position; the marker never snaps.
- Camera follows the marker every frame using the same tween, so the marker stays centred without lag or a final correction. Tap to skip → 200 ms ease to the destination, not a cut.
- The 200 ms pause before a card opens stands.

## 15. Node states and the explore model (RULED 2026-09-13 — revised; supersedes §1, §2 state rows, §4 visibility, v2 §2–§4 visibility, §14 timing)

### Three node states — nothing else
| State | Meaning | Looks like | Tap does |
|---|---|---|---|
| **Unexplored** | never been there | hollow slate-blue rune, faint pulse. **Identical for every node** — fight, crystal, sanctuary, rare, boss all look the same until explored. No special glyphs, no colours, no chains, no skulls. | camera frames it → **Explore / Cancel** |
| **Revealed** | explored, not completed (you fled, or left a sanctuary unused, or the boss is sealed) | its type icon in a hollow ring, type colour (§2 colours); named = gold rim; boss = crown + chains while sealed | camera frames it → reveal card again (**Fight / Flee**, **Use / Leave**, or seal card) — no travel needed if adjacent; otherwise Explore first |
| **Completed** | cleared / used | small filled dim-teal dot | **nothing** |
The party marker (gold diamond) sits on top of whichever node the party occupies. Named variants, rares, the boss, crystals and sanctuaries are **never auto-marked**; the map has no "specials" until you walk onto them.

### The explore commitment
- Tapping never moves the party. **Unexplored node tapped** (anywhere): camera frames it (§17), card: rune, "Unexplored", hops away, **Explore / Cancel**. Cancel closes it; nothing moves.
- **Explore:** the party travels (§16) through completed nodes to the target and **arrives on it**. On arrival the node becomes **Revealed** and the card returns: type, enemy count, threat band, yield, **Fight / Flee** (Sanctuary: **Use / Leave**; boss while sealed: seal card "Rares remaining: n", party steps back automatically).
- **Fight** → fight overlay at that node → win → node **Completed**. Lose → wipe rules.
- **Flee (chosen)** → party steps back to the previous node, node stays **Revealed**. No roll, no penalty. (The ambush-flee roll of §3 applies only when a roaming rare walks onto the party.)
- **Revealed node tapped later:** if adjacent, the reveal card opens directly (Fight/Flee) and choosing Fight moves the party onto it; if not adjacent, it shows **Explore / Cancel** like an unexplored node (travel there, then the reveal card).
- **Completed node tapped:** nothing. Not an info card, nothing.
- **Party node tapped:** nothing.

### Rares and the boss under this model
- Rares are placed on unexplored nodes and **hidden** there. A rare's node reveals as a rare only when explored. Rares still roam (one move per 2 scout/clear actions) but only across **unexplored or revealed** nodes; a rare that moves onto a **revealed** node updates that node's icon to the skull (that's the only way you "see" a rare move). A rare that moves onto the party's node = ambush (§3).
- The boss node is unexplored like any other. Exploring it reveals crown + chains if sealed; the seal card shows rares remaining. Kill all rares → the revealed boss node's chains drop and it pulses; if the boss node is still unexplored when the last rare dies, nothing on the map changes until you find it (the run log says "The seal is broken").
- The "shortest revealed path lights up" rule is dropped — there's nothing to light up to.

## 16. Travel speed
**600 ms per hop**, one continuous tween along the whole path, camera tied to it per frame, no last-hop snap. Skip = 250 ms ease.

## 17. Camera framing
- **Far node tapped:** camera eases (300 ms) to centre that node in the upper 60% of the map viewport, card below.
- **Adjacent node tapped:** camera eases to frame **both** party and node (midpoint), both inside the upper 60%.
- **Before any overlay closes** (Results, Sanctuary): camera eases to centre on the party's current node **while the overlay is still up** (300 ms), then the overlay fades. The map is never revealed off-party.
- All eases ≥ 250 ms; never a cut.
