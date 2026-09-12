/** Shared design tokens + mode ids for Eldrathor dual UI kits + hub skins. See design doc §3b/§3c. */

export const MODE = {
  WORLD: 'WORLD',
  MIND: 'MIND',
};

/** Hub navigation chrome skins (tab bar). Distinct from WORLD/MIND expedition dual-mode. */
export const HUB_SKIN = {
  MIND: 'mind',
  MOUNTAIN: 'mountain',
  RPG: 'rpg',
};

/**
 * Map hub tab id → hub skin family.
 * AFK/Seam uses mind (Gather/Idle). Process theme DESIGN-OPEN — slight forge glow via CSS class.
 * Market is no longer a root tab (under Town).
 */
export const TAB_HUB_SKIN = {
  player: HUB_SKIN.MIND,
  party: HUB_SKIN.MIND,
  mountain: HUB_SKIN.MOUNTAIN,
  town: HUB_SKIN.RPG,
  afk: HUB_SKIN.MIND,
};

export const colors = {
  // Shared / Mythros
  mythros: '#5fc7e0',
  mythrosDeep: '#1a4a5c',
  mythrosGlow: 'rgba(95, 199, 224, 0.45)',

  // WORLD — warm micro-pixel reality
  worldBg: '#2a1f14',
  worldBgMid: '#3d2a18',
  worldAmber: '#e0a04d',
  worldWood: '#8b5a2b',
  worldWoodDark: '#5c3a1a',
  worldCream: '#f0e0c0',
  worldInk: '#1a120a',
  worldSun: '#f5d080',

  // MIND — cold refined projection
  mindBg: '#060d11',
  mindBgMid: '#0a151a',
  mindPanel: '#0d1c22',
  mindBorder: '#1c3a44',
  mindText: '#cfe0e8',
  mindMuted: '#5f8494',
  mindDanger: '#e05d6f',
  mindGood: '#7fd6a0',
  mindLoot: '#e0a04d',

  // Mountain hybrid accents
  mountainGlow: 'rgba(95, 199, 224, 0.35)',
  mountainWarm: '#c4894a',

  // Process forge hint (DESIGN-OPEN theme)
  forgeGlow: 'rgba(224, 120, 60, 0.35)',
};

export const fonts = {
  worldDisplay: "'Press Start 2P', 'Courier New', monospace",
  worldBody: "system-ui, 'Segoe UI', sans-serif",
  mindDisplay: "Cinzel, Marcellus, 'Palatino Linotype', Georgia, serif",
  mindBody: "Cormorant Garamond, Georgia, 'Times New Roman', serif",
  mindUi: "system-ui, 'Segoe UI', sans-serif",
};

export const frame = {
  width: 390,
  height: 844,
};

/** Route map node types — docs/Eldrathor_RouteMap_v2_Lock.md §3 (fight / crystal / sanctuary / rare / boss). */
export const nodeTypeMeta = {
  normal: { label: 'Fight', glyph: '⚔', color: '#8aa0b5' },
  crystal: { label: 'Crystal', glyph: '❖', color: '#5fc7e0' },
  sanctuary: { label: 'Sanctuary', glyph: '✧', color: '#7fd6a0' },
  rare: { label: 'Rare', glyph: '☠', color: '#e05d6f' },
  boss: { label: 'Boss', glyph: '♛', color: '#e0a04d' },
};

/** Infused mat quality ladder (Process RNG). */
export const MAT_QUALITY = {
  Common: { color: '#9fb2bd', weight: 55 },
  Fine: { color: '#7fd6a0', weight: 25 },
  Rare: { color: '#6fb7d6', weight: 12 },
  Epic: { color: '#b58fe0', weight: 6 },
  Mythic: { color: '#e0a04d', weight: 2 },
};

export const GATHER_FAMILIES = [
  { id: 'wood', label: 'Wood', glyph: '🌲' },
  { id: 'metal', label: 'Metal', glyph: '⛏' },
  // DESIGN-OPEN: Hunt/Forage display name
  { id: 'hunt', label: 'Hunt', glyph: '🦌' },
];
