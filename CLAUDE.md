# CLAUDE.md — Eldrathor Project Instructions

## What this project is
Eldrathor: a UI-based iOS RPG (Vite + React now; Capacitor iOS wrap later). The player (a "Veinbinder") directs a bonded party of 3 Adventurers on expeditions up a Worldvein-saturated mountain. Core loop: enter procedural fog-of-war territory map → explore/fight (auto-resolve, watchable) → harvest → extract/die/boss (map resets) → spend on permanent growth → re-enter stronger.

## Agent split (LOCKED 2026-09-11, supersedes the Boss/Claude split from earlier the same day)
- **Claude Design Chat** (claude.ai Project "IOS Game Design - Eldrathor") = design authority: design discussion with Anthony, LOCKS, design-doc edits, briefs in `docs/CLAUDE_BRIEFS/`, session log, audits of code vs. locks.
- **Claude Code** (this agent) = **all coding** / implementation in `app/`, plus committing doc files handed over from the Design Chat.
- **Grok Bot** = art / image candidates and ad-hoc tasks Anthony assigns. Grok does NOT lock design or write briefs anymore. Older locks signed "Anthony + Boss" remain valid history.
- Full workflow: `docs/AGENT_COORDINATION.md`. **Home sessions: start at `docs/CLAUDE_HOME_HANDOFF.md`.** Active tasks: `docs/CLAUDE_BRIEFS/`.

## Source of truth — read before building
1. `docs/Eldrathor_Design_Doc.md` — DESIGN SoT. Never contradict LOCKED. Flag conflicts.
2. Lock docs (newer wins over the design doc where they conflict):
   - `docs/Eldrathor_AFK_Town_Lock.md` — AFK Gather/Process/Idle·Train + Town; Market under Town; 5th tab = Seam (name OPEN).
   - `docs/Eldrathor_Island_Path_Lock.md` — 10-pin clockwise path; spline in code; hide 4→5 behind castle.
   - `docs/Eldrathor_NodeMap_Art_Lock.md` — theme ladder + parchment biomes.
   - `docs/Eldrathor_TabBar_Lock.md` / `docs/Eldrathor_DualMode_Art_Lock.md`
   - `docs/Eldrathor_BaseStats_Lock.md` — the nine stats every system uses (LOCKED July 2026).
   - `docs/Eldrathor_ClassGemTrees_Lock.md` — full 40-pt trees for Tank/DPS/Controller/Healer (LOCKED July 2026).
   - `docs/Eldrathor_Archetype_Seeds_DRAFT.md` — archetype base numbers (approved for build 2026-09-11).
   - `docs/Eldrathor_Combat_v2_Lock.md` — resolver formulas, innates, enemy tiers, fight screen (LOCKED 2026-09-11).
3. `docs/SESSION_LOG.md` — chronology + cross-cutting locks.
4. `docs/CLAUDE_HOME_HANDOFF.md` — current queue.
5. `docs/CLAUDE_BRIEFS/` — active tasks. `docs/Worldvein_Lore.md` — canon.
§9 of the design doc lists intentional OPEN gaps — placeholders + `// DESIGN-OPEN:` only.

## Hard rules (from the design doc's NEVER list)
- No pay-to-win, no gacha power, no prestige/reset mechanics, no stat rerolls.
- No character movement — ALL interaction is UI/tap.
- Combat auto-resolves; the player never taps attacks. Interactivity = map traversal.
- Single currency: Worldvein.
- Active abilities exist ONLY on class gems (weapons = stats only; armor gems = passive only).
- Weapons DROP (+ merge as growth); armor is CRAFTED only (never drops).

## Art direction (LOCKED — dual modes + Mountain ladder)
- Island world map → warm RPG (**pan only**, no zoom — playtest lock).
- Location/node map → hybrid + parchment fog-of-war.
- Fight/loot → full Mind-view.
- Crossfade theme switches (~300–450ms).
- Nav: **Player · Party · Mountain · Town · Seam** (Seam name OPEN). Market under Town. Tab bar stays during runs.

## Code conventions
- App in `app/` (Vite + React, JS). Keep `npm run dev` and `npm run build` runnable.
- Mobile-portrait-first (390×844). No new deps without a reason.
- Theme: `app/src/theme/`. Map: `app/src/map/`.

## Workflow
- Design locks: Anthony + Claude Design Chat → lock doc / design-doc section + brief.
- Code: Claude Code → feature branch → PR → merge → session log line.
- Mid-build gaps: placeholder + `// DESIGN-OPEN:`. Never invent mechanics, rates, or names.
- Doc files handed over by the Design Chat are committed verbatim unless the brief says otherwise.

## Git workflow
- Always `git pull` first. Clear commits. Push when done. No force-push over others.
