# BRIEF — Item numbers: three-avenue formula, tier-named armor, boss-named drops, save wipe policy
**Status:** READY · **Date:** 2026-09-17 · **Author:** Claude Design Chat · **Spec:** `Eldrathor_Item_Model_Lock.md` §1 (power), §2 (names), §9 (save policy)
1. Replace `TIER_MULT` (1.8^(T−1)), `RARITY_MULT` (1.158^rung), `ratingScale` (1 + 0.15×(r−1)/99), `empowerScale` (1 + e/400). Tests: Artifact T1 == Uncommon T2 at equal rating (within 1%); Legendary T1 == Common T2; no T1 item at any rarity/rating/empower beats a T3 Common rating 1; rating 100 = +15%; empower 100 = +25%.
2. Armor names by tier prefix (Gullwatch/Saltcliff/Quay/Serpent/Forge/Bastion/Worldforge + type). Boss weapon drops pull from `data/bossWeaponNames.js` (3 per boss; placeholders `"<Boss>'s <Type>"` until the Design Chat pushes the pools).
3. Save policy §9: bump `SAVE_VERSION`, drop the migration chain (keep the loader's version check + "Save reset for a game update" notice + export/import). Remove the T1 legacy-migration code.
4. Re-run the §8 balance gates; retune `ENEMY_TUNING` (never the item formula) if they move; report final numbers.
PR: `feat(items): three-avenue power formula, tier-named armor, boss-named drops, save wipe policy`
