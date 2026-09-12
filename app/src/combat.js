/**
 * Combat v2 entry point — re-exports (docs/Eldrathor_Combat_v2_Lock.md).
 * The prototype's resolveFight / rollLoot are gone; use simulateFight + rollRewards.
 */
export { simulateFight, mulberry32, partyAuras, INNATES, lastEventTime } from './combat/simulate.js';
export { deriveStats, deriveDisplay } from './combat/derive.js';
export { spawnEnemies } from './combat/enemies.js';
export { rollRewards, LOOT_TIERS } from './combat/rewards.js';
