
/**
 * Player tab — Mind-view Veinbinder screen (LOCKED Anthony 2026-09-10).
 * Top: base stats. Below (scroll): growth / purchasable upgrade placeholders.
 * // DESIGN-OPEN: economy costs, real Bond/Craft tree contents.
 */
export default function PlayerScreen({ worldvein = 0 }) {
  const stats = [
    { k: 'Bond Rank', v: 'I' },
    { k: 'Craft Rank', v: 'I' },
    { k: 'Vein Sense', v: '12' },
    { k: 'Will', v: '18' },
    { k: 'Resonance', v: '9' },
    { k: 'Stash Cap', v: '24' },
  ];

  // DESIGN-OPEN: costs & effects — stub rows only; economy not locked.
  const upgrades = [
    { id: 'bond-ii', tree: 'Bond', name: 'Deepen the Bond', blurb: 'Party vitality & tempo while projected.', cost: '???' },
    { id: 'bond-heal', tree: 'Bond', name: 'Shared Pulse', blurb: 'Minor mid-fight vitality echo.', cost: '???' },
    { id: 'craft-socket', tree: 'Craft', name: 'Socket Insight', blurb: 'Reveal one more gem socket on craft.', cost: '???' },
    { id: 'craft-merge', tree: 'Craft', name: 'Merge Familiarity', blurb: 'Weapon merge preview clarity.', cost: '???' },
    { id: 'sense-fog', tree: 'Sense', name: 'Fog Pierce', blurb: 'Expedition fog reveals +1 adjacency.', cost: '???' },
    { id: 'sense-loot', tree: 'Sense', name: 'Vein Glean', blurb: 'Slight Worldvein find bonus.', cost: '???' },
  ];

  return (
    <div style={S.wrap}>
      <div style={S.hero}>
        <div style={S.kick}>The Veinbinder · Player</div>
        <div className="eld-display eld-screen-title" style={S.title}>You</div>
        <div style={S.sub}>Base presence — growth purchased below</div>
        <div className="eld-panel" style={S.statGrid}>
          {stats.map((s) => (
            <div key={s.k} style={S.statCell}>
              <div style={S.statK}>{s.k}</div>
              <div style={S.statV}>{s.v}</div>
            </div>
          ))}
        </div>
        <div style={S.veinRow}>
          <span style={S.veinLbl}>Banked Worldvein</span>
          <span style={S.veinNum}>{worldvein.toLocaleString()} ❖</span>
        </div>
      </div>

      <div style={S.secHead}>Growth</div>
      <div style={S.note}>
        {/* DESIGN-OPEN: economy not locked — costs shown as ??? until Anthony locks sinks. */}
        Purchasable upgrades (placeholders). Costs DESIGN-OPEN.
      </div>
      <div style={S.list}>
        {upgrades.map((u) => (
          <div key={u.id} className="eld-card" style={S.upRow}>
            <div style={S.upTop}>
              <span style={S.treeTag}>{u.tree}</span>
              <span style={S.cost}>{u.cost} ❖</span>
            </div>
            <div style={S.upName}>{u.name}</div>
            <div style={S.upBlurb}>{u.blurb}</div>
            <button type="button" className="eld-btn" disabled style={S.buyBtn}>
              Purchase (locked)
            </button>
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
    overflowY: 'auto',
    padding: '12px 14px 16px',
    textAlign: 'left',
  },
  hero: { marginBottom: 14 },
  kick: {
    fontSize: 'var(--mv-label, 15px)',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    fontFamily: 'var(--eld-font-display)',
  },
  title: { fontSize: 'var(--mv-title, 26px)', fontWeight: 700, marginTop: 4, color: 'var(--eld-text)' },
  sub: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', fontStyle: 'italic', margin: '4px 0 10px' },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    padding: 12,
  },
  statCell: {
    background: 'rgba(0,0,0,0.22)',
    borderRadius: 8,
    padding: '8px 10px',
    border: '1px solid var(--eld-border)',
  },
  statK: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--eld-muted)' },
  statV: { fontSize: 'var(--mv-num, 24px)', fontWeight: 700, marginTop: 4, color: 'var(--eld-accent)' },
  veinRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    padding: '8px 4px',
  },
  veinLbl: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  veinNum: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700, color: 'var(--eld-accent)' },
  secHead: {
    fontSize: 'var(--mv-text, 18px)',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: 'var(--eld-font-display)',
    marginBottom: 4,
  },
  note: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', fontStyle: 'italic', marginBottom: 10 },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  upRow: { padding: 12 },
  upTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  treeTag: {
    fontSize: 'var(--mv-label, 15px)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--eld-accent)',
    border: '1px solid #1c4a54',
    borderRadius: 4,
    padding: '2px 6px',
  },
  cost: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', fontVariantNumeric: 'tabular-nums' },
  upName: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700 },
  upBlurb: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', marginTop: 4, lineHeight: 1.4 },
  buyBtn: { marginTop: 10, width: '100%', padding: '10px 8px', opacity: 0.55, cursor: 'not-allowed', minHeight: 'var(--mv-tap, 52px)' },
};
