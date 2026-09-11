import React from 'react';
import { WORLDS } from '../data.js';

/**
 * Mountain tab — stylized whole-island / mountain map with world crystal nodes.
 * Hybrid mountain chrome. Inspired by mockups/worldmap_mockup.html.
 * Not a plain button list.
 */
export default function IslandWorldMap({ unlocked, onSelectWorld }) {
  const held = WORLDS.filter((w) => w.id < unlocked).length;
  const total = WORLDS.length;

  return (
    <div style={S.wrap}>
      <div style={S.hud}>
        <div>
          <div style={S.kick}>The climb begins</div>
          <div className="eld-brand-name" style={S.title}>The Mountain</div>
          <div style={S.prog}>
            {held} of {total} held · tap a crystal to choose difficulty
          </div>
        </div>
      </div>

      <div style={S.stage} className="eld-island-stage">
        {/* layered mountain facets */}
        <div style={S.mtnBack} aria-hidden="true" />
        <div style={S.mtnFace} aria-hidden="true" />
        <div style={S.mtnLite} aria-hidden="true" />
        <div style={S.capGlow} aria-hidden="true" />
        <div style={S.shore} aria-hidden="true" />
        <div style={S.scry} aria-hidden="true" />

        <svg style={S.pathSvg} viewBox="0 0 390 620" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M 150 560 Q 90 500 120 440 Q 160 380 250 380 Q 300 330 250 280 Q 190 250 180 200 Q 185 150 195 110"
            fill="none"
            stroke="rgba(95,199,224,0.45)"
            strokeWidth="2"
            strokeDasharray="3 7"
            strokeLinecap="round"
          />
        </svg>

        {WORLDS.map((w) => {
          const pos = NODE_POS[w.id] || { left: '50%', top: '50%' };
          const locked = w.id > unlocked;
          const cleared = w.id < unlocked;
          const current = w.id === unlocked;
          const isSummit = !!w.summit;
          let stateStyle = S.nodeLocked;
          if (isSummit && !locked) stateStyle = S.nodeSummit;
          else if (isSummit && locked) stateStyle = { ...S.nodeLocked, ...S.nodeSummitDim };
          else if (current) stateStyle = S.nodeCurrent;
          else if (cleared) stateStyle = S.nodeCleared;

          return (
            <button
              key={w.id}
              type="button"
              disabled={locked}
              onClick={() => !locked && onSelectWorld(w)}
              style={{
                ...S.node,
                left: pos.left,
                top: pos.top,
                ...stateStyle,
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.55 : 1,
              }}
              aria-label={`${w.name}${locked ? ' (locked)' : ''}`}
            >
              <span style={{ ...S.gem, color: 'inherit' }}>
                <span
                  style={{
                    ...S.shard,
                    background: shardBg(w, { locked, cleared, current, isSummit }),
                    boxShadow: locked ? 'none' : `0 0 14px currentColor`,
                  }}
                />
              </span>
              <span style={S.nlabel}>{w.shortName || w.name}</span>
              <span style={S.nsub}>
                {w.summit ? 'The Summit' : `World ${w.id}`}
                {locked ? ' · locked' : cleared ? ' · held' : current ? ' · open' : ''}
                {w.court ? ' · Court' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Spiral positions (percent) matching mockup: shore → summit. */
const NODE_POS = {
  1: { left: '38%', top: '88%' },
  2: { left: '28%', top: '70%' },
  3: { left: '64%', top: '58%' },
  4: { left: '62%', top: '42%' },
  5: { left: '46%', top: '28%' },
  6: { left: '50%', top: '14%' },
};

function shardBg(w, { locked, cleared, current, isSummit }) {
  if (locked) return 'linear-gradient(160deg,#33475e,#22303f)';
  if (isSummit) return 'linear-gradient(160deg,#ffd0d8,#c0485e)';
  if (current) return 'linear-gradient(160deg,#bfeaff,#4a9fd4)';
  if (cleared) return 'linear-gradient(160deg,#9fffd0,#3fbf88)';
  return `linear-gradient(160deg, ${w.accent}cc, ${w.accent}88)`;
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
    padding: '10px 16px 6px',
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
  stage: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
    margin: '0 8px 8px',
    borderRadius: 10,
    border: '1px solid var(--eld-border, #3a5a68)',
    background:
      'radial-gradient(120% 80% at 50% 12%, rgba(60,120,180,.22), transparent 55%), linear-gradient(180deg,#0a1626 0%,#0c1418 45%,#1a1810 78%,#2a1f14 100%)',
  },
  mtnBack: {
    position: 'absolute',
    left: '50%',
    bottom: 40,
    transform: 'translateX(-50%)',
    width: 340,
    height: 520,
    background: 'linear-gradient(135deg,#20304a 0%,#182742 45%,#0e1b30 100%)',
    clipPath: 'polygon(50% 0,86% 46%,100% 100%,0 100%,14% 46%)',
    opacity: 0.85,
    pointerEvents: 'none',
  },
  mtnFace: {
    position: 'absolute',
    left: '50%',
    bottom: 40,
    transform: 'translateX(-50%)',
    width: 340,
    height: 520,
    background: 'linear-gradient(115deg,#2a3e5e 0%,#1c2e4a 38%,#12203a 62%,#0a1526 100%)',
    clipPath: 'polygon(50% 2%,50% 100%,0 100%,14% 46%)',
    opacity: 0.95,
    pointerEvents: 'none',
  },
  mtnLite: {
    position: 'absolute',
    left: '50%',
    bottom: 40,
    transform: 'translateX(-50%)',
    width: 340,
    height: 520,
    background: 'linear-gradient(160deg,rgba(92,180,240,.18),transparent 55%)',
    clipPath: 'polygon(50% 2%,86% 46%,50% 100%)',
    pointerEvents: 'none',
  },
  capGlow: {
    position: 'absolute',
    left: '50%',
    top: '10%',
    transform: 'translateX(-50%)',
    width: 120,
    height: 120,
    borderRadius: '50%',
    background: 'radial-gradient(circle,rgba(159,224,255,.35),transparent 65%)',
    filter: 'blur(4px)',
    pointerEvents: 'none',
  },
  shore: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
    background:
      'linear-gradient(180deg, transparent 0%, rgba(42,31,20,0.55) 40%, rgba(90,61,32,0.75) 100%)',
    pointerEvents: 'none',
  },
  scry: {
    position: 'absolute',
    inset: 0,
    opacity: 0.05,
    pointerEvents: 'none',
    background: 'repeating-linear-gradient(0deg,transparent 0 3px,#7fd0f0 3px 4px)',
  },
  pathSvg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  node: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    zIndex: 6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    background: 'transparent',
    border: 'none',
    padding: 4,
    fontFamily: 'inherit',
    color: '#bcd8ec',
    maxWidth: 120,
  },
  gem: {
    width: 34,
    height: 34,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shard: {
    width: 22,
    height: 30,
    clipPath: 'polygon(50% 0,100% 34%,80% 100%,20% 100%,0 34%)',
    display: 'block',
  },
  nlabel: {
    fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)',
    fontSize: 9,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'inherit',
    textShadow: '0 1px 4px #000',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 118,
  },
  nsub: {
    fontSize: 8,
    fontStyle: 'italic',
    color: 'var(--eld-muted, #6f9bc0)',
    marginTop: -2,
    whiteSpace: 'nowrap',
  },
  nodeCleared: { color: '#5fd6a0' },
  nodeCurrent: { color: '#5fc7e0' },
  nodeLocked: { color: '#3a4a5e' },
  nodeSummit: { color: '#e0687a' },
  nodeSummitDim: { color: '#6a4050' },
};
