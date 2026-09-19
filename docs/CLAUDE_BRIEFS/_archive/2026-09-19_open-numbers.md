# BRIEF — Fill the open numbers from PR #61 + small fixes
**Status:** DONE (PR #69, 2026-09-19, Claude Code) · **Date:** 2026-09-19 · **Author:** Claude Design Chat
Rulings:
- **Mythic-T1 exception:** allowed. A Mythic T1 (only reachable via Cores from Vaelyx) may exceed a Common T2 but must never exceed a Common T3; adjust the test to that statement.
- **Core drops:** Artifact Core — 8% from rares, 20% from bosses, areas 8–9 only; gathered 1 per 2 h in 8–9. Mythic Core — 25% per Vaelyx kill. (tune)
- **Sell value:** `5 × rarityIndex² × (1 + rating/200)` ❖ (Common 5–7, Legendary 125–187). Materials sell at `1 × rarityIndex` ❖.
- **Recruit:** first three free, then `50 × (rosterSize − 2)` ❖; candidates are named from the weapon-name adjective pool for now.
- **Weapon special names:** Design Chat will push `data/weaponNames.js` and `data/bossWeaponNames.js` separately; keep placeholders until then.
- Style Bible §A heading fix: do it.
- `icon-job-*` art: stays pending on Anthony; placeholders fine.
PR: `chore(items): open numbers, mythic-T1 test, style bible heading`
