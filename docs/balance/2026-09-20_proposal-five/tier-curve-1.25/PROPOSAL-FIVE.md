# Five-rung proposal — measured by the simulator

*Generated 2026-09-21 by `app/scripts/sim/calibrateFive.mjs`. Nothing in the game has changed.*

## What was tested

- **Weapons:** Common · Rare · Epic · Legendary · Mythic = ×1.0 / 1.2 / 1.4 / 1.6 / 1.8. One tier per wall, a flat step (Greatsword 20, 30 … 110). Upgrades to +10, each +2.5 % of base.
- **Drops:** a fight drops an item half the time; a miss pays the node's Worldvein again. Rares and bosses always drop at three times the odds.
- **Rates:** areas 1–3 Epic 6 % · Legendary 1.0 % · Mythic 0.3 %; areas 4–6 3.5 % · 0.3 % · 0.05 %; areas 7–10 2 % · 0.05 % · 0.01 %.
- **The wall:** three maxed Epics of the area's tier at the area's level (4.5 levels per area) beat the boss about 60 % of the time, met with two sanctuary bonuses already taken (+20 % damage, +20 % mitigation).
- **Packs:** tuned so a mid-geared party (Rare +5, mid level) fights ~18 s and loses ~20 % of its health. Healing × 0.5.
- **Target:** ~150 h on the efficient route (the 2-hour player at about 5 months). Areas 1–3 12.8 h, areas 4–10 16 h. **The number of clears is an output.**
- **Assumed, not ruled:** an upgrade level n costs n spare weapons of the same tier plus 20 × tier × n ❖ (+10 = 55 spares); a level is worth +4 % compounding; armor is left out of this pass; every party member holds a matching gem with about 4 imbues per area (40 by the dragon), and the wall party has every Bond upgrade its Resonance rank allows.

## 1. Result

| Wall | Target h | Played h | Day | Clears (runs) | Wipes | Boss tries | Level in → out (target) | Worn at the kill |
|---|---|---|---|---|---|---|---|---|
| 1 | 12.8 | 2.3 | 1 | 45 | 12 | 3 | 1 → 1 (5) | T1 Rare +10 · T1 Legendary +10 · T1 Legendary +10 |
| 2 | 12.8 | 7.6 | 3 | 99 | 13 | 2 | 1 → 7 (9) | T2 Epic +10 · T2 Legendary +10 · T2 Mythic +10 |
| 3 | 12.8 | 5.9 | 5 | 98 | 13 | 1 | 7 → 10 (14) | T2 Epic +10 · T3 Mythic +10 · T2 Mythic +10 |
| 4 | 16 | 7.8 | 7 | 126 | 17 | 1 | 10 → 15 (18) | T4 Rare +10 · T3 Mythic +10 · T4 Legendary +10 |
| 5 | 16 | 10 | 10 | 175 | 26 | 1 | 15 → 20 (23) | T5 Epic +10 · T5 Epic +10 · T5 Legendary +10 |
| 6 | 16 | 15 | 14 | 267 | 62 | 2 | 20 → 28 (27) | T5 Epic +10 · T6 Legendary +10 · T5 Legendary +10 |
| 7 | 16 | 4.2 | 15 | 49 | 10 | 1 | 28 → 29 (32) | T7 Rare +10 · T6 Legendary +10 · T7 Legendary +10 |
| 8 | 16 | 9.6 | 18 | 73 | 8 | 1 | 29 → 33 (36) | T8 Epic +10 · T8 Epic +10 · T7 Legendary +10 |
| 9 | 16 | 4.1 | 19 | 49 | 10 | 1 | 33 → 35 (41) | T8 Epic +10 · T9 Epic +10 · T9 Epic +10 |
| 10 | 16 | 16.5 | 24 | 82 | 6 | 3 | 35 → 46 (45) | T10 Rare +10 · T9 Epic +10 · T9 Epic +10 |
| **Total** | **150** | **83.0** | 24 | 1063 | 177 | | | |

## 2. Loot per area

| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |
|---|---|---|---|---|---|---|
| 1 | 218 | 17 | 5 | 0 | never | never |
| 2 | 772 | 61 | 11 | 1 | 7.1 h | 7.1 h |
| 3 | 577 | 36 | 3 | 1 | never | never |
| 4 | 749 | 29 | 1 | 0 | never | never |
| 5 | 904 | 38 | 6 | 0 | 9.2 h | 9.2 h |
| 6 | 1359 | 53 | 7 | 0 | never | never |
| 7 | 420 | 8 | 1 | 0 | never | never |
| 8 | 946 | 20 | 0 | 0 | never | never |
| 9 | 365 | 6 | 0 | 0 | never | never |
| 10 | 1832 | 37 | 1 | 0 | never | never |
| **Total** | 8142 | 305 | 35 | 2 | | |

## 3. The wall — boss win rate by gear, at the area's level

| Wall | Rare +10 | Epic +0 | **Epic +10** | … 3 levels under | … no gem imbues | … upgrades as bought on arrival | Last tier Legendary +10 | Legendary +10 | Mythic +10 | Boss fight |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 43 % | 27 % | **63 %** | 20 % | 40 % | 23 % | 80 % | 80 % | 93 % | 73 s |
| 2 | 30 % | 13 % | **60 %** | 0 % | 0 % | 33 % | 50 % | 93 % | 100 % | 59 s |
| 3 | 23 % | 0 % | **63 %** | 0 % | 0 % | 63 % | 27 % | 77 % | 80 % | 74 s |
| 4 | 37 % | 7 % | **60 %** | 0 % | 0 % | 60 % | 50 % | 80 % | 97 % | 59 s |
| 5 | 17 % | 3 % | **60 %** | 0 % | 0 % | 60 % | 33 % | 77 % | 97 % | 49 s |
| 6 | 20 % | 3 % | **60 %** | 0 % | 0 % | 60 % | 40 % | 83 % | 93 % | 53 s |
| 7 | 30 % | 27 % | **60 %** | 20 % | 0 % | 60 % | 53 % | 80 % | 80 % | 49 s |
| 8 | 40 % | 30 % | **63 %** | 10 % | 0 % | 63 % | 50 % | 73 % | 77 % | 45 s |
| 9 | 50 % | 47 % | **50 %** | 43 % | 0 % | 50 % | 50 % | 60 % | 73 % | 42 s |
| 10 | 47 % | 37 % | **60 %** | 33 % | 0 % | 60 % | 53 % | 67 % | 77 % | 36 s |

## 4. Fights

| Wall | Arriving in last area's maxed Epics | Mid-geared (tuned) | Area average as played |
|---|---|---|---|
| 1 | 15.9 s, −20 % | 18 s, −20 % | 10.9 s, −10 % |
| 2 | 20.2 s, −27 % | 18 s, −20 % | 13.3 s, −7 % |
| 3 | 21.5 s, −34 % (wins 96 %) | 18.1 s, −20 % | 13.6 s, −9 % |
| 4 | 20.6 s, −28 % | 18 s, −20 % | 13.3 s, −9 % |
| 5 | 20.7 s, −27 % | 18 s, −19 % | 14.9 s, −10 % |
| 6 | 20.7 s, −28 % | 18 s, −20 % | 14.2 s, −10 % |
| 7 | 19.6 s, −25 % | 18 s, −20 % | 14.2 s, −8 % |
| 8 | 21 s, −27 % | 18.1 s, −20 % | 15.9 s, −6 % |
| 9 | 20.3 s, −26 % | 18 s, −20 % | 15.9 s, −8 % |
| 10 | 20.9 s, −27 % | 18 s, −20 % | 14.6 s, −3 % |

## 5. Enemy numbers this needs (multipliers on today's formula)

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |
|---|---|---|---|---|---|
| 1 | 11.163 | 2.54 | 2.242 | 1.4973 | 4,568 |
| 2 | 13.559 | 1.707 | 2.4014 | 1.5496 | 3,168 |
| 3 | 14.826 | 1.918 | 2.8287 | 1.6819 | 5,460 |
| 4 | 14.042 | 1.604 | 2.3887 | 1.5455 | 8,489 |
| 5 | 13.778 | 1.388 | 2.1154 | 1.4544 | 11,973 |
| 6 | 13.936 | 1.383 | 1.8833 | 1.3723 | 19,739 |
| 7 | 14.036 | 1.256 | 1.7306 | 1.3155 | 70,288 |
| 8 | 12.893 | 1.048 | 1.3789 | 1.1743 | 53,369 |
| 9 | 12.109 | 1.148 | 1.0097 | 1.0048 | 68,058 |
| 10 | 11.086 | 0.998 | 1.2407 | 1.1139 | 90,037 |

## 6. Other seeds and players

| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |
|---|---|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 79.2 | 23 | 1040 | 160 | 32 | 13 |
| Efficient | 2 | yes | 79.9 | 23 | 1007 | 189 | 33 | 14 |
| Casual (2 h) | 1 | yes | 197.1 | 95 | 1139 | 171 | 41 | 8 |