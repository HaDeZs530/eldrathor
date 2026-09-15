# BRIEF — Tapping a tab always returns to that tab's root
**Status:** DONE (Claude Code, 2026-09-15, PR #58 `fix(nav): tab re-tap pops to root`) · **Date:** 2026-09-15 · **Author:** Claude Design Chat
Standard iOS behaviour: tapping the active tab pops its stack to root. Town → Harbor landing (from Crafter/Smith/Market); Party → roster; Player → root; Hearth → root; Mountain → island map **unless a run is active** (then the route map is the root; Extract is the only way back to the island). Scroll position resets to top on re-tap. Tab-switching still preserves each tab's sub-state as today. Test: from Crafter, tap Town → Harbor landing; from the route map mid-run, tap Mountain → stays on route map.
PR: `fix(nav): tab re-tap pops to root`
