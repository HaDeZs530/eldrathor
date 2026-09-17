import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ISLAND_PINS, islandRoutePaths } from '../map/islandPath.js';
import { useArtStatus } from '../art/useArt.js';
import { artSrc } from '../art/manifest.js';
import PendingArt from '../art/PendingArt.jsx';
import '../map/islandMap.css';

/**
 * Mountain tab root — the island world map.
 * Locks: docs/Eldrathor_NodeMap_Art_Lock.md (warm RPG micro-pixel art, camera starts on the
 * south harbor) + docs/Eldrathor_UI_Shell_Lock.md: two zoom states toggled by a +/− control —
 * Close (1.4× fit-height, pan both axes) and Overview (fit height, horizontal pan; the DEFAULT
 * since 2026-09-12) — with a 250 ms crossfade that keeps the same focal point. Dotted Catmull-Rom route per
 * docs/Eldrathor_Island_Path_Lock.md; pins 2–10 sit on it. Hotspots → RallyScreen → route map.
 */

const LEGACY_MAP_SRC = '/maps/island-world.png'; // renders until the manifest's island-map.png (1560×2400) lands
const MAP_NATURAL = { w: 1280, h: 720 };
/** Zoom states relative to "island fits the viewport height" (1.0): Close = 1.4, Overview = 1.0. */
const ZOOM = { close: 1.4, overview: 1 };
const ZOOM_FADE_MS = 250;
const TAP_SLOP = 8;

/** Pin 1 = Veinharbor (opens Town); pins 2–10 = the nine areas, all tappable once unlocked. */
const HARBOR = { ...ISLAND_PINS[0], id: 'harbor', glyph: '⚓' };
const AREA_GLYPH = ['♣', '▲', '⌂', '⩘', '≈', '⌂', '⚒', '♜', '❖'];
function hotspotsFor(areas) {
  return [HARBOR, ...areas.map((a, i) => ({ ...(ISLAND_PINS[a.pin - 1] || ISLAND_PINS[i + 1]), id: `a${a.id}`, area: a, glyph: AREA_GLYPH[i] || '✦', labelAbove: a.pin === 10 || a.pin === 9 }))];
}

/** Keep pointer events flowing to the viewport during a drag; tolerate synthetic pointers. */
function capturePointer(el, pointerId) {
  try {
    el?.setPointerCapture?.(pointerId);
  } catch {
    /* no active pointer (synthetic event) — panning still works via bubbling */
  }
}

export default function IslandWorldMap({ areas, unlocked, onSelectArea, onHarbor }) {
  const hotspots = hotspotsFor(areas);
  const vpRef = useRef(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [img, setImg] = useState(MAP_NATURAL);
  // null = untouched → derived "harbor" camera below (no setState-in-effect needed)
  const [cam, setCam] = useState(null);
  // Default is Overview (zoomed out) — Anthony, phone playtest 2026-09-12; amends the UI Shell lock's "Close = default".
  const [zoomMode, setZoomMode] = useState('overview');
  const [fading, setFading] = useState(false);
  const gesture = useRef({ active: false, dist: 0, moved: false, target: null, last: null });

  const base = vp.w && vp.h ? Math.max(vp.w / img.w, vp.h / img.h) : 1;
  const scale = base * ZOOM[zoomMode];
  const routePaths = useMemo(() => islandRoutePaths(img.w, img.h), [img]);

  const clampCam = useCallback(
    (c) => {
      const W = img.w * scale;
      const H = img.h * scale;
      const x = W <= vp.w ? (vp.w - W) / 2 : Math.min(0, Math.max(vp.w - W, c.x));
      const y = H <= vp.h ? (vp.h - H) / 2 : Math.min(0, Math.max(vp.h - H, c.y));
      return { x, y };
    },
    [scale, img, vp],
  );

  const camAtPct = useCallback(
    (px, py) => clampCam({ x: vp.w / 2 - (px / 100) * img.w * scale, y: vp.h / 2 - (py / 100) * img.h * scale }),
    [clampCam, scale, img, vp],
  );

  const view = cam ? clampCam(cam) : camAtPct(HARBOR.x, HARBOR.y);

  /** Toggle Close ⇄ Overview keeping the image point at the viewport centre fixed. */
  function toggleZoom() {
    const next = zoomMode === 'close' ? 'overview' : 'close';
    const s1 = base * ZOOM[zoomMode];
    const s2 = base * ZOOM[next];
    const cx = vp.w / 2;
    const cy = vp.h / 2;
    const ix = (cx - view.x) / s1;
    const iy = (cy - view.y) / s1;
    const W = img.w * s2;
    const H = img.h * s2;
    const x = W <= vp.w ? (vp.w - W) / 2 : Math.min(0, Math.max(vp.w - W, cx - ix * s2));
    const y = H <= vp.h ? (vp.h - H) / 2 : Math.min(0, Math.max(vp.h - H, cy - iy * s2));
    setFading(true);
    setZoomMode(next);
    setCam({ x, y });
    window.setTimeout(() => setFading(false), ZOOM_FADE_MS);
  }

  // Measure viewport (ResizeObserver fires once on observe, so no sync setState here).
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setVp({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function localPt(e) {
    const r = vpRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function activateHotspot(id) {
    const h = hotspots.find((x) => x.id === id);
    if (!h) return;
    if (h.id === 'harbor') {
      onHarbor?.();
      return;
    }
    if (!h.area || h.area.id > unlocked) return;
    onSelectArea(h.area);
  }

  // Single-pointer pan. A second finger is ignored (no pinch zoom — playtest lock).
  function onPointerDown(e) {
    const g = gesture.current;
    if (g.active) return;
    // bug-fix pass 1 §4: controls never start a map gesture
    if (e.target.closest?.('.eld-island-ctl, [data-no-map-gesture]')) return;
    g.active = true;
    g.pointerId = e.pointerId; // §3: only this pointer can move / finish the gesture
    g.dist = 0;
    g.moved = false;
    g.last = localPt(e);
    g.target = e.target.closest?.('[data-hotspot]')?.dataset.hotspot || null;
    capturePointer(vpRef.current, e.pointerId);
  }

  function onPointerMove(e) {
    const g = gesture.current;
    if (!g.active || e.pointerId !== g.pointerId) return;
    const p = localPt(e);
    const dx = p.x - g.last.x;
    const dy = p.y - g.last.y;
    g.last = p;
    g.dist += Math.abs(dx) + Math.abs(dy);
    if (g.dist > TAP_SLOP) g.moved = true;
    if (fading) setFading(false);
    setCam((prev) => {
      const c = prev ?? view;
      return clampCam({ x: c.x + dx, y: c.y + dy });
    });
  }

  function onPointerUp(e) {
    const g = gesture.current;
    if (!g.active || (e && e.pointerId !== g.pointerId)) return;
    g.active = false;
    if (!g.moved && g.target) activateHotspot(g.target);
    g.target = null;
  }
  /** §3: a cancelled pointer (scroll takeover, second finger, system gesture) never counts as a tap. */
  function onPointerCancel(e) {
    const g = gesture.current;
    if (!g.active || (e && e.pointerId !== g.pointerId)) return;
    g.active = false; g.moved = false; g.target = null;
  }

  const islandArt = useArtStatus('island-map', LEGACY_MAP_SRC);
  const mapSrc = islandArt === 'ready' ? artSrc('island-map') : LEGACY_MAP_SRC;
  const held = areas.filter((a) => a.id < unlocked).length;
  const total = areas.length;

  // Style Bible §D: the island map is the Exploration column (parchment), pinned like Rally and the route map.
  return (
    <div className="eld-mode-explore" data-mode-column="explore" style={S.wrap}>
      <div style={S.hud}>
        <div style={S.kick}>The climb begins</div>
        <div className="eld-display" style={S.title}>The Island</div>
        <div style={S.prog}>
          {held} of {total} areas held · tap a pin to rally the bond
        </div>
      </div>

      <div
        ref={vpRef}
        className="eld-island-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div
          className={`eld-island-layer${fading ? ' is-fading' : ''}`}
          style={{ width: img.w, height: img.h, transform: `translate(${view.x}px, ${view.y}px) scale(${scale})` }}
        >
          <img
            className={`eld-island-img${scale >= 1 ? ' is-crisp' : ''}`}
            src={mapSrc}
            width={img.w}
            height={img.h}
            alt="Island of Eldrathor — Veinharbor at the south shore, the Worldforge and castle climbing to the crystal summit"
            draggable={false}
            onLoad={(e) => {
              const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
              if (w && h && (w !== img.w || h !== img.h)) setImg({ w, h });
            }}
          />

          {/* Dotted route 1→10 drawn in code (two open splines; nothing behind the castle). */}
          <svg className="eld-island-route" width={img.w} height={img.h} viewBox={`0 0 ${img.w} ${img.h}`} aria-hidden="true">
            {routePaths.map((d, i) => (
              <g key={i}>
                <path d={d} className="eld-island-route-under" />
                <path d={d} className="eld-island-route-over" />
              </g>
            ))}
          </svg>

          {hotspots.map((h) => {
            const w = h.area || null;
            const locked = w ? w.id > unlocked : false;
            const heldW = w ? w.id < unlocked : false;
            const open = w ? w.id === unlocked : false;
            const label = w ? w.shortName || w.name : h.label;
            const sub = w
              ? `Tier ${w.tier}${locked ? ' · locked' : heldW ? ' · held' : ' · open'}`
              : 'Town';
            const cls = [
              'eld-hotspot',
              h.id === 'harbor' && 'is-harbor',
              w?.summit && 'is-summit',
              locked && 'is-locked',
              heldW && 'is-held',
              open && 'is-open',
              h.labelAbove && 'label-above',
            ]
              .filter(Boolean)
              .join(' ');
            const k = 1 / scale;
            const style = h.labelAbove
              ? { left: `${h.x}%`, top: `${h.y}%`, transformOrigin: '50% calc(100% - 12px)', transform: `translate(-50%, calc(-100% + 12px)) scale(${k})` }
              : { left: `${h.x}%`, top: `${h.y}%`, transformOrigin: '50% 12px', transform: `translate(-50%, -12px) scale(${k})` };
            return (
              <button
                key={h.id}
                type="button"
                data-hotspot={h.id}
                className={cls}
                style={style}
                aria-label={`${label}${locked ? ' (locked)' : ''}`}
                aria-disabled={locked || undefined}
                // Pointer taps are handled on pointerup (viewport captures the pointer);
                // onClick only serves keyboard activation (detail === 0).
                onClick={(e) => {
                  if (e.detail === 0) activateHotspot(h.id);
                }}
              >
                <span className="eld-hotspot-pin" aria-hidden="true">{locked ? '✕' : h.glyph}</span>
                <span className="eld-hotspot-lbl">
                  {label}
                  <span className="eld-hotspot-sub">{sub}</span>
                </span>
              </button>
            );
          })}
        </div>

        {islandArt !== 'ready' && <PendingArt names={['island-map']} className="eld-island-art-pending" />}
        <div className="eld-island-hint" aria-hidden="true">
          drag to pan
          <br />
          {zoomMode === 'close' ? '− for overview' : '+ for close'}
        </div>

        <div className="eld-island-ctl" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" aria-label={zoomMode === 'close' ? 'Overview' : 'Close view'} onClick={toggleZoom}>
            {zoomMode === 'close' ? '−' : '+'}
          </button>
          <button type="button" aria-label="Return to harbor" onClick={() => setCam(camAtPct(HARBOR.x, HARBOR.y))}>
            ⚓
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  wrap: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  hud: {
    flexShrink: 0,
    padding: '10px 16px 8px',
    textAlign: 'left',
    zIndex: 2,
  },
  kick: {
    fontSize: 9,
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    fontFamily: 'var(--eld-font-display)',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '0.14em',
    marginTop: 3,
    color: 'var(--eld-text)',
  },
  prog: {
    fontSize: 11,
    fontStyle: 'italic',
    color: 'var(--eld-muted)',
    marginTop: 4,
  },
};
