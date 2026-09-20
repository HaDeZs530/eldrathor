# Five-rung proposal — measured by the simulator

*Generated 2026-09-20 by `app/scripts/sim/calibrateFive.mjs`. Nothing in the game has changed.*

## What was tested

- **Weapons:** Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8. One tier per wall, a flat step (Greatsword 20, 30 … 110). Upgrades to +10, each +2.5 % of base.
- **Drops:** a fight drops an item half the time; a miss pays the node's Worldvein again. Rares and bosses always drop at three times the odds.
- **Rates:** areas 1–3 Epic 6 % · Legendary 1.0 % · Mythic 0.3 %; areas 4–6 3.5 % · 0.3 % · 0.05 %; areas 7–10 2 % · 0.05 % · 0.01 %.
- **The wall:** three maxed Epics of the area's tier at the area's level (4.5 levels per area) beat the boss about 60 % of the time.
- **Packs:** tuned so a mid-geared party (Rare +5, mid level) fights ~20 s and loses ~12 % of its health. Healing × 0.5.
- **Target:** ~150 h on the efficient route (the 2-hour player at about 5 months). Areas 1–3 12.8 h, areas 4–10 16 h. **The number of clears is an output.**
- **Assumed, not ruled:** an upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖ (+10 = 55 spares); a level is worth +4 % compounding; armor and gems are left out of this pass.

## 1. Result

| Wall | Target h | Played h | Day | Clears (runs) | Wipes | Boss tries | Level in → out (target) | Worn at the kill |
|---|---|---|---|---|---|---|---|---|
| 1 | 12.8 | 0.2 | 1 | 3 | 1 | 1 | 1 → 1 (5) | T1 Rare +3 · T1 Legendary +1 · T1 Legendary +1 |
| 2 | 12.8 | 0.7 | 1 | 7 | 0 | 1 | 1 → 1 (9) | T2 Epic +7 · T2 Legendary +3 · T2 Epic +3 |
| 3 | 12.8 | 0.7 | 1 | 10 | 1 | 1 | 1 → 2 (14) | T2 Epic +8 · T2 Legendary +4 · T3 Rare +8 |
| 4 | 16 | 2.6 | 2 | 32 | 6 | 1 | 2 → 5 (18) | T4 Rare +10 · T4 Legendary +10 · T4 Epic +10 |
| 5 | 16 | 5.7 | 3 | 90 | 13 | 2 | 5 → 12 (23) | T5 Epic +10 · T4 Legendary +10 · T5 Legendary +10 |
| 6 | 16 | 3.9 | 4 | 50 | 7 | 3 | 12 → 16 (27) | T5 Epic +10 · T6 Legendary +10 · T5 Legendary +10 |
| 7 | 16 | 5.1 | 6 | 90 | 15 | 1 | 16 → 22 (32) | T5 Epic +10 · T6 Legendary +10 · T5 Legendary +10 |
| 8 | 16 | 1.8 | 6 | 30 | 5 | 1 | 22 → 23 (36) | T8 Rare +10 · T6 Legendary +10 · T5 Legendary +10 |
| 9 | 16 | 5.5 | 8 | 107 | 14 | 1 | 23 → 31 (41) | T8 Rare +10 · T6 Legendary +10 · T9 Legendary +10 |
| 10 | 16 | 4 | 9 | 66 | 8 | 1 | 31 → 34 (45) | T10 Epic +7 · T6 Legendary +10 · T9 Legendary +10 |
| **Total** | **150** | **30.2** | 9 | 485 | 70 | | | |

## 2. Loot per area

| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |
|---|---|---|---|---|---|---|
| 1 | 23 | 1 | 2 | 0 | never | never |
| 2 | 59 | 3 | 1 | 0 | 0.5 h | never |
| 3 | 60 | 3 | 0 | 0 | never | never |
| 4 | 215 | 7 | 2 | 0 | never | never |
| 5 | 447 | 12 | 2 | 0 | never | never |
| 6 | 335 | 10 | 2 | 0 | never | never |
| 7 | 383 | 6 | 0 | 0 | never | never |
| 8 | 128 | 0 | 0 | 0 | never | never |
| 9 | 408 | 8 | 1 | 0 | never | never |
| 10 | 313 | 4 | 0 | 0 | never | never |
| **Total** | 2371 | 54 | 10 | 0 | | |

## 3. The wall — boss win rate by gear, at the area's level

| Wall | Rare +10 | Epic +0 | **Epic +10** | Epic +10, 3 levels under | Legendary +10 | Mythic +10 | Boss fight |
|---|---|---|---|---|---|---|---|
| 1 | 17 % | 3 % | **60 %** | 7 % | 87 % | 100 % | 46 s |
| 2 | 17 % | 3 % | **60 %** | 0 % | 97 % | 100 % | 38 s |
| 3 | 27 % | 0 % | **53 %** | 0 % | 100 % | 100 % | 49 s |
| 4 | 3 % | 0 % | **60 %** | 0 % | 83 % | 100 % | 38 s |
| 5 | 7 % | 0 % | **53 %** | 0 % | 93 % | 97 % | 36 s |
| 6 | 7 % | 0 % | **60 %** | 0 % | 97 % | 100 % | 36 s |
| 7 | 7 % | 3 % | **63 %** | 0 % | 97 % | 100 % | 33 s |
| 8 | 13 % | 3 % | **67 %** | 0 % | 100 % | 100 % | 39 s |
| 9 | 27 % | 7 % | **63 %** | 10 % | 100 % | 100 % | 28 s |
| 10 | 10 % | 0 % | **57 %** | 3 % | 93 % | 100 % | 28 s |

## 4. Fights

| Wall | Arriving in last area's maxed Epics | Mid-geared (tuned) | Area average as played |
|---|---|---|---|
| 1 | 17.1 s, −11 % | 20.1 s, −11 % | 16.5 s, −7 % |
| 2 | 26.3 s, −20 % | 20 s, −13 % | 21.2 s, −8 % |
| 3 | 26.3 s, −22 % | 19.9 s, −12 % | 22.4 s, −8 % |
| 4 | 25.9 s, −20 % | 20 s, −11 % | 19.7 s, −8 % |
| 5 | 25.8 s, −26 % | 20 s, −12 % | 19.6 s, −10 % |
| 6 | 24.2 s, −21 % | 20 s, −12 % | 18.2 s, −8 % |
| 7 | 23.8 s, −22 % | 20 s, −12 % | 20.1 s, −11 % |
| 8 | 22.7 s, −18 % | 20 s, −12 % | 21.7 s, −12 % |
| 9 | 24.1 s, −23 % | 20 s, −12 % | 20.6 s, −12 % |
| 10 | 22.1 s, −19 % | 20 s, −12 % | 19.4 s, −10 % |

## 5. Enemy numbers this needs (multipliers on today's formula)

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |
|---|---|---|---|---|---|
| 1 | 11.125 | 1.528 | 1.2472 | 1.1168 | 5,254 |
| 2 | 13.909 | 0.918 | 1.0422 | 1.0209 | 3,395 |
| 3 | 13.148 | 0.72 | 0.9577 | 0.9786 | 2,649 |
| 4 | 12.211 | 0.502 | 0.8392 | 0.9161 | 3,637 |
| 5 | 10.513 | 0.433 | 0.7012 | 0.8374 | 4,615 |
| 6 | 9.878 | 0.377 | 0.5767 | 0.7594 | 9,602 |
| 7 | 8.27 | 0.321 | 0.4595 | 0.6779 | 11,676 |
| 8 | 7.047 | 0.265 | 0.3473 | 0.5893 | 19,897 |
| 9 | 5.279 | 0.206 | 0.2556 | 0.5056 | 19,815 |
| 10 | 4.026 | 0.168 | 0.1766 | 0.4203 | 51,529 |

## 6. Other seeds and players

| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |
|---|---|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 29.1 | 9 | 426 | 77 | 11 | 0 |
| Efficient | 2 | yes | 30 | 9 | 461 | 69 | 6 | 3 |
| Efficient | 3 | yes | 34.4 | 10 | 469 | 64 | 7 | 2 |
| Typical | 1 | yes | 62.8 | 18 | 423 | 61 | 7 | 3 |
| Casual (2 h) | 1 | yes | 69 | 34 | 454 | 74 | 14 | 2 |