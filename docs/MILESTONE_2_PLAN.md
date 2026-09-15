# Milestone 2 — "Manage and grow" (plan, revised 2026-09-15)
*After the systems inventory (`docs/SYSTEMS_INVENTORY.md`). Item management comes first because every later system (gems, sockets, consumables, roster) needs a place to live. Each lock → one or two briefs.*

| # | Lock | Brief outcome |
|---|---|---|
| 1 | **Inventory & equipment** — inventory screen (all item kinds, filters, sort, detail sheet with compare, sell/scrap/lock), full paperdoll (weapon, body, head, hands, feet, gem slot), swap flow, roster management (recruit flow in Town, dismiss, rename, bench with job shown) | `InventoryScreen`, `ItemSheet`, paperdoll v2, `RecruitPanel` |
| 2 | **Class gems live** — drop from rares, equip, crossing/matching in derive, procs/finishers in the resolver, **gem tree screen** with Worldvein costs | gem system end to end, tests per tree node |
| 3 | **Weapon skill trees** — design the 8 trees (node-linked, per §6c) + weapon skill XP from use; the power engine | `WeaponTreeScreen`, skill XP, power scaling |
| 4 | **Veinbinder trees + Player tab** — Bond/Craft nodes and costs | `PlayerScreen` real |
| 5 | **Gathering depth** — skill levels per gathering skill, per-material mastery, armor sockets + armor gems, consumables (or cut) | AFK v2, Crafter v2 |
| 6 | **Enemy rosters + boss mechanics, areas 1–3**; areas 2–3 gates | content + tests |
| 7 | **Onboarding** + playtest tuning | |

**Milestone 3:** areas 4–9, court bosses + court-art gems, Vaelyx, market dynamics, sound, Capacitor/TestFlight. **Milestone 4:** backend, renown, monetization.
