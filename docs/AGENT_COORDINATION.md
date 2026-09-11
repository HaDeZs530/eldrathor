# Agent coordination — Eldrathor

**Status:** LOCKED 2026-09-11 (Anthony)

## Roles

| Role | Who | Owns |
|------|-----|------|
| **Planner / PM / Art** | **Boss (Grok Bot)** | Design discussion & locks, theme/art direction, image gen candidates, session log, Claude briefs, PR review / merge help on phone, priorities |
| **Coder** | **Claude** (Code / Cowork / chat that writes PRs) | All app code, refactors, wiring assets into the build, implementing briefs |

Boss does **not** implement `app/` code unless Anthony explicitly asks. Claude does **not** invent LOCKED design — flag conflicts.

## Source of truth (read order)
1. `CLAUDE.md` — hard rules + this split
2. `docs/Eldrathor_Design_Doc.md` — design SoT (prefer newer lock docs when they conflict)
3. Lock docs: `Eldrathor_AFK_Town_Lock.md`, `Eldrathor_TabBar_Lock.md`, `Eldrathor_DualMode_Art_Lock.md`, `Eldrathor_NodeMap_Art_Lock.md`
4. `docs/GROK_BOT_SESSION_LOG.md` — chronology + cross-cutting locks
5. `docs/CLAUDE_BRIEFS/` — **active coding tasks** for Claude (newest first)
6. `docs/Eldrathor_Handoff_Doc.md` — architecture snapshot (may lag; prefer locks + session log)

## How work flows
1. Anthony + Boss lock design / art / priorities in chat.
2. Boss updates lock docs + `GROK_BOT_SESSION_LOG.md` and drops a brief in `docs/CLAUDE_BRIEFS/`.
3. Claude implements from the brief on a feature branch → PR.
4. Boss (or Anthony) reviews against locks, merges, logs the milestone.
5. Image candidates may live outside the repo until Boss/Anthony drop approved assets into `app/public/` (or similar); briefs say the path.

## Brief rules (for Boss)
- One brief = one shippable PR-sized outcome.
- Cite LOCKED constraints; list DESIGN-OPEN explicitly.
- Success criteria + test plan (phone portrait, tab persistence, themes).
- Never ask Claude to invent economy rates or new systems not in locks.

## Brief rules (for Claude)
- Read `CLAUDE.md` + the brief + cited locks before coding.
- Prefer smallest placeholder + `// DESIGN-OPEN:` over inventing design.
- Keep `npm run dev` runnable; no new deps without a reason.
- Push a PR with summary + test plan.

## Usage note
Anthony uses Boss for planning/management/image gen to save weekly Bot usage; Claude has more coding headroom. Prefer briefs over long Bot coding sessions.
