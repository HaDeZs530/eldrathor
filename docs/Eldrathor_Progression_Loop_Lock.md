# Progression Loop — Milestone 1: "One real area" (LOCKED 2026-09-14)

*Author: Claude Design Chat. The next milestone: a single reliable, saveable first-area experience where earned XP and loot make the party stronger, crafting contributes, and the area-1 boss becomes beatable through growth. Everything here is scoped to make that loop real; it fills gaps the design doc left as "prototype tuning." Where a number is first-pass it is marked (tune).*

## 1. Save & identity (design doc §8d HARD REQUIREMENT)
- Every Adventurer, weapon, armor piece and gem has a permanent `id` (ulid/uuid) at creation. Nothing is keyed by array position.
- Versioned save `eldrathor.save.v1` (localStorage now; Capacitor Preferences later) holding: roster, fielded party ids, stash, materials, Worldvein, unlocked areas, AFK assignments + timestamps, Veinbinder trees, and the **active run** (area, territory, node states, party ids, per-id HP fractions, run mods, banked run Worldvein, run log, camera focus, RNG seed + counter). Written on every state transition (debounced ≤ 1 s) and on visibility change. App close mid-run → reopen in place.
- Menu → Settings: Export save (JSON to clipboard) / Import / Reset with confirm. Corrupt or older-version saves: migrate if possible, else quarantine + fresh start with a notice.

## 2. ~~The five-rung rarity ladder~~ — SUPERSEDED 2026-09-16 by `Eldrathor_Item_Model_Lock.md` §1 (seven rungs; Artifact/Mythic via cores; Fine → Uncommon)
**Common · Fine · Rare · Epic · Legendary.** Used by weapons, armor and materials. ("Mythic" is retired.)
- **Weapon drop rarity band by area tier:** 1–2 Common, 3–4 Fine, 5–6 Rare, 7–8 Epic, 9 Legendary. Roll: 70% band, 20% one up, 10% one down (floor Common, cap Legendary). Attune Vein: one-up chance becomes 40%. Rating 1–100 uniform. Rares roll +1 band; bosses +1 band with rating floor 40.
- **Material tier** = the area's band; gathering yields tier-tagged raw, processing preserves tier, recipes exist for every tier, every tier sells at the market floor. No orphan tiers.

## 3. Character XP (design doc §8e — active fighting + idle training)
- Fight XP = Σ enemies `12 × 1.5^(T−1)` (T = area tier) × 3 for rares × 8 for bosses, split evenly to all three fielded, dead included at half. (tune)
- `xpToNext(L) = 100 × 1.35^(L−1)`. Cap 50 for now. Level applies the existing `1 + 0.05(L−1)` to HP and hit damage (Combat v2 §2).
- **Train (AFK)** grants XP at `6 × 1.5^(Tmax−1)` per minute where Tmax = highest unlocked area, **capped at the highest level in the roster** (Item Model lock §7 — restores the AFK/Town lock's catch-up intent; "no cap" was a 2026-09-14 error).

## 4. Equipment actually applies (the missing chain)
- **Weapon:** an Adventurer equips one weapon *item* from the stash (not a free type pick). Hit damage `× (0.8 + 0.4 × rating/100) × (1 + empower/100)`. Type sets tempo/dmg/mit as before.
- **Empowerment (§7c model, corrected):** `baseRating` is **immutable**. `empower` is a separate 0–100 value. Feed a chosen fodder weapon: gain = `2 × rarityIndex(fodder) × (sameType ? 1 : 0.5) × (1 + fodderRating/200)`, rounded, min 1; Worldvein cost `15 + empower`. The Upgrade bench shows fodder, gain, cost and resulting damage **before** committing; the button is disabled when gain would be 0 or empower is 100. Merge-as-average is removed.
- **Armor (one body slot now):** crafted piece has tier q (1–5) and rating r. Grants `+HP 25 × q × (0.8 + 0.4r/100)` and `+mitigation 0.02 × q` (total mitigation still capped 0.6). Sockets per §7c come with gems later.
- **Party sheet** shows derived stats with equipment applied and a diff when previewing a swap.

## 5. Crit damage formula (bug in Combat v2 §2 — corrected)
`critMult = 1.5 + (s.critDamage − 10) × 0.05 + g.critDamage` — the gem term is additive, so a +0.5 gem bonus yields 2.0× for a seed-10 archetype.

## 6. AFK is true idle
Assignments store `startedAt` and `lastReconciledAt`. On every tick, app resume and app open: elapsed = now − last; process **every complete cycle** in that span, carry the remainder, stop at resource exhaustion, then show an **Offline summary** sheet if elapsed > 60 s ("While you were away: 14 ore, 3 ingots, Sera +1 level"). One job per character id; deploying a character to a run suspends their job (kept, paused) and resumes on return.

## 7. Rules restated so code stops contradicting them
- Archetype is permanent: no archetype editing anywhere after creation. Name edits are validated like creation (1–16 chars, non-empty).
- Fielded party is frozen per run (bug-fix pass 1 ruling).
- Screens that advertise unbuilt systems (gem slots, Veinbinder trees, sockets) show a **"Coming — not yet active"** tag, never a fake control.

## 8. Balance gate for the milestone (enforced by tests, not TODOs)
With Combat v2 numbers as tuned by this milestone:
- Fresh level-1 party, Common weapons, no armor: **loses the area-1 boss in ≥ 8/10 seeds**; wins area-1 normal nodes in ≥ 9/10.
- Level 5 party, three Fine weapons rating ≥ 50 with empower ≥ 20, Fine armor: **beats the area-1 boss in ≥ 8/10 seeds**. That is "3–5 runs of growth." Tune enemy base hp/dmg and boss multipliers to hit both gates; the gates are the spec.

## 9. Rulings after Milestone 1 (2026-09-14)
**Accepted:** rarity ladder as shipped; new game starts at level 1; Style Bible header has no hub sub-label (a11y label only); five equal tabs (Tab Bar lock's centre-Mountain bump dropped); Party / Player / Seam use the Veinharbor column with v3 text scale; manifest = 5 innate + 5 aura icons; starter weapon Common rating 30, recruits get a Common starter, unarmed ×0.8.

**Reversed — boss ×20 damage.** Cause was level-1 sustain out-healing any boss below ×16. Fix the cause:
- Combat v2 §3 innates retuned: **Renewal** 1% max HP every 3 s (was 2%/2 s); **Mend** 30 × healing scale, CD 7 s (was 40 / 5 s); **Guardian's Bulwark** 8% (was 10%); Aegis unchanged.
- Boss multipliers: **hp ×22, dmg ×7, interval 1.6 s, mit +0.1, enrage ×2 every 15 s** (dmg cap ×8 — a boss hit may never exceed 40% of a level-appropriate Bulwark's max HP outside enrage).
- Re-run the §8 gates with these; if gate 1 (fresh party loses ≥8/10) fails, raise boss **hp**, never dmg, until it passes. Gate 2 must still pass ≥8/10 with a boss fight lasting 40–90 s.
- Principle recorded: **walls are made of HP and time, not one-shots.**

**DESIGN-OPEN answered:**
- ~~Armor recipes Wardplate/Veinweave~~ — retracted 2026-09-16 (recipe = piece + rarity, Item Model lock §1). Market floor number stays DESIGN-OPEN. 
- AFK rates: the prototype numbers become v1 as a named table `AFK_TUNING` (gather yield/XP per cycle, 15% Worldvein roll, Process cost 5 ❖, quality odds) — tune later via playtest, not now.
- **AFK tab name: "Hearth."** The bench works at the hearth while the party is away. Replace "Seam" everywhere (help copy, tab, locks' working label).
- Enemy rosters per area: Milestone 2 lock (Design Chat, next).
