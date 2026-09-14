/**
 * Veinharbor (Town) layout tokens — VEINHARBOR VISUAL PASS, REVISION 1 (2026-09-14, ChatGPT spec,
 * Anthony-approved concept). Every number the spec sets lives here and is asserted by
 * `townLayout.test.js` ("tests are the spec"). Components read these; they are not duplicated in CSS.
 *
 * Amends the Dual-Mode Art Lock's "chunky micro-pixel kit UI" for Town only: painted pixel-art
 * harbor, dark warm panels, restrained antique-gold 1 px borders, Cinzel display titles.
 */
export const TOWN_LAYOUT = {
  heroHeight: 250, // full-width harbor illustration, CSS px
  listPaddingY: 12,
  listPaddingX: 14,
  rowMinHeight: 76,
  rowGap: 8,
  artWidth: 92, // illustrated region at the left of each destination row
  titlePx: 18, // Cinzel display
  subtitlePx: 14, // system UI face
  transitionMs: 220, // section change: opacity + small translate only (200–250 ms band)
  /** measured base heights kept for the first comparison against the 37ac668 capture */
  headerBase: 57,
  navBase: 76,
};

/** Art targets in device pixels (3× of the CSS slot): hero 390×250 → 1170×750; thumbnails 92×76 → 276×228. */
export const TOWN_ART_TARGETS = {
  hero: { w: 1170, h: 750 },
  thumb: { w: 276, h: 228 },
};

/**
 * Asset slots — all PENDING until the separate artwork arrives. `src` is where the file will be
 * served from (`app/public/town/`); until it exists the component renders the styled fallback.
 * `position` = CSS object-position, adjustable per slot without touching the component.
 */
export const TOWN_ART = {
  'veinharbor-hero': { src: '/town/veinharbor-hero.png', target: TOWN_ART_TARGETS.hero, position: '50% 60%', label: 'Veinharbor', glyph: '⚓' },
  'town-party': { src: '/town/town-party.png', target: TOWN_ART_TARGETS.thumb, position: '50% 50%', label: 'Party', glyph: '♟' },
  'town-crafter': { src: '/town/town-crafter.png', target: TOWN_ART_TARGETS.thumb, position: '50% 50%', label: 'Crafter', glyph: '⚒' },
  'town-smith': { src: '/town/town-smith.png', target: TOWN_ART_TARGETS.thumb, position: '50% 50%', label: 'Smith', glyph: '⚔' },
  'town-market': { src: '/town/town-market.png', target: TOWN_ART_TARGETS.thumb, position: '50% 50%', label: 'Market', glyph: '⚖' },
};

/** The four stacked destinations, in order. `section` is the existing Town section each one opens. */
export const TOWN_DESTINATIONS = [
  { id: 'party', art: 'town-party', title: 'Party', subtitle: 'Prepare your companions', opens: { tab: 'party' } },
  { id: 'crafter', art: 'town-crafter', title: 'Crafter', subtitle: 'Work with infused materials', opens: { section: 'crafter' } },
  { id: 'smith', art: 'town-smith', title: 'Smith', subtitle: 'Merge and empower weapons', opens: { section: 'upgrade' } },
  { id: 'market', art: 'town-market', title: 'Market', subtitle: 'Trade your finds', opens: { section: 'market' } },
];
