# CLAUDE.md — Eldrathor Project Instructions

## What this project is
Eldrathor: a UI-based iOS RPG (Vite + React now; Capacitor iOS wrap later). The player (a "Veinbinder") directs a bonded party of 3 Adventurers on expeditions up a Worldvein-saturated mountain. Core loop: enter procedural fog-of-war territory map → explore/fight (auto-resolve, watchable) → harvest → extract/die/boss (map resets) → spend on permanent growth → re-enter stronger.

## Source of truth — read before building
1. `docs/Eldrathor_Design_Doc.md` — the DESIGN source of truth. Sections marked LOCKED are decided. Never contradict a LOCKED section. If a task conflicts with one, STOP and flag the conflict instead of improvising.
2. `docs/Eldrathor_Handoff_Doc.md` — project state, architecture, priorities.
3. `docs/Worldvein_Lore.md` — world canon.
§9 of the design doc lists what's intentionally OPEN. Don't fill open design gaps with inventions — implement placeholders and flag them.

## Hard rules (from the design doc's NEVER list)
- No pay-to-win, no gacha power, no prestige/reset mechanics, no stat rerolls.
- No character movement — ALL interaction is UI/tap.
- Combat auto-resolves; the player never taps attacks. Interactivity = map traversal.
- Single currency: Worldvein.
- Active abilities exist ONLY on class gems (weapons = stats only; armor gems = passive only).
- Weapons DROP (+ merge as growth); armor is CRAFTED only (never drops).

## Art direction
- Master rule: WARM/sunlit = reality (Town, town functions, Characters, Player screens). COLD/dark Mythros-blue = Vein projection (World map, Expedition map, Combat).
- Fantasy, not sci-fi: Cinzel/Marcellus-class display fonts, jewel tones, carved/ornamented frames. No monospace/HUD fonts, no neon circuit aesthetics.
- Reference mockups: `mockups/town_mockup_v3.html` (warm pole), `mockups/worldmap_mockup.html` (cold pole).
- Nav: 5-tab bar (Town · Party · [World glowing center orb] · Market · Binder), constant dark blue on every screen.

## Code conventions
- App lives in `app/` (Vite + React, JavaScript). Keep it runnable with `npm run dev` at all times.
- Mobile-portrait-first (390×844 target). No browser storage APIs in artifacts/components that must run in claude.ai.
- Prefer simple readable React state over frameworks/libraries; no new dependencies without a stated reason.
- The current prototype's row-based map is SUPERSEDED — the territory model (design doc §8c) is the spec: pannable organic node web, fog of war, hidden node types, respawns + named variants, roaming rares warding the boss, extraction = fresh map.

## Current priorities (from the handoff doc)
1. Rebuild the expedition map to the territory model (§8c).
2. Combat screen v2: battle stage + visibly-firing special buttons + scrolling feed + swingy resolver + speed toggle.
3. Playtest & tune (fight lengths, respawn cadence, named rate, map size).
4. Growth spend screens: weapon merging, gem trees, Veinbinder Bond/Craft trees.
5. Art direction decision + style bible (pixel vs painterly — undecided; don't commit assets to either yet).

## Workflow
- Design decisions happen in the owner's main Claude chat and land in the design doc. Cowork/Code executes.
- When a design question arises mid-build, implement the smallest reasonable placeholder, comment it `// DESIGN-OPEN:`, and surface it in your summary — do not decide game design unilaterally.

## Git workflow
This project is backed by a **private GitHub repo** (`eldrathor`). It can be worked on from multiple locations, so treat git as the sync mechanism:
- **Always `git pull` before starting work** — another machine/session may have pushed changes. Start from the latest.
- **Commit in logical chunks with clear messages** — describe what changed and why (e.g. `Rebuild expedition map to territory model (§8c)`), not `wip` or `stuff`.
- **Push when a task completes** (`git push`) so the work is backed up and available at your other locations.
- `node_modules/` and `dist/` are gitignored — after cloning on a new machine, run `npm install` inside `app/` before `npm run dev`.
- If a pull reports conflicts, stop and resolve them before continuing — don't force-push over someone else's work.
