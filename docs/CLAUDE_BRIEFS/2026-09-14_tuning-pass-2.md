# BRIEF — Tuning pass 2: sustain retune, boss damage cap, Hearth rename, DESIGN-OPEN numbers
**Status:** READY · **Date:** 2026-09-14 · **Author:** Claude Design Chat · **Spec:** `Eldrathor_Progression_Loop_Lock.md` §9, `Eldrathor_Combat_v2_Lock.md` (retuned rows)
1. Innates: Renewal 1%/3 s, Mend 30 / CD 7 s, Guardian's Bulwark 8%. Boss: hp ×22, dmg ×7, enrage ×2/15 s. Add a test: no boss hit outside enrage exceeds 40% of a level-appropriate Bulwark's max HP.
2. Re-run §8 gates. If gate 1 fails, raise boss hp (never dmg) until ≥8/10; gate 2 must pass with boss fights of 40–90 s. Report final numbers.
3. Rename Seam → **Hearth** everywhere (tab, help copy, manifest icon `icon-tab-hearth.png`, tests).
4. Armor recipes Wardplate / Veinweave per §9; market floor 1 ❖ × rarity index; `AFK_TUNING` table with the current prototype values.
PR: `feat(balance): sustain retune + boss dmg cap, Hearth rename, recipes/floor/afk tuning table`
