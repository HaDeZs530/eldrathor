import { ARCHETYPES, WEAPONS, TIER_COLOR } from '../data.js';
import { deriveDisplay } from '../combat/derive.js';

export function Header({ worldvein, mode, colors, hubLabel, actions }) {
  return (
    <div className="eld-header" style={S.header}>
      <div style={S.brand}>
        <span style={{ color: mode === 'MIND' ? colors.mythros : colors.worldAmber, fontSize: 18 }}>❖</span>
        <div>
          <div className="eld-display eld-screen-title">ELDRATHOR</div>
          <div style={S.brandSub}>{hubLabel || (mode === 'MIND' ? 'Mind View' : 'Veinharbor')}</div>
        </div>
      </div>
      <div style={S.right}>
        <div className="eld-chip" style={S.vein} title="Worldvein" aria-label={`${worldvein} Worldvein`}>
          <span style={{ color: colors.mythros }}>❖</span>
          <span style={S.veinNum}>{worldvein.toLocaleString()}</span>
        </div>
        {actions}
      </div>
    </div>
  );
}

/** Town hub — harbor functions + stash. World/expedition entry lives on Mountain tab. */
export function Harbor({ party, stash, setTab }) {
  const townFunctions = [
    { id: 'crafter', label: 'Crafter', sub: 'Forge armor and sockets' },
    { id: 'gathering', label: 'Gathering', sub: 'AFK material slots' },
    { id: 'idle', label: 'Idle Slots', sub: 'Party training berths' },
    { id: 'recruit', label: 'Recruit', sub: 'Find bonded Adventurers' },
  ];

  return (
    <div style={S.body}>
      <SectionTitle
        t="Your Party"
        action={
          <button type="button" className="eld-btn eld-btn-ghost" onClick={() => setTab('party')}>
            Manage
          </button>
        }
      />
      <div style={S.partyRow}>
        {party.map((m, i) => (
          <PartyCard key={i} m={m} />
        ))}
      </div>

      <SectionTitle t="Stash" />
      <div className="eld-panel" style={S.stash}>
        {stash.length === 0 && <div style={S.empty}>No loot yet. The mountain is waiting.</div>}
        {stash.slice(-6).reverse().map((g, i) => (
          <div key={i} style={{ ...S.lootChip, borderColor: TIER_COLOR[g.tier] }}>
            <span style={{ color: TIER_COLOR[g.tier] }}>{g.name}</span>
            <span style={S.rating}>{g.baseRating}/100{g.empower ? ` +${g.empower}` : ''}</span>
          </div>
        ))}
      </div>

      <SectionTitle t="Town Functions" sub="Tap a bar — screens stubbed for now" />
      <div style={S.worldList}>
        {townFunctions.map((fn) => (
          <div key={fn.id} className="eld-card" style={S.fnBar}>
            <div style={S.worldName}>{fn.label}</div>
            <div style={S.worldMeta}>{fn.sub} · DESIGN-OPEN</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PartyCard({ m }) {
  const a = ARCHETYPES[m.archetype];
  return (
    <div className="eld-card" style={{ ...S.pcard, borderTopColor: a.color }}>
      <div style={S.pcardName}>{m.name}</div>
      <div style={{ ...S.pcardRole, color: a.color }}>{m.archetype} · {a.role}</div>
      <div style={S.pcardWeapon}>{m.weapon}</div>
      <div style={S.pcardLvl}>Lv {m.level}</div>
    </div>
  );
}

export function PartyEditor({ party, setParty }) {
  function update(i, field, val) {
    setParty((p) => p.map((m, j) => (j === i ? { ...m, [field]: val } : m)));
  }
  return (
    <div style={S.body}>
      <SectionTitle t="Manage Party" />
      <div style={S.editGrid}>
        {party.map((m, i) => {
          const a = ARCHETYPES[m.archetype];
          return (
            <div key={i} className="eld-card" style={{ ...S.editCard, borderTopColor: a.color }}>
              <input style={S.nameInput} value={m.name} onChange={(e) => update(i, 'name', e.target.value)} />
              <label style={S.editLbl}>Archetype</label>
              <select style={S.select} value={m.archetype} onChange={(e) => update(i, 'archetype', e.target.value)}>
                {Object.keys(ARCHETYPES).map((k) => <option key={k}>{k}</option>)}
              </select>
              <div style={S.archBlurb}>{a.blurb}</div>
              <label style={S.editLbl}>Weapon</label>
              <select style={S.select} value={m.weapon} onChange={(e) => update(i, 'weapon', e.target.value)}>
                {Object.keys(WEAPONS).map((k) => <option key={k}>{k}</option>)}
              </select>
              <div style={S.statRow}>
                <span>HP {deriveDisplay(m).maxHp}</span>
                <span>DPS {deriveDisplay(m).dps}</span>
                <span>MIT {deriveDisplay(m).mitigation}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlaceholderPanel({ title, blurb }) {
  return (
    <div className="eld-placeholder">
      <h2>{title}</h2>
      <p>{blurb}</p>
      <div className="eld-panel" style={{ padding: 12, fontSize: 12, color: 'var(--eld-muted)' }}>
        Placeholder — full screen not built yet.
      </div>
    </div>
  );
}

function SectionTitle({ t, sub, action }) {
  return (
    <div style={S.secTitle}>
      <div>
        <div style={S.secText}>{t}</div>
        {sub && <div style={S.secSub}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}

const S = {
  // top safe-area inset is added here, once (the tab bar adds the bottom one); 0 until viewport-fit=cover applies
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: 'calc(10px + env(safe-area-inset-top, 0px)) 12px 10px', flexShrink: 0, minWidth: 0 },
  brand: { display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', minWidth: 0, overflow: 'hidden' },
  right: { display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 },
  brandSub: { fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--eld-muted)', marginTop: 2 },
  vein: { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.25)', border: '1px solid var(--eld-border)', padding: '5px 8px', whiteSpace: 'nowrap' },
  veinNum: { fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  veinLbl: { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--eld-muted)' },
  body: { flex: 1, overflowY: 'auto', padding: '14px 14px 12px', textAlign: 'left' },
  secTitle: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10, marginTop: 8 },
  secText: { fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--eld-font-display)' },
  secSub: { fontSize: 11, color: 'var(--eld-muted)', marginTop: 2 },
  partyRow: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  pcard: { flex: '1 1 90px', padding: '10px 8px', minWidth: 90, borderTop: '3px solid' },
  pcardName: { fontSize: 13, fontWeight: 700 },
  pcardRole: { fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 3 },
  pcardWeapon: { fontSize: 11, color: 'var(--eld-muted)', marginTop: 6 },
  pcardLvl: { fontSize: 10, color: 'var(--eld-muted)', marginTop: 4 },
  stash: { display: 'flex', flexDirection: 'column', gap: 6, padding: 10, marginBottom: 16 },
  lootChip: { display: 'flex', justifyContent: 'space-between', border: '1px solid', borderLeftWidth: 3, padding: '6px 10px', fontSize: 12 },
  rating: { color: 'var(--eld-muted)', fontVariantNumeric: 'tabular-nums' },
  empty: { color: 'var(--eld-muted)', fontSize: 12, fontStyle: 'italic', padding: '6px 0' },
  worldList: { display: 'flex', flexDirection: 'column', gap: 8 },
  worldCard: { textAlign: 'left', borderLeft: '3px solid', padding: '12px 14px', color: 'inherit', width: '100%', fontFamily: 'inherit' },
  fnBar: { textAlign: 'left', padding: '12px 14px', opacity: 0.85 },
  worldClock: { fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--eld-muted)' },
  worldName: { fontSize: 15, fontWeight: 700, margin: '3px 0 6px' },
  worldMeta: { display: 'flex', gap: 10, alignItems: 'center', fontSize: 11, color: 'var(--eld-muted)', flexWrap: 'wrap' },
  courtTag: { color: '#d67d4d', border: '1px solid #4a2f1e', borderRadius: 4, padding: '1px 6px', fontSize: 10 },
  lockTag: { color: 'var(--eld-danger)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' },
  editGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
  editCard: { padding: 14, borderTop: '3px solid' },
  nameInput: { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--eld-border)', color: 'inherit', borderRadius: 6, padding: '8px 10px', fontSize: 14, fontWeight: 700, marginBottom: 8, boxSizing: 'border-box' },
  editLbl: { fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--eld-muted)', display: 'block', margin: '8px 0 4px' },
  select: { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--eld-border)', color: 'inherit', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' },
  archBlurb: { fontSize: 11, color: 'var(--eld-muted)', fontStyle: 'italic', marginTop: 6 },
  statRow: { display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11, color: 'var(--eld-muted)', fontVariantNumeric: 'tabular-nums' },
};
