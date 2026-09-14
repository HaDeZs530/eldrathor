/**
 * Bug-fix pass 1 §1 — depth and named modifiers must apply to NORMAL (fight-node) enemies too.
 * The normal branch used to return its units without `finish()`, so the locked depth scaling was inert.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnEnemies } from './enemies.js';
import { mulberry32 } from './simulate.js';

const spawn = (opts, seed = 7) => spawnEnemies(1, 'normal', false, { rng: mulberry32(seed), ...opts });

test('normal spawn at depth 1.0 (depthMult 1.5) has ×1.5 hp and dmg vs the same spawn at depth 0', () => {
  const base = spawn({ depthMult: 1 });
  const deep = spawn({ depthMult: 1.5 });
  assert.equal(deep.length, base.length);
  for (let i = 0; i < base.length; i++) {
    assert.ok(Math.abs(deep[i].hp / base[i].hp - 1.5) < 1e-9, `unit ${i} hp ${base[i].hp} → ${deep[i].hp}`);
    assert.ok(Math.abs(deep[i].dmg / base[i].dmg - 1.5) < 1e-9, `unit ${i} dmg ${base[i].dmg} → ${deep[i].dmg}`);
    assert.equal(deep[i].maxHp, deep[i].hp);
  }
});

test('named normal spawn has ×1.3 on top of the depth multiplier and a prefixed name', () => {
  const deep = spawn({ depthMult: 1.5 });
  const named = spawn({ depthMult: 1.5, named: true });
  assert.equal(named.length, deep.length);
  for (let i = 0; i < deep.length; i++) {
    assert.ok(Math.abs(named[i].hp / deep[i].hp - 1.3) < 1e-9, `unit ${i} hp`);
    assert.ok(Math.abs(named[i].dmg / deep[i].dmg - 1.3) < 1e-9, `unit ${i} dmg`);
    assert.ok(named[i].named && named[i].name.endsWith(deep[i].name) && named[i].name !== deep[i].name, `unit ${i} name ${named[i].name}`);
  }
});
