import React, { useLayoutEffect, useRef, useState } from 'react';
import { TIER_COLOR, newId } from '../data.js';
import { MAT_QUALITY } from '../theme/tokens.js';
import { TOWN_LAYOUT, TOWN_DESTINATIONS } from '../town/townLayout.js';
import TownArt from './town/TownArt.jsx';
import './town/town.css';

/**
 * Town — Veinharbor. VISUAL PASS, REVISION 1 (2026-09-14, Anthony-approved concept via ChatGPT):
 * a full-width painted harbor hero with the live "Veinharbor" title over its lower portion, then
 * four stacked illustrated destination rows (Party / Crafter / Smith / Market), then the stash.
 * Crafter, Smith and Market stay sections *within* Town, each with a "Back to Veinharbor" control;
 * the Town tab stays selected throughout. Harbor scroll position is preserved across a visit to a
 * destination; a destination always opens at its top. All crafting / upgrade / market logic is
 * unchanged from before this pass.
 */
const ARMOR_RECIPES = [
  { id: 'vest_common', name: 'Veinwoven Vest', quality: 'Common', need: 3, rating: 28 },
  { id: 'vest_fine', name: 'Boundweave Mail', quality: 'Fine', need: 3, rating: 42 },
  { id: 'vest_rare', name: 'Mythros Plate', quality: 'Rare', need: 2, rating: 58 },
  { id: 'vest_mythic', name: 'Court-Bound Carapace', quality: 'Mythic', need: 2, rating: 82 },
];

const SECTION_TITLE = { crafter: 'Crafter', upgrade: 'Smith', market: 'Market' };

export default function TownScreen({ party, stash, setStash, inventory, setInventory, worldvein, setWorldvein, setTab }) {
  const [section, setSection] = useState('hub');
  const scrollRef = useRef(null);
  const harborScroll = useRef(0); // Harbor scroll position, kept while a destination is open

  function go(next) {
    if (next === section) return;
    if (section === 'hub' && scrollRef.current) harborScroll.current = scrollRef.current.scrollTop;
    setSection(next);
  }
  // after the section swaps: a destination starts at its top; the Harbor restores where it was
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = section === 'hub' ? harborScroll.current : 0;
  }, [section]);

  function open(dest) {
    if (dest.opens.tab) { setTab(dest.opens.tab); return; }
    if (dest.opens.section) go(dest.opens.section);
  }

  return (
    <div ref={scrollRef} className="eld-town" style={{ ...S.wrap, '--town-transition-ms': `${TOWN_LAYOUT.transitionMs}ms` }}>
      {section === 'hub' ? (
        <div key="hub" className="eld-town-section">
          <HarborLanding party={party} stash={stash} onOpen={open} />
        </div>
      ) : (
        <div key={section} className="eld-town-section" style={S.dest}>
          <div className="eld-town-dest-head">
            <button type="button" className="eld-town-back" onClick={() => go('hub')} aria-label="Back to Veinharbor">← Back to Veinharbor</button>
            <div className="eld-town-display eld-town-dest-title" style={{ fontSize: TOWN_LAYOUT.titlePx }}>{SECTION_TITLE[section]}</div>
          </div>
          {section === 'crafter' && <CrafterPanel inventory={inventory} setInventory={setInventory} />}
          {section === 'upgrade' && <UpgradePanel stash={stash} setStash={setStash} worldvein={worldvein} setWorldvein={setWorldvein} />}
          {section === 'market' && <MarketPanel inventory={inventory} setInventory={setInventory} stash={stash} setStash={setStash} worldvein={worldvein} setWorldvein={setWorldvein} />}
        </div>
      )}
    </div>
  );
}

/** Harbor landing: hero + title, four destination rows, then the stash (kept below the list for now). */
function HarborLanding({ party, stash, onOpen }) {
  const L = TOWN_LAYOUT;
  return (
    <>
      <div className="eld-town-hero" style={{ height: L.heroHeight }}>
        <TownArt slot="veinharbor-hero" alt="" />
        <div className="eld-town-hero-scrim" />
        <div className="eld-town-hero-title">
          <div className="eld-town-hero-kicker">Harbor town · {party.length} bonded</div>
          <div className="eld-town-display" style={{ fontSize: 28 }}>Veinharbor</div>
        </div>
      </div>

      <div className="eld-town-list" style={{ padding: `${L.listPaddingY}px ${L.listPaddingX}px`, gap: L.rowGap }}>
        {TOWN_DESTINATIONS.map((d) => (
          <button key={d.id} type="button" className="eld-town-row" style={{ minHeight: L.rowMinHeight }} onClick={() => onOpen(d)}>
            <TownArt slot={d.art} style={{ width: L.artWidth }} alt="" />
            <span className="eld-town-row-text">
              <span className="eld-town-display eld-town-row-title" style={{ fontSize: L.titlePx }}>{d.title}</span>
              <span className="eld-town-row-sub" style={{ fontSize: L.subtitlePx }}>{d.subtitle}</span>
            </span>
            <span className="eld-town-row-chev" aria-hidden="true">›</span>
          </button>
        ))}
      </div>

      <div style={{ padding: `0 ${L.listPaddingX}px ${L.listPaddingY + 4}px` }}>
        <div className="eld-town-display" style={S.secT}>Stash weapons</div>
        <div className="eld-panel" style={S.stash}>
          {stash.length === 0 && <div style={S.empty}>No weapon loot yet.</div>}
          {stash.slice(-5).reverse().map((g, i) => (
            <div key={i} style={{ ...S.chip, borderColor: TIER_COLOR[g.tier] || '#8b5a2b' }}>
              <span style={{ color: TIER_COLOR[g.tier] }}>{g.name}</span>
              <span style={S.rating}>{g.rating}/100</span>
            </div>
          ))}
        </div>
      </div>
    </>
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
        id: newId('a'), recipeId: recipe.id, name: recipe.name, quality: recipe.quality, rating: recipe.rating, slot: 'chest',
      }];
      return { ...inv, infused, armor };
    });
  }
  return (
    <div style={S.col}>
      <div style={S.note}>Craft armor from infused mats. Recipes need X of a given quality. No +1-tier gate.</div>
      <div className="eld-panel" style={S.strip}>
        {Object.keys(MAT_QUALITY).map((q) => (
          <span key={q} style={{ color: MAT_QUALITY[q].color }}>{q} {countQuality(q)}</span>
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
            <button type="button" className="eld-btn" disabled={!ok} style={S.wide} onClick={() => craft(r)}>Craft</button>
          </div>
        );
      })}
      <div className="eld-town-display" style={S.secT}>Owned armor</div>
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
        <button key={i} type="button" className={`eld-card${i === selected ? ' is-selected' : ''}`} style={S.fn} onClick={() => setSelected(i)}>
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
      <div className="eld-town-display" style={S.secT}>Sell armor</div>
      {(inventory.armor || []).length === 0 && <div style={S.empty}>No armor to sell.</div>}
      {(inventory.armor || []).map((a, i) => (
        <div key={a.id} className="eld-card" style={S.card}>
          <div style={S.row}><span>{a.name}</span><span style={S.rating}>~{Math.max(8, Math.floor((a.rating || 20) / 2))} ❖</span></div>
          <button type="button" className="eld-btn" style={S.wide} onClick={() => sellArmor(i)}>Sell</button>
        </div>
      ))}
      <div className="eld-town-display" style={S.secT}>Scrap weapons</div>
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

const L = TOWN_LAYOUT;
const S = {
  wrap: { flex: 1, minHeight: 0, overflowY: 'auto', padding: 0, textAlign: 'left' },
  dest: { padding: `${L.listPaddingY}px ${L.listPaddingX}px ${L.listPaddingY + 4}px` },
  col: { display: 'flex', flexDirection: 'column', gap: 8 },
  note: { fontSize: L.subtitlePx, color: 'var(--town-muted)', lineHeight: 1.4 },
  stash: { display: 'flex', flexDirection: 'column', gap: 6, padding: 10 },
  chip: { display: 'flex', justifyContent: 'space-between', border: '1px solid', borderLeftWidth: 3, borderRadius: 6, padding: '6px 10px', fontSize: L.subtitlePx },
  rating: { color: 'var(--town-muted)', fontVariantNumeric: 'tabular-nums', fontSize: L.subtitlePx },
  empty: { color: 'var(--town-muted)', fontSize: L.subtitlePx, fontStyle: 'italic', padding: '4px 0' },
  emptyBox: { padding: 12, fontSize: L.subtitlePx, color: 'var(--town-muted)', fontStyle: 'italic' },
  fn: { textAlign: 'left', padding: '12px 14px', width: '100%', color: 'inherit', fontFamily: 'inherit', cursor: 'pointer', minHeight: 52 },
  fnN: { fontSize: 16, fontWeight: 700 },
  fnS: { fontSize: L.subtitlePx, color: 'var(--town-muted)', marginTop: 4 },
  secT: { fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--town-gold)', margin: '8px 0 6px' },
  strip: { display: 'flex', flexWrap: 'wrap', gap: 10, padding: '8px 10px', fontSize: L.subtitlePx },
  card: { padding: 12 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  wide: { width: '100%', marginTop: 8 },
};
