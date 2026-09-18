/**
 * Style Bible — docs/Eldrathor_Style_Bible_Lock.md §A (LOCKED 2026-09-14). Every hex / px value the
 * lock sets lives here and is asserted by styleBible.test.js ("tests are the spec"). The stylesheets
 * (theme/*.css, components/ui/ui.css) carry the same literals; this module is the reference the
 * components read for inline numbers and the test reads for the values.
 */

/** Shared frame (all modes). */
export const FRAME = {
  outerBorderPx: 2,
  outerBorder: '#b8973f', // antique gold
  innerLinePx: 1,
  innerLine: '#5a4a22',
  radiusPx: 10,
  headerPx: 57,
  wordmark: 'ELDRATHOR',
  wordmarkPx: 22,
  wordmarkTracking: '0.08em',
  wordmarkColor: '#e6d6a8',
  headerIconPx: 32, // ? and ☰ — round-outlined
  tabBarPx: 76,
  tabBarBg: '#0f151d',
  tabIconPx: 28,
  tabLabelPx: 12,
  tabActive: '#e8c46a', // with a top hairline
};

/** Fonts: Cinzel for display (loaded once in index.html), system UI for body. */
export const FONTS = {
  display: "Cinzel, 'Palatino Linotype', Georgia, serif",
  body: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
};

/** The three modes. */
export const MODES = {
  /** Veinharbor — Town / Party / Player (and Hearth). Sunlit wood — home lives here. Flat, no shadows. */
  veinharbor: {
    tagline: 'Sunlit wood — home lives here',
    bg: '#080807',
    panel: '#141210',
    border: '#5a4a22',
    borderInner: '#292823',
    radiusPx: 10,
    displayPx: 26,
    displaySmallPx: 20,
    display: '#f0e2bd',
    bodyPx: 16,
    body: '#c9bfae',
    accent: '#e8c46a',
    subtitle: '#a89c88',
    button: { bg: '#141210', text: '#e8c46a' },
    destinationRow: { heightPx: 92, illustrationPx: 120, titlePx: 22, subtitlePx: 13 },
    shadows: false,
  },
  /** Exploration — route map. Parchment — worlds unfold. */
  explore: {
    tagline: 'Parchment — worlds unfold',
    bg: '#e8d5b7',
    fog: '#f3ead9',
    fogOpacity: 0.85,
    panel: '#f1e6cf',
    border: '#8a7350',
    radiusPx: 6,
    displayPx: 20,
    display: '#2b2118',
    bodyPx: 16,
    body: '#3a2e22',
    accent: '#345d66', // teal ink — cleared
    gold: '#c9962e', // party ring / Explore
    grainOpacity: 0.06,
    button: { primaryBg: '#c9962e', primaryText: '#2b2118', secondaryOutline: '#8a7350' },
  },
  /** Mind View — fight / results / cards. Sapphire crystal — farther sees. The only mode with glow. */
  mind: {
    tagline: 'Sapphire crystal — farther sees',
    bgTop: '#0c1a2b',
    bgBottom: '#152a41',
    panel: '#1a2b3b',
    card: '#23353f',
    border: '#3d6fa8',
    glowPx: 6,
    glow: '#2cabf8',
    glowOpacity: 0.25,
    radiusPx: 8,
    displayPx: 20,
    display: '#dfe9f5',
    bodyPx: 16,
    body: '#b7c6d8',
    mythros: '#2cabf8',
    hp: '#20a95e',
    mp: '#2cabf8',
    crit: '#f2c14e',
    damage: '#e5484d',
    button: { outline: '#3d6fa8', bg: '#1a2b3b', activeOutline: '#e8c46a' },
    partyCard: { across: 3, minPx: 120, portraitPx: 64, portraitFrame: '#b8973f', namePx: 15, barPx: 14, iconPx: 28, icons: 2 },
  },
  /** Bond bracket (UI Brackets lock, 2026-09-17). */
  bond: { bg: '#0e0a08', panel: '#1c1410', card: '#231a14', border: '#8a5a2b', borderInner: '#3a2a1c', display: '#f2d9b8', body: '#d9c4a8', muted: '#a88a6c', accent: '#e0782f', primary: '#c9642a', primaryText: '#1a0f08', radiusPx: 10 },
  /** Veinbinder bracket (UI Brackets lock, 2026-09-17). */
  veinbinder: { bg: '#0f0a14', panel: '#1b1220', card: '#221828', border: '#6b4fa0', borderInner: '#3b3746', display: '#e6d8f5', body: '#cfc4dc', muted: '#9a8fae', accent: '#a678f0', primary: '#7a55c9', primaryText: '#f4eefc', radiusPx: 10 },
  /** Hearth bracket (UI Brackets lock, 2026-09-17). */
  hearth: { bg: '#0a1010', panel: '#121a1a', card: '#172020', border: '#3f8f7a', borderInner: '#5a4a2b', display: '#d9ede6', body: '#c4d6d0', muted: '#8aa39c', accent: '#4fb39a', primary: '#2f8a72', primaryText: '#eafaf5', radiusPx: 10 },
};

/**
 * UI Brackets lock (2026-09-17) — `docs/Eldrathor_UI_Brackets_Lock.md` is the ONLY place that says which
 * bracket a screen uses; this table mirrors it (rule 1). Ruling lines: Party → Bond, Player + Settings →
 * Veinbinder, Hearth + Offline summary → Hearth; Town / Bag / Recruit stay Veinharbor; Exploration and
 * Mind View unchanged. The legacy `mind` hub skin is no tab's skin any more and resolves to Veinharbor.
 */
export const MODE_FOR_SKIN = { rpg: 'veinharbor', mind: 'veinharbor', mountain: 'explore', bond: 'bond', veinbinder: 'veinbinder', hearth: 'hearth' };

/**
 * §D: the bracket a screen (and every sheet / card opened over it) uses — Mind View while the
 * expedition is in MIND mode (fight / results / sanctuary), else the hub skin's bracket.
 */
export function modeColumn(expeditionMode, hubSkin) {
  if (expeditionMode === 'MIND') return 'mind';
  return MODE_FOR_SKIN[hubSkin] || 'veinharbor';
}
export const MODE_COLUMNS = ['veinharbor', 'explore', 'mind', 'bond', 'veinbinder', 'hearth'];

/**
 * §A — the FULL `--eld-*` token set every mode stylesheet must define (brief 2026-09-16, mode tokens).
 * Nothing falls back: `components/ui/ui.css` reads these with NO fallback value, so a column that
 * forgets a token renders visibly unset instead of quietly inheriting Veinharbor brown. The three
 * mode blocks are mutually exclusive and exhaustive over (expedition mode × hub skin):
 *   theme/world.css   `.eld-root.mode-world:not(.hub-mountain)`  → veinharbor
 *   theme/explore.css `.eld-root.hub-mountain:not(.mode-mind)`   → explore
 *   theme/mind.css    `.eld-root.mode-mind`                      → mind
 * `modeTokens.test.js` resolves the real cascade and asserts every column against this table.
 */
export const MODE_TOKENS = {
  veinharbor: {
    '--eld-bg': MODES.veinharbor.bg,
    '--eld-bg-mid': '#0e0d0b',
    '--eld-panel': MODES.veinharbor.panel,
    '--eld-card': '#191613',
    '--eld-border': MODES.veinharbor.border,
    '--eld-border-inner': MODES.veinharbor.borderInner,
    '--eld-panel-shadow': `inset 0 0 0 1px ${MODES.veinharbor.borderInner}`,
    '--eld-text': MODES.veinharbor.body,
    '--eld-display': MODES.veinharbor.display,
    '--eld-muted': MODES.veinharbor.subtitle,
    '--eld-accent': MODES.veinharbor.accent,
    '--eld-accent-glow': 'rgba(232, 196, 106, 0.25)',
    '--eld-gold': '#e8c46a',
    '--eld-mythros': '#2cabf8',
    '--eld-good': '#20a95e',
    '--eld-danger': '#e5484d',
    '--eld-header-bg': 'transparent',
    '--eld-btn-bg': MODES.veinharbor.button.bg,
    '--eld-btn-text': MODES.veinharbor.button.text,
    '--eld-btn-border': MODES.veinharbor.border,
    '--eld-btn-shadow': 'none',
    '--eld-btn-primary-bg': MODES.veinharbor.accent,
    '--eld-btn-primary-text': '#1a1206',
    '--eld-btn-ghost-border': MODES.veinharbor.border,
    '--eld-btn-ghost-text': MODES.veinharbor.body,
    '--eld-bar-track': 'rgba(0, 0, 0, 0.45)',
    '--eld-bar-border': 'rgba(255, 255, 255, 0.12)',
    '--eld-tabbar-bg': FRAME.tabBarBg,
    '--eld-tab-active': FRAME.tabActive,
    '--eld-tab-inactive': MODES.veinharbor.subtitle,
    '--eld-font-display': FONTS.display,
    '--eld-font-body': FONTS.body,
    '--eld-radius': `${MODES.veinharbor.radiusPx}px`,
    '--eld-shadow': 'none', // Veinharbor is FLAT — no drop shadows
    '--eld-art-ph-bg': MODES.veinharbor.panel,
    '--eld-art-ph-line': MODES.veinharbor.border,
    '--eld-art-ph-text': MODES.veinharbor.subtitle,
  },
  explore: {
    '--eld-bg': MODES.explore.bg,
    '--eld-bg-mid': MODES.explore.bg,
    '--eld-panel': MODES.explore.panel,
    '--eld-card': MODES.explore.panel,
    '--eld-border': MODES.explore.border,
    '--eld-border-inner': 'transparent',
    '--eld-panel-shadow': 'none',
    '--eld-text': MODES.explore.body,
    '--eld-display': MODES.explore.display,
    '--eld-muted': '#6f5d48',
    '--eld-accent': MODES.explore.accent,
    '--eld-accent-glow': 'rgba(52, 93, 102, 0.25)',
    '--eld-gold': MODES.explore.gold,
    '--eld-mythros': '#2cabf8',
    '--eld-good': '#20a95e',
    '--eld-danger': '#e5484d',
    '--eld-header-bg': MODES.explore.bg,
    '--eld-btn-bg': MODES.explore.panel,
    '--eld-btn-text': MODES.explore.display,
    '--eld-btn-border': MODES.explore.border,
    '--eld-btn-shadow': 'none',
    '--eld-btn-primary-bg': MODES.explore.button.primaryBg,
    '--eld-btn-primary-text': MODES.explore.button.primaryText,
    '--eld-btn-ghost-border': MODES.explore.button.secondaryOutline,
    '--eld-btn-ghost-text': MODES.explore.body,
    '--eld-bar-track': 'rgba(43, 33, 24, 0.25)',
    '--eld-bar-border': MODES.explore.border,
    '--eld-tabbar-bg': FRAME.tabBarBg,
    '--eld-tab-active': FRAME.tabActive,
    '--eld-tab-inactive': '#a89c88',
    '--eld-font-display': FONTS.display,
    '--eld-font-body': FONTS.body,
    '--eld-radius': `${MODES.explore.radiusPx}px`,
    '--eld-shadow': 'none',
    '--eld-art-ph-bg': MODES.explore.panel,
    '--eld-art-ph-line': MODES.explore.border,
    '--eld-art-ph-text': '#6f5d48',
  },
  mind: {
    '--eld-bg': MODES.mind.bgTop,
    '--eld-bg-mid': MODES.mind.bgBottom,
    '--eld-panel': MODES.mind.panel,
    '--eld-card': MODES.mind.card,
    '--eld-border': MODES.mind.border,
    '--eld-border-inner': 'transparent',
    '--eld-panel-shadow': '0 0 6px rgba(44, 171, 248, 0.25)',
    '--eld-text': MODES.mind.body,
    '--eld-display': MODES.mind.display,
    '--eld-muted': '#7f97b0',
    '--eld-accent': MODES.mind.mythros,
    '--eld-accent-glow': 'rgba(44, 171, 248, 0.45)',
    '--eld-gold': '#e8c46a',
    '--eld-mythros': MODES.mind.mythros,
    '--eld-good': '#20a95e',
    '--eld-danger': MODES.mind.damage,
    '--eld-header-bg': 'transparent',
    '--eld-btn-bg': MODES.mind.button.bg,
    '--eld-btn-text': MODES.mind.display,
    '--eld-btn-border': MODES.mind.button.outline,
    '--eld-btn-shadow': '0 0 6px rgba(44, 171, 248, 0.25)',
    '--eld-btn-primary-bg': MODES.mind.mythros,
    '--eld-btn-primary-text': '#06121f',
    '--eld-btn-ghost-border': MODES.mind.button.outline,
    '--eld-btn-ghost-text': MODES.mind.body,
    '--eld-bar-track': '#0a1522',
    '--eld-bar-border': '#2b4a6e',
    '--eld-tabbar-bg': FRAME.tabBarBg,
    '--eld-tab-active': FRAME.tabActive,
    '--eld-tab-inactive': '#7f97b0',
    '--eld-font-display': FONTS.display,
    '--eld-font-body': FONTS.body,
    '--eld-radius': `${MODES.mind.radiusPx}px`,
    '--eld-shadow': '0 0 6px rgba(44, 171, 248, 0.25)', // Mind View is the ONLY mode with glow
    '--eld-art-ph-bg': MODES.mind.panel,
    '--eld-art-ph-line': MODES.mind.border,
    '--eld-art-ph-text': '#7f97b0',
  },
  bond: {
    '--eld-bg': '#0e0a08',
    '--eld-bg-mid': '#140e0a',
    '--eld-panel': '#1c1410',
    '--eld-card': '#231a14',
    '--eld-border': '#8a5a2b',
    '--eld-border-inner': '#3a2a1c',
    '--eld-panel-shadow': '0 8px 18px -8px rgba(224, 120, 47, 0.45)',
    '--eld-text': '#d9c4a8',
    '--eld-display': '#f2d9b8',
    '--eld-muted': '#a88a6c',
    '--eld-accent': '#e0782f',
    '--eld-accent-glow': 'rgba(224, 120, 47, 0.35)',
    '--eld-gold': '#e8c46a',
    '--eld-mythros': '#2cabf8',
    '--eld-good': '#20a95e',
    '--eld-danger': '#e5484d',
    '--eld-header-bg': 'transparent',
    '--eld-btn-bg': '#1c1410',
    '--eld-btn-text': '#e0782f',
    '--eld-btn-border': '#8a5a2b',
    '--eld-btn-shadow': 'none',
    '--eld-btn-primary-bg': '#c9642a',
    '--eld-btn-primary-text': '#1a0f08',
    '--eld-btn-ghost-border': '#8a5a2b',
    '--eld-btn-ghost-text': '#d9c4a8',
    '--eld-bar-track': 'rgba(0, 0, 0, 0.45)',
    '--eld-bar-border': 'rgba(255, 255, 255, 0.12)',
    '--eld-tabbar-bg': '#0f151d',
    '--eld-tab-active': '#e8c46a',
    '--eld-tab-inactive': '#a88a6c',
    '--eld-font-display': "Cinzel, 'Palatino Linotype', Georgia, serif",
    '--eld-font-body': "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    '--eld-radius': '10px',
    '--eld-shadow': '0 8px 18px -8px rgba(224, 120, 47, 0.45)',
    '--eld-art-ph-bg': '#1c1410',
    '--eld-art-ph-line': '#8a5a2b',
    '--eld-art-ph-text': '#a88a6c',
  },
  veinbinder: {
    '--eld-bg': '#0f0a14',
    '--eld-bg-mid': '#150e1c',
    '--eld-panel': '#1b1220',
    '--eld-card': '#221828',
    '--eld-border': '#6b4fa0',
    '--eld-border-inner': '#3b3746',
    '--eld-panel-shadow': 'inset 0 0 0 1px #3b3746',
    '--eld-text': '#cfc4dc',
    '--eld-display': '#e6d8f5',
    '--eld-muted': '#9a8fae',
    '--eld-accent': '#a678f0',
    '--eld-accent-glow': 'rgba(166, 120, 240, 0.35)',
    '--eld-gold': '#e8c46a',
    '--eld-mythros': '#c9a6ff',
    '--eld-good': '#20a95e',
    '--eld-danger': '#e5484d',
    '--eld-header-bg': 'transparent',
    '--eld-btn-bg': '#1b1220',
    '--eld-btn-text': '#a678f0',
    '--eld-btn-border': '#6b4fa0',
    '--eld-btn-shadow': 'none',
    '--eld-btn-primary-bg': '#7a55c9',
    '--eld-btn-primary-text': '#f4eefc',
    '--eld-btn-ghost-border': '#6b4fa0',
    '--eld-btn-ghost-text': '#cfc4dc',
    '--eld-bar-track': 'rgba(0, 0, 0, 0.45)',
    '--eld-bar-border': 'rgba(255, 255, 255, 0.12)',
    '--eld-tabbar-bg': '#0f151d',
    '--eld-tab-active': '#e8c46a',
    '--eld-tab-inactive': '#9a8fae',
    '--eld-font-display': "Cinzel, 'Palatino Linotype', Georgia, serif",
    '--eld-font-body': "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    '--eld-radius': '10px',
    '--eld-shadow': 'none',
    '--eld-art-ph-bg': '#1b1220',
    '--eld-art-ph-line': '#6b4fa0',
    '--eld-art-ph-text': '#9a8fae',
  },
  hearth: {
    '--eld-bg': '#0a1010',
    '--eld-bg-mid': '#0e1616',
    '--eld-panel': '#121a1a',
    '--eld-card': '#172020',
    '--eld-border': '#3f8f7a',
    '--eld-border-inner': '#5a4a2b',
    '--eld-panel-shadow': 'inset 0 0 0 1px #5a4a2b',
    '--eld-text': '#c4d6d0',
    '--eld-display': '#d9ede6',
    '--eld-muted': '#8aa39c',
    '--eld-accent': '#4fb39a',
    '--eld-accent-glow': 'rgba(79, 179, 154, 0.3)',
    '--eld-gold': '#e8c46a',
    '--eld-mythros': '#2cabf8',
    '--eld-good': '#20a95e',
    '--eld-danger': '#e5484d',
    '--eld-header-bg': 'transparent',
    '--eld-btn-bg': '#121a1a',
    '--eld-btn-text': '#4fb39a',
    '--eld-btn-border': '#3f8f7a',
    '--eld-btn-shadow': 'none',
    '--eld-btn-primary-bg': '#2f8a72',
    '--eld-btn-primary-text': '#eafaf5',
    '--eld-btn-ghost-border': '#3f8f7a',
    '--eld-btn-ghost-text': '#c4d6d0',
    '--eld-bar-track': 'rgba(0, 0, 0, 0.45)',
    '--eld-bar-border': 'rgba(255, 255, 255, 0.12)',
    '--eld-tabbar-bg': '#0f151d',
    '--eld-tab-active': '#e8c46a',
    '--eld-tab-inactive': '#8aa39c',
    '--eld-font-display': "Cinzel, 'Palatino Linotype', Georgia, serif",
    '--eld-font-body': "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    '--eld-radius': '10px',
    '--eld-shadow': 'none',
    '--eld-art-ph-bg': '#121a1a',
    '--eld-art-ph-line': '#3f8f7a',
    '--eld-art-ph-text': '#8aa39c',
  },
};

/** Every token name a mode stylesheet must define (the three columns are asserted to agree on this list). */
export const MODE_TOKEN_NAMES = Object.keys(MODE_TOKENS.veinharbor);

/** The CSS selector that carries each column's token block, in ThemeProvider link order. */
export const MODE_SELECTOR = {
  veinharbor: '.eld-root.mode-world:not(.hub-mountain):not(.hub-bond):not(.hub-veinbinder):not(.hub-hearth)',
  explore: '.eld-root.hub-mountain:not(.mode-mind)',
  mind: '.eld-root.mode-mind',
  bond: '.eld-root.mode-world.hub-bond',
  veinbinder: '.eld-root.mode-world.hub-veinbinder',
  hearth: '.eld-root.mode-world.hub-hearth',
};
