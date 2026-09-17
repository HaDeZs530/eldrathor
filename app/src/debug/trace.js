/**
 * Debug trace — a playtest/debug event log, separate from the player-facing run log.
 * docs/DEBUG_TRACE.md. Off by default; toggled from ☰ Menu → Debug trace. When on, every tap,
 * card action, camera move (cause, from → to, size, duration), trip (hops, timing, skip, settle),
 * overlay open/close and long frame (> 50 ms) is appended to a ring buffer that survives reloads
 * (localStorage), so a playtest can be pasted back to Claude Code as text.
 *
 * Zero cost when off: `trace()` returns immediately.
 */

const KEY_ON = 'eld.debug.trace.on';
const KEY_LOG = 'eld.debug.trace.log';
const KEY_SESSION = 'eld.debug.trace.session';
/** Dev-only auto-save: POST the trace to the Vite dev server (vite.config.js `traceReceiver`) → app/playtest-traces/. */
const UPLOAD_URL = '/__eld/trace';
const UPLOAD_EVERY_MS = 3000;
const AUTOSAVE = typeof import.meta !== 'undefined' && !!import.meta.env?.DEV;
export const TRACE_MAX = 1500; // M1d: a whole run's opening (start snapshot, first pans, first fight) must survive
/** Build identity (git short hash @ build time), baked in by vite.config.js `define`. */
export let BUILD = typeof __ELD_BUILD__ !== 'undefined' ? __ELD_BUILD__ : 'dev';
const LONG_FRAME_MS = 50;

let on = false;
let buf = [];
let seq = 0;
let flushTimer = null;
let frameMon = null;
let uploadTimer = null;
let uploadDirty = false;
let session = null;
/** Last auto-save outcome for the sheet: { at, ok, file | error } */
export let lastUpload = null;
const listeners = new Set();

function safeGet(k) { try { return window.localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { window.localStorage.setItem(k, v); } catch { /* private mode / quota */ } }

/** Restore the toggle + buffer from a previous session (call once at app start). */
export function initTrace() {
  if (typeof window === 'undefined') return;
  on = safeGet(KEY_ON) === '1';
  try { buf = JSON.parse(safeGet(KEY_LOG) || '[]'); if (!Array.isArray(buf)) buf = []; } catch { buf = []; }
  seq = buf.length ? (buf[buf.length - 1].n || 0) : 0;
  session = safeGet(KEY_SESSION) || null;
  if (!session) { session = `${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 8)}`; safeSet(KEY_SESSION, session); }
  if (AUTOSAVE) {
    // the dev server pulls new commits under itself (keep-alive task): ask it for the live build stamp
    fetch('/__eld/build', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j?.build) { BUILD = j.build; notify(); } }).catch(() => {});
    // flush what we have when the app goes to the background / the page is torn down (sendBeacon survives both)
    const flushNow = () => { if (on && uploadDirty) beacon(); };
    document.addEventListener('visibilitychange', () => { if (document.hidden) flushNow(); });
    window.addEventListener('pagehide', flushNow);
  }
  if (on) { startFrameMonitor(); trace('trace', { restored: buf.length, build: BUILD, ua: navigator.userAgent, vp: `${window.innerWidth}x${window.innerHeight}`, dpr: window.devicePixelRatio }); }
}

export const isTraceOn = () => on;

export function setTraceOn(next) {
  on = !!next;
  safeSet(KEY_ON, on ? '1' : '0');
  if (on) { startFrameMonitor(); trace('trace', { on: true, build: BUILD, ua: navigator.userAgent, vp: `${window.innerWidth}x${window.innerHeight}`, dpr: window.devicePixelRatio }); }
  else { stopFrameMonitor(); }
  notify();
}

/** Append one event. `data` should be small and JSON-serialisable; numbers are rounded to 1 dp. */
export function trace(kind, data) {
  if (!on) return;
  seq += 1;
  buf.push({ n: seq, t: Math.round(performance.now()), w: Date.now(), k: kind, d: round(data) });
  if (buf.length > TRACE_MAX) buf.splice(0, buf.length - TRACE_MAX);
  scheduleFlush();
  scheduleUpload();
  notify();
}

export const isAutosave = () => AUTOSAVE;
export const traceSession = () => session;

function scheduleUpload() {
  if (!AUTOSAVE || uploadTimer) { uploadDirty = true; return; }
  uploadDirty = true;
  uploadTimer = window.setTimeout(upload, UPLOAD_EVERY_MS);
}
async function upload() {
  uploadTimer = null;
  if (!on || !uploadDirty) return;
  uploadDirty = false;
  try {
    const r = await fetch(`${UPLOAD_URL}?session=${encodeURIComponent(session || 'unknown')}`, { method: 'POST', body: traceText(), keepalive: true, headers: { 'Content-Type': 'text/plain' } });
    const j = r.ok ? await r.json() : null;
    lastUpload = { at: Date.now(), ok: r.ok, file: j?.file || null, error: r.ok ? null : `HTTP ${r.status}` };
  } catch (e) {
    lastUpload = { at: Date.now(), ok: false, file: null, error: String(e?.message || e) };
  }
  notify();
  if (uploadDirty) scheduleUpload();
}
function beacon() {
  try {
    uploadDirty = false;
    navigator.sendBeacon?.(`${UPLOAD_URL}?session=${encodeURIComponent(session || 'unknown')}`, new Blob([traceText()], { type: 'text/plain' }));
  } catch { /* best effort */ }
}
/** Force an upload now (the sheet's Save button). */
export function uploadNow() { if (!AUTOSAVE) return Promise.resolve(); uploadDirty = true; if (uploadTimer) { window.clearTimeout(uploadTimer); uploadTimer = null; } return upload(); }

export function clearTrace() {
  buf = []; seq = 0;
  safeSet(KEY_LOG, '[]');
  notify();
}

export function traceEntries() { return buf; }

/** Human-readable text: one line per event, `+delta` since the previous line. */
export function traceText() {
  const head = `# Eldrathor debug trace · build ${BUILD} · ${new Date().toISOString()} · ${buf.length} events (max ${TRACE_MAX})`;
  let prev = null;
  const lines = buf.map((e) => {
    const dt = prev == null ? 0 : e.t - prev;
    prev = e.t;
    const clock = e.w ? new Date(e.w).toISOString().slice(11, 23) : '            ';
    return `${clock} ${String(e.t).padStart(7)}ms +${String(dt).padStart(5)} ${e.k.padEnd(12)} ${fmt(e.d)}`;
  });
  return [head, ...lines].join('\n');
}

export function onTraceChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function notify() { for (const fn of listeners) fn(); }

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = window.setTimeout(() => { flushTimer = null; safeSet(KEY_LOG, JSON.stringify(buf)); }, 400);
}

function round(v) {
  if (v == null) return v;
  if (typeof v === 'number') return Math.round(v * 10) / 10;
  if (Array.isArray(v)) return v.map(round);
  if (typeof v === 'object') { const o = {}; for (const k of Object.keys(v)) o[k] = round(v[k]); return o; }
  return v;
}
function fmt(d) {
  if (d == null) return '';
  if (typeof d !== 'object') return String(d);
  return Object.entries(d).map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' ');
}

/** Long-frame monitor: logs any gap between animation frames > 50 ms while the page is visible. */
function startFrameMonitor() {
  if (frameMon || typeof window === 'undefined') return;
  let last = null;
  const tick = (t) => {
    if (!frameMon) return;
    if (last != null && !document.hidden) { const gap = t - last; if (gap > LONG_FRAME_MS && gap < 1000) trace('longframe', { ms: gap }); else if (gap >= 1000) trace('paused', { ms: gap }); }
    last = t;
    frameMon = window.requestAnimationFrame(tick);
  };
  frameMon = window.requestAnimationFrame(tick);
}
function stopFrameMonitor() {
  if (frameMon) window.cancelAnimationFrame(frameMon);
  frameMon = null;
}
