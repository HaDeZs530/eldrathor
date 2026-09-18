# BRIEF — UI brackets v2: Party/Player/Settings → Mind View; Hearth = Veinharbor + Mythros accents; retire Bond/Veinbinder
**Status:** READY · **Date:** 2026-09-17 · **Author:** Claude Design Chat · **Spec:** `Eldrathor_UI_Brackets_Lock.md` (revised table)
**Before → after:** Party: Bond → Mind View · Player/Settings: Veinbinder → Mind View · Hearth: teal → Veinharbor base with Mythros accents. Town/Bag/Recruit, Exploration, Fight/Results unchanged.
1. `MODE_FOR_SKIN` / `TAB_HUB_SKIN` = the four-bracket table. Delete `bond.css`, `veinbinder.css` and their token sets, particles, watermark, wisp.
2. Party + Adventurer sheet + slots + roster and Player + trees + Settings render the Mind View column (same tokens as Fight — no variant). Party cards on the Party root use the fight PartyCard treatment (portrait frame, HP/MP bars) so Party and Fight read as one place.
3. Hearth: `hearth.css` = Veinharbor tokens + `--eld-accent: #2cabf8` applied to active segment, progress bars, timers, Worldvein counter, and a blue glow on running job cards only.
4. Tests: four distinct panel fills (Mind, Veinharbor, Exploration, Hearth); Menu over Party === Menu over Fight; Menu over Hearth has Veinharbor fill.
5. **PR ships phone captures** of Party, Adventurer sheet, Player, Settings, Hearth (a job running), Fight, Town.
PR: `feat(ui): brackets v2 — Party/Player to Mind View, Hearth blend, retire Bond/Veinbinder`
