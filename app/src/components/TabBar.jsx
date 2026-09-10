import React from 'react';

const TABS = [
  { id: 'player', label: 'Player', icon: '◎', center: false },
  { id: 'party', label: 'Party', icon: '♟', center: false },
  { id: 'mountain', label: 'Mountain', icon: '⛰', center: true },
  { id: 'town', label: 'Town', icon: '⌂', center: false },
  { id: 'market', label: 'Market', icon: '⚖', center: false },
];

/**
 * Persistent mobile bottom tab bar — LOCKED §3b.
 * Mountain is center + emphasized. Safe-area padding via CSS.
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
