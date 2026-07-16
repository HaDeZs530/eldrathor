# ELDRATHOR — Project Handoff Doc
*Current through July 2026. Companion to `Eldrathor_Design_Doc.md` (the design source of truth — anything contradicting a LOCKED section there is wrong).*

## 1. Game Concept (one paragraph)
Eldrathor is a UI-based iOS RPG (no character movement — all interaction through interface). The player is a **Veinbinder** who recruits and bonds a party of 3 **Adventurers**, then remotely directs their expeditions up a Worldvein-saturated mountain from the harbor town of **Veinharbor**. Core loop: enter a procedurally generated fog-of-war territory map → explore node to node → auto-resolving fights (watched, not tapped) → harvest Worldvein + loot → extract/die/kill boss (map resets fresh) → spend the harvest on permanent growth → re-enter stronger. Tone: hopeful frontier boomtown, glory-forward. Anti-pay-to-win, anti-grind-wall, phone-light. Full detail: design doc §1–§5.

## 2. Tech Stack
- **Now:** Vite 8 + React 19 (JavaScript, not TS), single-page app. Plain inline styles/CSS, no UI framework. No backend yet (all client-side state).
- **Dev environment:** Windows, project at `C:\Users\tosie\Claude\Eldrathor` (git repo, GitHub `HaDeZs530/eldrathor`). App scaffold lives in `app/`. Node installed. Claude Code (Desktop app, Code tab) is the build/run agent. Can also be worked on from other machines/sessions — treat git as the sync mechanism (pull before work, push on completion; see `DEV_SETUP.md`).
- **Later:** wrap with **Capacitor** for iOS App Store deployment (requires Mac + Xcode + Apple Developer account at publish time). Long-term needs a server-authoritative backend (market, persistence, anti-cheat) — not started, not designed.
- **Art tooling:** PixelLab MCP connector (pixel art, ≤400×400, async job model) — **PC-only; it is NOT available in cloud/web sessions**, so pixel-art generation must run from the local PC. Painterly tools (Midjourney/Leonardo/Scenario) under consideration. **Art direction (pixel vs painterly) is UNDECIDED.**

## 3. Current Architecture (what exists in code)
- **`app/src/App.jsx`** — single-file React vertical slice of the OLD map model: harbor hub screen, party editor (5 archetypes, 8 weapons, stat calc), world select (5 worlds, unlock gating), row-based ascending node map (4 node types), tick-simulated auto-combat resolver, loot rolls (quality tiers + 1–100 rating), Worldvein banking, death = return home no penalty, extract mechanic. **The map model in this prototype is superseded** — it's a pyramid ascent; the locked design is now a sprawling fog-of-war territory (design doc §8c). Combat is also pre-"eye candy" (result-only, no blow-by-blow). Runnable with `npm run dev` from `app/`.
- **HTML mockups (standalone, no build):** `town_mockup.html` (v1), `_v2`, `_v3` (v3 = current: ~21% harbor header, carved-wood sign bars w/ Cinzel, 5-tab bar with centered glowing World orb, constant dark-blue nav) and `worldmap_mockup.html` (cold Mythros projection, 3/4 mountain, clockwise crystal spiral, cleared/current/locked/summit states).
- **Claude Design outputs:** expedition map + combat screen concepts (Chakra Petch/neon aesthetic — being re-skinned per the warm/cold fantasy direction, design doc §3c).
- Nothing else is built. No save system, no backend, no assets.

## 4. Key Decisions Made (the ones that shape code)
1. **Map = territory, not route** (§8c): 30–45+ node organic web, pannable, fog of war (clearing reveals neighbors), node types hidden until entered, entrance/exit compass geography per world, clusters/quiet-trails/dead-ends texture, loops, long-edge curiosity nodes.
2. **Respawns behind you** + ~10% named rare variants with special loot; rares roam and ward the boss (kill all rares this run → boss unsealed).
3. **Extraction = fresh map** (roguelite). Only app-close freezes a run. Death keeps banked loot, no penalty.
4. **Combat auto-resolves but must be watchable spectacle**: top ⅓ battle visual, mid health+special buttons that visibly fire, bottom scrolling combat feed; short swingy fights (~10–20s), diegetic frame = Veinbinder telepathy.
5. **Character stack:** 5 permanent archetypes (personal + exclusive group innate) × 4 class gems (one ability; grant-if-crossing / amplify-if-matching, scaled by tree) × 8 weapons (stats only: tempo/damage/mitigation) × armor (Heavy/Med/Light).
6. **Growth fuels are distinct:** character XP = fighting/idle; weapon trees = weapon use; gathering = AFK player-bound; gem trees = Worldvein spend; Veinbinder trees (Bond = party stats, Craft = economy passives) = Worldvein spend.
7. **Gear split:** weapons DROP (1–100 rating + EQ-style merging: feed weapons + Worldvein into your main weapon); armor is CRAFTED only (material tiers from higher-world gathering, craft rolls rating, socket every 2 qualities, passive armor gems drop from bosses/rares).
8. **Single currency: Worldvein.** No gacha, no pay-for-power, no prestige resets, no stat rerolls.
9. **UI:** 5-tab nav (Town·Party·[World center orb]·Market·Binder), Town = warm painted header + carved-wood function bars; **warm = reality (town/characters/player), cold Mythros-blue = Vein projection (world map/expedition/combat)** — the master art rule.
10. **World structure:** Veinharbor hub → W1 Shoreline Forest → W2 Peninsula Town → W3 Ravine Path → W4 Forge (4 wings/4 bosses) → W5 Upper Castle (3 boss nodes) → Summit (Vaelyx, recurring). Permanent unlocks; every world fully grindable.

## 5. Next 5 Things To Do
1. **Rebuild the prototype's map to the territory model** (§8c): sprawling pannable node web, fog of war, hidden node types, respawns + named variants, roaming rares warding the boss, extraction = fresh map. This is the core-loop validation build — the game lives or dies here.
2. **Build the combat screen v2** per the eye-candy spec: battle stage (top ⅓), per-character health + special buttons that visibly auto-fire, scrolling combat feed, swingy resolver (crits/spikes/heal saves), 1×/2×/skip speed toggle, detailed results screen.
3. **Playtest the loop and tune** fight lengths, respawn cadence (~every 3–4 node-actions), named-spawn rate (~10%), map size vs 15–30 min sittings. Feed findings back into the design doc.
4. **Design + implement the growth spend screens** (minimum viable): weapon merging UI, gem tree (buy nodes w/ Worldvein), Veinbinder Bond/Craft trees — so banked Worldvein has somewhere to go and the roguelite meta-loop closes.
5. **Decide the art direction** (pixel vs painterly) via targeted PixelLab tests — especially a glowing Mythros crystal — then commission the Veinharbor header painting (~2400×2048, ¾ elevated, warm town / cold mountain) and lock the style bible before batch asset production.

## 6. Working Conventions
- Design decisions live in the main Claude chat + `Eldrathor_Design_Doc.md`; Claude Code/Cowork executes builds. Don't invent mechanics — flag conflicts against the design doc instead.
- Mockup-first workflow: cheap standalone HTML mockups → approval → real build (saves Claude Design tokens).
- Player-role name "Veinbinder" is frontrunner, not final. Hub = Veinharbor. World = Eldrathor. Dragon = Vaelyx.
