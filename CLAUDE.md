# CLAUDE.md — Eldrathor Project Instructions

## What this project is
Eldrathor: a UI-based iOS RPG (Vite + React now; Capacitor iOS wrap later). The player (a "Veinbinder") directs a bonded party of 3 Adventurers on expeditions up a Worldvein-saturated mountain. Core loop: enter procedural fog-of-war territory map → explore/fight (auto-resolve, watchable) → harvest → extract/die/boss (map resets) → spend on permanent growth → re-enter stronger.

## Agent split (LOCKED 2026-09-11)
- **Boss / Grok Bot** = planning, management, design locks, image gen, session log, Claude briefs, optional PR review/merge help.
- **Claude** = **all coding** / implementation in `app/`.
- Full workflow: `docs/AGENT_COORDINATION.md`. Active tasks: `docs/CLAUDE_BRIEFS/`.
- Boss does not implement app code unless Anthony explicitly asks.

## Source of truth — read before building
1. `docs/Eldrathor_Design_Doc.md` — the DESIGN source of truth. Sections marked LOCKED are decided. Never contradict a LOCKED section. If a task conflicts with one, STOP and flag the conflict instead of improvising.
2. **`docs/Eldrathor_AFK_Town_Lock.md`** — **LOCKED** AFK Gather/Process/Idle·Train + Town Crafter/Upgrade/Market; nav (Market under Town; 5th tab = AFK/Seam). Prefer this when it conflicts with older design-doc nav text.
3. `docs/Eldrathor_NodeMap_Art_Lock.md` — island vs node-map theme ladder + parchment/fog/biome stamps (forge = interiors).
4. `docs/Eldrathor_Handoff_Doc.md` — project state, architecture, priorities (may lag; prefer locks + session log).
5. `docs/Worldvein_Lore.md` — world canon.
6. `docs/GROK_BOT_SESSION_LOG.md` — Boss/Grok locks & chronology (transferable handoff).
7. `docs/Eldrathor_TabBar_Lock.md` — bottom nav chrome (aligned with AFK/Town lock).
8. `docs/AGENT_COORDINATION.md` + `docs/CLAUDE_BRIEFS/` — who does what + current coding brief.
§9 of the design doc lists what's intentionally OPEN. Don't fill open design gaps with inventions — implement placeholders and flag them.

## Hard rules (from the design doc's NEVER list)
- No pay-to-win, no gacha power, no prestige/reset mechanics, no stat rerolls.
- No character movement — ALL interaction is UI/tap.
- Combat auto-resolves; the player never taps attacks. Interactivity = map traversal.
- Single currency: Worldvein.
- Active abilities exist ONLY on class gems (weapons = stats only; armor gems = passive only).
- Weapons DROP (+ merge as growth); armor is CRAFTED only (never drops).

## Art direction (LOCKED — dual modes + Mountain ladder)
- Master rule: WARM/sunlit = reality (Town, town functions). COLD/dark Mythros-blue = Vein projection (combat / mind screens).
- **Dual graphical modes:**
  - **WORLD** — fun MICRO-PIXEL, warm/sunlit (Veinbinder in Veinharbor).
  - **MIND VIEW** — refined fantasy-sim + Mythros-blue aura (diegetic projection, NOT a second physical place).
- **Mountain theme ladder (2026-09-11):**
  1. Island world map → warm RPG (pannable landscape art on portrait).
  2. Location/node travel map → **hybrid** + parchment fog-of-war route map (`Eldrathor_NodeMap_Art_Lock.md`).
  3. Fight/loot → full Mind-view.
- Mode/theme switches must **crossfade** (~300–450ms), never pop.
- Nav: persistent 5-tab bottom bar — **Player · Party · Mountain (CENTER) · Town · AFK/Seam** (working label; final name DESIGN-OPEN). Hub skins: Player/Party/AFK Gather·Idle → mind; Mountain → hybrid; Town → warm RPG. **Market under Town**. Tab bar **stays visible during runs**. See AFK/Town + TabBar locks.
- Full detail: design doc §3c + dual-mode + node-map art locks.

## Who may implement
- **Claude implements code.** Boss plans/manages and writes briefs.
- Same rules for everyone: never contradict LOCKED design.

## Code conventions
- App lives in `app/` (Vite + React, JavaScript). Keep it runnable with `npm run dev` at all times.
- Mobile-portrait-first (390×844 target). No browser storage APIs in artifacts/components that must run in claude.ai.
- Prefer simple readable React state over frameworks/libraries; no new dependencies without a stated reason.
- Theme modules: `app/src/theme/` (WORLD | MIND | hybrid hub skins). Map modules: `app/src/map/`.
- The old prototype's row-based pyramid map is SUPERSEDED — territory model (design doc §8c): pannable organic node web, fog of war, etc.

## Current priorities
1. **Claude brief:** `docs/CLAUDE_BRIEFS/2026-09-11_pannable-island-and-node-map.md` — pannable island + parchment node map.
2. AFK rates/recipes polish after base UI.
3. Combat screen v2; playtest & tune.
4. Growth spend screens; dual-kit assets.

## Workflow
- Design locks: Anthony + Boss → lock docs + session log + Claude brief.
- Code: Claude executes brief → PR → review/merge → session log.
- Mid-build design gap: smallest placeholder + `// DESIGN-OPEN:` — do not decide unilaterally.

## Git workflow
Private GitHub repo `eldrathor`. Multi-machine sync:
- Always `git pull` before starting work.
- Commit in logical chunks with clear messages.
- Push when a task completes.
- `node_modules/` and `dist/` are gitignored — `npm install` in `app/` after clone.
- Resolve conflicts; don't force-push over others' work.
