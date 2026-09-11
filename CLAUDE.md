# CLAUDE.md — Eldrathor Project Instructions

## What this project is
Eldrathor: a UI-based iOS RPG (Vite + React now; Capacitor iOS wrap later). The player (a "Veinbinder") directs a bonded party of 3 Adventurers on expeditions up a Worldvein-saturated mountain. Core loop: enter procedural fog-of-war territory map → explore/fight (auto-resolve, watchable) → harvest → extract/die/boss (map resets) → spend on permanent growth → re-enter stronger.

## Agent split (LOCKED 2026-09-11)
- **Boss / Grok Bot** = planning, management, design locks, image gen, session log, Claude briefs, optional PR review/merge help.
- **Claude** = **all coding** / implementation in `app/`.
- Full workflow: `docs/AGENT_COORDINATION.md`. **Home sessions: start at `docs/CLAUDE_HOME_HANDOFF.md`.** Active tasks: `docs/CLAUDE_BRIEFS/`.
- Boss does not implement app code unless Anthony explicitly asks.

## Source of truth — read before building
1. `docs/Eldrathor_Design_Doc.md` — DESIGN SoT. Never contradict LOCKED. Flag conflicts.
2. **`docs/Eldrathor_AFK_Town_Lock.md`** — AFK Gather/Process/Idle·Train + Town; Market under Town; 5th tab = Seam (name OPEN).
3. `docs/Eldrathor_Island_Path_Lock.md` — 10-pin clockwise path; spline in code; hide 4→5 behind castle.
4. `docs/Eldrathor_NodeMap_Art_Lock.md` — theme ladder + parchment biomes.
5. `docs/GROK_BOT_SESSION_LOG.md` — chronology + cross-cutting locks.
6. `docs/CLAUDE_HOME_HANDOFF.md` — current queue for home Claude chats.
7. `docs/Eldrathor_TabBar_Lock.md` / `docs/Eldrathor_DualMode_Art_Lock.md` / `docs/Worldvein_Lore.md`.
8. `docs/AGENT_COORDINATION.md` + `docs/CLAUDE_BRIEFS/`.
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

## Who may implement
- **Claude implements code.** Boss plans/manages and writes briefs.

## Code conventions
- App in `app/` (Vite + React, JS). Keep `npm run dev` runnable.
- Mobile-portrait-first (390×844). No new deps without a reason.
- Theme: `app/src/theme/`. Map: `app/src/map/`.

## Current priorities
1. **`docs/CLAUDE_BRIEFS/2026-09-11_playtest-ux-polish.md`** (next).
2. Island 10-pin spline brief if not already on main.
3. Combat v2; AFK rates; growth screens — later.

## Workflow
- Design locks: Anthony + Boss → docs + brief.
- Code: Claude → PR → merge → session log.
- Mid-build gaps: placeholder + `// DESIGN-OPEN:`.

## Git workflow
- Always `git pull` first. Clear commits. Push when done. No force-push over others.
