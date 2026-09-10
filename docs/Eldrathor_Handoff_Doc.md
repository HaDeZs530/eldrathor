# ELDRATHOR — Project Handoff Doc
*Current through September 10, 2026. Companion to `Eldrathor_Design_Doc.md` (the design source of truth — anything contradicting a LOCKED section there is wrong).*

## 1. Game Concept (one paragraph)
Eldrathor is a UI-based iOS RPG (no character movement — all interaction through interface). The player is a **Veinbinder** who recruits and bonds a party of 3 **Adventurers**, then remotely directs their expeditions up a Worldvein-saturated mountain from the harbor town of **Veinharbor**. Core loop: enter a procedurally generated fog-of-war territory map → explore node to node → auto-resolving fights (watched, not tapped) → harvest Worldvein + loot → extract/die/kill boss (map resets fresh) → spend the harvest on permanent growth → re-enter stronger. Tone: hopeful frontier boomtown, glory-forward. Anti-pay-to-win, anti-grind-wall, phone-light. Full detail: design doc §1–§5.

## 2. Tech Stack
- **Now:** Vite 8 + React 19 (JavaScript, not TS), single-page app. Plain inline styles/CSS, no UI framework. No backend yet (all client-side state).
- **Dev environment:** Windows, project at `C:\Users\tosie\Claude\Eldrathor` (git repo, GitHub `HaDeZs530/eldrathor`). App scaffold lives in `app/`. Node installed. Claude Code (Desktop app, Code tab) is the build/run agent. Can also be worked on from other machines/sessions — treat git as the sync mechanism (pull before work, push on completion; see `DEV_SETUP.md`).
- **Later:** wrap with **Capacitor** for iOS App Store deployment (requires Mac + Xcode + Apple Developer account at publish time). Long-term needs a server-authoritative backend (market, persistence, anti-cheat) — not started, not designed.
- **Art tooling:** PixelLab MCP connector (pixel art, ≤400×400, async job model) — **PC-only; it is NOT available in cloud/web sessions**, so WORLD-mode pixel assets must run from the local PC. Painterly/refined tools for MIND VIEW assets under consideration.
- **Art direction (LOCKED 2026-09-10):** **dual-mode, not either/or.** WORLD (town/planning/hub) = fun micro-pixel, warm/sunlit. MIND VIEW (world map / expedition / combat) = refined fantasy-sim + Mythros-blue magic aura — diegetic Vein projection, not a second physical place. Mode switch on enter/leave mind view must feel intentional. See design doc §3c.

## 3. Current Architecture (what exists in code)
- **Modular rebuild in progress on `feat/dual-mode-territory-map`** (Boss / Grok Bot implementing):
  - `app/src/theme/` — dual UI kits + hub skins (`tokens.js`, `ThemeProvider.jsx`, `world.css`, `mind.css`, `hub.css`); WORLD ↔ MIND expedition mode + mind|mountain|rpg hub chrome.
  - `app/src/map/` — `genTerritory.js` (organic ~30–45 node web, fog of war, hidden types) + `TerritoryMap.jsx` (pannable Mind-view map).
  - `app/src/App.jsx` — harbor/party stay WORLD mode; entering expedition enters MIND mode + TerritoryMap; party/worlds/loot/combat `resolveFight` retained; extract/death still bank Worldvein.
- **SUPERSEDED:** the old single-file row-pyramid map in the prior App.jsx prototype. Do not restore row ascent.
- **Bottom tab bar (IN PROGRESS / landing on `feat/bottom-tab-bar`):** hub navigation per Anthony lock 2026-09-10 — Player · Party · Mountain (center) · Town · Market; three hub theme families with CSS crossfade; Mountain owns world/expedition entry; Market is a top-level tab. See `docs/Eldrathor_TabBar_Lock.md`.
- **HTML mockups (standalone, no build):** `town_mockup.html` (v1), `_v2`, `_v3` (v3 = current: ~21% harbor header, carved-wood sign bars w/ Cinzel, 5-tab bar with centered glowing World orb, constant dark-blue nav) and `worldmap_mockup.html` (cold Mythros projection, 3/4 mountain, clockwise crystal spiral, cleared/current/locked/summit states).
- **Claude Design outputs:** expedition map + combat screen concepts (Chakra Petch/neon aesthetic — being re-skinned per the warm/cold + dual-mode fantasy direction, design doc §3c).
- No save system, no backend, no finished art assets yet.

## 4. Key Decisions Made (the ones that shape code)
1. **Map = territory, not route** (§8c): 30–45+ node organic web, pannable, fog of war (clearing reveals neighbors), node types hidden until entered, entrance/exit compass geography per world, clusters/quiet-trails/dead-ends texture, loops, long-edge curiosity nodes.
2. **Respawns behind you** + ~10% named rare variants with special loot; rares roam and ward the boss (kill all rares this run → boss unsealed).
3. **Extraction = fresh map** (roguelite). Only app-close freezes a run. Death keeps banked loot, no penalty.
4. **Combat auto-resolves but must be watchable spectacle**: top ⅓ battle visual, mid health+special buttons that visibly fire, bottom scrolling combat feed; short swingy fights (~10–20s), diegetic frame = Veinbinder telepathy.
5. **Character stack:** 5 permanent archetypes (personal + exclusive group innate) × 4 class gems (one ability; grant-if-crossing / amplify-if-matching, scaled by tree) × 8 weapons (stats only: tempo/damage/mitigation) × armor (Heavy/Med/Light).
6. **Growth fuels are distinct:** character XP = fighting/idle; weapon trees = weapon use; gathering = AFK player-bound; gem trees = Worldvein spend; Veinbinder trees (Bond = party stats, Craft = economy passives) = Worldvein spend.
7. **Gear split:** weapons DROP (1–100 rating + EQ-style merging: feed weapons + Worldvein into your main weapon); armor is CRAFTED only (material tiers from higher-world gathering, craft rolls rating, socket every 2 qualities, passive armor gems drop from bosses/rares).
8. **Single currency: Worldvein.** No gacha, no pay-for-power, no prestige resets, no stat rerolls.
9. **UI:** persistent 5-tab bottom bar **Player · Party · Mountain (center) · Town · Market** (LOCKED 2026-09-10 — Market is its own tab; supersedes Market-inside-Town). Hub chrome skins: mind / mountain-hybrid / warm RPG with crossfade transitions (§3b). Expedition dual-mode WORLD↔MIND still applies (§3c). Bottom bar hidden on active expedition/combat.
10. **World structure:** Veinharbor hub → W1 Shoreline Forest → W2 Peninsula Town → W3 Ravine Path → W4 Forge (4 wings/4 bosses) → W5 Upper Castle (3 boss nodes) → Summit (Vaelyx, recurring). Permanent unlocks; every world fully grindable.

## 5. Next Things To Do
1. **Bottom tab bar + hub skins (IN PROGRESS — Boss/Grok Bot):** 5-tab lock (Player·Party·Mountain·Town·Market), theme crossfades, Mountain owns world select; hide bar on expedition.
2. **Territory map + dual UI kit (CONTINUE):** organic fog-of-war node web, WORLD↔MIND theme switch on expedition enter/leave. Core-loop validation build. Still TODO after v1: respawn polish, roaming rares/named variants, boss seal UX polish.
3. **Build the combat screen v2** per the eye-candy spec: battle stage (top ⅓), per-character health + special buttons that visibly auto-fire, scrolling combat feed, swingy resolver (crits/spikes/heal saves), 1×/2×/skip speed toggle, detailed results screen — all in MIND VIEW theme.
4. **Playtest the loop and tune** fight lengths, respawn cadence (~every 3–4 node-actions), named-spawn rate (~10%), map size vs 15–30 min sittings. Feed findings back into the design doc.
5. **Design + implement the growth spend screens** (minimum viable): weapon merging UI, gem tree (buy nodes w/ Worldvein), Veinbinder Bond/Craft trees — so banked Worldvein has somewhere to go and the roguelite meta-loop closes (WORLD theme).
6. **Commission WORLD-mode micro-pixel assets + MIND VIEW refined chrome** (PixelLab for pixel kit on PC; refined fantasy for mind-view). Harbor header painting (~2400×2048, ¾ elevated, warm town / cold mountain) and style bible before batch production.

## 6. Working Conventions
- Design decisions live in the main Claude chat + `Eldrathor_Design_Doc.md`; Claude Code/Cowork / Boss / Grok Bot execute builds. Don't invent mechanics — flag conflicts against the design doc instead.
- Mockup-first workflow: cheap standalone HTML mockups → approval → real build (saves Claude Design tokens).
- Player-role name "Veinbinder" is frontrunner, not final. Hub = Veinharbor. World = Eldrathor. Dragon = Vaelyx.
