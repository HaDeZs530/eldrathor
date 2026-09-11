import React, { useState } from 'react';

/**
 * Difficulty placeholder after world select.
 * // DESIGN-OPEN: real difficulty bands, modifiers, rewards — hold full design.
 */
export default function DifficultyScreen({ world, onConfirm, onBack }) {
  // DESIGN-OPEN: only Normal is meaningful for now; Hard/Brutal are stubs.
  const [selected, setSelected] = useState('normal');

  const options = [
    { id: 'normal', label: 'Normal', blurb: 'Standard expedition balance' },
    { id: 'hard', label: 'Hard', blurb: 'DESIGN-OPEN — not wired' },
    { id: 'brutal', label: 'Brutal', blurb: 'DESIGN-OPEN — not wired' },
  ];

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <div style={S.kick}>Prepare the bond</div>
        <div className="eld-brand-name" style={S.title}>{world.name}</div>
        <div style={S.sub}>
          Tier {world.tier}
          {world.boss ? ` · Boss: ${world.boss}` : ''}
        </div>
      </div>

      <div className="eld-panel" style={S.panel}>
        <div style={S.panelLbl}>Difficulty</div>
        <div style={S.note}>
          {/* DESIGN-OPEN: real difficulty design (enemy scaling, loot mult, unlock rules). */}
          Placeholder — Normal selected by default. Full difficulty design held open.
        </div>
        <div style={S.opts}>
          {options.map((o) => {
            const active = selected === o.id;
            const disabled = o.id !== 'normal';
            return (
              <button
                key={o.id}
                type="button"
                disabled={disabled}
                onClick={() => setSelected(o.id)}
                className="eld-card"
                style={{
                  ...S.opt,
                  borderColor: active ? (world.accent || 'var(--eld-accent)') : 'var(--eld-border)',
                  opacity: disabled ? 0.45 : 1,
                  boxShadow: active ? `0 0 14px ${world.accent || '#5fc7e0'}44` : 'none',
                }}
              >
                <div style={S.optLabel}>{o.label}</div>
                <div style={S.optBlurb}>{o.blurb}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={S.actions}>
        <button type="button" className="eld-btn eld-btn-ghost" onClick={onBack} style={S.btn}>
          Back
        </button>
        <button
          type="button"
          className="eld-btn"
          onClick={() => onConfirm(selected)}
          style={S.btn}
        >
          Confirm
        </button>
      </div>
    </div>
  );
}

const S = {
  wrap: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '14px 16px 12px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  head: { flexShrink: 0 },
  kick: {
    fontSize: 9,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    fontFamily: 'var(--eld-font-display)',
  },
  title: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  sub: { fontSize: 12, color: 'var(--eld-muted)', marginTop: 4 },
  panel: { padding: 14, flex: '0 0 auto' },
  panelLbl: {
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    marginBottom: 8,
  },
  note: {
    fontSize: 11,
    color: 'var(--eld-muted)',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 1.4,
  },
  opts: { display: 'flex', flexDirection: 'column', gap: 8 },
  opt: {
    textAlign: 'left',
    padding: '12px 14px',
    width: '100%',
    color: 'inherit',
    fontFamily: 'inherit',
    cursor: 'pointer',
    borderWidth: 1,
    borderStyle: 'solid',
  },
  optLabel: { fontSize: 14, fontWeight: 700 },
  optBlurb: { fontSize: 11, color: 'var(--eld-muted)', marginTop: 3 },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 'auto',
    paddingTop: 8,
  },
  btn: { flex: 1, padding: '12px 10px' },
};
