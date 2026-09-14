import Art from '../../art/Art.jsx';
import { TOWN_ART } from '../../town/townLayout.js';

/**
 * Raster art slot for Veinharbor (hero + destination thumbnails) — a thin wrapper over the manifest
 * `<Art>` so the Town layout tokens (object-position per slot) stay in townLayout.js. While the asset
 * is PENDING the labelled placeholder fills the same box, so layout never shifts when the art lands.
 */
export default function TownArt({ slot, className = '', style, alt = '' }) {
  const meta = TOWN_ART[slot];
  if (!meta) return null;
  return <Art name={meta.art} className={`eld-town-art ${className}`.trim()} style={style} position={meta.position} alt={alt} />;
}
