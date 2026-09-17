import { useState } from 'react';
import { newCharId, ARCHETYPES, STATS, STAT_LABELS, ARCHETYPE_SEEDS } from '../data.js';
import { starterWeapon, validName, NAME_MAX, equippedIds as equippedOf } from '../progression/progression.js';
import { EQUIP_SLOTS, SLOT_LABEL } from '../progression/items.js';
import SlotGrid from './items/SlotGrid.jsx';
import ItemSheet from './items/ItemSheet.jsx';
import BagScreen from './BagScreen.jsx';
import { deriveDisplay, deriveBreakdown, equip } from '../combat/derive.js';
import { useTestNumbers } from '../debug/useTestNumbers.js';
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
export default function PartyScreen({ party, setParty, roster, setRoster, locked = false, bag = [], setBag, setWorldvein, equipped, onEmpower }) {
  const taken = equipped || equippedOf(party, roster);
  const [detail, setDetail] = useState(null); // { source: 'party'|'roster', index }
  const [creating, setCreating] = useState(false);

  if (creating) {
    return (
      <CreateCharacter
        onCancel={() => setCreating(false)}
        onCreate={(n) => {
          // M1b: a recruit starts with an equipped Common weapon of their class default (DESIGN-OPEN: recruit gear)
          const w = starterWeapon(n.weapon);
          if (setBag) setBag((b) => [...b, w]);
          setRoster((r) => [...r, { ...n, id: newCharId(), xp: 0, equipped: { weapon: w.id } }]);
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
        key={member.id}
        member={member}
        bag={bag}
        setBag={setBag}
        setWorldvein={setWorldvein}
        onEmpower={onEmpower}
        taken={taken}
        locked={locked}
        onBack={() => setDetail(null)}
        onChange={(next) => {
          if (detail.source === 'party') {
            setParty((p) => p.map((m, i) => (i === detail.index ? next : m)));
          } else {
            setRoster((r) => r.map((m, i) => (i === detail.index ? next : m)));
          }
        }}
        onPromoteToParty={
          detail.source === 'roster' && !locked
            ? () => {
                // Swap into first party slot if full — DESIGN-OPEN: real swap UI.
                // bug-fix pass 1 §10: computed from current props, no setter inside an updater
                const displaced = party[0];
                const nextParty = [...party];
                nextParty[0] = member;
                const without = roster.filter((_, i) => i !== detail.index);
                setParty(nextParty);
                setRoster(displaced ? [...without, displaced] : without);
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
      <div className="eld-display eld-screen-title" style={S.title}>Bonded Three</div>
      {locked && (
        <div className="eld-panel" style={{ padding: '10px 12px', fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', lineHeight: 1.4 }} role="status">
          Your bond is on the mountain — change the party at Rally.
        </div>
      )}
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
      <div className="eld-display eld-screen-title" style={S.title}>Bind a new Adventurer</div>
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
        onClick={() => ready && onCreate({ name: trimmed.slice(0, NAME_MAX), archetype, weapon: DEFAULT_WEAPON[archetype], level: 1 })}
      >
        Confirm
      </button>
    </div>
  );
}

function MemberRow({ m, badge, onClick }) {
  const a = ARCHETYPES[m.archetype] || { color: 'var(--eld-accent)', role: '?' };
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

/**
 * The character sheet — docs/Eldrathor_Item_Model_Lock.md §6: header with the nine derived stats, then
 * the six premade slots. Tap a filled slot → that item's sheet; tap an empty one → the bag filtered to
 * the slot for this Adventurer, with Compare on every row.
 */
function MemberDetail({ member, bag, setBag, setWorldvein, onEmpower, taken, locked, onBack, onChange, onPromoteToParty }) {
  const a = ARCHETYPES[member.archetype];
  const geared = equip(member, bag);
  const d = deriveDisplay(geared);
  const inn = INNATES[member.archetype];
  const testNumbers = useTestNumbers();
  const [nameDraft, setNameDraft] = useState(member.name);
  const nameOk = validName(nameDraft);
  const [openSlot, setOpenSlot] = useState(null); // a filled slot's item sheet
  const [picking, setPicking] = useState(null);   // the bag, filtered to one slot
  const eq = member.equipped || {};
  const byId = (id) => (id ? bag.find((i) => i.id === id) || null : null);
  const slotItems = Object.fromEntries(EQUIP_SLOTS.map((k) => [k, byId(eq[k])]));
  const weaponItem = slotItems.weapon;

  // Derived combat values (combat v2 §2) — seeds × level × weapon item × armor; gems multiply later.
  const stats = [
    { k: 'Level', v: `${member.level}${member.level >= 50 ? ' (max)' : ` · ${Math.floor(member.xp || 0)} XP`}` },
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

  // Progression Loop Lock §7: no archetype editing; the growth paths below are not built yet.
  const coming = [
    { id: 'gem', tree: 'Gems', name: 'Class Gem Slot', blurb: 'Class-gem actives (Class Gem Trees lock).' },
    { id: 'armorgem', tree: 'Gems', name: 'Armor Gems', blurb: 'Passive armor gems.' },
  ];

  /** Equip an item into its own slot; passing null clears the slot. Weapons also set the display type. */
  function setSlot(slot, item) {
    const next = { ...(member.equipped || {}) };
    if (item) next[slot] = item.id; else delete next[slot];
    onChange({ ...member, equipped: next, ...(slot === 'weapon' && item ? { weapon: item.type } : {}) });
  }

  return (
    <div style={S.wrap}>
      <button type="button" className="eld-btn eld-btn-ghost" onClick={onBack} style={S.back}>
        ← Party
      </button>
      <div style={S.kick}>Mind View · Adventurer</div>
      <div className="eld-display eld-screen-title" style={{ ...S.title, color: a.color }}>{member.name}</div>
      <div style={S.sub}>{member.archetype} · {a.blurb}</div>

      <div className="eld-panel" style={S.statGrid}>
        {stats.map((s) => (
          <div key={s.k} style={S.statCell}>
            <div style={S.statK}>{s.k}</div>
            <div style={S.statV}>{s.v}</div>
          </div>
        ))}
      </div>
      {testNumbers && (
        <div className="eld-panel eld-test-numbers" style={{ padding: '8px 10px', marginTop: 6 }} aria-label="Stat sources (test numbers)">
          {deriveBreakdown(geared).map((r) => (
            <div key={r.k}>{r.k} = {r.parts.map(([label, v]) => `${label} [${Number(v).toFixed(3)}]`).join(r.op === 'sum' ? ' + ' : ' × ')}{r.cap != null ? ` (cap ${r.cap})` : ''} → {Number(r.v).toFixed(3)}</div>
          ))}
        </div>
      )}

      <div style={S.secHead}>Base seeds</div>
      <div style={S.note}>Base seeds — gems multiply these.</div>
      <div className="eld-panel" style={S.seedList}>
        {STATS.map((k) => {
          const v = ARCHETYPE_SEEDS[member.archetype]?.[k] ?? 10;
          return (
            <div key={k} style={S.seedRow}>
              <span style={S.seedK}>{STAT_LABELS[k]}</span>
              <span style={{ ...S.seedV, color: v > 10 ? 'var(--eld-accent)' : 'inherit' }}>{v}</span>
            </div>
          );
        })}
      </div>

      <div style={S.secHead}>Equipment</div>
      <SlotGrid
        items={slotItems}
        locked={locked}
        onOpen={(item, slot) => setOpenSlot({ item, slot })}
        onPick={(slot) => setPicking(slot)}
      />
      {locked && <div style={S.note}>Your bond is on the mountain — gear changes at Rally.</div>}
      {!weaponItem && <div style={S.note}>Unarmed — hits at ×0.8. Tap the Weapon slot to equip one.</div>}

      <div style={S.editBlock}>
        <label style={S.editLbl} htmlFor="eld-member-name">Name</label>
        <input
          id="eld-member-name"
          style={{ ...S.input, borderColor: nameOk ? undefined : 'var(--eld-danger)' }}
          value={nameDraft}
          maxLength={NAME_MAX}
          aria-invalid={!nameOk}
          onChange={(e) => {
            const v = e.target.value;
            setNameDraft(v);
            if (validName(v)) onChange({ ...member, name: v.trim() });
          }}
        />
        {!nameOk && <div style={S.err}>A name is 1–{NAME_MAX} characters.</div>}
      </div>

      {openSlot && (
        <ItemSheet
          item={openSlot.item}
          equippedBy={member.name}
          onClose={() => setOpenSlot(null)}
          onEmpower={openSlot.item.kind === 'weapon' && onEmpower ? (i) => { setOpenSlot(null); onEmpower(i); } : undefined}
          onEquip={locked ? undefined : () => { setSlot(openSlot.slot, null); setOpenSlot(null); }}
        />
      )}

      {picking && (
        <div style={S.pickerOverlay}>
          <BagScreen
            bag={bag}
            setBag={setBag}
            equipped={taken}
            setWorldvein={setWorldvein}
            slotFilter={picking}
            compareTo={slotItems[picking]}
            compareWith={member.name}
            title={`${SLOT_LABEL[picking]} for ${member.name}`}
            emptyNote={picking === 'weapon' ? 'No spare weapons. Weapons drop on the Mountain.' : 'No spare armor. Armor is crafted at the Crafter.'}
            onBack={() => setPicking(null)}
            onEquip={(item) => { setSlot(picking, item); setPicking(null); }}
          />
        </div>
      )}

      {onPromoteToParty && (
        <button type="button" className="eld-btn" onClick={onPromoteToParty} style={S.promote}>
          Move into party (swap slot 1)
        </button>
      )}

      <div style={{ ...S.secHead, marginTop: 16 }}>Growth</div>
      <div style={S.note}>Levels come from fights and Train. Weapons grow at the Smith (empowerment). Armor is crafted.</div>
      <div style={S.rosterList}>
        {coming.map((u) => (
          <div key={u.id} className="eld-card" style={{ ...S.upRow, opacity: 0.7 }}>
            <div style={S.rowTop}>
              <span style={S.treeTag}>{u.tree}</span>
              <span style={S.comingTag}>Coming — not yet active</span>
            </div>
            <div style={S.upName}>{u.name}</div>
            <div style={S.upBlurb}>{u.blurb}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const S = {
  // the slot picker covers the sheet while it is open (§6: "the bag filtered to that slot")
  pickerOverlay: { position: 'absolute', inset: 0, zIndex: 30, display: 'flex', flexDirection: 'column', background: 'var(--eld-bg)' },
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
    color: 'var(--eld-muted)',
    fontFamily: 'var(--eld-font-display)',
  },
  title: { fontSize: 'var(--mv-title, 26px)', fontWeight: 700, marginTop: 4 },
  sub: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', fontStyle: 'italic', margin: '4px 0 10px' },
  partyBox: { padding: 10, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  secHead: {
    fontSize: 'var(--mv-text, 18px)',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontFamily: 'var(--eld-font-display)',
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
  name: { fontSize: 'var(--mv-num, 24px)', fontWeight: 700, lineHeight: 1.1 },
  badge: {
    fontSize: 'var(--mv-label, 15px)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    border: '1px solid var(--eld-border)',
    borderRadius: 4,
    padding: '2px 6px',
  },
  meta: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', marginTop: 4 },
  weapon: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', marginTop: 2 },
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
    border: '1px solid var(--eld-border)',
  },
  statK: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--eld-muted)' },
  statV: { fontSize: 'var(--mv-num, 24px)', fontWeight: 700, marginTop: 4, color: 'var(--eld-accent)', lineHeight: 1.15 },
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
    border: '1px solid var(--eld-border)',
    color: 'inherit',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 'var(--mv-text, 18px)',
    boxSizing: 'border-box',
  },
  promote: { width: '100%', padding: '10px 8px', marginBottom: 4, minHeight: 'var(--mv-tap, 52px)' },
  err: { color: 'var(--eld-danger)', fontSize: 'var(--mv-label, 15px)', marginTop: 4 },
  pick: { padding: 12, width: '100%', textAlign: 'left', color: 'inherit', fontFamily: 'inherit', cursor: 'pointer', borderLeftWidth: 3 },
  pickCta: { marginTop: 8, fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--eld-accent)' },
  comingTag: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--eld-gold)' },
  note: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', fontStyle: 'italic', margin: '4px 0 8px' },
  upRow: { padding: 12 },
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
  upName: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700, marginTop: 4 },
  upBlurb: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', marginTop: 4, lineHeight: 1.4 },
  buyBtn: { marginTop: 10, width: '100%', padding: '10px 8px', opacity: 0.55, cursor: 'not-allowed', minHeight: 'var(--mv-tap, 52px)' },
};
