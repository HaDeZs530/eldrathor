import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { MODE } from './tokens.js';
import './world.css';
import './mind.css';

const ThemeContext = createContext(null);

/**
 * Dual-mode theme context.
 * WORLD = Veinharbor / planning (micro-pixel).
 * MIND = Vein projection: expedition map, world map, combat.
 */
export function ThemeProvider({ children }) {
  const [currentMode, setCurrentMode] = useState(MODE.WORLD);
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

  const value = useMemo(
    () => ({ currentMode, enterMindView, exitMindView, transitioning, MODE }),
    [currentMode, enterMindView, exitMindView, transitioning],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div
        className={`eld-root mode-${currentMode.toLowerCase()}${transitioning ? ' mode-transitioning' : ''}`}
        data-mode={currentMode}
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
