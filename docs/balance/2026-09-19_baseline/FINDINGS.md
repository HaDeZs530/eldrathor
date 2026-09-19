# Baseline findings — what the simulator shows, and the levers that would fix it

*Claude Code, 2026-09-19. Companion to `BASELINE.md` (generated) and `baseline.json` (raw). Nothing in the game was changed. The numbers below are for the Design Chat and Anthony to rule on; every lever here is an option, not a decision.*

**Target:** 180–360 hours of play for the whole mountain, about 210 hours on the most efficient route.

## What happens today

| Play style | Mountain cleared | Median days | Median play hours | Against the 210 h target |
|---|---|---|---|---|
| Efficient (2× speed, quick decisions) | 3 of 3 seeds | 20 | 70 | 3× too fast |
| Typical (1× speed, clears most of each map) | 1 of 3 | 27 | 94 | stalls at the last boss in 2 of 3 |
| Casual (2 h a day) | 2 of 3 | 50 | 102 | — |
| Skips every fight | 3 of 3 | 41 | 142 | — |

The spread between seeds is as important as the median: the efficient route took 48, 70 and 135 hours on three seeds. The length of the game is currently decided by luck at one boss.

## The eight findings

1. **Areas 1–6 fall on the first day, in about two hours of play.** The target is roughly 23 hours per area. Six of nine areas currently take 5 to 40 minutes each.
2. **There is one wall in the whole game, and it is the last boss.** On the efficient route 55 of the 70 hours are spent in area 9. Areas 7 and 8 take about 6 hours each. Nothing before area 7 resists at all.
3. **Fights are over in under a second from area 5 onward.** Average fight length goes 4.2 s → 2.6 → 2.1 → 1.5 → 1.2 → 1.0 → 0.8 → 0.6 → 0.6. The watchable auto-battle the design calls for does not exist past the first area; at 2× speed a late fight is a single frame.
4. **Why: damage outgrows enemy health.** Enemy HP grows ×1.6 per area (×43 across the mountain). Weapon power grows ×1.8 per item tier (×19 by area 9), and then multiplies by rarity (up to ×2.1 for Artifact), empower (+25 %) and level (+145 % at level 30). Party damage goes from 45 to 13,300 — ×295. Health barely moves: 245 → 631 by area 8, because armor never arrives (finding 6).
5. **A fresh party beats the area-1 boss on its first run.** The balance gate tests a fresh level-1 party dropped straight onto the boss, and that still holds (it loses 9 in 10). But a real run clears the map first: the party arrives at level 3 with a sanctuary bonus and full health, and wins. The gate does not describe how the boss is actually met.
6. **Armor is the real gate, and it only comes from idle time.** Armor needs infused materials, which need Gather then Process at the Hearth. The party wears no armor at all through area 8 because the first eight areas fall before the Hearth has produced anything. What finally breaks the last boss is four armor pieces each: average health jumps from 631 to 3,097. So today the last wall is timed by the Hearth, not by play.
7. **Worldvein has no sinks.** The efficient route earns 2.5 million and spends 36 thousand on everything a player would choose to buy: upgrades 4,900, empowering 18,800, gem imbues 12,000. That is 1.4 % of income. All sixty upgrade levels available at rank V cost under 5,000 in total. Empowering a weapon to +100 costs about 6,500 and is done by area 6. The only thing that can absorb Worldvein is Process, at 5 ❖ a cycle, and only because the bot was told to cap it.
8. **Growth systems are either flooded or out of reach.**
   - **Gems:** 526 class gems found in one playthrough (20 % from rares, 35 % from bosses, and every map has two or three rares). A gem is meant to be a rare, cherished thing.
   - **Levels:** the party ends at 33. The XP curve (×1.35 per level) needs 2.3 million XP for level 31 and 695 million for level 50, against 308 XP per enemy in the last area. The level cap of 50 is unreachable by about three orders of magnitude.
   - **Resonance:** rank V of X with eight Adventurers at the end. Ranks VI–X need a roster the game gives no reason to build yet.
   - **Wipes:** 3 in 24,700 fights. A player who reads the threat badge is never in danger.

## Levers (options for a ruling)

**A. Decide the shape first: hours per area.** Everything else is tuned to hit it. One shape that sums to 210 hours and climbs steadily:

| Area | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| Target hours | 6 | 10 | 14 | 18 | 22 | 26 | 32 | 38 | 44 |

**B. Make every boss a wall, not only the last.** A wall needs the party to come back stronger, which means several runs of farming per area. Options: raise boss health and damage growth per area; require the map to be largely cleared before the boss can be engaged; or gate the boss on a party level.

**C. Bring damage and health back together.** Either slow the weapon curve (×1.8 per tier is the steepest number in the game), or raise enemy health growth to match it, or both. The aim is a stated fight length — for example 8–15 s for a pack and 45–90 s for a boss, at every tier.

**D. Give health a source that is earned by playing.** Today health comes almost only from armor, and armor almost only from the Hearth. Options: armor materials drop from fights as well; level gives more health than damage; Vitality matters more.

**E. Build real Worldvein sinks.** Costs that scale with tier: empowering, upgrades (the 50 × 1.25ⁿ curve is two orders of magnitude too cheap against this income), imbues, crafting fees, recruits. Or cut node income. The economy should be short of Worldvein most of the time.

**F. Make gems rare.** Something like one gem per area boss and a few percent from rares, or a pity timer, instead of 526 per playthrough.

**G. Re-cut the XP curve** so the cap is reachable on the timeline that is wanted — for example level 50 somewhere past the end of the mountain, as part of the long tail.

## How the tuning pass would work

1. Anthony and the Design Chat rule on the shape (A) and on which levers to use.
2. The harness gets a search mode: for each area it adjusts the chosen numbers until the efficient route lands on the target hours, with the typical route inside the 180–360 band and no seed stalling.
3. The agreed curve becomes enforced tests, one gate per area, run by `npm test` alongside today's area-1 gates. A gate reads: "the efficient route clears area N in X–Y hours over ten seeds, average pack fight A–B seconds, boss fight C–D seconds".
4. Rerun after every content change (`npm run sim:baseline` in `app/`).

## Caveats

- The bot is a good player, not a human. It never misreads a fight and never gets bored. Real times will be longer, which is why the target should be hit by the *efficient* route.
- Areas 2–9 use the placeholder enemy formula. Real rosters with their own mechanics will change fight lengths.
- Time counts playing only: fight playback, travel, a few seconds of decision per node, a short town visit per run.
