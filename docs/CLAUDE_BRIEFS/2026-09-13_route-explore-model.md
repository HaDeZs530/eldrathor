# BRIEF — Route map: Explore/Cancel commitment model, camera framing, slower travel, recentre under overlay

**Status:** READY · **Date:** 2026-09-13 · **Author:** Claude Design Chat  
**Spec:** `docs/Eldrathor_RouteMap_v3_Travel_Lock.md` §15–§17 (authoritative; supersedes §1, §14 timing, v2 §2)

## Deliverables
1. **Interaction model** (§15): tap never moves the party. Unknown node → `ExploreCard` (Explore/Cancel). Explore → travel → scout on arrival → `RevealCard` (Fight/Flee; Sanctuary: Use/Leave). Chosen Flee = step back to the previous node, no roll. Cleared node tap → `NodeInfoCard`, no movement. Sealed boss → seal card. Remove the "tap cleared node to travel" behaviour.
2. **Travel** (§16): 600 ms/hop, continuous tween, skip = 250 ms ease.
3. **Camera framing** (§17): far-node framing in the upper 60% with the card below; adjacent → frame party + node; **recentre on the party under the overlay before Results/Sanctuary fade out**. Keep the existing test that the camera is on the party after Continue (now: on the party's *new* node).
4. Run log lines for Explore / Cancel / Flee (chosen) / Fight.

## Test plan (phone)
Tap a far unknown node → camera frames it, card below, party doesn't move; Cancel → nothing moved. Explore → party glides there at ~0.6 s/hop, scouts, reveal card; Flee steps back; Fight opens the overlay; Continue reveals the map already centred on the fought node with one fade. Tap a cleared node → info only. Build + tests green.

PR: `feat(route): explore/cancel commitment model, camera framing, slower travel, recentre under overlay`
