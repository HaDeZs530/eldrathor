# Five-rung proposal — measured by the simulator

*Generated 2026-09-20 by `app/scripts/sim/calibrateFive.mjs`. Nothing in the game has changed.*

## What was tested

- **Weapons:** Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8. One tier per wall, a flat step (Greatsword 20, 30 … 110). Upgrades to +10, each +2.5 % of base.
- **Drops:** a fight drops an item half the time; a miss pays the node's Worldvein again. Rares and bosses always drop at three times the odds.
- **Rates:** areas 1–3 Epic 6 % · Legendary 1.0 % · Mythic 0.3 %; areas 4–6 3.5 % · 0.3 % · 0.05 %; areas 7–10 2 % · 0.05 % · 0.01 %.
- **The wall:** three maxed Epics of the area's tier at the area's level (4.5 levels per area) beat the boss about 60 % of the time, met with two sanctuary bonuses already taken (+20 % damage, +20 % mitigation).
- **Packs:** tuned so a mid-geared party (Rare +5, mid level) fights ~25 s and loses ~12 % of its health. Healing × 0.5.
- **Target:** ~150 h on the efficient route (the 2-hour player at about 5 months). Areas 1–3 12.8 h, areas 4–10 16 h. **The number of clears is an output.**
- **Assumed, not ruled:** an upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖ (+10 = 55 spares); a level is worth +4 % compounding; armor and gems are left out of this pass.

## 1. Result

| Wall | Target h | Played h | Day | Clears (runs) | Wipes | Boss tries | Level in → out (target) | Worn at the kill |
|---|---|---|---|---|---|---|---|---|
| 1 | 12.8 | 1.8 | 1 | 15 | 2 | 2 | 1 → 1 (5) | T1 Epic +10 · T1 Legendary +10 · T1 Legendary +5 |
| 2 | 12.8 | 6.5 | 3 | 53 | 5 | 2 | 1 → 7 (9) | T2 Legendary +10 · T2 Mythic +10 · T2 Mythic +10 |
| 3 | 12.8 | 6.9 | 5 | 69 | 8 | 1 | 7 → 11 (14) | T2 Legendary +10 · T2 Mythic +10 · T2 Mythic +10 |
| 4 | 16 | 8.3 | 7 | 90 | 9 | 1 | 11 → 15 (18) | T4 Epic +10 · T4 Epic +10 · T4 Epic +10 |
| 5 | 16 | 11.1 | 10 | 93 | 11 | 2 | 15 → 21 (23) | T5 Legendary +10 · T5 Legendary +10 · T4 Epic +10 |
| 6 | 16 | 15.8 | 15 | 145 | 10 | 1 | 21 → 27 (27) | T5 Legendary +10 · T5 Legendary +10 · T6 Legendary +10 |
| 7 | 16 | 20.9 | 21 | 174 | 13 | 2 | 27 → 33 (32) | T5 Legendary +10 · T5 Legendary +10 · T6 Legendary +10 |
| 8 | 16 | 3.7 | 22 | 33 | 5 | 1 | 33 → 34 (36) | T8 Epic +10 · T8 Epic +10 · T8 Epic +6 |
| 9 | 16 | 6.5 | 23 | 80 | 9 | 2 | 34 → 37 (41) | T8 Epic +10 · T8 Epic +10 · T8 Epic +8 |
| 10 | 16 | 9.3 | 26 | 96 | 11 | 1 | 37 → 42 (45) | T8 Epic +10 · T8 Epic +10 · T10 Epic +10 |
| **Total** | **150** | **90.8** | 26 | 848 | 83 | | | |

## 2. Loot per area

| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |
|---|---|---|---|---|---|---|
| 1 | 177 | 8 | 5 | 0 | 0.8 h | never |
| 2 | 556 | 43 | 6 | 4 | 5.8 h | 5.8 h |
| 3 | 551 | 47 | 4 | 1 | never | never |
| 4 | 672 | 26 | 3 | 1 | 4.5 h | 4.5 h |
| 5 | 942 | 35 | 3 | 0 | never | never |
| 6 | 1402 | 67 | 9 | 1 | never | never |
| 7 | 1805 | 44 | 0 | 0 | never | never |
| 8 | 296 | 6 | 0 | 0 | 2.8 h | never |
| 9 | 500 | 14 | 0 | 0 | never | never |
| 10 | 797 | 19 | 1 | 0 | never | never |
| **Total** | 7698 | 309 | 31 | 7 | | |

## 3. The wall — boss win rate by gear, at the area's level

| Wall | Rare +10 | Epic +0 | **Epic +10** | Epic +10, 3 levels under | Legendary +10 | Mythic +10 | Boss fight |
|---|---|---|---|---|---|---|---|
| 1 | 23 % | 10 % | **60 %** | 13 % | 80 % | 93 % | 62 s |
| 2 | 33 % | 17 % | **63 %** | 3 % | 90 % | 93 % | 42 s |
| 3 | 23 % | 7 % | **63 %** | 7 % | 90 % | 97 % | 44 s |
| 4 | 23 % | 3 % | **63 %** | 3 % | 83 % | 97 % | 46 s |
| 5 | 7 % | 0 % | **60 %** | 3 % | 90 % | 93 % | 39 s |
| 6 | 7 % | 0 % | **60 %** | 3 % | 70 % | 87 % | 41 s |
| 7 | 7 % | 0 % | **67 %** | 0 % | 90 % | 90 % | 38 s |
| 8 | 13 % | 3 % | **60 %** | 0 % | 83 % | 97 % | 31 s |
| 9 | 50 % | 40 % | **63 %** | 27 % | 87 % | 100 % | 39 s |
| 10 | 20 % | 13 % | **63 %** | 17 % | 83 % | 100 % | 32 s |

## 4. Fights

| Wall | Arriving in last area's maxed Epics | Mid-geared (tuned) | Area average as played |
|---|---|---|---|
| 1 | 21.2 s, −11 % | 24.9 s, −12 % | 15.3 s, −5 % |
| 2 | 33.1 s, −20 % | 25 s, −13 % | 19 s, −5 % |
| 3 | 29.6 s, −19 % | 25 s, −12 % | 21.1 s, −7 % |
| 4 | 28.1 s, −18 % | 25 s, −12 % | 21.3 s, −8 % |
| 5 | 26.9 s, −15 % | 25 s, −11 % | 21.7 s, −6 % |
| 6 | 25.3 s, −15 % | 25 s, −12 % | 19.3 s, −6 % |
| 7 | 24.8 s, −13 % | 24.9 s, −12 % | 19.6 s, −6 % |
| 8 | 23.6 s, −12 % | 25 s, −12 % | 22.4 s, −7 % |
| 9 | 25.1 s, −14 % | 25 s, −12 % | 22.5 s, −8 % |
| 10 | 24.8 s, −15 % | 25 s, −12 % | 20.8 s, −7 % |

## 5. Enemy numbers this needs (multipliers on today's formula)

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |
|---|---|---|---|---|---|
| 1 | 14.116 | 1.315 | 1.9033 | 1.3796 | 4,836 |
| 2 | 20.778 | 0.869 | 1.9439 | 1.3943 | 2,641 |
| 3 | 22.877 | 0.773 | 1.8933 | 1.376 | 4,830 |
| 4 | 20.972 | 0.616 | 1.6243 | 1.2745 | 8,077 |
| 5 | 17.652 | 0.444 | 1.2739 | 1.1287 | 11,252 |
| 6 | 15.873 | 0.398 | 1.0757 | 1.0372 | 23,337 |
| 7 | 12.094 | 0.321 | 0.7551 | 0.8689 | 46,803 |
| 8 | 9.953 | 0.26 | 0.5413 | 0.7357 | 108,930 |
| 9 | 8.311 | 0.2 | 0.4027 | 0.6346 | 69,121 |
| 10 | 6.434 | 0.155 | 0.3191 | 0.5649 | 83,767 |

## 6. Other seeds and players

| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |
|---|---|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 90.6 | 26 | 870 | 95 | 26 | 13 |
| Efficient | 2 | yes | 87.7 | 25 | 849 | 97 | 38 | 16 |
| Casual (2 h) | 1 | yes | 171.1 | 81 | 788 | 74 | 40 | 8 |