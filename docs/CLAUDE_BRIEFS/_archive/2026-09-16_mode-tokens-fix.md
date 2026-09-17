# BRIEF — Every mode defines its own tokens; nothing falls back to Town brown
**Status:** DONE (PR #59) · **Date:** 2026-09-16 · **Author:** Claude Design Chat · **Spec:** Style Bible §A + §D
Cause: `ui.css` hard-codes Veinharbor values as `var(--eld-*, #141210)` fallbacks and only `mind.css` overrides them, so Exploration screens (Rally, route map cards, run log, explore/reveal cards) render Town brown.
1. Define the full `--eld-*` token set in each mode stylesheet: `world.css` (Veinharbor), the Exploration mode (parchment `#f1e6cf`, border `#8a7350`, ink text, gold primary), `mind.css` (already). Remove the hard-coded fallbacks in `ui.css` (or make them fail loudly in dev).
2. Ensure Rally, route map HUD/cards/run log render under the Exploration mode class; Town/Party/Player/Hearth under Veinharbor; Fight/Results/Sanctuary under Mind View. Sheets inherit per §D (complete the 2026-09-14 sheets brief if it wasn't merged).
3. Test: render each screen and assert the computed panel background is the mode's value (three distinct values); Menu over each mode yields three distinct panels.
PR: `fix(theme): per-mode token sets, no Town fallback`
