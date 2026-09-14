# BRIEF — M1b: XP, equipment that applies, empowerment per lock, armor stats, rarity ladder, crit fix
**Status:** READY · **Date:** 2026-09-14 · **Author:** Claude Design Chat · **Spec:** `docs/Eldrathor_Progression_Loop_Lock.md` §2–§5, §7
1. Rarity ladder Common/Fine/Rare/Epic/Legendary everywhere (rename Mythic; give Epic materials recipes and a sale path). Loot band-by-area roll per §2 incl. Attune Vein, rare/boss shifts.
2. Character XP per §3 on every fight result; level-up line in results and run log; Train grants XP with no catch-up cap.
3. Equipment applies: weapon is an item from the stash with rating + empower feeding `deriveStats`; body armor slot with §4 stats. Party sheet shows equipped-derived stats and a swap diff.
4. Upgrade bench rewritten per §4: immutable `baseRating`, separate `empower`, explicit fodder pick, preview of gain/cost/resulting damage, disabled when useless. Remove merge-as-average.
5. Crit formula fix per §5 (derive.js) + test that a +0.5 gem term yields 2.0×.
6. Remove archetype editing; validate name edits; add "Coming — not yet active" tags to unbuilt controls.
7. Tests for each formula and the §8 balance gates (replace the two TODO tests with enforced ones; tune enemy base/boss multipliers until both gates pass; list final numbers in the PR).
PR: `feat(progression): xp, equipment, empowerment, armor, rarity ladder, crit fix, balance gates`
