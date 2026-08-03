// ============================================================================
// Icons
// ----------------------------------------------------------------------------
// Inline SVG icon set (stroke-based, inherits currentColor). Centralizing them
// keeps markup clean and ensures a consistent visual language across the app.
// Each function returns an SVG markup string.
// ============================================================================

const svg = (paths, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" ${extra}>${paths}</svg>`;

export const icons = {
  today: () => svg('<path d="M3 9h18M8 3v4M16 3v4"/><rect x="3" y="5" width="18" height="16" rx="2"/><circle cx="12" cy="14" r="2" fill="currentColor" stroke="none"/>'),
  documents: () => svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
  settings: () => svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.2.61.79 1 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  plus: () => svg('<path d="M12 5v14M5 12h14"/>'),
  check: () => svg('<path d="M20 6 9 17l-5-5"/>'),
  bell: () => svg('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
  clock: () => svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  sparkle: () => svg('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>', 'stroke-width="1.8"'),
  shield: () => svg('<path d="M12 3 5 6v5c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  upload: () => svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>'),
  scan: () => svg('<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M3 12h18"/>'),
  moon: () => svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
  file: () => svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'),
  id: () => svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2"/><path d="M15 10h3M15 14h3M6 16c.5-1.5 2-2 3-2s2.5.5 3 2"/>'),
  car: () => svg('<path d="M5 13l1.5-4.5A2 2 0 0 1 8.4 7h7.2a2 2 0 0 1 1.9 1.5L19 13"/><path d="M4 17h16v-4H4z"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>'),
  plane: () => svg('<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a.5.5 0 0 0-.5.8L8 11l-2 2-2-.5a.5.5 0 0 0-.5.8L6 16l1.7 2.5a.5.5 0 0 0 .8 0L11 16l4 4a.5.5 0 0 0 .8-.5z"/>'),
  heart: () => svg('<path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>'),
  trash: () => svg('<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'),
  chevron: () => svg('<path d="M9 18l6-6-6-6"/>'),
  x: () => svg('<path d="M18 6 6 18M6 6l12 12"/>'),
  lock: () => svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  download: () => svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>'),
  info: () => svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'),
  logo: () => svg('<path d="M12 3 4 7v6c0 5 3.5 7.5 8 8.5 4.5-1 8-3.5 8-8.5V7z"/><path d="M9 12l2 2 4-4"/>', 'stroke-width="1.6"'),
};
