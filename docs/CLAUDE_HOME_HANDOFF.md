# Claude Code — start here (home handoff)

**Updated:** 2026-09-17 by Claude Design Chat  
**Repo:** `HaDeZs530/eldrathor` · Agent split: Design Chat locks + briefs; **you code**; Grok = art.

## First 60 seconds
1. `git pull` on `main`.
2. Read `CLAUDE.md` + `docs/SESSION_LOG.md`.
3. Work the **active briefs** below in order (unless Anthony says otherwise).
4. Open PRs; don't invent LOCKED design — use `// DESIGN-OPEN:` for gaps.

## Active briefs (priority)
0. _(empty — every queued brief is done. Waiting on the Design Chat: the lattice lock-conflict ruling (PR #70), `data/weaponNames.js` + boss weapon names, the readings flagged in PRs #69–#71, and art for `icon-job-*`.)_
0. ~~`2026-09-19_m2-3-player-resonance.md`~~ (DONE #71 — Resonance, ranks I–X, rank-capped Bond / Craft upgrades, Player tab; archived)
0. ~~`2026-09-19_m2-2-lattice-gems.md`~~ (DONE #70 — lattice engine, class gems live, gem-bound fragments, lattice screen; **lock conflict flagged: 40 hexes vs the 16 July facets / 40 imbues — 24 hexes ship dormant**; archived)
0. ~~`2026-09-19_open-numbers.md`~~ (DONE #69 — sell formula, core drop / gather rates, Mythic Core chance, recruit pricing, Mythic-T1 test, Style Bible headings; archived)
0. ~~`2026-09-17_ui-brackets-v2.md`~~ (DONE #67 — Party / Player / Settings → Mind View, Hearth = Veinharbor + Mythros accents, Bond / Veinbinder retired; captures in `docs/art/captures/2026-09-17-ui-brackets-v2/`; archived)

## Recently DONE (don't redo)
- PR #71 — M2 lock 3, the Veinbinder grows: `player/resonance.js` (Resonance = Σ √level over the whole roster, ranks at 0·8·14·22·32·44·58·74·92·112), `player/upgrades.js` (`PLAYER_TUNING`: Bond Vitality / Might / Ward / Tempo / Grace / Keen / Flow, Craft Yield / Vein / Fortune / Haste / Hearth; cost `50 × 1.25^n`; level cap = rank, Hearth also ≤ 8; `canBuy` states its reason). Effects: Bond rides on every Adventurer through `equip(member, bag, bond)` → `deriveStats` (+ the test-numbers breakdown); Craft → gather yield with a carried fraction, `rollRewards({ veinMult, oneUpChance })`, Process cycle time, +1 Gather slot at Hearth 4 and 8. Player tab rebuilt (Resonance, rank, bar + threshold, rows `Might lvl 3/4 +6% Power · Buy 98 ❖`, rank-up glow, placeholder tiles gone), help copy rewritten. Save v6 (`player.upgrades`). 148 tests. **Design Chat to confirm:** Ward / Keen read as percentage points; Bond × gem are separate factors; Hearth slot = Gather slot.
- PR #70 — M2 lock 2, class gems on the lattice: generic `lattice/engine.js` (adjacency-only gating, exclusive finisher + swap, `canImbue / imbue / derive / summary`), `lattice/hexLayout.js` (Core + 6 + 12 + 18 + 4 compass finishers, two opposite ring-2 procs), `lattice/classGems.js` (one `GEM_TUNING` table, four class lattices), `progression/gems.js` (gem items, drops rares 20 % / bosses 35 % / named +10 %, crossing / matching, amplifier `1 + 0.5 × imbues/40`, gem-bound fragments). Combat: stat facets via `deriveStats`, Core abilities, eight procs, eight finishers as `gem` / `proc` / `finisher` feed events; no gem → bit-identical fights (gates unchanged). Fragments: 1 per level-up to the WORN gem from fights and Train. UI: Gems filter + gem rows, gem sheet, live Gem slot, Lattice screen (Mind View, SVG hexes, pan / pinch, facet sheet, swap), third ability button. Save v5. 131 tests. **LOCK CONFLICT for the Design Chat:** the lock's 40 hexes × 3 levels cannot hold "exactly the July lists" (16 facets = 40 imbues, which the cost curve, `[12/40]` and the matching formula are calibrated to) — shipped as the full geometry with the 16 July facets written and 24 hexes dormant (E / W finisher hexes included); filling them is a data edit in `classGems.js`. Other DESIGN-OPEN reads are listed in the PR (Taunt / Control Strength, Onslaught ramp rate, Lifevein trigger, Chains L1, Ember Brand base, additive crit damage).
- PR #69 — open numbers: sell `5 × rarityIndex² × (1 + rating/200)` floored (materials `1 × rarityIndex`); Artifact Core 8 % rares / 20 % bosses in areas 8–9 only, plus 1 per 2 h gathered there (slot `coreMs`, Offline summary line); Mythic Core 25 % per Vaelyx kill (`rollRewards({ vaelyx })`, no encounter yet); recruit free ×3 then 50 × (hired − 2); Mythic-T1 test restated like for like; Style Bible §A / §D headings mirror the four brackets. **Design Chat to confirm:** `rosterSize` read as recruits hired (first paid = 50 ❖); polished Mythic T1 (3.46) still passes an unpolished T3 Common (3.24). Candidate names wait on `data/weaponNames.js`.
- PR #67 — UI brackets v2 (revised lock, Anthony's phone ruling): **two brackets plus parchment.** Party + Adventurer sheet + roster and Player + Settings render the Mind View column (same tokens as Fight; Party root uses the fight PartyCard treatment); Hearth + Offline summary = Veinharbor base with Mythros `#2cabf8` on the active segment, progress bars, job timers, Worldvein counter and a glow on running job cards only; The Bond / The Veinbinder and their motifs deleted. Mechanism: ThemeProvider puts `eld-col-<column>` on the root and `mind.css` keys on `.eld-col-mind`; `MODE_COLUMNS` is four; §D scopes are four repeated classes (a pinned sheet now wins on shadow too). Tests: Menu over Party === Menu over Fight; Hearth shares Veinharbor's fill and differs only by accent. Captures in `docs/art/captures/2026-09-17-ui-brackets-v2/`.
- PR #66 — UI brackets (UI Brackets lock): Party → **The Bond** (copper / ember, firelight under-glow + three embers), Player + Settings → **The Veinbinder** (amethyst, rune-ring watermark, Worldvein `#c9a6ff`), Hearth + Offline summary → **The Hearth** (verdigris / bronze, smoke wisp, job tool glyphs). `MODE_TOKENS` / `MODE_COLUMNS` are six; `TAB_HUB_SKIN` party → bond, player → veinbinder, afk → hearth; `bond.css` / `veinbinder.css` / `hearth.css`; three new `.eld-mode-*` scopes → six distinct sheet fills + six Menu panels (tested); Settings and Offline pinned to their bracket wherever opened; Bag picker + Recruit inside Party stay Veinharbor; `.eld-tab-view` 250 ms crossfade. Captures in `docs/art/captures/2026-09-17-ui-brackets/` — **Anthony approves from those.** DESIGN-OPEN: `icon-job-*` art (glyph fallback shown).
- PR #65 — item numbers + names: tierMult 1.8^(T−1), rarityMult 1.158^rung, rating +15 % / empower +25 % polish; Gullwatch…Worldforge armor names; `data/bossWeaponNames.js` placeholders; save v4 with the §9 wipe policy (migrations removed); enemy hits in the feed with raw → mitigated; Settings → Show test numbers. Gates unchanged. **Design Chat:** T1 Mythic at 100/+100 edges past a T3 Common (3.46 vs 3.24) — the one exception to the brief's test.
- PR #63 / #64 — Host mode: this PC hosts the phone dev server; the scheduled task "Eldrathor dev keep-alive" (every 2 min) fast-forwards a clean `main` and restarts the server if down, so any merged PR is live on the phone in ~2 min. `npm run dev:phone:bg` / `host:register`. Rule: this Claude Code session pushes the PRs; the remote session is the backup. Return the checkout to `main` after every PR or the host stops pulling.
- PR #61 — M2 lock 1, the item model: seven rungs + the two-axis power formula in `progression/items.js`, six equip slots, Artifact-from-any-area drops, area-gated crafting with the Smith's Core upgrade bench, the §7 Train cap, save v3 (one bag), and the Bag / item sheet / character-slot / Roster UI. 101 tests; the §8 balance gates pass with no enemy retune.
- PR #59 — per-mode token sets, no Town fallback: `MODE_TOKENS` in `theme/styleBible.js` is the full 38-token set per column and the one source for the mode stylesheets and the §D scopes; new `theme/explore.css` (Exploration out of `hub.css`, which now defines no mode token); every `--eld-*` read with NO fallback, so a missing token fails loudly instead of going Town brown; `.eld-dest-sub`, `.eld-btn.is-active` and the island's locked pins de-browned; Island / Rally / route map pinned to `.eld-mode-explore` (the map stays Exploration under a Mind View fight overlay); `modeTokens.test.js` resolves the real cascade and asserts three distinct panel fills + three distinct Menu panels.
- PR #59 — per-mode tokens · PR #61 — item model (M2 lock 1)
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
- PR #59 — per-mode tokens · PR #61 — item model (M2 lock 1)
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
- PR #59 — per-mode tokens · PR #61 — item model (M2 lock 1)
- PR #58 — tab re-tap pops to root
- PRs #50–#54 — Milestone 1 (save/ids, progression chain, style bible chrome, true-idle AFK, CI/hygiene)
- PR #46 — bug-fix pass 1 · #47 — ring marker + seal cleanup · #48 — Veinharbor visual pass rev 1
- PR #23 — route map v3: one-tap travel, node visual states, ambush flee, Mind-view scale, fight order
- PR #24 / #25 — Mind-view scale on Player / Party / Seam; Party stat sizes
- PR #26 — v3 amendments: no respawns, free travel, named at generation, full-screen map + 44 px HUD
- PR #27 / #28 — camera margin so the party marker is never under the HUD/toast (fogged parchment margin)
- PR #29 — route polish 2: run log sheet + badge + toast, node scale (40/34/26), planar outward generator (Gabriel + band-filtered, 200-map crossing test), 350 ms glide + eased camera follow

## Still OPEN (Anthony deciding / later)
- **Item Model lock §6 needs amending (Design Chat):** Anthony ruled the equip flow from the phone on 2026-09-19 — tapping ANY slot, filled or empty, opens the list of what fits; a row prompts Equip / Cancel; a filled slot then asks "Replace <current> with <new>?" OK / Cancel. The lock still says "tap a filled slot → that item's sheet". Shipped in the equip-flow PR; `progression/equipFlow.js` carries the rule and its tests.
- ~~UI mode ownership~~ — resolved by `Eldrathor_UI_Brackets_Lock.md` (one owning table); shipped in #66, revised on Anthony's phone ruling in #67 (four brackets). Style Bible §A's "Veinharbor (Town / Party / Player)" heading is stale — Design Chat to amend to the four-bracket table.
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
