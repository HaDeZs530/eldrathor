# Five-rung proposal — measured by the simulator

*Generated 2026-09-20 by `app/scripts/sim/calibrateFive.mjs`. Nothing in the game has changed.*

## What was tested

- **Weapons:** Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8. One tier per wall, a flat step (Greatsword 20, 30 … 110). Upgrades to +10, each +2.5 % of base.
- **Drops:** a fight drops an item half the time; a miss pays the node's Worldvein again. Rares and bosses always drop at three times the odds.
- **Rates:** areas 1–3 Epic 6 % · Legendary 1.0 % · Mythic 0.3 %; areas 4–6 3.5 % · 0.3 % · 0.05 %; areas 7–10 2 % · 0.05 % · 0.01 %.
- **The wall:** three maxed Epics of the area's tier at the area's level (4.5 levels per area) beat the boss about 60 % of the time, met with two sanctuary bonuses already taken (+20 % damage, +20 % mitigation).
- **Packs:** tuned so a mid-geared party (Rare +5, mid level) fights ~18 s and loses ~12 % of its health. Healing × 0.5.
- **Target:** ~150 h on the efficient route (the 2-hour player at about 5 months). Areas 1–3 12.8 h, areas 4–10 16 h. **The number of clears is an output.**
- **Assumed, not ruled:** an upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖ (+10 = 55 spares); a level is worth +4 % compounding; armor is left out of this pass; every party member holds a matching gem with about 4 imbues per area (40 by the dragon), and the wall party has every Bond upgrade its Resonance rank allows.

## 1. Result

| Wall | Target h | Played h | Day | Clears (runs) | Wipes | Boss tries | Level in → out (target) | Worn at the kill |
|---|---|---|---|---|---|---|---|---|
| 1 | 12.8 | 1.9 | 1 | 20 | 1 | 1 | 1 → 1 (5) | T1 Epic +10 · T1 Legendary +10 · T1 Legendary +10 |
| 2 | 12.8 | 10.8 | 4 | 87 | 2 | 1 | 1 → 10 (9) | T2 Legendary +10 · T2 Mythic +10 · T2 Mythic +10 |
| 3 | 12.8 | 8.7 | 7 | 74 | 2 | 1 | 10 → 13 (14) | T3 Mythic +10 · T3 Mythic +10 · T3 Mythic +10 |
| 4 | 16 | 15.6 | 11 | 154 | 12 | 2 | 13 → 18 (18) | T3 Mythic +10 · T3 Mythic +10 · T3 Mythic +10 |
| 5 | 16 | 7.6 | 13 | 82 | 6 | 2 | 18 → 20 (23) | T3 Mythic +10 · T5 Legendary +10 · T5 Legendary +10 |
| 6 | 16 | 7.6 | 15 | 73 | 6 | 1 | 20 → 24 (27) | T6 Epic +10 · T6 Mythic +10 · T5 Legendary +10 |
| 7 | 16 | 12.1 | 19 | 76 | 3 | 1 | 24 → 30 (32) | T6 Epic +10 · T6 Mythic +10 · T5 Legendary +10 |
| 8 | 16 | 10.5 | 22 | 67 | 5 | 6 | 30 → 34 (36) | T8 Epic +10 · T6 Mythic +10 · T8 Epic +10 |
| 9 | 16 | 8.1 | 24 | 45 | 2 | 3 | 34 → 38 (41) | T9 Legendary +10 · T9 Legendary +10 · T8 Epic +10 |
| 10 | 16 | 8.1 | 26 | 39 | 0 | 1 | 38 → 41 (45) | T9 Legendary +10 · T9 Legendary +10 · T10 Legendary +10 |
| **Total** | **150** | **91.0** | 26 | 717 | 39 | | | |

## 2. Loot per area

| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |
|---|---|---|---|---|---|---|
| 1 | 209 | 11 | 4 | 0 | 0.6 h | 1.9 h |
| 2 | 1223 | 94 | 12 | 6 | 1 h | 2.1 h |
| 3 | 967 | 85 | 8 | 8 | 4.5 h | 5 h |
| 4 | 1632 | 74 | 8 | 0 | never | never |
| 5 | 750 | 36 | 5 | 2 | never | never |
| 6 | 760 | 27 | 1 | 1 | never | never |
| 7 | 1174 | 34 | 1 | 0 | never | never |
| 8 | 1097 | 30 | 0 | 0 | never | never |
| 9 | 822 | 18 | 3 | 0 | never | never |
| 10 | 879 | 20 | 2 | 2 | never | never |
| **Total** | 9513 | 429 | 44 | 19 | | |

## 3. The wall — boss win rate by gear, at the area's level

| Wall | Rare +10 | Epic +0 | **Epic +10** | … 3 levels under | … no gem imbues | … upgrades as bought on arrival | Last tier Legendary +10 | Legendary +10 | Mythic +10 | Boss fight |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 43 % | 27 % | **63 %** | 20 % | 40 % | 23 % | 80 % | 80 % | 93 % | 53 s |
| 2 | 13 % | 7 % | **63 %** | 0 % | 0 % | 10 % | 0 % | 77 % | 93 % | 38 s |
| 3 | 0 % | 0 % | **60 %** | 0 % | 0 % | 17 % | 0 % | 87 % | 90 % | 44 s |
| 4 | 17 % | 0 % | **63 %** | 0 % | 0 % | 63 % | 33 % | 77 % | 93 % | 46 s |
| 5 | 20 % | 0 % | **63 %** | 0 % | 0 % | 63 % | 47 % | 80 % | 93 % | 49 s |
| 6 | 47 % | 30 % | **63 %** | 20 % | 0 % | 63 % | 60 % | 77 % | 80 % | 43 s |
| 7 | 33 % | 27 % | **60 %** | 10 % | 0 % | 60 % | 60 % | 80 % | 80 % | 55 s |
| 8 | 43 % | 33 % | **60 %** | 20 % | 0 % | 60 % | 60 % | 77 % | 87 % | 47 s |
| 9 | 47 % | 40 % | **60 %** | 27 % | 0 % | 60 % | 63 % | 80 % | 87 % | 52 s |
| 10 | 47 % | 43 % | **60 %** | 30 % | 0 % | 50 % | 60 % | 60 % | 67 % | 29 s |

## 4. Fights

| Wall | Arriving in last area's maxed Epics | Mid-geared (tuned) | Area average as played |
|---|---|---|---|
| 1 | 16 s, −14 % | 18 s, −14 % | 11.6 s, −7 % |
| 2 | 23.6 s, −19 % | 17.9 s, −12 % | 11.1 s, −3 % |
| 3 | 21.4 s, −20 % | 17.9 s, −12 % | 12.4 s, −4 % |
| 4 | 20 s, −17 % | 18 s, −12 % | 13.4 s, −5 % |
| 5 | 19.2 s, −16 % | 17.9 s, −12 % | 15.3 s, −6 % |
| 6 | 19.1 s, −15 % | 17.9 s, −12 % | 14.7 s, −6 % |
| 7 | 19.4 s, −16 % | 18 s, −12 % | 15.5 s, −5 % |
| 8 | 18.4 s, −15 % | 17.9 s, −12 % | 14.2 s, −4 % |
| 9 | 18.2 s, −15 % | 18 s, −12 % | 16.3 s, −5 % |
| 10 | 17.9 s, −14 % | 18 s, −12 % | 14.7 s, −1 % |

## 5. Enemy numbers this needs (multipliers on today's formula)

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |
|---|---|---|---|---|---|
| 1 | 11.189 | 1.949 | 2.242 | 1.4973 | 5,346 |
| 2 | 16.138 | 1.212 | 2.7116 | 1.6467 | 3,406 |
| 3 | 20.46 | 1.454 | 3.6452 | 1.9092 | 11,105 |
| 4 | 19.765 | 1.229 | 2.8138 | 1.6774 | 16,553 |
| 5 | 19.575 | 1.084 | 2.5451 | 1.5953 | 23,024 |
| 6 | 15.8 | 0.903 | 1.8537 | 1.3615 | 25,097 |
| 7 | 13.605 | 0.797 | 1.8149 | 1.3472 | 33,064 |
| 8 | 12.207 | 0.725 | 1.2739 | 1.1287 | 67,018 |
| 9 | 10.554 | 0.826 | 1.0312 | 1.0155 | 86,629 |
| 10 | 8.698 | 0.67 | 0.9527 | 0.976 | 140,318 |

## 6. Other seeds and players

| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |
|---|---|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 101 | 29 | 789 | 62 | 46 | 12 |
| Efficient | 2 | yes | 97.1 | 28 | 724 | 62 | 55 | 13 |
| Casual (2 h) | 1 | yes | 215.6 | 102 | 851 | 47 | 62 | 13 |