# Five-rung proposal — measured by the simulator

*Generated 2026-09-20 by `app/scripts/sim/calibrateFive.mjs`. Nothing in the game has changed.*

## What was tested

- **Weapons:** Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8. One tier per wall, a flat step (Greatsword 20, 30 … 110). Upgrades to +10, each +2.5 % of base.
- **Drops:** a fight drops an item half the time; a miss pays the node's Worldvein again. Rares and bosses always drop at three times the odds.
- **Rates:** areas 1–3 Epic 6 % · Legendary 1.0 % · Mythic 0.3 %; areas 4–6 3.5 % · 0.3 % · 0.05 %; areas 7–10 2 % · 0.05 % · 0.01 %.
- **The wall:** three maxed Epics of the area's tier at the area's level (4.5 levels per area) beat the boss about 60 % of the time, met with two sanctuary bonuses already taken (+20 % damage, +20 % mitigation).
- **Packs:** tuned so a mid-geared party (Rare +5, mid level) fights ~18 s and loses ~12 % of its health. Healing × 0.5.
- **Target:** ~150 h on the efficient route (the 2-hour player at about 5 months). Areas 1–3 12.8 h, areas 4–10 16 h. **The number of clears is an output.**
- **Assumed, not ruled:** an upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖ (+10 = 55 spares); a level is worth +4 % compounding; armor and gems are left out of this pass.

## 1. Result

| Wall | Target h | Played h | Day | Clears (runs) | Wipes | Boss tries | Level in → out (target) | Worn at the kill |
|---|---|---|---|---|---|---|---|---|
| 1 | 12.8 | 2 | 1 | 21 | 3 | 2 | 1 → 1 (5) | T1 Epic +10 · T1 Legendary +10 · T1 Legendary +10 |
| 2 | 12.8 | 6.8 | 3 | 71 | 13 | 1 | 1 → 7 (9) | T2 Mythic +10 · T2 Mythic +10 · T2 Epic +10 |
| 3 | 12.8 | 8.9 | 5 | 100 | 9 | 4 | 7 → 12 (14) | T3 Mythic +10 · T3 Mythic +10 · T3 Epic +10 |
| 4 | 16 | 10 | 8 | 116 | 11 | 2 | 12 → 16 (18) | T3 Mythic +10 · T3 Mythic +10 · T4 Epic +10 |
| 5 | 16 | 12.3 | 12 | 136 | 15 | 2 | 16 → 22 (23) | T5 Legendary +10 · T5 Legendary +10 · T3 Mythic +10 |
| 6 | 16 | 14.2 | 16 | 157 | 17 | 1 | 22 → 27 (27) | T5 Legendary +10 · T5 Legendary +10 · T6 Epic +10 |
| 7 | 16 | 11.7 | 19 | 159 | 19 | 1 | 27 → 30 (32) | T5 Legendary +10 · T5 Legendary +10 · T6 Epic +10 |
| 8 | 16 | 3.9 | 20 | 49 | 6 | 2 | 30 → 32 (36) | T8 Epic +10 · T8 Epic +10 · T8 Epic +10 |
| 9 | 16 | 13.8 | 24 | 184 | 20 | 2 | 32 → 41 (41) | T8 Epic +10 · T8 Epic +10 · T8 Epic +10 |
| 10 | 16 | 21.7 | 30 | 260 | 25 | 3 | 41 → 46 (45) | T8 Epic +10 · T8 Epic +10 · T8 Epic +10 |
| **Total** | **150** | **105.3** | 30 | 1253 | 138 | | | |

## 2. Loot per area

| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |
|---|---|---|---|---|---|---|
| 1 | 226 | 9 | 5 | 0 | 0.6 h | 1.9 h |
| 2 | 721 | 54 | 12 | 2 | 0.5 h | 2.1 h |
| 3 | 884 | 64 | 13 | 4 | 8.7 h | 8.7 h |
| 4 | 1007 | 40 | 9 | 0 | never | never |
| 5 | 1229 | 63 | 3 | 0 | never | never |
| 6 | 1435 | 66 | 5 | 0 | never | never |
| 7 | 1090 | 30 | 1 | 0 | never | never |
| 8 | 359 | 12 | 0 | 0 | 2 h | 2.2 h |
| 9 | 1329 | 28 | 0 | 0 | never | never |
| 10 | 2105 | 41 | 0 | 0 | never | never |
| **Total** | 10385 | 407 | 48 | 6 | | |

## 3. The wall — boss win rate by gear, at the area's level

| Wall | Rare +10 | Epic +0 | **Epic +10** | Epic +10, 3 levels under | Legendary +10 | Mythic +10 | Boss fight |
|---|---|---|---|---|---|---|---|
| 1 | 23 % | 10 % | **60 %** | 13 % | 80 % | 93 % | 56 s |
| 2 | 7 % | 0 % | **63 %** | 0 % | 80 % | 100 % | 43 s |
| 3 | 23 % | 7 % | **63 %** | 7 % | 90 % | 97 % | 47 s |
| 4 | 23 % | 3 % | **63 %** | 3 % | 83 % | 97 % | 46 s |
| 5 | 0 % | 0 % | **63 %** | 0 % | 83 % | 97 % | 38 s |
| 6 | 7 % | 0 % | **60 %** | 3 % | 70 % | 87 % | 42 s |
| 7 | 17 % | 0 % | **60 %** | 0 % | 90 % | 93 % | 43 s |
| 8 | 33 % | 10 % | **60 %** | 3 % | 70 % | 90 % | 39 s |
| 9 | 23 % | 3 % | **63 %** | 13 % | 80 % | 93 % | 35 s |
| 10 | 13 % | 0 % | **63 %** | 13 % | 77 % | 93 % | 36 s |

## 4. Fights

| Wall | Arriving in last area's maxed Epics | Mid-geared (tuned) | Area average as played |
|---|---|---|---|
| 1 | 15.3 s, −13 % | 18 s, −14 % | 10.7 s, −6 % |
| 2 | 23.8 s, −18 % | 18 s, −12 % | 13.2 s, −5 % |
| 3 | 21.3 s, −18 % | 18 s, −12 % | 13.9 s, −6 % |
| 4 | 19.4 s, −14 % | 18 s, −12 % | 14.6 s, −6 % |
| 5 | 19.2 s, −14 % | 18 s, −11 % | 13.9 s, −6 % |
| 6 | 18.2 s, −13 % | 18 s, −12 % | 14.2 s, −6 % |
| 7 | 17.9 s, −14 % | 18 s, −12 % | 16.1 s, −8 % |
| 8 | 17.6 s, −14 % | 18 s, −12 % | 15.6 s, −8 % |
| 9 | 18.8 s, −15 % | 18 s, −12 % | 14.9 s, −7 % |
| 10 | 16.7 s, −12 % | 18 s, −12 % | 15.3 s, −7 % |

## 5. Enemy numbers this needs (multipliers on today's formula)

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |
|---|---|---|---|---|---|
| 1 | 9.871 | 1.707 | 1.9033 | 1.3796 | 5,488 |
| 2 | 14.942 | 1.037 | 2.1606 | 1.4699 | 3,243 |
| 3 | 15.972 | 0.926 | 1.8933 | 1.376 | 5,577 |
| 4 | 14.654 | 0.751 | 1.6243 | 1.2745 | 12,391 |
| 5 | 12.941 | 0.599 | 1.3501 | 1.1619 | 14,926 |
| 6 | 11.497 | 0.518 | 1.0757 | 1.0372 | 34,522 |
| 7 | 9.431 | 0.414 | 0.8002 | 0.8946 | 50,824 |
| 8 | 7.164 | 0.323 | 0.5529 | 0.7435 | 57,652 |
| 9 | 5.647 | 0.251 | 0.4405 | 0.6637 | 58,736 |
| 10 | 4.916 | 0.217 | 0.34 | 0.5831 | 216,824 |

## 6. Other seeds and players

| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |
|---|---|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 93.1 | 27 | 1063 | 118 | 36 | 4 |
| Efficient | 2 | yes | 88.6 | 25 | 1041 | 107 | 43 | 6 |
| Casual (2 h) | 1 | yes | 180.4 | 86 | 996 | 106 | 37 | 7 |