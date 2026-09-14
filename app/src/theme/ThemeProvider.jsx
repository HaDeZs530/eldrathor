import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createModeSwitcher } from './modeSwitch.js';
import { MODE, HUB_SKIN, TAB_HUB_SKIN } from './tokens.js';
import './world.css';
import './mind.css';
import './hub.css';

const ThemeContext = createContext(null);

/**
 * Dual-mode theme context + hub navigation skins.
 * WORLD / MIND = expedition dual-mode (Vein projection enter/leave).
 * Hub skins mind | mountain | rpg = tab chrome (§3b) with CSS crossfade.
 */
export function ThemeProvider({ children }) {
  const [currentMode, setCurrentMode] = useState(MODE.WORLD);
  const [hubSkin, setHubSkinState] = useState(HUB_SKIN.RPG);
  const [transitioning, setTransitioning] = useState(false);

  // Bug-fix pass 1 §5/§10: the crossfade timers are owned by one switcher (every request cancels the
  // previous, a token guards stale callbacks, unmount disposes) and no state is set inside an updater.
  // "Brief intentional pulse so the mode switch reads as reaching through the Vein" (120 ms → mode → 280 ms).
  const switcher = useRef(null);
  useEffect(() => {
    switcher.current = createModeSwitcher({ initial: MODE.WORLD, onMode: setCurrentMode, onTransitioning: setTransitioning });
    return () => { switcher.current?.dispose(); switcher.current = null; };
  }, []);
  const enterMindView = useCallback(() => { switcher.current?.go(MODE.MIND); }, []);
  const exitMindView = useCallback(() => { switcher.current?.go(MODE.WORLD); }, []);

  const setHubSkin = useCallback((skin) => {
    if (!skin || skin === hubSkin) return;
    setHubSkinState(skin);
  }, [hubSkin]);

  const setHubSkinForTab = useCallback((tabId) => {
    const skin = TAB_HUB_SKIN[tabId] || HUB_SKIN.RPG;
    setHubSkinState(skin);
  }, []);

  const value = useMemo(
    () => ({
      currentMode,
      enterMindView,
      exitMindView,
      transitioning,
      MODE,
      hubSkin,
      setHubSkin,
      setHubSkinForTab,
      HUB_SKIN,
      TAB_HUB_SKIN,
    }),
    [currentMode, enterMindView, exitMindView, transitioning, hubSkin, setHubSkin, setHubSkinForTab],
  );

  const modeClass = `mode-${currentMode.toLowerCase()}`;
  const hubClass = `hub-${hubSkin}`;
  const transitionClass = transitioning ? ' mode-transitioning' : '';

  return (
    <ThemeContext.Provider value={value}>
      <div
        className={`eld-root ${modeClass} ${hubClass}${transitionClass}`}
        data-mode={currentMode}
        data-hub-skin={hubSkin}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
