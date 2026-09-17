/**
 * Art manifest — docs/Eldrathor_Style_Bible_Lock.md §B. One entry per generated file: size in px
 * (@2x for a 390 pt phone), transparency, what it is for. Files live under `app/public/art/` and are
 * served from `/art/<file>`. Until a file exists the `<Art>` component renders a labelled placeholder
 * (flat panel in the mode's colour with the asset name in 11 px) so missing art is obvious on the phone.
 * `manifest.test.js` asserts the list matches the lock.
 */
import { AREAS, ARCHETYPES } from '../data.js';
import { TRASH_NAMES } from '../combat/enemies.js';
import { INNATES } from '../combat/simulate.js';

export const ART_BASE = '/art/';

/** "The Brinewarden" → "brinewarden", "Vein Husk" → "vein-husk", "Serpent’s Stair" → "serpents-stair". */
export const slug = (s) => String(s || '')
  .toLowerCase()
  .replace(/^the\s+/, '')
  .replace(/[’']/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

/** Area → biome file slug (one per Island Areas Lock area). */
export const areaSlug = (area) => slug(area?.shortName || area?.name);

/**
 * Enemy display name → base enemy slug. Named-variant adjectives and the Rare/Named prefixes are stripped
 * one at a time, but only while the remainder is not itself a known enemy: "Hollow Warden" is a base
 * enemy, "Grim Hollow Warden" is its named variant, "Named Rare Manifestation" is a Manifestation.
 */
export const ENEMY_PREFIXES = ['Named ', 'Rare ', 'Grim ', 'Hollow ', 'Ashen ', 'Vein-Scarred ', 'Bright-Eyed ', 'Old '];
const BASE_ENEMY_SLUGS = new Set(TRASH_NAMES.map((n) => slug(n)));
export function enemySlug(name) {
  let n = String(name || '');
  for (let guard = 0; guard < 4; guard++) {
    if (BASE_ENEMY_SLUGS.has(slug(n))) return slug(n);
    const p = ENEMY_PREFIXES.find((x) => n.startsWith(x) && n.length > x.length);
    if (!p) break;
    n = n.slice(p.length);
  }
  return slug(n);
}

const entry = (name, w, h, { transparent = false, kind, label, note } = {}) => ({ name, file: `${name}.png`, src: `${ART_BASE}${name}.png`, w, h, transparent, kind, label: label || name, note });

import { EQUIP_SLOTS } from '../progression/items.js';

export { EQUIP_SLOTS };
export const NODE_KINDS = ['unknown', 'fight', 'crystal', 'sanctuary', 'rare', 'boss', 'cleared', 'named'];
export const TAB_IDS = ['player', 'party', 'mountain', 'town', 'hearth'];

export const PORTRAITS_PER_ARCHETYPE = 3;

function build() {
  const list = [
    entry('veinharbor-hero', 1560, 500, { kind: 'illustration', label: 'Veinharbor' }),
    entry('town-party', 240, 184, { kind: 'illustration', label: 'Party' }),
    entry('town-crafter', 240, 184, { kind: 'illustration', label: 'Crafter' }),
    entry('town-smith', 240, 184, { kind: 'illustration', label: 'Smith' }),
    entry('town-market', 240, 184, { kind: 'illustration', label: 'Market' }),
    entry('island-map', 1560, 2400, { kind: 'illustration', label: 'The Island', note: 'pin art placed by code; the legacy /maps/island-world.png renders until this file lands' }),
    entry('parchment-tile', 1024, 1024, { kind: 'tile', label: 'Parchment' }),
    entry('fog-tile', 1024, 1024, { kind: 'tile', label: 'Fog', transparent: true }),
  ];
  for (const a of AREAS) list.push(entry(`biome-${areaSlug(a)}`, 1024, 1024, { kind: 'biome', label: a.name }));
  for (const k of NODE_KINDS) list.push(entry(`node-${k}`, 96, 96, { kind: 'icon', transparent: true, label: `node ${k}` }));
  list.push(entry('party-ring', 128, 128, { kind: 'icon', transparent: true, label: 'Party ring' }));
  // fight stage backdrops: the enemy types (the rare is a Manifestation, same backdrop) + The Brinewarden to start
  for (const n of TRASH_NAMES) list.push(entry(`enemy-${enemySlug(n)}`, 1560, 720, { kind: 'stage', label: n }));
  list.push(entry(`enemy-${enemySlug(AREAS[0].boss)}`, 1560, 720, { kind: 'stage', label: AREAS[0].boss }));
  for (const arch of Object.keys(ARCHETYPES)) for (let i = 1; i <= PORTRAITS_PER_ARCHETYPE; i++) list.push(entry(`portrait-${slug(arch)}-${i}`, 256, 256, { kind: 'portrait', transparent: true, label: `${arch} ${i}` }));
  for (const [arch, inn] of Object.entries(INNATES)) {
    list.push(entry(`icon-innate-${slug(inn.name)}`, 96, 96, { kind: 'icon', transparent: true, label: `${inn.name} (${arch})` }));
    list.push(entry(`icon-aura-${slug(inn.aura.id)}`, 96, 96, { kind: 'icon', transparent: true, label: inn.aura.name }));
  }
  for (const t of TAB_IDS) list.push(entry(`icon-tab-${t}`, 96, 96, { kind: 'icon', transparent: true, label: `tab ${t}` }));
  // Item Model §6: six premade equip-slot icons, made once, greyed by CSS when the slot is empty
  for (const s of EQUIP_SLOTS) list.push(entry(`icon-slot-${s}`, 96, 96, { kind: 'icon', transparent: true, label: `slot ${s}` }));
  return list;
}

export const MANIFEST = build();
export const BY_NAME = Object.fromEntries(MANIFEST.map((e) => [e.name, e]));
export const artEntry = (name) => BY_NAME[name] || null;
export const artSrc = (name) => BY_NAME[name]?.src || `${ART_BASE}${name}.png`;
