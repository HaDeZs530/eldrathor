# Claude Code — start here (home handoff)

**Updated:** 2026-09-11 by Claude Design Chat  
**Repo:** `HaDeZs530/eldrathor` · Agent split: Design Chat locks + briefs; **you code**; Grok = art.

## First 60 seconds
1. `git pull` on `main`.
2. Read `CLAUDE.md` + `docs/SESSION_LOG.md`.
3. Work the **active briefs** below in order (unless Anthony says otherwise).
4. Open PRs; don't invent LOCKED design — use `// DESIGN-OPEN:` for gaps.

## Active briefs (priority)
_(none queued — waiting on the Design Chat's next brief)_

## Recently DONE (don't redo)
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

## Playtest
Phone: `cd app && npm run dev -- --host` → LAN URL (or `npm run dev:phone` once PR #15 lands for a QR code). Island pans + zoom toggle; route map fills the screen.
**Debug trace (PR #39):** ☰ Menu → Debug trace → Turn on; play; Copy → paste to Claude Code with what felt wrong. Format + reading guide: `docs/DEBUG_TRACE.md`.

## Rules reminder
Weapons drop / armor craft; Worldvein currency; tab bar stays during runs; themes crossfade; no new deps without reason.
