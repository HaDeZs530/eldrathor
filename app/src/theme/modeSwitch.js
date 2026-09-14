/**
 * Mode-switch scheduler for the dual-mode theme (bug-fix pass 1 §5/§10).
 * The WORLD ⇄ MIND crossfade is: pulse (transitioning=true) → after `pulseMs` set the mode →
 * after `settleMs` transitioning=false. Timers are owned here, every new request cancels the
 * previous one (a token guards stale callbacks), and `dispose()` cancels everything on unmount —
 * so entering Mind-view and leaving within 100 ms ends in the CURRENT screen's mode, never a stale one.
 * Pure: `setTimeout` / `clearTimeout` are injectable for tests.
 */
export function createModeSwitcher({ initial, onMode, onTransitioning, pulseMs = 120, settleMs = 280, setTimeout: st = globalThis.setTimeout, clearTimeout: ct = globalThis.clearTimeout }) {
  let mode = initial;
  let target = initial;
  let token = 0;
  let timers = [];
  const clear = () => { for (const t of timers) ct(t); timers = []; };
  return {
    get mode() { return mode; },
    get target() { return target; },
    /** Request a mode; a no-op if that mode is already current AND no other switch is pending. */
    go(next) {
      if (next === target) return;
      target = next;
      clear();
      const my = ++token;
      onTransitioning(true);
      timers.push(st(() => {
        if (my !== token) return;
        mode = next;
        onMode(next);
        timers.push(st(() => { if (my === token) onTransitioning(false); }, settleMs));
      }, pulseMs));
    },
    dispose() { token += 1; clear(); },
  };
}
