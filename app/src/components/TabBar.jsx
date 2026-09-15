import Art from '../art/Art.jsx';

// 5th tab = AFK — the Hearth (Progression Loop Lock §9, 2026-09-14).
const TABS = [
  { id: 'player', label: 'Player', icon: '◎', art: 'icon-tab-player', center: false },
  { id: 'party', label: 'Party', icon: '♟', art: 'icon-tab-party', center: false },
  { id: 'mountain', label: 'Mountain', icon: '⛰', art: 'icon-tab-mountain', center: true },
  { id: 'town', label: 'Town', icon: '⌂', art: 'icon-tab-town', center: false },
  { id: 'afk', label: 'Hearth', icon: '∞', art: 'icon-tab-hearth', center: false },
];

/**
 * Persistent mobile bottom tab bar — LOCKED §3b + AFK/Town lock 2026-09-11; Style Bible §A chrome (76 px,
 * #0f151d, 28 px `icon-tab-*` art with glyph fallback, 12 px Cinzel labels, active gold + top hairline).
 * Order: Player | Party | Mountain | Town | Hearth (AFK).
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
            <span className="eld-tabbar-icon" aria-hidden="true"><Art name={tab.art} alt="" fit="contain" fallback={<span>{tab.icon}</span>} /></span>
            <span className="eld-tabbar-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export { TABS };
