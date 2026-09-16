# BRIEF — M2 lock 1: Inventory screen, ItemRow/ItemSheet, paperdoll v2, roster management, results upgrade tags
**Status:** READY · **Date:** 2026-09-16 · **Author:** Claude Design Chat · **Spec:** `docs/Eldrathor_Inventory_Equipment_Lock.md` (authoritative)
1. `ItemRow`, `ItemSlot`, `ItemSheet` shared components per §1 (rarity chips/colours, GS formula with a test, +N badge, sub-lines, equipped/locked markers). Replace every existing item rendering (stash, Smith, Crafter, Market, results, paperdoll) with them.
2. `InventoryScreen` per §2 (tabs, sort, filter-by-slot, sheet actions incl. Compare delta, lock, bulk sell/scrap with confirm). Town "Stash" row opens it; remove the 5-line list.
3. Paperdoll v2 per §3: six slots, Head/Hands/Feet recipes at every tier (½ body values), slot → filtered inventory → Equip; derived stats + total GS in the header; party total GS on Party root.
4. Roster per §4: Recruit row + `RecruitPanel` (daily three, cost formula), bench view with job, rename, dismiss (unequip first).
5. Results per §5: ItemRow loot lines with "↑ upgrade for <name>" tags; tap → sheet → Equip.
6. Tests: GS formula; compare delta sign; equip/unequip never destroys; dismiss returns gear; recruit cost; bulk actions skip locked/equipped.
PR: `feat(items): inventory, item rows/sheets, paperdoll v2, roster management`
