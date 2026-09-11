import React, { useEffect, useState } from 'react';
import { ARCHETYPES } from '../data.js';
import { nodeTypeMeta } from '../theme/tokens.js';

/**
 * Mind-view fight stage — visible party vs enemy, HP, resolving feed/timer.
 * Auto-resolves; player does not tap attacks.
 */
export default function FightScreen({
  world,
  node,
  party,
  partyHP,
  phase, // 'engage' | 'ambush' | 'resolving' | 'done'
  result, // { win, hpPct, duration, feed[] } when done / partial
  elapsedMs,
  resolveMs,
  fleeChance, // 0..1 while engaging (DESIGN-OPEN whether the player sees the number)
  onAttack,
  onFlee,
}) {
  const meta = nodeTypeMeta[node?.type] || nodeTypeMeta.normal;
  const enemyLabel =
    node?.type === 'boss'
      ? world?.boss || 'Boss'
      : meta.label;
  const progress = resolveMs > 0 ? Math.min(1, elapsedMs / resolveMs) : 0;
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (phase !== 'resolving') return undefined;
    const id = window.setInterval(() => setPulse((p) => p + 1), 400);
    return () => window.clearInterval(id);
  }, [phase]);

  const feed = result?.feed || [];
  const engaging = phase === 'engage' || phase === 'ambush';
  const showEnemyHp = engaging ? 1 : phase === 'resolving' ? Math.max(0.08, 1 - progress * 0.95) : result?.win ? 0 : 0.35;
  const showPartyHp = engaging
    ? partyHP
    : phase === 'resolving'
      ? Math.max(0.15, partyHP - progress * (1 - (result?.hpPct ?? partyHP)) * 0.7)
      : result?.hpPct ?? partyHP;
  const statusText =
    phase === 'engage' ? ' · attack or flee?' : phase === 'ambush' ? ' · AMBUSH' : phase === 'resolving' ? ' · resolving…' : result?.win ? ' · victory' : ' · defeat';

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.kick}>Mind View · {phase === 'engage' ? 'Engage' : 'Combat'}</div>
        <div className="eld-brand-name" style={S.title}>{enemyLabel}</div>
        <div style={S.sub}>
          {world?.name} · {meta.label}
          {statusText}
        </div>
      </div>

      <div className="eld-aura-frame eld-panel" style={S.stage}>
        <div style={S.sideCol}>
          <div style={S.sideLbl}>Party</div>
          {party.map((m, i) => {
            const a = ARCHETYPES[m.archetype];
            return (
              <div key={i} style={{ ...S.fighter, borderLeftColor: a.color }}>
                <div style={{ ...S.fname, color: a.color }}>{m.name}</div>
                <div style={S.fmeta}>{m.archetype}</div>
                <div style={S.barTrack}>
                  <div
                    style={{
                      ...S.barFill,
                      width: `${Math.round(showPartyHp * 100)}%`,
                      background: showPartyHp > 0.5 ? '#7fd6a0' : showPartyHp > 0.25 ? '#e0a04d' : '#e05d6f',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div style={S.vsCol}>
          <div style={{ ...S.vsGlyph, opacity: 0.7 + (pulse % 2) * 0.3 }}>{meta.glyph}</div>
          <div style={S.vsTimer}>
            {phase === 'resolving'
              ? `${(elapsedMs / 1000).toFixed(1)}s`
              : phase === 'done' && result
                ? `${result.duration}s`
                : '—'}
          </div>
          <div style={S.vsHint}>
            {phase === 'engage' ? 'Standoff' : phase === 'ambush' ? 'Ambush!' : phase === 'resolving' ? 'Auto-resolving' : 'Resolved'}
          </div>
        </div>

        <div style={S.sideCol}>
          <div style={S.sideLbl}>Foe</div>
          <div style={{ ...S.fighter, borderLeftColor: meta.color }}>
            <div style={{ ...S.fname, color: meta.color }}>{enemyLabel}</div>
            <div style={S.fmeta}>{meta.label}</div>
            <div style={S.barTrack}>
              <div
                style={{
                  ...S.barFill,
                  width: `${Math.round(showEnemyHp * 100)}%`,
                  background: meta.color,
                }}
              />
            </div>
          </div>
          <div style={S.pulseHint}>
            {phase === 'engage'
              ? 'It has not noticed you yet.'
              : phase === 'ambush'
                ? 'It cuts off the retreat.'
                : phase === 'resolving'
                  ? 'Veil thins…'
                  : result?.win
                    ? 'Foe falls.'
                    : 'Party breaks.'}
          </div>
        </div>
      </div>

      {phase === 'engage' && (
        <div style={S.actions}>
          <button type="button" className="eld-btn" style={S.actionBtn} onClick={onAttack}>
            Attack
          </button>
          <button type="button" className="eld-btn eld-btn-ghost" style={S.actionBtn} onClick={onFlee}>
            Flee
            {typeof fleeChance === 'number' && (
              <span style={S.actionSub}>{Math.round(fleeChance * 100)}% clean escape</span>
            )}
          </button>
        </div>
      )}
      {phase === 'ambush' && (
        <div style={S.ambushBanner} role="status">
          AMBUSH — the {enemyLabel} cuts off the retreat. Combat begins…
        </div>
      )}

      <div className="eld-panel" style={S.feedBox}>
        {feed.length === 0 && phase === 'engage' && (
          <div style={S.feedLine}>The party pauses at the edge of the node. Strike first, or slip away?</div>
        )}
        {feed.length === 0 && phase === 'resolving' && (
          <div style={S.feedLine}>The bond tightens. Blades find rhythm…</div>
        )}
        {feed.map((line, i) => (
          <div key={i} style={{ ...S.feedLine, color: line.color || '#9fb2bd' }}>
            {line.t}
          </div>
        ))}
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
    gap: 10,
    padding: '10px 12px 8px',
    textAlign: 'left',
    overflow: 'hidden',
  },
  head: { flexShrink: 0 },
  kick: {
    fontSize: 9,
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    color: '#5f8494',
    fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)',
  },
  title: { fontSize: 16, fontWeight: 700, marginTop: 3, color: '#e6f2f7' },
  sub: { fontSize: 11, color: '#5f8494', marginTop: 3, fontStyle: 'italic' },
  stage: {
    display: 'flex',
    gap: 8,
    padding: 12,
    flex: '1 1 auto',
    minHeight: 200,
    alignItems: 'stretch',
    background: 'radial-gradient(circle at 50% 40%, #0e2430 0%, #060d11 80%)',
  },
  sideCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 },
  sideLbl: {
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#5f8494',
  },
  fighter: {
    borderLeft: '3px solid',
    padding: '8px 8px',
    background: 'rgba(0,0,0,0.25)',
    borderRadius: 6,
  },
  fname: { fontSize: 12, fontWeight: 700 },
  fmeta: { fontSize: 10, color: '#5f8494', marginTop: 2 },
  barTrack: {
    marginTop: 6,
    height: 8,
    background: '#08141a',
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid #16303a',
  },
  barFill: { height: '100%', transition: 'width 0.35s linear' },
  vsCol: {
    width: 72,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  vsGlyph: { fontSize: 28, color: '#5fc7e0', textShadow: '0 0 16px rgba(95,199,224,0.5)' },
  vsTimer: {
    fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)',
    fontSize: 14,
    color: '#cfe0e8',
    fontVariantNumeric: 'tabular-nums',
  },
  vsHint: { fontSize: 9, color: '#5f8494', letterSpacing: '0.08em', textTransform: 'uppercase' },
  pulseHint: { fontSize: 11, color: '#5f8494', fontStyle: 'italic', marginTop: 4 },
  feedBox: {
    padding: 10,
    height: 110,
    overflowY: 'auto',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  feedLine: { fontSize: 11, lineHeight: 1.4, color: '#9fb2bd' },
  actions: { display: 'flex', gap: 10, flexShrink: 0 },
  actionBtn: {
    flex: 1,
    padding: '12px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    cursor: 'pointer',
  },
  actionSub: { fontSize: 9, letterSpacing: '0.04em', textTransform: 'none', opacity: 0.8, fontFamily: 'var(--eld-font-body, system-ui, sans-serif)' },
  ambushBanner: {
    flexShrink: 0,
    padding: '10px 12px',
    border: '1px solid #e05d6f',
    borderRadius: 8,
    color: '#e05d6f',
    background: 'rgba(224,93,111,0.12)',
    fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)',
    fontSize: 12,
    letterSpacing: '0.06em',
    textAlign: 'center',
    animation: 'fadein 0.3s ease',
  },
};
