def rd(p): return open(p, encoding='utf-8').read()
def wr(p, s): open(p, 'w', encoding='utf-8', newline='').write(s)
def rep(s, old, new):
    assert old in s, 'MISSING: '+old[:90]
    return s.replace(old, new, 1)

# ---------------- routeState.js ----------------
p='src/map/routeState.js'; s=rd(p)
s=rep(s, """export function isSealed(t) {
  return t.rares.some((r) => r.alive);
}""", """/**
 * Anthony 2026-09-14: the boss is NEVER sealed behind the rares. Rares are optional big-loot hunts;
 * killing some (or none) before the boss is the player's call. Kept as a function so the seal can be
 * reinstated by one line if the design ever swings back; every caller treats it as always false.
 */
export function isSealed() {
  return false;
}

/** Living rares left on the map (optional hunts). */
export function raresAlive(t) {
  return t.rares.filter((r) => r.alive).length;
}""")
s=rep(s, " *  - 'revealed':   explored, not completed (fled, sanctuary left unused, or the boss is sealed)",
         " *  - 'revealed':   explored, not completed (fled, or a sanctuary left unused)")
wr(p,s)

# ---------------- AppRoot.jsx ----------------
p='src/AppRoot.jsx'; s=rd(p)
s=rep(s, "import { rareAt, effectiveType, isSealed, allCleared,", "import { rareAt, effectiveType, raresAlive, allCleared,")
s=rep(s, "lies unexplored beyond the entry — ${t.rares.length} rares roam it and the boss is sealed.",
         "lies unexplored beyond the entry — ${t.rares.length} rares roam it (optional hunts, big loot) and ${a.boss} waits at the far end.")
s=rep(s, "  /** §15 reveal card: type, enemy count, threat band, yield — Fight / Flee (Sanctuary: Use / Leave; sealed boss: seal card). */",
         "  /** §15 reveal card: type, enemy count, threat band, yield — Fight / Flee (Sanctuary: Use / Leave). The boss is never sealed. */")
s=rep(s, "    const sealedBoss = n.type === 'boss' && isSealed(t);\n", "")
s=rep(s, "    if (enemies.length && !sealedBoss) {", "    if (enemies.length) {")
s=rep(s, """    if (sealedBoss) body = `The boss node is chained. ${t.rares.filter((r) => r.alive).length} rare${t.rares.filter((r) => r.alive).length === 1 ? '' : 's'} still roam — hunt them to break the seal.`;
    else if (eff === 'sanctuary')""", """    if (eff === 'sanctuary')""")
s=rep(s, """    else if (eff === 'boss') { body = `${area.boss} waits. The seal is broken.`; }""",
         """    else if (eff === 'boss') { const left = raresAlive(t); body = `${area.boss} waits.${left ? ` ${left} rare${left === 1 ? '' : 's'} still roam — optional.` : ''}`; }""")
s=rep(s, """    const alive = t.rares.filter((r) => r.alive).length;
    if (sealedBoss) {
      return { kind: 'seal', nodeId: n.id, onNode, type: 'boss', glyph: '⛓', title: `${area.boss} — sealed`, body: `Rares remaining: ${alive}. Hunt them to break the seal. The party steps back.`, yieldText: null, threat: null, enemies, actions: [{ id: 'stepBack', label: 'Fall back' }] };
    }
""", "")
# stepBack case stays harmless (no card issues it any more) — remove for cleanliness
a=s.index("      case 'stepBack': {")
b=s.index("      case 'fight': {")
s=s[:a]+s[b:]
s=rep(s, "    const sealJustBroke = f.rare && !isSealed(t) && isSealed(territory);\n", "    const lastRareDown = f.rare && raresAlive(t) === 0;\n")
s=rep(s, "    if (sealJustBroke) { pushLog('♛ The seal is broken.', 'boss'); doFlash('Seal broken', colors.mythros); } // §15: nothing on the map changes until the boss node is found",
         "    if (lastRareDown) { pushLog('☠ Every rare on this map is slain.', 'rare'); doFlash('All rares slain', colors.mythros); }")
assert 'isSealed' not in s and 'sealedBoss' not in s and "'seal'" not in s
wr(p,s)

# ---------------- RouteMapScreen.jsx ----------------
p='src/map/RouteMapScreen.jsx'; s=rd(p)
s=rep(s, "import { rareAt, isSealed, isWalkable, nodeState } from './routeState.js';", "import { rareAt, raresAlive, isWalkable, nodeState } from './routeState.js';")
s=rep(s, " * revealed (type icon; skull if a rare stands there; crown + chains for a sealed boss) and",
         " * revealed (type icon; skull if a rare stands there; crown for the boss — never sealed) and")
s=rep(s, "  const sealed = isSealed(territory);\n  const raresLeft = territory.rares.filter((r) => r.alive).length;",
         "  const raresLeft = raresAlive(territory);")
s=rep(s, """              const bossSealed = n.type === 'boss' && sealed;
              color = TYPE_COLOR[n.type] || TYPE_COLOR.normal;
              if (rare) { state = 'is-rare'; glyph = '☠'; label = 'Rare'; }
              else if (n.type === 'boss') { state = `is-boss ${bossSealed ? 'is-sealed' : 'is-unsealed'}`; glyph = '♛'; label = bossSealed ? 'Boss (sealed)' : 'Boss'; }""",
"""              color = TYPE_COLOR[n.type] || TYPE_COLOR.normal;
              if (rare) { state = 'is-rare'; glyph = '☠'; label = 'Rare'; }
              else if (n.type === 'boss') { state = 'is-boss is-unsealed'; glyph = '♛'; label = 'Boss'; }""")
s=rep(s, """                {state.startsWith('is-boss') && sealed && <span className="eld-pnode-chain" aria-hidden="true">⛓</span>}\n""", "")
s=rep(s, """            <span style={{ color: sealed ? '#b8a0e8' : '#7fd6a0' }}>{sealed ? `☠ ${raresLeft} rare${raresLeft === 1 ? '' : 's'} · ⛓ sealed` : '♛ seal broken'}</span>""",
         """            <span style={{ color: raresLeft ? '#e08a8a' : '#7fd6a0' }} title="rares are optional hunts — the boss is never locked">{raresLeft ? `☠ ${raresLeft} rare${raresLeft === 1 ? '' : 's'} roam` : '☠ no rares left'}</span>""")
assert 'sealed' not in s.replace('unsealed','')
wr(p,s)

# ---------------- CSS: chains gone, boss comment ----------------
p='src/map/parchment.css'; s=rd(p)
s=rep(s, "/* Boss — violet crown; grey chains while sealed, violet pulse once unsealed */", "/* Boss — violet crown with a violet pulse (never sealed: the boss is always fightable) */")
wr(p,s)

# ---------------- help ----------------
p='src/help/helpText.js'; s=rd(p)
s=rep(s, "'Send three into an area, explore its route map, hunt the rares, break the seal, beat the boss.',",
         "'Send three into an area, explore its route map, beat the boss at the far end. Rares are optional hunts with big loot.',")
s=rep(s, "      'Kill all rares to break the boss seal.',", "      'The boss is never locked. Rares roam the unexplored — hunt them if you want the loot.',")
wr(p,s)

# ---------------- generator comment + tests ----------------
p='src/map/genTerritory.js'; s=rd(p)
s=rep(s, " * Five node types incl. Sanctuary, 2–3 roaming rares, sealed boss, named variants at generation.",
         " * Five node types incl. Sanctuary, 2–3 roaming rares (optional hunts), the boss at the end of the road, named variants at generation.")
wr(p,s)
p='src/map/genTerritory.test.js'; s=rd(p)
s=rep(s, "import { tickClock, clearNode, isSealed, killRare, travelPath } from './routeState.js';",
         "import { tickClock, clearNode, isSealed, raresAlive, killRare, travelPath } from './routeState.js';")
s=rep(s, "test('types: boss sealed, 2–3 rares, 2–4 sanctuaries never adjacent to each other or the entrance', () => {",
         "test('types: boss never sealed, 2–3 rares, 2–4 sanctuaries never adjacent to each other or the entrance', () => {")
s=rep(s, "    assert.ok(isSealed(t));", "    assert.equal(isSealed(t), false); // Anthony 2026-09-14: rares never lock the boss")
s=rep(s, "  assert.ok(!isSealed(t) && t.sealBroken);", "  assert.equal(raresAlive(t), 0);")
wr(p,s)
print('p10 ok')
