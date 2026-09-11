# Grok Bot / Boss — Session Log (Eldrathor)

**Purpose:** Transferable memory so Claude (or any other agent) can pick up without re-deriving locks from chat. Update this file when locks change or major milestones land.

**Repo:** `HaDeZs530/eldrathor` · Prototype: Vite + React under `app/`

**Agent split (LOCKED 2026-09-11):** Boss = planning / management / image gen / briefs / session log. **Claude = all coding.** See `docs/AGENT_COORDINATION.md` + `docs/CLAUDE_BRIEFS/`.

---

## Source of truth
1. `docs/Eldrathor_Design_Doc.md` — game design (older bits may lag; prefer locks below when they conflict).
2. `docs/Eldrathor_DualMode_Art_Lock.md` — dual graphical modes.
3. `docs/Eldrathor_NodeMap_Art_Lock.md` — island / node-map theme ladder + parchment biomes.
4. `docs/Eldrathor_TabBar_Lock.md` — nav chrome (5th tab = AFK/Seam).
5. **`docs/Eldrathor_AFK_Town_Lock.md`** — **LOCKED 2026-09-11** AFK Gather/Process/Idle·Train + Town Crafter/Upgrade/Market.
6. `docs/AGENT_COORDINATION.md` + `docs/CLAUDE_BRIEFS/` — roles + active Claude tasks.
7. **This file** — chronology + cross-cutting locks.

---

## LOCKED (do not reverse without Anthony)

### Agent roles
- Boss (Grok Bot): plan, manage, lock design/art, generate image candidates, write Claude briefs, keep this log, help with GitHub review/merge on phone.
- Claude: implement all `app/` code from briefs. Do not invent LOCKED design.

### Dual graphical modes + Mountain ladder
- **World / warm RPG:** Town (and island world map).
- **Mind-view:** Player, Party, combat, loot, **AFK Gather** (and likely Idle/Train).
- **Mountain hub chrome:** hybrid.
- **Location/node travel map:** **hybrid** + parchment fog-of-war route feel (not full Mind-view).
- **Process theme:** OPEN (mind or slight forge glow for now).
- Crossfade on theme change; never snap.

### Node-map biomes (parchment)
- Forest → trees; cliffs → cliffs; Mythros forge/temple → **interior rooms/hallways with walls**; peninsula town → OPEN (ruined coastal outpost candidate).

### Island world map UX
- Landscape art OK on portrait via **pan + zoom**; start on south harbor. Prefer pan over hard crop.

### Bottom TabBar (5 tabs) — order LOCKED
**Player | Party | Mountain | Town | AFK-tab (Seam working label)**  
- **AFK-tab** replaces root **Market** (name OPEN).  
- **Market** = **Town sub-section**.  
- TabBar visible during expeditions/fights; AFK true idle (persistence DESIGN-OPEN). Mountain restores run stage.

### Island → run flow
Island map → difficulty placeholder → **hybrid parchment** node map → fight (Mind-view) → loot; stage machine persists across tabs.

### Player / Party (Mind-view)
Stats top + upgrades below; Eternal Hero paperdoll; Party = bonded 3 + roster + create + detail.

### Gear acquisition
- **Weapons** = mountain **drops** (+ Town Upgrade merge/empower).  
- **Armor** = Town **Crafter** from **AFK-processed** mats.

### AFK jobs (LOCKED)
Per parked character, pick one:
1. **Gather** — skill XP + raw mats (areas unlock with worlds).  
2. **Process** — skill XP + infused quality mats (Worldvein cost; mythic chase).  
3. **Idle / Train** — **character XP catch-up** (no mats); faster while behind roster top; soft-caps near top; Mountain remains best for XP+loot.

### Town
Crafter + Upgrade/smith + Market sub. No +1-tier craft gate. Excess armor → Worldvein.

### Currency
**Worldvein** on UI. Mythros = lore energy.

---

## Still TODO / DESIGN-OPEN
- AFK tab **final display name** (Seam is working label only)
- Hunt/Forage name; mat names; rates/slots/recipes; Idle catch-up curve numbers  
- Process panel art theme; AFK persistence/offline when app closed  
- Exact Market vendor stock UI under Town  
- Peninsula town parchment stamp language  
- Drop approved `island-world.png` into repo for Claude brief  
- Territory/combat polish; growth trees; Capacitor later  

---

## Chronology
- **2026-09-11:** AFK/Town lock merged in PR #4 (mid-write — Idle/Train missed). Follow-up adds Idle/Train. Doc: `Eldrathor_AFK_Town_Lock.md`.
- **2026-09-11:** Shipped base UI (Seam AFK + Town functions) — see prior PR notes / PR #7 era.
- **2026-09-11 (coordination):** Locked Boss=plan/Claude=code. Added `AGENT_COORDINATION.md`, `Eldrathor_NodeMap_Art_Lock.md`, `CLAUDE_BRIEFS/2026-09-11_pannable-island-and-node-map.md`. Island pan/zoom + parchment node map = next Claude build.

---

*Last updated: 2026-09-11 by Boss (Grok Bot).*
