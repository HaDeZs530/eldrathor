# Grok Bot / Boss — Session Log (Eldrathor)

**Purpose:** Transferable memory so Claude Code (or any other agent) can pick up without re-deriving locks from chat. Update this file when locks change or major milestones land.

**Repo:** `HaDeZs530/eldrathor` · Prototype: Vite + React under `app/`

---

## Source of truth
1. `docs/Eldrathor_Design_Doc.md` — game design (older bits may lag; prefer locks below when they conflict).
2. `docs/Eldrathor_DualMode_Art_Lock.md` — dual graphical modes.
3. `docs/Eldrathor_TabBar_Lock.md` — nav chrome (may lag; see AFK/Town lock for Market→AFK tab swap).
4. **`docs/Eldrathor_AFK_Town_Lock.md`** — **LOCKED 2026-09-11** AFK Gather/Process/Idle·Train + Town Crafter/Upgrade/Market.
5. **This file** — chronology + cross-cutting locks.

---

## LOCKED (do not reverse without Anthony)

### Dual graphical modes
- **World / warm RPG:** Town (and physical hub chrome).
- **Mind-view:** Player, Party, expedition, combat, loot, **AFK Gather** (and likely Idle/Train).
- **Mountain hub:** hybrid.
- Crossfade on theme change; never snap.

### Bottom TabBar (5 tabs) — order LOCKED
**Player | Party | Mountain | Town | AFK-tab**  
- **AFK-tab** replaces root **Market** (name OPEN: Seam / Echoes / Bound / …).  
- **Market** = **Town sub-section**.  
- TabBar visible during expeditions/fights; AFK true idle (app closed OK). Mountain restores run stage.

### Island → run flow (PR #3 shipped)
Island map → difficulty placeholder → Mind-view expedition → fight → loot; stage machine persists across tabs.

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

Fixes: alt specialists / new recruits without easy-map babysitting or level-1 endgame griefing.

### Town
Crafter + Upgrade/smith + Market sub. No +1-tier craft gate. Excess armor → Worldvein.

### Currency
**Worldvein** on UI. Mythros = lore energy.

---

## Still TODO / DESIGN-OPEN
- AFK tab name; Hunt/Forage name; mat names; rates/slots/recipes; Idle catch-up curve numbers  
- Wire AFK Gather/Process/Idle + Town Crafter/Upgrade/Market screens  
- Territory map polish; combat v2; growth trees; Capacitor later  

---

## Chronology
- **2026-09-11:** AFK/Town lock merged in PR #4 (mid-write — Idle/Train missed). Follow-up adds Idle/Train. Doc: `Eldrathor_AFK_Town_Lock.md`.

---

*Last updated: 2026-09-11 by Boss (Grok Bot).*
