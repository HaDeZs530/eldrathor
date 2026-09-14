# ELDRATHOR — Project Handoff Doc
*Current through September 14, 2026 (PR #54). Companion to `Eldrathor_Design_Doc.md` (the design source of truth) and the lock docs listed in `CLAUDE.md` — anything contradicting a LOCKED section is wrong. Day-to-day queue: `CLAUDE_HOME_HANDOFF.md`.*

## 1. Game Concept (one paragraph)
Eldrathor is a UI-based iOS RPG (no character movement — all interaction through interface). The player is a **Veinbinder** who recruits and bonds a party of 3 **Adventurers**, then remotely directs their expeditions up a Worldvein-saturated mountain from the harbor town of **Veinharbor**. Core loop: enter a procedurally generated fog-of-war route map → explore node to node → auto-resolving fights (watched, not tapped) → harvest Worldvein + loot → extract/die/kill boss (map resets fresh) → spend the harvest on permanent growth → re-enter stronger. Tone: hopeful frontier boomtown, glory-forward. Anti-pay-to-win, anti-grind-wall, phone-light. Full detail: design doc §1–§5.

## 2. Tech Stack
- **Now:** Vite 8 + React 19 (JavaScript, not TS), single-page app, no UI framework, no backend (client-side state with a versioned localStorage save). Node 24 (`app/.nvmrc`). Tests: Node's built-in runner (`npm test`). CI: GitHub Actions (`.github/workflows/ci.yml`) — lint, build, tests on every PR and on `main`.
- **Dev environment:** Windows, repo `C:\Users\tosie\Documents\GitHub\eldrathor` (GitHub `HaDeZs530/eldrathor`). App in `app/`. Claude Code (Desktop app, Code tab) is the build/run agent; git is the sync mechanism (`docs/DEV_SETUP.md`). Phone playtests: `npm run dev:phone` over LAN / Tailscale; the in-app debug trace auto-saves to `app/playtest-traces/` (`docs/DEBUG_TRACE.md`).
- **Later:** Capacitor wrap for iOS (Mac + Xcode + Apple Developer account at publish time). Long-term server-authoritative backend (market, persistence, anti-cheat) — not started.
- **Art:** `docs/Eldrathor_Style_Bible_Lock.md` is the production spec (tokens per mode + asset manifest). Art files drop into `app/public/art/` per `app/src/art/manifest.js`; every missing file shows a labelled placeholder in the app. ChatGPT produces the illustrations from Anthony-approved concepts; Grok supplies candidates; PixelLab MCP (PC-only) is available for pixel work.

## 3. Current Architecture (what exists in code — `app/src/`)
- **Shell — `AppRoot.jsx`.** Five tabs **Player · Party · Mountain · Town · Seam** (`components/TabBar.jsx`; Seam = AFK, name OPEN). The Mountain tab holds the run state machine: `island` (`components/IslandWorldMap.jsx`, pan-only landscape art with the 10-pin dotted path) → `rally` (`components/RallyScreen.jsx`: lore, Explore, swap the three) → `route` (`map/RouteMapScreen.jsx`) → `fight` / `loot` / `sanctuary` as overlays above the mounted map. ☰ menu + ? help sheets on every screen (`components/shell/`).
- **Route map — `map/`.** `genTerritory.js` builds a planar outward web (30–45+ nodes, ≥4 loops, depth bands, boss = end of the road with degree 1, 2–3 roaming rares as optional hunts, 2–4 sanctuaries). Three node states only (unexplored rune / revealed type icon / completed dot); tapping never moves the party — the cards under the map (Explore / Fight / Flee / Use / ambush) carry every commitment. **No respawns, no boss seal:** rares roam on scout/clear actions and may ambush; the boss is always fightable. One-tap travel along the polyline (900 ms/hop, tap to skip) with a single JS camera owner (`cameraController.js`, pan-to-centre 900 ms, never a snap). Fog is a pre-rendered canvas bitmap; the sheet is parchment/biome/fog with ink-dotted paths; gold ring party marker.
- **Combat — `combat/`.** `derive.js` turns archetype seeds × level × equipped weapon item × body armor into stats (crit gem term additive). `simulate.js` auto-resolves a fight into an event script (innates, auras, boss enrage, Aegis taunt, Attune Vein) that `components/FightScreen.jsx` plays back with 1×/2×/Skip. `enemies.js` holds tier scaling + `ENEMY_TUNING` (boss ×22 hp / ×20 dmg, set by the §8 gates in `balance.test.js`). `rewards.js` rolls Worldvein + loot on the five-rung rarity ladder.
- **Progression — `progression/progression.js`** (Progression Loop Lock §2–§5): rarity ladder Common·Fine·Rare·Epic·Legendary, band-by-tier loot roll, fight XP split with the fallen at half, `xpToNext`, Train XP, weapon damage multiplier (immutable `baseRating` + `empower` 0–100), empowerment gain/cost, armor bonus, additive crit, starter weapons.
- **Town — `components/TownScreen.jsx`** (Veinharbor): hero + four destination rows → Party tab, Crafter (armor recipes per tier from infused mats), Smith (empowerment bench: target + fodder + preview), Market (sell mats at a floor, armor, scrap weapons; equipped gear protected).
- **Party — `components/PartyScreen.jsx`:** stats from equipment, weapon/armor pick with a swap diff, name validation, no archetype editing, "Coming — not yet active" tags; recruit creation.
- **AFK — `afkRuntime.js` + `components/AfkScreen.jsx`:** Gather (3 slots) / Process / Train as **true idle** — timestamped accrual reconciled on tick, resume and open; exhaustion stops cleanly; deploy suspends, return resumes; Offline summary sheet after > 60 s.
- **Save — `save/save.js`:** `eldrathor.save.v1` key, `SAVE_VERSION` 2, migrations, quarantine of corrupt/newer saves, export/import/reset (Menu → Settings), counted RNG so a run resumes on the exact stream; the active run is saved (map, node states, run party, per-id HP, log, camera, seed).
- **Theme — `theme/`:** `styleBible.js` (the lock's tokens, tested), `world.css` (Veinharbor), `hub.css` (frame, tab bar, Exploration column), `mind.css` (Mind View); `ThemeProvider.jsx` + `modeSwitch.js` for the WORLD ⇄ MIND crossfade. Shared chrome in `components/ui/`.
- **Debug — `debug/trace.js`:** playtest trace (1500-event ring, build hash, run-start snapshot), auto-uploaded to the dev server's hardened receiver (`vite.config.js`).
- **Tests (the spec):** `npm test` — style bible tokens, art manifest, progression formulas, derive, balance gates, simulator, enemies, territory generator, camera + controller, mode switch, AFK runtime, town layout, save, trace receiver.

## 4. Key Decisions Made (the ones that shape code)
1. **Map = planar outward web, three node states, explore/cancel model** (RouteMap v2/v3 locks + 2026-09-13 explore model). Tapping never moves the party; the card does. Boss is the end of the road and never sealed; rares are optional hunts that roam and can ambush. **No respawns.**
2. **Extraction = fresh map** (roguelite). Only app-close freezes a run (and it resumes in place from the save). Death keeps banked Worldvein.
3. **Combat auto-resolves, watchable:** enemy stage + party cards + speed + feed, short fights; the fielded party is frozen per run.
4. **Character stack:** 5 permanent archetypes (innate + aura) × class gems (later) × 8 weapons (stats only) × crafted body armor. Archetype is never editable.
5. **Growth (Progression Loop Lock):** character XP from fights (split, fallen at half) and Train (flat, no catch-up); weapons DROP with an immutable rating and grow only by empowerment (fodder + Worldvein); armor is CRAFTED only; five-rung rarity ladder everywhere (Mythic retired).
6. **Single currency: Worldvein.** No gacha, no pay-for-power, no prestige resets, no stat rerolls.
7. **UI:** persistent 5-tab bar **Player · Party · Mountain · Town · Seam** (Market lives under Town; tab bar stays during runs). Three Style Bible modes: Veinharbor (Town/Party/Player/Seam), Exploration (parchment), Mind View (fight/results/cards). Cinzel display, system UI body.
8. **Camera:** never auto-centre or snap — every move is an eased pan (900 ms) from the exact current position; one owner.
9. **Balance is a test:** fresh L1 party loses the area-1 boss and wins trash; a L5 Fine-geared party beats the boss (`balance.test.js`).
10. **World structure:** Veinharbor → nine areas (Island Areas Lock, pins 2–10) → Worldforge summit. Area 1 (Gullwatch Trail) is the Milestone-1 real area.

## 5. Next Things To Do
1. **Art drops** per the Style Bible manifest (`app/public/art/`): island map, parchment + fog tiles, nine biomes, node icons, party ring, enemy stages, portraits, innate/aura/tab icons; regenerate the five Town PNGs at the §B sizes.
2. **Design Chat lock amendments** flagged by the M1 PRs: Combat v2 §4 boss multipliers (now ×22/×20), Style Bible header (no hub sub-label) and tab bar (no centre bump), icon-innate count, DESIGN-OPEN placeholders (starter weapon rating 30, recruit starters, Epic/Legendary recipes, material floor price, AFK rates).
3. **Playtest area 1 end to end on the phone** with the debug trace: run length vs 15–30 min sittings, boss wall feel, Smith/Crafter loop, Offline summary.
4. **Milestone 2 candidates** (Design Chat decides): class gems / gem trees, Veinbinder Bond & Craft trees, Player tab content, armor sockets, enemy roster per area, Vaelyx summit encounter.
5. **Platform:** Capacitor iOS wrap once the loop is stable; backend design when the market needs it.

## 6. Working Conventions
- Design decisions live in the Claude Design Chat + the lock docs; Claude Code implements briefs from `docs/CLAUDE_BRIEFS/` (done ones move to `_archive/`). Don't invent mechanics — placeholder + `// DESIGN-OPEN:` and flag conflicts.
- Every PR: branch → build + tests (+ CI) → squash-merge → brief DONE, handoff + session log updated.
- Player-role name "Veinbinder"; hub = Veinharbor; world = Eldrathor; dragon = Vaelyx.
