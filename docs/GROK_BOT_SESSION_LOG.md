# Grok Bot / Boss — Session Log (Eldrathor)

**Purpose:** Transferable memory so Claude Code (or any other agent) can pick up without re-deriving locks from chat. Update this file when locks change or major milestones land.

**Repo:** `HaDeZs530/eldrathor` · Prototype: Vite + React under `app/`

---

## Source of truth
1. `docs/Eldrathor_Design_Doc.md` — game design (keep in sync with locks below when they supersede §3b).
2. `docs/Eldrathor_DualMode_Art_Lock.md` — dual graphical modes.
3. `docs/Eldrathor_TabBar_Lock.md` — 5-tab nav + theme crossfades (**UPDATED:** TabBar stays visible in expeditions/fights).
4. **This file** — chronological locks + “what shipped” that may not yet be fully rewritten into the design doc.

---

## LOCKED (do not reverse without Anthony)

### Dual graphical modes
- **World-view:** micro-pixel, dense, Eternal Hero–adjacent (harbor / island / overworld travel).
- **Mind-view:** blue aura / ethereal (Player, Party, expedition territory, combat, loot).
- Crossfade on tab change when mode switches; **no-op** if already in target mode.

### Bottom TabBar (5 tabs)
Order: **Town | Market | Mountain | Party | Player**.
- **Mountain** = island / expedition entry (world-view map → difficulty → mind-view run).
- TabBar stays **VISIBLE during expeditions AND fights**. Players can visit Town/Market/Party/Player while a fight resolves. Returning to Mountain restores exact run stage (incl. mid-fight / loot).
- Do **not** hide TabBar on fight screens. (Supersedes older “prefer hidden on expedition” wording.)

### Island → run flow (PR #3)
1. Island world map (not a button list) — nodes include Vaelyx summit.
2. Difficulty placeholder (Hard/Brutal + modifiers later).
3. Mind-view expedition (TerritoryMap).
4. Visible fight screen → loot results.
5. Run stage machine: `island | difficulty | expedition | fight | loot` — persisted across tab switches; fight timers survive.

### Player / Party hub (Mind-view)
- **Player:** stats top + scrollable upgrade stubs; Eternal Hero–style **gear paperdoll** (central silhouette + surrounding slots).
- **Party:** bonded-3 + roster + create + member detail like Player (incl. paperdoll).
- Dressable art later; slots are placeholders.

### Gear paperdoll (LOCKED UI shape; acquisition DESIGN-OPEN)
- Layout: central silhouette + surrounding gear/gem slots on Adventurer detail (+ Player).
- **Acquisition path not locked yet** — see DESIGN-OPEN AFK section below. Do not hard-code “gear from expedition loot only” until Boss confirms after design review.

---

## DESIGN-OPEN — AFK farm → materials → craft (Anthony 2026-09-10 note; NOT locked yet)
Anthony flagged we missed **AFK farm mode**: intent is gear comes from **AFK groups farming crafting materials → craft items** (not primarily from expedition drops for armor; weapons still drop per design). Full design understanding needed before locking acquisition UI. **Do not change gear locks in code until Boss confirms after design review.** Keep gear/paperdoll slots as flexible placeholders. Expedition loot stubs may remain until this lands.

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
- **AFK farm mode + materials → craft pipeline** (design review first; then UI locks)

§9 of the design doc lists intentional open design systems (gem tree contents, world enemy rosters, etc.) — those are not “missing file,” they are undesigned content.

---

## Code map (post PR #3)
- `app/src/theme/` — tokens, ThemeProvider, world.css, mind.css, hub.css  
- `app/src/map/` — `genTerritory.js`, `TerritoryMap.jsx`  
- `app/src/components/TabBar.jsx`, `HarborViews.jsx`, `IslandWorldMap.jsx`, `DifficultyScreen.jsx`, `FightScreen.jsx`, `LootResults.jsx`, `PlayerScreen.jsx`, `PartyScreen.jsx`, `GearPaperdoll.jsx`  
- `app/src/combat.js`, `data.js`, `App.jsx` (run stage machine: island | difficulty | expedition | fight | loot)  
- Portrait frame ~390×844  

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
13. **LOCKED addendum:** Adventurer detail (and Player) include Eternal Hero–style gear paperdoll — central silhouette + surrounding gear/gem slots; dressable art later.
14. Anthony note (DESIGN-OPEN, not locked): AFK farm mode — AFK groups farm crafting materials → craft items for gear. Full design review before changing acquisition UI/locks.

---

*Last updated: 2026-09-10 by Boss (Grok Bot) — island PR + AFK/craft DESIGN-OPEN note (gear acquisition not relocked).*
