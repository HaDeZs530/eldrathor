# Eldrathor — Grok Bot / Boss Session Log (transferable)

*Living handoff for Claude Code, Cowork, or any other chat. Append dated entries; do not delete LOCKED decisions. Design SoT remains `docs/Eldrathor_Design_Doc.md`. Agent rules: `CLAUDE.md`.*

**Owner:** Anthony (HaDeZs530) · **Repo:** https://github.com/HaDeZs530/eldrathor · **Assistant:** Boss (Grok Bot)

---

## How to use this file
1. Read `CLAUDE.md` + this log + `docs/Eldrathor_TabBar_Lock.md` + latest handoff.
2. Never contradict LOCKED sections in the design doc unless this log explicitly records a superseding lock with date.
3. Prefer GitHub as sync hub. Local clone (TonyWork): `C:\Users\tosie\OneDrive\Documents\GitHub\eldrathor`. On that machine use `npm.cmd` (PowerShell blocks `npm.ps1`).

---

## Project snapshot (what the game is)
UI-based iOS RPG (Vite + React now; Capacitor later). Player is a **Veinbinder** in **Veinharbor** who bonds **3 Adventurers** and directs expeditions up a Worldvein-saturated mountain. No character movement — all UI/tap. Combat auto-resolves (watchable). Single currency: **Worldvein**. Extract/death banks loot; map resets (roguelite). Growth between runs via Worldvein sinks (mostly unbuilt).

**Dual art modes (LOCKED 2026-09-10):**
- **WORLD / warm RPG:** Town, Market (and physical hub) — fun micro-pixel / warm RPG coloration.
- **MIND VIEW / mana:** Player, Party, expedition map, combat — refined fantasy + Mythros-blue aura (Veinbinder seeing through the bond in his head — diegetic, not a second place).
- **Mountain hub skin:** hybrid between the two.
- Tab theme changes must **crossfade**, never snap.

---

## LOCKED — Bottom tab bar (2026-09-10, supersedes older §3b 4-tab + “Market inside Town”)
Persistent 5-tab bar, left → right:
1. **Player** — Mind-view UI  
2. **Party** — Mind-view UI  
3. **Mountain** (center, emphasized) — hybrid look; island/world select  
4. **Town** — warm RPG  
5. **Market** — warm RPG (own tab)

Authoritative short lock: `docs/Eldrathor_TabBar_Lock.md`. Design doc §3b full rewrite still pending (MCP size limits); treat TabBar_Lock + this log as nav SoT until §3b is patched.

**Hub skins:** `mind` (Player/Party) · `mountain` (Mountain) · `rpg` (Town/Market) · ~380ms CSS crossfade.

Shipped in **PR #2** (merged).

---

## LOCKED — Mountain / run flow (Anthony 2026-09-10; screens-first priority)
1. **Mountain tab → Island world map** — whole island, **5–7 world/level nodes**.  
2. Tap world → **Difficulty screen** (placeholder for now; hold full difficulty design).  
3. Confirm → **Expedition territory map** — theme transitions RPG → **Mind-view / mana**; procedural fog-of-war nodes (§8c).  
4. Tap node → **Fight screen** (Mind-view).  
5. **Run stage persistence:** switching tabs (e.g. Town) then returning must restore the **current stage** (island / difficulty / expedition / **active fight** / **loot results** if fight finished). Do not wipe the run.  
6. Keep **tab bar visible during runs AND fights** so Town/Market/Party/Player remain reachable mid-run / while fights auto-resolve; Mountain returns to the **exact** stage (island / difficulty / expedition / **active fight in progress** / loot if fight finished). Do **not** hide the tab bar on fight screens.

Priority: get important screens **looking proper**; start with island world map.

---

## LOCKED — Player / Party hub screens (Anthony 2026-09-10)
**Player tab (Mind-view):** top = Veinbinder base stats; below (scroll) = growth / purchasable upgrade placeholders. Economy costs **not locked** — show stubs / `???` (DESIGN-OPEN).

**Party tab (Mind-view):** top = party-of-3 list box; below = extra roster characters + **Create new character** button. Tap party or roster member → detail screen shaped like Player (stats top, purchasable upgrades below).

Shipped as real layouts (not empty “coming soon”) in PR #3 with stub stats/upgrade rows.

## Shipped PRs
| PR | Status | What |
|----|--------|------|
| [#1](https://github.com/HaDeZs530/eldrathor/pull/1) | Merged | Dual-mode themes scaffold, territory map v1 (graph fog-of-war), design doc dual-mode lock + restore |
| [#2](https://github.com/HaDeZs530/eldrathor/pull/2) | Merged | 5-tab bar, hub skins + crossfade, Mountain/Town/Party wiring, placeholders Player/Market |
| [#3](https://github.com/HaDeZs530/eldrathor/pull/3) | Open | Island world map + difficulty + Mind-view expedition + fight/loot; run persistence; TabBar visible mid-fight; Player/Party Mind-view layouts |

---

## Code map (post PR #3)
- `app/src/theme/` — tokens, ThemeProvider, world.css, mind.css, hub.css  
- `app/src/map/` — `genTerritory.js`, `TerritoryMap.jsx`  
- `app/src/components/TabBar.jsx`, `HarborViews.jsx`, `IslandWorldMap.jsx`, `DifficultyScreen.jsx`, `FightScreen.jsx`, `LootResults.jsx`, `PlayerScreen.jsx`, `PartyScreen.jsx`  
- `app/src/combat.js`, `data.js`, `App.jsx` (run stage machine: island | difficulty | expedition | fight | loot)  
- Portrait frame ~390×844  

---

## Still TODO / DESIGN-OPEN (high signal)
- Difficulty system (Hard/Brutal + modifiers) — placeholder only shipped  
- Territory map polish: respawns, ~10% named rares, roaming rares + boss seal (§8c)  
- Combat screen v2 polish (special buttons spectacle beyond vertical slice)  
- Market / Town function screens (Player/Party layouts shipped; economy DESIGN-OPEN)  
- Growth spend (weapon merge, gem trees, Veinbinder trees)  
- Vaelyx summit encounter design (node shipped on island map)  
- Design doc §3b rewrite to match TabBar lock; clean `docs/_restore_b64/` leftovers  
- Art asset pipeline (hands-off; dual kits)  
- Capacitor iOS later  

§9 of the design doc lists intentional open design systems (gem tree contents, world enemy rosters, etc.) — those are not “missing file,” they are undesigned content.

---

## Working agreements with Anthony
- Go **slow**; he is newer to GitHub/dev workflow. One step at a time when guiding him.  
- **Hands-off** asset/UI pipeline preference: he gives light direction; assistant implements.  
- May use Claude for design historically; **does not need Claude** for design going forward — Boss can own design discussion and land locks in docs.  
- When on **phone**, assistant handles git end-to-end (branch, push, PR); he merges on GitHub mobile.  
- TonyWork: Node/npm/Git already installed; use `npm.cmd`.  
- Transferability: **keep this log updated** whenever locks or major builds land.

---

## Chronology (2026-09-10)
1. Connected GitHub; reviewed `HaDeZs530/eldrathor` (Vite/React prototype, Claude-authored docs).  
2. Cloud Agents not on plan — work via GitHub MCP + TonyWork.  
3. Locked dual graphical modes (world micro-pixel vs mind-view blue aura).  
4. PR #1: themes + territory map v1; design doc restore via TonyWork after MCP truncation.  
5. Guided local `npm.cmd install` / `npm run dev` playtest path.  
6. Nav review: app had no bottom bar; locked 5-tab + theme crossfades.  
7. PR #2: tab bar shipped and merged.  
8. Next priority: screens look proper — **island world map first**, then difficulty → expedition → fight with tab persistence.  
9. This session log created for Claude transfer.  
10. **LOCKED (Anthony clarify):** bottom TabBar stays **VISIBLE during expeditions AND fights** so players can do hub things (Town/Market/Party/Player) while waiting for fights to resolve. Returning to Mountain restores exact run stage (expedition / active fight in progress / loot if fight finished). Do **not** hide tab bar on fight screens. Supersedes PR#2 hide-on-expedition behavior and older TabBar_Lock “prefer hidden” line.  
11. PR #3: IslandWorldMap (6 nodes incl. Vaelyx summit) → Difficulty placeholder → Mind-view TerritoryMap → FightScreen (visible) → LootResults; run stage machine persisted across tabs.
12. **LOCKED:** Player/Party Mind-view hub layouts (stats top + upgrade stubs; party-of-3 + roster + create + member detail). Included in PR #3.

---

*Last updated: 2026-09-10 by Boss (Grok Bot) — island map flow + TabBar-visible-during-fights + Player/Party hub locks.*
