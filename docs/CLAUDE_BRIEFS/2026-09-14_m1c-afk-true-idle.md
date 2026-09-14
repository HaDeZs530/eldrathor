# BRIEF — M1c: AFK true idle with offline reconciliation
**Status:** READY · **Date:** 2026-09-14 · **Author:** Claude Design Chat · **Spec:** `docs/Eldrathor_Progression_Loop_Lock.md` §6
Timestamp-based accrual (`startedAt`, `lastReconciledAt`), multi-cycle processing with remainder, resource exhaustion, one job per character id, suspend on deploy / resume on return, Offline summary sheet when elapsed > 60 s. Tests: 20 s into a 4 s cycle → 5 outputs; exhaustion stops cleanly; deploy pauses and resumes.
PR: `feat(afk): true idle accrual + offline summary`
