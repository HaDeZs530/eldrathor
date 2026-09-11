import React from 'react';

// 5th tab = AFK (working label "Seam"). DESIGN-OPEN: final AFK tab display name.
const TABS = [
  { id: 'player', label: 'Player', icon: '◎', center: false },
  { id: 'party', label: 'Party', icon: '♟', center: false },
  { id: 'mountain', label: 'Mountain', icon: '⛰', center: true },
  { id: 'town', label: 'Town', icon: '⌂', center: false },
  { id: 'afk', label: 'Seam', icon: '∞', center: false },
];

/**
 * Persistent mobile bottom tab bar — LOCKED §3b + AFK/Town lock 2026-09-11.
 * Order: Player | Party | Mountain | Town | Seam(AFK).
 * Mountain is center + emphasized. Market lives under Town, not here.
 */
export default function TabBar({ activeTab, onSelect }) {
  return (
    <nav className="eld-tabbar" aria-label="Main">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`eld-tabbar-btn${tab.center ? ' is-center' : ''}${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            aria-label={tab.label}
            onClick={() => onSelect(tab.id)}
          >
            <span className="eld-tabbar-icon" aria-hidden="true">{tab.icon}</span>
            <span className="eld-tabbar-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export { TABS };
