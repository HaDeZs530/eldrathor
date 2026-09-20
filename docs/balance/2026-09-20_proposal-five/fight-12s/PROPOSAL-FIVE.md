# Five-rung proposal — measured by the simulator

*Generated 2026-09-20 by `app/scripts/sim/calibrateFive.mjs`. Nothing in the game has changed.*

## What was tested

- **Weapons:** Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8. One tier per wall, a flat step (Greatsword 20, 30 … 110). Upgrades to +10, each +2.5 % of base.
- **Drops:** a fight drops an item half the time; a miss pays the node's Worldvein again. Rares and bosses always drop at three times the odds.
- **Rates:** areas 1–3 Epic 6 % · Legendary 1.0 % · Mythic 0.3 %; areas 4–6 3.5 % · 0.3 % · 0.05 %; areas 7–10 2 % · 0.05 % · 0.01 %.
- **The wall:** three maxed Epics of the area's tier at the area's level (4.5 levels per area) beat the boss about 60 % of the time, met with two sanctuary bonuses already taken (+20 % damage, +20 % mitigation).
- **Packs:** tuned so a mid-geared party (Rare +5, mid level) fights ~12 s and loses ~12 % of its health. Healing × 0.5.
- **Target:** ~150 h on the efficient route (the 2-hour player at about 5 months). Areas 1–3 12.8 h, areas 4–10 16 h. **The number of clears is an output.**
- **Assumed, not ruled:** an upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖ (+10 = 55 spares); a level is worth +4 % compounding; armor and gems are left out of this pass.

## 1. Result

| Wall | Target h | Played h | Day | Clears (runs) | Wipes | Boss tries | Level in → out (target) | Worn at the kill |
|---|---|---|---|---|---|---|---|---|
| 1 | 12.8 | 1.7 | 1 | 18 | 3 | 2 | 1 → 1 (5) | T1 Epic +10 · T1 Legendary +10 · T1 Legendary +10 |
| 2 | 12.8 | 5.8 | 3 | 70 | 9 | 2 | 1 → 5 (9) | T2 Mythic +10 · T2 Mythic +10 · T2 Mythic +10 |
| 3 | 12.8 | 6.1 | 4 | 79 | 10 | 1 | 5 → 10 (14) | T3 Mythic +10 · T3 Mythic +10 · T2 Mythic +10 |
| 4 | 16 | 2.5 | 5 | 29 | 5 | 1 | 10 → 11 (18) | T3 Mythic +10 · T3 Mythic +10 · T4 Epic +10 |
| 5 | 16 | 11.8 | 8 | 161 | 16 | 2 | 11 → 22 (23) | T5 Legendary +10 · T3 Mythic +10 · T5 Mythic +10 |
| 6 | 16 | 6.8 | 10 | 97 | 9 | 2 | 22 → 24 (27) | T5 Legendary +10 · T6 Epic +10 · T5 Mythic +10 |
| 7 | 16 | 12.3 | 14 | 161 | 19 | 4 | 24 → 32 (32) | T5 Legendary +10 · T6 Epic +10 · T7 Epic +10 |
| 8 | 16 | 11 | 17 | 153 | 24 | 3 | 32 → 34 (36) | T8 Epic +10 · T8 Legendary +10 · T7 Epic +10 |
| 9 | 16 | 5.9 | 19 | 104 | 20 | 1 | 34 → 38 (41) | T9 Legendary +10 · T8 Legendary +10 · T8 Epic +10 |
| 10 | 16 | 9.4 | 21 | 187 | 30 | 1 | 38 → 42 (45) | T9 Legendary +10 · T8 Legendary +10 · T8 Epic +10 |
| **Total** | **150** | **73.3** | 21 | 1059 | 145 | | | |

## 2. Loot per area

| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |
|---|---|---|---|---|---|---|
| 1 | 218 | 9 | 7 | 0 | 0.6 h | 1.6 h |
| 2 | 725 | 64 | 4 | 4 | 0.8 h | 1.8 h |
| 3 | 747 | 57 | 13 | 3 | never | never |
| 4 | 304 | 15 | 1 | 1 | never | never |
| 5 | 1374 | 60 | 4 | 2 | never | never |
| 6 | 829 | 37 | 2 | 1 | never | never |
| 7 | 1480 | 39 | 0 | 0 | never | never |
| 8 | 1291 | 32 | 1 | 2 | never | never |
| 9 | 662 | 19 | 2 | 0 | never | never |
| 10 | 964 | 15 | 1 | 0 | never | never |
| **Total** | 8594 | 347 | 35 | 13 | | |

## 3. The wall — boss win rate by gear, at the area's level

| Wall | Rare +10 | Epic +0 | **Epic +10** | Epic +10, 3 levels under | Legendary +10 | Mythic +10 | Boss fight |
|---|---|---|---|---|---|---|---|
| 1 | 23 % | 10 % | **60 %** | 13 % | 80 % | 93 % | 54 s |
| 2 | 40 % | 17 % | **63 %** | 10 % | 90 % | 93 % | 37 s |
| 3 | 3 % | 0 % | **63 %** | 0 % | 90 % | 97 % | 47 s |
| 4 | 17 % | 7 % | **60 %** | 0 % | 90 % | 97 % | 53 s |
| 5 | 3 % | 3 % | **63 %** | 0 % | 80 % | 93 % | 36 s |
| 6 | 27 % | 10 % | **60 %** | 13 % | 83 % | 87 % | 42 s |
| 7 | 3 % | 0 % | **60 %** | 0 % | 87 % | 97 % | 39 s |
| 8 | 17 % | 7 % | **60 %** | 0 % | 80 % | 93 % | 38 s |
| 9 | 23 % | 3 % | **63 %** | 13 % | 80 % | 93 % | 35 s |
| 10 | 33 % | 13 % | **63 %** | 23 % | 90 % | 100 % | 34 s |

## 4. Fights

| Wall | Arriving in last area's maxed Epics | Mid-geared (tuned) | Area average as played |
|---|---|---|---|
| 1 | 10.2 s, −11 % | 12.1 s, −12 % | 7 s, −5 % |
| 2 | 15.7 s, −18 % | 12 s, −12 % | 8.1 s, −5 % |
| 3 | 14.5 s, −19 % | 12 s, −12 % | 8.8 s, −5 % |
| 4 | 13.3 s, −15 % | 12 s, −12 % | 10.1 s, −6 % |
| 5 | 13.8 s, −18 % | 12 s, −12 % | 9.4 s, −6 % |
| 6 | 12.1 s, −14 % | 12 s, −12 % | 9.4 s, −7 % |
| 7 | 12.3 s, −14 % | 12 s, −12 % | 8.8 s, −6 % |
| 8 | 11.4 s, −12 % | 12 s, −12 % | 9.5 s, −7 % |
| 9 | 12 s, −14 % | 12 s, −12 % | 9.9 s, −8 % |
| 10 | 11.9 s, −14 % | 12 s, −12 % | 10.3 s, −9 % |

## 5. Enemy numbers this needs (multipliers on today's formula)

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |
|---|---|---|---|---|---|
| 1 | 6.302 | 2.125 | 1.9033 | 1.3796 | 6,375 |
| 2 | 9.158 | 1.326 | 1.9439 | 1.3943 | 3,950 |
| 3 | 9.574 | 1.121 | 1.8053 | 1.3436 | 5,328 |
| 4 | 8.597 | 0.927 | 1.4692 | 1.2121 | 11,681 |
| 5 | 7.251 | 0.749 | 1.3219 | 1.1497 | 9,606 |
| 6 | 6.624 | 0.707 | 0.9476 | 0.9735 | 40,518 |
| 7 | 5.062 | 0.526 | 0.7712 | 0.8782 | 33,650 |
| 8 | 4.763 | 0.461 | 0.589 | 0.7675 | 113,371 |
| 9 | 3.705 | 0.369 | 0.4405 | 0.6637 | 85,132 |
| 10 | 3.031 | 0.309 | 0.3329 | 0.577 | 127,590 |

## 6. Other seeds and players

| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |
|---|---|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 83.5 | 24 | 1220 | 154 | 38 | 6 |
| Efficient | 2 | yes | 78.5 | 23 | 1155 | 142 | 26 | 5 |
| Casual (2 h) | 1 | yes | 155.4 | 75 | 1021 | 97 | 38 | 8 |