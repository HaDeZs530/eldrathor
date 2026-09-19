# BRIEF — M2 lock 2: talent tree engine + class gems live (drop, equip, effects, tree screen)
**Status:** READY · **Date:** 2026-09-19 · **Author:** Claude Design Chat  
**Specs:** `docs/Eldrathor_ClassGems_Live_Lock.md` (authoritative) + `docs/Eldrathor_ClassGemTrees_Lock.md` (node contents). Bump `SAVE_VERSION` (wipe policy).
1. `app/src/trees/engine.js` per §1 — generic, pure, tested; no gem assumptions.
2. `app/src/trees/classGems.js` — four `TreeDef`s transcribed from the ClassGemTrees lock with §2 thresholds and §3 numbers in a single `GEM_TUNING` table.
3. Gem items (§4): drops from rares/bosses/named at the stated rates; bag rows; sheet with Equip / Open tree.
4. Equip + effects (§5): Gem slot live; crossing/matching in `derive`; procs and finishers implemented in `simulate` as events; third ability button on party cards.
5. `TreeScreen` (§6) in Mind View with live header, 4-wide rows, node sheet, Buy with reasons, finisher swap.
6. Tests per §7. Report any DESIGN-OPEN.
PR: `feat(gems): tree engine, class gems live, tree screen`
