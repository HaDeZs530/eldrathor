/**
 * Style Bible §D — sheets, cards and dialogs inherit the mode of the screen underneath them.
 * The pure mapping is the spec; the stylesheet must carry all three scoped columns with the lock's values.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { modeColumn, MODE_COLUMNS, MODES } from './styleBible.js';
import { MODE, HUB_SKIN, TAB_HUB_SKIN } from './tokens.js';

test('UI Brackets lock (revised): Town → Veinharbor; Party + Player → Mind View (same column as Fight); Hearth → the Hearth blend; Route map → Exploration; Fight / Results / Sanctuary (MIND) → Mind View', () => {
  assert.equal(modeColumn(MODE.WORLD, TAB_HUB_SKIN.town), 'veinharbor');
  assert.equal(modeColumn(MODE.WORLD, TAB_HUB_SKIN.party), 'mind');
  assert.equal(modeColumn(MODE.WORLD, TAB_HUB_SKIN.player), 'mind');
  assert.equal(modeColumn(MODE.WORLD, TAB_HUB_SKIN.party), modeColumn(MODE.MIND, HUB_SKIN.MOUNTAIN), 'Party is the Fight column — no variant');
  assert.equal(modeColumn(MODE.WORLD, TAB_HUB_SKIN.afk), 'hearth');
  assert.equal(modeColumn(MODE.WORLD, HUB_SKIN.MOUNTAIN), 'explore');
  assert.equal(modeColumn(MODE.MIND, HUB_SKIN.MOUNTAIN), 'mind');
  assert.equal(modeColumn(MODE.MIND, HUB_SKIN.RPG), 'mind');
  assert.equal(modeColumn(MODE.WORLD, 'unknown'), 'veinharbor');
  assert.deepEqual(MODE_COLUMNS, ['veinharbor', 'explore', 'mind', 'hearth']);
});

test('§D scopes exist in ui.css with the lock values for panel / border / title, out-weighing the hub-skin rules (repeated class)', () => {
  const css = readFileSync(new URL('../components/ui/ui.css', import.meta.url), 'utf8');
  const block = (col) => {
    const i = css.indexOf(`.eld-root .eld-mode-${col}.eld-mode-${col}.eld-mode-${col}.eld-mode-${col} {`);
    assert.ok(i >= 0, `${col} scope`);
    const j = css.indexOf('/* ---', i + 10);
    return css.slice(i, j > 0 ? j : undefined);
  };
  const v = block('veinharbor');
  for (const hex of [MODES.veinharbor.panel, MODES.veinharbor.border, MODES.veinharbor.borderInner, MODES.veinharbor.display]) assert.ok(v.includes(hex), `veinharbor ${hex}`);
  assert.ok(!/0 0 \d+px rgba\(44, 171, 248/.test(v), 'no glow on Veinharbor');
  const e = block('explore');
  for (const hex of [MODES.explore.panel, MODES.explore.border, MODES.explore.display, MODES.explore.gold]) assert.ok(e.includes(hex), `explore ${hex}`);
  assert.ok(e.includes('repeating-linear-gradient'), 'paper grain on Exploration cards');
  const m = block('mind');
  for (const hex of [MODES.mind.panel, MODES.mind.card, MODES.mind.border, MODES.mind.display]) assert.ok(m.includes(hex), `mind ${hex}`);
  assert.ok(m.includes('0 0 6px rgba(44, 171, 248, 0.25)'), 'the 6 px #2cabf8 @ 25 % glow on Mind View');
});
