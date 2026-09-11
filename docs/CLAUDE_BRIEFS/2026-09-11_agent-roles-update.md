# BRIEF — Agent roles update (design authority moves to Claude Design Chat)

**Status:** DONE — applied directly by Claude Design Chat 2026-09-11 (docs-only, pushed to main)  
**Date:** 2026-09-11  
**Author:** Claude Design Chat (claude.ai Project "IOS Game Design - Eldrathor")  
**Approved by:** Anthony, 2026-09-11

## Goal
Docs-only PR. Move design/lock/brief authority from Grok Bot ("Boss") to the Claude Design Chat. Grok becomes art/image-gen + ad-hoc helper. No `app/` code changes.

## Steps
1. `git pull` on `main`. Branch `docs/agent-roles-update`.
2. Replace these files with the versions shipped alongside this brief (full replacements, not merges):
   - `CLAUDE.md`
   - `docs/AGENT_COORDINATION.md`
   - `docs/CLAUDE_HOME_HANDOFF.md`
   - `docs/CLAUDE_BRIEFS/README.md`
3. `git mv docs/SESSION_LOG.md docs/SESSION_LOG.md`, then prepend the header block from the shipped `docs/SESSION_LOG.md` (keep ALL existing content below it as history — do not delete Grok's locks or chronology).
4. Replace every remaining reference to `SESSION_LOG.md` with `SESSION_LOG.md` across `docs/**/*.md` (the three older briefs, `Eldrathor_AFK_Town_Lock.md`, `Eldrathor_TabBar_Lock.md`).
5. In the lock docs, leave "Anthony + Boss" attributions as-is — they are historical and correct for when those locks were made.
6. `npm run build` in `app/` must still pass (it should — no code touched).
7. PR titled `docs: agent roles — design authority to Claude Design Chat`. Merge, then append the milestone line to `docs/SESSION_LOG.md` chronology.

## Out of scope
- Any change to LOCKED design content.
- Renaming the Seam tab, Rally title, or any DESIGN-OPEN item.
- The `docs/_restore_b64/` folder (leave it; separate cleanup later).

## Success criteria
- [ ] `grep -r GROK_BOT_SESSION_LOG docs CLAUDE.md` returns nothing
- [ ] `docs/SESSION_LOG.md` exists with full prior history intact
- [ ] `CLAUDE.md` names Claude Design Chat as design authority
- [ ] PR merged; session log updated
