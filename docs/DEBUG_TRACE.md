# Debug trace — playtest event log (added 2026-09-14, PR #39)

A developer/playtest trace, separate from the player-facing **run log** (📜 on the HUD strip). It exists so a phone playtest can be pasted back to Claude Code as text instead of described from memory.

## How to use it (Anthony)
1. ☰ Menu → **Debug trace** → **Turn on**. It stays on across reloads (stored in the browser's localStorage) until you turn it off.
2. Play. Everything below is recorded into a ring buffer of the last **600** events, also persisted so it survives a reload or a run ending.
3. When something feels wrong, note roughly what you did (e.g. "tapped the far node then Explore — the swing back"), then ☰ → Debug trace → **Copy** and paste the text to Claude Code together with that note. **Clear** empties the buffer before a fresh attempt.
   - On plain `http://` over the LAN the clipboard API is unavailable on iOS; the sheet then selects the text in the box for a manual copy (long-press → Select All → Copy).

## What is recorded (one line per event: `time +delta kind key=value …`)
| kind | when | fields |
|---|---|---|
| `trace` | trace turned on / restored | `ua`, `vp` (viewport), `dpr` |
| `tab` | tab bar / menu navigation | `id` |
| `island` / `rally` | pin tapped / Rally back | `pin`, `name` |
| `run` | run start / extract | `start`, `seed`, `nodes`, `rares`, `entrance` · `extract`, `vein` |
| `gesture` | pointer up on the route map | `tap=empty` (tap on nothing), `tap=skip-travel`, or `drag=[x,y] px=` |
| `tap` | a node tap resolved | `node`, `state` (unexplored / revealed / completed), `type` (`hidden` until revealed), `adjacent`, `card` (explore / reveal) or `ignored=` (party-node, completed, busy, ambush-open) |
| `pan` | camera pan requested by a tap | `cause=tap node from=[x,y] to=[x,y] px ms=900` (or `px=0` = no move needed) |
| `camera` | every camera reducer action | `type` (set / runStart / overlayClose / drag / release / travelEnd), `to`, `motion`, `party` |
| `card` | a card button pressed | `action` (explore / cancel / fight / flee / use / leave / stepBack / ambushFight / ambushFlee), `kind`, `node` |
| `trip` | travel planned / skipped / arrived | `start`, `to`, `hops`, `ms`, `after` · `skip=true` · `arrived`, `elapsed`, `skipped` |
| `tween` | the map's frame-by-frame tween | `start=[pan] marker=[pos] hops ms` · `arrived elapsed frames camPx maxStep skipped` · `settled settleMs pan restPx` |
| `camjump` | a single tween frame moved the camera > 40 px | `px`, `frameMs`, `at` (ms into the trip) — **this is what a "jump" looks like** |
| `longframe` | a frame gap > 50 ms while the page is visible | `ms` — **this is what "laggy" looks like** |
| `ambush` | a roaming rare lands on the party | `node`, `kind`, `prev` |
| `overlay` | fight / results / sanctuary opened or closed | `open=fight node type win durMs ambush` · `open=results` · `open=sanctuary` · `close=loot|sanctuary fadeMs` |

Positions are sheet-space pans in CSS px (the map's `translate3d`), rounded to 0.1.

## Reading a trace (Claude Code)
- A **jump** = a `camjump` line, or a `pan` with a large `px` and a small `ms`, or a `camera type=set` whose `to` differs a lot from the previous `tween settled pan`.
- A **swing back** on Explore = `tween start=[pan]` far from the previous `pan to=[…]`.
- **Lag** = clusters of `longframe`, usually right after `overlay open` or when many nodes are revealed.
- `tap … ignored=…` lines show taps that did nothing and why.

## Code
- `app/src/debug/trace.js` — ring buffer, localStorage persistence, `trace(kind, data)`, text formatter, long-frame monitor. `trace()` returns immediately when off.
- `app/src/debug/DebugTraceSheet.jsx` — the ☰ sheet (toggle / copy / clear / text box).
- Hooks: `AppRoot.jsx` (tabs, island, rally, run, taps, cards, camera dispatch, trips, overlays, ambush, extract) and `map/RouteMapScreen.jsx` (gestures, tap pans, tween start / arrival / settle / jumps).
