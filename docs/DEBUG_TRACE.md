# Debug trace — playtest event log (added 2026-09-14, PR #39)

A developer/playtest trace, separate from the player-facing **run log** (📜 on the HUD strip). It exists so a phone playtest can be pasted back to Claude Code as text instead of described from memory.

## How to use it (Anthony)
1. ☰ Menu → **Debug trace** → **Turn on**. It stays on across reloads (stored in the browser's localStorage) until you turn it off.
2. Play. Everything below is recorded into a ring buffer of the last **1500** events (M1d; was 600 — a run's opening was scrolling out), also persisted so it survives a reload or a run ending. The header and every `trace` line carry the **build** (git short hash @ build time), and a `snapshot` line at run start records the party (level, weapon, armor), banked Worldvein and unlocks.
3. **Auto-save (PR #41):** when the app is served by the dev server (the phone playtest), the trace is POSTed to it every ~3 s while recording (and immediately when the app goes to the background), and lands in the repo checkout at `app/playtest-traces/latest.txt` (+ one file per app session, `app/playtest-traces/<session>.txt`). The sheet shows "Auto-saved Ns ago → file". So: play, then just tell Claude Code what felt wrong and roughly when — it reads the file itself. **Save now** forces an upload. The folder is git-ignored (local to the machine running the dev server). Nothing is uploaded from a production build.
4. Fallback without the dev server: ☰ → Debug trace → **Copy** and paste the text to Claude Code. **Clear** empties the buffer before a fresh attempt.
   - On plain `http://` over the LAN the clipboard API is unavailable on iOS; the sheet then selects the text in the box for a manual copy (long-press → Select All → Copy).

## What is recorded (one line per event: `HH:MM:SS.mmm time-since-load +delta kind key=value …`)
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
| `longframe` | a frame gap of 50 ms – 1 s while the page is visible | `ms` — **this is what "laggy" looks like** |
| `paused` | a frame gap ≥ 1 s | `ms` — the app was backgrounded / the phone locked; not lag |
| `ambush` | a roaming rare lands on the party | `node`, `kind`, `prev` |
| `overlay` | fight / results / sanctuary opened or closed | `open=fight node type win durMs ambush` · `open=results` · `open=sanctuary` · `close=loot|sanctuary fadeMs` |

Positions are sheet-space pans in CSS px (the map's `translate3d`), rounded to 0.1.

## Reading a trace (Claude Code)
- A **jump** = a `camjump` line, or a `pan` with a large `px` and a small `ms`, or a `camera type=set` whose `to` differs a lot from the previous `tween settled pan`.
- A **swing back** on Explore = `tween start=[pan]` far from the previous `pan to=[…]`.
- **Lag** = clusters of `longframe`, usually right after `overlay open` or when many nodes are revealed.
- `tap … ignored=…` lines show taps that did nothing and why.

## Code
- `app/vite.config.js` `traceReceiver()` — dev-server-only middleware: `POST /__eld/trace?session=<id>` writes `app/playtest-traces/latest.txt` and `<session>.txt`.
- `app/src/debug/trace.js` — ring buffer, localStorage persistence, `trace(kind, data)`, text formatter, long-frame monitor, dev-only auto-upload (`fetch` every 3 s while dirty, `sendBeacon` on background/pagehide). `trace()` returns immediately when off.
- `app/src/debug/DebugTraceSheet.jsx` — the ☰ sheet (toggle / copy / clear / text box).
- Hooks: `AppRoot.jsx` (tabs, island, rally, run, taps, cards, camera dispatch, trips, overlays, ambush, extract) and `map/RouteMapScreen.jsx` (gestures, tap pans, tween start / arrival / settle / jumps).

## Receiver hardening (M1d, `app/vite.config.js`)
- **LAN only:** the POST is accepted from loopback, RFC1918 private ranges, Tailscale CGNAT (100.64/10) and IPv6 ULA / link-local; anything else gets 403. A browser `Origin`, when present, must be the dev server's own host.
- **Body limit:** 1 MiB (413 above it — a full 1500-event trace is ~200 KB).
- **Bounded retention:** `latest.txt` plus the newest **20** session files; older sessions are deleted on each upload.
- **Async writes** (`fs/promises`), so a slow disk never blocks the dev server.
- Tests: `app/src/debug/traceReceiver.test.js`.
