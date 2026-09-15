# BRIEF — Sheets and cards inherit the underlying screen's mode
**Status:** READY · **Date:** 2026-09-14 · **Author:** Claude Design Chat · **Spec:** `Eldrathor_Style_Bible_Lock.md` §D
`Sheet`/card components read the active mode from `ThemeProvider` when opened and apply that column's tokens (Veinharbor / Exploration / Mind View); mode is frozen for the sheet's lifetime. Audit every overlay listed in §D and remove any hard-coded parchment/town styling. Test: Menu opened over Town, Route map and Fight yields three distinct panel fills/borders; Results over Fight is Mind View with glow.
PR: `fix(ui): sheets and cards inherit screen mode`
