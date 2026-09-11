# Eldrathor — AFK + Town Systems Lock

*LOCKED direction — Anthony + Boss, 2026-09-11. Supersedes earlier conflicting notes (Market as own tab; armor +1-tier craft gate; AFK “Craft” sub-tab for gear). Transferable for Claude / any agent. See also `docs/GROK_BOT_SESSION_LOG.md`.*

**Currency:** **Worldvein** (UI name). Mythros = lore crystal/energy, not a second currency.

**Gear split (unchanged):**
- **Weapons** = mountain expedition **drops** (+ merge/empower at Town Upgrade NPC).
- **Armor** = **crafted in Town** from **processed** AFK materials.

---

## Bottom tabs (nav update)

Left → right:
1. **Player** — Mind-view  
2. **Party** — Mind-view  
3. **Mountain** — center; expeditions (hybrid)  
4. **Town** — warm RPG (Harbor functions + Market sub-area + Crafter + Upgrade NPC)  
5. **AFK tab** — *name still OPEN* (candidates: Seam, Echoes, Bound, …) — replaces **Market** as its own tab  

**Market** lives as a **sub-section under Town**, not a root tab.

---

## AFK tab = separate game mode (always on)

Runs in background **even when the phone/app is closed** (true idle), and stays available while mid-fight / on other tabs.

### Sub-areas
| Sub | UI feel | Role |
|-----|---------|------|
| **Gather** | Mind-view (Vein bond / remote labor) | Park Adventurers on a **gather area**; Melvor-style repeating timer until stopped |
| **Process** | AFK infusion (theme OPEN; not Town craft) | Park specialists; spend **Worldvein** to turn **raw → infused crafting mats** with quality/rarity |

**Specialization:** characters can lean Gather or Process; each gains **that skill’s XP** from use.  
**Not gained in AFK:** character combat XP / player level — those stay on **Mountain fighting**.

### Gather
- **Areas** gated by mountain progression: unlocking a world/area unlocks that tier’s gather sites (e.g. logging for that tier). Higher areas → better raw mats + more skill XP.
- Three material families: **wood / metal / cloth·leather** (Vein-touched names TBD). Cloth·leather lean: woodland **Hunt**-style circuit (name OPEN: Hunt / Forage / …).
- Every tick **always pays** skill XP + raw mats (no “failed gather”). Optional small Worldvein drip (keep small so AFK cannot replace mountain).
- Multiple slots may run at once; only limit = slot count. No extra penalties.

### Process
- Input: raw mats of a tier → output: **magically infused** crafting materials of that tier, in **qualities** (including rare/mythic).
- Example intent: process many logs → mostly commons + a few **mythics**.
- Costs **Worldvein** (Mythros energy in fiction).
- Crit / rare outcomes = better quality infused mats (jackpot on process, not on gather failure).

---

## Town (warm RPG)

Harbor function list / NPCs include at least:
- **Crafter NPC** — craft **armor** (and gear crafts) from **infused** mats; recipes need **X of a given quality**.
- **Upgrade / smith NPC** — weapon merge/empower, related upgrades (skills/gear empowerment).
- **Market** — vendor / sell (sub-tab or row under Town).
- Other bars as designed (Recruit, etc.) can land later.

**Armor craft gating:** **no +1-tier craft lock.** Players may pursue high-tier AFK + craft if they choose; growth is tuned elsewhere (rates, costs, combat), not by blocking craft knowledge per “current world +1.”

**Intentional power read:** medium-quality / modest rating armor should be enough to fight at that mountain tier; mythic mats → higher-end armor ratings as **extra / endgame chase**, not a brick wall.

**Worldvein sink/source:** craft and process spend Worldvein; **unwanted / excess armor can be broken down / sold back into Worldvein** (craft a lot, recycle extras). Mountain remains the **primary** Worldvein earn.

---

## Loop (canonical)

1. Fight on **Mountain** → Worldvein + weapon drops + character XP.  
2. Unlock worlds → unlock matching **Gather areas**.  
3. AFK **Gather** raw mats (skill XP).  
4. AFK **Process** (Worldvein) → infused quality mats (mythic chase).  
5. **Town Crafter** → armor from those mats; **Upgrade NPC** → weapons.  
6. Scrap/sell excess armor → Worldvein; repeat.

---

## Explicitly superseded
- Market as 5th root tab.  
- AFK sub-tab named “Craft” that crafts finished gear (gear craft is Town).  
- Armor craft “only +1 tier above current area” / boss craft-knowledge gates (removed for now).  
- AFK as the source of **character** XP (Idle-for-character-XP from older doc is **not** in this lock; revisit only if Anthony restores it).

## Still OPEN
- AFK tab display name  
- Hunt/Forage skill display name + Vein-touched mat names  
- Slot counts, timers, process rates, crit tables, recipe numbers  
- Process panel art theme (Mind vs hybrid)  
- Exact Market UI under Town  

*Last updated: 2026-09-11 — Boss (Grok Bot).*
