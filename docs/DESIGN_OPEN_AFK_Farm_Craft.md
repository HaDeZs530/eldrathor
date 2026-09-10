# DESIGN-OPEN — AFK farm → materials → craft (gear acquisition)

**Status:** NOT LOCKED. Anthony flagged 2026-09-10. Boss design review required before any acquisition UI/code locks.  
**Related:** `GearPaperdoll.jsx` slots stay flexible placeholders; expedition loot stubs OK until this lands.

---

## Intent (Anthony)

Gear was meant to come from:

1. **AFK groups** farming **crafting materials**
2. Those materials feed a **craft** pipeline that produces equippable items
3. Not primarily from expedition drops for **armor** (weapons may still drop per existing combat/loot design — confirm in review)

Paperdoll UI (Eternal Hero–style silhouette + slots) remains; **how slots fill** is the open question.

---

## Design understanding (draft for Boss review)

### Loop sketch
| Stage | Player action | Output | Notes |
|-------|---------------|--------|-------|
| Assign | Put group(s) on AFK farm | Ongoing farm job | Who farms? bonded-3? roster extras? open |
| Farm | AFK time / ticks | Crafting materials | Node type? Island region? material tiers? open |
| Craft | Spend mats (+ maybe gold/vein?) | Armor / gear pieces | Station in Town? Player hub? open |
| Equip | Paperdoll slots | Worn gear | Dressable art later |

### Open questions (need Boss answers)
1. **Who AFK farms?** Player-controlled solo groups, full roster, or bonded party only?
2. **Where?** Dedicated AFK map nodes, island regions, or Town “work” slots?
3. **Time model?** Real-time offline accrual, online ticks, or both?
4. **Material taxonomy?** Ore / cloth / essence / worldvein scraps — how many families and tiers?
5. **Craft UI home?** Town, Market, or Player screen?
6. **Weapon vs armor split?** Weapons from expedition drops; armor from craft only — confirm.
7. **Gems?** Drop, craft, or separate AFK track?
8. **Expedition loot** after this lands: gold / mats / weapons only? Remove armor stubs?
9. **Risk?** Can AFK groups die / need rescue, or pure safe idle?

### What stays flexible in code (until lock)
- `GearPaperdoll` footer + comments already mark acquisition DESIGN-OPEN
- No equip inventory model yet
- LootResults may show placeholder drops — do not treat as final economy
- Do **not** invent AFK farm screens or craft recipes in PR #3 without Boss confirm

### Suggested next step after Boss review
Lock answers to open questions in this doc → promote to LOCKED section in `GROK_BOT_SESSION_LOG.md` → then implement AFK assign UI + mat inventory + craft stubs (separate PR).

---

*Drafted 2026-09-10 by Boss (Grok Bot) for design review — not a lock.*
