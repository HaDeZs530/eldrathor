# Class Gems Live + Talent Tree Engine (LOCKED 2026-09-19) — Milestone 2, lock 2

*Author: Claude Design Chat. Builds on `Eldrathor_ClassGemTrees_Lock.md` (tree contents, July) and design doc §6d (crossing/matching, per-gem investment, Worldvein-bought). Numbers marked (tune) are first-pass and live in one table so we can iterate without touching structure.*

## 1. The tree engine (generic — reused by weapon trees and Veinbinder trees later)
```
TreeDef  { id, name, rows: [ { id, name, unlockAt, nodes: [ NodeDef ] } ] }
NodeDef  { id, name, kind: 'stat'|'proc'|'finisher', maxLevel, effect: { stat?, perLevel? , proc?, finisher? }, exclusiveGroup? }
TreeState{ levels: { [nodeId]: n }, finisher?: nodeId, spent: totalPoints, worldveinSpent }
```
- **Row gating:** a row is open when `spent ≥ row.unlockAt`. Nothing links node to node.
- **Exclusive groups:** nodes sharing `exclusiveGroup` (the Row-5 finishers) — buying one locks the other.
- Engine API: `canBuy(tree, state, nodeId, worldvein)`, `buy(...)`, `derive(tree, state) → { statMods, procs, finisher }`, `summary(tree, state)` for the live header. Pure functions, unit-tested per node.
- Weapon trees will use the same engine with node-links added later; Veinbinder trees with account-scope state. Not built now — the engine must not assume "gem".

## 2. Class gem trees — structure and thresholds
Contents per `Eldrathor_ClassGemTrees_Lock.md` (Row 1: 5 stat nodes ×3 · Row 2: 3 ×3 · Row 3: 2 procs ×1 · Row 4: 4 ×3 · Row 5: finisher pick-one ×2 = 40 points).
Row unlock thresholds (`unlockAt`, tune): Row 1 = 0 · Row 2 = 9 · Row 3 = 15 · Row 4 = 17 · Row 5 = 29. (You can beeline: 9 points anywhere in Row 1 opens Row 2, etc.)

## 3. Numbers (one table — tune here)
| Item | Value |
|---|---|
| Stat node, per level | **+4%** of that stat (max +12% per node) |
| Class-flavor stat (Taunt / Control Strength), per level | **+10%** |
| Point cost (Worldvein) | `cost(n) = 20 × 1.12^n` for the n-th point on that gem (1st = 20 ❖, 40th ≈ 1,660 ❖; full tree ≈ 15,300 ❖) |
| Finisher swap | 200 ❖, refunds the other finisher's levels |
| Respec | none (trees are fully completable by design) |
| Matching amplify | personal innate effect × `1 + 0.5 × spent/40` (max ×1.5) |
| **Procs** | Thornward: reflect 15% of damage taken while taunting · Second Skin: +30% mit for 3 s at <35% HP, CD 20 s · Ember Brand: 25% on hit, burn 4% Power/s, stacks ×5, 4 s · Execution: bonus strike at 150% on enemies <25% HP, CD 6 s · Enfeeble: 25% on hit, +5% vulnerability, stacks ×5, 6 s · Wither: −20% enemy attack speed for 3 s, every 8 s · Lifebloom: 30% of heals leave a HoT = 20% of the heal over 4 s · Guardian Spirit: heal lowest ally 25% max HP at <30%, CD 15 s |
| **Finishers (L1 / L2)** | Immovable: no hit > 30% / 20% max HP while taunting · Aegis Wall: party shield 10% / 15% of tank max HP every 10 s · Onslaught: ramp cap +60% / +80% · Culling Strike: guaranteed crit at 200% every 8 s / 6 s · Warden's Chains: −35% attack speed and −35% damage on all enemies (from Wither/stun targets) / all enemies always · Ruinous Mark: +20% / +30% vulnerability, spreads to all enemies · Sanctuary: party HoT 2% / 3% max HP per 2 s · Lifevein: 90% instant heal on one ally, CD 15 s / 10 s |
| **Base ability granted by CROSSING** | Tank gem: taunt + own mit +15% for 4 s, CD 10 s, 20 mana · Healer gem: heal lowest ally 25 × healing scale, CD 7 s, 25 mana · DPS gem: burst strike 250% hit damage, CD 8 s, 20 mana · Controller gem: stun 1.5 s (bosses 0.75 s then immune 10 s), CD 12 s, 30 mana |

## 4. Acquisition
- **Drops from rares (20%) and area bosses (35%)** (tune); named variants +10%. Class uniform over the four. No pity. Common-tier drop only (gems have no rarity or tier — design doc §6d "no quality tier").
- Gem item: `{ id, kind:'gem', gemClass, tree: TreeState, name }`. Name = "Tank Gem" etc. Bag row: `Tank Gem  [12/40]  Equipped · Kessa`.
- Points live on the gem. Two healers = two Healer Gems, each invested.

## 5. Equip and effect
- One gem per Adventurer in the character sheet's Gem slot (slot goes live; "Coming" tag removed). Swap freely, no cost; unequipping returns it to the bag with its points.
- **Crossing** (gem class ≠ archetype role): grants the base ability (§3) + the tree's stat mods, procs and finisher. **Matching**: amplifies the archetype's personal innate (§3 multiplier) instead of a second ability; tree mods/procs/finisher still apply.
- Role mapping for matching: Bulwark↔Tank · Warden↔Healer · Striker↔DPS · Adept↔Controller · Resonator↔none (always crossing).
- Procs and finishers fire as combat events (`proc`, `finisher`) in the feed with their own colour; innate/aura buttons gain a third slot showing the gem's ability.

## 6. Tree screen (Mind View)
- Open from: character sheet Gem slot → "Open tree"; Bag → gem row sheet → "Open tree".
- **Header:** gem name, class, Adventurer wearing it, `spent/40`, Worldvein balance, and the **live cumulative readout** (every stat mod totalled, procs owned, finisher).
- **Body:** rows top to bottom, 4-wide grid; each node a framed tile: name, `lvl/max`, one-line effect; invested = lit frame, available = dim frame, locked row = greyed with "Unlocks at N points".
- **Tap node → sheet:** name, effect per level (current → next), cost of the next point, **Buy** (disabled with reason: locked row / no Worldvein / maxed / finisher taken). Finisher sheet shows the swap fee.
- Test-numbers mode shows the derive output alongside.

## 7. Tests (the spec)
Row gating thresholds; exclusive finisher; cost curve; per-node effect at each level; crossing grants exactly one base ability; matching applies the multiplier and no second ability; Resonator always crosses; drop rates; points survive unequip/equip and save round-trip; balance gates from the Progression lock still pass with no gems equipped.
