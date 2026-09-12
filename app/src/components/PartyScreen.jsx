import React, { useState } from 'react';
import { ARCHETYPES, WEAPONS, STATS, STAT_LABELS, ARCHETYPE_SEEDS } from '../data.js';
import GearPaperdoll from './GearPaperdoll.jsx';
import { deriveDisplay } from '../combat/derive.js';
import { INNATES } from '../combat/simulate.js';

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
  const [creating, setCreating] = useState(false);

  if (creating) {
    return (
      <CreateCharacter
        onCancel={() => setCreating(false)}
        onCreate={(n) => {
          setRoster((r) => [...r, n]);
          setCreating(false);
        }}
      />
    );
  }

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

      <button type="button" className="eld-btn" onClick={() => setCreating(true)} style={S.createBtn}>
        Create new character
      </button>
    </div>
  );
}

// DESIGN-OPEN: starting weapon per class — sensible defaults; weapon can be changed in detail.
const DEFAULT_WEAPON = {
  Bulwark: 'Sword + Shield',
  Warden: 'Staff',
  Striker: 'Dual Daggers',
  Adept: 'Orb + Tome',
  Resonator: 'Bow',
};

/**
 * Character creation — name + class, then confirm (playtest polish brief §3).
 * Nothing nameless or classless reaches the roster.
 */
function CreateCharacter({ onCancel, onCreate }) {
  const [name, setName] = useState('');
  const [archetype, setArchetype] = useState(null);
  const trimmed = name.trim();
  const ready = trimmed.length > 0 && !!archetype;
  const a = archetype ? ARCHETYPES[archetype] : null;

  return (
    <div style={S.wrap}>
      <button type="button" className="eld-btn eld-btn-ghost" onClick={onCancel} style={S.back}>
        ← Party
      </button>
      <div style={S.kick}>Mind View · New Adventurer</div>
      <div className="eld-brand-name" style={S.title}>Bind a new Adventurer</div>
      <div style={S.sub}>Give them a name and choose a class. Both are required.</div>

      <div className="eld-panel" style={S.createPanel}>
        <label style={S.editLbl} htmlFor="eld-create-name">Name</label>
        <input
          id="eld-create-name"
          style={S.input}
          value={name}
          maxLength={18}
          placeholder="e.g. Nyra"
          autoComplete="off"
          onChange={(e) => setName(e.target.value)}
        />

        <div style={{ ...S.editLbl, marginTop: 12 }}>Class</div>
        <div style={S.classList}>
          {Object.entries(ARCHETYPES).map(([k, v]) => {
            const active = archetype === k;
            return (
              <button
                key={k}
                type="button"
                className="eld-card"
                onClick={() => setArchetype(k)}
                style={{
                  ...S.classCard,
                  borderLeftColor: v.color,
                  boxShadow: active ? `0 0 0 1px ${v.color}, 0 0 16px ${v.color}55` : undefined,
                }}
                aria-pressed={active}
              >
                <div style={S.rowTop}>
                  <span style={{ ...S.name, color: v.color }}>{CLASS_GLYPH[k]} {k}</span>
                  <span style={S.badge}>{v.role}</span>
                </div>
                <div style={S.meta}>{v.blurb}</div>
                <div style={S.weapon}>Starts with {DEFAULT_WEAPON[k]}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={S.createSummary}>
        {ready ? (
          <span>
            <strong style={{ color: a.color }}>{trimmed}</strong> the {archetype} · {DEFAULT_WEAPON[archetype]} · Lv 1
          </span>
        ) : (
          <span style={{ color: 'var(--eld-muted)' }}>{!trimmed ? 'Enter a name' : 'Pick a class'} to continue.</span>
        )}
      </div>
      <button
        type="button"
        className="eld-btn"
        disabled={!ready}
        style={{ ...S.createBtn, opacity: ready ? 1 : 0.5 }}
        onClick={() => ready && onCreate({ name: trimmed, archetype, weapon: DEFAULT_WEAPON[archetype], level: 1 })}
      >
        Confirm
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
  const d = deriveDisplay(member);
  const inn = INNATES[member.archetype];

  // Derived combat values (combat v2 §2) — seeds × level × weapon; gems multiply later.
  const stats = [
    { k: 'Level', v: String(member.level) },
    { k: 'Role', v: a.role },
    { k: 'Max HP', v: String(d.maxHp) },
    { k: 'Hit / swing', v: `${d.hitDamage} / ${d.swingInterval}s` },
    { k: 'DPS', v: String(d.dps) },
    { k: 'Mitigation', v: `${d.mitigation}%` },
    { k: 'Crit', v: `${d.critChance}% ×${d.critMult}` },
    { k: 'Mana', v: `${d.maxMana} · +${d.manaRegen}/s` },
    { k: 'Innate', v: inn ? `${inn.glyph} ${inn.name}` : '—' },
    { k: 'Aura', v: inn ? `${inn.aura.glyph} ${inn.aura.name}` : '—' },
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

      <div style={S.secHead}>Base seeds</div>
      <div style={S.note}>Base seeds — gems multiply these.</div>
      <div className="eld-panel" style={S.seedList}>
        {STATS.map((k) => {
          const v = ARCHETYPE_SEEDS[member.archetype]?.[k] ?? 10;
          return (
            <div key={k} style={S.seedRow}>
              <span style={S.seedK}>{STAT_LABELS[k]}</span>
              <span style={{ ...S.seedV, color: v > 10 ? 'var(--eld-accent, #5fc7e0)' : 'inherit' }}>{v}</span>
            </div>
          );
        })}
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
    fontSize: 'var(--mv-label, 15px)',
    letterSpacing: '0.24em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted, #5f8494)',
    fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)',
  },
  title: { fontSize: 'var(--mv-title, 26px)', fontWeight: 700, marginTop: 4 },
  sub: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted, #5f8494)', fontStyle: 'italic', margin: '4px 0 10px' },
  partyBox: { padding: 10, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  secHead: {
    fontSize: 'var(--mv-text, 18px)',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)',
  },
  rosterList: { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
  empty: { padding: 12, fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', fontStyle: 'italic' },
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
  name: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700 },
  badge: {
    fontSize: 'var(--mv-label, 15px)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    border: '1px solid var(--eld-border)',
    borderRadius: 4,
    padding: '2px 6px',
  },
  meta: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', marginTop: 4 },
  weapon: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', marginTop: 2 },
  createBtn: { marginTop: 14, width: '100%', padding: '12px 10px', minHeight: 'var(--mv-tap, 52px)' },
  createPanel: { padding: 12, marginBottom: 12 },
  classList: { display: 'flex', flexDirection: 'column', gap: 8 },
  classCard: { textAlign: 'left', padding: '10px 12px', borderLeft: '3px solid', width: '100%', color: 'inherit', fontFamily: 'inherit', cursor: 'pointer' },
  createSummary: { fontSize: 'var(--mv-text, 18px)', marginTop: 4, minHeight: 18 },
  back: { marginBottom: 10, padding: '8px 12px', minHeight: 'var(--mv-tap, 52px)' },
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
  statK: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--eld-muted)' },
  statV: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700, marginTop: 4, color: 'var(--eld-accent, #5fc7e0)' },
  seedList: { padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 },
  seedRow: { display: 'flex', justifyContent: 'space-between', fontSize: 'var(--mv-text, 18px)', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  seedK: { color: 'var(--eld-muted)' },
  seedV: { fontWeight: 700, fontVariantNumeric: 'tabular-nums' },
  editBlock: { marginBottom: 12 },
  editLbl: {
    fontSize: 'var(--mv-label, 15px)',
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
    fontSize: 'var(--mv-text, 18px)',
    boxSizing: 'border-box',
  },
  promote: { width: '100%', padding: '10px 8px', marginBottom: 4, minHeight: 'var(--mv-tap, 52px)' },
  note: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', fontStyle: 'italic', margin: '4px 0 8px' },
  upRow: { padding: 12 },
  treeTag: {
    fontSize: 'var(--mv-label, 15px)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: '#5fc7e0',
    border: '1px solid #1c4a54',
    borderRadius: 4,
    padding: '2px 6px',
  },
  cost: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', fontVariantNumeric: 'tabular-nums' },
  upName: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700, marginTop: 4 },
  upBlurb: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', marginTop: 4, lineHeight: 1.4 },
  buyBtn: { marginTop: 10, width: '100%', padding: '10px 8px', opacity: 0.55, cursor: 'not-allowed', minHeight: 'var(--mv-tap, 52px)' },
};
