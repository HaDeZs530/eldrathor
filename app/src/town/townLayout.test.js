/**
 * Veinharbor layout — Style Bible §A (Veinharbor column) numbers are the test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOWN_LAYOUT, TOWN_ART, TOWN_ART_TARGETS, TOWN_DESTINATIONS } from './townLayout.js';
import { BY_NAME } from '../art/manifest.js';

test('harbor landing composition: 250 px hero, list padding 12/14, rows 92 px with 8 px gap, 120 px illustration, Cinzel 22 / 13 px type, 57 px header, 76 px nav', () => {
  assert.equal(TOWN_LAYOUT.heroHeight, 250);
  assert.equal(TOWN_LAYOUT.listPaddingY, 12);
  assert.equal(TOWN_LAYOUT.listPaddingX, 14);
  assert.equal(TOWN_LAYOUT.rowMinHeight, 92);
  assert.equal(TOWN_LAYOUT.rowGap, 8);
  assert.equal(TOWN_LAYOUT.artWidth, 120);
  assert.equal(TOWN_LAYOUT.titlePx, 22);
  assert.equal(TOWN_LAYOUT.subtitlePx, 13);
  assert.ok(TOWN_LAYOUT.transitionMs >= 200 && TOWN_LAYOUT.transitionMs <= 250, 'section transition in the 200–250 ms band');
  assert.equal(TOWN_LAYOUT.headerBase, 57);
  assert.equal(TOWN_LAYOUT.navBase, 76);
});

test('art slots: hero 1560×500 and four 240×184 rows from the manifest, all with object-position, all served from /art/', () => {
  assert.deepEqual(TOWN_ART_TARGETS.hero, { w: 1560, h: 500 });
  assert.deepEqual(TOWN_ART_TARGETS.thumb, { w: 240, h: 184 });
  const slots = Object.keys(TOWN_ART);
  assert.deepEqual(slots, ['veinharbor-hero', 'town-party', 'town-crafter', 'town-smith', 'town-market']);
  for (const s of slots) {
    assert.ok(BY_NAME[TOWN_ART[s].art], `${s} is in the manifest`);
    assert.ok(TOWN_ART[s].src.startsWith('/art/'), s);
    assert.match(TOWN_ART[s].position, /^\d+% \d+%$/, s);
  }
});

test('the stacked destinations, in order — Bag first (Item Model §5, replacing the stash list), Party opens the Party tab, the rest open Town sections', () => {
  assert.deepEqual(TOWN_DESTINATIONS.map((d) => d.title), ['Bag', 'Party', 'Roster', 'Crafter', 'Smith', 'Market']);
  assert.deepEqual(TOWN_DESTINATIONS.find((d) => d.id === 'party').opens, { tab: 'party' });
  assert.deepEqual(TOWN_DESTINATIONS.filter((d) => d.opens.section).map((d) => d.opens.section), ['bag', 'roster', 'crafter', 'upgrade', 'market']);
  for (const d of TOWN_DESTINATIONS) assert.ok(TOWN_ART[d.art], `${d.id} has an art slot`);
});
