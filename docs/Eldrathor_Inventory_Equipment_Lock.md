# Inventory, Equipment & Item Presentation (LOCKED 2026-09-16) — Milestone 2, lock 1

*Author: Claude Design Chat, with Anthony's 2026-09-16 direction on loot presentation. Fills the biggest hole in `SYSTEMS_INVENTORY.md` §B.*

## 1. Presentation — one item language everywhere
**Text rows, never an icon grid.** Every item, wherever it appears (inventory, results, Smith, Crafter, Market, paperdoll), renders as the same **ItemRow**:

`[TIER CHIP] Name ............ GS 000 [+N]`

- **Tier chip:** 3-letter rarity abbreviation in a small rounded chip **coloured by rarity** — Common `#9aa3ad` COM · Fine `#5fbf8a` FIN · Rare `#4fa3ff` RAR · Epic `#a678f0` EPI · Legendary `#e8c46a` LEG. Chip text is dark on the fill. The row's name is also tinted the rarity colour at 85%.
- **Name:** `<Rarity> <Type>` for weapons ("Fine Greatsword"), recipe name for armor ("Fine Wardcoat"), gem name for gems.
- **Gear Score (GS):** one number, 0–120, so any two items compare instantly: `GS = 20 × (rarityIndex − 1) + rating × 0.2 + additions × 0.2`, rounded. rarityIndex 1–5. For weapons `additions = empower (0–100)`; for armor `additions = 20 × socketed gems` (cap 100 later). Shown right-aligned in Cinzel numerals, colour `--eld-display`.
- **+N badge (top-right of the row/slot):** shows additions above base. Weapons: `+<empower>` (hidden when 0). Armor: `+<gems socketed>` once sockets exist. Small gold-on-dark pill, 11 px.
- **Sub-line (inventory + sheet only):** `Rating 72 · Tempo 1.2 · Dmg 12 · Mit 25%` for weapons; `Rating 64 · HP +75 · Mit +4%` for armor; `Tank gem · 12/40 pts` for gems.
- **Equipped marker:** a small gold ring glyph at the row's left edge + "on Kessa" in the sub-line. Locked items show a padlock; locked items can't be sold, scrapped or fed.
- **Paperdoll slots** use a compact `ItemSlot`: chip + GS on one line, +N badge top-right, empty = dashed outline with the slot name.

## 2. Inventory screen (new; Town row "Stash" replaces the 5-line list; also reachable from Party → Adventurer → slot → "Choose")
- **Tabs** across the top: All · Weapons · Armor · Gems · Materials. Materials show as `[TIER CHIP] Fine Ingot ×14` rows (no GS, no badge).
- **Sort** (segmented): GS ↓ · Rarity · Newest · Type. **Filter chip:** "Equippable by <selected Adventurer>" when opened from a slot.
- Row tap → **ItemSheet** (mode-inherited, Style Bible §D): full stats, who it's on, and actions **Equip on… / Compare / Lock / Sell (floor price) / Scrap** (weapons: scrap = fodder value shown; armor: scrap → partial materials). Compare shows the derived-stat delta vs the target Adventurer's current item, green/red per stat.
- **Multi-select** (long-press) for Sell / Scrap in bulk with a confirm listing count and total ❖. Locked and equipped items are excluded automatically.
- Capacity: none for now (no bag limit — anti-tedium). Revisit only if save size becomes a problem.

## 3. Equipment (paperdoll v2, in Party → Adventurer)
- Slots: **Weapon · Body · Head · Hands · Feet · Gem** (gem slot shows "Coming — not yet active" until lock 2). Head/Hands/Feet are new armor recipes at every tier (`Cap/Helm`, `Gloves/Gauntlets`, `Boots/Greaves`); each gives HP and mitigation at **½ the body piece's values** (Progression lock §4 formula scaled ×0.5). Sockets per §7c come with lock 5.
- Tap a slot → Inventory filtered to that slot for that Adventurer with Compare on each row → Equip. Swapping unequips to inventory; nothing is ever destroyed by equipping.
- Header shows the Adventurer's derived stats (9) with a **total GS** = sum of slot GS, and the party's total GS on the Party root.

## 4. Roster management
- **Recruit row in Town** (per design doc §3b): opens `RecruitPanel` — three candidates refreshed daily (archetype, name, level 1, Common starter), cost `50 ❖ × (rosterSize − 2)` (first three free). Recruit → roster.
- **Bench view** (Party root): fielded three at top, then bench rows showing name · archetype · level · GS · current job (Hearth job name or "Idle" or "On the mountain").
- **Rename** (1–16 chars) and **Dismiss** (confirm; unequips everything to inventory first) from the Adventurer sheet. Archetype never editable.

## 5. Results screen
Loot lines use the same ItemRow; a new best-in-slot for anyone in the party gets a small **"↑ upgrade for Orin"** tag on the row (compare against that Adventurer's current GS in the slot). Tap → ItemSheet with Equip.

## Out of scope here
Class gems (lock 2), sockets/armor gems and consumables (lock 5), gear trading (design doc §7e deferred).
