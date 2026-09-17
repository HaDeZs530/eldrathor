
/**
 * Eternal Hero–style gear/item boxes around a central class icon / silhouette.
 * Dressable character art later — silhouette placeholder for now.
 * Slots match design stack: weapon, armor pieces, gem sockets (placeholders).
 */
export default function GearPaperdoll({
  accent = 'var(--eld-accent)',
  classGlyph = '♟',
  classLabel = 'Class',
  weaponLabel = 'Weapon',
  compact = false,
}) {
  // DESIGN-OPEN: real equip state, drag/drop, gem socket rules (§ gear stack).
  // Acquisition path (AFK materials→craft) DESIGN-OPEN — do not lock until Boss review.
  const left = [
    { id: 'helm', label: 'Helm', glyph: '⬡' },
    { id: 'chest', label: 'Chest', glyph: '▣' },
    { id: 'gloves', label: 'Gloves', glyph: '▥' },
    { id: 'boots', label: 'Boots', glyph: '▤' },
  ];
  const right = [
    { id: 'weapon', label: 'Weapon', glyph: '⚔', filled: weaponLabel },
    { id: 'gem1', label: 'Gem', glyph: '◆', sub: 'Class' },
    { id: 'gem2', label: 'Gem', glyph: '◇', sub: 'Armor' },
    { id: 'gem3', label: 'Gem', glyph: '◇', sub: 'Armor' },
  ];

  // v3 §4 scale: slots wide enough for 15 px labels beside a 100 px silhouette on a 390 px phone
  const size = compact ? 64 : 80;
  const center = compact ? 84 : 100;

  return (
    <div className="eld-panel" style={{ ...S.wrap, minHeight: compact ? 200 : 240 }}>
      <div style={S.caption}>Equipment</div>
      <div style={S.grid}>
        <div style={S.col}>
          {left.map((s) => (
            <Slot key={s.id} slot={s} size={size} accent={accent} />
          ))}
        </div>

        <div style={{ ...S.center, width: center, height: center * 1.35 }}>
          <div
            style={{
              ...S.silhouette,
              width: center,
              height: center * 1.35,
              borderColor: accent,
              boxShadow: `0 0 22px ${accent}44`,
            }}
            aria-label={`${classLabel} silhouette`}
          >
            <div style={{ ...S.glyph, color: accent, fontSize: compact ? 36 : 44 }}>{classGlyph}</div>
            <div style={S.classLbl}>{classLabel}</div>
            <div style={S.dressHint}>Art later</div>
          </div>
        </div>

        <div style={S.col}>
          {right.map((s) => (
            <Slot key={s.id} slot={s} size={size} accent={accent} />
          ))}
        </div>
      </div>
      <div style={S.foot}>
        Slots placeholder · acquisition via AFK materials→craft DESIGN-OPEN (not locked)
      </div>
    </div>
  );
}

function Slot({ slot, size, accent }) {
  const filled = !!slot.filled;
  return (
    <button
      type="button"
      title={slot.label}
      style={{
        ...S.slot,
        width: size,
        height: Math.round(size * 0.72),
        borderColor: filled ? accent : 'var(--eld-border)',
        boxShadow: filled ? `0 0 10px ${accent}55` : 'none',
      }}
    >
      <span style={{ ...S.slotGlyph, color: filled ? accent : 'var(--eld-muted)' }}>
        {slot.glyph}
      </span>
      <span style={S.slotLbl}>{slot.filled || slot.sub || slot.label}</span>
    </button>
  );
}

const S = {
  wrap: { padding: '10px 10px 8px', marginBottom: 12 },
  caption: {
    fontSize: 'var(--mv-label, 15px)',
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    marginBottom: 8,
    textAlign: 'center',
  },
  grid: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  col: { display: 'flex', flexDirection: 'column', gap: 6 },
  center: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  silhouette: {
    borderRadius: 14,
    border: '2px solid',
    background:
      'radial-gradient(circle at 50% 28%, rgba(95,199,224,0.18), transparent 55%), linear-gradient(180deg, #0e1c22 0%, #081218 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  glyph: { lineHeight: 1, textShadow: '0 0 18px currentColor' },
  classLbl: {
    fontSize: 'var(--mv-label, 15px)',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--eld-text)',
    fontFamily: 'var(--eld-font-display)',
  },
  dressHint: { fontSize: 'var(--mv-label, 15px)', color: 'var(--eld-muted)', fontStyle: 'italic' },
  slot: {
    borderRadius: 8,
    border: '1px solid',
    background: 'rgba(0,0,0,0.35)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: 0,
    cursor: 'default',
    color: 'inherit',
    fontFamily: 'inherit',
  },
  slotGlyph: { fontSize: 'var(--mv-text, 18px)', lineHeight: 1 },
  slotLbl: {
    fontSize: 'var(--mv-label, 15px)',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    color: 'var(--eld-muted)',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    padding: '0 2px',
  },
  foot: {
    marginTop: 8,
    fontSize: 'var(--mv-label, 15px)',
    color: 'var(--eld-muted)',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 1.35,
  },
};
