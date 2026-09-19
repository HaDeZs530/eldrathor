# Growth Model — every path of growth in one place (LOCKED 2026-09-19)

*Author: Claude Design Chat from Anthony's rulings 2026-09-19. Supersedes: design doc §6c weapon skill trees (CUT), §6d row-grid talent trees (replaced by the lattice), §6f Veinbinder Bond/Craft purchased trees (replaced by Resonance ranks); `Eldrathor_ClassGems_Live_Lock.md` §1–§3 and §6 (row engine, thresholds, screen) are withdrawn — its §3 numbers table, §4 drops and §5 equip/crossing rules carry over. The July `Eldrathor_ClassGemTrees_Lock.md` node CONTENTS (stat facets, procs, finishers) carry over onto the lattice.*

## 0. The list (nothing grows that isn't here)
**Adventurer:** 1 Level · 2 Archetype (fixed) · 3 Weapon (item: tier·rarity·rating + empower) · 4 Armor (crafted item, same axes; sockets later) · 5 Class gem (a crystal grown as a lattice).
**Player (Veinbinder):** 6 Resonance (Σ√level over the roster) sets a rank; the rank **caps** Bond (party stats) and Craft (economy) upgrades that are **bought with Worldvein** level by level.
**Account:** areas (boss kills), roster size (recruits), Artifact/Mythic grades (Cores), gathering skills + mastery (later, unchanged).
**Cut:** weapon skill trees. "Talents" as a word: gone — the game says *facets* and *the lattice*.

## 1. The lattice — how a class gem grows
**Fiction (design doc §5, no new lore):** the Veinbinder is the conduit. When an Adventurer levels up, the bond channels a spark of Worldvein through them and a **Vein Fragment** crystallises. The Veinbinder imbues a fragment with a facet's power and sets it into a gem's lattice, growing the crystal outward.

- **Shape:** a hex lattice growing **outward from a centre**. The centre is the gem's **Core** (its base ability — taunt / heal / burst / stun — always lit). Facets are hexes. A facet can be imbued only if it **touches an imbued facet** (adjacency is the only gate; no rows, no thresholds, no node links).
- **Size:** 40 facets per gem (the July count), laid out as: 6 facets touching the Core (**foundation**), 12 in the second ring (**refinement**), 18 in the third (**mastery**), and **4 finisher facets** at the four compass points of the outer edge — imbue **one**; the other three darken. Procs sit as two special facets in the second ring, opposite each other.
- **Levels:** stat facets have 3 levels (each level costs a fragment + Worldvein); procs and finishers 1 and 2 levels as before. Full gem = 40 fragments-worth of facets across ~86 imbues.
- **Contents:** exactly the July lists per class — Row 1 stats → foundation ring, Row 2 → second ring, procs → second-ring specials, Row 4 → third ring, finishers → compass points. Magnitudes: `GEM_TUNING` (+4%/level stat, +10% flavor stat, proc/finisher values as tabled in ClassGems_Live §3).
- **Cost per imbue:** **1 Vein Fragment + Worldvein** `20 × 1.12^n` (n = imbues already on that gem). Everything costs Worldvein.
- **Per gem, entirely:** fragments are earned by the gem, spent on the gem, and Worldvein is sunk into the gem. Gems transfer between Adventurers with lattice and unspent fragments intact. Two healers = two gems, each worn and grown. Extra gems = extra farming.
- **Fragments are gem-bound (RULED 2026-09-19).** When an Adventurer levels up, the gem **they are wearing** gains 1 Vein Fragment. Fragments live on that gem — unspent and spent alike — and travel with it when it's transferred. An unequipped gem never grows; to grow two Healer gems you wear and level both. No account pool, no header counter: the gem's sheet and lattice screen show `fragments: 3 unspent · 12 imbued`. (tune: 1/level.) Bench Train levels count if the gem is worn by the trainee.
- **Respec:** none. Finisher swap: 200 ❖ + 2 fragments.
- **Crossing / matching, drops, equip:** as ClassGems_Live §4–§5 (rares 20%, bosses 35%, one gem per Adventurer, crossing grants the Core ability, matching amplifies the archetype's innate by `1 + 0.5 × imbuedFacets/40`).

## 2. Resonance and the Veinbinder's upgrades — how the player grows (RULED 2026-09-19, revised same day)
- **Resonance** = `Σ over the whole roster of √(level_i)` — every Adventurer counts, fielded or benched. Ten level-5 Adventurers (22.4) out-resonate three at level 17 (12.4) or one at 50 (7.1). Breadth beats depth by design.
- **Ranks** I–X at thresholds (tune): 0 · 8 · 14 · 22 · 32 · 44 · 58 · 74 · 92 · 112. **Rank is a cap, not a reward:** it sets how far each purchasable upgrade can be taken.
- **Upgrades are bought with Worldvein**, each with its own level, **capped at the current rank** (rank IV → every upgrade can reach level 4). Cost per level on an upgrade: `50 × 1.25^n` (tune). No respec.
  - **Bond** (party-wide, applies to every Adventurer): Vitality +2% HP/level · Might +2% Power/level · Ward +1% mitigation/level · Tempo +1.5% attack speed/level · Grace +2% healing/level · Keen +1% crit chance/level · Flow +2% mana regen/level.
  - **Craft** (economy): Yield +5% gather output/level · Vein +5% Worldvein from nodes/level · Fortune +3% loot one-up chance/level · Haste −5% Process time/level · Hearth +1 job slot at levels 4 and 8 (cap 8).
- **Player tab** shows: Resonance, rank, bar to next rank; then the Bond and Craft upgrade rows (`Might  lvl 3/4  +6% Power  ·  Buy 98 ❖`), Buy disabled with reason (at cap / no Worldvein). Raising a rank lights every row's next level.
- Recruiting and levelling the bench raise Resonance, Worldvein buys the growth: both loops feed the player.

## 3. Where each system lives (UI map)
| System | Screen | Bracket |
|---|---|---|
| Level / XP | Party → Adventurer sheet header; Results | Mind View |
| Weapon / Armor | Bag rows · character-sheet slots · Smith (empower, grade) · Crafter | Veinharbor / Mind View |
| Class gem lattice | character-sheet Gem slot → **Lattice screen**; Bag → gem sheet → Lattice | Mind View |
| Fragments (on the gem) · Worldvein (header) | fragments shown on the gem sheet + Lattice screen only; Worldvein spent at Smith/Crafter/Market/Lattice/Player | all |
| Resonance / rank / Bond + Craft upgrades | Player tab root | Mind View |
| Gathering skills (later) | Hearth | Hearth |

## 4. Lattice screen (Mind View)
Hex lattice centred on the Core; pinch-zoom and pan; imbued facets lit in Mythros blue with a facet glow, available facets dim outline, unreachable facets dark. Header: gem name, wearer, `imbued/40`, this gem's unspent fragments, Worldvein, live cumulative readout. A gem with no wearer shows "Equip to grow." Tap facet → sheet: name, effect per level, cost (fragment + ❖), **Imbue**. Finisher facets show the swap fee. Test-numbers mode shows derive output.

## 5. Engine
`LatticeDef { id, core, facets: [ { id, ring, pos, neighbors: [ids], kind, maxLevel, effect, exclusiveGroup? } ] }` · `LatticeState { levels, finisher, imbues, worldveinSpent }` · pure `canImbue / imbue / derive / summary`, unit-tested per facet. Adjacency from `neighbors`. Generic; only the class gems use it now.
