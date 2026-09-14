import { useState } from 'react';
import { TOWN_ART } from '../../town/townLayout.js';

/**
 * Raster art slot for Veinharbor (hero + destination thumbnails). Stable dimensions come from the
 * parent (`width`/`height` or the row/hero boxes); the image is `object-fit: cover` with an
 * adjustable `object-position` per slot (`townLayout.js`). While the asset is PENDING (file missing
 * or fails to decode) a styled fallback — dark warm panel, slot glyph, faint slot name — fills the
 * same box, so layout never shifts when the art lands. Text, borders and controls are never part of
 * the raster: they are siblings drawn by the parent.
 */
export default function TownArt({ slot, className = '', style, alt = '' }) {
  const meta = TOWN_ART[slot];
  const [failed, setFailed] = useState(false);
  if (!meta) return null;
  return (
    <div className={`eld-town-art${failed ? ' is-pending' : ''} ${className}`.trim()} style={style} data-art-slot={slot} data-art-target={`${meta.target.w}x${meta.target.h}`}>
      {!failed && (
        <img
          src={meta.src}
          alt={alt}
          draggable={false}
          style={{ objectPosition: meta.position }}
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <div className="eld-town-art-fallback" aria-hidden="true">
          <span className="eld-town-art-glyph">{meta.glyph}</span>
          <span className="eld-town-art-name">{meta.label}</span>
        </div>
      )}
    </div>
  );
}
