# Combat v2 — Resolver, Stats, Innates, Screen (LOCKED 2026-09-11)

*Author: Claude Design Chat. Fulfils design doc §8c "eye candy" + §9 item 4. Numbers marked (tune) are first-pass; the structure is locked.*

## 1. Resolver model — pre-rolled script
The whole fight is **simulated instantly** in 100 ms ticks to produce an ordered **event list**, then **played back** on the fight screen at 1× / 2× / Skip. Player sees the same spectacle either way; skip = jump to results. Deterministic per run seed + fight index (replayable for bug reports).

## 2. Derived combat values (from the 9 seeds)
Seeds `s` come from `ARCHETYPE_SEEDS` (10 base / 15 specialty). Level `L` (1+). Gem multipliers `g` are 0 until the gem tree ships. Weapon `w` has `dmg`, `tempo` (seconds per swing), `mit`.

| Value | Formula | Level-1 feel |
|---|---|---|
| Max HP | `s.hp × 20 × (1 + g.hp) × (1 + 0.05(L−1))` | 200 (Bulwark 300) |
| Max Mana | `s.mana × 10 × (1 + g.mana)` | 100 (Adept 150) |
| Mana regen | `s.manaRegen × 0.5 /s × (1 + g.manaRegen)` | 5/s |
| Hit damage | `w.dmg × (s.power / 10) × (1 + g.power) × (1 + 0.05(L−1))` | greatsword 22, daggers 7 |
| Swing interval | `w.tempo / ((s.attackSpeed / 10) × (1 + g.attackSpeed))` | daggers 0.8 s, greatsword 1.6 s (Striker ×⅔) |
| Crit chance | `s.critChance × 1% × (1 + g.critChance)` | 10% (Adept 15%) |
| Crit multiplier | `1.5 + (s.critDamage − 10) × 0.05 + g.critDamage` *(corrected 2026-09-14; gem term additive)* | 1.5× |
| Mitigation | `min(0.6, (s.mitigation × 0.02 + w.mit) × (1 + g.mitigation))` | 20–45% |
| Heal amount | `base × (s.healingPower / 10) × (1 + g.healingPower)` | — |

Damage taken = `hit × (1 − mitigation)`. No miss/evasion (BaseStats lock). **All weapons partial-AoE:** each swing hits the primary target for 100% and every other living enemy for 35% (tune).

Weapon table (`data.js` replaces atk/tempo/mit placeholders): 
Greatsword dmg 22 tempo 1.6 mit .10 · Sword+Shield 12/1.2/.25 · Dual Daggers 7/0.8/.02 · Dual Swords 11/1.0/.04 · Bow 10/0.9/.03 · Crossbow 20/1.5/.03 · Staff 12/1.1/.05 · Orb/Tome 19/1.4/.05. (Baseline DPS ≈ 9–14/s; Sword+Shield lowest by design.)

## 3. Archetype innates — concrete (auto-fire; these ARE the "special buttons")
Personal innate = a **cooldown ability** that costs mana and visibly fires. Group innate = a **passive aura** applied at fight start (shown as a lit icon, never "fires").

| Archetype | Personal (cooldown · mana) | Group aura |
|---|---|---|
| Bulwark | **Aegis** — taunt all enemies onto self + own mitigation +25% for 4 s. CD 8 s · 20 mana | **Guardian's Bulwark** — party takes 8% less damage *(retuned 2026-09-14)* |
| Warden | **Mend** — heal lowest ally for 30 × healing scale. CD 7 s · 25 mana *(retuned 2026-09-14)* | **Renewal** — party heals 1% max HP every 3 s *(retuned 2026-09-14)* |
| Striker | **Onslaught** — self damage +8% per stack, stacks every 3 s in combat, max 6. Passive-ramp, no CD | **Cadence** — party attack speed +12% |
| Adept | **Lock** — stun the highest-HP enemy 2 s (bosses: 1 s, then immune 10 s). CD 10 s · 30 mana | **Sunder** — enemies take +12% damage |
| Resonator | **Resonance** — party +6% damage and +6% mitigation for 6 s. CD 12 s · 20 mana | **Attune Vein** — +20% Worldvein, +1 loot-tier roll bias (see §7) |

Auras of the same kind don't stack (two Strikers = one Cadence). Targeting: enemies attack the taunting character if Aegis is active, else a random living Adventurer weighted by lowest mitigation.

## 4. Enemies
Enemy stat block by **world tier** `T` (1–6) and **node type**. Base trash unit: `hp = 60 × 1.6^(T−1)`, `dmg = 9 × 1.45^(T−1)`, `interval = 1.4 s`, `mit = 0.05 + 0.03T`.
- Normal node: 1–3 units (weights 30/50/20).
- Crystal node: 2–3 units at ×1.2 hp.
- Rare: 1 unit ×6 hp, ×1.6 dmg, interval 1.2 s. Named/rare variant flag → ×1.3 on top.
- Boss: 1 unit **×22 hp, ×7 dmg** (Progression Loop lock §9; dmg cap ×8 — walls are HP and time, never one-shots), interval 1.6 s, mit +0.1. Boss adds one **enrage tick** every 15 s: next hit ×2 (the spike moment).
Enemies have no abilities in v2. *(Enemy roster identities = design doc §9 item 2, separate lock.)*

**Length targets:** trash 10–20 s, rare 30–50 s, boss 60–120 s at on-tier gear. Tuning knob = the `1.6^(T−1)` hp base. Party of three at level 1, no gems, must clear W1 trash reliably and lose to the W1 boss on a first run (the gear wall must exist).

## 5. Playback & feed
- Events: `swing`, `hit`, `crit`, `kill`, `innate` (name, target), `heal`, `stun`, `enrage`, `death`, `victory`, `wipe`. Each carries `t` (ms), source, target, amount.
- Playback drives: HP/mana bars, hit-flash on the stage, **innate button flash + ring pulse when it fires** (the §8c requirement), enemy portrait shake on crit, feed line. Feed lines are short: `Kael crits Shore Drake for 33`, `Aegis ▸ Rowan taunts`, `Mend ▸ Sera +40`. Crits and innates get a colored line.
- Speed: 1× / 2× / Skip buttons under the stage. Skip = jump to results.

## 6. Screen layout (mobile portrait, Mind-view)
- **Top ⅓ — stage:** enemies row (portrait glyph + HP bar), party row (three glyphs + HP bar). Hit-flash overlays. No character art yet — glyph + name.
- **Middle — party cards ×3:** name · archetype · HP bar · mana bar · **innate button** (icon + name; dims on cooldown, flashes on fire) · group-aura icon lit.
- **Bottom — feed:** scrolling, newest at bottom, ~6 lines visible, auto-scroll.
- Tab bar stays (TabBar lock).

## 7. Results screen
Victory: per-Adventurer damage dealt / taken / healing, fight time, Worldvein gained (with Attune Vein bonus line), loot rolled: weapon name + tier + **rating 1–100**, kill count. Loot tier roll = world tier ± 1 with Attune Vein biasing +1. Then **Continue** → route map. Wipe: same card in red, "The bond pulls them home" → Veinharbor, map reset, banked kept (§8c death rule).

## 8. Out of scope for v2 (later locks)
Gem procs/finishers (tree UI first) · enemy abilities & rosters · armor stats (crafting lock) · weapon skill trees · sound.
