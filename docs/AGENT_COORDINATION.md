# Agent coordination — Eldrathor

**Status:** LOCKED 2026-09-11 (Anthony). Supersedes the Boss/Claude split locked earlier the same day.

## Roles

| Role | Who | Owns |
|------|-----|------|
| **Design authority** | **Claude Design Chat** (claude.ai Project "IOS Game Design - Eldrathor") | Design discussion & locks with Anthony, design-doc + lock-doc edits, `docs/CLAUDE_BRIEFS/`, `docs/SESSION_LOG.md`, audits of shipped code against locks, priorities |
| **Coder** | **Claude Code** (Desktop app Code tab / Cowork / cloud sessions) | All `app/` code, refactors, wiring assets, implementing briefs, committing doc files handed over by the Design Chat |
| **Art / helper** | **Grok Bot** | Image candidates, art exploration, ad-hoc tasks Anthony assigns. No design locks, no briefs. |

Claude Code does **not** invent LOCKED design — flag conflicts. Grok does **not** write locks or briefs.

## Source of truth (read order)
1. `CLAUDE.md` — hard rules + this split
2. `docs/Eldrathor_Design_Doc.md` — design SoT (prefer newer lock docs when they conflict)
3. Lock docs: `Eldrathor_AFK_Town_Lock.md`, `Eldrathor_TabBar_Lock.md`, `Eldrathor_DualMode_Art_Lock.md`, `Eldrathor_NodeMap_Art_Lock.md`, `Eldrathor_Island_Path_Lock.md`
4. `docs/SESSION_LOG.md` — chronology + cross-cutting locks
5. `docs/CLAUDE_BRIEFS/` — **active coding tasks** (newest first)
6. `docs/Eldrathor_Handoff_Doc.md` — architecture snapshot (may lag; prefer locks + session log)

## How work flows
1. Anthony + Design Chat resolve a design question in chat. The Design Chat pulls the repo fresh at the start of every session (repo is public or token-accessible) so it works from current docs and code.
2. Design Chat produces: the lock (design-doc section or lock-doc text) + a brief in `docs/CLAUDE_BRIEFS/` + a session-log line. These come out as files.
3. Anthony hands the files to Claude Code ("commit these and implement the brief"). Claude Code commits the docs, then implements on a feature branch → PR.
4. Anthony (or the Design Chat, on next pull) reviews against locks; merge; Claude Code appends the milestone to `docs/SESSION_LOG.md`.
5. Art: Grok (or PixelLab from the PC) generates candidates outside the repo; Anthony approves; Claude Code wires approved assets into `app/public/` per a brief that names the path.

## Brief rules (for the Design Chat)
- One brief = one shippable PR-sized outcome.
- Cite LOCKED constraints; list DESIGN-OPEN explicitly.
- Success criteria + test plan (phone portrait, tab persistence, themes).
- Never ask Claude Code to invent economy rates or new systems not in locks.

## Brief rules (for Claude Code)
- Read `CLAUDE.md` + the brief + cited locks before coding.
- Prefer smallest placeholder + `// DESIGN-OPEN:` over inventing design.
- Keep `npm run dev` / `npm run build` runnable; no new deps without a reason.
- Push a PR with summary + test plan.

## Usage note
Design happens in the claude.ai Project (unlimited iteration, cheap). Claude Code has the coding headroom. Grok's weekly usage is reserved for art.
