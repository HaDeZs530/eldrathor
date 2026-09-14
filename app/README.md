# Eldrathor — app

Vite 8 + React 19 (JavaScript) single-page prototype of the Eldrathor iOS RPG. Design source of truth,
locks and briefs live in `../docs/` (start at `../docs/CLAUDE_HOME_HANDOFF.md`; project rules in `../CLAUDE.md`).

## Run

```bash
npm ci           # Node 24 — see .nvmrc / package.json "engines"
npm run dev      # http://localhost:5173
npm run dev:phone  # same, bound to every interface for a phone on the LAN / Tailscale (see ../docs/DEV_SETUP.md)
npm run build    # production bundle in dist/
npm test         # Node's built-in test runner — the tests are the spec (CLAUDE.md "Tests are the spec")
npm run lint
```

CI (`../.github/workflows/ci.yml`) runs `npm ci`, lint, build and tests on every pull request and on `main`.

## Layout

| Path | What |
|---|---|
| `src/AppRoot.jsx` | App shell: tabs, run state machine (island → rally → route → fight / results / sanctuary), save snapshots, AFK reconcile loop |
| `src/data.js` | Archetypes, weapons, areas (Island Areas Lock), archetype seeds, ids |
| `src/combat/` | `derive.js` (stats from seeds + equipment), `simulate.js` (auto-resolver, innates, auras), `enemies.js` (tiers + tuning), `rewards.js` (Worldvein + loot), `balance.test.js` (§8 gates) |
| `src/progression/` | Progression Loop Lock formulas: rarity ladder, XP, equipment, empowerment, armor, crit |
| `src/map/` | Route map: `genTerritory.js` (planar outward web), `routeState.js`, `RouteMapScreen.jsx`, `camera.js` + `cameraController.js`, `biomeStamps.jsx`, `parchment.css` |
| `src/components/` | Screens (Town, Party, Player, Seam/AFK, Island, Rally, Fight, Results, Sanctuary), `ui/` (Style Bible chrome: Frame, Header, Panel, buttons, Bar, DestinationRow, PartyCard, Sheet), `shell/` (menu / help / settings / offline sheets) |
| `src/theme/` | `styleBible.js` (the lock's tokens), `world.css` / `hub.css` / `mind.css` (the three modes), `ThemeProvider.jsx`, `modeSwitch.js` |
| `src/art/` | `manifest.js` (every art file: size, transparency), `Art.jsx` (PNG or labelled placeholder), `useArt.js` |
| `src/afkRuntime.js` | AFK jobs as true idle: timestamped accrual, exhaustion, suspend / resume, offline summary |
| `src/save/save.js` | Versioned save (`eldrathor.save.v1` key, `SAVE_VERSION`), migrations, quarantine, export / import, counted RNG |
| `src/debug/trace.js` | Playtest debug trace (☰ → Debug trace); auto-saves to `playtest-traces/` through the dev server (`vite.config.js`) — `../docs/DEBUG_TRACE.md` |
| `public/art/` | Art manifest files (`../docs/Eldrathor_Style_Bible_Lock.md` §B); `public/maps/` legacy island art |
| `art-src/` | Full-resolution originals (not served) |

## Conventions

- Mobile-portrait-first (390×844). No new dependencies without a reason.
- Never invent economy numbers, mechanics or names — placeholder + `// DESIGN-OPEN:`.
- Every brief that sets a number ships with a unit test asserting it; balance targets are enforced gates.
