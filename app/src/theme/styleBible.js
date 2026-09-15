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
  /** Veinharbor — Town / Party / Player (and Seam). Sunlit wood — home lives here. Flat, no shadows. */
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
};

/** Which hub skin / expedition mode uses which Style Bible mode. */
export const MODE_FOR_SKIN = { mind: 'veinharbor', rpg: 'veinharbor', mountain: 'explore' };

/**
 * §D: the Style Bible column a screen (and every sheet / card opened over it) uses — Mind View while
 * the expedition is in MIND mode (fight / results / sanctuary), else the hub skin's column
 * (mountain → Exploration; everything else → Veinharbor).
 */
export function modeColumn(expeditionMode, hubSkin) {
  if (expeditionMode === 'MIND') return 'mind';
  return MODE_FOR_SKIN[hubSkin] || 'veinharbor';
}
export const MODE_COLUMNS = ['veinharbor', 'explore', 'mind'];
