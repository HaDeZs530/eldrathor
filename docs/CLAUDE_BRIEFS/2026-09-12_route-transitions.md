# BRIEF — Route transitions: map persists under fight overlays; continuous travel tween

**Status:** READY · **Date:** 2026-09-12 · **Author:** Claude Design Chat  
**Spec:** `docs/Eldrathor_RouteMap_v3_Travel_Lock.md` §13–§14 (authoritative)

## Deliverables
1. **Overlay architecture** (§13): keep `RouteMapScreen` mounted for the whole run; render Fight, Results, Sanctuary and all cards as overlays in a layer above it (same React tree, `position: fixed` layer, Mind-view crossfade 350 ms). Move camera/pan state into `routeState` so nothing resets. Returning from Results must not trigger any camera move — assert it in a test (camera before fight === camera after Continue).
2. **Continuous travel tween** (§14): replace per-hop animation with one path tween over the polyline at 450 ms/hop, ease-in-out at ends only; camera tied to the same tween per frame; no final snap; skip = 200 ms ease.
3. Remove any `scrollIntoView` / recenter call on route map mount or on return from fight.

## Test plan (phone)
Fight → Continue: map is exactly where it was, one fade, no flicker, no recenter. Travel across 10 nodes is one smooth glide, marker stays centred, last hop lands without a jump. Build + tests green.

PR: `fix(route): persistent map under fight overlays, continuous travel tween`
