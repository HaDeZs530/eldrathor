import { useSyncExternalStore } from 'react';
import { isTestNumbers, onTestNumbersChange } from './testNumbers.js';

/** React binding for the persisted "Show test numbers" setting (item-numbers brief §5). */
export function useTestNumbers() {
  return useSyncExternalStore(onTestNumbersChange, isTestNumbers, () => false);
}
