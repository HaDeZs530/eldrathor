# CLAUDE.md — {{GAME}} Project Instructions

## What this project is
{{GAME}}: {{ONE_LINE_CONCEPT}}.

## Agent split
- **Claude Design Chat** (claude.ai Project "{{GAME}} — Design") = design authority: locks, design-doc edits, briefs in `docs/CLAUDE_BRIEFS/`, session log, audits of code vs locks.
- **Claude Code** (this agent) = **all coding**, plus committing doc files handed over from the Design Chat.
- Other tools = art / ad-hoc. They do not lock design.
- Workflow: `docs/AGENT_COORDINATION.md`. **Home sessions: start at `docs/CLAUDE_HOME_HANDOFF.md`.**

## Source of truth — read before building
1. `docs/{{GAME}}_Design_Doc.md` — LOCKED sections are decided; never contradict, flag conflicts.
2. `docs/*_Lock.md` — newer wins over the design doc where they conflict.
3. `docs/SESSION_LOG.md` — chronology.
4. `docs/CLAUDE_HOME_HANDOFF.md` — current queue. `docs/CLAUDE_BRIEFS/` — active tasks.
Design gaps: placeholder + `// DESIGN-OPEN:` only. Never invent mechanics, rates, or names.

## Hard rules
{{HARD_RULES}}

## Code conventions
- App in `app/` (Vite + React, JS; Capacitor iOS wrap later). Keep `npm run dev` / `npm run build` runnable.
- Mobile-portrait-first (390×844). No new deps without a reason.

## "go" / "next" — Tony's standing command
When Tony says **go**, **next**, or **continue**: `git pull` → read `docs/CLAUDE_HOME_HANDOFF.md` → take the top active brief → implement on a branch → build/tests → PR → merge it yourself → mark DONE in the handoff, briefs README and `docs/SESSION_LOG.md` → report PR number and any `DESIGN-OPEN`. Resume an existing `feat/<brief-slug>` branch if one exists; push WIP after every deliverable; report PARTIAL if stopping early. Then stop unless told **next** again.

## Workflow
- Brief → feature branch → PR (summary + phone test notes) → build green → **merge it yourself** (`gh pr merge --squash`) → append DONE line to `docs/SESSION_LOG.md`.
- Always `git pull` first. Never force-push over others.
