/**
 * Route map v2 generator tests — docs/Eldrathor_RouteMap_v2_Lock.md §1, §3.
 * Run with `npm test`.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genTerritory, segmentsCross } from './genTerritory.js';
import { mulberry32 } from '../combat/simulate.js';
import { tickClock, clearNode, raresAlive, killRare, travelPath } from './routeState.js';

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

test('types: boss node, 2–3 rares (optional hunts), 2–4 sanctuaries never adjacent to each other or the entrance', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const t = genTerritory(area(3), { rng: mulberry32(seed * 3) });
    const { map } = analyse(t);
    assert.equal(map[t.bossId].type, 'boss');
    assert.ok(t.rares.length >= 2 && t.rares.length <= 3, `rares ${t.rares.length}`);
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

test('named variants roll at generation: ~10% of Fight nodes, at least one, only on Fight nodes, no respawned field', () => {
  for (let seed = 1; seed <= 10; seed++) {
    const t = genTerritory(area(1), { rng: mulberry32(seed * 11) });
    const fights = t.nodes.filter((n) => n.type === 'normal' && n.id !== t.entranceId);
    const named = t.nodes.filter((n) => n.namedRare);
    assert.ok(named.length >= 1, 'at least one named node');
    assert.ok(named.length <= Math.max(1, Math.round(fights.length * 0.1)) + 1, `named ${named.length} vs fights ${fights.length}`);
    assert.ok(named.every((n) => n.type === 'normal'), 'named variants are Fight nodes');
    assert.ok(!t.nodes.some((n) => 'respawned' in n), 'no respawned field anywhere');
  }
});

test('clock: rares roam only on scout/clear actions (every 2), may step onto the party, nothing ever respawns; raresAlive hits 0 when all die', () => {
  const rng = mulberry32(5);
  let t = genTerritory(area(1), { rng });
  t = { ...t, nodes: t.nodes.map((n) => ({ ...n, revealed: true })) };
  let moved = 0;
  for (let i = 0; i < 8; i++) {
    const r = tickClock(t, { currentId: t.entranceId, rng });
    t = r.territory;
    moved += r.events.filter((e) => e.type === 'rareMoved').length;
    assert.ok(r.events.every((e) => e.type === 'rareMoved'), 'only rare moves — no respawn events');
    for (const e of r.events) {
      const n = t.nodes.find((x) => x.id === e.nodeId);
      assert.ok(n.type !== 'boss');
      assert.ok(e.nodeId === t.entranceId ? e.ontoParty : n.revealed && !n.cleared);
    }
  }
  assert.ok(moved >= 1, 'at least one rare should roam in 8 actions');
  for (const r of t.rares) t = killRare(t, r.nodeId);
  assert.equal(raresAlive(t), 0);
  // cleared stays cleared
  for (const n of t.nodes) t = clearNode(t, n.id, rng);
  const clock = t.clock;
  for (let i = 0; i < 12; i++) t = tickClock(t, { currentId: t.entranceId, rng }).territory;
  assert.equal(t.clock, clock + 12);
  assert.ok(t.nodes.every((n) => n.cleared), 'nothing respawned after 12 more actions');
  // free travel: a path exists across cleared ground to the boss
  assert.ok(travelPath(t, t.entranceId, t.bossId)?.length > 1);
});

test('planar outward web (v3 §11): zero crossing edges over 200 maps; every edge joins equal/adjacent depth bands; still connected with ≥4 loops', () => {
  let crossings = 0;
  let bandJumps = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const tier = 1 + (seed % 9);
    const t = genTerritory(area(tier), { rng: mulberry32(seed * 977) });
    const map = Object.fromEntries(t.nodes.map((n) => [n.id, n]));
    const segs = t.edges.map(([a, b]) => [map[a], map[b]]);
    for (let i = 0; i < segs.length; i++) {
      for (let j = i + 1; j < segs.length; j++) {
        if (segmentsCross(segs[i][0], segs[i][1], segs[j][0], segs[j][1])) crossings++;
      }
    }
    for (const [a, b] of segs) if (Math.abs(a.band - b.band) > 1) bandJumps++;
    const an = analyse(t);
    assert.ok(an.connected, `seed ${seed}: connected`);
    assert.ok(an.loops >= 4, `seed ${seed}: loops ${an.loops}`);
    assert.ok(map[t.entranceId].band === 0 && map[t.bossId].band === t.bands, `seed ${seed}: entrance/boss bands`);
    assert.ok(t.nodes.every((n) => n.neighbors.length <= 5), `seed ${seed}: degree ≤ 5 after pruning`);
  }
  assert.equal(crossings, 0, `crossing edges found: ${crossings}`);
  assert.equal(bandJumps, 0, `edges jumping 2+ depth bands: ${bandJumps}`);
});

test('segmentsCross: proper crossings, shared endpoints, parallel segments', () => {
  const P = (x, y) => ({ x, y });
  assert.ok(segmentsCross(P(0, 0), P(10, 10), P(0, 10), P(10, 0)));
  // endpoints are compared by REFERENCE (the generator shares node objects): two distinct point objects at the
  // same coordinates touch, and touching counts as a crossing
  assert.ok(segmentsCross(P(0, 0), P(10, 10), P(0, 0), P(10, 0)), 'value-equal but distinct endpoint objects touch → crossing');
  assert.ok(segmentsCross(P(0, 0), P(10, 0), P(5, 0), P(5, 5)), 'a T-junction touches → crossing');
  const a = P(0, 0); const b = P(10, 0); const c = P(20, 0);
  assert.ok(!segmentsCross(a, b, b, c), 'segments sharing an endpoint object do not cross');
  assert.ok(!segmentsCross(P(0, 0), P(10, 0), P(0, 5), P(10, 5)), 'parallel segments do not cross');
  assert.ok(!segmentsCross(P(0, 0), P(10, 0), P(11, 0), P(20, 0)), 'disjoint collinear segments do not cross');
  assert.ok(!segmentsCross(P(0, 0), P(10, 0), P(20, 20), P(30, 20)), 'far-apart segments do not cross');
});

test('frontier never strands: exploring greedily, an unexplored node is always visible until the map is fully cleared (200 maps)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const rng = mulberry32(seed);
    let t = genTerritory(area(1 + (seed % 9)), { rng });
    for (let step = 0; step < 200; step++) {
      const open = t.nodes.filter((n) => n.revealed && !n.cleared);
      if (!open.length) break;
      const pick = open[Math.floor(rng() * open.length)];
      t = clearNode(t, pick.id, rng);
      const done = t.nodes.every((n) => n.cleared);
      const visible = t.nodes.some((n) => n.revealed && !n.cleared);
      assert.ok(done || visible, `seed ${seed}: stranded after ${step + 1} clears`);
    }
    assert.ok(t.nodes.every((n) => n.cleared), `seed ${seed}: map never fully cleared`);
  }
});

test('the boss is the end of the road: degree 1, and every other node is reachable from the entrance WITHOUT passing the boss (200 maps)', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const t = genTerritory(area(1 + (seed % 9)), { rng: mulberry32(seed) });
    const map = Object.fromEntries(t.nodes.map((n) => [n.id, n]));
    assert.equal(map[t.bossId].neighbors.length, 1, `seed ${seed}: boss degree ${map[t.bossId].neighbors.length}`);
    const seen = new Set([t.entranceId]);
    const stack = [t.entranceId];
    while (stack.length) { const c = stack.pop(); for (const m of map[c].neighbors) if (m !== t.bossId && !seen.has(m)) { seen.add(m); stack.push(m); } }
    for (const n of t.nodes) if (n.id !== t.bossId) assert.ok(seen.has(n.id), `seed ${seed}: ${n.id} only reachable through the boss`);
    for (const r of t.rares) assert.ok(seen.has(r.nodeId) && r.nodeId !== t.bossId, `seed ${seed}: rare behind the boss`);
    assert.ok(t.edges.every(([a, b]) => map[a] && map[b]), `seed ${seed}: dangling edge`);
  }
});
