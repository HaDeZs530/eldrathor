# BRIEF — M1a: permanent ids + versioned save/resume + export/import
**Status:** DONE (Claude Code, 2026-09-14, PR #50 `feat(save): permanent ids, versioned save/resume, export/import`) · **Date:** 2026-09-14 · **Author:** Claude Design Chat · **Spec:** `docs/Eldrathor_Progression_Loop_Lock.md` §1
1. Add `id` to every Adventurer/weapon/armor at creation; migrate existing default data with generated ids; replace every positional key (`party:i`, `roster:i`, HP-by-index) with ids.
2. `app/src/save/` — `serialize(state)`, `deserialize(json)`, `SAVE_VERSION`, migrations table, `load()`/`save()` with 1 s debounce + `visibilitychange` flush. Include the active run per the spec so app close resumes in place.
3. Menu → Settings: Export (clipboard) / Import (paste) / Reset (confirm).
4. Tests: round-trip a mid-run state; corrupt save → quarantine + fresh start; migration from unversioned.
PR: `feat(save): permanent ids, versioned save/resume, export/import`
