import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
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

  const enterMindView = useCallback(() => {
    setTransitioning(true);
    // Brief intentional pulse so the mode switch reads as "reaching through the Vein"
    window.setTimeout(() => {
      setCurrentMode(MODE.MIND);
      window.setTimeout(() => setTransitioning(false), 280);
    }, 120);
  }, []);

  const exitMindView = useCallback(() => {
    setTransitioning(true);
    window.setTimeout(() => {
      setCurrentMode(MODE.WORLD);
      window.setTimeout(() => setTransitioning(false), 280);
    }, 120);
  }, []);

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
