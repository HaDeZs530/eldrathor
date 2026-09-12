# Agent coordination — {{GAME}}

| Role | Who | Owns |
|------|-----|------|
| Design authority | Claude Design Chat (claude.ai Project) | Design + locks with Tony, design doc, `docs/CLAUDE_BRIEFS/`, `docs/SESSION_LOG.md`, audits, priorities |
| Coder | Claude Code | All `app/` code; committing doc files handed over |
| Art / helper | Other tools | Image candidates, ad-hoc. No locks, no briefs |

## Flow
1. Tony + Design Chat decide. Design Chat pulls the repo fresh each session.
2. Design Chat pushes: lock doc + brief + session-log line, straight to `main`.
3. Tony pastes a block into Claude Code: "pull main, read CLAUDE.md + handoff, do brief X."
4. Claude Code implements on a branch → PR → build green → merges itself → DONE line in session log.
5. Tony playtests on the phone; feedback goes back to the Design Chat.

## Brief rules
- One brief = one PR-sized outcome. Cite the lock. List DESIGN-OPEN explicitly. Success criteria + phone test plan.
- Claude Code: read CLAUDE.md + brief + cited locks before coding. Smallest placeholder over invented design.
