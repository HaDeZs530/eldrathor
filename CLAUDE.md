# CLAUDE.md — Eldrathor Project Instructions

## What this project is
Eldrathor: a UI-based iOS RPG (Vite + React now; Capacitor iOS wrap later). The player (a "Veinbinder") directs a bonded party of 3 Adventurers on expeditions up a Worldvein-saturated mountain. Core loop: enter procedural fog-of-war territory map → explore/fight (auto-resolve, watchable) → harvest → extract/die/boss (map resets) → spend on permanent growth → re-enter stronger.

## Source of truth — read before building
1. `docs/Eldrathor_Design_Doc.md` — the DESIGN source of truth. Sections marked LOCKED are decided. Never contradict a LOCKED section. If a task conflicts with one, STOP and flag the conflict instead of improvising.
2. **`docs/Eldrathor_AFK_Town_Lock.md`** — **LOCKED** AFK Gather/Process/Idle·Train + Town Crafter/Upgrade/Market; nav (Market under Town; 5th tab = AFK/Seam). Prefer this when it conflicts with older design-doc nav text.
3. `docs/Eldrathor_Handoff_Doc.md` — project state, architecture, priorities.
4. `docs/Worldvein_Lore.md` — world canon.
5. `docs/GROK_BOT_SESSION_LOG.md` — agents must read this for Boss/Grok locks & chronology (transferable handoff).
6. `docs/Eldrathor_TabBar_Lock.md` — bottom nav chrome (aligned with AFK/Town lock).
§9 of the design doc lists what's intentionally OPEN. Don't fill open design gaps with inventions — implement placeholders and flag them.

## Hard rules (from the design doc's NEVER list)
- No pay-to-win, no gacha power, no prestige/reset mechanics, no stat rerolls.
- No character movement — ALL interaction is UI/tap.
- Combat auto-resolves; the player never taps attacks. Interactivity = map traversal.
- Single currency: Worldvein.
- Active abilities exist ONLY on class gems (weapons = stats only; armor gems = passive only).
- Weapons DROP (+ merge as growth); armor is CRAFTED only (never drops).

## Art direction (LOCKED — dual modes)
- Master rule: WARM/sunlit = reality (Town, town functions, Characters, Player screens). COLD/dark Mythros-blue = Vein projection (World map, Expedition map, Combat).
- **Dual graphical modes (not either/or):**
  - **WORLD** — fun MICRO-PIXEL, warm/sunlit (Veinbinder physically in Veinharbor). Pixel kit for warm reality.
  - **MIND VIEW** — refined fantasy-sim + Mythros-blue magic aura (Veinbinder seeing the party in his head via blue magic — diegetic projection, NOT a second physical place). Refined kit for cold projection.
- Mode switch when entering/leaving Mind View must feel intentional.
- Fantasy, not sci-fi: Cinzel/Marcellus-class display fonts on Mind View; jewel tones; carved/ornamented / aura frames. No monospace/HUD fonts, no neon circuit aesthetics.
- Reference mockups: `mockups/town_mockup_v3.html` (warm pole), `mockups/worldmap_mockup.html` (cold pole).
- Nav: persistent 5-tab bottom bar left→right — **Player · Party · Mountain (CENTER, emphasized) · Town · AFK/Seam** (working label; final name DESIGN-OPEN). Hub chrome theme families: Player/Party/AFK → mind-view; Mountain → hybrid; Town → warm RPG. Switching families must **crossfade/transition** (~300–450ms), never pop. **Market lives under Town**, not as a root tab. Tab bar is hub chrome — **stay visible during runs** (island→difficulty→expedition→fight→loot); switching tabs must not clear run stage. AFK timers continue across tabs (persistence/offline DESIGN-OPEN). See `docs/Eldrathor_AFK_Town_Lock.md` + `docs/GROK_BOT_SESSION_LOG.md` + `docs/Eldrathor_TabBar_Lock.md`.
- Full detail: design doc §3c + dual-mode art lock.

## Who may implement
- Owner design lock lives in the main Claude chat + design doc.
- **Boss / Grok Bot may implement** code and docs on feature branches (GitHub MCP or local). Claude Code / Cowork also execute builds. Same rules for everyone: never contradict LOCKED design.

## Code conventions
- App lives in `app/` (Vite + React, JavaScript). Keep it runnable with `npm run dev` at all times.
- Mobile-portrait-first (390×844 target). No browser storage APIs in artifacts/components that must run in claude.ai.
- Prefer simple readable React state over frameworks/libraries; no new dependencies without a stated reason.
- Theme modules: `app/src/theme/` (WORLD | MIND expedition dual-mode + hub skins mind|mountain|rpg). Map modules: `app/src/map/` (territory graph, not rows).
- The old prototype's row-based pyramid map is SUPERSEDED — the territory model (design doc §8c) is the spec: pannable organic node web, fog of war, hidden node types, respawns + named variants, roaming rares warding the boss, extraction = fresh map.

## Current priorities (from the handoff + AFK/Town lock)
1. AFK Gather/Process/Idle + Town Crafter/Upgrade/Market base UI (this milestone) — then rates/recipes polish.
2. Territory map dual UI kits + combat screen v2.
3. Playtest & tune (fight lengths, respawn cadence, named rate, map size).
4. Growth spend screens: weapon merging, gem trees, Veinbinder Bond/Craft trees (WORLD theme).
5. Asset production for both kits + style bible (dual-mode locked; don't force a single style).

## Workflow
- Design decisions happen in the owner's main Claude chat and land in the design doc. Cowork/Code/Boss/Grok Bot execute.
- When a design question arises mid-build, implement the smallest reasonable placeholder, comment it `// DESIGN-OPEN:`, and surface it in your summary — do not decide game design unilaterally.

## Git workflow
This project is backed by a **private GitHub repo** (`eldrathor`). It can be worked on from multiple locations, so treat git as the sync mechanism:
- **Always `git pull` before starting work** — another machine/session may have pushed changes. Start from the latest.
- **Commit in logical chunks with clear messages** — describe what changed and why (e.g. `Rebuild expedition map to territory model (§8c)`), not `wip` or `stuff`.
- **Push when a task completes** (`git push`) so the work is backed up and available at your other locations.
- `node_modules/` and `dist/` are gitignored — after cloning on a new machine, run `npm install` inside `app/` before `npm run dev`.
- If a pull reports conflicts, stop and resolve them before continuing — don't force-push over someone else's work.
