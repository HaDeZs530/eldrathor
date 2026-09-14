import { useEffect } from 'react';
import { artSrc, artEntry } from './manifest.js';
import { useArtStatus } from './useArt.js';
import './art.css';

/**
 * `<Art name="…">` — renders the manifest PNG if it exists, otherwise the labelled placeholder
 * (flat panel in the mode's colour with the asset name in 11 px — Style Bible §C). The box keeps
 * the size the parent gives it either way, so layout never shifts when the art lands.
 * `fallback` (optional) replaces the placeholder with something small — e.g. a glyph inside a node
 * icon — for slots where a labelled box would not fit; the slot still carries `data-art-pending`.
 */
export default function Art({ name, alt = '', className = '', style, position, fit = 'cover', fallback = null, legacySrc = null, onStatus }) {
  const status = useArtStatus(name, legacySrc);
  const entry = artEntry(name);
  const pending = status === 'pending';
  useEffect(() => { if (onStatus) onStatus(status); }, [status, onStatus]);
  return (
    <span className={`eld-art${pending ? ' is-pending' : ''} ${className}`.trim()} style={style} data-art={name} data-art-pending={pending ? 'true' : undefined} data-art-target={entry ? `${entry.w}x${entry.h}` : undefined}>
      {status === 'ready' && <img src={artSrc(name)} alt={alt} draggable={false} style={{ objectFit: fit, objectPosition: position }} />}
      {status === 'legacy' && <img src={legacySrc} alt={alt} draggable={false} style={{ objectFit: fit, objectPosition: position }} />}
      {pending && (fallback != null ? <span className="eld-art-fallback" aria-hidden="true">{fallback}</span> : (
        <span className="eld-art-ph" aria-hidden="true">
          <span className="eld-art-ph-name">{entry?.file || `${name}.png`}</span>
          {entry && <span className="eld-art-ph-size">{entry.w}×{entry.h}{entry.transparent ? ' · transparent' : ''}</span>}
        </span>
      ))}
    </span>
  );
}
