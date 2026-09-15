# Milestone 2 — "The climb has identity" (plan, 2026-09-15)
*Design Chat. M1 gave us one real area. M2 makes runs differ from each other and gives Worldvein its permanent sinks. Locks are written in this order; each lock becomes one or two briefs.*

| # | Lock (Design Chat writes) | Brief outcome (Claude Code builds) |
|---|---|---|
| 1 | **Enemy rosters, areas 1–3** — 4 enemy types per area with one behaviour each, rare identities, the three area bosses with one mechanic each (Brinewarden, Skarra, Harbormaster), named-variant adjectives | enemy data + behaviours in `simulate`, boss mechanics, roster-driven names in feed/log/results, enemy stage art slugs |
| 2 | **Class gems live** — drops from rares (§6d RNG, no pity), gem inventory, equip one per Adventurer in Party, crossing/matching rule in `derive`, the **40-pt tree screen** (contents already locked), points bought with Worldvein (cost curve) | `GemTreeScreen`, gem drop + equip, procs/finishers wired into the resolver with tests per node |
| 3 | **Veinbinder trees** — Bond (party stats) + Craft (economy) node contents and costs; **Player tab** layout | `PlayerScreen` with two trees, effects applied in derive/AFK/loot |
| 4 | **Areas 2–3 open** — tier bands, balance gates per area (same shape as §8), material tiers Fine, area-2/3 boss unlock flow on the island | gates as tests, unlock persistence |
| 5 | **First-run onboarding** — five contextual prompts (first explore, first fight, first extract, first Smith, first gem) | tooltip system + copy |
| 6 | **Playtest tuning pass** from Anthony's area 1–3 runs | bug/tuning brief |

**Milestone 3 (later):** areas 4–9 with the court bosses and court-art gems, Vaelyx, market dynamics, weapon skill trees, Capacitor iOS build + TestFlight.
