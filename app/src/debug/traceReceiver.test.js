/**
 * M1d — dev trace receiver hardening (vite.config.js): LAN-only origin check and bounded retention.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, utimesSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isLanAddress, pruneTraces, MAX_SESSION_FILES, TRACE_MAX_BODY_BYTES } from '../../vite.config.js';

test('LAN-only: loopback, RFC1918, Tailscale CGNAT and IPv6 ULA/link-local pass; public addresses are refused', () => {
  for (const ok of ['127.0.0.1', '::1', '::ffff:127.0.0.1', '192.168.0.101', '10.4.5.6', '172.16.0.9', '172.31.255.1', '100.116.251.89', '::ffff:100.64.0.1', 'fd12:3456::1', 'fe80::1']) assert.equal(isLanAddress(ok), true, ok);
  for (const bad of ['8.8.8.8', '172.32.0.1', '100.128.0.1', '100.63.255.255', '203.0.113.7', '2001:db8::1', '', null, undefined]) assert.equal(isLanAddress(bad), false, String(bad));
  assert.ok(TRACE_MAX_BODY_BYTES >= 512 * 1024, 'body limit comfortably above a full 1500-event trace');
});

test('bounded retention: latest.txt is kept and only the newest MAX_SESSION_FILES session files survive a prune', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'eld-traces-'));
  writeFileSync(join(dir, 'latest.txt'), 'x');
  const n = MAX_SESSION_FILES + 5;
  for (let i = 0; i < n; i++) {
    const f = join(dir, `s${String(i).padStart(2, '0')}.txt`);
    writeFileSync(f, `trace ${i}`);
    const t = 1_700_000_000 + i * 60; // older index = older file
    utimesSync(f, t, t);
  }
  const gone = await pruneTraces(dir);
  assert.equal(gone.length, 5);
  assert.deepEqual(gone.sort(), ['s00.txt', 's01.txt', 's02.txt', 's03.txt', 's04.txt']);
  const left = readdirSync(dir).sort();
  assert.equal(left.length, MAX_SESSION_FILES + 1);
  assert.ok(left.includes('latest.txt') && left.includes(`s${String(n - 1).padStart(2, '0')}.txt`));
});
