/**
 * Route map v2 generator tests — docs/Eldrathor_RouteMap_v2_Lock.md §1, §3.
 * Run with `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genTerritory } from './genTerritory.js';
import { mulberry32 } from '../combat/simulate.js';
import { tickClock, clearNode, isSealed, killRare } from './routeState.js';

const area = (tier) => ({ id: tier, tier });

function analyse(t) {
  const map = Object.fromEntries(t.nodes.map((n) => [n.id, n]));
  const seen = new Set([t.entranceId]);
  const q = [t.entranceId];
  while (q.length) {
    const c = q.shift();
    for (const n of map[c].neighbors) if (!seen.has(n)) { seen.add(n); q.push(n); }
  }
  const nonEntrance = t.nodes.filter((n) => n.id !== t.entranceId);
  return {
    connected: seen.size === t.nodes.length,
    loops: t.edges.length - t.nodes.length + 1,
    deg3Share: nonEntrance.filter((n) => n.neighbors.length >= 3).length / nonEntrance.length,
    map,
  };
}

test('web: connected, 30–45 nodes, ≥4 loops, 30–40% nodes with ≥3 edges (20 seeds)', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const t = genTerritory(area(1), { rng: mulberry32(seed) });
    const a = analyse(t);
    assert.ok(a.connected, `seed ${seed}: web must be connected`);
    assert.ok(t.nodes.length >= 30 && t.nodes.length <= 47, `seed ${seed}: size ${t.nodes.length}`);
    assert.ok(a.loops >= 4, `seed ${seed}: loops ${a.loops}`);
    assert.ok(a.deg3Share >= 0.28 && a.deg3Share <= 0.45, `seed ${seed}: deg≥3 share ${a.deg3Share.toFixed(2)}`);
  }
  const t9 = genTerritory(area(9), { rng: mulberry32(7) });
  assert.ok(t9.nodes.length >= 45, `tier 9 should be 45+, got ${t9.nodes.length}`);
});

test('types: boss sealed, 2–3 rares, 2–4 sanctuaries never adjacent to each other or the entrance', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const t = genTerritory(area(3), { rng: mulberry32(seed * 3) });
    const { map } = analyse(t);
    assert.equal(map[t.bossId].type, 'boss');
    assert.ok(t.rares.length >= 2 && t.rares.length <= 3, `rares ${t.rares.length}`);
    assert.ok(isSealed(t));
    const sanct = t.nodes.filter((n) => n.type === 'sanctuary');
    assert.ok(sanct.length >= 2 && sanct.length <= 4, `seed ${seed}: sanctuaries ${sanct.length}`);
    const entranceAdj = new Set(map[t.entranceId].neighbors);
    for (const s of sanct) {
      assert.ok(!entranceAdj.has(s.id), 'sanctuary next to entrance');
      for (const other of sanct) if (other !== s) assert.ok(!s.neighbors.includes(other.id), 'adjacent sanctuaries');
    }
  }
});

test('depth: entrance 0, boss = max normalised 1, first reveal shows 2–3 frontier nodes', () => {
  const t = genTerritory(area(2), { rng: mulberry32(11) });
  const { map } = analyse(t);
  assert.equal(map[t.entranceId].depth, 0);
  assert.equal(map[t.bossId].depth01, 1);
  const frontier = t.nodes.filter((n) => n.revealed && !n.cleared);
  assert.ok(frontier.length >= 2 && frontier.length <= 3, `frontier ${frontier.length}`);
});

test('clock: rares roam every 2 ticks onto revealed uncleared nodes; seal breaks when all die; respawns after 4 ticks', () => {
  const rng = mulberry32(5);
  let t = genTerritory(area(1), { rng });
  // reveal everything so rares have room to roam
  t = { ...t, nodes: t.nodes.map((n) => ({ ...n, revealed: true })) };
  let moved = 0;
  for (let i = 0; i < 6; i++) {
    const r = tickClock(t, { currentId: t.entranceId, rng });
    t = r.territory;
    moved += r.events.filter((e) => e.type === 'rareMoved').length;
    for (const e of r.events) if (e.type === 'rareMoved') {
      const n = t.nodes.find((x) => x.id === e.nodeId);
      assert.ok(n.revealed && !n.cleared && n.type !== 'boss');
    }
  }
  assert.ok(moved >= 1, 'at least one rare should roam in 6 ticks');
  for (const r of t.rares) t = killRare(t, r.nodeId);
  assert.ok(!isSealed(t) && t.sealBroken);

  // clear many nodes then tick 4× → some respawn
  for (const n of t.nodes) t = clearNode(t, n.id, rng);
  let respawns = 0;
  for (let i = 0; i < 8; i++) {
    const r = tickClock(t, { currentId: t.entranceId, rng });
    t = r.territory;
    respawns += r.events.filter((e) => e.type === 'respawn').length;
  }
  assert.ok(respawns > 0, 'cleared nodes should respawn over 8 ticks');
  assert.ok(t.nodes.some((n) => n.respawned && !n.cleared));
});
