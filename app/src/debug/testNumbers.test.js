/**
 * Item-numbers brief §5 — test-numbers mode is off by default, persisted, and its formatters are exact.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isTestNumbers, setTestNumbers, setTestNumbersStorage, onTestNumbersChange, rawToMitigated, fmtMult, TEST_NUMBERS_KEY } from './testNumbers.js';

const shim = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), m }; };

test('off by default; setting it persists under the key and notifies listeners; a fresh reader sees the persisted value', () => {
  const s = shim(); setTestNumbersStorage(s);
  assert.equal(isTestNumbers(), false);
  const seen = []; const off = onTestNumbersChange((v) => seen.push(v));
  setTestNumbers(true);
  assert.equal(isTestNumbers(), true); assert.equal(s.m.get(TEST_NUMBERS_KEY), '1'); assert.deepEqual(seen, [true]);
  setTestNumbersStorage(s); // a new reader over the same storage
  assert.equal(isTestNumbers(), true);
  setTestNumbers(false); assert.equal(isTestNumbers(), false); assert.equal(s.m.get(TEST_NUMBERS_KEY), '0');
  off();
  setTestNumbersStorage(null);
});

test('formatters: raw → mitigated reads "14 (22 − 36%)"; multipliers read ×1.80', () => {
  assert.equal(rawToMitigated({ amount: 14, raw: 22, mit: 0.36 }), ' (22 − 36%)');
  assert.equal(rawToMitigated({ amount: 14 }), '');
  assert.equal(fmtMult(1.8), '×1.80');
});
