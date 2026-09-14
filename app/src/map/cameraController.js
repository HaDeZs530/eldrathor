/**
 * Route-map camera controller (bug-fix pass 1 §9: ONE camera owner).
 * Owns the current pan and any running eased pan; every new move cancels the previous frame
 * callback; `dispose()` cancels everything and makes the controller inert, so no frame can write
 * after the map unmounts. Pure: `write` (DOM), `commit` (state), `schedule` / `cancel` (frames)
 * and `now` are injected — RouteMapScreen wires them, tests use fakes.
 */
export function createCameraController({ pan = { x: 0, y: 0 }, write, commit, schedule, cancel, now = () => performance.now(), ease = (u) => u }) {
  const c = { pan: { ...pan }, anim: null, handle: null, disposed: false };
  const stop = () => { if (c.handle) cancel(c.handle); c.handle = null; c.anim = null; };
  const set = (p) => { c.pan = { x: p.x, y: p.y }; if (!c.disposed) write(c.pan); };
  return {
    get pan() { return c.pan; },
    get animating() { return !!c.anim; },
    get disposed() { return c.disposed; },
    /** Move the pan directly (drag / travel tween frames). Cancels any eased pan. */
    set(p) { if (c.disposed) return; stop(); set(p); },
    /** Cancel a running eased pan without moving. */
    stop() { stop(); },
    /** Eased pan from the CURRENT pan to `target` over `ms` (≤ 0 = immediate). Commits when done. */
    panTo(target, ms) {
      if (c.disposed) return 0;
      stop();
      const px = Math.hypot(target.x - c.pan.x, target.y - c.pan.y);
      if (px < 0.5 || ms <= 0) { set(target); commit(c.pan); return px; }
      c.anim = { from: { ...c.pan }, to: { x: target.x, y: target.y }, t0: now(), ms };
      const step = (t) => {
        const a = c.anim; if (!a || c.disposed) return;
        const u = Math.min(1, (t - a.t0) / a.ms);
        const k = ease(u);
        set({ x: a.from.x + (a.to.x - a.from.x) * k, y: a.from.y + (a.to.y - a.from.y) * k });
        if (u >= 1) { c.anim = null; c.handle = null; commit(c.pan); return; }
        c.handle = schedule(step);
      };
      c.handle = schedule(step);
      return px;
    },
    /** Unmount: cancel everything; further calls are no-ops and nothing is ever written again. */
    dispose() { stop(); c.disposed = true; },
  };
}
