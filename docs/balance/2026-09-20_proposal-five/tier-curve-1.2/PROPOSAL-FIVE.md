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
| 2 | 12.8 | 9.1 | 4 | 109 | 12 | 2 | 1 → 9 (9) | T2 Epic +10 · T2 Mythic +10 · T2 Mythic +10 |
| 3 | 12.8 | 8.7 | 6 | 131 | 28 | 2 | 9 → 12 (14) | T3 Legendary +10 · T2 Mythic +10 · T2 Mythic +10 |
| 4 | 16 | 7.4 | 8 | 134 | 23 | 1 | 12 → 15 (18) | T3 Legendary +10 · T4 Legendary +9 · T2 Mythic +10 |
| 5 | 16 | 8.5 | 11 | 144 | 19 | 1 | 15 → 20 (23) | T5 Epic +10 · T4 Legendary +10 · T5 Epic +10 |
| 6 | 16 | 15.3 | 15 | 276 | 44 | 1 | 20 → 28 (27) | T6 Legendary +10 · T6 Epic +10 · T5 Epic +10 |
| 7 | 16 | 9.7 | 18 | 121 | 23 | 2 | 28 → 30 (32) | T6 Legendary +10 · T6 Epic +10 · T7 Epic +10 |
| 8 | 16 | 1.6 | 18 | 11 | 1 | 1 | 30 → 31 (36) | T6 Legendary +10 · T8 Rare +10 · T7 Epic +10 |
| 9 | 16 | 13.1 | 22 | 177 | 27 | 3 | 31 → 42 (41) | T9 Rare +10 · T9 Epic +10 · T9 Rare +10 |
| 10 | 16 | 2.6 | 23 | 13 | 3 | 4 | 42 → 42 (45) | T10 Epic +10 · T9 Epic +10 · T10 Epic +10 |
| **Total** | **150** | **78.3** | 23 | 1161 | 192 | | | |

## 2. Loot per area

| Wall | Items | Epics | Legendaries | Mythics | Three Epics worn after | Three maxed Epics after |
|---|---|---|---|---|---|---|
| 1 | 218 | 17 | 5 | 0 | never | never |
| 2 | 1033 | 82 | 9 | 4 | 3.7 h | 3.7 h |
| 3 | 864 | 68 | 3 | 4 | never | never |
| 4 | 680 | 19 | 4 | 0 | never | never |
| 5 | 768 | 36 | 5 | 0 | never | never |
| 6 | 1333 | 69 | 4 | 1 | never | never |
| 7 | 902 | 17 | 0 | 0 | never | never |
| 8 | 143 | 3 | 0 | 0 | never | never |
| 9 | 1206 | 39 | 0 | 0 | never | never |
| 10 | 280 | 10 | 0 | 0 | never | never |
| **Total** | 7427 | 360 | 30 | 9 | | |

## 3. The wall — boss win rate by gear, at the area's level

| Wall | Rare +10 | Epic +0 | **Epic +10** | … 3 levels under | … no gem imbues | … upgrades as bought on arrival | Last tier Legendary +10 | Legendary +10 | Mythic +10 | Boss fight |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 43 % | 27 % | **63 %** | 20 % | 40 % | 23 % | 80 % | 80 % | 93 % | 73 s |
| 2 | 30 % | 3 % | **63 %** | 0 % | 0 % | 30 % | 53 % | 90 % | 100 % | 56 s |
| 3 | 13 % | 0 % | **63 %** | 0 % | 0 % | 20 % | 53 % | 83 % | 83 % | 71 s |
| 4 | 10 % | 3 % | **63 %** | 0 % | 0 % | 63 % | 57 % | 77 % | 93 % | 72 s |
| 5 | 47 % | 33 % | **60 %** | 13 % | 0 % | 60 % | 53 % | 90 % | 97 % | 54 s |
| 6 | 0 % | 0 % | **60 %** | 0 % | 0 % | 60 % | 40 % | 73 % | 93 % | 51 s |
| 7 | 37 % | 30 % | **57 %** | 20 % | 0 % | 57 % | 57 % | 100 % | 100 % | 55 s |
| 8 | 40 % | 40 % | **60 %** | 40 % | 0 % | 60 % | 57 % | 70 % | 73 % | 58 s |
| 9 | 50 % | 33 % | **63 %** | 20 % | 0 % | 63 % | 60 % | 73 % | 80 % | 52 s |
| 10 | 43 % | 43 % | **63 %** | 30 % | 0 % | 60 % | 60 % | 70 % | 77 % | 33 s |

## 4. Fights

| Wall | Arriving in last area's maxed Epics | Mid-geared (tuned) | Area average as played |
|---|---|---|---|
| 1 | 15.9 s, −20 % | 18 s, −20 % | 10.9 s, −10 % |
| 2 | 19.4 s, −27 % | 18 s, −20 % | 11.2 s, −5 % |
| 3 | 19.4 s, −29 % | 17.8 s, −20 % | 12.9 s, −8 % |
| 4 | 19.1 s, −25 % | 18 s, −20 % | 14.9 s, −10 % |
| 5 | 20 s, −27 % | 18 s, −20 % | 14 s, −9 % |
| 6 | 19.7 s, −27 % | 18.1 s, −20 % | 15 s, −10 % |
| 7 | 19.2 s, −25 % | 18 s, −21 % | 15.1 s, −9 % |
| 8 | 19.6 s, −25 % | 18 s, −20 % | 18.1 s, −6 % |
| 9 | 19.9 s, −26 % | 18 s, −20 % | 15.2 s, −8 % |
| 10 | 18.7 s, −23 % | 17.9 s, −20 % | 14.9 s, −4 % |

## 5. Enemy numbers this needs (multipliers on today's formula)

| Wall | Pack health × | Pack damage × | Boss health × | Boss damage × | XP per level |
|---|---|---|---|---|---|
| 1 | 11.163 | 2.54 | 2.242 | 1.4973 | 4,568 |
| 2 | 13.017 | 1.702 | 2.3512 | 1.5333 | 3,260 |
| 3 | 14.069 | 1.962 | 2.8739 | 1.6953 | 7,954 |
| 4 | 12.855 | 1.669 | 2.242 | 1.4973 | 11,704 |
| 5 | 12.022 | 1.426 | 1.8149 | 1.3472 | 11,699 |
| 6 | 11.472 | 1.355 | 1.7034 | 1.3052 | 19,405 |
| 7 | 11.259 | 1.349 | 1.5245 | 1.2347 | 61,862 |
| 8 | 9.721 | 1.049 | 1.0987 | 1.0482 | 65,416 |
| 9 | 8.325 | 1.198 | 0.9782 | 0.989 | 41,780 |
| 10 | 9.022 | 1.112 | 0.8173 | 0.9041 | 325,222 |

## 6. Other seeds and players

| Player | Seed | Cleared | Hours | Days | Runs | Wipes | Legendaries | Mythics |
|---|---|---|---|---|---|---|---|---|
| Efficient | 1 | yes | 82.7 | 24 | 1158 | 213 | 34 | 12 |
| Efficient | 2 | yes | 77 | 22 | 1094 | 195 | 36 | 11 |
| Casual (2 h) | 1 | yes | 155.8 | 75 | 1025 | 169 | 47 | 5 |