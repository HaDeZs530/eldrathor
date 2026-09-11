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
- Use **`app/public/maps/island-world.png`** (already in repo — landscape micro-pixel; harbor south, castle summit, blue crystal, no dragon).
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
**Landed:** `app/public/maps/island-world.png` (+ `app/public/maps/README.md`). Wire `/maps/island-world.png` in Vite public URL.

## Claude implementation notes (2026-09-11, branch `feat/pannable-island-node-map`)
- **Island:** `IslandWorldMap.jsx` — full landscape art in a pan/pinch/wheel-zoom viewport (zoom 1.0 = island fits height, start 1.4 centred on Veinharbor, max 3.5). 7 hotspots as % of the art — table in `app/public/maps/README.md`. Harbor pin opens the Town tab; world pins → DifficultyScreen → node map. Locked worlds show a ✕ pin (tap ignored).
- **Node map:** `map/TerritoryMap.jsx` + `map/biomeStamps.jsx` + `map/parchment.css` — hybrid mountain chrome around a parchment sheet with an SVG fog-of-war mask (revealed nodes punch soft holes; unexplored = blank parchment + mist). Outdoor biomes scatter seeded ink stamps (forest=pines/oaks, cliffs=ridges, summit=shards, peninsula=broken pier + collapsed roof **DESIGN-OPEN**). Forge/castle render as **interior**: each revealed node is a walled room, edges are walled hallways that run off into the fog; castle adds crenellations, forge adds a brazier mark.
- **Theme ladder:** `AppRoot.jsx` — only `fight`/`loot` stages enter Mind-view now; the node map stays WORLD mode + `hub-mountain` (hybrid). Existing ThemeProvider crossfade covers the switch.
- **Not touched:** economy, generator behaviour (`genTerritory.js`), combat, AFK.
- **Flagged:** `island-world.png` is JPEG bytes with a .png name (renders fine).
