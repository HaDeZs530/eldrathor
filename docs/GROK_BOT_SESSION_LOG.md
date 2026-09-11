# Grok Bot / Boss — Session Log (Eldrathor)

**Purpose:** Transferable memory so Claude Code (or any other agent) can pick up without re-deriving locks from chat. Update this file when locks change or major milestones land.

**Repo:** `HaDeZs530/eldrathor` · Prototype: Vite + React under `app/`

---

## Source of truth
1. `docs/Eldrathor_Design_Doc.md` — game design (older §3b / economy bits may lag; prefer locks below when they conflict).
2. `docs/Eldrathor_DualMode_Art_Lock.md` — dual graphical modes.
3. `docs/Eldrathor_TabBar_Lock.md` — nav chrome (may lag; see AFK/Town lock for Market→AFK tab swap).
4. **`docs/Eldrathor_AFK_Town_Lock.md`** — **LOCKED 2026-09-11** AFK Gather/Process + Town Crafter/Upgrade/Market + economy loop.
5. **This file** — chronology + cross-cutting locks.

---

## LOCKED (do not reverse without Anthony)

### Dual graphical modes
- **World / warm RPG:** Town (and physical hub chrome), micro-pixel / RPG coloration.
- **Mind-view:** Player, Party, expedition, combat, loot, **AFK Gather** — Mythros-blue / refined.
- **Mountain hub:** hybrid.
- Crossfade on theme change; never snap.

### Bottom TabBar (5 tabs) — order LOCKED
**Player | Party | Mountain | Town | AFK-tab**  
- **AFK-tab** replaces root **Market** (name OPEN: Seam / Echoes / Bound / …).  
- **Market** = **Town sub-section**, not a root tab.  
- TabBar stays **VISIBLE** during expeditions/fights; AFK keeps running (true idle, incl. app closed). Returning to Mountain restores run stage.

### Island → run flow (PR #3 shipped)
Island map → difficulty placeholder → Mind-view expedition → fight → loot; stage machine persists across tabs.

### Player / Party (Mind-view)
Stats top + upgrades below; Eternal Hero paperdoll (silhouette + slots); Party = bonded 3 + roster + create + detail.

### Gear acquisition (LOCKED 2026-09-11)
- **Weapons** = mountain **drops** (+ Town Upgrade/smith merge/empower).  
- **Armor** = Town **Crafter** from **AFK-processed** mats.  
- AFK does **not** craft finished gear; AFK **Processes** raw → infused quality mats.

### AFK + Town split (LOCKED 2026-09-11) — see `Eldrathor_AFK_Town_Lock.md`
- **Gather:** areas unlock with mountain worlds; wood / metal / cloth·leather; Melvor-like timer; always pays XP + raw mats.  
- **Process:** Worldvein cost; tier raw → infused qualities (mythic chase). Gather skill ≠ Process skill.  
- **Town:** Crafter + Upgrade/smith + Market sub.  
- **No** armor “+1 tier only” craft gate — may AFK/craft high tier if desired; tune via rates/costs/combat.  
- **Character XP** = mountain only. **AFK** = gather/process **skill XP** only.  
- Excess armor → convert/sell to **Worldvein**. Mountain = primary Worldvein earn.

### Currency
**Worldvein** on UI. Mythros = lore substance/energy, not a second point currency.

---

## Still TODO / DESIGN-OPEN
- AFK tab display name; Hunt/Forage name; mat fantasy names; rates/slots/recipes  
- Wire AFK Gather/Process + Town Crafter/Upgrade/Market screens  
- Territory map polish (§8c respawns/rares/boss seal)  
- Combat v2 spectacle  
- Growth trees (gems / Veinbinder)  
- Design doc §3b + economy sections rewrite to match locks; remove stale DESIGN_OPEN_AFK brief status  
- Capacitor iOS later  

---

## Chronology (additions)
- **2026-09-11:** Full AFK/Town design lock after review — Market→AFK tab; Gather+Process; Town Crafter/Upgrade/Market; armor tiers via areas for gather unlock (not craft +1 gate); Worldvein loops; true idle. Doc: `docs/Eldrathor_AFK_Town_Lock.md`.

---

*Last updated: 2026-09-11 by Boss (Grok Bot).*
