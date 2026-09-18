/**
 * Style Bible §A — the lock's values are the test. If a number here changes, the lock changed first.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { FRAME, FONTS, MODES, MODE_FOR_SKIN } from './styleBible.js';
import { fonts } from './tokens.js';

test('shared frame: 2 px #b8973f outer + 1 px #5a4a22 inner, 10 px radius, 57 px header, ELDRATHOR Cinzel 22 / 0.08 em #e6d6a8, 32 px icons, 76 px tab bar #0f151d, 28 px icons, 12 px labels, active #e8c46a', () => {
  assert.equal(FRAME.outerBorderPx, 2); assert.equal(FRAME.outerBorder, '#b8973f');
  assert.equal(FRAME.innerLinePx, 1); assert.equal(FRAME.innerLine, '#5a4a22');
  assert.equal(FRAME.radiusPx, 10); assert.equal(FRAME.headerPx, 57);
  assert.equal(FRAME.wordmark, 'ELDRATHOR'); assert.equal(FRAME.wordmarkPx, 22); assert.equal(FRAME.wordmarkTracking, '0.08em'); assert.equal(FRAME.wordmarkColor, '#e6d6a8');
  assert.equal(FRAME.headerIconPx, 32);
  assert.equal(FRAME.tabBarPx, 76); assert.equal(FRAME.tabBarBg, '#0f151d'); assert.equal(FRAME.tabIconPx, 28); assert.equal(FRAME.tabLabelPx, 12); assert.equal(FRAME.tabActive, '#e8c46a');
});

test('fonts: Cinzel display, system UI body; Press Start 2P and Cormorant are gone from the tokens and stylesheets', () => {
  assert.match(FONTS.display, /^Cinzel/); assert.match(FONTS.body, /^system-ui/);
  assert.equal(fonts.display, FONTS.display); assert.equal(fonts.body, FONTS.body);
  for (const f of ['theme/hub.css', 'theme/mind.css', 'theme/world.css', 'theme/tokens.js', 'map/islandMap.css', 'map/parchment.css', 'components/ui/ui.css', 'components/town/town.css', 'components/shell/shell.css', 'combat/fight.css', 'appChromeCss.js']) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    assert.ok(!/Press Start|Cormorant|Chakra/.test(src), `${f} must not reference Press Start 2P / Cormorant / Chakra`);
  }
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('fonts.googleapis.com/css2?family=Cinzel'), 'Cinzel is loaded once, in index.html');
  assert.ok(!/@import url\(/.test(readFileSync(new URL('./mind.css', import.meta.url), 'utf8')), 'no stylesheet @imports a webfont');
});

test('Veinharbor: near-black warm #080807, panel #141210, borders #5a4a22 + #292823, Cinzel 26/20 #f0e2bd, body 16 #c9bfae, gold #e8c46a, rows 92 px / 120 px art / 22 + 13 #a89c88, no shadows', () => {
  const v = MODES.veinharbor;
  assert.equal(v.bg, '#080807'); assert.equal(v.panel, '#141210'); assert.equal(v.border, '#5a4a22'); assert.equal(v.borderInner, '#292823');
  assert.equal(v.displayPx, 26); assert.equal(v.displaySmallPx, 20); assert.equal(v.display, '#f0e2bd');
  assert.equal(v.bodyPx, 16); assert.equal(v.body, '#c9bfae'); assert.equal(v.accent, '#e8c46a'); assert.equal(v.subtitle, '#a89c88');
  assert.deepEqual(v.destinationRow, { heightPx: 92, illustrationPx: 120, titlePx: 22, subtitlePx: 13 });
  assert.equal(v.shadows, false);
});

test('Exploration: parchment #e8d5b7, fog #f3ead9 @ 85 %, card #f1e6cf / #8a7350 / 6 px, Cinzel 20 ink #2b2118, body #3a2e22, teal ink #345d66, gold #c9962e, grain 6 %', () => {
  const e = MODES.explore;
  assert.equal(e.bg, '#e8d5b7'); assert.equal(e.fog, '#f3ead9'); assert.equal(e.fogOpacity, 0.85);
  assert.equal(e.panel, '#f1e6cf'); assert.equal(e.border, '#8a7350'); assert.equal(e.radiusPx, 6);
  assert.equal(e.displayPx, 20); assert.equal(e.display, '#2b2118'); assert.equal(e.body, '#3a2e22');
  assert.equal(e.accent, '#345d66'); assert.equal(e.gold, '#c9962e'); assert.equal(e.grainOpacity, 0.06);
  assert.equal(e.button.primaryBg, '#c9962e');
});

test('Mind View: #0c1a2b → #152a41, panel #1a2b3b, cards #23353f, 1 px #3d6fa8 + 6 px glow #2cabf8 @ 25 %, 8 px radius, Cinzel 20 #dfe9f5, body #b7c6d8, HP #20a95e, MP #2cabf8, crit #f2c14e, damage #e5484d, party cards 3 × ≥120 px, 64 px portrait, name 15, bars 14, two 28 px icons', () => {
  const m = MODES.mind;
  assert.equal(m.bgTop, '#0c1a2b'); assert.equal(m.bgBottom, '#152a41'); assert.equal(m.panel, '#1a2b3b'); assert.equal(m.card, '#23353f');
  assert.equal(m.border, '#3d6fa8'); assert.equal(m.glowPx, 6); assert.equal(m.glow, '#2cabf8'); assert.equal(m.glowOpacity, 0.25); assert.equal(m.radiusPx, 8);
  assert.equal(m.displayPx, 20); assert.equal(m.display, '#dfe9f5'); assert.equal(m.body, '#b7c6d8');
  assert.equal(m.mythros, '#2cabf8'); assert.equal(m.hp, '#20a95e'); assert.equal(m.mp, '#2cabf8'); assert.equal(m.crit, '#f2c14e'); assert.equal(m.damage, '#e5484d');
  assert.deepEqual(m.partyCard, { across: 3, minPx: 120, portraitPx: 64, portraitFrame: '#b8973f', namePx: 15, barPx: 14, iconPx: 28, icons: 2 });
});

test('UI Brackets lock: Bond #0e0a08 / #1c1410 / copper #8a5a2b + #3a2a1c / ember #e0782f / #c9642a / #f2d9b8; Veinbinder #0f0a14 / #1b1220 / amethyst #6b4fa0 + silver #3b3746 / #a678f0 / #7a55c9 / #e6d8f5 / Worldvein #c9a6ff; Hearth #0a1010 / #121a1a / verdigris #3f8f7a + bronze #5a4a2b / #4fb39a / #2f8a72 / #d9ede6; the owning table maps every skin', () => {
  const b = MODES.bond;
  assert.equal(b.bg, '#0e0a08'); assert.equal(b.panel, '#1c1410'); assert.equal(b.border, '#8a5a2b'); assert.equal(b.borderInner, '#3a2a1c');
  assert.equal(b.accent, '#e0782f'); assert.equal(b.primary, '#c9642a'); assert.equal(b.display, '#f2d9b8'); assert.equal(b.radiusPx, 10);
  const v = MODES.veinbinder;
  assert.equal(v.bg, '#0f0a14'); assert.equal(v.panel, '#1b1220'); assert.equal(v.border, '#6b4fa0'); assert.equal(v.borderInner, '#3b3746');
  assert.equal(v.accent, '#a678f0'); assert.equal(v.primary, '#7a55c9'); assert.equal(v.display, '#e6d8f5'); assert.equal(v.radiusPx, 10);
  const h = MODES.hearth;
  assert.equal(h.bg, '#0a1010'); assert.equal(h.panel, '#121a1a'); assert.equal(h.border, '#3f8f7a'); assert.equal(h.borderInner, '#5a4a2b');
  assert.equal(h.accent, '#4fb39a'); assert.equal(h.primary, '#2f8a72'); assert.equal(h.display, '#d9ede6'); assert.equal(h.radiusPx, 10);
  // one table owns screen -> bracket (rule 1): Town/Bag/Recruit Veinharbor, Party Bond, Player + Settings Veinbinder, Hearth + Offline Hearth, Route map Exploration
  assert.deepEqual(MODE_FOR_SKIN, { rpg: 'veinharbor', mind: 'veinharbor', mountain: 'explore', bond: 'bond', veinbinder: 'veinbinder', hearth: 'hearth' });
});
