# BRIEF — Route map: Explore/Cancel commitment model, camera framing, slower travel, recentre under overlay

**Status:** DONE (Claude Code, 2026-09-13, PR #33 `feat(route): explore/cancel commitment model, camera framing, slower travel, recentre under overlay`) · **Date:** 2026-09-13 · **Author:** Claude Design Chat  
**Spec:** `docs/Eldrathor_RouteMap_v3_Travel_Lock.md` §15–§17 (authoritative; supersedes §1, §14 timing, v2 §2)

## Deliverables
0. **Three node states only** (§15 table): `unexplored` / `revealed` / `completed`. Unexplored nodes render identically regardless of type — **remove every auto-mark** of rares, boss, crystal, sanctuary, named on unexplored nodes (icons, colours, chains, skulls, halos). Type icons appear only once `revealed`. Completed tap = no-op (no info card).
1. **Interaction model** (§15): tap never moves the party. Unknown node → `ExploreCard` (Explore/Cancel). Explore → travel → scout on arrival → `RevealCard` (Fight/Flee; Sanctuary: Use/Leave). Chosen Flee = step back to the previous node, no roll. Completed node tap → nothing (delete `NodeInfoCard` if built). Revealed node tap → reveal card if adjacent, else Explore/Cancel. Boss/rares/crystal/sanctuary hidden until explored; seal card only on a revealed boss; rares roam only across unexplored/revealed nodes and update the icon only on revealed nodes; drop the lit-path-to-boss. Remove the "tap cleared node to travel" behaviour.
2. **Travel** (§16): 600 ms/hop, continuous tween, skip = 250 ms ease.
3. **Camera framing** (§17): far-node framing in the upper 60% with the card below; adjacent → frame party + node; **recentre on the party under the overlay before Results/Sanctuary fade out**. Keep the existing test that the camera is on the party after Continue (now: on the party's *new* node).
4. Run log lines for Explore / Cancel / Flee (chosen) / Fight.

## Test plan (phone)
Tap a far unknown node → camera frames it, card below, party doesn't move; Cancel → nothing moved. Explore → party glides there at ~0.6 s/hop, scouts, reveal card; Flee steps back; Fight opens the overlay; Continue reveals the map already centred on the fought node with one fade. Rares, boss, crystals and sanctuaries are NOT visible on unexplored nodes — every unexplored rune looks the same. Flee leaves the node revealed with its icon. Tap a completed node → nothing. Build + tests green.

PR: `feat(route): explore/cancel commitment model, camera framing, slower travel, recentre under overlay`
