# BRIEF — Pannable island map + hybrid parchment node map

**Status:** READY for Claude  
**Date:** 2026-09-11  
**Author:** Boss (Grok Bot)  
**Repo:** `HaDeZs530/eldrathor`  
**Branch suggestion:** `feat/pannable-island-node-map`

## Goal
1. Mountain island world map uses the approved landscape art as a **pannable + zoomable** background on portrait phones (start on harbor).
2. Location/node travel map uses **hybrid** chrome + **parchment / fog-of-war** feel with biome-appropriate stamps; Mythros forge reads as **interior rooms/hallways**.
3. Fight/loot stay full Mind-view. Don’t invent economy/mechanics.

## Read first
- `CLAUDE.md`
- `docs/AGENT_COORDINATION.md`
- `docs/Eldrathor_NodeMap_Art_Lock.md`
- `docs/Eldrathor_DualMode_Art_Lock.md`
- `docs/Eldrathor_TabBar_Lock.md`
- `docs/GROK_BOT_SESSION_LOG.md`
- Existing: `IslandWorldMap`, `TerritoryMap`, `App.jsx` stage machine, theme tokens

## Requirements

### A) Island world map (warm RPG)
- Add island art under e.g. `app/public/maps/island-world.png` (Anthony/Boss will drop the PNG if missing — use a clear placeholder path + README note until asset lands).
- Portrait-friendly viewport: **pan + pinch/wheel zoom** of the **full landscape** image. Do **not** hard-crop to 9:16.
- Initial camera: lower/south harbor.
- Overlay ~5–7 tappable world hotspots (approximate % OK; document them). Clockwise intent: harbor/Veinharbor, forest W1, peninsula town W2, cliffs W3, Mythros forge W4, castle W5, summit/Vaelyx.
- Tap → existing DifficultyScreen placeholder → then node map.
- Preserve run-stage persistence across tabs; tab bar stays visible.

### B) Location / node map (hybrid + parchment)
- Theme this stage **hybrid**, not pure Mind-view.
- Surface: aged parchment / hand-drawn route map + fog of war.
- Biome stamps: forest=trees, cliffs=cliffs, forge/temple=**walled rooms/hallways** as the party advances, peninsula town=placeholder (ruined coastal outpost stamps OK; mark DESIGN-OPEN).
- Keep procedural/node web behavior unless a tiny visual layer is enough for v1; full Canvas-of-Kings asset pack can be stubbed with CSS/canvas stamps.

### C) Docs touch
- Append a short DONE note to this brief when PR merges; Boss will also update session log after review.

## Out of scope
- Final Midjourney asset polish, Capacitor, combat v2, AFK rates, inventing peninsula lore.

## Success criteria
- [ ] Phone portrait: drag pans island; zoom works; harbor visible at start
- [ ] Hotspot opens difficulty → node map
- [ ] Node map reads parchment + fog; forge path feels interior
- [ ] Fight still Mind-view; themes crossfade
- [ ] Tab switch mid-run restores stage
- [ ] `npm run dev` works; PR has summary + test plan

## Asset note
Boss has a candidate island PNG (castle summit, blue crystal, no dragon). If not in-repo yet, implement pan/zoom against a placeholder and list “drop `island-world.png`” in the PR.
