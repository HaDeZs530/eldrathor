/**
 * Veinharbor visual pass, revision 1 — the spec's numbers are the test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOWN_LAYOUT, TOWN_ART, TOWN_ART_TARGETS, TOWN_DESTINATIONS } from './townLayout.js';

test('harbor landing composition: 250 px hero, list padding 12/14, rows ≥ 76 px with 8 px gap, 92 px art, 18/14 px type', () => {
  assert.equal(TOWN_LAYOUT.heroHeight, 250);
  assert.equal(TOWN_LAYOUT.listPaddingY, 12);
  assert.equal(TOWN_LAYOUT.listPaddingX, 14);
  assert.equal(TOWN_LAYOUT.rowMinHeight, 76);
  assert.equal(TOWN_LAYOUT.rowGap, 8);
  assert.equal(TOWN_LAYOUT.artWidth, 92);
  assert.equal(TOWN_LAYOUT.titlePx, 18);
  assert.equal(TOWN_LAYOUT.subtitlePx, 14);
  assert.ok(TOWN_LAYOUT.transitionMs >= 200 && TOWN_LAYOUT.transitionMs <= 250, 'section transition in the 200–250 ms band');
  assert.equal(TOWN_LAYOUT.headerBase, 57);
  assert.equal(TOWN_LAYOUT.navBase, 76);
});

test('art slots: hero 1170×750 and four 276×228 thumbnails, all with object-position, all pending under /town/', () => {
  assert.deepEqual(TOWN_ART_TARGETS.hero, { w: 1170, h: 750 });
  assert.deepEqual(TOWN_ART_TARGETS.thumb, { w: 276, h: 228 });
  const slots = Object.keys(TOWN_ART);
  assert.deepEqual(slots, ['veinharbor-hero', 'town-party', 'town-crafter', 'town-smith', 'town-market']);
  for (const s of slots) {
    assert.ok(TOWN_ART[s].src.startsWith('/town/'), s);
    assert.match(TOWN_ART[s].position, /^\d+% \d+%$/, s);
    assert.ok(TOWN_ART[s].target.w > 0 && TOWN_ART[s].target.h > 0, s);
  }
  // thumbnail target keeps the 92×76 CSS slot's aspect at 3×
  assert.equal(TOWN_ART_TARGETS.thumb.w / 3, TOWN_LAYOUT.artWidth);
  assert.equal(TOWN_ART_TARGETS.thumb.h / 3, TOWN_LAYOUT.rowMinHeight);
  assert.equal(TOWN_ART_TARGETS.hero.h / 3, TOWN_LAYOUT.heroHeight);
});

test('four stacked destinations in order — Party opens the Party tab, the rest open existing Town sections', () => {
  assert.deepEqual(TOWN_DESTINATIONS.map((d) => d.title), ['Party', 'Crafter', 'Smith', 'Market']);
  assert.deepEqual(TOWN_DESTINATIONS.map((d) => d.subtitle), ['Prepare your companions', 'Work with infused materials', 'Merge and empower weapons', 'Trade your finds']);
  assert.deepEqual(TOWN_DESTINATIONS[0].opens, { tab: 'party' });
  assert.deepEqual(TOWN_DESTINATIONS.slice(1).map((d) => d.opens.section), ['crafter', 'upgrade', 'market']);
  for (const d of TOWN_DESTINATIONS) assert.ok(TOWN_ART[d.art], `${d.id} has an art slot`);
});
