import React, { useState, useEffect, useRef } from "react";

// ELDRATHOR — Core Expedition Prototype
// Vertical slice: party -> world select -> procedural node map -> auto-combat -> loot/Worldvein -> boss -> return
// All damage is Mythros. Idle-resolve combat. UI-only, no character movement.

// ---------- DATA ----------

const ARCHETYPES = {
  Bulwark:  { role: "Tank",    hp: 220, atk: 10, def: 14, color: "#6fb7d6", blurb: "Draws focus, endures." },
  Warden:   { role: "Healer",  hp: 150, atk: 9,  def: 8,  color: "#7fd6a0", blurb: "Mends the party." },
  Striker:  { role: "Damage",  hp: 130, atk: 22, def: 6,  color: "#e0a04d", blurb: "Ramps damage in a fight." },
  Adept:    { role: "Control",  hp: 140, atk: 14, def: 7,  color: "#b58fe0", blurb: "Locks and sunders foes." },
  Resonator:{ role: "Support", hp: 145, atk: 12, def: 8,  color: "#d6c86f", blurb: "Empowers the party & harvest." },
};

const WEAPONS = {
  "Dual Daggers":   { tempo: 0.55, dmg: 0.85, mit: 0.02, group: "Melee DPS" },
  "Dual Swords":    { tempo: 0.8,  dmg: 1.0,  mit: 0.05, group: "Melee DPS" },
  "Greatsword":     { tempo: 1.5,  dmg: 1.7,  mit: 0.10, group: "Tank" },
  "Sword + Shield":  { tempo: 1.0,  dmg: 0.7,  mit: 0.22, group: "Tank" },
  "Bow":            { tempo: 0.7,  dmg: 0.95, mit: 0.02, group: "Ranged" },
  "Crossbow":       { tempo: 1.3,  dmg: 1.5,  mit: 0.03, group: "Ranged" },
  "Staff":          { tempo: 0.9,  dmg: 1.1,  mit: 0.04, group: "Caster" },
  "Orb + Tome":     { tempo: 1.4,  dmg: 1.6,  mit: 0.05, group: "Caster" },
};

const WORLDS = [
  { id: 1, name: "Shoreline Forest",       clock: "7–10", tier: 1,  nodes: 11, boss: "The Gorewood Stag",  accent: "#8fae6b" },
  { id: 2, name: "Overrun Peninsula Town", clock: "9–12", tier: 2,  nodes: 13, boss: "The Hollow Bellringer", accent: "#b8a05a" },
  { id: 3, name: "The Ravine Path",        clock: "11–2", tier: 3,  nodes: 15, boss: "The Bridgewright",    accent: "#6f8fb7" },
  { id: 4, name: "The Magical Forge",      clock: "top",  tier: 4,  nodes: 15, boss: "Forge Warden (Wing)", accent: "#d67d4d", court: true },
  { id: 5, name: "The Upper Castle",       clock: "top",  tier: 5,  nodes: 17, boss: "The Bound Court",    accent: "#9d6fd6", court: true },
];

const NODE_TYPES = {
  normal:  { label: "Skirmish",  glyph: "✦", color: "#8aa0b5" },
  rare:    { label: "Rare",      glyph: "◈", color: "#e0a04d" },
  crystal: { label: "Vein Crystal", glyph: "❖", color: "#5fc7e0" },
  boss:    { label: "Boss",      glyph: "☠", color: "#e05d6f" },
};

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- MAP GENERATION ----------
// Procedural: rows of nodes, edges to next row, one guaranteed path to boss at top.
function genMap(world) {
  const rows = Math.max(5, Math.round(world.nodes / 2.2));
  const map = [];
  for (let r = 0; r < rows; r++) {
    const count = r === rows - 1 ? 1 : (r === 0 ? 1 : Math.floor(rand(2, 4)));
    const row = [];
    for (let c = 0; c < count; c++) {
      let type = "normal";
      if (r === rows - 1) type = "boss";
      else if (r === 0) type = "normal";
      else {
        const roll = Math.random();
        if (roll < 0.12) type = "rare";
        else if (roll < 0.30) type = "crystal";
        else type = "normal";
      }
      row.push({
        id: `${r}-${c}`, r, c, type,
        cleared: false,
        tier: world.tier,
      });
    }
    map.push(row);
  }
  // ensure 2 rares somewhere in the middle rows
  let rares = map.flat().filter(n => n.type === "rare").length;
  while (rares < 2) {
    const r = Math.floor(rand(1, rows - 1));
    const node = pick(map[r]);
    if (node.type === "normal") { node.type = "rare"; rares++; }
  }
  return map;
}

// ---------- COMBAT ----------
// Auto-resolve. Returns a log + outcome. Party dps vs enemy pool hp; enemy dps vs party.
function resolveFight(party, node) {
  const tierMult = 1 + (node.tier - 1) * 0.6;
  const typeMult = node.type === "boss" ? 6 : node.type === "rare" ? 2.4 : node.type === "crystal" ? 1.5 : 1;
  const enemyHP = Math.round(rand(90, 130) * tierMult * typeMult);
  const enemyDPS = rand(6, 10) * tierMult * (node.type === "boss" ? 1.6 : node.type === "rare" ? 1.2 : 1);

  // party dps
  let partyDPS = 0;
  party.forEach(m => {
    const a = ARCHETYPES[m.archetype];
    const w = WEAPONS[m.weapon];
    const perHit = (a.atk + m.level * 2) * w.dmg;
    partyDPS += perHit / w.tempo;
  });
  // striker ramp & resonator buff, simple approximations
  if (party.some(m => m.archetype === "Resonator")) partyDPS *= 1.08;

  let partyHP = party.reduce((s, m) => s + (ARCHETYPES[m.archetype].hp + m.level * 12), 0);
  const partyMaxHP = partyHP;
  const partyMit = party.reduce((s, m) => s + WEAPONS[m.weapon].mit, 0) / party.length
                 + party.reduce((s, m) => s + ARCHETYPES[m.archetype].def, 0) / party.length / 100;
  const hasHealer = party.some(m => m.archetype === "Warden");

  // simulate ticks
  let eHP = enemyHP, pHP = partyHP, t = 0;
  const maxT = 400;
  while (eHP > 0 && pHP > 0 && t < maxT) {
    eHP -= partyDPS * 0.1;
    let incoming = enemyDPS * 0.1 * (1 - Math.min(0.6, partyMit));
    pHP -= incoming;
    if (hasHealer) pHP = Math.min(partyMaxHP, pHP + partyMaxHP * 0.006);
    t++;
  }
  const win = eHP <= 0;
  const hpPct = Math.max(0, pHP / partyMaxHP);
  return { win, hpPct, duration: (t * 0.1).toFixed(1) };
}

function rollLoot(node) {
  const base = node.type === "boss" ? 5 : node.type === "rare" ? 3 : node.type === "crystal" ? 2 : 1;
  const worldvein = Math.round(rand(4, 9) * base * node.tier);
  let gear = null;
  const gearChance = node.type === "boss" ? 1 : node.type === "rare" ? 0.6 : node.type === "crystal" ? 0.25 : 0.12;
  if (Math.random() < gearChance) {
    const tiers = ["Common", "Fine", "Rare", "Epic", "Legendary"];
    const ti = node.type === "boss" ? Math.min(4, node.tier) : Math.min(node.tier - 1 + (Math.random() < 0.3 ? 1 : 0), 4);
    const qtier = tiers[Math.max(0, ti)];
    const rating = Math.round(rand(1, 100));
    const slots = ["Blade", "Guard", "Vestment", "Charm", "Crown"];
    gear = { name: `${qtier} ${pick(slots)}`, tier: qtier, rating };
  }
  const healCrystal = Math.random() < 0.14;
  return { worldvein, gear, healCrystal };
}

// ---------- ROSTER SETUP ----------
const DEFAULT_PARTY = [
  { name: "Kessa",  archetype: "Bulwark", weapon: "Sword + Shield", level: 3 },
  { name: "Orin",   archetype: "Warden",  weapon: "Staff",          level: 3 },
  { name: "Vayle",  archetype: "Striker", weapon: "Dual Daggers",   level: 3 },
];

// ---------- UI ----------
export default function Eldrathor() {
  const [screen, setScreen] = useState("harbor"); // harbor | party | map
  const [party, setParty] = useState(DEFAULT_PARTY);
  const [worldvein, setWorldvein] = useState(0);
  const [stash, setStash] = useState([]);
  const [world, setWorld] = useState(null);
  const [map, setMap] = useState(null);
  const [pos, setPos] = useState(null); // {r,c}
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);
  const [partyHP, setPartyHP] = useState(1);
  const [runVein, setRunVein] = useState(0);
  const [unlocked, setUnlocked] = useState(1);
  const [flash, setFlash] = useState(null);
  const logRef = useRef(null);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [log]);

  function enterWorld(w) {
    const m = genMap(w);
    setWorld(w); setMap(m); setPos({ r: 0, c: 0 });
    setLog([{ t: `You arrive at ${w.name}. The Vein hums through the stone.`, k: "sys" }]);
    setPartyHP(1); setRunVein(0); setScreen("map");
    // clear the start node
    m[0][0].cleared = true;
  }

  function nodeReachable(n) {
    if (!pos) return false;
    if (n.cleared) return false;
    return n.r === pos.r + 1; // next row up
  }

  function pushLog(t, k = "n") { setLog(l => [...l, { t, k }]); }

  function doFlash(msg, color) { setFlash({ msg, color }); setTimeout(() => setFlash(null), 1400); }

  function visitNode(n) {
    if (busy) return;
    setBusy(true);
    const nt = NODE_TYPES[n.type];
    pushLog(`→ Entering a ${nt.label} node…`, "sys");
    setTimeout(() => {
      const res = resolveFight(party, n);
      if (!res.win) {
        pushLog(`The party falls at the ${nt.label}. (survived ${res.duration}s)`, "bad");
        doFlash("Party defeated — returned to Veinharbor", "#e05d6f");
        // death: teleport home, keep banked, map resets, no penalty
        setTimeout(() => {
          setWorldvein(v => v + runVein);
          setScreen("harbor"); setBusy(false);
        }, 1200);
        return;
      }
      // win
      n.cleared = true;
      setPos({ r: n.r, c: n.c });
      setPartyHP(res.hpPct);
      const loot = rollLoot(n);
      setRunVein(v => v + loot.worldvein);
      pushLog(`✔ Cleared in ${res.duration}s. +${loot.worldvein} Worldvein.${n.type === "crystal" ? " The crystal splinters — rich harvest." : ""}`, "good");
      if (loot.gear) {
        setStash(s => [...s, loot.gear]);
        pushLog(`  ⬥ Loot: ${loot.gear.name} (${loot.gear.rating}/100)`, "loot");
      }
      if (loot.healCrystal) {
        setPartyHP(h => Math.min(1, h + 0.3));
        pushLog(`  ✚ A healing crystal restores the party.`, "heal");
      }
      if (n.type === "boss") {
        pushLog(`${world.boss} is defeated. The way upward opens.`, "boss");
        doFlash(`${world.name} cleared!`, world.accent);
        setUnlocked(u => Math.max(u, world.id + 1));
        setTimeout(() => {
          setWorldvein(v => v + runVein + loot.worldvein);
          setScreen("harbor");
        }, 1500);
      }
      setBusy(false);
    }, 700);
  }

  function extract() {
    setWorldvein(v => v + runVein);
    doFlash(`Extracted ${runVein} Worldvein`, "#5fc7e0");
    setTimeout(() => setScreen("harbor"), 600);
  }

  // ---------- RENDER ----------
  return (
    <div style={S.root}>
      <style>{CSS}</style>
      <div style={S.frame}>
        <Header worldvein={worldvein} screen={screen} setScreen={setScreen} />

        {flash && (
          <div style={{ ...S.flash, borderColor: flash.color, color: flash.color }}>{flash.msg}</div>
        )}

        {screen === "harbor" && (
          <Harbor party={party} unlocked={unlocked} enterWorld={enterWorld}
                  stash={stash} setScreen={setScreen} />
        )}

        {screen === "party" && (
          <PartyEditor party={party} setParty={setParty} back={() => setScreen("harbor")} />
        )}

        {screen === "map" && world && map && (
          <MapView world={world} map={map} pos={pos} nodeReachable={nodeReachable}
                   visitNode={visitNode} log={log} logRef={logRef} busy={busy}
                   partyHP={partyHP} runVein={runVein} extract={extract} party={party} />
        )}
      </div>
    </div>
  );
}

function Header({ worldvein, screen, setScreen }) {
  return (
    <div style={S.header}>
      <div style={S.brand}>
        <span style={S.brandMark}>❖</span>
        <span style={S.brandName}>ELDRATHOR</span>
        <span style={S.brandSub}>Veinharbor</span>
      </div>
      <div style={S.vein}>
        <span style={S.veinGlyph}>❖</span>
        <span style={S.veinNum}>{worldvein.toLocaleString()}</span>
        <span style={S.veinLbl}>Worldvein</span>
      </div>
    </div>
  );
}

function Harbor({ party, unlocked, enterWorld, stash, setScreen }) {
  return (
    <div style={S.body}>
      <div style={S.colLeft}>
        <SectionTitle n="I" t="Your Party" action={<button style={S.ghostBtn} onClick={() => setScreen("party")}>Manage</button>} />
        <div style={S.partyRow}>
          {party.map((m, i) => <PartyCard key={i} m={m} />)}
        </div>

        <SectionTitle n="II" t="Stash" />
        <div style={S.stash}>
          {stash.length === 0 && <div style={S.empty}>No loot yet. The mountain is waiting.</div>}
          {stash.slice(-8).reverse().map((g, i) => (
            <div key={i} style={{ ...S.lootChip, borderColor: TIER_COLOR[g.tier] }}>
              <span style={{ color: TIER_COLOR[g.tier] }}>{g.name}</span>
              <span style={S.rating}>{g.rating}/100</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.colRight}>
        <SectionTitle n="III" t="The Mountain" sub="Choose an expedition" />
        <div style={S.worldList}>
          {WORLDS.map(w => {
            const locked = w.id > unlocked;
            return (
              <button key={w.id} disabled={locked}
                onClick={() => enterWorld(w)}
                style={{ ...S.worldCard, opacity: locked ? 0.4 : 1, cursor: locked ? "not-allowed" : "pointer",
                         borderLeftColor: w.accent }}>
                <div style={S.worldClock}>{w.clock} o'clock</div>
                <div style={S.worldName}>{w.name}</div>
                <div style={S.worldMeta}>
                  <span>Tier {w.tier}</span>
                  {w.court && <span style={S.courtTag}>Court-Art</span>}
                  {locked && <span style={S.lockTag}>Locked</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PartyCard({ m }) {
  const a = ARCHETYPES[m.archetype];
  return (
    <div style={{ ...S.pcard, borderTopColor: a.color }}>
      <div style={S.pcardName}>{m.name}</div>
      <div style={{ ...S.pcardRole, color: a.color }}>{m.archetype} · {a.role}</div>
      <div style={S.pcardWeapon}>{m.weapon}</div>
      <div style={S.pcardLvl}>Lv {m.level}</div>
    </div>
  );
}

function PartyEditor({ party, setParty, back }) {
  function update(i, field, val) {
    setParty(p => p.map((m, j) => j === i ? { ...m, [field]: val } : m));
  }
  return (
    <div style={S.body}>
      <div style={{ width: "100%" }}>
        <SectionTitle n="" t="Manage Party" action={<button style={S.ghostBtn} onClick={back}>Done</button>} />
        <div style={S.editGrid}>
          {party.map((m, i) => {
            const a = ARCHETYPES[m.archetype];
            return (
              <div key={i} style={{ ...S.editCard, borderTopColor: a.color }}>
                <input style={S.nameInput} value={m.name} onChange={e => update(i, "name", e.target.value)} />
                <label style={S.editLbl}>Archetype (nature)</label>
                <select style={S.select} value={m.archetype} onChange={e => update(i, "archetype", e.target.value)}>
                  {Object.keys(ARCHETYPES).map(k => <option key={k}>{k}</option>)}
                </select>
                <div style={S.archBlurb}>{a.blurb}</div>
                <label style={S.editLbl}>Weapon (tempo · damage)</label>
                <select style={S.select} value={m.weapon} onChange={e => update(i, "weapon", e.target.value)}>
                  {Object.keys(WEAPONS).map(k => <option key={k}>{k}</option>)}
                </select>
                <div style={S.statRow}>
                  <span>HP {a.hp + m.level * 12}</span>
                  <span>ATK {a.atk + m.level * 2}</span>
                  <span>DEF {a.def}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div style={S.note}>Archetype = permanent nature. Weapon = tempo & damage delivery (all damage is Mythros). Class gems (role toolkit) not in this slice.</div>
      </div>
    </div>
  );
}

function MapView({ world, map, pos, nodeReachable, visitNode, log, logRef, busy, partyHP, runVein, extract, party }) {
  return (
    <div style={S.mapWrap}>
      <div style={S.mapMain}>
        <div style={S.mapHead}>
          <div>
            <div style={S.mapTitle} >{world.name}</div>
            <div style={S.mapSub}>Ascend the nodes. Boss waits at the peak.</div>
          </div>
          <button style={{ ...S.extractBtn }} onClick={extract} disabled={busy}>Extract ({runVein} ❖)</button>
        </div>

        <div style={S.mountain}>
          {[...map].reverse().map((row, ri) => {
            const realR = map.length - 1 - ri;
            return (
              <div key={realR} style={S.mapRow}>
                {row.map(n => {
                  const nt = NODE_TYPES[n.type];
                  const reach = nodeReachable(n);
                  const here = pos && pos.r === n.r && pos.c === n.c;
                  return (
                    <button key={n.id}
                      onClick={() => reach && visitNode(n)}
                      disabled={!reach || busy}
                      title={nt.label}
                      style={{
                        ...S.node,
                        borderColor: n.cleared ? "#2e4a52" : nt.color,
                        background: here ? "#173038" : n.cleared ? "#0e1a1e" : reach ? "#12232a" : "#0c1519",
                        color: n.cleared ? "#3d5a63" : nt.color,
                        boxShadow: reach ? `0 0 12px ${nt.color}55` : "none",
                        cursor: reach ? "pointer" : "default",
                        opacity: n.cleared ? 0.5 : (reach || here ? 1 : 0.55),
                        transform: here ? "scale(1.08)" : "scale(1)",
                      }}>
                      <span style={S.nodeGlyph}>{n.type === "boss" ? "☠" : nt.glyph}</span>
                      <span style={S.nodeLbl}>{nt.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div style={S.sidebar}>
        <div style={S.hpBox}>
          <div style={S.hpLbl}>Party Vitality</div>
          <div style={S.hpBar}>
            <div style={{ ...S.hpFill, width: `${Math.round(partyHP * 100)}%`,
                          background: partyHP > 0.5 ? "#7fd6a0" : partyHP > 0.25 ? "#e0a04d" : "#e05d6f" }} />
          </div>
          <div style={S.partyMini}>
            {party.map((m, i) => (
              <span key={i} style={{ ...S.miniChip, color: ARCHETYPES[m.archetype].color }}>{m.name}</span>
            ))}
          </div>
        </div>

        <div style={S.logBox} ref={logRef}>
          {log.map((l, i) => (
            <div key={i} style={{ ...S.logLine, color: LOG_COLOR[l.k] || "#9fb2bd" }}>{l.t}</div>
          ))}
        </div>

        <div style={S.legend}>
          {Object.entries(NODE_TYPES).map(([k, v]) => (
            <span key={k} style={S.legendItem}><span style={{ color: v.color }}>{v.glyph}</span> {v.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ n, t, sub, action }) {
  return (
    <div style={S.secTitle}>
      <div style={S.secLeft}>
        {n && <span style={S.secNum}>{n}</span>}
        <div>
          <div style={S.secText}>{t}</div>
          {sub && <div style={S.secSub}>{sub}</div>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ---------- STYLE ----------
const TIER_COLOR = { Common: "#9fb2bd", Fine: "#7fd6a0", Rare: "#6fb7d6", Epic: "#b58fe0", Legendary: "#e0a04d" };
const LOG_COLOR = { sys: "#5f8494", good: "#7fd6a0", bad: "#e05d6f", loot: "#e0a04d", heal: "#7fd6c0", boss: "#e05d6f", n: "#9fb2bd" };

const S = {
  root: { minHeight: "100vh", background: "radial-gradient(1200px 600px at 50% -10%, #123039 0%, #0a151a 45%, #060d11 100%)", color: "#cfe0e8", fontFamily: "'Inter', system-ui, sans-serif", padding: "16px", boxSizing: "border-box" },
  frame: { maxWidth: 1080, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 6px 18px", borderBottom: "1px solid #1a3038" },
  brand: { display: "flex", alignItems: "baseline", gap: 10 },
  brandMark: { color: "#5fc7e0", fontSize: 20, textShadow: "0 0 12px #5fc7e0aa" },
  brandName: { fontSize: 22, letterSpacing: "0.32em", fontWeight: 700, color: "#e6f2f7" },
  brandSub: { fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "#5f8494" },
  vein: { display: "flex", alignItems: "center", gap: 8, background: "#0e1e24", border: "1px solid #1c3a44", borderRadius: 8, padding: "8px 14px" },
  veinGlyph: { color: "#5fc7e0", fontSize: 16, textShadow: "0 0 10px #5fc7e0aa" },
  veinNum: { fontSize: 18, fontWeight: 700, color: "#e6f2f7", fontVariantNumeric: "tabular-nums" },
  veinLbl: { fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#5f8494" },

  flash: { textAlign: "center", padding: "10px", margin: "14px 0 0", border: "1px solid", borderRadius: 8, fontSize: 14, letterSpacing: "0.08em", background: "#0a171c", animation: "fadein 0.3s ease" },

  body: { display: "flex", gap: 24, padding: "22px 6px", flexWrap: "wrap" },
  colLeft: { flex: "1 1 340px", minWidth: 300 },
  colRight: { flex: "1 1 340px", minWidth: 300 },

  secTitle: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, marginTop: 6 },
  secLeft: { display: "flex", gap: 12, alignItems: "center" },
  secNum: { fontSize: 12, color: "#5fc7e0", border: "1px solid #1c3a44", borderRadius: 4, padding: "2px 7px", letterSpacing: "0.1em" },
  secText: { fontSize: 15, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "#cfe0e8" },
  secSub: { fontSize: 11, color: "#5f8494", letterSpacing: "0.06em", marginTop: 2 },

  partyRow: { display: "flex", gap: 10, marginBottom: 26, flexWrap: "wrap" },
  pcard: { flex: "1 1 90px", background: "#0d1c22", border: "1px solid #16303a", borderTop: "3px solid", borderRadius: 8, padding: "12px 10px", minWidth: 90 },
  pcardName: { fontSize: 14, fontWeight: 700, color: "#e6f2f7" },
  pcardRole: { fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 },
  pcardWeapon: { fontSize: 11, color: "#7f97a3", marginTop: 8 },
  pcardLvl: { fontSize: 10, color: "#5f8494", marginTop: 6, letterSpacing: "0.1em" },

  stash: { display: "flex", flexDirection: "column", gap: 6 },
  lootChip: { display: "flex", justifyContent: "space-between", background: "#0d1c22", border: "1px solid", borderLeftWidth: 3, borderRadius: 6, padding: "7px 11px", fontSize: 12 },
  rating: { color: "#5f8494", fontVariantNumeric: "tabular-nums" },
  empty: { color: "#456570", fontSize: 12, fontStyle: "italic", padding: "10px 0" },

  worldList: { display: "flex", flexDirection: "column", gap: 10 },
  worldCard: { textAlign: "left", background: "#0d1c22", border: "1px solid #16303a", borderLeft: "3px solid", borderRadius: 8, padding: "14px 16px", color: "#cfe0e8", transition: "transform 0.12s, background 0.12s" },
  worldClock: { fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#5f8494" },
  worldName: { fontSize: 17, fontWeight: 700, color: "#e6f2f7", margin: "3px 0 7px" },
  worldMeta: { display: "flex", gap: 10, alignItems: "center", fontSize: 11, color: "#7f97a3" },
  courtTag: { color: "#d67d4d", border: "1px solid #4a2f1e", borderRadius: 4, padding: "1px 6px", fontSize: 10, letterSpacing: "0.06em" },
  lockTag: { color: "#e05d6f", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" },

  ghostBtn: { background: "transparent", border: "1px solid #1c3a44", color: "#7fbfd0", borderRadius: 6, padding: "6px 14px", fontSize: 12, cursor: "pointer", letterSpacing: "0.08em" },

  editGrid: { display: "flex", gap: 16, flexWrap: "wrap" },
  editCard: { flex: "1 1 240px", background: "#0d1c22", border: "1px solid #16303a", borderTop: "3px solid", borderRadius: 8, padding: 16, minWidth: 220 },
  nameInput: { width: "100%", background: "#08141a", border: "1px solid #1c3a44", color: "#e6f2f7", borderRadius: 6, padding: "8px 10px", fontSize: 15, fontWeight: 700, marginBottom: 12, boxSizing: "border-box" },
  editLbl: { fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5f8494", display: "block", margin: "10px 0 5px" },
  select: { width: "100%", background: "#08141a", border: "1px solid #1c3a44", color: "#cfe0e8", borderRadius: 6, padding: "8px 10px", fontSize: 13, boxSizing: "border-box" },
  archBlurb: { fontSize: 11, color: "#6f8794", fontStyle: "italic", marginTop: 7 },
  statRow: { display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 11, color: "#7f97a3", fontVariantNumeric: "tabular-nums" },
  note: { marginTop: 20, fontSize: 12, color: "#5f8494", fontStyle: "italic", lineHeight: 1.6 },

  mapWrap: { display: "flex", gap: 20, padding: "18px 6px", flexWrap: "wrap" },
  mapMain: { flex: "1 1 420px", minWidth: 320 },
  mapHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  mapTitle: { fontSize: 20, fontWeight: 700, color: "#e6f2f7", letterSpacing: "0.04em" },
  mapSub: { fontSize: 12, color: "#5f8494", marginTop: 3 },
  extractBtn: { background: "#0e2830", border: "1px solid #1c4a54", color: "#5fc7e0", borderRadius: 8, padding: "10px 16px", fontSize: 13, cursor: "pointer", letterSpacing: "0.06em", fontWeight: 600 },

  mountain: { display: "flex", flexDirection: "column", gap: 20, padding: "10px 0" },
  mapRow: { display: "flex", justifyContent: "center", gap: 16 },
  node: { width: 88, height: 74, borderRadius: 10, border: "2px solid", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, transition: "all 0.15s", fontFamily: "inherit" },
  nodeGlyph: { fontSize: 22 },
  nodeLbl: { fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" },

  sidebar: { flex: "1 1 260px", minWidth: 240, display: "flex", flexDirection: "column", gap: 14 },
  hpBox: { background: "#0d1c22", border: "1px solid #16303a", borderRadius: 8, padding: 14 },
  hpLbl: { fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#5f8494", marginBottom: 8 },
  hpBar: { height: 10, background: "#08141a", borderRadius: 5, overflow: "hidden", border: "1px solid #16303a" },
  hpFill: { height: "100%", transition: "width 0.4s, background 0.4s" },
  partyMini: { display: "flex", gap: 10, marginTop: 10 },
  miniChip: { fontSize: 11, fontWeight: 600 },

  logBox: { background: "#08141a", border: "1px solid #16303a", borderRadius: 8, padding: 12, height: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 },
  logLine: { fontSize: 12, lineHeight: 1.5, fontFamily: "'SFMono-Regular', ui-monospace, monospace" },

  legend: { display: "flex", flexWrap: "wrap", gap: 12, fontSize: 10, color: "#6f8794", letterSpacing: "0.06em" },
  legendItem: { display: "flex", gap: 4, alignItems: "center" },
};

const CSS = `
  @keyframes fadein { from { opacity: 0; transform: translateY(-6px);} to {opacity:1; transform:none;} }
  * { box-sizing: border-box; }
  button:focus-visible { outline: 2px solid #5fc7e0; outline-offset: 2px; }
  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: #08141a; }
  ::-webkit-scrollbar-thumb { background: #1c3a44; border-radius: 4px; }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;
