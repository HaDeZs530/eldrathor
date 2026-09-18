/**
 * Every mode defines its own tokens; nothing falls back to Town brown.
 * Brief: docs/CLAUDE_BRIEFS/2026-09-16_mode-tokens-fix.md · Spec: Style Bible §A + §D.
 *
 * The bug: ui.css read the mode tokens as `var(--eld-panel, #141210)` — Veinharbor values baked in as
 * fallbacks — so any column that failed to define a token silently rendered Town brown. The fix is that
 * each column defines the FULL set (theme/styleBible.js MODE_TOKENS) and ui.css reads them with none.
 *
 * "Render each screen and assert the computed panel background" without a DOM: the test links the real
 * stylesheets in the ThemeProvider's import order, resolves the cascade for each screen's class set
 * (specificity, then source order, then `var()` substitution) and reads the value off the result.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { MODE_TOKENS, MODE_TOKEN_NAMES, MODE_SELECTOR, MODE_COLUMNS, modeColumn } from './styleBible.js';
import { MODE, HUB_SKIN, TAB_HUB_SKIN } from './tokens.js';

/* ---------- a minimal CSS cascade, over the sheets in ThemeProvider link order ---------- */
const SHEETS = ['../components/ui/ui.css', './world.css', './explore.css', './mind.css', './hearth.css', './hub.css'];
const read = (f) => readFileSync(new URL(f, import.meta.url), 'utf8');

function parse(css, rules = []) {
  let depth = 0, start = 0, sel = '';
  for (let k = 0; k < css.length; k++) {
    if (css[k] === '{') { if (depth === 0) { sel = css.slice(start, k).trim(); start = k + 1; } depth++; }
    else if (css[k] === '}') {
      depth--;
      if (depth === 0) {
        const body = css.slice(start, k);
        if (sel.startsWith('@')) parse(body, rules); else rules.push({ sel, body });
        start = k + 1;
      }
    }
  }
  return rules;
}
const RULES = SHEETS.flatMap((f) => parse(read(f).replace(/\/\*[\s\S]*?\*\//g, '')));

/** :not() contributes its argument's weight, so every selector here is counted in classes. */
const specificity = (sel) => (sel.replace(/:not\(([^)]*)\)/g, '$1').match(/\.[\w-]+|:[\w-]+/g) || []).length;

function matchCompound(compound, classes) {
  const nots = [...compound.matchAll(/:not\(([^)]*)\)/g)].map((m) => m[1]);
  const base = compound.replace(/:not\([^)]*\)/g, '');
  if (/^[a-zA-Z]/.test(base.trim())) return false; // bare element selectors don't apply to our chain
  for (const c of base.match(/\.[\w-]+/g) || []) if (!classes.has(c.slice(1))) return false;
  for (const n of nots) {
    const need = (n.match(/\.[\w-]+/g) || []).map((c) => c.slice(1));
    if (need.length && need.every((c) => classes.has(c))) return false;
  }
  return true;
}

/** `chain` is the ancestor list, root first, each a Set of class names. Descendant combinators only. */
function matches(sel, chain) {
  if (/[>+~]|::/.test(sel)) return false;
  const parts = sel.trim().split(/\s+/);
  if (!matchCompound(parts.at(-1), chain.at(-1))) return false;
  let i = chain.length - 2;
  for (let p = parts.length - 2; p >= 0; p--) {
    while (i >= 0 && !matchCompound(parts[p], chain[i])) i--;
    if (i < 0) return false;
    i--;
  }
  return true;
}

function declarations(body) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of body) {
    if (ch === '(') depth++; else if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.flatMap((d) => { const i = d.indexOf(':'); return i < 0 ? [] : [[d.slice(0, i).trim(), d.slice(i + 1).trim()]]; });
}

/** The winning declaration of `prop` for the element at the end of `chain`. */
function declared(chain, prop) {
  let value = null, best = -1;
  RULES.forEach((rule, order) => {
    for (const sel of rule.sel.split(',').map((x) => x.trim()).filter(Boolean)) {
      if (!matches(sel, chain)) continue;
      for (const [p, v] of declarations(rule.body)) {
        if (p !== prop) continue;
        const weight = specificity(sel) * 10000 + order;
        if (weight >= best) { best = weight; value = v; }
      }
    }
  });
  return value;
}

/** Custom properties inherit, so walk up the chain until one element declares it. */
function token(chain, name) {
  for (let i = chain.length; i > 0; i--) {
    const v = declared(chain.slice(0, i), name);
    if (v != null) return v;
  }
  return null;
}

/** Resolve a property, substituting `var(--x)` / `var(--x, fallback)` from the chain's tokens. */
function computed(chain, prop) {
  const raw = declared(chain, prop);
  if (raw == null) return null;
  const sub = (text, depth = 0) => {
    if (depth > 8) return text;
    return text.replace(/var\((--[\w-]+)(?:,([^()]*|[^()]*\([^()]*\)[^()]*))?\)/g, (_, name, fb) => {
      const v = token(chain, name);
      return v != null ? sub(v, depth + 1) : (fb != null ? sub(fb.trim(), depth + 1) : 'UNSET');
    });
  };
  return sub(raw);
}

/* ---------- the screens, as the class sets ThemeProvider + the screen roots put on them ---------- */
const set = (...c) => new Set(c);
const root = (mode, skin) => set('eld-root', `mode-${mode.toLowerCase()}`, `hub-${skin}`, `eld-col-${modeColumn(mode, skin)}`); // exactly what ThemeProvider renders
const SCREENS = [
  { name: 'Town', chain: [root(MODE.WORLD, TAB_HUB_SKIN.town)], column: 'veinharbor' },
  // UI Brackets lock (revised 2026-09-17): Party + Player → Mind View, Hearth → the blend, Settings pinned Mind View, Offline pinned Hearth
  { name: 'Party', chain: [root(MODE.WORLD, TAB_HUB_SKIN.party)], column: 'mind' },
  { name: 'Player', chain: [root(MODE.WORLD, TAB_HUB_SKIN.player)], column: 'mind' },
  { name: 'Hearth', chain: [root(MODE.WORLD, TAB_HUB_SKIN.afk)], column: 'hearth' },
  { name: 'Bag picker inside Party (a Town function)', chain: [root(MODE.WORLD, TAB_HUB_SKIN.party), set('eld-mode-veinharbor')], column: 'veinharbor' },
  { name: 'Recruit inside Party (a Town function)', chain: [root(MODE.WORLD, TAB_HUB_SKIN.party), set('eld-mode-veinharbor')], column: 'veinharbor' },
  { name: 'Settings sheet (pinned Mind View, opened over Town)', chain: [root(MODE.WORLD, TAB_HUB_SKIN.town), set('eld-sheet-backdrop', 'eld-mode-mind')], column: 'mind' },
  { name: 'Offline summary (pinned Hearth, opened over Town)', chain: [root(MODE.WORLD, TAB_HUB_SKIN.town), set('eld-sheet-backdrop', 'eld-mode-hearth')], column: 'hearth' },
  { name: 'Island', chain: [root(MODE.WORLD, HUB_SKIN.MOUNTAIN), set('eld-mode-explore')], column: 'explore' },
  { name: 'Rally', chain: [root(MODE.WORLD, HUB_SKIN.MOUNTAIN), set('eld-mode-explore')], column: 'explore' },
  { name: 'Route map', chain: [root(MODE.WORLD, HUB_SKIN.MOUNTAIN), set('eld-map-wrap', 'eld-mode-explore')], column: 'explore' },
  { name: 'Fight', chain: [root(MODE.MIND, HUB_SKIN.MOUNTAIN), set('eld-overlay', 'eld-mode-mind')], column: 'mind' },
  { name: 'Results', chain: [root(MODE.MIND, HUB_SKIN.MOUNTAIN), set('eld-overlay', 'eld-mode-mind')], column: 'mind' },
  { name: 'Sanctuary', chain: [root(MODE.MIND, HUB_SKIN.MOUNTAIN), set('eld-overlay', 'eld-mode-mind')], column: 'mind' },
  // the buried route map keeps its own column while a Mind View overlay sits on top of it
  { name: 'Route map under a fight', chain: [root(MODE.MIND, HUB_SKIN.MOUNTAIN), set('eld-map-wrap', 'eld-mode-explore')], column: 'explore' },
];

test('§A: every bracket stylesheet defines the FULL token set — all four agree on the list', () => {
  assert.deepEqual(MODE_COLUMNS, Object.keys(MODE_TOKENS));
  for (const col of MODE_COLUMNS) assert.deepEqual(Object.keys(MODE_TOKENS[col]), MODE_TOKEN_NAMES, col);
  for (const [col, selector] of Object.entries(MODE_SELECTOR)) {
    const rule = RULES.find((r) => r.sel.trim() === selector);
    assert.ok(rule, `${col} token block (${selector})`);
    const declaredNames = declarations(rule.body).map(([p]) => p);
    for (const name of MODE_TOKEN_NAMES) assert.ok(declaredNames.includes(name), `${selector} is missing ${name}`);
  }
});

test('§A: no screen is missing a token, and every token carries its own column\'s value — never Veinharbor\'s', () => {
  for (const screen of SCREENS) {
    for (const name of MODE_TOKEN_NAMES) {
      const got = token(screen.chain, name);
      assert.ok(got != null, `${screen.name}: ${name} is undefined — it would fall back`);
      assert.equal(got, MODE_TOKENS[screen.column][name], `${screen.name}: ${name}`);
    }
  }
});

test('§A: ui.css reads the mode tokens with NO fallback value (a missing token must fail loudly)', () => {
  const ui = read('../components/ui/ui.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const withFallback = [...ui.matchAll(/var\((--eld-[\w-]+)\s*,/g)].map((m) => m[1]);
  assert.deepEqual(withFallback.filter((n) => MODE_TOKEN_NAMES.includes(n)), [], 'ui.css still bakes in fallbacks');
  // before the §D scopes (which legitimately spell every column out) nothing may hard-code Veinharbor
  const shared = ui.slice(0, ui.indexOf('.eld-mode-veinharbor'));
  assert.ok(!/#141210|#c9bfae|#a89c88|#f0e2bd|#191613|#292823/.test(shared), 'Veinharbor literals in the shared chrome');
});

test('§3: panel fills — Mind View, Veinharbor and Exploration distinct; the Hearth shares Veinharbor\'s fill and differs only by its Mythros accent', () => {
  const panelOf = (screen) => computed([...screen.chain, set('eld-panel')], 'background');
  const byColumn = {};
  for (const screen of SCREENS) {
    const bg = panelOf(screen);
    assert.ok(bg && !bg.includes('UNSET'), `${screen.name}: panel background unresolved (${bg})`);
    assert.ok(bg.includes(MODE_TOKENS[screen.column]['--eld-panel']), `${screen.name}: panel is ${bg}`);
    (byColumn[screen.column] ||= new Set()).add(bg);
  }
  const fill = (c) => [...byColumn[c]][0];
  assert.equal(new Set(['veinharbor', 'explore', 'mind'].map(fill)).size, 3, 'three distinct panel fills');
  assert.equal(fill('hearth'), fill('veinharbor'), 'the Hearth is the Veinharbor fill');
  const hearth = SCREENS.find((s) => s.name === 'Hearth'), town = SCREENS.find((s) => s.name === 'Town');
  assert.equal(token(hearth.chain, '--eld-accent'), '#2cabf8', 'Hearth accent is Mythros');
  assert.notEqual(token(town.chain, '--eld-accent'), '#2cabf8', 'Town accent is not');
  for (const name of MODE_TOKEN_NAMES) if (!/accent/.test(name)) assert.equal(token(hearth.chain, name), token(town.chain, name), `Hearth ${name} is Veinharbor's`);
  assert.equal(new Set(MODE_COLUMNS.map((c) => `${fill(c)}|${MODE_TOKENS[c]['--eld-accent']}`)).size, 4, 'four brackets, each its own fill + accent pair');
});

test('§D: the ☰ Menu over Party === Menu over Fight; Menu over Hearth has the Veinharbor fill; three distinct panels overall (the frozen bracket wins)', () => {
  // Sheet freezes modeColumn(currentMode, hubSkin) at open time onto the backdrop; .eld-sheet is .eld-panel.
  const over = (mode, skin) => {
    const column = modeColumn(mode, skin);
    const chain = [root(mode, skin), set('eld-sheet-backdrop', `eld-mode-${column}`), set('eld-sheet', 'eld-panel')];
    return { column, background: computed(chain, 'background'), title: computed([...chain, set('eld-sheet-title')], 'color') };
  };
  const menus = [over(MODE.WORLD, TAB_HUB_SKIN.town), over(MODE.WORLD, HUB_SKIN.MOUNTAIN), over(MODE.MIND, HUB_SKIN.MOUNTAIN), over(MODE.WORLD, TAB_HUB_SKIN.afk)];
  assert.deepEqual(menus.map((m) => m.column), MODE_COLUMNS);
  const party = over(MODE.WORLD, TAB_HUB_SKIN.party), player = over(MODE.WORLD, TAB_HUB_SKIN.player), fight = menus[2];
  assert.deepEqual(party, fight, 'Menu over Party is Menu over Fight');
  assert.deepEqual(player, fight, 'Menu over Player is Menu over Fight');
  assert.equal(menus[3].background, menus[0].background, 'Menu over Hearth has the Veinharbor fill');
  // a pinned sheet beats the screen's chrome on every property, not just the fill: Settings over Town carries the Mind View glow
  const settingsOverTown = [root(MODE.WORLD, TAB_HUB_SKIN.town), set('eld-sheet-backdrop', 'eld-mode-mind'), set('eld-sheet', 'eld-panel')];
  assert.equal(computed(settingsOverTown, 'background'), computed([root(MODE.MIND, HUB_SKIN.MOUNTAIN), set('eld-sheet-backdrop', 'eld-mode-mind'), set('eld-sheet', 'eld-panel')], 'background'));
  assert.equal(computed(settingsOverTown, 'box-shadow'), '0 0 6px rgba(44, 171, 248, 0.25)', 'Settings over Town glows like Mind View');
  for (const m of menus) {
    assert.ok(m.background && !m.background.includes('UNSET'), `menu panel unresolved: ${m.background}`);
    assert.ok(m.background.includes(MODE_TOKENS[m.column]['--eld-panel']), `menu over ${m.column} is ${m.background}`);
    assert.equal(m.title, MODE_TOKENS[m.column]['--eld-display']);
  }
  assert.equal(new Set(menus.map((m) => m.background)).size, 3, 'three distinct menu panels (Hearth shares Veinharbor)');
  assert.equal(new Set(menus.map((m) => m.title)).size, 3, 'three distinct menu titles');
});

test('§D: each .eld-mode-<column> scope also carries the full set, so a pinned subtree inherits nothing', () => {
  for (const col of MODE_COLUMNS) {
    const chain = [set('eld-root', 'mode-world', 'hub-rpg'), set(`eld-mode-${col}`)];
    for (const name of MODE_TOKEN_NAMES) assert.equal(token(chain, name), MODE_TOKENS[col][name], `${col} ${name}`);
  }
});

test('the sheets are linked in the order this test assumes, and only the mode files define mode tokens', () => {
  const provider = readFileSync(new URL('./ThemeProvider.jsx', import.meta.url), 'utf8');
  const imported = [...provider.matchAll(/^import '([^']+\.css)';$/gm)].map((m) => m[1]);
  assert.deepEqual(imported, SHEETS);
  const hub = read('./hub.css').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const name of MODE_TOKEN_NAMES) {
    // hub.css is shared chrome; the tab-bar icon may zero out the art placeholder, nothing else.
    if (name.startsWith('--eld-art-ph-')) continue;
    assert.ok(!new RegExp(`${name}\\s*:`).test(hub), `hub.css must not define ${name}`);
  }
});
