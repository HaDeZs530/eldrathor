import { useMemo, useState } from 'react';
import { ARCHETYPES, newCharId } from '../data.js';
import { starterWeapon, validName, NAME_MAX, rosterCap } from '../progression/progression.js';
import { EQUIP_SLOTS } from '../progression/items.js';
import { FREE_RECRUITS, RECRUIT_COST_STEP, recruitCost, candidatesForDay, dayNumber } from '../progression/roster.js';
import { PrimaryButton, SecondaryButton, Sheet } from './ui/index.jsx';
import './items/items.css';

/**
 * Roster — docs/Eldrathor_Item_Model_Lock.md §8. A **Recruit** row offers three candidates, refreshed
 * daily; the first three recruits are free, then each costs Worldvein. Bench rows show each
 * Adventurer's current Hearth job, and support **rename** (1–16) and **dismiss** with a confirm —
 * a dismissed Adventurer's gear returns to the bag. Archetype is never editable.
 */
export default function RosterPanel({ party, roster, setParty, setRoster, setBag, worldvein, setWorldvein, afk, locked = false, now = Date.now }) {
  const day = dayNumber(now());
  const all = useMemo(() => [...(party || []), ...(roster || [])], [party, roster]);
  const [hired, setHired] = useState(() => Math.max(0, all.length - 5)); // the starting five are not "hires"
  const [taken, setTaken] = useState(() => new Set());
  const [dismissing, setDismissing] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [draft, setDraft] = useState('');
  const candidates = useMemo(() => candidatesForDay(day).filter((c) => !taken.has(c.key)), [day, taken]);
  const cost = recruitCost(hired);
  const cap = rosterCap(all);

  function recruit(c) {
    if (worldvein < cost) return;
    const w = starterWeapon(c.weapon);
    setBag((b) => [...b, w]);
    setRoster((r) => [...r, { id: newCharId(), name: c.name, archetype: c.archetype, weapon: c.weapon, level: 1, xp: 0, equipped: { weapon: w.id } }]);
    if (cost > 0) setWorldvein((v) => v - cost);
    setTaken((t) => new Set(t).add(c.key));
    setHired((h) => h + 1);
  }

  /** §8: dismissing returns every equipped piece to the bag (they are already there — the slots just clear). */
  function dismiss(member) {
    setRoster((r) => r.filter((m) => m.id !== member.id));
    setDismissing(null);
  }
  function rename(member, name) {
    if (!validName(name)) return;
    const patch = (m) => (m.id === member.id ? { ...m, name: name.trim() } : m);
    setParty((p) => p.map(patch));
    setRoster((r) => r.map(patch));
    setRenaming(null);
  }

  const jobOf = (member) => {
    if (!afk) return null;
    if (afk.gatherSlots?.some((s) => s.charKey === member.id && s.running)) return 'Gathering';
    if (afk.process?.charKey === member.id && afk.process.running) return 'Processing';
    if (afk.idle?.charKey === member.id && afk.idle.running) return 'Training';
    return null;
  };

  return (
    <div style={S.col}>
      <div style={S.note}>
        Three candidates a day. The first {FREE_RECRUITS} recruits are free; after that the price climbs {RECRUIT_COST_STEP} ❖ with each hire ({RECRUIT_COST_STEP}, {RECRUIT_COST_STEP * 2}, {RECRUIT_COST_STEP * 3} …). Next: <strong>{cost === 0 ? 'free' : `${cost} ❖`}</strong>.
        Archetype is set at recruitment and never changes. Roster level ceiling: <strong>{cap}</strong>.
      </div>

      <div className="eld-town-display" style={S.secT}>Recruit</div>
      {candidates.length === 0 && <div className="eld-panel" style={S.emptyBox}>No candidates left today — come back tomorrow.</div>}
      {candidates.map((c) => (
        <div key={c.key} className="eld-card" style={S.card}>
          <div style={S.row}>
            <span style={{ ...S.name, color: ARCHETYPES[c.archetype]?.color }}>{c.name}</span>
            <span style={S.meta}>{cost > 0 ? `${cost} ❖` : 'free'}</span>
          </div>
          <div style={S.meta}>{c.archetype} · {ARCHETYPES[c.archetype]?.role} · {c.weapon}</div>
          <PrimaryButton style={S.wide} disabled={worldvein < cost} onClick={() => recruit(c)}>
            {worldvein < cost ? 'Not enough Worldvein' : 'Recruit'}
          </PrimaryButton>
        </div>
      ))}

      <div className="eld-town-display" style={S.secT}>Bench</div>
      {(roster || []).length === 0 && <div style={S.empty}>Nobody on the bench.</div>}
      {(roster || []).map((m) => (
        <div key={m.id} className="eld-card" style={S.card}>
          <div style={S.row}>
            <span style={{ ...S.name, color: ARCHETYPES[m.archetype]?.color }}>{m.name}</span>
            <span style={S.meta}>Lv {m.level || 1}</span>
          </div>
          <div style={S.meta}>
            {m.archetype} · {ARCHETYPES[m.archetype]?.role}
            {jobOf(m) ? ` · ${jobOf(m)}` : ' · idle'}
            {` · ${EQUIP_SLOTS.filter((sl) => (m.equipped || {})[sl]).length}/6 slots`}
          </div>
          <div style={S.actions}>
            <SecondaryButton onClick={() => { setRenaming(m); setDraft(m.name); }}>Rename</SecondaryButton>
            <SecondaryButton disabled={locked} onClick={() => setDismissing(m)}>Dismiss</SecondaryButton>
          </div>
        </div>
      ))}

      {renaming && (
        <Sheet onClose={() => setRenaming(null)} label="Rename" title={`Rename ${renaming.name}`}>
          <input
            style={S.input}
            value={draft}
            maxLength={NAME_MAX}
            aria-invalid={!validName(draft)}
            onChange={(e) => setDraft(e.target.value)}
          />
          {!validName(draft) && <div style={S.err}>A name is 1–{NAME_MAX} characters.</div>}
          <div className="eld-item-actions">
            <PrimaryButton disabled={!validName(draft)} onClick={() => rename(renaming, draft)}>Save</PrimaryButton>
            <SecondaryButton onClick={() => setRenaming(null)}>Cancel</SecondaryButton>
          </div>
        </Sheet>
      )}

      {dismissing && (
        <Sheet onClose={() => setDismissing(null)} label="Dismiss" title={`Dismiss ${dismissing.name}?`}>
          <div style={S.note}>Their gear returns to the bag. This cannot be undone.</div>
          <div className="eld-item-actions">
            <PrimaryButton onClick={() => dismiss(dismissing)}>Dismiss</PrimaryButton>
            <SecondaryButton onClick={() => setDismissing(null)}>Keep</SecondaryButton>
          </div>
        </Sheet>
      )}
    </div>
  );
}

const S = {
  col: { display: 'flex', flexDirection: 'column', gap: 8 },
  note: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', lineHeight: 1.45 },
  secT: { fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--eld-gold)', margin: '8px 0 6px' },
  card: { padding: 12, display: 'flex', flexDirection: 'column', gap: 6 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700, fontFamily: 'var(--eld-font-display)' },
  meta: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)' },
  actions: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  wide: { width: '100%' },
  empty: { color: 'var(--eld-muted)', fontSize: 'var(--mv-label, 15px)', fontStyle: 'italic' },
  emptyBox: { padding: 12, fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', fontStyle: 'italic' },
  input: { width: '100%', padding: '10px 12px', fontSize: 'var(--mv-text, 18px)', boxSizing: 'border-box', marginBottom: 8 },
  err: { color: 'var(--eld-danger)', fontSize: 'var(--mv-label, 15px)', marginBottom: 8 },
};
