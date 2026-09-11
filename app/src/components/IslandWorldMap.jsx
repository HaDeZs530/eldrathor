import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WORLDS } from '../data.js';
import { ISLAND_PINS, islandRoutePaths } from '../map/islandPath.js';
import '../map/islandMap.css';

/**
 * Mountain tab root — the island world map.
 * Locks: docs/Eldrathor_NodeMap_Art_Lock.md (warm RPG micro-pixel art, pan + pinch/wheel
 * zoom on portrait, camera starts on the harbor) and docs/Eldrathor_Island_Path_Lock.md
 * (10 numbered pins 1→10 clockwise + a dotted spline route drawn in code; 4→5 hidden
 * behind the castle). Pin → DifficultyScreen → node map.
 */

const MAP_SRC = '/maps/island-world.png';
const MAP_NATURAL = { w: 1280, h: 720 };
const ZOOM_MIN = 1;
const ZOOM_MAX = 3.5;
/** Start zoomed on the south harbor (lock); zoom out (1.0 = whole island fits the height). */
const ZOOM_START = 1.4;
const TAP_SLOP = 8;

/** Keep pointer events flowing to the viewport during a drag; tolerate synthetic pointers. */
function capturePointer(el, pointerId) {
  try {
    el?.setPointerCapture?.(pointerId);
  } catch {
    /* no active pointer (synthetic event) — panning still works via bubbling */
  }
}

const HARBOR = ISLAND_PINS[0];
const pinWorld = (pin) => (pin.worldId ? WORLDS.find((w) => w.id === pin.worldId) : null);

const clampZ = (z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

export default function IslandWorldMap({ unlocked, onSelectWorld, onHarbor }) {
  const vpRef = useRef(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const [img, setImg] = useState(MAP_NATURAL);
  // null = untouched → derived "harbor" camera below (no setState-in-effect needed)
  const [cam, setCam] = useState(null);
  const pointers = useRef(new Map());
  const gesture = useRef({ dist: 0, moved: false, target: null, lastDist: 0, lastMid: null });
  const zoomAtRef = useRef(null);

  const base = vp.w && vp.h ? Math.max(vp.w / img.w, vp.h / img.h) : 1;

  const clampCam = useCallback(
    (c) => {
      const z = clampZ(c.z);
      const s = base * z;
      const W = img.w * s;
      const H = img.h * s;
      const x = W <= vp.w ? (vp.w - W) / 2 : Math.min(0, Math.max(vp.w - W, c.x));
      const y = H <= vp.h ? (vp.h - H) / 2 : Math.min(0, Math.max(vp.h - H, c.y));
      return { z, x, y };
    },
    [base, img, vp],
  );

  const camAtPct = useCallback(
    (px, py, z) => {
      const s = base * z;
      return clampCam({ z, x: vp.w / 2 - (px / 100) * img.w * s, y: vp.h / 2 - (py / 100) * img.h * s });
    },
    [base, clampCam, img, vp],
  );

  const view = cam ? clampCam(cam) : camAtPct(HARBOR.x, HARBOR.y, ZOOM_START);
  const scale = base * view.z;
  const routePaths = useMemo(() => islandRoutePaths(img.w, img.h), [img]);

  // Measure viewport (ResizeObserver fires once on observe, so no sync setState here).
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => setVp({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function zoomAt(factor, cx, cy) {
    setCam((prev) => {
      const c = prev ?? view;
      const z2 = clampZ(c.z * factor);
      const s1 = base * c.z;
      const s2 = base * z2;
      const ix = (cx - c.x) / s1;
      const iy = (cy - c.y) / s1;
      return clampCam({ z: z2, x: cx - ix * s2, y: cy - iy * s2 });
    });
  }
  useEffect(() => {
    zoomAtRef.current = zoomAt;
  });

  // React registers wheel as passive; attach natively so we can preventDefault page scroll.
  useEffect(() => {
    const el = vpRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAtRef.current?.(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  function localPt(e) {
    const r = vpRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function activateHotspot(id) {
    const pin = ISLAND_PINS.find((p) => String(p.n) === id);
    if (!pin) return;
    const w = pinWorld(pin);
    if (!w) {
      onHarbor?.(); // pin 1 = Veinharbor → Town tab
      return;
    }
    if (w.id > unlocked) return; // locked pins are inert
    onSelectWorld(w);
  }

  function onPointerDown(e) {
    const pts = pointers.current;
    const g = gesture.current;
    pts.set(e.pointerId, localPt(e));
    capturePointer(vpRef.current, e.pointerId);
    if (pts.size === 1) {
      g.dist = 0;
      g.moved = false;
      g.target = e.target.closest?.('[data-hotspot]')?.dataset.hotspot || null;
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      g.lastDist = Math.hypot(a.x - b.x, a.y - b.y);
      g.lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      g.moved = true;
    }
  }

  function onPointerMove(e) {
    const pts = pointers.current;
    if (!pts.has(e.pointerId)) return;
    const g = gesture.current;
    const prevP = pts.get(e.pointerId);
    const p = localPt(e);
    pts.set(e.pointerId, p);

    if (pts.size === 1) {
      const dx = p.x - prevP.x;
      const dy = p.y - prevP.y;
      g.dist += Math.abs(dx) + Math.abs(dy);
      if (g.dist > TAP_SLOP) g.moved = true;
      setCam((prev) => {
        const c = prev ?? view;
        return clampCam({ ...c, x: c.x + dx, y: c.y + dy });
      });
      return;
    }

    const [a, b] = [...pts.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const factor = g.lastDist ? dist / g.lastDist : 1;
    const dmx = g.lastMid ? mid.x - g.lastMid.x : 0;
    const dmy = g.lastMid ? mid.y - g.lastMid.y : 0;
    g.lastDist = dist;
    g.lastMid = mid;
    setCam((prev) => {
      const c = prev ?? view;
      const z2 = clampZ(c.z * factor);
      const s1 = base * c.z;
      const s2 = base * z2;
      const ix = (mid.x - c.x) / s1;
      const iy = (mid.y - c.y) / s1;
      return clampCam({ z: z2, x: mid.x - ix * s2 + dmx, y: mid.y - iy * s2 + dmy });
    });
  }

  function onPointerUp(e) {
    const pts = pointers.current;
    const g = gesture.current;
    pts.delete(e.pointerId);
    if (pts.size === 0) {
      if (!g.moved && g.target) activateHotspot(g.target);
      g.target = null;
      g.moved = false;
      g.dist = 0;
      g.lastDist = 0;
      g.lastMid = null;
    } else if (pts.size === 1) {
      g.lastDist = 0;
      g.lastMid = null;
    }
  }

  const held = WORLDS.filter((w) => w.id < unlocked).length;
  const total = WORLDS.length;

  return (
    <div style={S.wrap}>
      <div style={S.hud}>
        <div style={S.kick}>The climb begins</div>
        <div className="eld-brand-name" style={S.title}>The Mountain</div>
        <div style={S.prog}>
          {held} of {total} worlds held · route 1→10 · tap a pin to choose difficulty
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

          {/* Dotted route 1→10 drawn in code (two open splines; nothing behind the castle). */}
          <svg className="eld-island-route" width={img.w} height={img.h} viewBox={`0 0 ${img.w} ${img.h}`} aria-hidden="true">
            {routePaths.map((d, i) => (
              <g key={i}>
                <path d={d} className="eld-island-route-under" />
                <path d={d} className="eld-island-route-over" />
              </g>
            ))}
          </svg>

          {ISLAND_PINS.map((pin) => {
            const w = pinWorld(pin);
            const locked = w ? w.id > unlocked : false;
            const heldW = w ? w.id < unlocked : false;
            const open = w ? w.id === unlocked : false;
            const sub = w
              ? `${w.shortName || w.name}${locked ? ' · locked' : heldW ? ' · held' : ' · open'}`
              : 'Town';
            const cls = [
              'eld-hotspot',
              !w && 'is-harbor',
              w?.summit && 'is-summit',
              locked && 'is-locked',
              heldW && 'is-held',
              open && 'is-open',
            ]
              .filter(Boolean)
              .join(' ');
            const k = 1 / scale;
            return (
              <button
                key={pin.n}
                type="button"
                data-hotspot={String(pin.n)}
                className={cls}
                style={{ left: `${pin.x}%`, top: `${pin.y}%`, transformOrigin: '50% 12px', transform: `translate(-50%, -12px) scale(${k})` }}
                aria-label={`${pin.n}. ${pin.label}${locked ? ' (locked)' : ''}`}
                aria-disabled={locked || undefined}
                // Pointer taps are handled on pointerup (viewport captures the pointer);
                // onClick only serves keyboard activation (detail === 0).
                onClick={(e) => {
                  if (e.detail === 0) activateHotspot(String(pin.n));
                }}
              >
                <span className="eld-hotspot-pin" aria-hidden="true">{pin.n}</span>
                <span className="eld-hotspot-lbl">
                  {pin.label}
                  <span className="eld-hotspot-sub">{sub}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="eld-island-hint" aria-hidden="true">
          drag to pan
          <br />
          pinch / scroll to zoom
        </div>

        <div className="eld-island-ctl" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" aria-label="Zoom in" onClick={() => zoomAt(1.4, vp.w / 2, vp.h / 2)}>
            +
          </button>
          <button type="button" aria-label="Zoom out" onClick={() => zoomAt(1 / 1.4, vp.w / 2, vp.h / 2)}>
            −
          </button>
          <button type="button" aria-label="Return to harbor" onClick={() => setCam(camAtPct(HARBOR.x, HARBOR.y, ZOOM_START))}>
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
