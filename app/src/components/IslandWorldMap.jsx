import { useCallback, useEffect, useRef, useState } from 'react';
import { WORLDS } from '../data.js';
import '../map/islandMap.css';

/**
 * Mountain tab root — the island world map.
 * Locks: docs/Eldrathor_NodeMap_Art_Lock.md (warm RPG micro-pixel art, camera starts on the
 * south harbor) + playtest lock 2026-09-11 (CLAUDE.md): **pan only, no zoom**.
 * Hotspots → RallyScreen → node map.
 */

const MAP_SRC = '/maps/island-world.png';
const MAP_NATURAL = { w: 1280, h: 720 };
/** Fixed view scale relative to "island fits the viewport height" (1.0). Pan only — no zoom. */
const VIEW_ZOOM = 1.4;
const TAP_SLOP = 8;

/**
 * Hotspots as % of the island art (approximate — DESIGN-OPEN: precise hotspot %).
 * Clockwise intent from the south harbor: harbor → forest W1 → peninsula town W2 →
 * cliffs W3 → forge W4 → castle W5 → summit / Vaelyx. Table mirrored in
 * app/public/maps/README.md. (Audit A3: the 10-pin path lock becomes path art with these
 * 6 worlds tappable — handled by the island-path brief.)
 */
const ISLAND_HOTSPOTS = [
  { id: 'harbor', worldId: null, label: 'Veinharbor', sub: 'Town', x: 49, y: 85, glyph: '⚓' },
  { id: 'w1', worldId: 1, x: 29, y: 62, glyph: '♣' },
  { id: 'w2', worldId: 2, x: 20, y: 35, glyph: '⌂' },
  { id: 'w3', worldId: 3, x: 83, y: 47, glyph: '▲' },
  { id: 'w4', worldId: 4, x: 42, y: 44, glyph: '⚒' },
  { id: 'w5', worldId: 5, x: 51, y: 10, glyph: '♜', labelAbove: true },
  { id: 'w6', worldId: 6, x: 51, y: 22, glyph: '❖' },
];
const HARBOR = ISLAND_HOTSPOTS[0];

/** Keep pointer events flowing to the viewport during a drag; tolerate synthetic pointers. */
function capturePointer(el, pointerId) {
  try {
    el?.setPointerCapture?.(pointerId);
  } catch {
    /* no active pointer (synthetic event) — panning still works via bubbling */
  }
}

export default function IslandWorldMap({ unlocked, onSelectWorld, onHarbor }) {
  const vpRef = useRef(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [img, setImg] = useState(MAP_NATURAL);
  // null = untouched → derived "harbor" camera below (no setState-in-effect needed)
  const [cam, setCam] = useState(null);
  const gesture = useRef({ active: false, dist: 0, moved: false, target: null, last: null });

  const base = vp.w && vp.h ? Math.max(vp.w / img.w, vp.h / img.h) : 1;
  const scale = base * VIEW_ZOOM;

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
    const h = ISLAND_HOTSPOTS.find((x) => x.id === id);
    if (!h) return;
    if (h.id === 'harbor') {
      onHarbor?.();
      return;
    }
    const w = WORLDS.find((x) => x.id === h.worldId);
    if (!w || w.id > unlocked) return;
    onSelectWorld(w);
  }

  // Single-pointer pan. A second finger is ignored (no pinch zoom — playtest lock).
  function onPointerDown(e) {
    const g = gesture.current;
    if (g.active) return;
    g.active = true;
    g.dist = 0;
    g.moved = false;
    g.last = localPt(e);
    g.target = e.target.closest?.('[data-hotspot]')?.dataset.hotspot || null;
    capturePointer(vpRef.current, e.pointerId);
  }

  function onPointerMove(e) {
    const g = gesture.current;
    if (!g.active) return;
    const p = localPt(e);
    const dx = p.x - g.last.x;
    const dy = p.y - g.last.y;
    g.last = p;
    g.dist += Math.abs(dx) + Math.abs(dy);
    if (g.dist > TAP_SLOP) g.moved = true;
    setCam((prev) => {
      const c = prev ?? view;
      return clampCam({ x: c.x + dx, y: c.y + dy });
    });
  }

  function onPointerUp() {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    if (!g.moved && g.target) activateHotspot(g.target);
    g.target = null;
  }

  const held = WORLDS.filter((w) => w.id < unlocked).length;
  const total = WORLDS.length;

  return (
    <div style={S.wrap}>
      <div style={S.hud}>
        <div style={S.kick}>The climb begins</div>
        <div className="eld-brand-name" style={S.title}>The Mountain</div>
        <div style={S.prog}>
          {held} of {total} held · tap a pin to rally the bond
        </div>
      </div>

      <div
        ref={vpRef}
        className="eld-island-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="eld-island-layer"
          style={{ width: img.w, height: img.h, transform: `translate(${view.x}px, ${view.y}px) scale(${scale})` }}
        >
          <img
            className={`eld-island-img${scale >= 1 ? ' is-crisp' : ''}`}
            src={MAP_SRC}
            width={img.w}
            height={img.h}
            alt="Island of Eldrathor — Veinharbor at the south shore, the Worldforge and castle climbing to the crystal summit"
            draggable={false}
            onLoad={(e) => {
              const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
              if (w && h && (w !== img.w || h !== img.h)) setImg({ w, h });
            }}
          />

          {ISLAND_HOTSPOTS.map((h) => {
            const w = h.worldId ? WORLDS.find((x) => x.id === h.worldId) : null;
            const locked = w ? w.id > unlocked : false;
            const heldW = w ? w.id < unlocked : false;
            const open = w ? w.id === unlocked : false;
            const label = w ? w.shortName || w.name : h.label;
            const sub = w
              ? `${w.summit ? 'Summit' : `World ${w.id}`}${locked ? ' · locked' : heldW ? ' · held' : ' · open'}`
              : h.sub;
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

        <div className="eld-island-hint" aria-hidden="true">
          drag to pan
        </div>

        <div className="eld-island-ctl" onPointerDown={(e) => e.stopPropagation()}>
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
    color: 'var(--eld-muted, #8aa09a)',
    fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)',
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '0.14em',
    marginTop: 3,
    color: 'var(--eld-text, #e4efe8)',
  },
  prog: {
    fontSize: 11,
    fontStyle: 'italic',
    color: 'var(--eld-muted, #8aa09a)',
    marginTop: 4,
  },
};
