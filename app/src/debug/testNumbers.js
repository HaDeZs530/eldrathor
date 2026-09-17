/**
 * Test-numbers mode — item-numbers brief §5 (2026-09-17). Settings → "Show test numbers", OFF by
 * default, persisted. When on, the app annotates what it already shows with the numbers behind it:
 * item power + the multiplier breakdown, the nine derived stats with their sources, the enemy stat
 * block on scout/reveal cards, raw → mitigated on feed lines, party / enemy DPS + the fight seed on
 * Results. Nothing else changes; no gameplay effect. Pure: storage is injectable for tests.
 */
export const TEST_NUMBERS_KEY = 'eld.debug.testNumbers';

const listeners = new Set();
let storage = typeof window !== 'undefined' ? window.localStorage : null;
let cached = null;

/** Tests inject a storage shim; `null` resets to the browser's localStorage. */
export function setTestNumbersStorage(s) { storage = s === undefined ? storage : s; cached = null; }

function read() {
  try { return storage?.getItem(TEST_NUMBERS_KEY) === '1'; } catch { return false; }
}
export function isTestNumbers() {
  if (cached == null) cached = read();
  return cached;
}
export function setTestNumbers(on) {
  cached = !!on;
  try { storage?.setItem(TEST_NUMBERS_KEY, cached ? '1' : '0'); } catch { /* private mode / quota */ }
  for (const fn of listeners) fn(cached);
}
export function onTestNumbersChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** `14 (22 − 36%)` — a feed line's raw → mitigated suffix. */
export const rawToMitigated = (e) => (e && e.raw != null && e.mit != null ? ` (${Math.round(e.raw)} − ${Math.round(e.mit * 100)}%)` : '');
/** `×1.80 × ×1.34 × ×1.07 × ×1.03` — an item's multiplier breakdown. */
export const fmtMult = (n) => `×${Number(n).toFixed(2)}`;
