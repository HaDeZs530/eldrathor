/**
 * Screen help copy — docs/Eldrathor_UI_Shell_Lock.md ("Help copy — first pass").
 * Keyed by screen id. The Design Chat owns this copy; edit in place.
 */
export const HELP = {
  basics: {
    title: 'Game basics',
    bullets: [
      'You are a Veinbinder. You don’t fight — your bonded Adventurers do.',
      'Send three into an area, explore its route map, beat the boss at the far end. Rares are optional hunts with big loot.',
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
      'Every unexplored node looks the same. Tap one for Explore / Cancel — nothing moves until you Explore.',
      'On arrival the node reveals itself: Fight / Flee (a chosen Flee steps back for free). Completed nodes do nothing.',
      'Every explore or clear moves the clock: rares roam the unexplored, and one walking onto you is an ambush.',
      'The boss is never locked. Rares roam the unexplored — hunt them if you want the loot.',
      'Extract any time to bank what you have — the map is gone when you leave.',
    ],
  },
  scout: {
    title: 'Node card',
    bullets: ['Explore commits the party to travel there; Cancel moves nothing.', 'Once there: what’s on the node and how it measures against your party. Flee is free — the node stays revealed.'],
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
  hearth: {
    title: 'Hearth (AFK)',
    bullets: ['The bench works at the hearth while the party is away: Gather materials, Process them, or Train to level.', 'One job per Adventurer.'],
  },
  player: {
    title: 'Player',
    bullets: ['You — the Veinbinder. Your trees strengthen the whole bond (Bond) or your economy (Craft).'],
  },
};

export function helpFor(screenId) {
  return HELP[screenId] || HELP.basics;
}
