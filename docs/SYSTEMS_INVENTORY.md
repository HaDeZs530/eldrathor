# Systems inventory — what's built vs. the design (2026-09-15)
*Design Chat, from reading `app/src` at #57 against the design doc + locks. ✅ built · 🟡 partial · ❌ not built. "Need" = what has to exist for the system to be real. This is the trunk; the milestone plan orders it.*

## A. Core loop (the trunk that exists)
| System | State | Notes |
|---|---|---|
| Island map, 9 areas, unlock persistence | ✅ | art pending |
| Rally (lore, party edit, Explore) | ✅ | |
| Route map: web gen, 3 states, explore model, travel, camera, run log, sanctuary, rares, named, extract | ✅ | |
| Combat v2 resolver + fight screen + results | ✅ | enemies are stat blocks with placeholder names |
| Save/resume, ids, export/import | ✅ | |
| XP, levels, Train | ✅ | |
| Weapons: drop, rating, equip, empower (Smith) | ✅ | |
| Armor: craft (body slot only), rating, stats | 🟡 | one slot; no set bonuses; sockets absent |
| AFK: Gather / Process / Train, true idle | 🟡 | family-level gathering; no per-skill levels, no mastery, no per-area tiering beyond band |
| Market | 🟡 | sell to floor / buy materials; no dynamic pricing, no consumables |
| Style Bible chrome + art placeholders | ✅ | 58 of 63 art files missing |
| Help / Menu / Settings | ✅ | |

## B. Character & item management — ❌ the biggest hole
| Need | State | What it is |
|---|---|---|
| **Inventory screen** | ❌ | one place for everything you own: weapons, armor, gems, materials, consumables. Filters by type/rarity, sort, item detail sheet (stats, rating, empower, who can equip), sell / scrap / lock from the sheet. Today the stash is a 5-line list at the bottom of Town. |
| **Equipment paperdoll per Adventurer** | 🟡 | `GearPaperdoll` exists with weapon + body; needs head / hands / feet slots, gem slot, compare-on-tap, swap from inventory |
| **Roster management** | 🟡 | create exists; needs recruit flow (Recruit row in Town per §3b), dismiss, rename, bench view with AFK job shown, sort |
| **Item detail + compare** | ❌ | the sheet every list opens; shows the derived-stat delta vs equipped |
| **Consumables** | ❌ | design doc §7g lists them; nothing exists. Define a short list (potion = mid-run heal outside sanctuary, ward = run buff) or cut |

## C. Progression systems — ❌ designed, not built
| Need | State | Notes |
|---|---|---|
| **Class gems**: drop, inventory, equip, crossing/matching, procs, finishers | ❌ | trees fully designed (`ClassGemTrees_Lock`); no code |
| **Gem tree screen** (40 pts, Worldvein-bought) | ❌ | |
| **Weapon skill trees** (8) | ❌ | design doc §6c: the power engine; not designed, not built. Weapon skill level currently doesn't exist — `power` comes only from seeds/level/gear |
| **Veinbinder Bond & Craft trees** | ❌ | Player tab is a placeholder list with "???" costs |
| **Armor sockets + armor gems** | ❌ | §7c |
| **Court-art gems** | ❌ parked | M3 |
| **Gathering skill levels + per-material mastery** | ❌ | §7h Melvor-derived; AFK grants "skill XP" to nothing |
| **Renown / leaderboard** | ❌ | §5 social backdrop; later, needs backend |

## D. Content — 🟡 shells exist
| Need | State |
|---|---|
| Enemy rosters + behaviours, areas 1–9 | ❌ (placeholders) |
| Boss mechanics (9 + Vaelyx) | ❌ |
| Area art: biomes, enemy stages, portraits | ❌ (placeholders) |
| Areas 2–9 balance gates | ❌ (only area 1) |
| Onboarding | ❌ |
| Sound | ❌ |

## E. Platform
| Need | State |
|---|---|
| Capacitor iOS wrap, TestFlight | ❌ |
| Backend (server-authoritative save, market, renown) | ❌ — needed before any multiplayer/market dynamics; not before |
| Monetization (cosmetics, guild boost, idle slots) | ❌ — after backend |
