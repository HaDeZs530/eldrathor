/**
 * TEMPORARY test kit (Anthony, 2026-09-19) — Settings → "Grant test gems". Not a game system: it exists
 * so the lattice and gems can be tried on the phone without farming rares. Remove before TestFlight.
 *
 * It puts a class gem on each party member that has none (one matching, one matching, one CROSSING so
 * both paths can be seen in a fight), adds one spare gem of every class to the bag, gives every granted
 * gem a full set of fragments to spend, and banks Worldvein for the imbues. Pure, so it is tested.
 */
import { makeGem } from '../progression/gems.js';
import { GEM_CLASSES, GEM_TUNING, ROLE_MATCH } from '../lattice/classGems.js';

export const TEST_KIT = { fragments: GEM_TUNING.points, worldvein: 20000 };

/** The gem class a party slot receives: the first two members get their matching class, the third a crossing one. */
export function testGemClassFor(member, slot) {
  const own = ROLE_MATCH[member?.archetype] || null;
  if (slot < 2 && own) return own;
  return own === 'Controller' ? 'Healer' : 'Controller'; // crossing — a stun is the easiest Core ability to see in the feed
}

/**
 * @returns {{ party, bag, worldvein, equipped: {name, gem}[], spares: string[] }}
 */
export function grantTestGems({ party = [], bag = [], worldvein = 0 }) {
  const fragments = { unspent: TEST_KIT.fragments, imbued: 0 };
  let nextBag = [...bag];
  const equipped = [];
  const nextParty = party.map((m, slot) => {
    if (m.equipped?.gem && nextBag.some((i) => i.id === m.equipped.gem)) return m; // already wears one — leave it alone
    const gem = makeGem({ gemClass: testGemClassFor(m, slot), fragments });
    nextBag = [...nextBag, gem];
    equipped.push({ name: m.name, gem: gem.name });
    return { ...m, equipped: { ...(m.equipped || {}), gem: gem.id } };
  });
  const spares = GEM_CLASSES.map((gemClass) => makeGem({ gemClass, fragments }));
  nextBag = [...nextBag, ...spares];
  return { party: nextParty, bag: nextBag, worldvein: worldvein + TEST_KIT.worldvein, equipped, spares: spares.map((g) => g.name) };
}
