import { useLayoutEffect, useRef, useState } from 'react';
import { TIER_COLOR, newId } from '../data.js';
import { MAT_QUALITY } from '../theme/tokens.js';
import { previewEmpower, EMPOWER_MAX, RARITY, weaponDamageMult } from '../progression/progression.js';
import { ARMOR_RECIPES, canCraft, consume, rollArmorRating, matPrice, describeInputs } from '../town/recipes.js';
import { TOWN_LAYOUT, TOWN_DESTINATIONS, TOWN_ART } from '../town/townLayout.js';
import TownArt from './town/TownArt.jsx';
import { DestinationRow } from './ui/index.jsx';
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
// Recipes, rolled ratings and the material floor live in town/recipes.js (Progression Loop Lock §9, tested).

const SECTION_TITLE = { crafter: 'Crafter', upgrade: 'Smith', market: 'Market' };

export default function TownScreen({ party, stash, setStash, inventory, setInventory, worldvein, setWorldvein, setTab, equipped }) {
  const taken = equipped || new Set();
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
          {section === 'upgrade' && <UpgradePanel stash={stash} setStash={setStash} worldvein={worldvein} setWorldvein={setWorldvein} taken={taken} />}
          {section === 'market' && <MarketPanel inventory={inventory} setInventory={setInventory} stash={stash} setStash={setStash} worldvein={worldvein} setWorldvein={setWorldvein} taken={taken} />}
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
          <DestinationRow key={d.id} art={TOWN_ART[d.art].art} position={TOWN_ART[d.art].position} title={d.title} subtitle={d.subtitle} onClick={() => onOpen(d)} />
        ))}
      </div>

      <div style={{ padding: `0 ${L.listPaddingX}px ${L.listPaddingY + 4}px` }}>
        <div className="eld-town-display" style={S.secT}>Stash weapons</div>
        <div className="eld-panel" style={S.stash}>
          {stash.length === 0 && <div style={S.empty}>No weapon loot yet.</div>}
          {stash.slice(-5).reverse().map((g) => (
            <div key={g.id} style={{ ...S.chip, borderColor: TIER_COLOR[g.tier] || '#8b5a2b' }}>
              <span style={{ color: TIER_COLOR[g.tier] }}>{g.name}</span>
              <span style={S.rating}>{g.baseRating}/100{g.empower ? ` +${g.empower}` : ''}</span>
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
    // decided from current props (bug-fix pass 1 §10): the rating rolls once, here
    const infused = consume(inventory.infused || [], recipe);
    if (!infused) return;
    const armor = [...(inventory.armor || []), {
      id: newId('a'), recipeId: recipe.id, name: recipe.name, quality: recipe.quality, rating: rollArmorRating(), slot: 'chest',
    }];
    setInventory({ ...inventory, infused, armor });
  }
  return (
    <div style={S.col}>
      <div style={S.note}>Craft body armor from infused mats. The rating rolls 1–100 at the bench. No +1-tier gate.</div>
      <div className="eld-panel" style={S.strip}>
        {RARITY.map((q) => (
          <span key={q} style={{ color: MAT_QUALITY[q]?.color }}>{q} {countQuality(q)}</span>
        ))}
      </div>
      {ARMOR_RECIPES.map((r) => {
        const ok = canCraft(inventory.infused || [], r);
        return (
          <div key={r.id} className="eld-card" style={S.card}>
            <div style={S.row}>
              <span style={{ ...S.fnN, color: MAT_QUALITY[r.quality]?.color }}>{r.name}</span>
              <span style={S.rating}>rolls 1–100</span>
            </div>
            <div style={S.fnS}>Needs {describeInputs(r)} · have {r.inputs.map((i) => (inventory.infused || []).filter((m) => m.quality === i.quality && (!i.family || m.family === i.family)).reduce((n, m) => n + m.qty, 0)).join(' / ')}</div>
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

/**
 * Smith — weapon empowerment (Progression Loop Lock §4). Pick a target and a fodder weapon; the bench
 * shows the empower gain, the Worldvein cost and the resulting hit multiplier BEFORE you commit.
 * `baseRating` never changes; `empower` climbs 0–100. Fodder is consumed. Equipped weapons can be
 * empowered but never fed. Merge-as-average is gone.
 */
function UpgradePanel({ stash, setStash, worldvein, setWorldvein, taken }) {
  const [targetId, setTargetId] = useState(null);
  const [fodderId, setFodderId] = useState(null);
  const target = stash.find((w) => w.id === targetId) || null;
  const fodder = stash.find((w) => w.id === fodderId) || null;
  const fodders = stash.filter((w) => w.id !== targetId && !taken.has(w.id));
  const preview = target && fodder ? previewEmpower(target, fodder, worldvein) : null;
  const canCommit = !!preview && preview.useful && preview.affordable;
  function commit() {
    if (!canCommit) return;
    // decided from current props, then set (bug-fix pass 1 §10)
    setWorldvein((v) => v - preview.cost);
    setStash(stash.filter((w) => w.id !== fodder.id).map((w) => (w.id === target.id ? { ...w, empower: preview.next } : w)));
    setFodderId(null);
  }
  const label = (w) => `${w.name} · ${w.baseRating}/100${w.empower ? ` +${w.empower}` : ''}${taken.has(w.id) ? ' · equipped' : ''}`;
  return (
    <div style={S.col}>
      <div style={S.note}>Feed one weapon into another. Rating is fixed at the drop; empowerment grows to +{EMPOWER_MAX} and multiplies hit damage. Same-type fodder counts double; higher rarity and rating feed more.</div>
      <div className="eld-panel" style={S.strip}><span>❖ {worldvein} Worldvein</span></div>
      {stash.length === 0 && <div className="eld-panel" style={S.emptyBox}>Bring mountain weapon drops here.</div>}
      <div className="eld-town-display" style={S.secT}>Target</div>
      {stash.map((w) => (
        <button key={w.id} type="button" className={`eld-card${w.id === targetId ? ' is-selected' : ''}`} style={{ ...S.fn, borderLeftWidth: 3, borderLeftColor: TIER_COLOR[w.tier] || undefined }} onClick={() => { setTargetId(w.id); if (fodderId === w.id) setFodderId(null); }}>
          <div style={{ ...S.fnN, color: TIER_COLOR[w.tier] }}>{label(w)}</div>
          <div style={S.fnS}>{w.tier} · ×{weaponDamageMult(w).toFixed(2)} hit{(w.empower || 0) >= EMPOWER_MAX ? ' · fully empowered' : ''}</div>
        </button>
      ))}
      {target && (
        <>
          <div className="eld-town-display" style={S.secT}>Fodder (consumed)</div>
          {fodders.length === 0 && <div style={S.empty}>No spare weapons — equipped weapons can't be fed.</div>}
          {fodders.map((w) => {
            const pv = previewEmpower(target, w, worldvein);
            return (
              <button key={w.id} type="button" className={`eld-card${w.id === fodderId ? ' is-selected' : ''}`} style={{ ...S.fn, borderLeftWidth: 3, borderLeftColor: TIER_COLOR[w.tier] || undefined }} onClick={() => setFodderId(w.id)}>
                <div style={{ ...S.fnN, color: TIER_COLOR[w.tier] }}>{label(w)}</div>
                <div style={S.fnS}>{w.tier}{w.weaponType === target.weaponType ? ' · same type' : ' · other type (half)'} · +{pv ? pv.gain : 0} empower</div>
              </button>
            );
          })}
        </>
      )}
      {target && fodder && preview && (
        <div className="eld-card" style={S.card}>
          <div style={S.row}><span>Empower</span><span style={S.rating}>+{target.empower || 0} → +{preview.next}</span></div>
          <div style={S.row}><span>Gain</span><span style={S.rating}>+{preview.gain}</span></div>
          <div style={S.row}><span>Cost</span><span style={{ ...S.rating, color: preview.affordable ? undefined : '#e05d6f' }}>{preview.cost} ❖</span></div>
          <div style={S.row}><span>Hit multiplier</span><span style={S.rating}>×{weaponDamageMult(target).toFixed(2)} → ×{weaponDamageMult({ ...target, empower: preview.next }).toFixed(2)}</span></div>
          <div style={S.fnS}>Consumes {fodder.name}.</div>
          <button type="button" className="eld-btn" style={S.wide} disabled={!canCommit} onClick={commit}>
            {(target.empower || 0) >= EMPOWER_MAX ? 'Fully empowered' : !preview.affordable ? 'Not enough Worldvein' : 'Empower'}
          </button>
        </div>
      )}
    </div>
  );
}

function MarketPanel({ inventory, setInventory, stash, setStash, worldvein, setWorldvein, taken }) {
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
    if (!gone || taken.has(gone.id)) return; // equipped armor is never sold
    setInventory({ ...inventory, armor, scrap: (inventory.scrap || 0) + 1 });
    setWorldvein((v) => v + Math.max(8, Math.floor((gone.rating || 20) / 2)));
  }
  function scrapWeapon(idx) {
    const next = [...stash];
    const [gone] = next.splice(idx, 1);
    if (!gone || taken.has(gone.id)) return; // equipped weapons are never scrapped
    setStash(next);
    setInventory((inv) => ({ ...inv, scrap: (inv.scrap || 0) + 1 }));
    setWorldvein((v) => v + Math.max(3, Math.floor((gone.baseRating || 10) / 5)));
  }
  // Progression Loop Lock §2: every material tier sells at the market floor.
  function sellMats(quality) {
    const lots = (inventory.infused || []).filter((m) => m.quality === quality);
    const qty = lots.reduce((n, m) => n + m.qty, 0);
    if (qty <= 0) return;
    setInventory({ ...inventory, infused: (inventory.infused || []).filter((m) => m.quality !== quality) });
    setWorldvein((v) => v + qty * matPrice(quality));
  }
  const matQty = (q) => (inventory.infused || []).filter((m) => m.quality === q).reduce((n, m) => n + m.qty, 0);
  return (
    <div style={S.col}>
      <div style={S.note}>Vendor under Town — sell scrap / excess armor for Worldvein. DESIGN-OPEN: full vendor stock.</div>
      <div className="eld-panel" style={S.strip}><span>❖ {worldvein}</span><span>Scrap {inventory.scrap || 0}</span></div>
      <button type="button" className="eld-btn" style={S.wide} disabled={!inventory.scrap} onClick={sellScrap}>
        Sell all scrap (+{(inventory.scrap || 0) * 2} ❖)
      </button>
      <div className="eld-town-display" style={S.secT}>Sell infused materials</div>
      <div className="eld-panel" style={S.strip}>
        {RARITY.map((q) => (
          <button key={q} type="button" className="eld-btn eld-btn-ghost" disabled={matQty(q) === 0} style={{ color: MAT_QUALITY[q]?.color }} onClick={() => sellMats(q)}>
            {q} ×{matQty(q)} → {matQty(q) * matPrice(q)} ❖
          </button>
        ))}
      </div>
      <div className="eld-town-display" style={S.secT}>Sell armor</div>
      {(inventory.armor || []).length === 0 && <div style={S.empty}>No armor to sell.</div>}
      {(inventory.armor || []).map((a, i) => (
        <div key={a.id} className="eld-card" style={S.card}>
          <div style={S.row}><span>{a.name}{taken.has(a.id) ? ' · equipped' : ''}</span><span style={S.rating}>~{Math.max(8, Math.floor((a.rating || 20) / 2))} ❖</span></div>
          <button type="button" className="eld-btn" style={S.wide} disabled={taken.has(a.id)} onClick={() => sellArmor(i)}>{taken.has(a.id) ? 'Equipped' : 'Sell'}</button>
        </div>
      ))}
      <div className="eld-town-display" style={S.secT}>Scrap weapons</div>
      {stash.length === 0 && <div style={S.empty}>No stash weapons.</div>}
      {stash.map((g, i) => (
        <div key={g.id} className="eld-card" style={S.card}>
          <div style={S.row}><span>{g.name}{taken.has(g.id) ? ' · equipped' : ''}</span><span style={S.rating}>{g.baseRating}/100 · scrap + ❖</span></div>
          <button type="button" className="eld-btn eld-btn-ghost" style={S.wide} disabled={taken.has(g.id)} onClick={() => scrapWeapon(i)}>{taken.has(g.id) ? 'Equipped' : 'Scrap'}</button>
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
