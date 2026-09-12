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
