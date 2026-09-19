import { useState } from 'react';
import Art from '../../art/Art.jsx';
import { FRAME } from '../../theme/styleBible.js';
import { useTheme } from '../../theme/ThemeProvider.jsx';
import './ui.css';

/**
 * Shared chrome — docs/Eldrathor_Style_Bible_Lock.md §A. Every screen composes these instead of
 * ad-hoc inline chrome: Frame (outer gold frame) + Header, Panel, PrimaryButton / SecondaryButton,
 * Bar (14 px HP/MP), DestinationRow (92 px, 120 px illustration), PartyCard (fight), Sheet.
 */

/** Outer frame: 2 px antique-gold border with the 1 px inner line, 10 px radius (ui.css). */
export function Frame({ children, className = '', style }) {
  return <div className={`eld-frame ${className}`.trim()} style={style}>{children}</div>;
}

/** 57 px header: wordmark ELDRATHOR (Cinzel 22), Worldvein counter (crystal + Cinzel numerals), ? and ☰ (32 px round). */
export function Header({ worldvein = 0, hubLabel, actions }) {
  return (
    <div className="eld-header" role="banner">
      <div className="eld-header-brand">
        <div className="eld-brand-name eld-wordmark">{FRAME.wordmark}</div>
        {hubLabel && <span className="eld-sr-only">{hubLabel}</span>}
      </div>
      <div className="eld-header-right">
        <div className="eld-vein-counter" title="Worldvein" aria-label={`${worldvein} Worldvein`}>
          <span className="eld-vein-glyph" aria-hidden="true">❖</span>
          <span>{Number(worldvein || 0).toLocaleString()}</span>
        </div>
        {actions}
      </div>
    </div>
  );
}

/** Mode-aware panel (colours from the .eld-root tokens). `card` = the slightly lighter card fill. */
export function Panel({ children, card = false, className = '', style, as: As = 'div', ...rest }) {
  return <As className={`${card ? 'eld-card' : 'eld-panel'} ${className}`.trim()} style={style} {...rest}>{children}</As>;
}

export function PrimaryButton({ children, className = '', ...rest }) {
  return <button type="button" className={`eld-btn eld-btn-primary ${className}`.trim()} {...rest}>{children}</button>;
}

export function SecondaryButton({ children, className = '', ...rest }) {
  return <button type="button" className={`eld-btn eld-btn-secondary eld-btn-ghost ${className}`.trim()} {...rest}>{children}</button>;
}

/** 14 px bar. `value` 0–1; `label` overlays right-aligned; `keyLabel` prints HP / MP to the left. */
export function Bar({ value, color, label, keyLabel, className = '', style }) {
  const pct = Math.max(0, Math.min(1, Number(value) || 0)) * 100;
  const bar = (
    <div className={`eld-bar ${className}`.trim()} style={style} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={keyLabel || label}>
      <div className="eld-bar-fill" style={{ width: `${pct}%`, background: color }} />
      {label && <div className="eld-bar-lbl">{label}</div>}
    </div>
  );
  if (!keyLabel) return bar;
  return <div className="eld-bar-row"><span className="eld-bar-key">{keyLabel}</span>{bar}</div>;
}

/** 92 px destination row: 120 px illustration, Cinzel 22 title, 13 px subtitle, chevron. */
export function DestinationRow({ art, title, subtitle, onClick, disabled = false, position }) {
  return (
    <button type="button" className="eld-dest-row" onClick={onClick} disabled={disabled}>
      <Art name={art} position={position} alt="" />
      <span className="eld-dest-text">
        <span className="eld-dest-title">{title}</span>
        {subtitle && <span className="eld-dest-sub">{subtitle}</span>}
      </span>
      <span className="eld-dest-chev" aria-hidden="true">›</span>
    </button>
  );
}

/**
 * Fight party card: portrait 64 px in a 1 px gold frame, name Cinzel 15, HP + MP 14 px bars, two 28 px
 * innate / aura icons. `icons` = [{ key, art, glyph, title, lit, dim }].
 */
export function PartyCard({ name, portraitArt, hp, hpMax, mp, mpMax, hpColor = '#20a95e', mpColor = '#2cabf8', icons = [], dead = false, className = '', accent, children }) {
  return (
    <div className={`eld-card eld-party-card${dead ? ' is-dead' : ''} ${className}`.trim()} style={accent ? { borderTopColor: accent } : undefined}>
      <div className="eld-party-card-name" title={name}>{name}</div>
      <Art name={portraitArt} className="eld-portrait" alt="" fallback={<span style={{ fontSize: 22, color: accent || '#dfe9f5' }}>{String(name || '?').slice(0, 1)}</span>} />
      <div className="eld-party-card-bars">
        <Bar keyLabel="HP" value={hpMax ? hp / hpMax : 0} color={hpColor} label={`${Math.round(hp)} / ${Math.round(hpMax)}`} />
        <Bar keyLabel="MP" value={mpMax ? mp / mpMax : 0} color={mpColor} label={`${Math.round(mp)} / ${Math.round(mpMax)}`} />
      </div>
      <div className="eld-party-card-icons">
        {icons.slice(0, 3).map((ic) => (
          <span key={ic.key} className={`eld-icon-28${ic.lit ? ' is-lit' : ''}${ic.dim ? ' is-dim' : ''}`} title={ic.title} role="img" aria-label={ic.title}>
            {ic.art ? <Art name={ic.art} alt="" fit="contain" fallback={<span>{ic.glyph}</span>} /> : ic.glyph}
          </span>
        ))}
      </div>
      {children}
    </div>
  );
}

/**
 * Bottom sheet: backdrop + panel + grip + title. Click outside or the parent's Close action dismisses.
 * Style Bible §D: the sheet takes the column of the screen it opens over (Veinharbor / Exploration /
 * Mind View), read from ThemeProvider at open time and FROZEN for its lifetime — it does not re-skin
 * if the theme transitions underneath. `column` can be forced for a card that lives on one screen.
 */
export function Sheet({ title, label, onClose, maxHeight, className = '', column, children }) {
  const theme = useTheme();
  const [frozen] = useState(() => column || theme.column);
  return (
    <div className={`eld-sheet-backdrop eld-mode-${frozen}`} data-mode-column={frozen} onClick={onClose} role="presentation">
      <div className={`eld-sheet eld-panel ${className}`.trim()} onClick={(e) => e.stopPropagation()} role="dialog" aria-label={label || title} style={maxHeight ? { maxHeight } : undefined}>
        <div className="eld-sheet-grip" />
        {title && <div className="eld-sheet-title">{title}</div>}
        {children}
      </div>
    </div>
  );
}
