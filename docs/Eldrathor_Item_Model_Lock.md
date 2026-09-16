# Item Model — rarity ladder, upgrade grades, presentation, bag & character sheet (LOCKED 2026-09-16)

*Author: Claude Design Chat from Anthony's rulings 2026-09-16. **Replaces** the retracted Inventory & Equipment lock and **supersedes** Progression Loop lock §2 (five-rung ladder) and §3's Train rule. Keeps the design doc's item principles (§7a–c: weapons drop, armor crafted, ratings final, empowerment separate).*

## 1. The seven-rung ladder (one ladder, everything)
**Common · Uncommon · Rare · Epic · Legendary · Artifact · Mythic.** ("Fine" → Uncommon.) Colours: Common `#9aa3ad` · Uncommon `#5fbf8a` · Rare `#4fa3ff` · Epic `#a678f0` · Legendary `#e8c46a` · Artifact `#ff8a3d` · Mythic `#ff5c8a` with a faint shimmer.
- **Drops and crafts reach Legendary.** No weapon ever drops as Artifact/Mythic; no recipe makes them.
- **Artifact and Mythic are upgrade grades.** Two special items — the **Artifact Core** and the **Mythic Core** — are consumed at the Smith to raise a **Legendary** item to Artifact, and an **Artifact** item to Mythic. Rating and empower carry over unchanged; the grade multiplier rises (§4). One core per upgrade; cores are never craftable.
- **Where cores come from (the top of the island):** Artifact Cores — hunted (rares + bosses) **and gathered** in **The Bastion (area 8)** and **The Worldforge (area 9)**; Mythic Cores — **only from Vaelyx** (the summit, recurring). Drop rates: DESIGN-OPEN (tune at M3).
- **Drop rarity band by area:** 1–2 Common · 3–4 Uncommon · 5–6 Rare · 7 Epic · 8–9 Legendary; roll 70% band / 20% up / 10% down within Common–Legendary; rares +1 band, bosses +1 band with rating floor 40; Attune Vein raises the up-chance to 40%.
- **Materials** use the same five names Common–Legendary (quality of processed mats = the area's band with a small step-up chance). Recipe = piece + rarity: a Rare Cuirass needs Rare metal + Rare fabric. Materials never go above Legendary; Artifact/Mythic is cores only.

## 2. What an item is
`{ id, kind (weapon|armor|core), type, rarity, rating 1–100, empower 0–100, name }`
- **Types are fixed and span every rarity.** Weapons: the 8 types. Armor: **Cuirass** (body) · **Helm** · **Gauntlets** · **Greaves**. Head/Hands/Feet give ½ the body values.
- **Names:** armor and cores use the type name ("Rare Helm"). **Weapons carry a special name** generated at drop from a per-type name table (e.g. Greatsword: "Tidebreaker", "Gullwatch Cleaver", "Kingsfall"…; ~12 per type, DESIGN-OPEN list, Design Chat writes it). The special name shows **only in the bag list and the item sheet header**; everywhere else (results feed, equip slots, compare) the item is "Rare Greatsword".
- **Rating is the item's gear score, 1–100.** No composite number. Empower shows as **+N**.

## 3. Presentation — the row and the sheet
**Bag row:** `Tidebreaker  [Rare] [72] +12   Equipped` — name coloured by rarity, tier chip, rating chip, +N if empowered, "Equipped" tag (with who) when worn. No icons in lists.
**Item sheet (tap a row or a slot):** header (special name + "Rare Greatsword"), then **real stats**: Attack Power (the item's hit-damage contribution at current rating/empower), Attack Speed (tempo), Mitigation (if any), Bonus stats (empty until gems/sockets), then actions **Equip · Compare · Empower · Sell**. Sell gives Worldvein (floor by rarity, DESIGN-OPEN numbers). **No scrap.** Empower opens the Smith flow for this item. Compare shows the stat delta vs the target Adventurer's current item.
Sheets inherit the underlying mode (Style Bible §D).

## 4. Numbers
- Rarity multiplier on an item's stats (applies to weapon hit damage and armor HP/mit): Common 1.00 · Uncommon 1.10 · Rare 1.22 · Epic 1.36 · Legendary 1.52 · Artifact 1.70 · Mythic 1.90 (tune). Rating scales `0.8 + 0.4 × rating/100`; empower `1 + empower/100` (weapons only, per §7c).
- Sell value: `base(rarity) × (1 + rating/200)`, base DESIGN-OPEN.

## 5. Bag (inventory screen)
One list, filter chips **All · Weapons · Armor · Cores · Materials**, sort **Rating ↓ · Rarity · Newest**. Rows per §3; materials as `[Rare] Ingot ×14`. Long-press for bulk **Sell** with confirm; equipped items are skipped. No bag cap.

## 6. Character sheet (Party → Adventurer)
**Six premade slot icons** (Weapon · Body · Head · Hands · Feet · Gem — one icon each, made once, from the art manifest): coloured/lit when filled with the item's rarity as a border tint and rating under it; **greyed with a "nothing equipped" state** when empty. Tap a filled slot → the item sheet (same as from the bag). Tap an empty slot → the bag filtered to that slot for this Adventurer with Compare on each row. Gem slot "Coming — not yet active" until M2 lock 2. Header: name, archetype, level, the 9 derived stats.

## 7. AFK Train cap (restores AFK/Town lock intent, supersedes Progression lock §3 "no catch-up cap")
**Train can raise an Adventurer only up to the highest level in your roster.** At that level Train stops (the slot shows "At roster cap — climb the mountain"). Gathering yield/tier stays capped by the highest unlocked area. The Mountain is the only way to raise the roster ceiling.

## 8. Roster (unchanged scope, small)
Recruit row in Town (three candidates, refreshed daily, first three free then a Worldvein cost — number DESIGN-OPEN), bench rows show current Hearth job, rename (1–16), dismiss with confirm (gear returns to bag). Archetype never editable.
