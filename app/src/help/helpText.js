/**
 * Screen help copy — docs/Eldrathor_UI_Shell_Lock.md ("Help copy — first pass").
 * Keyed by screen id. The Design Chat owns this copy; edit in place.
 */
export const HELP = {
  basics: {
    title: 'Game basics',
    bullets: [
      'You are a Veinbinder. You don’t fight — your bonded Adventurers do.',
      'Send three into an area, explore its route map, hunt the rares, break the seal, beat the boss.',
      'Bring home Worldvein and weapons; spend them to come back stronger.',
      'Nothing you earn is ever lost.',
    ],
  },
  island: {
    title: 'Island map',
    bullets: [
      'The island. Each pin is an area with its own route map and boss.',
      'Beat an area’s boss to unlock the next pin — permanently.',
      'Tap a pin to rally your party.',
      '+ / − switches between close and overview.',
    ],
  },
  rally: {
    title: 'Rally',
    bullets: ['Read the area, pick your three, then Explore.', 'Tap an Adventurer to swap them from your roster.'],
  },
  route: {
    title: 'Route map',
    bullets: [
      'You see only what you’ve reached. Tap an unknown node to scout it, then Engage or Leave.',
      'Every scout or clear moves the clock: cleared nodes can repopulate, and rares roam.',
      'Kill all rares to break the boss seal.',
      'Extract any time to bank what you have — the map is gone when you leave.',
    ],
  },
  scout: {
    title: 'Scout card',
    bullets: ['What’s on this node and how it measures against your party.', 'Leave costs nothing but time.'],
  },
  fight: {
    title: 'Fight',
    bullets: ['Your bond fights for you. Innates fire on their own — watch the buttons.', '2× to hurry, Skip to jump to the result.'],
  },
  results: {
    title: 'Results',
    bullets: ['What each Adventurer did, what you earned, what dropped.', 'Weapon ratings run 1–100; higher is better and never changes.'],
  },
  sanctuary: {
    // DESIGN-OPEN: no lock copy for the sanctuary event yet — placeholder in the same voice.
    title: 'Sanctuary',
    bullets: ['A wild healing crystal. No fight: the party is healed, restored and revived.', 'Pick one bonus for the rest of this run. The crystal is spent when you leave.'],
  },
  party: {
    title: 'Party',
    bullets: ['Your roster. Three fight; the rest can train or gather.', 'Archetype is permanent; weapon and gem are swappable.'],
  },
  town: {
    title: 'Town',
    bullets: ['Veinharbor. Spend Worldvein: merge weapons at the Upgrade bench, craft armor from gathered materials, trade at the Market.'],
  },
  seam: {
    title: 'Seam (AFK)',
    bullets: ['Bench Adventurers work while you’re away: Gather materials, Process them, or Train to level.', 'One job per Adventurer.'],
  },
  player: {
    title: 'Player',
    bullets: ['You — the Veinbinder. Your trees strengthen the whole bond (Bond) or your economy (Craft).'],
  },
};

export function helpFor(screenId) {
  return HELP[screenId] || HELP.basics;
}
