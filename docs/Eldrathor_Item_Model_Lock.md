# Item Model — rarity ladder, upgrade grades, presentation, bag & character sheet (LOCKED 2026-09-16)

*Author: Claude Design Chat from Anthony's rulings 2026-09-16. **Replaces** the retracted Inventory & Equipment lock and **supersedes** Progression Loop lock §2 (five-rung ladder) and §3's Train rule. Keeps the design doc's item principles (§7a–c: weapons drop, armor crafted, ratings final, empowerment separate).*

## 1. The seven-rung ladder, tiers and gating (RULED by Anthony 2026-09-16, all rungs kept)
**Rarity:** Common · Uncommon · Rare · Epic · Legendary · Artifact · Mythic. Colours: Common `#9aa3ad` · Uncommon `#5fbf8a` · Rare `#4fa3ff` · Epic `#a678f0` · Legendary `#e8c46a` · Artifact `#ff8a3d` · Mythic `#ff5c8a` (shimmer).

**Two axes on every item.** *Tier* = power, set by the area the item came from. *Rarity* = quality, the multiplier. Seven tiers to match the seven rarities; zones map to tiers:

| Tier | Areas (10 = Vaelyx) |
|---|---|
| T1 | 1–2 |
| T2 | 3 |
| T3 | 4 |
| T4 | 5 |
| T5 | 6–7 |
| T6 | 8–9 |
| T7 | 10 |
*(lower bands are first-pass; Anthony's fixed points are 6–7, 8–9, 10)*

**Craftables (armor, and the materials that make them) — rarity gated by area:**
- **Common → Epic: farmable in any area** (processing quality rolls; higher areas bias higher).
- **Legendary: areas 6–7 only.** **Artifact: areas 8–9 only.** **Mythic: area 10 (Vaelyx) only.**
- Crafting Artifact/Mythic pieces = upgrading an existing Legendary/Artifact piece at the Smith with the zone's materials **plus an Artifact Core / Mythic Core** (hunted or gathered in 8–9 / dropped by Vaelyx). Rating and empower carry over.

**Weapon drops from rares and area bosses — rarity up to Artifact from ANY area**, tier from the area. An area-1 rare can drop an Artifact Greatsword at T1: exciting, but T1 power. Mythic weapons exist only by upgrading an Artifact with a Mythic Core. Normal-node drops stay Common → Epic weighted by area.

**Drop weights (rares/bosses, tune):** Common 30 · Uncommon 28 · Rare 20 · Epic 12 · Legendary 7 · Artifact 3; bosses shift one step up with rating floor 40; Attune Vein doubles the top-two chances.

**Three avenues of improvement (RULED 2026-09-17):** *Tier* = massive step; *Rarity* scales within a tier such that **Artifact T1 = Uncommon T2 at equal rating**; *Rating* = minor polish, 0–15%.
- **tierMult** = 1.8^(T−1): T1 1.00 · T2 1.80 · T3 3.24 · T4 5.83 · T5 10.5 · T6 18.9 · T7 34.0.
- **rarityMult** = 1.158^(rung): Common 1.00 · Uncommon 1.16 · Rare 1.34 · Epic 1.55 · Legendary 1.80 · Artifact 2.08 · Mythic 2.41. Four rungs = one tier, so a Legendary T1 equals a Common T2.
- **ratingScale** = `1 + 0.15 × (rating − 1) / 99` (rating 1 = base, 100 = +15%).
- **empowerScale** (weapons) = `1 + empower / 400` (max +25%) — empowerment lives inside the polish band; it is never a way to jump a tier. Tests: no T1 item at any rarity/rating/empower beats a T3 Common at rating 1.
- item stat = base(type) × tierMult × rarityMult × ratingScale × empowerScale.

**Materials** carry tier and rarity too; a recipe consumes the piece's tier band materials at the target rarity.

## 2. What an item is
`{ id, kind (weapon|armor|core|material), type, tier 1–7, rarity, rating 1–100, empower 0–100, name }`
- **Types are fixed and span every rarity.** Weapons: the 8 types. Armor: **Cuirass** (body) · **Helm** · **Gauntlets** · **Greaves**. Head/Hands/Feet give ½ the body values.
- **Names (RULED 2026-09-17):** **armor is named by tier** with one island prefix per tier — T1 **Gullwatch** · T2 **Saltcliff** · T3 **Quay** · T4 **Serpent** · T5 **Forge** · T6 **Bastion** · T7 **Worldforge** → "Saltcliff Helm". Cores use the type name. **Boss weapon drops draw from a boss-named pool** (3 per boss, e.g. "Brinewarden's Maul", "Skarra's Talon"; Design Chat writes them) instead of the tier pool. **Weapons carry a special name** generated at drop from a name table **per type per tier** (RULED 2026-09-16): a T1 Greatsword draws from the T1 Greatsword pool ("Gullwatch Cleaver"), a T7 from the T7 pool ("Kingsfall"), so the name signals the tier. Four names per type per tier = 224 names; Design Chat writes `data/weaponNames.js`. The special name shows **only in the bag list and the item sheet header**; everywhere else (results feed, equip slots, compare) the item is "Rare Greatsword".
- **Rating is the item's gear score, 1–100.** No composite number. Empower shows as **+N**.

## 3. Presentation — the row and the sheet
**Bag row:** `Tidebreaker  [T3] [Rare] [72] +12   Equipped` — name coloured by rarity, tier chip, rating chip, +N if empowered, "Equipped" tag (with who) when worn. No icons in lists.
**Item sheet (tap a row or a slot):** header (special name + "Rare Greatsword"), then **real stats**: Attack Power (the item's hit-damage contribution at current rating/empower), Attack Speed (tempo), Mitigation (if any), Bonus stats (empty until gems/sockets), then actions **Equip · Compare · Empower · Sell**. Sell gives Worldvein (floor by rarity, DESIGN-OPEN numbers). **No scrap.** Empower opens the Smith flow for this item. Compare shows the stat delta vs the target Adventurer's current item.
Sheets inherit the underlying mode (Style Bible §D).

## 4. Numbers
- Multipliers and the two-axis formula live in §1.
- Sell value: `base(rarity) × (1 + rating/200)`, base DESIGN-OPEN.

## 5. Bag (inventory screen)
One list, filter chips **All · Weapons · Armor · Cores · Materials**, sort **Rating ↓ · Rarity · Newest**. Rows per §3; materials as `[Rare] Ingot ×14`. Long-press for bulk **Sell** with confirm; equipped items are skipped. No bag cap.

## 6. Character sheet (Party → Adventurer)
**Six premade slot icons** (Weapon · Body · Head · Hands · Feet · Gem — one icon each, made once, from the art manifest): coloured/lit when filled with the item's rarity as a border tint and rating under it; **greyed with a "nothing equipped" state** when empty. Tap a filled slot → the item sheet (same as from the bag). Tap an empty slot → the bag filtered to that slot for this Adventurer with Compare on each row. Gem slot "Coming — not yet active" until M2 lock 2. Header: name, archetype, level, the 9 derived stats.

## 7. AFK Train cap (restores AFK/Town lock intent, supersedes Progression lock §3 "no catch-up cap")
**Train can raise an Adventurer only up to the highest level in your roster.** At that level Train stops (the slot shows "At roster cap — climb the mountain"). Gathering yield/tier stays capped by the highest unlocked area. The Mountain is the only way to raise the roster ceiling.

## 8. Roster (unchanged scope, small)
Recruit row in Town (three candidates, refreshed daily, first three free then a Worldvein cost — number DESIGN-OPEN), bench rows show current Hearth job, rename (1–16), dismiss with confirm (gear returns to bag). Archetype never editable.

## 9. Save policy while building (RULED 2026-09-17)
**Every brief that adds or changes a system wipes saves.** Bump `SAVE_VERSION`; on load, an older version is discarded (not migrated) and a fresh game starts, with a one-line notice "Save reset for a game update." No migrations are written during Milestones 2–3. Export/Import stays for deliberate carry-over. Migrations return when we approach TestFlight.
