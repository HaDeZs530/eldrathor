# Class Gem Talent Trees (§6d built) — LOCKED July 2026

*Designed and locked by Anthony + Claude Design Chat, 2026-07-19. Committed to the repo 2026-09-11 (was previously only in chat). Supersedes the framework-only §6d in the design doc and resolves §9 item 1. References `Eldrathor_BaseStats_Lock.md`.*

## Universal tree structure (all four gems share this shape)
- **40 points total** to fully complete a tree.
- **Fully completable, not a scarcity puzzle.** The ONLY exclusive choice is the Row 5 finisher (pick 1 of 2). Everything else is eventually obtained — beeline the procs/finisher then backfill; no "wrong" builds.
- **Node ranks:** stat nodes = **3 levels**; procs = **1 level**; finisher = **2 levels** (pick ONE of two).
- **Row-gating (pure):** enough points in a row unlocks the next. **Nothing links node-to-node.** *(Node linking is reserved for weapon skill trees.)*
- **Header:** live cumulative stat readout — every bonus the tree currently grants, totaled, updating as points go in. Full transparency; no hidden math.
- **Visual:** 4-wide grid; invested nodes framed/glowing, uninvested dark (Eternal Hero's framed-vs-plain language, tighter).

| Row | Contents | Nodes × levels | Points |
|---|---|---|---|
| 1 — Foundation | stat nodes | 5 × 3 | 15 |
| 2 — (class name) | stat nodes | 3 × 3 | 9 |
| 3 — Procs | passive procs | 2 × 1 | 2 |
| 4 — (class name) | stat nodes | 4 × 3 | 12 |
| 5 — Finisher | pick 1 of 2 | 1 × 2 | 2 |
| | | **Total** | **40** |

- **Procs (Row 3)** are always-take — baseline class flavor, auto-fire passively (satisfies the "specials visibly proc" combat requirement, §8c).
- **The two builds per class = the Row 5 fork.** Recurring theme: single-target/boss specialist vs. group/pack specialist.
- **Crossing vs. matching (§6d) unchanged:** non-matching archetype gets the whole tree (crossing grants the base ability); matching archetype amplifies its personal innate, scaled by total points invested.

---

## TANK GEM
Base ability: taunt + mitigation. Matching amplifies Bulwark's *Aegis*; crossing grants a personal taunt.

**Row 1 — Foundation:** Fortified (+HP) · Ironscale (+Mitigation) · Provocation (+Taunt Strength) · Tempered (+HP) · Bracing (+Attack Speed)
**Row 2 — Reinforcement:** Stoneblood (+HP) · Deflection (+Mitigation) · Retribution (+Power)
**Row 3 — Procs:**
- **Thornward** — while holding taunt, reflect a % of damage taken as Mythros (always on).
- **Second Skin** — below 35% HP, auto-trigger a mitigation surge (cooldown).
**Row 4 — Hardening:** Bulwark (+HP) · Aegis Plating (+Mitigation) · Defiance (+Taunt Strength) · Resolve (+Crit Chance)
**Row 5 — Finisher (pick 1):**
- **① IMMOVABLE** *(self-survival)* — while holding taunt, no single hit can exceed X% of Max HP. Lvl 2 lowers the cap.
- **② AEGIS WALL** *(party protection)* — periodic party-wide shield scaled off Max HP. Lvl 2 raises absorption.

---

## DPS GEM
Base ability: damage burst. Matching amplifies Striker's *Onslaught* ramp; crossing grants a burst nuke.

**Row 1 — Foundation:** Sharpen (+Power) · Killing Edge (+Crit Chance) · Frenzy (+Attack Speed) · Malice (+Power) · Bloodlust (+Crit Damage)
**Row 2 — Escalation:** Savagery (+Power) · Precision (+Crit Chance) · Vitality (+HP)
**Row 3 — Procs:**
- **Ember Brand** — hits have a chance to apply a stacking Mythros burn DoT (always on).
- **Execution** — auto-fire a bonus strike on any enemy below 25% HP (cooldown).
**Row 4 — Ferocity:** Ruin (+Power) · Bloodthirst (+Crit Damage) · Overdrive (+Attack Speed) · Rupture (+Crit Chance)
**Row 5 — Finisher (pick 1):**
- **① ONSLAUGHT** *(ramp)* — damage climbs the longer the fight lasts, to a high ceiling. Lvl 2 raises the cap.
- **② CULLING STRIKE** *(burst)* — periodic guaranteed-crit strike, harder the longer since the last. Lvl 2 shortens the interval.

*DPS carries no defensive proc by design (glassy); crossing-DPS leans on the single Vitality node.*

---

## CONTROLLER GEM
Base ability: hard control (**stun** — enemy skips attacks). Matching amplifies Adept's lock; crossing grants a stun.
**Control model (LOCKED):** no mob movement exists, so control = **enemy-action suppression**, never positioning. Levers: **Stun** (skip attacks) · **Slow** (reduced enemy attack speed) · **Weaken** (reduced enemy damage) · **Vulnerability** (enemy takes more Mythros). Controller = *the enemy does less / is cracked open* — distinct from Tank (you take less) and Resonator (flat ally buffs) by mechanism.

**Row 1 — Foundation:** Focus (+Power) · Disrupt (+Control Strength) · Quicken (+Attack Speed) · Acuity (+Crit Chance) · Insight (+Mana)
**Row 2 — Domination:** Subjugate (+Control Strength) · Clarity (+Mana Regen) · Malignance (+Power)
**Row 3 — Procs:**
- **Enfeeble** — hits have a chance to apply a stacking vulnerability debuff (always on).
- **Wither** — periodically apply an attack-speed slow to an enemy (cooldown).
**Row 4 — Ascendancy:** Overpower (+Control Strength) · Penetration (+Power) · Cascade (+Crit Chance) · Wellspring (+HP)
**Row 5 — Finisher (pick 1):**
- **① WARDEN'S CHAINS** *(suppression)* — slows and weakens deepen sharply and hit more enemies. Boss-safe.
- **② RUINOUS MARK** *(exploitation)* — vulnerability becomes a major damage-amp and spreads across the group. Boss-safe.

*Neither finisher scales stun — stun stays the base ability so bosses can't be permalocked. Silence/Disarm-type control revisited at enemy-roster design (§9 item 2).*

---

## HEALER GEM
Base ability: heal. Matching amplifies Warden's single-target heal; crossing grants one.

**Row 1 — Foundation:** Mend (+Healing Power) · Wellspring (+Mana) · Grace (+Mana Regen) · Vitality (+HP) · Swift Hands (+Attack Speed)
**Row 2 — Devotion:** Restoration (+Healing Power) · Serenity (+Mana Regen) · Warding (+Mitigation)
**Row 3 — Procs:**
- **Lifebloom** — heals have a chance to leave a short heal-over-time (always on).
- **Guardian Spirit** — auto-heal the lowest-HP ally below 30% HP (cooldown).
**Row 4 — Sanctity:** Benediction (+Healing Power) · Endurance (+HP) · Radiance (+Power) · Communion (+Mana)
**Row 5 — Finisher (pick 1):**
- **① SANCTUARY** *(party)* — sustained party-wide heal-over-time on all 3. Lvl 2 raises the tick.
- **② LIFEVEIN** *(single-target)* — near-full instant heal on one ally, scaling off Healing Power; fast refresh. Lvl 2 shortens cooldown. *(Balance lever = cooldown.)*

*Sanctuary does NOT cleanse — Warden's group innate Renewal keeps its cleanse exclusive (gems never copy a group innate, §6d).*

---

## Summary — the eight builds
| Gem | Build ① | Build ② |
|---|---|---|
| **Tank** | Immovable (self-survival) | Aegis Wall (party protection) |
| **DPS** | Onslaught (ramp/long fights) | Culling Strike (burst/short fights) |
| **Controller** | Warden's Chains (reduce incoming) | Ruinous Mark (amplify outgoing) |
| **Healer** | Sanctuary (party sustain) | Lifevein (single-target save) |

## Open / to tune (prototype)
- All node magnitudes, proc rates, finisher numbers.
- Row-unlock thresholds.
- Lifevein cooldown; Immovable cap %; Onslaught ceiling.
