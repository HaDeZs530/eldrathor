/**
 * Veinharbor (Town) layout tokens — docs/Eldrathor_Style_Bible_Lock.md §A (Veinharbor column),
 * which supersedes the Veinharbor visual pass rev 1 numbers: destination rows 92 px tall with a 120 px
 * illustration, Cinzel 22 titles, 13 px subtitles. Every number lives here and is asserted by
 * `townLayout.test.js` ("tests are the spec"). Components read these; they are not duplicated in CSS.
 */
import { MODES } from '../theme/styleBible.js';
import { artEntry } from '../art/manifest.js';

const ROW = MODES.veinharbor.destinationRow;

export const TOWN_LAYOUT = {
  heroHeight: 250, // full-width harbor illustration, CSS px (390 × 250 ≈ the manifest's 1560 × 500 at 2× with a 3:1 crop)
  listPaddingY: 12,
  listPaddingX: 14,
  rowMinHeight: ROW.heightPx, // 92
  rowGap: 8,
  artWidth: ROW.illustrationPx, // 120 — illustrated region at the left of each destination row
  titlePx: ROW.titlePx, // 22, Cinzel display
  subtitlePx: ROW.subtitlePx, // 13, system UI face
  transitionMs: 220, // section change: opacity + small translate only (200–250 ms band)
  headerBase: 57,
  navBase: 76,
};

/** Art targets in device pixels — the manifest's §B sizes (@2x): hero 1560×500; rows 240×184. */
export const TOWN_ART_TARGETS = {
  hero: { w: artEntry('veinharbor-hero').w, h: artEntry('veinharbor-hero').h },
  thumb: { w: artEntry('town-party').w, h: artEntry('town-party').h },
};

/**
 * Asset slots → manifest names (served from `app/public/art/`). Until a file exists `<Art>` renders the
 * labelled placeholder. `position` = CSS object-position, adjustable per slot without touching the component.
 */
export const TOWN_ART = {
  'veinharbor-hero': { art: 'veinharbor-hero', src: artEntry('veinharbor-hero').src, target: TOWN_ART_TARGETS.hero, position: '50% 60%', label: 'Veinharbor', glyph: '⚓' },
  'town-party': { art: 'town-party', src: artEntry('town-party').src, target: TOWN_ART_TARGETS.thumb, position: '50% 50%', label: 'Party', glyph: '♟' },
  'town-crafter': { art: 'town-crafter', src: artEntry('town-crafter').src, target: TOWN_ART_TARGETS.thumb, position: '50% 50%', label: 'Crafter', glyph: '⚒' },
  'town-smith': { art: 'town-smith', src: artEntry('town-smith').src, target: TOWN_ART_TARGETS.thumb, position: '50% 50%', label: 'Smith', glyph: '⚔' },
  'town-market': { art: 'town-market', src: artEntry('town-market').src, target: TOWN_ART_TARGETS.thumb, position: '50% 50%', label: 'Market', glyph: '⚖' },
};

/** The four stacked destinations, in order. `section` is the existing Town section each one opens. */
export const TOWN_DESTINATIONS = [
  { id: 'party', art: 'town-party', title: 'Party', subtitle: 'Prepare your companions', opens: { tab: 'party' } },
  { id: 'crafter', art: 'town-crafter', title: 'Crafter', subtitle: 'Work with infused materials', opens: { section: 'crafter' } },
  { id: 'smith', art: 'town-smith', title: 'Smith', subtitle: 'Merge and empower weapons', opens: { section: 'upgrade' } },
  { id: 'market', art: 'town-market', title: 'Market', subtitle: 'Trade your finds', opens: { section: 'market' } },
];
