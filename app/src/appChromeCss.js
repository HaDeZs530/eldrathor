export const BASE_CSS = `
  @keyframes fadein { from { opacity: 0; transform: translateY(-6px);} to {opacity:1; transform:none;} }
  * { box-sizing: border-box; }
  button { font: inherit; }
  button:focus-visible { outline: 2px solid var(--eld-accent, #e8c46a); outline-offset: 2px; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--eld-border, #5a4a22); border-radius: 4px; }
  .eld-seg {
    display: flex; gap: 4px; padding: 4px; margin-bottom: 12px;
    background: rgba(0,0,0,0.28); border: 1px solid var(--eld-border, #5a4a22); border-radius: var(--eld-radius, 10px);
  }
  .eld-seg-btn {
    flex: 1; padding: 8px 6px; border: none; background: transparent; cursor: pointer;
    color: var(--eld-muted, #a89c88); font-size: var(--mv-label, 15px); letter-spacing: 0.04em;
    min-height: 44px;
    border-radius: 8px; font-family: var(--eld-font-display, inherit); font-weight: 700;
  }
  .eld-seg-btn.is-active {
    color: var(--eld-accent, #e8c46a); box-shadow: inset 0 0 0 1px var(--eld-accent, #e8c46a);
  }
  .eld-progress {
    height: var(--mv-bar, 14px); border-radius: 4px; background: rgba(0,0,0,0.45);
    border: 1px solid var(--eld-border, #5a4a22); overflow: hidden;
  }
  .eld-progress-fill { height: 100%; width: 0; transition: width 90ms linear; }
  .eld-afk-process .eld-card { box-shadow: 0 0 16px rgba(224,120,60,0.18); }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;
