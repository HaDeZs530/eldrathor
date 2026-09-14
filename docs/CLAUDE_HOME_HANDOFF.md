# Claude Code — start here (home handoff)

**Updated:** 2026-09-11 by Claude Design Chat  
**Repo:** `HaDeZs530/eldrathor` · Agent split: Design Chat locks + briefs; **you code**; Grok = art.

## First 60 seconds
1. `git pull` on `main`.
2. Read `CLAUDE.md` + `docs/SESSION_LOG.md`.
3. Work the **active briefs** below in order (unless Anthony says otherwise).
4. Open PRs; don't invent LOCKED design — use `// DESIGN-OPEN:` for gaps.

## Active briefs (priority)
0. **Milestone 1 — one real area** (spec `docs/Eldrathor_Progression_Loop_Lock.md`), in order: `2026-09-14_m1a-save-and-ids.md` → `2026-09-14_m1b-progression-chain.md` → `2026-09-14_m1c-afk-true-idle.md` → `2026-09-14_m1d-engineering-hygiene.md`. Each its own PR; "next" takes the next one. — gold ring marker so the node icon stays visible; seal text cleanup. Spec: v3 lock §18–19.
_(none queued — waiting on the Design Chat's next brief)_

## Recently DONE (don't redo)
- PR #47 — gold ring party marker (§18): 44 px ring + bobbing pennant around the occupied node, node icon stays visible; §19 seal remnants removed for good (`isSealed`, `sealBroken`, `is-unsealed`, comments, test names)
- PR #46 — bug-fix pass 1: depth/named modifiers on normal enemies, single extraction credit, pointercancel + pointerId gestures, controls excluded from map gestures, owned theme timers, feed scroll by last event, run-party freeze (Party tab locked during a run, HP by character id), AFK one-job-per-id, one camera owner, pure updaters
- PR #33 — route explore model (v3 lock §15–17): three node states, nothing auto-marked, tap never moves the party (Explore/Cancel → travel → Fight/Flee), 600 ms/hop + 250 ms skip, §17 camera framing, recentre on the party under the overlay before it fades
- PR #31 / #32 — Rally: Explore under the lore; island map opens in Overview
- PR #30 — route transitions: map stays mounted under fight/results/sanctuary overlays (350 ms crossfade, camera untouched), one continuous 450 ms/hop travel tween, 200 ms skip (v3 lock §13–14)
- PR #10 — pannable island + parchment node map
- PR #13 — island path lock/brief (docs/assets)
- PR #16 — node engage Attack/Flee + flee/ambush roll on fight screen
- PR #17 — home handoff + playtest polish brief
- PR #18 — loop cleanup, Rally screen, stat spine
- PR #19 — combat v2
- PR #20 — playtest polish
- PR #21 — route map v2
- PR #22 — UI shell (zoom, help/menu; scale pass was insufficient → redone in v3 brief)
- PR #23 — route map v3: one-tap travel, node visual states, ambush flee, Mind-view scale, fight order
- PR #24 / #25 — Mind-view scale on Player / Party / Seam; Party stat sizes
- PR #26 — v3 amendments: no respawns, free travel, named at generation, full-screen map + 44 px HUD
- PR #27 / #28 — camera margin so the party marker is never under the HUD/toast (fogged parchment margin)
- PR #29 — route polish 2: run log sheet + badge + toast, node scale (40/34/26), planar outward generator (Gabriel + band-filtered, 200-map crossing test), 350 ms glide + eased camera follow

## Still OPEN (Anthony deciding / later)
- AFK **root tab** final name (working label **Seam** — do not rename until locked)
- Rally / Prepare-the-bond screen title
- Gem tree screen; enemy rosters per area; weapon skill trees (Design Chat specs next)
- Note: A1/A3 were re-ruled 2026-09-12 — scouting replaces cut-flee; all 9 pins are areas (`Eldrathor_Island_Areas_Lock.md`).
- Note: 2026-09-14 Anthony ruled **no boss seal** (rares are optional hunts) and **boss = end of the road** (PR #42/#44) — v2 lock rares+seal and v3 §15 sealed-boss lines need updating by the Design Chat.

## Playtest
Phone: `cd app && npm run dev -- --host` → LAN URL (or `npm run dev:phone` once PR #15 lands for a QR code). Island pans + zoom toggle; route map fills the screen.
**Debug trace (PR #39/#41):** ☰ Menu → Debug trace → Turn on; play. On the dev server it auto-saves to `app/playtest-traces/latest.txt` (git-ignored) — Claude Code reads it directly; Copy/paste is the fallback. Format + reading guide: `docs/DEBUG_TRACE.md`.

## Rules reminder
Weapons drop / armor craft; Worldvein currency; tab bar stays during runs; themes crossfade; no new deps without reason.
