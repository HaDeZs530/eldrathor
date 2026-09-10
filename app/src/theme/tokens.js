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

/** Map hub tab id → hub skin family. */
export const TAB_HUB_SKIN = {
  player: HUB_SKIN.MIND,
  party: HUB_SKIN.MIND,
  mountain: HUB_SKIN.MOUNTAIN,
  town: HUB_SKIN.RPG,
  market: HUB_SKIN.RPG,
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

export const nodeTypeMeta = {
  normal: { label: 'Skirmish', glyph: '✦', color: '#8aa0b5' },
  rare: { label: 'Rare', glyph: '◈', color: '#e0a04d' },
  crystal: { label: 'Vein Crystal', glyph: '❖', color: '#5fc7e0' },
  boss: { label: 'Boss', glyph: '☠', color: '#e05d6f' },
};
