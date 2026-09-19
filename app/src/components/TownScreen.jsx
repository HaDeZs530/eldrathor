import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { RARITY_COLOR } from '../data.js';
import { previewEmpower, EMPOWER_MAX, weaponDamageMult } from '../progression/progression.js';
import {
  ARMOR_TYPES, craftableRarities, craftCapForArea, upgradeGrade, upgradeStepFor, upgradeCost,
  displayName, tierForArea,
} from '../progression/items.js';
import { armorRecipe, canCraft, consume, craftArmor, describeInputs, countFor, upgradeRecipe, canUpgrade, coresOfType, upgradeOnly } from '../town/recipes.js';
import { TOWN_LAYOUT, TOWN_DESTINATIONS, TOWN_ART } from '../town/townLayout.js';
import TownArt from './town/TownArt.jsx';
import BagScreen from './BagScreen.jsx';
import RosterPanel from './RosterPanel.jsx';
import ItemRow from './items/ItemRow.jsx';
import { DestinationRow } from './ui/index.jsx';
import './town/town.css';
import './items/items.css';

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

const SECTION_TITLE = { bag: 'Bag', roster: 'Roster', crafter: 'Crafter', upgrade: 'Smith', market: 'Market' };

export default function TownScreen({ party, roster, setParty, setRoster, bag, setBag, worldvein, setWorldvein, setTab, equipped, unlocked = 1, locked = false, onOpenLattice }) {
  const taken = equipped || new Set();
  const ownerOf = useMemo(() => {
    const map = new Map();
    for (const m of [...(party || []), ...(roster || [])]) for (const id of Object.values(m.equipped || {})) if (id) map.set(id, m.name);
    return (id) => map.get(id) || null;
  }, [party, roster]);
  const wearerOf = useMemo(() => {
    const map = new Map();
    for (const m of [...(party || []), ...(roster || [])]) if (m.equipped?.gem) map.set(m.equipped.gem, m);
    return (id) => map.get(id) || null;
  }, [party, roster]);
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
          <HarborLanding party={party} bag={bag} onOpen={open} />
        </div>
      ) : (
        <div key={section} className="eld-town-section" style={S.dest}>
          <div className="eld-town-dest-head">
            <button type="button" className="eld-town-back" onClick={() => go('hub')} aria-label="Back to Veinharbor">← Back to Veinharbor</button>
            <div className="eld-town-display eld-town-dest-title" style={{ fontSize: TOWN_LAYOUT.titlePx }}>{SECTION_TITLE[section]}</div>
          </div>
          {section === 'bag' && <BagScreen bag={bag} setBag={setBag} equipped={taken} ownerOf={ownerOf} wearerOf={wearerOf} onOpenLattice={onOpenLattice} setWorldvein={setWorldvein} title={null} />}
          {section === 'roster' && <RosterPanel party={party} roster={roster} setParty={setParty} setRoster={setRoster} bag={bag} setBag={setBag} worldvein={worldvein} setWorldvein={setWorldvein} locked={locked} />}
          {section === 'crafter' && <CrafterPanel bag={bag} setBag={setBag} unlocked={unlocked} />}
          {section === 'upgrade' && <UpgradePanel bag={bag} setBag={setBag} worldvein={worldvein} setWorldvein={setWorldvein} taken={taken} unlocked={unlocked} />}
          {section === 'market' && <BagScreen bag={bag} setBag={setBag} equipped={taken} ownerOf={ownerOf} setWorldvein={setWorldvein} title={null} emptyNote="Nothing to sell." />}
        </div>
      )}
    </div>
  );
}

/** Harbor landing: hero + title, then the destination rows. The stash list is gone — Bag owns it (§5). */
function HarborLanding({ party, bag, onOpen }) {
  const L = TOWN_LAYOUT;
  const carried = (bag || []).reduce((n, i) => n + (i.qty || 1), 0);
  return (
    <>
      <div className="eld-town-hero" style={{ height: L.heroHeight }}>
        <TownArt slot="veinharbor-hero" alt="" />
        <div className="eld-town-hero-scrim" />
        <div className="eld-town-hero-title">
          <div className="eld-town-hero-kicker">Harbor town · {party.length} bonded · {carried} carried</div>
          <div className="eld-town-display" style={{ fontSize: 28 }}>Veinharbor</div>
        </div>
      </div>

      <div className="eld-town-list" style={{ padding: `${L.listPaddingY}px ${L.listPaddingX}px`, gap: L.rowGap }}>
        {TOWN_DESTINATIONS.map((d) => (
          <DestinationRow key={d.id} art={TOWN_ART[d.art].art} position={TOWN_ART[d.art].position} title={d.title} subtitle={d.subtitle} onClick={() => onOpen(d)} />
        ))}
      </div>
    </>
  );
}

/**
 * Crafter — Item Model §1 / §2. Armor is crafted, never dropped. Four types (Cuirass · Helm ·
 * Gauntlets · Greaves) at every rarity the highest unlocked area allows: Common → Epic anywhere,
 * Legendary with areas 6–7, and Artifact / Mythic only as Smith UPGRADES of the rung below.
 * A recipe consumes the piece's tier-band materials at the target rarity; the rating rolls here.
 */
function CrafterPanel({ bag, setBag, unlocked }) {
  const tier = tierForArea(unlocked);
  const [rarity, setRarity] = useState('Common');
  const rarities = craftableRarities(unlocked);
  const cap = craftCapForArea(unlocked);
  function craft(recipe) {
    const rest = consume(bag, recipe, unlocked);
    if (!rest) return;
    setBag([...rest, craftArmor(recipe)]);
  }
  return (
    <div style={S.col}>
      <div style={S.note}>
        Armor is crafted from processed materials. This band is <strong>T{tier}</strong> — the highest area you have
        reached. Craftable up to <span style={{ color: RARITY_COLOR[cap] }}>{cap}</span>; Artifact and Mythic pieces are
        Smith upgrades, not crafts.
      </div>
      <div className="eld-bag-chips">
        {rarities.map((r) => (
          <button key={r} type="button" className={`eld-bag-chip${rarity === r ? ' is-on' : ''}`} style={rarity === r ? { color: RARITY_COLOR[r], borderColor: RARITY_COLOR[r] } : undefined} onClick={() => setRarity(r)}>{r}</button>
        ))}
      </div>
      {upgradeOnly(rarity) ? (
        <div className="eld-panel" style={S.emptyBox}>{rarity} armor is forged at the Smith by upgrading the rung below with a Core.</div>
      ) : Object.keys(ARMOR_TYPES).map((type) => {
        const r = armorRecipe(type, rarity, tier);
        const ok = canCraft(bag, r, unlocked);
        return (
          <div key={type} className="eld-card" style={S.card}>
            <div style={S.row}>
              <span style={{ ...S.fnN, color: RARITY_COLOR[rarity] }}>{r.name}</span>
              <span style={S.rating}>{ARMOR_TYPES[type].share === 1 ? 'body' : `${ARMOR_TYPES[type].slot} · ½ values`}</span>
            </div>
            <div style={S.fnS}>Needs {describeInputs(r)} · have {r.inputs.map((i) => countFor(bag, i)).join(' / ')} · rating rolls 1–100</div>
            <button type="button" className="eld-btn" disabled={!ok} style={S.wide} onClick={() => craft(r)}>Craft</button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Smith — two benches.
 * **Empower** (Progression lock §4): feed one weapon into another; `rating` is fixed at the drop,
 * `empower` climbs 0–100 and multiplies hit damage. Equipped weapons can be empowered, never fed.
 * **Upgrade grade** (Item Model §1): Legendary + Artifact Core + zone materials → Artifact;
 * Artifact + Mythic Core → Mythic. Rating and empower carry over; the tier never changes.
 */
function UpgradePanel({ bag, setBag, worldvein, setWorldvein, taken, unlocked }) {
  const [bench, setBench] = useState('empower');
  const weapons = bag.filter((i) => i.kind === 'weapon');
  const [targetId, setTargetId] = useState(null);
  const [fodderId, setFodderId] = useState(null);
  const target = weapons.find((w) => w.id === targetId) || null;
  const fodder = weapons.find((w) => w.id === fodderId) || null;
  const fodders = weapons.filter((w) => w.id !== targetId && !taken.has(w.id));
  const preview = target && fodder ? previewEmpower(target, fodder, worldvein) : null;
  const canCommit = !!preview && preview.useful && preview.affordable;

  function commit() {
    if (!canCommit) return;
    setWorldvein((v) => v - preview.cost);
    setBag(bag.filter((i) => i.id !== fodder.id).map((i) => (i.id === target.id ? { ...i, empower: preview.next } : i)));
    setFodderId(null);
  }

  // upgrade-grade bench
  const upgradeable = bag.filter((i) => (i.kind === 'weapon' || i.kind === 'armor') && upgradeStepFor(i));
  const [gradeId, setGradeId] = useState(null);
  const grade = upgradeable.find((i) => i.id === gradeId) || null;
  const gradeRecipe = grade ? upgradeRecipe(grade) : null;
  const gradeReady = grade ? canUpgrade(bag, grade, unlocked) : false;
  const gradePrice = grade ? upgradeCost(grade) : 0;
  function commitGrade() {
    if (!grade || !gradeReady || worldvein < gradePrice) return;
    const core = coresOfType(bag, gradeRecipe.core)[0];
    let rest = consume(bag, { ...gradeRecipe, rarity: grade.rarity }, unlocked) || bag;
    rest = rest.filter((i) => i.id !== core.id);
    setBag(rest.map((i) => (i.id === grade.id ? upgradeGrade(grade, core) : i)));
    setWorldvein((v) => v - gradePrice);
    setGradeId(null);
  }

  return (
    <div style={S.col}>
      <div className="eld-bag-chips">
        <button type="button" className={`eld-bag-chip${bench === 'empower' ? ' is-on' : ''}`} onClick={() => setBench('empower')}>Empower</button>
        <button type="button" className={`eld-bag-chip${bench === 'grade' ? ' is-on' : ''}`} onClick={() => setBench('grade')}>Upgrade grade</button>
      </div>
      <div className="eld-panel" style={S.strip}><span>❖ {worldvein} Worldvein</span></div>

      {bench === 'empower' ? (
        <>
          <div style={S.note}>Feed one weapon into another. Rating is fixed at the drop; empowerment grows to +{EMPOWER_MAX} and multiplies hit damage. Same-type fodder counts double; higher rarity and rating feed more.</div>
          {weapons.length === 0 && <div className="eld-panel" style={S.emptyBox}>Bring mountain weapon drops here.</div>}
          <div className="eld-town-display" style={S.secT}>Target</div>
          <div className="eld-bag-list">
            {weapons.map((w) => (
              <ItemRow key={w.id} item={w} selected={w.id === targetId} note={`×${weaponDamageMult(w).toFixed(2)} hit${(w.empower || 0) >= EMPOWER_MAX ? ' · fully empowered' : ''}`} onClick={() => { setTargetId(w.id); if (fodderId === w.id) setFodderId(null); }} />
            ))}
          </div>
          {target && (
            <>
              <div className="eld-town-display" style={S.secT}>Fodder (consumed)</div>
              {fodders.length === 0 && <div style={S.empty}>No spare weapons — equipped weapons can&apos;t be fed.</div>}
              <div className="eld-bag-list">
                {fodders.map((w) => {
                  const pv = previewEmpower(target, w, worldvein);
                  return <ItemRow key={w.id} item={w} selected={w.id === fodderId} note={`${w.type === target.type ? 'same type' : 'other type (half)'} · +${pv ? pv.gain : 0} empower`} onClick={() => setFodderId(w.id)} />;
                })}
              </div>
            </>
          )}
          {target && fodder && preview && (
            <div className="eld-card" style={S.card}>
              <div style={S.row}><span>Empower</span><span style={S.rating}>+{target.empower || 0} → +{preview.next}</span></div>
              <div style={S.row}><span>Cost</span><span style={{ ...S.rating, color: preview.affordable ? undefined : 'var(--eld-danger)' }}>{preview.cost} ❖</span></div>
              <div style={S.row}><span>Hit multiplier</span><span style={S.rating}>×{weaponDamageMult(target).toFixed(2)} → ×{weaponDamageMult({ ...target, empower: preview.next }).toFixed(2)}</span></div>
              <div style={S.fnS}>Consumes {displayName(fodder)}.</div>
              <button type="button" className="eld-btn" style={S.wide} disabled={!canCommit} onClick={commit}>
                {(target.empower || 0) >= EMPOWER_MAX ? 'Fully empowered' : !preview.affordable ? 'Not enough Worldvein' : 'Empower'}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={S.note}>
            A Legendary piece plus an <strong>Artifact Core</strong> and its band&apos;s materials becomes Artifact; an Artifact
            plus a <strong>Mythic Core</strong> becomes Mythic. Rating and empowerment carry over — the tier never changes.
            Cores are hunted in areas 8–9; the Mythic Core drops from Vaelyx.
          </div>
          {upgradeable.length === 0 && <div className="eld-panel" style={S.emptyBox}>Nothing to upgrade yet — bring a Legendary or Artifact piece.</div>}
          <div className="eld-bag-list">
            {upgradeable.map((i) => (
              <ItemRow key={i.id} item={i} selected={i.id === gradeId} note={`→ ${upgradeStepFor(i).to}`} onClick={() => setGradeId(i.id)} />
            ))}
          </div>
          {grade && gradeRecipe && (
            <div className="eld-card" style={S.card}>
              <div style={S.row}><span>Becomes</span><span style={{ ...S.rating, color: RARITY_COLOR[gradeRecipe.to] }}>{gradeRecipe.to} {grade.type}</span></div>
              <div style={S.row}><span>Core</span><span style={S.rating}>{gradeRecipe.core} · have {coresOfType(bag, gradeRecipe.core).length}</span></div>
              <div style={S.fnS}>Needs {describeInputs(gradeRecipe)} · have {gradeRecipe.inputs.map((i) => countFor(bag, i)).join(' / ')}</div>
              <div style={S.row}><span>Cost</span><span style={{ ...S.rating, color: worldvein >= gradePrice ? undefined : 'var(--eld-danger)' }}>{gradePrice} ❖</span></div>
              <div style={S.fnS}>Rating {grade.rating}/100{grade.empower ? ` and +${grade.empower} empowerment` : ''} carries over.</div>
              <button type="button" className="eld-btn" style={S.wide} disabled={!gradeReady || worldvein < gradePrice} onClick={commitGrade}>
                {!gradeReady ? 'Missing core or materials' : worldvein < gradePrice ? 'Not enough Worldvein' : `Upgrade to ${gradeRecipe.to}`}
              </button>
            </div>
          )}
        </>
      )}
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
