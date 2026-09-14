import React, { useState } from 'react';
import { AREAS, ARCHETYPES } from '../data.js';
import { GATHER_FAMILIES, MAT_QUALITY } from '../theme/tokens.js';
import { trainXpGain, maxUnlockedTier } from '../afkRuntime.js';
import { xpToNext, LEVEL_CAP } from '../progression/progression.js';
import { GATHER_CYCLE_MS, PROCESS_CYCLE_MS, IDLE_CYCLE_MS, PROCESS_VEIN_COST } from '../afkRuntime.js';

const SUBS = [
  { id: 'gather', label: 'Gather' },
  { id: 'process', label: 'Process' },
  { id: 'idle', label: 'Train' }, // job key stays 'idle'; label locked to Train (playtest polish)
];

/** AFK tab (Seam working label). Timers live in App. DESIGN-OPEN: final name; Process art; persistence/offline. */
export default function AfkScreen({
  unlocked, party, roster, inventory, afk,
  onUpdateGatherSlot, onToggleGather, onUpdateProcess, onToggleProcess, onUpdateIdle, onToggleIdle, worldvein,
}) {
  const [sub, setSub] = useState('gather');
  const areas = AREAS.filter((w) => w.id <= unlocked);
  // keys are stable character ids (bug-fix pass 1 §8) — swaps/promotions never move an assignment
  const bench = [
    ...party.map((m, i) => ({ key: m.id || `party:${i}`, source: 'party', index: i, ...m })),
    ...roster.map((m, i) => ({ key: m.id || `roster:${i}`, source: 'roster', index: i, ...m })),
  ];
  return (
    <div style={S.wrap} className={sub === 'process' ? 'eld-afk-process' : ''}>
      <div style={S.kick}>Mind View · Seam (AFK)</div>
      <div className="eld-brand-name" style={S.title}>The Seam</div>
      <div style={S.sub}>Park Adventurers who aren't on the Mountain into a job. Jobs keep running while you're on other tabs. Each Adventurer can hold one job at a time.</div>
      <div className="eld-seg" role="tablist" aria-label="AFK jobs">
        {SUBS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={sub === s.id}
            className={`eld-seg-btn${sub === s.id ? ' is-active' : ''}`} onClick={() => setSub(s.id)}>{s.label}</button>
        ))}
      </div>
      {sub === 'gather' && (
        <GatherPanel slots={afk.gatherSlots} areas={areas} bench={bench} skillXp={afk.gatherSkillXp}
          inventory={inventory} onUpdate={onUpdateGatherSlot} onToggle={onToggleGather} />
      )}
      {sub === 'process' && (
        <ProcessPanel process={afk.process} bench={bench} inventory={inventory} worldvein={worldvein}
          skillXp={afk.processSkillXp} onUpdate={onUpdateProcess} onToggle={onToggleProcess} />
      )}
      {sub === 'idle' && (
        <IdlePanel idle={afk.idle} bench={bench} party={party} roster={roster} unlocked={unlocked}
          onUpdate={onUpdateIdle} onToggle={onToggleIdle} />
      )}
    </div>
  );
}

function GatherPanel({ slots, areas, bench, skillXp, inventory, onUpdate, onToggle }) {
  return (
    <div style={S.col}>
      <div className="eld-panel" style={S.help}>
        <div style={S.helpH}>Gather — collect raw materials</div>
        <div>Assign an Adventurer to an area you've unlocked and a skill family (wood, metal, or hunt). Every cycle (~{Math.round(GATHER_CYCLE_MS / 1000)}s) they bring back raw mats and earn skill XP. Higher-tier areas yield more per cycle. Costs nothing. {/* DESIGN-OPEN: rates */}</div>
      </div>
      <div className="eld-panel" style={S.strip}>
        <span>Raw · wood {inventory.raw.wood}</span><span>metal {inventory.raw.metal}</span><span>hunt {inventory.raw.hunt}</span>
      </div>
      <div className="eld-panel" style={S.strip}>
        {GATHER_FAMILIES.map((f) => (
          <span key={f.id} style={S.xp}>{f.glyph} {f.label} XP {skillXp[f.id] || 0}</span>
        ))}
      </div>
      {slots.map((slot, i) => {
        const area = areas.find((a) => a.id === slot.areaId) || areas[0];
        const char = bench.find((b) => b.key === slot.charKey);
        return (
          <div key={i} className="eld-card" style={S.card}>
            <div style={S.row}><span style={S.h}>Gather slot {i + 1}</span>
              <span style={slot.running ? S.live : S.dim}>{slot.running ? 'Running' : 'Stopped'}</span></div>
            <label style={S.lbl}>Adventurer</label>
            <select style={S.sel} value={slot.charKey || ''} disabled={slot.running}
              onChange={(e) => onUpdate(i, { charKey: e.target.value || null })}>
              <option value="">— assign —</option>
              {bench.map((b) => (
                <option key={b.key} value={b.key}>{b.name} · Lv {b.level} ({b.source === 'party' ? 'party' : 'bench'})</option>
              ))}
            </select>
            <label style={S.lbl}>Area</label>
            <select style={S.sel} value={slot.areaId} disabled={slot.running}
              onChange={(e) => onUpdate(i, { areaId: Number(e.target.value) })}>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name} · T{a.tier}</option>)}
            </select>
            <label style={S.lbl}>Skill family</label>
            <div style={S.rowWrap}>
              {GATHER_FAMILIES.map((f) => (
                <button key={f.id} type="button" className={`eld-btn${slot.family === f.id ? '' : ' eld-btn-ghost'}`}
                  disabled={slot.running} style={S.fam} onClick={() => onUpdate(i, { family: f.id })}>
                  {f.glyph} {f.label}
                </button>
              ))}
            </div>
            <Bar value={slot.progress} accent={area?.accent || '#5fc7e0'} />
            <div style={S.meta}>Cycle {Math.round((slot.progress || 0) * 100)}% · {area?.name || '—'} · {slot.family}</div>
            {char && <div style={S.ok}>{char.name} · {ARCHETYPES[char.archetype]?.role}</div>}
            <button type="button" className="eld-btn" style={S.wide} disabled={!slot.charKey} onClick={() => onToggle(i)}>
              {slot.running ? 'Stop' : 'Start gather'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// DESIGN-OPEN: Process recipes — one placeholder recipe per raw family (1 raw + Worldvein → 1 infused, quality roll).
const PROCESS_RECIPES = GATHER_FAMILIES.map((f) => ({
  id: f.id,
  family: f.id,
  glyph: f.glyph,
  name: `Infuse ${f.label}`,
  inputs: [{ family: f.id, qty: 1 }],
  vein: PROCESS_VEIN_COST,
  output: `1 infused ${f.label.toLowerCase()}`,
}));
const QUALITY_ODDS = (() => {
  const total = Object.values(MAT_QUALITY).reduce((n, q) => n + q.weight, 0);
  return Object.entries(MAT_QUALITY).map(([name, q]) => `${name} ${Math.round((q.weight / total) * 100)}%`).join(' · ');
})();

function ProcessPanel({ process, bench, inventory, worldvein, skillXp, onUpdate, onToggle }) {
  const rawAvail = inventory.raw[process.family] || 0;
  const cost = PROCESS_VEIN_COST;
  const recipe = PROCESS_RECIPES.find((r) => r.id === process.family) || PROCESS_RECIPES[0];
  return (
    <div style={S.col}>
      <div className="eld-panel" style={S.help}>
        <div style={S.helpH}>Process — turn raw mats into infused mats</div>
        <div>Pick a recipe below. Each cycle (~{Math.round(PROCESS_CYCLE_MS / 1000)}s) consumes the listed raw mats <em>and Worldvein</em>, and produces one infused mat with a quality roll ({QUALITY_ODDS}). Infused mats are what the Town Crafter turns into armor. {/* DESIGN-OPEN: rates, art theme */}</div>
      </div>
      <div className="eld-panel" style={{ ...S.strip, boxShadow: '0 0 18px rgba(224,120,60,0.25)' }}>
        <span>❖ {worldvein} Worldvein</span><span>Process XP {skillXp}</span><span>Raw {process.family}: {rawAvail}</span>
      </div>
      <div className="eld-card" style={{ ...S.card, borderColor: 'rgba(224,120,60,0.45)' }}>
        <div style={S.row}><span style={S.h}>Infusion berth</span>
          <span style={process.running ? S.live : S.dim}>{process.running ? 'Infusing' : 'Idle'}</span></div>
        <label style={S.lbl}>Processor</label>
        <select style={S.sel} value={process.charKey || ''} disabled={process.running}
          onChange={(e) => onUpdate({ charKey: e.target.value || null })}>
          <option value="">— assign —</option>
          {bench.map((b) => <option key={b.key} value={b.key}>{b.name} · Lv {b.level}</option>)}
        </select>
        <label style={S.lbl}>Recipe</label>
        <div style={S.recipeList}>
          {PROCESS_RECIPES.map((r) => {
            const active = process.family === r.id;
            const have = inventory.raw[r.family] || 0;
            return (
              <button key={r.id} type="button" className="eld-card" disabled={process.running}
                onClick={() => onUpdate({ family: r.id })} aria-pressed={active}
                style={{ ...S.recipe, boxShadow: active ? '0 0 0 1px #e0783c, 0 0 14px rgba(224,120,60,0.35)' : undefined, opacity: process.running && !active ? 0.5 : 1 }}>
                <div style={S.row}><span style={S.recipeName}>{r.glyph} {r.name}</span><span style={S.dim}>{active ? 'selected' : ''}</span></div>
                <div style={S.recipeIo}>
                  {r.inputs.map((inp) => (
                    <span key={inp.family} style={{ color: have >= inp.qty ? 'inherit' : '#e05d6f' }}>−{inp.qty} raw {inp.family} (have {have})</span>
                  ))}
                  <span style={{ color: worldvein >= r.vein ? 'inherit' : '#e05d6f' }}>−{r.vein} ❖ Worldvein</span>
                  <span style={S.ok}>→ {r.output}</span>
                </div>
              </button>
            );
          })}
        </div>
        <Bar value={process.progress} accent="#e0783c" />
        <div style={S.meta}>Per cycle: {recipe.inputs.map((i) => `${i.qty} raw ${i.family}`).join(' + ')} + {cost} ❖ → {recipe.output}</div>
        <button type="button" className="eld-btn" style={S.wide}
          disabled={!process.charKey || (rawAvail < 1 && !process.running) || (worldvein < cost && !process.running)}
          onClick={onToggle}>{process.running ? 'Stop process' : 'Start process'}</button>
      </div>
      <div style={S.h}>Infused inventory</div>
      <div className="eld-panel" style={S.list}>
        {inventory.infused.length === 0 && <div style={S.dim}>No infused mats yet.</div>}
        {inventory.infused.map((m, i) => (
          <div key={i} style={{ ...S.mat, borderLeftColor: MAT_QUALITY[m.quality]?.color || '#9fb2bd' }}>
            <span style={{ color: MAT_QUALITY[m.quality]?.color }}>{m.quality}</span>
            <span>{m.family} ×{m.qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function IdlePanel({ idle, bench, party, roster, unlocked, onUpdate, onToggle }) {
  const trainee = bench.find((b) => b.key === idle.charKey);
  const live = trainee ? [...party, ...roster].find((m) => m.id === trainee.key) : null;
  const perMin = trainXpGain(unlocked, 60000);
  const rateNote = `${perMin.toFixed(1)} XP / min at tier ${maxUnlockedTier(unlocked)} (your highest unlocked area)`;
  return (
    <div style={S.col}>
      <div className="eld-panel" style={S.help}>
        <div style={S.helpH}>Train — steady XP for one Adventurer</div>
        <div>Assign one Adventurer. They earn a flat trickle of XP every cycle (~{Math.round(IDLE_CYCLE_MS / 1000)}s), scaled by your highest unlocked area — slower than fighting, with no cap. No materials, no cost.</div>
      </div>
      <div className="eld-card" style={S.card}>
        <div style={S.row}><span style={S.h}>Training berth</span>
          <span style={idle.running ? S.live : S.dim}>{idle.running ? 'Training' : 'Stopped'}</span></div>
        <label style={S.lbl}>Trainee</label>
        <select style={S.sel} value={idle.charKey || ''} disabled={idle.running}
          onChange={(e) => onUpdate({ charKey: e.target.value || null })}>
          <option value="">— assign —</option>
          {bench.map((b) => (
            <option key={b.key} value={b.key}>{b.name} · Lv {b.level}</option>
          ))}
        </select>
        <Bar value={idle.progress} accent="#7fd6a0" />
        <div style={S.meta}>{rateNote}</div>
        {live && <div style={S.ok}>{live.name} · Lv {live.level}{live.level >= LEVEL_CAP ? ' · max' : ` · ${Math.floor(live.xp || 0)} / ${xpToNext(live.level)} XP`}</div>}
        <button type="button" className="eld-btn" style={S.wide} disabled={!idle.charKey} onClick={onToggle}>
          {idle.running ? 'Stop training' : 'Start training'}
        </button>
      </div>
    </div>
  );
}

function Bar({ value, accent }) {
  const pct = Math.max(0, Math.min(1, value || 0)) * 100;
  return (
    <div className="eld-progress" style={{ marginTop: 10 }}>
      <div className="eld-progress-fill" style={{ width: `${pct}%`, background: accent, boxShadow: `0 0 10px ${accent}` }} />
    </div>
  );
}

const S = {
  wrap: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px 16px', textAlign: 'left' },
  kick: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--eld-muted)', fontFamily: 'var(--eld-font-display, Cinzel, Georgia, serif)' },
  title: { fontSize: 'var(--mv-title, 26px)', fontWeight: 700, marginTop: 4 },
  sub: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-muted)', fontStyle: 'italic', margin: '4px 0 12px', lineHeight: 1.4 },
  col: { display: 'flex', flexDirection: 'column', gap: 10 },
  note: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', lineHeight: 1.4 },
  help: { padding: '10px 12px', fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', lineHeight: 1.45 },
  helpH: { fontSize: 'var(--mv-label, 15px)', fontWeight: 700, color: 'var(--eld-text, #cfe0e8)', marginBottom: 4, letterSpacing: '0.04em' },
  recipeList: { display: 'flex', flexDirection: 'column', gap: 6 },
  recipe: { textAlign: 'left', padding: '8px 10px', width: '100%', color: 'inherit', fontFamily: 'inherit', cursor: 'pointer' },
  recipeName: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700 },
  recipeIo: { display: 'flex', flexWrap: 'wrap', gap: '4px 10px', fontSize: 'var(--mv-label, 15px)', marginTop: 4, color: 'var(--eld-muted)' },
  strip: { display: 'flex', flexWrap: 'wrap', gap: 10, padding: '8px 10px', fontSize: 'var(--mv-label, 15px)', fontVariantNumeric: 'tabular-nums' },
  xp: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-accent, #5fc7e0)' },
  card: { padding: 12 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  rowWrap: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  h: { fontSize: 'var(--mv-text, 18px)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--eld-font-display, inherit)' },
  live: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7fd6a0' },
  dim: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--eld-muted)' },
  lbl: { fontSize: 'var(--mv-label, 15px)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--eld-muted)', display: 'block', margin: '8px 0 4px' },
  sel: { width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--eld-border, #1c3a44)', color: 'inherit', borderRadius: 6, padding: '8px 10px', fontSize: 'var(--mv-text, 18px)', boxSizing: 'border-box' },
  fam: { padding: '8px 10px', flex: '1 1 80px', minHeight: 'var(--mv-tap, 52px)' },
  meta: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', marginTop: 6 },
  ok: { fontSize: 'var(--mv-text, 18px)', color: 'var(--eld-accent, #5fc7e0)', marginTop: 4 },
  wide: { width: '100%', marginTop: 10, padding: '10px 8px', minHeight: 'var(--mv-tap, 52px)' },
  list: { padding: 10, display: 'flex', flexDirection: 'column', gap: 6 },
  mat: { display: 'flex', justifyContent: 'space-between', padding: '6px 8px', borderLeft: '3px solid', fontSize: 'var(--mv-text, 18px)', background: 'rgba(0,0,0,0.2)' },
};
