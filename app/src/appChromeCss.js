export const BASE_CSS = `
  @keyframes fadein { from { opacity: 0; transform: translateY(-6px);} to {opacity:1; transform:none;} }
  * { box-sizing: border-box; }
  button { font: inherit; }
  button:focus-visible { outline: 2px solid #5fc7e0; outline-offset: 2px; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1c3a44; border-radius: 4px; }
  .eld-seg {
    display: flex; gap: 4px; padding: 4px; margin-bottom: 12px;
    background: rgba(0,0,0,0.28); border: 1px solid var(--eld-border, #1c3a44); border-radius: 10px;
  }
  .eld-root.hub-rpg .eld-seg { border-radius: 0; border-width: 3px; }
  .eld-seg-btn {
    flex: 1; padding: 8px 6px; border: none; background: transparent; cursor: pointer;
    color: var(--eld-muted, #5f8494); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
    border-radius: 8px; font-family: var(--eld-font-display, inherit);
  }
  .eld-root.hub-rpg .eld-seg-btn { border-radius: 0; font-size: 7px; }
  .eld-seg-btn.is-active {
    color: var(--eld-tab-active, #5fc7e0); background: rgba(95,199,224,0.12);
    box-shadow: 0 0 12px rgba(95,199,224,0.15);
  }
  .eld-root.hub-rpg .eld-seg-btn.is-active {
    background: #e0a04d; color: #1a120a; box-shadow: 2px 2px 0 #1a120a;
  }
  .eld-progress {
    height: 10px; border-radius: 6px; background: rgba(0,0,0,0.35);
    border: 1px solid var(--eld-border, #1c3a44); overflow: hidden;
  }
  .eld-root.hub-rpg .eld-progress { border-radius: 0; border-width: 2px; }
  .eld-progress-fill { height: 100%; width: 0; transition: width 90ms linear; }
  .eld-afk-process .eld-card { box-shadow: 0 0 16px rgba(224,120,60,0.18); }
  @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
`;
