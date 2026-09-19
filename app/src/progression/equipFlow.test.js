/** The equip flow (Anthony, 2026-09-19): any slot opens the list; a row prompts Equip / Cancel; a filled slot asks to Replace. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickAction, needsReplaceConfirm, replaceMessage, wornFirst } from './equipFlow.js';
import { makeArmor, makeWeapon } from './items.js';
import { makeGem } from './gems.js';

const worn = makeArmor({ tier: 1, rarity: 'Common', type: 'Helm', rating: 40 });
const next = makeArmor({ tier: 2, rarity: 'Rare', type: 'Helm', rating: 70 });

test('a row in the slot list: the worn item opens its own sheet; an item worn by someone else is refused with the reason; anything else prompts Equip / Cancel', () => {
  assert.deepEqual(pickAction(worn, { currentId: worn.id }), { kind: 'current' });
  assert.deepEqual(pickAction(next, { currentId: worn.id }), { kind: 'equip' });
  assert.deepEqual(pickAction(next, { currentId: null }), { kind: 'equip' });
  assert.deepEqual(pickAction(next, { currentId: worn.id, wornByOther: 'Orin' }), { kind: 'blocked', reason: 'Worn by Orin — unequip it there first' });
  assert.deepEqual(pickAction(null), { kind: 'none' });
});

test('Replace is asked exactly when the slot already holds a different item, and names both items', () => {
  assert.equal(needsReplaceConfirm(null, next), false, 'an empty slot equips straight away');
  assert.equal(needsReplaceConfirm(worn, next), true);
  assert.equal(needsReplaceConfirm(worn, worn), false);
  assert.equal(replaceMessage(worn, next), 'Replace Gullwatch Helm with Saltcliff Helm?');
  const w = makeWeapon({ tier: 1, rarity: 'Common', type: 'Bow', rating: 10, rng: () => 0 });
  assert.equal(replaceMessage(w, { ...w, id: 'x', name: 'Tidebreaker' }), `Replace ${w.name} with Tidebreaker?`);
  assert.equal(replaceMessage(makeGem({ gemClass: 'Tank' }), makeGem({ gemClass: 'Healer' })), 'Replace Tank Gem with Healer Gem?');
});

test('the worn item is listed first; the rest keep their order', () => {
  const a = { id: 'a' }, b = { id: 'b' }, c = { id: 'c' };
  assert.deepEqual(wornFirst([a, b, c], 'c').map((i) => i.id), ['c', 'a', 'b']);
  assert.deepEqual(wornFirst([a, b, c], null).map((i) => i.id), ['a', 'b', 'c']);
  assert.deepEqual(wornFirst([a, b], 'zz').map((i) => i.id), ['a', 'b']);
});
