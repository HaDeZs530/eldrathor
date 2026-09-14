import React, { useState } from 'react';
import { ARCHETYPES, TIER_COLOR } from '../data.js';
import { MAT_QUALITY } from '../theme/tokens.js';

const SECTIONS = [
  { id: 'hub', label: 'Harbor' },
  { id: 'crafter', label: 'Crafter' },
  { id: 'upgrade', label: 'Upgrade' },
  { id: 'market', label: 'Market' },
];

const ARMOR_RECIPES = [
  { id: 'vest_common', name: 'Veinwoven Vest', quality: 'Common', need: 3, rating: 28 },
  { id: 'vest_fine', name: 'Boundweave Mail', quality: 'Fine', need: 3, rating: 42 },
  { id: 'vest_rare', name: 'Mythros Plate', quality: 'Rare', need: 2, rating: 58 },
  { id: 'vest_mythic', name: 'Court-Bound Carapace', quality: 'Mythic', need: 2, rating: 82 },
];

/** Town hub — warm RPG. Crafter / Upgrade / Market under Town. */
export default function TownScreen({ party, stash, setStash, inventory, setInventory, worldvein, setWorldvein, setTab }) {
  const [section, setSection] = useState('hub');
  return (
    <div style={S.wrap}>
      <div style={S.kick}>Veinharbor · Warm Reality</div>
      <div className="eld-brand-name" style={S.title}>Town</div>
      <div style={S.sub}>Crafter · Smith · Market — carved harbor panels</div>
      <div className="eld-seg eld-seg-rpg" role="tablist" aria-label="Town functions">
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" role="tab" aria-selected={section === s.id}
            className={`eld-seg-btn${section === s.id ? ' is-active' : ''}`} onClick={() => setSection(s.id)}>{s.label}</button>
        ))}
      </div>
      {section === 'hub' && <HarborOverview party={party} stash={stash} inventory={inventory} setTab={setTab} setSection={setSection} />}
      {section === 'crafter' && <CrafterPanel inventory={inventory} setInventory={setInventory} />}
      {section === 'upgrade' && <UpgradePanel stash={stash} setStash={setStash} worldvein={worldvein} setWorldvein={setWorldvein} />}
      {section === 'market' && <MarketPanel inventory={inventory} setInventory={setInventory} stash={stash} setStash={setStash} worldvein={worldvein} setWorldvein={setWorldvein} />}
    </div>
  );
}

function HarborOverview({ party, stash, inventory, setTab, setSection }) {
  const armorCount = inventory.armor?.length || 0;
  return (
    <div style={S.col}>
      <div style={S.sec}>
        <div><div style={S.secT}>Your Party</div></div>
        <button type="button" className="eld-btn eld-btn-ghost" onClick={() => setTab('party')}>Manage</button>
      </div>
      <div style={S.partyRow}>
        {party.map((m, i) => {
          const a = ARCHETYPES[m.archetype];
          return (
            <div key={i} className="eld-card" style={{ ...S.pcard, borderTopColor: a.color }}>
              <div style={S.pn}>{m.name}</div>
              <div style={{ ...S.pr, color: a.color }}>{m.archetype}</div>
              <div style={S.pl}>Lv {m.level}</div>
            </div>
          );
        })}
      </div>
      <div style={S.secT}>Stash weapons</div>
      <div className="eld-panel" style={S.stash}>
        {stash.length === 0 && <div style={S.empty}>No weapon loot yet.</div>}
        {stash.slice(-5).reverse().map((g, i) => (
          <div key={i} style={{ ...S.chip, borderColor: TIER_COLOR[g.tier] || '#8b5a2b' }}>
            <span style={{ color: TIER_COLOR[g.tier] }}>{g.name}</span>
            <span style={S.rating}>{g.rating}/100</span>
          </div>
        ))}
      </div>
      <div style={S.secT}>Town functions</div>
      <div style={S.col}>
        {[
          { id: 'crafter', label: 'Crafter', sub: `Armor from infused mats · ${armorCount} owned` },
          { id: 'upgrade', label: 'Upgrade / Smith', sub: 'Merge & empower mountain weapons' },
          { id: 'market', label: 'Market', sub: `Sell scrap & armor · scrap ${inventory.scrap || 0}` },
        ].map((fn) => (
          <button key={fn.id} type="button" className="eld-card" style={S.fn} onClick={() => setSection(fn.id)}>
            <div style={S.fnN}>{fn.label}</div>
            <div style={S.fnS}>{fn.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CrafterPanel({ inventory, setInventory }) {
  function countQuality(q) {
    return (inventory.infused || []).filter((m) => m.quality === q).reduce((n, m) => n + m.qty, 0);
  }
  function craft(recipe) {
    if (countQuality(recipe.quality) < recipe.need) return;
    setInventory((inv) => {
      let remaining = recipe.need;
      const infused = inv.infused.map((m) => ({ ...m })).filter((m) => {
        if (m.quality !== recipe.quality || remaining <= 0) return true;
        if (m.qty <= remaining) { remaining -= m.qty; return false; }
        m.qty -= remaining; remaining = 0; return true;
      });
      const armor = [...(inv.armor || []), {
        id: `${recipe.id}-${Date.now()}`, name: recipe.name, quality: recipe.quality, rating: recipe.rating, slot: 'chest',
      }];
      return { ...inv, infused, armor };
    });
  }
  return (
    <div style={S.col}>
      <div style={S.note}>Craft armor from infused mats. Recipes need X of a given quality. No +1-tier gate.</div>
      <div className="eld-panel" style={S.strip}>
        {Object.keys(MAT_QUALITY).map((q) => (
          <span key={q} style={{ color: MAT_QUALITY[q].color, fontSize: 11 }}>{q} {countQuality(q)}</span>
        ))}
      </div>
      {ARMOR_RECIPES.map((r) => {
        const have = countQuality(r.quality);
        const ok = have >= r.need;
        return (
          <div key={r.id} className="eld-card" style={S.card}>
            <div style={S.row}>
              <span style={{ ...S.fnN, color: MAT_QUALITY[r.quality].color }}>{r.name}</span>
              <span style={S.rating}>{r.rating}/100</span>
            </div>
            <div style={S.fnS}>Needs {r.need}× {r.quality} infused · have {have}</div>
            <button type="button" className="eld-btn" disabled={!ok} style={{ ...S.wide, opacity: ok ? 1 : 0.5 }} onClick={() => craft(r)}>Craft</button>
          </div>
        );
      })}
      <div style={S.secT}>Owned armor</div>
      <div className="eld-panel" style={S.stash}>
        {(inventory.armor || []).length === 0 && <div style={S.empty}>No armor crafted yet.</div>}
        {(inventory.armor || []).map((a) => (
          <div key={a.id} style={{ ...S.chip, borderColor: MAT_QUALITY[a.quality]?.color || '#8b5a2b' }}>
            <span style={{ color: MAT_QUALITY[a.quality]?.color }}>{a.name}</span>
            <span style={S.rating}>{a.rating}/100</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UpgradePanel({ stash, setStash, worldvein, setWorldvein }) {
  const [selected, setSelected] = useState(0);
  const weapon = stash[selected];
  const mergeCost = 25;
  function empower() {
    if (!weapon || worldvein < mergeCost) return;
    setWorldvein((v) => v - mergeCost);
    setStash((s) => s.map((g, i) => (i === selected
      ? { ...g, rating: Math.min(100, (g.rating || 10) + 5 + Math.floor(Math.random() * 6)), name: g.name.includes('+') ? g.name : `${g.name} +` }
      : g)));
  }
  function mergePair() {
    if (stash.length < 2 || worldvein < mergeCost) return;
    const aIdx = Math.min(selected, stash.length - 1);
    const bIdx = aIdx === 0 ? 1 : aIdx - 1;
    const a = stash[aIdx]; const b = stash[bIdx];
    if (!a || !b) return;
    setWorldvein((v) => v - mergeCost);
    const merged = { ...a, name: `${String(a.name).replace(/ \+$/, '')} Merged`, rating: Math.min(100, Math.floor(((a.rating || 20) + (b.rating || 20)) / 2) + 8) };
    setStash((s) => s.filter((_, i) => i !== aIdx && i !== bIdx).concat([merged]));
    setSelected(0);
  }
  return (
    <div style={S.col}>
      <div style={S.note}>Weapon merge/empower using stash drops + Worldvein. Numbers stubbed.</div>
      <div className="eld-panel" style={S.strip}><span>❖ {worldvein} Worldvein</span><span>Cost {mergeCost} ❖</span></div>
      {stash.length === 0 && <div className="eld-panel" style={S.emptyBox}>Bring mountain weapon drops here.</div>}
      {stash.map((g, i) => (
        <button key={i} type="button" className="eld-card" style={{ ...S.fn, outline: i === selected ? '2px solid var(--eld-accent)' : 'none' }} onClick={() => setSelected(i)}>
          <div style={S.fnN}>{g.name}</div>
          <div style={S.fnS}>{g.tier || 'Common'} · {g.rating}/100</div>
        </button>
      ))}
      <button type="button" className="eld-btn" style={S.wide} disabled={!weapon || worldvein < mergeCost} onClick={empower}>Empower selected (+rating)</button>
      <button type="button" className="eld-btn eld-btn-ghost" style={S.wide} disabled={stash.length < 2 || worldvein < mergeCost} onClick={mergePair}>Merge pair (stub)</button>
    </div>
  );
}

function MarketPanel({ inventory, setInventory, stash, setStash, worldvein, setWorldvein }) {
  function sellScrap() {
    const n = inventory.scrap || 0;
    if (n <= 0) return;
    setWorldvein((v) => v + n * 2);
    setInventory((inv) => ({ ...inv, scrap: 0 }));
  }
  // bug-fix pass 1 §10: decide from current props, then set — never set state inside an updater
  // (StrictMode runs updaters twice; nested setters credited twice)
  function sellArmor(idx) {
    const armor = [...(inventory.armor || [])];
    const [gone] = armor.splice(idx, 1);
    if (!gone) return;
    setInventory({ ...inventory, armor, scrap: (inventory.scrap || 0) + 1 });
    setWorldvein((v) => v + Math.max(8, Math.floor((gone.rating || 20) / 2)));
  }
  function scrapWeapon(idx) {
    const next = [...stash];
    const [gone] = next.splice(idx, 1);
    if (!gone) return;
    setStash(next);
    setInventory((inv) => ({ ...inv, scrap: (inv.scrap || 0) + 1 }));
    setWorldvein((v) => v + Math.max(3, Math.floor((gone.rating || 10) / 5)));
  }
  return (
    <div style={S.col}>
      <div style={S.note}>Vendor under Town — sell scrap / excess armor for Worldvein. DESIGN-OPEN: full vendor stock.</div>
      <div className="eld-panel" style={S.strip}><span>❖ {worldvein}</span><span>Scrap {inventory.scrap || 0}</span></div>
      <button type="button" className="eld-btn" style={S.wide} disabled={!inventory.scrap} onClick={sellScrap}>
        Sell all scrap (+{(inventory.scrap || 0) * 2} ❖)
      </button>
      <div style={S.secT}>Sell armor</div>
      {(inventory.armor || []).length === 0 && <div style={S.empty}>No armor to sell.</div>}
      {(inventory.armor || []).map((a, i) => (
        <div key={a.id} className="eld-card" style={S.card}>
          <div style={S.row}><span>{a.name}</span><span style={S.rating}>~{Math.max(8, Math.floor((a.rating || 20) / 2))} ❖</span></div>
          <button type="button" className="eld-btn" style={S.wide} onClick={() => sellArmor(i)}>Sell</button>
        </div>
      ))}
      <div style={S.secT}>Scrap weapons</div>
      {stash.length === 0 && <div style={S.empty}>No stash weapons.</div>}
      {stash.map((g, i) => (
        <div key={i} className="eld-card" style={S.card}>
          <div style={S.row}><span>{g.name}</span><span style={S.rating}>scrap + ❖</span></div>
          <button type="button" className="eld-btn eld-btn-ghost" style={S.wide} onClick={() => scrapWeapon(i)}>Scrap</button>
        </div>
      ))}
    </div>
  );
}

const S = {
  wrap: { flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 14px 16px', textAlign: 'left' },
  kick: { fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--eld-muted)', fontFamily: 'var(--eld-font-display)' },
  title: { fontSize: 14, fontWeight: 700, marginTop: 4, color: 'var(--eld-accent)' },
  sub: { fontSize: 11, color: 'var(--eld-muted)', margin: '4px 0 10px' },
  col: { display: 'flex', flexDirection: 'column', gap: 8 },
  note: { fontSize: 11, color: 'var(--eld-muted)', lineHeight: 1.4 },
  partyRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  pcard: { flex: '1 1 90px', padding: '10px 8px', minWidth: 90, borderTop: '3px solid' },
  pn: { fontSize: 12, fontWeight: 700 },
  pr: { fontSize: 9, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 3 },
  pl: { fontSize: 10, color: 'var(--eld-muted)', marginTop: 4 },
  stash: { display: 'flex', flexDirection: 'column', gap: 6, padding: 10 },
  chip: { display: 'flex', justifyContent: 'space-between', border: '1px solid', borderLeftWidth: 3, padding: '6px 10px', fontSize: 12 },
  rating: { color: 'var(--eld-muted)', fontVariantNumeric: 'tabular-nums', fontSize: 11 },
  empty: { color: 'var(--eld-muted)', fontSize: 12, fontStyle: 'italic', padding: '4px 0' },
  emptyBox: { padding: 12, fontSize: 12, color: 'var(--eld-muted)', fontStyle: 'italic' },
  fn: { textAlign: 'left', padding: '12px 14px', width: '100%', color: 'inherit', fontFamily: 'inherit', cursor: 'pointer' },
  fnN: { fontSize: 14, fontWeight: 700 },
  fnS: { fontSize: 11, color: 'var(--eld-muted)', marginTop: 4 },
  sec: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 },
  secT: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--eld-font-display)' },
  strip: { display: 'flex', flexWrap: 'wrap', gap: 10, padding: '8px 10px', fontSize: 11 },
  card: { padding: 12 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  wide: { width: '100%', marginTop: 8, padding: '10px 8px' },
};
