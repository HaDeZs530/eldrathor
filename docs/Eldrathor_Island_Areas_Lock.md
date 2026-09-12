# The Island — Nine Areas (LOCKED 2026-09-12)

*Author: Claude Design Chat, from Anthony's playtest direction 2026-09-12. **Supersedes design doc §5b's five-worlds structure.** Follows the pin order in `Eldrathor_Island_Path_Lock.md` (pin 1 = Veinharbor; pins 2–10 = the nine areas).*

## Terminology (LOCKED)
- **Island map** — the mountain/island overview with the nine area pins. (Formerly world map / mountain.)
- **Route map** — the fog-of-war node web inside one area. (Formerly expedition/territory map.) Code already uses `RouteMapScreen`.
- **Rally** — the screen between tapping an area pin and entering its route map.

## Structure
Nine areas, tiers 1–9, climbed in pin order around the island. Each area = one route map with one **area boss** at its far end. Clearing an area boss permanently unlocks the next pin (design doc §2 permanent unlocks, unchanged). Every area is fully grindable. The **seven bound court members** are the bosses of areas 4–9 plus the summit's gatekeeper; **Vaelyx** waits above the last of them. (Replaces the W4 four-wing / W5 three-boss-node structures — one boss per area, escalating in identity rather than count.)

| # | Pin (working) | Area name | Tier | Character | Boss |
|---|---|---|---|---|---|
| 1 | Shore trail | **Gullwatch Trail** | 1 | Shoreline forest, road out of the harbor | **The Brinewarden** — a hulking Mythros-swollen shore bear |
| 2 | West cliffs | **The Saltcliffs** | 2 | Wind-cut sea cliffs, nesting grounds | **Skarra of the Ledge** — matriarch cliff-drake |
| 3 | NW shore | **Drowned Quay** | 3 | The colony's fallen seaside town, half in the water | **The Harbormaster** — a warded lighthouse spirit gone wrong |
| 4 | NE lookout | **Serpent's Stair** | 4 | Rope bridges and switchbacks over the ravine | **The Marshal** (court) — captain of the fallen guard |
| 5 | East coast | **Ashfall Strand** | 5 | Black sand, cinder rain from the forge vents above | **The Seer** (court) — the king's oracle |
| 6 | East ruins | **The Hollow Ward** | 6 | The artisan city, warded streets now dark | **The Chamberlain** (court) — keeper of the wards |
| 7 | Forge gate | **The Temple Forge** | 7 | The People of the Vein's master forge | **The Warden-Smith** (court) — who forged the arsenal |
| 8 | High walls | **The Bastion** | 8 | Castle walls and the outer court | **The Queen** (court) |
| 9 | Crystal | **The Worldforge** | 9 | Throne hall above the master crystal | **The King** (court gatekeeper) → **Vaelyx the Eternal** (summit, recurring) |

## Area lore (Rally screen copy — 2–3 sentences each; warm/painterly voice)
1. **Gullwatch Trail** — The road out of Veinharbor runs under the gulls and into the shore forest, where the Vein first touches the land. The trees here grow wrong — too tall, too bright — and the things that den beneath them have learned the road. Every Veinbinder's first climb begins on this trail.
2. **The Saltcliffs** — West of the harbor the island stands up out of the sea in wind-cut ledges. Drakes nest in the cliff faces, fattened on crystal-light, and the path threads between their roosts. Look down and you'll see the harbor small below you.
3. **Drowned Quay** — This was the colony's second town, before the Fracture. The sea has taken half of it; the wards took the rest. Lights still burn in the old lighthouse, and nobody in Veinharbor will say what tends them.
4. **Serpent's Stair** — The ravine cuts the mountain in two and the old bridges cross it in switchbacks, rope and plank over a long fall. The Marshal held this pass on the third day of the battle. He holds it still.
5. **Ashfall Strand** — On the east coast the beach is black and cinders fall like snow from the forge vents overhead. The Seer walked here to read the Vein. What she read, she never told the king in time.
6. **The Hollow Ward** — The artisan city climbed the mountain in tiers of warded stone. The wards are dark now, and the streets belong to whatever the Vein makes of the things that died in them. The Chamberlain still walks his rounds.
7. **The Temple Forge** — Here the People of the Vein drew fire from the mountain and made the weapons that once armed the world. The forge still burns; the Warden-Smith still works it. What he makes now, he makes for Vaelyx.
8. **The Bastion** — The outer walls of the summit castle, where the court made its last stand. The Queen commanded the walls while the King held the crystal. Vaelyx set her here to keep them for him.
9. **The Worldforge** — The throne hall sits above the master crystal, and the crystal's light comes up through the floor. The King waits before the throne. Above him, on the broken roof, the dragon sleeps with one eye open.

## Difficulty inside an area
Route-map node difficulty **rises with depth** — graph distance from the entrance toward the boss (see `Eldrathor_RouteMap_v2_Lock.md`). Area tier sets the base; depth adds up to +50% across the map.

## Design doc reconciliation
§5b, §8c entrance/exit table, and the W4/W5 multi-boss text are superseded by this doc. Court-art gems drop from the six court bosses + the King (areas 4–9) — same intent as before, spread across the upper island.
