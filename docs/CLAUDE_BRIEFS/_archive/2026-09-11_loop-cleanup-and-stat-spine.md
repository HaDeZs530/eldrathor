# BRIEF — Loop cleanup + real stat spine in data

**Status:** READY for Claude Code  
**Date:** 2026-09-11  
**Author:** Claude Design Chat  
**Rulings:** Anthony 2026-09-11 (audit A1–A3, B1–B2; archetype seeds approved for build)

## Goal
One PR that removes the two systems that contradict the locked loop, fixes two canon errors, and puts the real 9-stat spine into `data.js` so combat v2 (next brief) has something to build on. No new mechanics.

## Read first
`CLAUDE.md` · `docs/AUDIT_2026-09-11_code-vs-locks.md` · `docs/Eldrathor_BaseStats_Lock.md` · `docs/Eldrathor_Archetype_Seeds_DRAFT.md` (approved for build) · design doc §8c

## Requirements

### 1. Remove Attack / Flee (audit A1 — RULED: cut)
- Node tap → fight begins immediately (auto-engage). Delete the `engage`/`ambush` phases, `fleeChance`, `rollFlee`, the Attack/Flee buttons, and the ambush banner.
- Keep the Mind-view crossfade on entering the fight. Keep `typeKnown` flipping true on entry (type is revealed by *entering*, per §8c).
- Mark `docs/CLAUDE_BRIEFS/2026-09-11_node-engage-attack-flee.md` as **SUPERSEDED (reversed 2026-09-11)** at the top.

### 2. Difficulty screen → Rally screen (audit A2 — RULED: convert)
- Rename `DifficultyScreen.jsx` → `RallyScreen.jsx`. Title kicker: **"Rally the bond"**. Shows: world name, tier, boss name, the three fielded Adventurers (name · archetype · weapon · level), and one button: **Explore**. Back button stays.
- Remove Normal/Hard/Brutal entirely. Remove the `difficulty` state from `AppRoot`. `genTerritory` is called with the world only.
- Mountain hub label for this stage: **"Rally"**.

### 3. Island pins (audit A3 — RULED: 10 visual waypoints, 6 tappable)
- When implementing `2026-09-11_island-dotted-path-10-nodes.md`: the 10-pin spline is the *path art*. Only the 6 `WORLDS` entries are tappable hotspots (W1–W5 + Summit), placed on or next to the nearest path pin. The other 4 pins render as small non-interactive waypoint dots on the spline.

### 4. Weapon-only drops (audit B1)
- `rollLoot` gear names come from the 8 weapon types in `WEAPONS` (e.g. "Fine Greatsword", "Rare Bow"). Delete Vestment/Charm/Crown/Guard/Blade. `gear.weaponType` field added so Upgrade/merge can read same-type vs off-type later.

### 5. Canon fix (audit B2)
- `data.js` world 6: boss `'Vaelyx the Eternal'`.

### 6. Stat spine in data (foundation for combat v2 — no behavior change yet)
- Add to `data.js`:
  ```js
  export const STATS = ['hp','mana','manaRegen','power','mitigation','attackSpeed','critChance','critDamage','healingPower'];
  export const ARCHETYPE_SEEDS = { /* per docs/Eldrathor_Archetype_Seeds_DRAFT.md: 10 everywhere, 15 on the two specialty stats */ };
  ```
- Keep the existing `ARCHETYPES` hp/atk/def fields for now so `resolveFight` keeps working — add a `// DESIGN-OPEN: legacy prototype numbers; replaced by ARCHETYPE_SEEDS in combat v2` comment above them.
- `PartyScreen` detail view: show the 9 seed stats for the selected Adventurer (read-only list). Header line above the list: "Base seeds — gems multiply these."

## Out of scope
Combat v2 resolver, gem trees UI, respawns/roaming rares/boss seal, Seam tab name, any art.

## Success criteria
- [ ] Tapping a node goes straight to the resolving fight; no Attack/Flee anywhere; `grep -ri flee app/src` returns nothing
- [ ] World pin → Rally screen (three Adventurers + boss + Explore) → route map
- [ ] Only weapon names drop; Vaelyx the Eternal
- [ ] `ARCHETYPE_SEEDS` present and visible in Party detail
- [ ] `npm run build` OK; phone portrait test noted in the PR
