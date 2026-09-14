# BRIEF — M1d: engineering hygiene
**Status:** DONE (Claude Code, 2026-09-14, PR #54 `chore: CI, test integrity, node pin, trace hardening, doc refresh`; PR #15 closed as superseded) · **Date:** 2026-09-14 · **Author:** Claude Design Chat
1. GitHub Actions CI on PR + main: `npm ci`, build, tests. Branch protection on main requiring the check (Tony enables the ruleset; you add the workflow).
2. Fix the `|| true` segment-intersection assertion and any test whose description outruns its assertion.
3. Pin Node (`.nvmrc` + `engines`) and update `DEV_SETUP.md`.
4. Dev trace receiver: body size limit, bounded retention, async writes, LAN-only origin check.
5. Debug trace: include build hash + a state snapshot at run start; raise buffer so the run opening isn't lost.
6. Close or fix PR #15 (phone launcher) — decide by whether it still works after the Vite `--host` behaviour; don't leave it open.
7. Refresh `docs/Eldrathor_Handoff_Doc.md` §3–§5 to current architecture (tabs, no respawns, files); archive superseded briefs under `docs/CLAUDE_BRIEFS/_archive/`; replace the template `app/README.md`.
PR: `chore: CI, test integrity, node pin, trace hardening, doc refresh`
