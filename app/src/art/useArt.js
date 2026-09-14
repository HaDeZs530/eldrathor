/**
 * Asset probing hooks for the art manifest — one load per file per page; shared by <Art> and the
 * CSS-background users (parchment / fog tiles, the party ring). Kept out of Art.jsx so that file only
 * exports a component (fast refresh).
 */
import { useEffect, useState } from 'react';
import { artSrc } from './manifest.js';

// ---------- asset probing (one load per file per page; shared by <Art> and CSS-background users) ----------
const cache = new Map(); // src → 'ready' | 'pending' | Promise
function probe(src) {
  const c = cache.get(src);
  if (c === 'ready' || c === 'pending') return Promise.resolve(c);
  if (c) return c;
  if (typeof Image === 'undefined') { cache.set(src, 'pending'); return Promise.resolve('pending'); }
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { cache.set(src, 'ready'); resolve('ready'); };
    img.onerror = () => { cache.set(src, 'pending'); resolve('pending'); };
    img.src = src;
  });
  cache.set(src, p);
  return p;
}
export const artProbeCache = cache;

/**
 * 'loading' → 'ready' (the manifest file exists) | 'legacy' (it does not, but `legacySrc` does) | 'pending'.
 */
export function useArtStatus(name, legacySrc = null) {
  const src = artSrc(name);
  const known = cache.get(src);
  const [status, setStatus] = useState(() => (known === 'ready' ? 'ready' : known === 'pending' && !legacySrc ? 'pending' : 'loading'));
  useEffect(() => {
    let live = true;
    probe(src).then(async (s) => {
      if (!live) return;
      if (s === 'ready') { setStatus('ready'); return; }
      if (legacySrc) { const l = await probe(legacySrc); if (live) setStatus(l === 'ready' ? 'legacy' : 'pending'); return; }
      setStatus('pending');
    });
    return () => { live = false; };
  }, [src, legacySrc]);
  return status;
}

/** Statuses for a fixed list of names (one effect): { name: 'loading' | 'ready' | 'pending' }. */
export function useArtStatuses(names) {
  const key = names.join('|');
  const [map, setMap] = useState(() => Object.fromEntries(names.map((n) => [n, cache.get(artSrc(n)) === 'ready' ? 'ready' : cache.get(artSrc(n)) === 'pending' ? 'pending' : 'loading'])));
  useEffect(() => {
    let live = true;
    const list = key ? key.split('|') : [];
    Promise.all(list.map((n) => probe(artSrc(n)))).then((res) => { if (live) setMap(Object.fromEntries(list.map((n, i) => [n, res[i]]))); });
    return () => { live = false; };
  }, [key]);
  return map;
}

/** True once the manifest file is known to exist (for CSS background tiles / the party ring). */
export function useArtReady(name) {
  return useArtStatus(name) === 'ready';
}
