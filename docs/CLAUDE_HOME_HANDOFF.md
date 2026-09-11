# Claude Code — start here (home handoff)

**Updated:** 2026-09-11 by Claude Design Chat  
**Repo:** `HaDeZs530/eldrathor` · Agent split: Design Chat locks + briefs; **you code**; Grok = art.

## First 60 seconds
1. `git pull` on `main`.
2. Read `CLAUDE.md` + `docs/SESSION_LOG.md`.
3. Work the **active briefs** below in order (unless Anthony says otherwise).
4. Open PRs; don't invent LOCKED design — use `// DESIGN-OPEN:` for gaps.

## Active briefs (priority)
1. **`docs/CLAUDE_BRIEFS/2026-09-11_loop-cleanup-and-stat-spine.md`** ← do this first (removes flee, Difficulty→Rally, weapon-only drops, stat seeds in data).
2. **`docs/CLAUDE_BRIEFS/2026-09-11_playtest-ux-polish.md`** — skip its item 2 (Rally/Explore is now covered by brief 1) — pan-only mountain, Explore CTA, character create, AFK copy, Process pick+amounts, Train label.
3. **`docs/CLAUDE_BRIEFS/2026-09-11_island-dotted-path-10-nodes.md`** — 10 pins as path art, 6 tappable (see brief 1 §3). Check `IslandWorldMap` before rebuilding.

## Recently DONE (don't redo)
- PR #10 — pannable island + parchment node map
- PR #13 — island path lock/brief (docs/assets)
- PR #16 — node engage Attack/Flee + flee/ambush roll on fight screen
- PR #17 — home handoff + playtest polish brief

## Still OPEN (Anthony deciding / later)
- AFK **root tab** final name (working label **Seam** — do not rename until locked)
- Rally / Prepare-the-bond screen title
- Peninsula stamps; combat v2 (Design Chat writing the spec now); gem tree screen
- Audit rulings landed (A1 cut flee, A2 Rally screen, A3 6-of-10 tappable) — all in brief 1.

## Playtest
Phone: `cd app && npm run dev -- --host` → LAN URL. Mountain should pan; zoom off after polish brief.

## Rules reminder
Weapons drop / armor craft; Worldvein currency; tab bar stays during runs; themes crossfade; no new deps without reason.
