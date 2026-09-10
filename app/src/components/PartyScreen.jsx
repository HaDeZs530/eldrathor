import React, { useState } from 'react';
import { ARCHETYPES, WEAPONS } from '../data.js';
import GearPaperdoll from './GearPaperdoll.jsx';

const CLASS_GLYPH = {
  Bulwark: '🛡',
  Warden: '✚',
  Striker: '⚔',
  Adept: '✴',
  Resonator: '☯',
};

/**
 * Party tab — Mind-view (LOCKED Anthony 2026-09-10).
 * Top: party-of-3 list. Below: extra roster + Create character.
 * Tap member → detail (stats top, purchasable upgrades below) — same shape as Player.
 */
export default function PartyScreen({ party, setParty, roster, setRoster }) {
  const [detail, setDetail] = useState(null); // { source: 'party'|'roster', index }

  if (detail) {
    const list = detail.source === 'party' ? party : roster;
    const member = list[detail.index];
    if (!member) {
      return null;
    }
    return (
      <MemberDetail
        member={member}
        onBack={() => setDetail(null)}
        onChange={(next) => {
          if (detail.source === 'party') {
            setParty((p) => p.map((m, i) => (i === detail.index ? next : m)));
          } else {
            setRoster((r) => r.map((m, i) => (i === detail.index ? next : m)));
          }
        }}
        onPromoteToParty={
          detail.source === 'roster'
            ? () => {
                // Swap into first party slot if full — DESIGN-OPEN: real swap UI.
                setParty((p) => {
                  const next = [...p];
                  const displaced = next[0];
                  next[0] = member;
                  setRoster((r) => {
                    const without = r.filter((_, i) => i !== detail.index);
                    return displaced ? [...without, displaced] : without;
                  });
                  return next;
                });
                setDetail(null);
              }
            : null
        }
      />
    );
  }

  function createCharacter() {
    const names = ['Nyra', 'Thalen', 'Mirke', 'Sable', 'Corin', 'Elda'];
    const archKeys = Object.keys(ARCHETYPES);
    const weaponKeys = Object.keys(WEAPONS);
    const n = {
      name: names[Math.floor(Math.random() * names.length)],
      archetype: archKeys[Math.floor(Math.random() * archKeys.length)],
      weapon: weaponKeys[Math.floor(Math.random() * weaponKeys.length)],
      level: 1,
    };
    setRoster((r) => [...r, n]);
  }

  return (
    <div style={S.wrap}>
      <div style={S.kick}>Mind View · Party</div>
      <div className="eld-brand-name" style={S.title}>Bonded Three</div>
      <div style={S.sub}>Active expedition party</div>

      <div className="eld-panel" style={S.partyBox}>
        {party.map((m, i) => (
          <MemberRow
            key={`p-${i}`}
            m={m}
            badge={`Slot ${i + 1}`}
            onClick={() => setDetail({ source: 'party', index: i })}
          />
        ))}
      </div>

      <div style={S.secHead}>Roster</div>
      <div style={S.sub}>Extra characters — tap for detail</div>
      <div style={S.rosterList}>
        {roster.length === 0 && (
          <div className="eld-panel" style={S.empty}>No reserves yet. Create a character below.</div>
        )}
        {roster.map((m, i) => (
          <MemberRow
            key={`r-${i}`}
            m={m}
            badge="Reserve"
            onClick={() => setDetail({ source: 'roster', index: i })}
          />
        ))}
      </div>

      <button type="button" className="eld-btn" onClick={createCharacter} style={S.createBtn}>
        Create new character
      </button>
    </div>
  );
}

function MemberRow({ m, badge, onClick }) {
  const a = ARCHETYPES[m.archetype] || { color: '#5fc7e0', role: '?' };
  return (
    <button type="button" className="eld-card" onClick={onClick} style={{ ...S.row, borderLeftColor: a.color }}>
      <div style={S.rowTop}>
        <span style={{ ...S.name, color: a.color }}>{m.name}</span>
        <span style={S.badge}>{badge}</span>
      </div>
      <div style={S.meta}>
        {m.archetype} · {a.role} · Lv {m.level}
      </div>
      <div style={S.weapon}>{m.weapon}</div>
    </button>
  );
}

function MemberDetail({ member, onBack, onChange, onPromoteToParty }) {
  const a = ARCHETYPES[member.archetype];
  const hp = a.hp + member.level * 12;
  const atk = a.atk + member.level * 2;
  const def = a.def;

  const stats = [
    { k: 'Level', v: String(member.level) },
    { k: 'Role', v: a.role },
    { k: 'HP', v: String(hp) },
    { k: 'ATK', v: String(atk) },
    { k: 'DEF', v: String(def) },
    { k: 'Weapon', v: member.weapon },
  ];

  // DESIGN-OPEN: per-adventurer upgrade economy.
  const upgrades = [
    { id: 'lvl', tree: 'Growth', name: 'Train Level', blurb: 'Raise level (+HP/ATK).', cost: '???' },
    { id: 'weapon', tree: 'Gear', name: 'Weapon Affinity', blurb: 'Slight tempo/dmg from current weapon.', cost: '???' },
    { id: 'gem', tree: 'Gems', name: 'Class Gem Slot', blurb: 'Unlock a class-gem active (DESIGN-OPEN).', cost: '???' },
    { id: 'armor', tree: 'Craft', name: 'Armor Fitting', blurb: 'Armor is crafted only — fitting stub.', cost: '???' },
  ];

  return (
    <div style={S.wrap}>
      <button type="button" className="eld-btn eld-btn-ghost" onClick={onBack} style={S.back}>
        ← Party
      </button>
      <div style={S.kick}>Mind View · Adventurer</div>
      <div className="eld-brand-name" style={{ ...S.title, color: a.color }}>{member.name}</div>
      <div style={S.sub}>{member.archetype} · {a.blurb}</div>

      <div className="eld-panel" style={S.statGrid}>
        {stats.map((s) => (
          <div key={s.k} style={S.statCell}>
            <div style={S.statK}>{s.k}</div>
            <div style={S.statV}>{s.v}</div>
          </div>
        ))}
      </div>

      <GearPaperdoll
        accent={a.color}
        classGlyph={CLASS_GLYPH[member.archetype] || '♟'}
        classLabel={member.archetype}
        weaponLabel={member.weapon}
      />

      <div style={S.editBlock}>
        <label style={S.editLbl}>Name</label>
        <input
          style={S.input}
          value={member.name}
          onChange={(e) => onChange({ ...member, name: e.target.value })}
        />
        <label style={S.editLbl}>Archetype</label>
        <select
          style={S.input}
          value={member.archetype}
          onChange={(e) => onChange({ ...member, archetype: e.target.value })}
        >
          {Object.keys(ARCHETYPES).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <label style={S.editLbl}>Weapon</label>
        <select
          style={S.input}
          value={member.weapon}
          onChange={(e) => onChange({ ...member, weapon: e.target.value })}
        >
          {Object.keys(WEAPONS).map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
      </div>

      {onPromoteToParty && (
        <button type="button" className="eld-btn" onClick={onPromoteToParty} style={S.promote}>
          Move into party (swap slot 1)
        </button>
      )}

      <div style={{ ...S.secHead, marginTop: 16 }}>Upgrades</div>
      <div style={S.note}>Purchasable stubs — costs DESIGN-OPEN.</div>
      <div style={S.rosterList}>
        {upgrades.map((u) => (
          <div key={u.id} className="eld-card" style={S.upRow}>
            <div style={S.rowTop}>
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
  kick: {
    fontSize: 9,
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted, #5f8494)',
    fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)',
  },
  title: { fontSize: 18, fontWeight: 700, marginTop: 4 },
  sub: { fontSize: 12, color: 'var(--eld-muted, #5f8494)', fontStyle: 'italic', margin: '4px 0 10px' },
  partyBox: { padding: 10, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  secHead: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)',
  },
  rosterList: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
  empty: { padding: 12, fontSize: 12, color: 'var(--eld-muted)', fontStyle: 'italic' },
  row: {
    textAlign: 'left',
    padding: '10px 12px',
    borderLeft: '3px solid',
    width: '100%',
    color: 'inherit',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
  rowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 14, fontWeight: 700 },
  badge: {
    fontSize: 9,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    border: '1px solid var(--eld-border)',
    borderRadius: 4,
    padding: '2px 6px',
  },
  meta: { fontSize: 11, color: 'var(--eld-muted)', marginTop: 4 },
  weapon: { fontSize: 11, color: 'var(--eld-muted)', marginTop: 2 },
  createBtn: { marginTop: 14, width: '100%', padding: '12px 10px' },
  back: { marginBottom: 10, padding: '8px 12px' },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    padding: 12,
    marginBottom: 12,
  },
  statCell: {
    background: 'rgba(0,0,0,0.22)',
    borderRadius: 8,
    padding: '8px 10px',
    border: '1px solid var(--eld-border, #1c3a44)',
  },
  statK: { fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--eld-muted)' },
  statV: { fontSize: 14, fontWeight: 700, marginTop: 4, color: 'var(--eld-accent, #5fc7e0)' },
  editBlock: { marginBottom: 12 },
  editLbl: {
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    display: 'block',
    margin: '8px 0 4px',
  },
  input: {
    width: '100%',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--eld-border, #1c3a44)',
    color: 'inherit',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 13,
    boxSizing: 'border-box',
  },
  promote: { width: '100%', padding: '10px 8px', marginBottom: 4 },
  note: { fontSize: 11, color: 'var(--eld-muted)', fontStyle: 'italic', margin: '4px 0 8px' },
  upRow: { padding: 12 },
  treeTag: {
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#5fc7e0',
    border: '1px solid #1c4a54',
    borderRadius: 4,
    padding: '2px 6px',
  },
  cost: { fontSize: 12, color: 'var(--eld-muted)', fontVariantNumeric: 'tabular-nums' },
  upName: { fontSize: 14, fontWeight: 700, marginTop: 4 },
  upBlurb: { fontSize: 12, color: 'var(--eld-muted)', marginTop: 4, lineHeight: 1.4 },
  buyBtn: { marginTop: 10, width: '100%', padding: '10px 8px', opacity: 0.55, cursor: 'not-allowed' },
};
