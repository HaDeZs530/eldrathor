# Claude Code — start here (home handoff)

**Updated:** 2026-09-11 by Claude Design Chat  
**Repo:** `HaDeZs530/eldrathor` · Agent split: Design Chat locks + briefs; **you code**; Grok = art.

## First 60 seconds
1. `git pull` on `main`.
2. Read `CLAUDE.md` + `docs/SESSION_LOG.md`.
3. Work the **active briefs** below in order (unless Anthony says otherwise).
4. Open PRs; don't invent LOCKED design — use `// DESIGN-OPEN:` for gaps.

## Active briefs (priority)
0. **`docs/CLAUDE_BRIEFS/2026-09-16_mode-tokens-fix.md`** — Exploration screens fall back to Town brown; per-mode token sets. FIRST.
1. **`docs/CLAUDE_BRIEFS/2026-09-16_m2-1-item-model.md`** — M2 lock 1, confirmed by Anthony. Spec: `Eldrathor_Item_Model_Lock.md`.

## Recently DONE (don't redo)
- PR #58 — tab re-tap pops to root: Town → Harbor, Party → roster, Player / Hearth → root, Mountain → island from Rally, stays on the route map during a run.
- PR #57 — cleaning pass (Anthony, phone): one "N art pending" pill per screen with a tap-to-list sheet instead of chip lists; quiet fight-stage placeholder; island pin labels as cream Cinzel with a halo (no boxes); enemy slug fix (Hollow Warden).
- PR #56 — Tuning pass 2: Renewal 1 %/3 s, Mend 30 / 7 s, Guardian 8 %; boss dmg ×7 with hp raised to ×62 (fresh 0/10, L5 10/10 in ~57 s; cap test: no boss hit > 40 % of a Bulwark's HP); Seam → Hearth everywhere; `town/recipes.js` Wardplate / Veinweave with rolled ratings + floor 1 ❖ × rarity; `AFK_TUNING` table.
- PR #55 — §D: `modeColumn()` + `Sheet` reads the column from ThemeProvider at open and freezes it; `.eld-mode-veinharbor / -explore / -mind` scoped token blocks in `ui.css`; overlay scoped Mind View, route cards Exploration; verified three distinct sheet fills over Town / Route map / Fight.
- PR #54 — M1d: GitHub Actions CI (lint, build, tests on PRs + main; check `build-and-test` — **Anthony: enable the main ruleset requiring it**), the `|| true` assertion fixed, Node 24 pinned, DEV_SETUP refreshed (+ `npm run dev:phone`), trace receiver hardened (body limit, retention, async, LAN-only), trace build hash + run-start snapshot + 1500-event ring, PR #15 closed, Handoff Doc rewritten, 20 briefs archived, app/README replaced.
- PR #53 — M1c: AFK jobs are true idle — timestamped accrual (`reconcileAfk`: every complete cycle in the span, remainder carried, clean stop at exhaustion), reconciled on tick / resume / open, Offline summary sheet after > 60 s, deploy suspends jobs and return resumes them, deployed Adventurers can't be assigned.
- PR #52 — Style Bible chrome: tokens + three mode stylesheets to §A (Cinzel once, Press Start 2P gone), shared ui components (Frame/Header/Panel/Buttons/Bar/DestinationRow/PartyCard/Sheet), art manifest (63 files, `app/public/art/`) with labelled placeholders wired into every slot; route map on the parchment/biome/fog stack with ink-dotted paths; fight stage = enemy backdrop + overlaid HP bars. Five Town PNGs present at legacy sizes; everything else pending.
- PR #51 — M1b: rarity ladder (Mythic → Legendary) + §2 loot roll, fight/Train XP per §3 with level-ups on Results/run log, equipment that applies (weapon item rating+empower, body armor) with a swap diff on the Party sheet, Smith empowerment bench per §4 (merge removed), additive crit fix, no archetype editing + name validation + "Coming — not yet active" tags, enforced §8 balance gates — boss retuned to ×22 hp / ×20 dmg (Combat v2 Lock §4 superseded; Design Chat to amend). New game starts at level 1 with equipped Common starters (rating 30 DESIGN-OPEN). Save v2.
- PR #50 — M1a: permanent ids on Adventurers/weapons/armor, versioned save `eldrathor.save.v1` with migrations + quarantine, debounced save/resume incl. the active run (counted RNG), Menu → Settings export/import/reset
- PR #49 — Veinharbor artwork live in all five Town slots (originals in `app/art-src/town/`)
- PR #48 — Veinharbor visual pass rev 1 (ChatGPT visual spec): viewport fit (no document overflow), harbor hero + four illustrated destination rows, Back to Veinharbor, Town-scoped Cinzel/gold treatment, art slots pending (`app/public/town/`). Lock note: Town typography/chrome now diverges from the micro-pixel kit in the Dual-Mode Art Lock — Design Chat to amend.
- PR #47 — gold ring party marker (§18): 44 px ring + bobbing pennant around the occupied node, node icon stays visible; §19 seal remnants removed for good (`isSealed`, `sealBroken`, `is-unsealed`, comments, test names)
- PR #58 — tab re-tap pops to root
- PRs #50–#54 — Milestone 1 (save/ids, progression chain, style bible chrome, true-idle AFK, CI/hygiene)
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
- PR #22 — UI shell
- PRs #23–#45 — route map v3 series (travel, states, camera, no respawns, no seal, run log)
- PR #58 — tab re-tap pops to root
- PRs #50–#54 — Milestone 1 (save/ids, progression chain, style bible chrome, true-idle AFK, CI/hygiene)
- PR #46 — bug-fix pass 1 · #47 — ring marker + seal cleanup · #48 — Veinharbor visual pass rev 1
- PR #23 — route map v3: one-tap travel, node visual states, ambush flee, Mind-view scale, fight order
- PR #24 / #25 — Mind-view scale on Player / Party / Seam; Party stat sizes
- PR #26 — v3 amendments: no respawns, free travel, named at generation, full-screen map + 44 px HUD
- PR #27 / #28 — camera margin so the party marker is never under the HUD/toast (fogged parchment margin)
- PR #29 — route polish 2: run log sheet + badge + toast, node scale (40/34/26), planar outward generator (Gabriel + band-filtered, 200-map crossing test), 350 ms glide + eased camera follow

## Still OPEN (Anthony deciding / later)
- ~~AFK root tab final name~~ — **Hearth** (Progression Loop Lock §9, shipped #56)
- Rally / Prepare-the-bond screen title
- Gem tree screen; enemy rosters per area; weapon skill trees (Design Chat specs next)
- Note: A1/A3 were re-ruled 2026-09-12 — scouting replaces cut-flee; all 9 pins are areas (`Eldrathor_Island_Areas_Lock.md`).
- Note: 2026-09-14 Anthony ruled **no boss seal** (rares are optional hunts) and **boss = end of the road** (PR #42/#44) — v2 lock rares+seal and v3 §15 sealed-boss lines need updating by the Design Chat.

## Playtest
Phone: `cd app && npm run dev -- --host` → LAN URL (or `npm run dev:phone` once PR #15 lands for a QR code). Island pans + zoom toggle; route map fills the screen.
**Debug trace (PR #39/#41):** ☰ Menu → Debug trace → Turn on; play. On the dev server it auto-saves to `app/playtest-traces/latest.txt` (git-ignored) — Claude Code reads it directly; Copy/paste is the fallback. Format + reading guide: `docs/DEBUG_TRACE.md`.

## Rules reminder
Weapons drop / armor craft; Worldvein currency; tab bar stays during runs; themes crossfade; no new deps without reason.
