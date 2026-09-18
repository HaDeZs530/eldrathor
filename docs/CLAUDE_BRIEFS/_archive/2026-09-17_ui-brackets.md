# BRIEF — UI brackets: The Bond (Party), The Veinbinder (Player), The Hearth — each tab its own place
**Status:** DONE (PR #66, 2026-09-17, Claude Code) · **Date:** 2026-09-17 · **Author:** Claude Design Chat · **Spec:** `docs/Eldrathor_UI_Brackets_Lock.md` (authoritative; the table is the only source of screen → bracket)
**Before → after:** Party: Veinharbor → Bond · Player + Settings: Veinharbor → Veinbinder · Hearth: Veinharbor → Hearth. Town/Bag/Recruit, Exploration, Mind View unchanged.
1. `MODE_TOKENS` gains three full token sets (bond, veinbinder, hearth) with every token defined (no fallbacks, per #59); `MODE_FOR_SKIN` / `TAB_HUB_SKIN` mirror the lock table; stylesheets `bond.css`, `veinbinder.css`, `hearth.css`.
2. Bracket signatures: Bond firelight under-glow + 2–3 drifting ember particles (compositor-only, reduced-motion off); Veinbinder rune-ring watermark + node glow; Hearth smoke wisp + job tool glyphs (three icons added to the art manifest: `icon-job-gather/process/train.png`, placeholders until art).
3. Sheets inherit per §D — six distinct sheet fills now; extend `modeTokens.test.js` to assert six distinct panel fills and six distinct Menu panels.
4. Tab switch crossfade 250 ms inside the frame only.
5. **PR must include phone captures of Party, Adventurer sheet, Player, Settings, Hearth, Offline summary, and Menu over each.** Anthony approves from the captures.
PR: `feat(ui): brackets — The Bond, The Veinbinder, The Hearth`
