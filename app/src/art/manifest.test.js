/**
 * Style Bible §B — the asset manifest is the spec: every file the lock lists, at its size and transparency.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MANIFEST, BY_NAME, slug, enemySlug, areaSlug, NODE_KINDS, TAB_IDS, ART_BASE } from './manifest.js';
import { AREAS } from '../data.js';

const size = (name) => { const e = BY_NAME[name]; assert.ok(e, `${name} listed`); return [e.w, e.h, e.transparent]; };

test('slugs: "The Brinewarden" → brinewarden, "Grim Vein Husk" → vein-husk, "Serpent’s Stair" → serpents-stair', () => {
  assert.equal(slug('The Brinewarden'), 'brinewarden');
  assert.equal(enemySlug('Grim Vein Husk'), 'vein-husk');
  assert.equal(enemySlug('Named Rare Manifestation'), 'manifestation');
  assert.equal(areaSlug(AREAS[3]), 'serpents-stair');
  assert.equal(areaSlug(AREAS[0]), 'gullwatch-trail');
});

test('§B sizes: hero 1560×500, rows 240×184, island 1560×2400, tiles 1024², nine biomes, eight 96 px node icons, 128 px ring, 1560×720 stages, 256 px portraits ×3 per archetype, 96 px innate/aura/tab icons', () => {
  assert.deepEqual(size('veinharbor-hero'), [1560, 500, false]);
  for (const r of ['town-party', 'town-crafter', 'town-smith', 'town-market']) assert.deepEqual(size(r), [240, 184, false]);
  assert.deepEqual(size('island-map'), [1560, 2400, false]);
  assert.deepEqual(size('parchment-tile'), [1024, 1024, false]);
  assert.deepEqual(size('fog-tile'), [1024, 1024, true]);
  const biomes = MANIFEST.filter((e) => e.name.startsWith('biome-'));
  assert.equal(biomes.length, 9); for (const b of biomes) assert.deepEqual([b.w, b.h, b.transparent], [1024, 1024, false]);
  assert.deepEqual(NODE_KINDS, ['unknown', 'fight', 'crystal', 'sanctuary', 'rare', 'boss', 'cleared', 'named']);
  for (const k of NODE_KINDS) assert.deepEqual(size(`node-${k}`), [96, 96, true]);
  assert.deepEqual(size('party-ring'), [128, 128, true]);
  const stages = MANIFEST.filter((e) => e.name.startsWith('enemy-'));
  assert.ok(stages.length >= 5, 'area-1 enemy types + the Brinewarden'); assert.ok(BY_NAME['enemy-brinewarden']);
  for (const s of stages) assert.deepEqual([s.w, s.h, s.transparent], [1560, 720, false]);
  const portraits = MANIFEST.filter((e) => e.name.startsWith('portrait-'));
  assert.equal(portraits.length, 15); for (const p of portraits) assert.deepEqual([p.w, p.h, p.transparent], [256, 256, true]);
  assert.equal(MANIFEST.filter((e) => e.name.startsWith('icon-innate-')).length, 5);
  assert.equal(MANIFEST.filter((e) => e.name.startsWith('icon-aura-')).length, 5);
  assert.deepEqual(TAB_IDS, ['player', 'party', 'mountain', 'town', 'seam']);
  for (const t of TAB_IDS) assert.deepEqual(size(`icon-tab-${t}`), [96, 96, true]);
  // every entry is a PNG under /art/ and names are unique
  for (const e of MANIFEST) { assert.ok(e.src.startsWith(ART_BASE) && e.file.endsWith('.png'), e.name); }
  assert.equal(new Set(MANIFEST.map((e) => e.name)).size, MANIFEST.length);
});
